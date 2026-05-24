"""MiniMax TTS (Text-to-Speech) synthesis service.

Wraps the MiniMax T2A v2 HTTP API to generate MP3 audio from text.
API key is configured from environment and never exposed to the frontend.

Docs: https://platform.minimax.io/docs/api-reference/speech-t2a-http
"""

import logging
import os

import httpx

logger = logging.getLogger("interview-simulator")

MINIMAX_TTS_URL = "https://api.minimax.chat/v1/t2a_v2"
MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY", "")

# Voice suitable for an exam interviewer: formal male announcer, standard Mandarin
DEFAULT_VOICE = "Chinese (Mandarin)_Male_Announcer"
DEFAULT_MODEL = "speech-2.8-hd"

TIMEOUT = httpx.Timeout(30.0, connect=10.0)


def synthesize_speech(
    text: str,
    voice: str = DEFAULT_VOICE,
    model: str = DEFAULT_MODEL,
    speed: float = 1.0,
    vol: float = 1.0,
    pitch: int = 0,
) -> bytes:
    """Synthesize speech from text using MiniMax T2A v2 API.

    Args:
        text: The text to synthesize.
        voice: MiniMax voice ID. Default is male announcer voice.
        model: MiniMax model ID. Default is speech-2.8-hd.
        speed: Speech speed, range [0.5, 2.0].
        vol: Volume, range (0, 10].
        pitch: Pitch adjustment, range [-12, 12].

    Returns:
        MP3 audio bytes.

    Raises:
        ValueError: If required config is missing.
        RuntimeError: If MiniMax API call fails.
    """
    if not MINIMAX_API_KEY:
        raise ValueError("MINIMAX_API_KEY environment variable not set")

    if len(text) > 5000:
        raise ValueError(
            f"Text too long: {len(text)} characters (max 5000)"
        )

    headers = {
        "Authorization": f"Bearer {MINIMAX_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "text": text,
        "stream": False,
        "output_format": "hex",
        "voice_setting": {
            "voice_id": voice,
            "speed": speed,
            "vol": vol,
            "pitch": pitch,
        },
        "audio_setting": {
            "format": "mp3",
            "sample_rate": 32000,
            "bitrate": 128000,
            "channel": 1,
        },
    }

    try:
        response = httpx.post(
            MINIMAX_TTS_URL,
            json=payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        response.raise_for_status()
    except httpx.TimeoutException:
        raise RuntimeError("MiniMax TTS request timed out")
    except httpx.HTTPStatusError as e:
        raise RuntimeError(
            f"MiniMax TTS HTTP {e.response.status_code}: {e.response.text[:500]}"
        )

    data = response.json()
    base_resp = data.get("base_resp", {})
    if base_resp.get("status_code") != 0:
        raise RuntimeError(
            f"MiniMax TTS error {base_resp.get('status_code')}: "
            f"{base_resp.get('status_msg', 'unknown')}"
        )

    hex_audio = data.get("data", {}).get("audio", "")
    if not hex_audio:
        raise RuntimeError("MiniMax TTS returned empty audio")

    return bytes.fromhex(hex_audio)
