from typing import Optional, Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class QuizQuestionContext(BaseModel):
    """题目上下文，用于 LLM prompt 注入。"""

    content: str
    options: Optional[list[str]] = None
    correct_answer: str
    stored_explanation: Optional[str] = None
    question_type: Literal["CHOICE", "TRUE_FALSE", "FILL_BLANK"] = "CHOICE"


class KnowledgeNodeContext(BaseModel):
    title: str
    content: Optional[str] = None


class ExplainQuestionRequest(BaseModel):
    question: QuizQuestionContext
    user_answer: str
    knowledge_node: Optional[KnowledgeNodeContext] = None
    # null on first turn (server constructs initial user message from above);
    # filled on follow-ups, contains all prior messages excluding system,
    # last entry is the latest user message to answer.
    history: Optional[list[ChatMessage]] = None


class ExplainQuestionResponse(BaseModel):
    reply: str
