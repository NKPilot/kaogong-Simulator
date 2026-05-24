"""Scoring API router.

Provides REST endpoints for triggering answer scoring,
retrieving scoring results, and re-scoring questions.
"""

import asyncio
import logging
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.question_service import get_by_id
from app.services.scoring_service import (
    evaluate_answer,
    load_scoring_results,
    save_scoring_result,
)

logger = logging.getLogger("interview-simulator")

router = APIRouter(tags=["scoring"])

# In-memory rate limit tracker for re-score operations
# Key: "{session_id}:{question_index}", Value: count of re-scores
_rescore_counts: dict[str, int] = {}

# UUID hex pattern for session_id validation (path traversal prevention)
_SESSION_ID_PATTERN = re.compile(r"^[a-f0-9-]+$")


class EvaluateRequest(BaseModel):
    """Request body for triggering a scoring evaluation."""

    session_id: str = Field(..., min_length=1, description="Interview session UUID")
    question_index: int = Field(..., ge=0, description="Zero-based question number")
    question_id: str = Field(..., min_length=1, description="Question identifier")


class RescoreRequest(BaseModel):
    """Request body for triggering a re-score evaluation."""

    session_id: str = Field(..., min_length=1, description="Interview session UUID")
    question_index: int = Field(..., ge=0, description="Zero-based question number")
    question_id: str = Field(..., min_length=1, description="Question identifier")


def _validate_session_id(session_id: str) -> None:
    """Validate session_id matches UUID hex pattern to prevent path traversal.

    Ref: Threat T-04-01 — Validate session_id against ^[a-f0-9-]+$ before
    any filesystem access.
    """
    if not _SESSION_ID_PATTERN.match(session_id):
        raise HTTPException(
            status_code=422,
            detail="session_id must be a valid UUID hex pattern (a-f, 0-9, hyphens only)",
        )


def _validate_and_load_question(question_id: str) -> dict:
    """Load a question by ID, raising 404 if not found."""
    question = get_by_id(question_id)
    if question is None:
        raise HTTPException(status_code=404, detail=f"Question not found: {question_id}")
    return question.model_dump()


async def _run_scoring_pipeline(
    session_id: str, question_index: int, question: dict
) -> None:
    """Run the scoring pipeline in a background thread and persist the result.

    Writes a 'pending' entry immediately so the frontend polling sees it,
    then updates to 'scored' or 'failed' when the pipeline completes.
    """
    # Persist pending status first so the frontend polling picks it up
    pending = {
        "question_index": question_index,
        "question_id": question.get("id", ""),
        "status": "pending",
    }
    save_scoring_result(session_id, question_index, pending)

    try:
        result = await asyncio.to_thread(
            evaluate_answer, session_id, question_index, question
        )
    except Exception as e:
        logger.exception(
            "Unhandled exception in scoring pipeline (session=%s, q=%d): %s",
            session_id, question_index, e,
        )
        # Degrade gracefully: save a failed result so the frontend can display it
        result = {
            "question_index": question_index,
            "question_id": question.get("id", ""),
            "status": "failed",
            "error": f"Scoring pipeline error: {e}",
        }

    # Persist the result (success or failure) so the frontend can poll it
    try:
        save_scoring_result(session_id, question_index, result)
        logger.info(
            "Scoring result persisted: session=%s, q=%d, status=%s",
            session_id, question_index, result.get("status"),
        )
    except Exception as e:
        logger.error(
            "Failed to persist scoring result (session=%s, q=%d): %s",
            session_id, question_index, e,
        )


@router.post("/api/scoring/evaluate")
async def evaluate(request: EvaluateRequest) -> dict:
    """Trigger asynchronous scoring for a single question.

    Validates the session ID against UUID hex pattern, loads the question
    from the question bank, and fires the scoring pipeline in a background
    thread. Returns immediately with status "accepted".

    The result is persisted to recordings/{session_id}/scoring.json and
    can be polled via GET /api/scoring/results/{session_id}.

    Ref: Threat T-04-01 — session_id validated as UUID hex pattern.
    Ref: Threat T-04-05 — generic error messages in responses.
    """
    _validate_session_id(request.session_id)
    question = _validate_and_load_question(request.question_id)

    # Fire-and-forget: start scoring pipeline in background
    asyncio.create_task(
        _run_scoring_pipeline(
            request.session_id,
            request.question_index,
            question,
        )
    )

    logger.info(
        "Scoring triggered: session=%s, q=%d, question=%s",
        request.session_id, request.question_index, request.question_id,
    )
    return {"status": "accepted"}


@router.get("/api/scoring/results/{session_id}")
async def get_results(session_id: str) -> list[dict]:
    """Retrieve all scoring results for a session.

    Returns the contents of recordings/{session_id}/scoring.json as a JSON
    array. Returns an empty list `[]` if the session has no results yet.

    Ref: Threat T-04-01 — session_id validated as UUID hex pattern.
    """
    _validate_session_id(session_id)
    results = load_scoring_results(session_id)
    logger.debug(
        "Results retrieved for session=%s: %d entries",
        session_id, len(results),
    )
    return results


@router.post("/api/scoring/rescore")
async def rescore(request: RescoreRequest) -> dict:
    """Trigger re-scoring for a single question.

    Same pipeline as evaluate, but enforces a rate limit of max 3 re-scores
    per question per session. Returns 429 when the limit is exceeded.

    Ref: Threat T-04-04 — in-memory rate limit, max 3 per question per session.
    Ref: Threat T-04-01 — session_id validated as UUID hex pattern.
    """
    _validate_session_id(request.session_id)
    question = _validate_and_load_question(request.question_id)

    # Rate limit check
    rate_key = f"{request.session_id}:{request.question_index}"
    current_count = _rescore_counts.get(rate_key, 0)

    if current_count >= 3:
        raise HTTPException(
            status_code=429,
            detail="Re-score limit reached (max 3 per question)",
        )

    _rescore_counts[rate_key] = current_count + 1

    # Fire-and-forget: start scoring pipeline in background
    asyncio.create_task(
        _run_scoring_pipeline(
            request.session_id,
            request.question_index,
            question,
        )
    )

    logger.info(
        "Re-score triggered: session=%s, q=%d, question=%s (count=%d)",
        request.session_id,
        request.question_index,
        request.question_id,
        _rescore_counts[rate_key],
    )
    return {"status": "accepted"}
