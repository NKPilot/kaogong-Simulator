import { useRef, useState, useCallback } from 'react';
import { Modal, Button, Space, Tag, Spin, Typography, Card } from 'antd';
import {
  AudioOutlined,
  StopOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SoundOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const MAX_SECONDS = 10;
const TARGET_SAMPLE_RATE = 16000;
const API_BASE = 'http://localhost:8000';

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const bufferSize = 44 + dataSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  const ws = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };

  ws(0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  ws(8, 'WAVE');
  ws(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  ws(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return buffer;
}

function resample(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return samples;
  const ratio = fromRate / toRate;
  const newLen = Math.floor(samples.length / ratio);
  const result = new Float32Array(newLen);
  for (let i = 0; i < newLen; i++) {
    const src = i * ratio;
    const lo = Math.floor(src);
    const frac = src - lo;
    const a = samples[lo] ?? 0;
    const b = samples[lo + 1] ?? a;
    result[i] = a + (b - a) * frac;
  }
  return result;
}

function concatFloat32(arrays: Float32Array[]): Float32Array {
  let len = 0;
  for (const a of arrays) len += a.length;
  const r = new Float32Array(len);
  let off = 0;
  for (const a of arrays) {
    r.set(a, off);
    off += a.length;
  }
  return r;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MicTestModal({ open, onClose }: Props) {
  const [step, setStep] = useState<'idle' | 'recording' | 'uploading' | 'done'>('idle');
  const [countdown, setCountdown] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const webmRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close();
    ctxRef.current = null;
    chunksRef.current = [];
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setCountdown(0);
    setError('');
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    setPlaying(false);
    setStep('idle');
  }, [audioUrl]);

  const start = useCallback(async () => {
    setTranscript('');
    setAudioUrl(null);
    setError('');
    webmRef.current = [];
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // WebM for playback
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size > 0) webmRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(webmRef.current, { type: 'audio/webm' });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
      };
      rec.start(500);

      // PCM for ASR — use browser's native rate, resample later
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const actualRate = ctx.sampleRate;
      const src = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      src.connect(proc);
      proc.connect(ctx.destination);
      let needsResample = actualRate !== TARGET_SAMPLE_RATE;
      proc.onaudioprocess = (e) => {
        chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };

      setStep('recording');
      let r = MAX_SECONDS;
      setCountdown(r);
      timerRef.current = window.setInterval(() => {
        r--;
        setCountdown(r);
        if (r <= 0) stop();
      }, 1000);
    } catch {
      setError('无法访问麦克风，请检查浏览器权限');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setStep('uploading');

    setTimeout(async () => {
      try {
        let all = concatFloat32(chunksRef.current);
        const actualRate = ctxRef.current?.sampleRate || TARGET_SAMPLE_RATE;
        if (actualRate !== TARGET_SAMPLE_RATE) {
          all = resample(all, actualRate, TARGET_SAMPLE_RATE);
        }
        const wavBuf = encodeWav(all, TARGET_SAMPLE_RATE);
        const fd = new FormData();
        fd.append('audio', new Blob([wavBuf], { type: 'audio/wav' }), 'rec.wav');

        const resp = await fetch(`${API_BASE}/api/asr/recognize`, { method: 'POST', body: fd });
        if (!resp.ok) {
          const d = await resp.json().catch(() => ({ detail: resp.statusText }));
          throw new Error(d.detail || `HTTP ${resp.status}`);
        }
        const d = await resp.json();
        setTranscript(d.text || '(未识别到语音内容)');
      } catch (e: any) {
        setError(e.message || '识别失败');
      }
      cleanup();
      setStep('done');
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback(() => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    audioRef.current.play().catch(() => {});
    setPlaying(true);
  }, [audioUrl]);

  return (
    <Modal
      title="麦克风测试"
      open={open}
      onCancel={() => { reset(); onClose(); }}
      footer={null}
      width={480}
      destroyOnClose
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {error && (
          <Card size="small" style={{ background: '#fff1f0' }}>
            <Text type="danger">{error}</Text>
          </Card>
        )}

        <div style={{ textAlign: 'center' }}>
          {step === 'recording' && (
            <Tag color="error" style={{ fontSize: 16, padding: '4px 16px' }}>
              录音中 {countdown}s
            </Tag>
          )}
          {step === 'uploading' && <Spin tip="识别中..." />}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Space>
            {step === 'idle' || step === 'done' ? (
              <Button type="primary" size="large" icon={<AudioOutlined />} onClick={start}>
                开始录音
              </Button>
            ) : step === 'recording' ? (
              <Button danger size="large" icon={<StopOutlined />} onClick={stop}>
                停止 ({countdown}s)
              </Button>
            ) : null}
            {audioUrl && step === 'done' && (
              <>
                <Button icon={<PlayCircleOutlined />} onClick={play} disabled={playing}>
                  {playing ? '播放中' : '回听'}
                </Button>
                <Button icon={<ReloadOutlined />} onClick={reset}>重录</Button>
              </>
            )}
          </Space>
        </div>

        <div style={{ background: '#fafafa', borderRadius: 8, padding: 16, minHeight: 60 }}>
          {transcript ? (
            <Text style={{ fontSize: 16 }}>{transcript}</Text>
          ) : (
            <Text type="secondary">
              {step === 'recording' ? '请说话...' :
               step === 'uploading' ? '识别中...' :
               '点击开始录音，对着麦克风说话'}
            </Text>
          )}
        </div>
      </Space>
    </Modal>
  );
}
