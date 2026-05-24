"""TTS API router.

Provides POST /api/tts/synthesize endpoint that accepts text and voice,
calls the DashScope TTS service, and streams the resulting MP3 audio
back via chunked transfer encoding.
"""

import asyncio
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.tts_service import synthesize_speech

logger = logging.getLogger("interview-simulator")

router = APIRouter(tags=["tts"])

CHUNK_SIZE = 8192


class TTSRequest(BaseModel):
    """Request model for TTS synthesis."""

    text: str = Field(
        ...,
        max_length=500,
        description="Text to synthesize (max 500 characters)",
    )
    voice: str = Field(
        default="longxiaocheng_v2",
        description="DashScope voice ID for speech synthesis",
    )
    speech_rate: float = Field(
        default=1.0,
        ge=0.5,
        le=2.0,
        description="Speech speed",
    )
    vol: float = Field(
        default=1.0,
        gt=0.0,
        le=10.0,
        description="Volume",
    )


async def audio_chunk_generator(text: str, voice: str, speech_rate: float, vol: float):
    """Generate audio byte chunks for streaming response.

    Runs the blocking DashScope SDK call in a thread pool, then
    yields the resulting bytes in fixed-size chunks.

    Args:
        text: Text to synthesize.
        voice: DashScope voice ID.

    Yields:
        Bytes of audio data (8192-byte chunks).
    """
    audio_bytes: bytes = await asyncio.to_thread(
        synthesize_speech, text, voice, speech_rate, vol
    )
    for i in range(0, len(audio_bytes), CHUNK_SIZE):
        yield audio_bytes[i : i + CHUNK_SIZE]


@router.post("/api/tts/synthesize")
async def synthesize(request: TTSRequest) -> StreamingResponse:
    """Synthesize speech from text and stream MP3 audio back.

    Accepts text and optional voice parameter, returns chunked MP3
    audio via StreamingResponse.

    Args:
        request: TTSRequest with text and voice fields.

    Returns:
        StreamingResponse with audio/mpeg content type.

    Raises:
        HTTPException 422: If input validation fails (via Pydantic).
        HTTPException 502: If DashScope synthesis fails.
    """
    try:
        return StreamingResponse(
            audio_chunk_generator(request.text, request.voice, request.speech_rate, request.vol),
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-cache",
                "Accept-Ranges": "bytes",
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"TTS synthesis failed: {e}")
        raise HTTPException(
            status_code=502, detail="TTS synthesis failed"
        )
