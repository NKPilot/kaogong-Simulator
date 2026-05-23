"""Recording upload and storage service.

Provides session-organized file storage for voice answer recordings
uploaded from the frontend MediaRecorder.
"""

import logging
import os
from pathlib import Path

logger = logging.getLogger("interview-simulator")

# Base directory for all recordings, relative to the backend working directory
RECORDINGS_DIR = "recordings"


def ensure_recordings_dir() -> None:
    """Ensure the base recordings directory exists.

    Called on first save to create the top-level recordings/ directory
    if it does not already exist.
    """
    os.makedirs(RECORDINGS_DIR, exist_ok=True)


def save_recording(
    session_id: str, question_index: int, audio_data: bytes
) -> str:
    """Save recorded audio data to a session-organized directory.

    Creates the directory structure:
        recordings/{session_id}/q{question_index}.webm

    Args:
        session_id: Unique identifier for the interview session.
        question_index: Zero-based index of the question within the session.
        audio_data: Raw audio bytes (WebM/Opus format).

    Returns:
        Absolute file path of the saved recording.

    Raises:
        RuntimeError: If file I/O fails for any reason.
    """
    # Ensure the base recordings directory exists
    ensure_recordings_dir()

    # Build the session directory path
    session_dir = Path(RECORDINGS_DIR) / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    # Build the output file path
    output_path = session_dir / f"q{question_index}.webm"

    try:
        output_path.write_bytes(audio_data)
    except OSError as e:
        raise RuntimeError(
            f"Failed to save recording for session {session_id}, "
            f"question {question_index}: {e}"
        )

    file_size = len(audio_data)
    logger.info(
        "Recording saved: %s (session=%s, q=%s, size=%s bytes)",
        output_path,
        session_id,
        question_index,
        file_size,
    )

    return str(output_path.resolve())
