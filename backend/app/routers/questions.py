from fastapi import APIRouter, HTTPException
from typing import List
from app.services.question_service import get_all, get_by_id
from app.models.question import Question

router = APIRouter(tags=["questions"])


@router.get("/api/questions", response_model=List[Question])
async def list_questions():
    """Return all scored questions."""
    return get_all()


@router.get("/api/questions/{question_id}", response_model=Question)
async def get_question(question_id: str):
    """Return a specific question by ID."""
    question = get_by_id(question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return question
