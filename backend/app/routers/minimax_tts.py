"""MiniMax TTS API router.

Provides POST /api/tts/minimax endpoint that accepts text and voice,
calls the MiniMax T2A v2 API, and streams the resulting MP3 audio
back via chunked transfer encoding.
"""

import asyncio
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.minimax_tts_service import synthesize_speech

logger = logging.getLogger("interview-simulator")

router = APIRouter(tags=["tts-minimax"])

CHUNK_SIZE = 8192


class MiniMaxTTSRequest(BaseModel):
    text: str = Field(
        ...,
        max_length=5000,
        description="Text to synthesize (max 5000 characters)",
    )
    voice: str = Field(
        default="Chinese (Mandarin)_Male_Announcer",
        description="MiniMax voice ID for speech synthesis",
    )
    model: str = Field(
        default="speech-2.8-hd",
        description="MiniMax model ID",
    )
    speed: float = Field(
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
    pitch: int = Field(
        default=0,
        ge=-12,
        le=12,
        description="Pitch adjustment",
    )


async def audio_chunk_generator(
    text: str,
    voice: str,
    model: str,
    speed: float,
    vol: float,
    pitch: int,
):
    """Generate audio byte chunks for streaming response.

    Runs the blocking MiniMax HTTP call in a thread pool, then
    yields the resulting bytes in fixed-size chunks.
    """
    audio_bytes: bytes = await asyncio.to_thread(
        synthesize_speech,
        text,
        voice,
        model,
        speed,
        vol,
        pitch,
    )
    for i in range(0, len(audio_bytes), CHUNK_SIZE):
        yield audio_bytes[i : i + CHUNK_SIZE]


@router.post("/api/tts/minimax")
async def synthesize(request: MiniMaxTTSRequest) -> StreamingResponse:
    """Synthesize speech from text using MiniMax TTS and stream MP3 audio back.

    Returns:
        StreamingResponse with audio/mpeg content type.
    """
    # Pre-validate before streaming so errors become proper HTTP responses
    from app.services.minimax_tts_service import MINIMAX_API_KEY

    if not MINIMAX_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="MINIMAX_API_KEY not configured on server",
        )

    try:
        return StreamingResponse(
            audio_chunk_generator(
                request.text,
                request.voice,
                request.model,
                request.speed,
                request.vol,
                request.pitch,
            ),
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-cache",
                "Accept-Ranges": "bytes",
            },
        )
    except RuntimeError as e:
        logger.error(f"MiniMax TTS synthesis failed: {e}")
        raise HTTPException(status_code=502, detail=str(e))
