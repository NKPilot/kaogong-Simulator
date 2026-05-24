"""TTS API router.

Provides POST /api/tts/synthesize endpoint that accepts text and voice,
calls the DashScope TTS service, and streams the resulting MP3 audio
back via chunked transfer encoding. Also provides GET /api/tts/voices
to list available voice options.
"""

import asyncio
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.tts_service import synthesize_speech, AVAILABLE_VOICES

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
    pitch_rate: float = Field(
        default=1.0,
        ge=0.5,
        le=2.0,
        description="Pitch adjustment",
    )
    vol: int = Field(
        default=50,
        ge=0,
        le=100,
        description="Volume level (0-100)",
    )


async def audio_chunk_generator(
    text: str, voice: str, speech_rate: float, pitch_rate: float, vol: int
):
    """Generate audio byte chunks for streaming response."""
    audio_bytes: bytes = await asyncio.to_thread(
        synthesize_speech, text, voice, speech_rate, pitch_rate, vol
    )
    for i in range(0, len(audio_bytes), CHUNK_SIZE):
        yield audio_bytes[i : i + CHUNK_SIZE]


@router.get("/api/tts/voices")
async def list_voices():
    """List available TTS voices for the interview simulator."""
    return {"voices": AVAILABLE_VOICES}


@router.post("/api/tts/synthesize")
async def synthesize(request: TTSRequest) -> StreamingResponse:
    """Synthesize speech from text and stream MP3 audio back."""
    try:
        return StreamingResponse(
            audio_chunk_generator(
                request.text, request.voice, request.speech_rate,
                request.pitch_rate, request.vol,
            ),
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
