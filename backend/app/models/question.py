from pydantic import BaseModel, Field
from typing import Optional


class Question(BaseModel):
    """Represents a single exam question with scoring criteria."""
    id: str = Field(..., description="Unique question identifier")
    title: str = Field(..., description="Display title (paper name + question number)")
    fullText: str = Field(..., description="Full question text")
    type: str = Field(..., description="Question category: A, B, C, or 结构化小组")
    year: int = Field(..., description="Exam year")
    source: str = Field(..., description="Source description (e.g., 江苏省考面试真题)")
    scorePoints: Optional[str] = Field(None, description="Scoring criteria text")
    referenceAnswer: Optional[str] = Field(None, description="Official reference answer for model answer display")

    model_config = {"from_attributes": True}
