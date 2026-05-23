"""Guidance API router.

Provides GET /api/interview/guidance endpoint that returns structured
welcome text with dynamic question count.
"""

from typing import List

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.guidance_service import generate_guidance_text

router = APIRouter(tags=["interview"])


class GuidanceResponse(BaseModel):
    """Response model for the guidance endpoint."""

    title: str
    paragraphs: List[str]


@router.get(
    "/api/interview/guidance",
    response_model=GuidanceResponse,
)
async def get_guidance(
    question_count: int = Query(..., alias="question_count"),
) -> GuidanceResponse:
    """Return interview guidance text with dynamic question count.

    Args:
        question_count: Number of questions selected by the user.

    Returns:
        GuidanceResponse with title and list of paragraph strings.
    """
    data = generate_guidance_text(question_count)
    return GuidanceResponse(**data)
