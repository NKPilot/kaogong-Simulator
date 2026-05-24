"""ASR (Speech Recognition) API router.

Provides POST /api/asr/recognize endpoint that accepts a WAV audio file
and returns the transcribed text using DashScope Paraformer.
"""

import logging
import os
import tempfile
import wave

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.asr_service import transcribe_audio

logger = logging.getLogger("interview-simulator")

router = APIRouter(tags=["asr"])


@router.post("/api/asr/recognize")
async def recognize(audio: UploadFile = File(...)) -> dict:
    """Transcribe uploaded WAV audio to text.

    Accepts WAV audio (16kHz, mono, 16-bit PCM) and returns
    the transcribed text using DashScope Paraformer.

    Returns JSON with transcribed text.
    """
    if not audio.filename:
        raise HTTPException(status_code=422, detail="No file provided")

    content = await audio.read()
    if len(content) == 0:
        raise HTTPException(status_code=422, detail="Empty audio file")

    # Validate it looks like a WAV file
    if len(content) < 44 or content[:4] != b"RIFF":
        raise HTTPException(
            status_code=422,
            detail=f"Invalid audio format: expected WAV, got {content[:4]!r}",
        )

    # Verify WAV params
    try:
        tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        tmp.write(content)
        tmp.close()

        with wave.open(tmp.name, "rb") as wf:
            channels = wf.getnchannels()
            sample_rate = wf.getframerate()
            bits = wf.getsampwidth() * 8
            frames = wf.getnframes()
            duration = frames / sample_rate if sample_rate > 0 else 0
            logger.info(
                "WAV: %d channels, %d Hz, %d bits, %d frames (%.1fs)",
                channels,
                sample_rate,
                bits,
                frames,
                duration,
            )

            # Check PCM data is not all zeros
            pcm_data = wf.readframes(min(frames, 1000))
            non_zero = sum(1 for b in pcm_data if b != 0)
            logger.info(
                "WAV first 1000 frames: %d non-zero bytes out of %d",
                non_zero,
                len(pcm_data),
            )

        result = transcribe_audio(tmp.name)
        return {"text": result}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        logger.error(f"ASR recognition failed: {e}")
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.error(f"ASR unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass
