"""DashScope ASR (Speech Recognition) service.

Uses DashScope Paraformer model via Recognition API (WebSocket streaming)
to transcribe local audio files. API key is configured from environment.
"""

import logging
import os

import dashscope
from dashscope.audio.asr.recognition import (
    Recognition,
    RecognitionCallback,
    RecognitionResult,
)

logger = logging.getLogger("interview-simulator")

dashscope.api_key = os.environ.get("DASHSCOPE_API_KEY", "")


def transcribe_audio(file_path: str) -> str:
    """Transcribe a local WAV audio file using DashScope Paraformer.

    Args:
        file_path: Path to a WAV file (16kHz, mono, 16-bit PCM).

    Returns:
        Transcribed text string.

    Raises:
        ValueError: If API key or file is missing.
        RuntimeError: If recognition fails.
    """
    if not dashscope.api_key:
        raise ValueError("DASHSCOPE_API_KEY environment variable not set")

    callback = RecognitionCallback()

    recognition = Recognition(
        model="paraformer-realtime-v2",
        callback=callback,
        format="wav",
        sample_rate=16000,
    )

    result: RecognitionResult = recognition.call(file_path)
    logger.info("ASR result: status=%s, output=%s", result.status_code, result.output)

    if result.status_code != 200:
        raise RuntimeError(
            f"Recognition failed: [{result.status_code}] {result.message}"
        )

    sentence = result.get_sentence()
    logger.info("ASR sentence: %s", sentence)

    if not sentence:
        return ""

    if isinstance(sentence, list):
        texts = [s.get("text", "") for s in sentence if s.get("text")]
        return "".join(texts)

    return sentence.get("text", "")
