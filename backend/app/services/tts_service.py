"""TTS (Text-to-Speech) synthesis service.

Wraps the DashScope SpeechSynthesizer SDK to generate MP3 audio
from text. API key is configured from environment and never exposed
to the frontend (per D-12).
"""

import os

import dashscope
from dashscope.audio.tts_v2 import SpeechSynthesizer
from dashscope.audio.tts_v2.speech_synthesizer import AudioFormat

# Configure API key from environment — never exposed to the frontend
dashscope.api_key = os.environ.get("DASHSCOPE_API_KEY", "")


def synthesize_speech(text: str, voice: str = "longxiaocheng_v2") -> bytes:
    """Synthesize speech from text using DashScope TTS.

    Args:
        text: The text to synthesize (max 500 characters).
        voice: DashScope voice ID. Default is "longxiaocheng_v2"
               (formal male voice, steady, broadcast-quality).

    Returns:
        Complete MP3 audio bytes.

    Raises:
        ValueError: If text exceeds 500 characters.
        Exception: If DashScope synthesis fails.
    """
    if len(text) > 500:
        raise ValueError(
            f"Text too long: {len(text)} characters (max 500)"
        )

    synthesizer = SpeechSynthesizer(
        model="cosyvoice-v2",
        voice=voice,
        format=AudioFormat.MP3_22050HZ_MONO_256KBPS,
        speech_rate=1.0,
    )

    audio_bytes = synthesizer.call(text)
    return audio_bytes
