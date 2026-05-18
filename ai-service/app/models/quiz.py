from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field


class QuestionType(str, Enum):
    CHOICE = "CHOICE"
    TRUE_FALSE = "TRUE_FALSE"
    FILL_BLANK = "FILL_BLANK"


class QuizGenerateRequest(BaseModel):
    knowledge_title: str = Field(..., max_length=300)
    knowledge_content: str = Field(..., max_length=10000)
    question_type: QuestionType
    count: int = Field(default=3, ge=1, le=20)
    difficulty: Optional[str] = Field(default=None, max_length=20)


class QuizQuestion(BaseModel):
    question: str
    question_type: QuestionType
    options: Optional[list[str]] = None
    answer: str
    explanation: str


class QuizGenerateResponse(BaseModel):
    questions: list[QuizQuestion]
