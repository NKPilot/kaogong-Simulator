const API_BASE_URL = 'http://localhost:8000';
const TTS_TIMEOUT_MS = 30_000;

export type TTSProvider = 'dashscope' | 'minimax';

export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  style: string;
  description: string;
}

/** Switch this to change the TTS provider globally */
export const TTS_PROVIDER: TTSProvider = 'dashscope';

/** Fetch available voices from backend */
export async function fetchVoices(): Promise<VoiceOption[]> {
  const resp = await fetch(`${API_BASE_URL}/api/tts/voices`);
  if (!resp.ok) throw new Error(`Failed to fetch voices: ${resp.status}`);
  const data = await resp.json();
  return data.voices;
}

interface TtsParams {
  speed: number;   // 0.5 - 2.0
  pitch: number;   // -12 - +12
  vol: number;     // 10 - 100
  voice: string;   // voice ID
}

function getTtsParams(): TtsParams {
  const defaults: TtsParams = { speed: 1.0, pitch: 0, vol: 50, voice: 'longxiaocheng_v2' };
  try {
    const stored = (window as any).__TTS_PARAMS__;
    if (stored) return { ...defaults, ...stored };
  } catch { /* noop */ }
  return defaults;
}

const PROVIDER_CONFIG: Record<TTSProvider, { endpoint: string; body: (text: string) => unknown }> = {
  dashscope: {
    endpoint: `${API_BASE_URL}/api/tts/synthesize`,
    body: (text) => {
      const p = getTtsParams();
      // DashScope: pitch_rate is 0.5-2.0, map from -12..+12
      const pitch_rate = 1.0 + p.pitch / 24;
      return {
        text,
        voice: p.voice,
        speech_rate: p.speed,
        pitch_rate: Math.round(pitch_rate * 100) / 100,
        vol: p.vol,
      };
    },
  },
  minimax: {
    endpoint: `${API_BASE_URL}/api/tts/minimax`,
    body: (text) => {
      const p = getTtsParams();
      return {
        text,
        voice: 'Chinese (Mandarin)_Male_Announcer',
        model: 'speech-2.8-hd',
        speed: p.speed,
        vol: p.vol / 100,
        pitch: p.pitch,
      };
    },
  },
};

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const config = PROVIDER_CONFIG[TTS_PROVIDER];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config.body(text)),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(
        `TTS synthesis failed: ${response.status} ${response.statusText}`
      );
    }
    return response.arrayBuffer();
  } finally {
    clearTimeout(timeoutId);
  }
}
