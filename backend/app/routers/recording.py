"""Recording upload API router.

Provides POST /api/recording/upload endpoint that accepts multipart
form-data with session_id, question_index, and audio file, then saves
the recording to session-organized storage.
"""

import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.recording_service import save_recording

logger = logging.getLogger("interview-simulator")

router = APIRouter(tags=["recording"])


@router.post("/api/recording/upload")
async def upload_recording(
    session_id: str = Form(...),
    question_index: int = Form(...),
    audio: UploadFile = File(...),
) -> dict:
    """Upload a voice answer recording for a given question.

    Accepts multipart form-data with:
    - session_id (str, required): UUID-like interview session identifier.
    - question_index (int, required): Zero-based question number.
    - audio (file, required): Recorded audio file (WebM/Opus).

    Returns JSON with status "ok" on success.

    Raises:
        HTTPException 422: If session_id is empty or question_index is negative.
        HTTPException 500: If file storage or any unexpected error occurs.
    """
    # Validate session_id
    if not session_id or session_id.strip() == "":
        raise HTTPException(
            status_code=422, detail="session_id must be non-empty"
        )

    # Validate question_index
    if question_index < 0:
        raise HTTPException(
            status_code=422, detail="question_index must be non-negative"
        )

    # Warn on unexpected MIME types but still accept the file
    if audio.content_type is not None and audio.content_type not in (
        "audio/webm",
        "audio/opus",
    ):
        logger.warning(
            "Unexpected audio content type: %s (session=%s, q=%s)",
            audio.content_type,
            session_id,
            question_index,
        )

    try:
        audio_bytes = await audio.read()
        saved_path = save_recording(session_id, question_index, audio_bytes)
        logger.info(
            "Recording saved: %s (session=%s, q=%s, size=%s bytes)",
            saved_path,
            session_id,
            question_index,
            len(audio_bytes),
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(
            "Unexpected error saving recording (session=%s, q=%s): %s",
            session_id,
            question_index,
            e,
        )
        raise HTTPException(
            status_code=500, detail=f"Failed to save recording: {e}"
        )

    return {"status": "ok"}
