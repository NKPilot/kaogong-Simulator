"""History API router — list past interview sessions."""

import json
import logging
import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.services.scoring_service import (
    load_scoring_results,
)

logger = logging.getLogger("interview-simulator")

router = APIRouter(tags=["history"])

RECORDINGS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "recordings")


def _list_sessions() -> list[dict]:
    """Scan recordings directory and return session metadata sorted by date descending."""
    sessions = []
    if not os.path.isdir(RECORDINGS_DIR):
        return sessions

    for name in os.listdir(RECORDINGS_DIR):
        path = os.path.join(RECORDINGS_DIR, name)
        if not os.path.isdir(path):
            continue
        # Count webm recordings
        webm_files = sorted(
            [f for f in os.listdir(path) if f.endswith(".webm")]
        )
        # Use max of webm count and result count as question_count
        question_count = max(len(webm_files), len(results))
        # Get scoring summary
        results = load_scoring_results(name)
        # Skip sessions with no recordings and no results
        if not webm_files and not results:
            continue
        scored = sum(1 for r in results if r.get("status") == "scored")
        total_covered = sum(r.get("coveredCount", 0) for r in results)
        total_points = sum(r.get("totalCount", 0) for r in results)
        # Use oldest file mtime as session date
        mtimes = [os.path.getmtime(os.path.join(path, f)) for f in webm_files]
        created_at = min(mtimes) if mtimes else os.path.getmtime(path)
        sessions.append({
            "session_id": name,
            "created_at": datetime.fromtimestamp(created_at, tz=timezone.utc).isoformat(),
            "question_count": question_count,
            "scored_count": scored,
            "total_covered": total_covered,
            "total_points": total_points,
            "results": results,
            "recordings": [f"q{i}.webm" for i in range(question_count)],
        })

    sessions.sort(key=lambda s: s["created_at"], reverse=True)
    return sessions


@router.get("/api/history")
async def list_history():
    """List all past interview sessions with metadata and scores."""
    return {"sessions": _list_sessions()}


@router.get("/api/history/{session_id}")
async def get_session(session_id: str):
    """Get a single session with full results."""
    results = load_scoring_results(session_id)
    path = os.path.join(RECORDINGS_DIR, session_id)
    webm_files = sorted(
        [f for f in os.listdir(path) if f.endswith(".webm")]
    ) if os.path.isdir(path) else []
    return {
        "session_id": session_id,
        "question_count": len(webm_files),
        "results": results,
        "recordings": webm_files,
    }


@router.get("/api/history/{session_id}/recording/{filename}")
async def get_recording(session_id: str, filename: str):
    """Serve a recording file for playback."""
    filepath = os.path.join(RECORDINGS_DIR, session_id, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Recording not found")
    return FileResponse(filepath, media_type="audio/webm")
