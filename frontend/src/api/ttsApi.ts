const API_BASE_URL = 'http://localhost:8000';

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const response = await fetch(`${API_BASE_URL}/api/tts/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: 'longxiaocheng_v2' }),
  });
  if (!response.ok) {
    throw new Error(
      `TTS synthesis failed: ${response.status} ${response.statusText}`
    );
  }
  return response.arrayBuffer();
}
