import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, questions
from app.services.question_service import load_questions

logger = logging.getLogger("interview-simulator")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load question data on startup."""
    try:
        count = len(load_questions())
        logger.info(f"Loaded {count} questions from data file")
    except Exception as e:
        logger.error(f"Failed to load questions: {e}")
        raise
    yield


app = FastAPI(
    title="Interview Simulator API",
    description="Civil Service Exam Interview Simulator Backend",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS -- only allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(questions.router)
