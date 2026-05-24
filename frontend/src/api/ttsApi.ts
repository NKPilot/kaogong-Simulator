const API_BASE_URL = 'http://localhost:8000';
const TTS_TIMEOUT_MS = 30_000;

export type TTSProvider = 'dashscope' | 'minimax';

/** Switch this to change the TTS provider globally */
export const TTS_PROVIDER: TTSProvider = 'minimax';

function getTtsParams() {
  // Read from window.__TTS_PARAMS__ set by DeviceSettingsPanel, or defaults
  const defaults = { speed: 1.2, pitch: 0, vol: 1.0 };
  try {
    const stored = (window as any).__TTS_PARAMS__;
    if (stored) return { ...defaults, ...stored };
  } catch { /* noop */ }
  return defaults;
}

const PROVIDER_CONFIG: Record<TTSProvider, { endpoint: string; voice: string; body: (text: string) => unknown }> = {
  dashscope: {
    endpoint: `${API_BASE_URL}/api/tts/synthesize`,
    voice: 'longxiaocheng_v2',
    body: (text) => {
      const p = getTtsParams();
      return { text, voice: 'longxiaocheng_v2', speech_rate: p.speed, vol: p.vol };
    },
  },
  minimax: {
    endpoint: `${API_BASE_URL}/api/tts/minimax`,
    voice: 'Chinese (Mandarin)_Male_Announcer',
    body: (text) => {
      const p = getTtsParams();
      return {
        text,
        voice: 'Chinese (Mandarin)_Male_Announcer',
        model: 'speech-2.8-hd',
        speed: p.speed,
        vol: p.vol,
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

/** Preview a short sample — returns first few seconds of audio as blob URL */
export async function previewSpeech(text: string, maxChars: number = 30): Promise<string> {
  const previewText = text.slice(0, maxChars);
  const buffer = await synthesizeSpeech(previewText);
  const blob = new Blob([buffer], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}
