import json
from pathlib import Path
from typing import List
from app.models.question import Question


# Hardcoded path relative to service file location
_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
_QUESTIONS_FILE = _DATA_DIR / "questions.json"

_questions: List[Question] = []


def load_questions() -> List[Question]:
    """Load questions from JSON file into memory.

    Returns the loaded Question list. Called once at startup.
    Raises FileNotFoundError if the file doesn't exist.
    Raises json.JSONDecodeError if the file is malformed.
    Raises ValidationError if data doesn't match the Question model.
    """
    global _questions

    if not _QUESTIONS_FILE.exists():
        raise FileNotFoundError(f"Questions file not found: {_QUESTIONS_FILE}")

    with open(_QUESTIONS_FILE, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    _questions = [Question(**item) for item in raw_data]
    return _questions


def get_all() -> List[Question]:
    """Return all loaded questions.

    Returns empty list if load_questions() hasn't been called yet.
    """
    return _questions


def get_by_id(question_id: str) -> Question | None:
    """Find a question by its ID.

    Returns None if not found.
    """
    for q in _questions:
        if q.id == question_id:
            return q
    return None


def count() -> int:
    """Return the number of loaded questions."""
    return len(_questions)
