import {
  useState, useRef, useCallback, useEffect,
} from 'react';
import { Modal, Button, Space, Tag, Typography, Card, Slider, Divider, Select } from 'antd';
import {
  AudioOutlined,
  StopOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SoundOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { useTtsSettingsStore } from '../../../store/ttsSettingsStore';
import { synthesizeSpeech } from '../../../api/ttsApi';

const { Text } = Typography;

/* ---------- mic test helpers (same as MicTestModal) ---------- */

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

/* ---------- component ---------- */

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DeviceSettingsPanel({ open, onClose }: Props) {
  /* ---- mic test state ---- */
  const [micStep, setMicStep] = useState<'idle' | 'recording' | 'uploading' | 'done'>('idle');
  const [countdown, setCountdown] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [micAudioUrl, setMicAudioUrl] = useState<string | null>(null);
  const [micPlaying, setMicPlaying] = useState(false);
  const [micError, setMicError] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const pcmRef = useRef<Float32Array[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const webmRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  /* ---- TTS state ---- */
  const tts = useTtsSettingsStore();
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load voices on mount
  useEffect(() => { tts.loadVoices(); }, []);

  // Sync params to window.__TTS_PARAMS__ so ttsApi.ts reads them
  useEffect(() => {
    (window as any).__TTS_PARAMS__ = {
      speed: tts.speed, pitch: tts.pitch, vol: tts.vol, voice: tts.voice,
    };
  }, [tts.speed, tts.pitch, tts.vol, tts.voice]);

  /* ---- mic test handlers (same logic as MicTestModal) ---- */

  const cleanupMic = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close();
    ctxRef.current = null;
    pcmRef.current = [];
  }, []);

  const resetMic = useCallback(() => {
    setTranscript(''); setCountdown(0); setMicError('');
    if (micAudioUrl) { URL.revokeObjectURL(micAudioUrl); setMicAudioUrl(null); }
    setMicPlaying(false); setMicStep('idle');
  }, [micAudioUrl]);

  const startMic = useCallback(async () => {
    setTranscript(''); setMicAudioUrl(null); setMicError('');
    webmRef.current = []; pcmRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size > 0) webmRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(webmRef.current, { type: 'audio/webm' });
        if (micAudioUrl) URL.revokeObjectURL(micAudioUrl);
        setMicAudioUrl(URL.createObjectURL(blob));
      };
      rec.start(500);
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      src.connect(proc);
      proc.connect(ctx.destination);
      proc.onaudioprocess = (e) => { pcmRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
      setMicStep('recording');
      let r = MAX_SECONDS; setCountdown(r);
      timerRef.current = window.setInterval(() => { r--; setCountdown(r); if (r <= 0) stopMic(); }, 1000);
    } catch { setMicError('无法访问麦克风，请检查浏览器权限'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micAudioUrl]);

  const stopMic = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setMicStep('uploading');
    setTimeout(async () => {
      try {
        let all = concatFloat32(pcmRef.current);
        const actualRate = ctxRef.current?.sampleRate || TARGET_SAMPLE_RATE;
        if (actualRate !== TARGET_SAMPLE_RATE) all = resample(all, actualRate, TARGET_SAMPLE_RATE);
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
      } catch (e: any) { setMicError(e.message || '识别失败'); }
      cleanupMic(); setMicStep('done');
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playMic = useCallback(() => {
    if (!micAudioUrl) return;
    const a = new Audio(micAudioUrl);
    a.onended = () => setMicPlaying(false);
    a.play().catch(() => {});
    setMicPlaying(true);
  }, [micAudioUrl]);

  /* ---- TTS preview ---- */

  const previewTts = useCallback(async (type: 'guidance' | 'question') => {
    if (ttsPlaying) return;
    setTtsPlaying(true);
    tts.setPlaying(type);
    try {
      const text = tts.getSampleText(type);
      const buf = await synthesizeSpeech(text);
      const blob = new Blob([buf], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      if (ttsAudioRef.current) { ttsAudioRef.current.pause(); URL.revokeObjectURL(ttsAudioRef.current.src); }
      ttsAudioRef.current = new Audio(url);
      ttsAudioRef.current.onended = () => { setTtsPlaying(false); tts.setPlaying(null); };
      ttsAudioRef.current.play().catch(() => { setTtsPlaying(false); tts.setPlaying(null); });
    } catch {
      setTtsPlaying(false);
      tts.setPlaying(null);
    }
  }, [ttsPlaying, tts]);

  const stopTts = useCallback(() => {
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current.currentTime = 0; }
    setTtsPlaying(false);
    tts.setPlaying(null);
  }, [tts]);

  // Cleanup on close
  const handleClose = () => {
    if (ttsAudioRef.current) { ttsAudioRef.current.pause(); }
    setTtsPlaying(false);
    tts.setPlaying(null);
    resetMic();
    onClose();
  };

  return (
    <Modal
      title="设备设置"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={520}
      destroyOnClose
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>

        {/* ====== TTS Voice Settings ====== */}
        <Card size="small" title={<><SoundOutlined /> 语音设置</>}>
          {/* Voice selector */}
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>音色</Text>
            <Select
              value={tts.voice}
              onChange={(v) => tts.setVoice(v)}
              style={{ width: '100%' }}
              loading={tts.voicesLoading}
              options={tts.voices.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.gender === 'male' ? '男' : '女'}·${v.style})`,
              }))}
            />
          </div>

          {/* Sample buttons */}
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>试听语音效果</Text>
            <Space>
              <Button
                icon={ttsPlaying && tts.playing === 'guidance' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => ttsPlaying && tts.playing === 'guidance' ? stopTts() : previewTts('guidance')}
                loading={ttsPlaying && tts.playing === 'guidance'}
              >
                试听引导语
              </Button>
              <Button
                icon={ttsPlaying && tts.playing === 'question' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => ttsPlaying && tts.playing === 'question' ? stopTts() : previewTts('question')}
                loading={ttsPlaying && tts.playing === 'question'}
              >
                试听题目
              </Button>
            </Space>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* Speed slider */}
          <div style={{ marginBottom: 12 }}>
            <Text>语速 <Text type="secondary">{tts.speed.toFixed(1)}x</Text></Text>
            <Slider
              min={0.5} max={2.0} step={0.1}
              value={tts.speed}
              onChange={(v) => tts.setSpeed(v)}
              marks={{ 0.5: '0.5x', 1.0: '1.0x', 1.5: '1.5x', 2.0: '2.0x' }}
            />
          </div>

          {/* Pitch slider */}
          <div style={{ marginBottom: 12 }}>
            <Text>音调 <Text type="secondary">{tts.pitch > 0 ? `+${tts.pitch}` : tts.pitch}</Text></Text>
            <Slider
              min={-12} max={12} step={1}
              value={tts.pitch}
              onChange={(v) => tts.setPitch(v)}
              marks={{ '-12': '-12', 0: '0', 12: '+12' }}
            />
          </div>

          {/* Volume slider */}
          <div>
            <Text>音量 <Text type="secondary">{tts.vol}%</Text></Text>
            <Slider
              min={10} max={100} step={5}
              value={tts.vol}
              onChange={(v) => tts.setVol(v)}
              marks={{ 10: '10%', 30: '30%', 50: '50%', 80: '80%', 100: '100%' }}
            />
          </div>
        </Card>

        {/* ====== Mic Test ====== */}
        <Card size="small" title={<><AudioOutlined /> 麦克风测试</>}>
          {micError && (
            <Card size="small" style={{ background: '#fff1f0', marginBottom: 12 }}>
              <Text type="danger">{micError}</Text>
            </Card>
          )}

          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            {micStep === 'recording' && (
              <Tag color="error" style={{ fontSize: 16, padding: '4px 16px' }}>录音中 {countdown}s</Tag>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Space>
              {micStep === 'idle' || micStep === 'done' ? (
                <Button type="primary" size="middle" icon={<AudioOutlined />} onClick={startMic}>开始录音</Button>
              ) : micStep === 'recording' ? (
                <Button danger size="middle" icon={<StopOutlined />} onClick={stopMic}>停止 ({countdown}s)</Button>
              ) : null}
              {micAudioUrl && micStep === 'done' && (
                <>
                  <Button icon={<PlayCircleOutlined />} onClick={playMic} disabled={micPlaying}>
                    {micPlaying ? '播放中' : '回听'}
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={resetMic}>重录</Button>
                </>
              )}
            </Space>
          </div>

          <div style={{ background: '#fafafa', borderRadius: 8, padding: 12, minHeight: 48, marginTop: 12 }}>
            {transcript ? (
              <Text style={{ fontSize: 14 }}>{transcript}</Text>
            ) : (
              <Text type="secondary">
                {micStep === 'recording' ? '请说话...' :
                 micStep === 'uploading' ? '识别中...' :
                 '点击开始录音，对着麦克风说话'}
              </Text>
            )}
          </div>
        </Card>

      </Space>
    </Modal>
  );
}
