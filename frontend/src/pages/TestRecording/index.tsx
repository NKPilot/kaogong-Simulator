import { useRef, useState, useCallback } from 'react';
import { Button, Typography, Space, Card, Tag, Spin } from 'antd';
import {
  AudioOutlined,
  StopOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

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

  function writeStr(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeStr(0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }
  return buffer;
}

function resample(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return samples;
  const ratio = fromRate / toRate;
  const newLength = Math.floor(samples.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcFloor = Math.floor(srcIndex);
    const frac = srcIndex - srcFloor;
    const a = samples[srcFloor] ?? 0;
    const b = samples[srcFloor + 1] ?? a;
    result[i] = a + (b - a) * frac;
  }
  return result;
}

export default function TestRecordingPage() {
  const [state, setState] = useState<'idle' | 'recording' | 'uploading' | 'done'>('idle');
  const [countdown, setCountdown] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webmChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }
    audioContextRef.current = null;
    chunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    setTranscript('');
    setAudioUrl(null);
    setError('');
    webmChunksRef.current = [];
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // WebM recorder for playback
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) webmChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(webmChunksRef.current, { type: 'audio/webm' });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
      };
      recorder.start(500);

      // PCM capture for WAV/ASR
      const audioCtx = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        chunksRef.current.push(new Float32Array(input));
      };

      setState('recording');

      let remaining = MAX_SECONDS;
      setCountdown(remaining);
      timerRef.current = window.setInterval(() => {
        remaining--;
        setCountdown(remaining);
        if (remaining <= 0) stopRecording();
      }, 1000);
    } catch {
      setError('无法访问麦克风，请检查浏览器权限设置');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setState('uploading');

    // Build WAV from captured PCM
    setTimeout(async () => {
      try {
        const allSamples = concatenateFloat32(chunksRef.current);
        const wavBuffer = encodeWav(allSamples, TARGET_SAMPLE_RATE);

        const formData = new FormData();
        formData.append('audio', new Blob([wavBuffer], { type: 'audio/wav' }), 'recording.wav');

        const resp = await fetch(`${API_BASE}/api/asr/recognize`, {
          method: 'POST',
          body: formData,
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({ detail: resp.statusText }));
          throw new Error(errData.detail || `HTTP ${resp.status}`);
        }

        const data = await resp.json();
        setTranscript(data.text || '(未识别到语音)');
      } catch (e: any) {
        setError(e.message || '识别请求失败');
      }

      cleanup();
      setState('done');
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playAudio = useCallback(() => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setPlaying(false);
      audioRef.current.onerror = () => setPlaying(false);
    }
    audioRef.current.play().catch(() => {});
    setPlaying(true);
  }, [audioUrl]);

  const reset = useCallback(() => {
    setTranscript('');
    setCountdown(0);
    setError('');
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    setPlaying(false);
    setState('idle');
  }, [audioUrl]);

  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 20px' }}>
      <Title level={3} style={{ textAlign: 'center' }}>
        麦克风试录 + 语音识别
      </Title>

      {error && (
        <Card size="small" style={{ marginBottom: 16, background: '#fff1f0' }}>
          <Text type="danger">{error}</Text>
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
          {state === 'recording' && (
            <Tag color="error" style={{ fontSize: 16, padding: '4px 16px' }}>
              录音中 {countdown}s
            </Tag>
          )}
          {state === 'uploading' && (
            <Spin tip="识别中..." />
          )}

          <Space size="middle">
            {state === 'idle' || state === 'done' ? (
              <Button
                type="primary"
                size="large"
                icon={<AudioOutlined />}
                onClick={startRecording}
                style={{ height: 48, width: 140 }}
              >
                开始录音
              </Button>
            ) : state === 'recording' ? (
              <Button
                danger
                size="large"
                icon={<StopOutlined />}
                onClick={stopRecording}
                style={{ height: 48, width: 140 }}
              >
                停止 ({countdown}s)
              </Button>
            ) : null}

            {audioUrl && state === 'done' && (
              <>
                <Button
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={playAudio}
                  disabled={playing}
                  style={{ height: 48, width: 100 }}
                >
                  {playing ? '播放中' : '回听'}
                </Button>
                <Button
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={reset}
                  style={{ height: 48 }}
                >
                  重录
                </Button>
              </>
            )}
          </Space>

          <Text type="secondary">
            {state === 'idle' && '点击按钮开始 10 秒试录'}
            {state === 'recording' && '请对着麦克风说话...'}
            {state === 'uploading' && '正在上传并识别语音...'}
            {state === 'done' && '识别完成'}
          </Text>
        </Space>
      </Card>

      <Card title="识别结果">
        <div style={{
          minHeight: 80,
          background: '#fafafa',
          borderRadius: 8,
          padding: 16,
          fontSize: 16,
          lineHeight: 1.8,
        }}>
          {transcript ? (
            <Text>{transcript}</Text>
          ) : (
            <Text type="secondary">
              {state === 'recording' ? '等待语音输入...' :
               state === 'uploading' ? '识别中...' :
               '录音后此处将显示识别文字'}
            </Text>
          )}
        </div>
      </Card>
    </div>
  );
}

function concatenateFloat32(arrays: Float32Array[]): Float32Array {
  let totalLen = 0;
  for (const a of arrays) totalLen += a.length;
  const result = new Float32Array(totalLen);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}
