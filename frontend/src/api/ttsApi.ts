const API_BASE_URL = 'http://localhost:8000';
const TTS_TIMEOUT_MS = 30_000;

export type TTSProvider = 'dashscope' | 'minimax';

/** Switch this to change the TTS provider globally */
export const TTS_PROVIDER: TTSProvider = 'minimax';

const PROVIDER_CONFIG: Record<TTSProvider, { endpoint: string; voice: string; body: (text: string) => unknown }> = {
  dashscope: {
    endpoint: `${API_BASE_URL}/api/tts/synthesize`,
    voice: 'longxiaocheng_v2',
    body: (text) => ({ text, voice: 'longxiaocheng_v2' }),
  },
  minimax: {
    endpoint: `${API_BASE_URL}/api/tts/minimax`,
    voice: 'Chinese (Mandarin)_Male_Announcer',
    body: (text) => ({
      text,
      voice: 'Chinese (Mandarin)_Male_Announcer',
      model: 'speech-2.8-hd',
      speed: 1.2,
      vol: 1.0,
      pitch: 0,
    }),
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
