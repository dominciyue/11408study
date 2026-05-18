from typing import Optional, Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., max_length=4000)


class QuizQuestionContext(BaseModel):
    """题目上下文，用于 LLM prompt 注入。"""

    content: str = Field(..., max_length=3000)
    options: Optional[list[str]] = None  # list items 自行加限可选
    correct_answer: str = Field(..., max_length=2000)
    stored_explanation: Optional[str] = Field(default=None, max_length=5000)
    question_type: Literal["CHOICE", "TRUE_FALSE", "FILL_BLANK"] = "CHOICE"


class KnowledgeNodeContext(BaseModel):
    title: str = Field(..., max_length=300)
    content: Optional[str] = Field(default=None, max_length=5000)


class ExplainQuestionRequest(BaseModel):
    question: QuizQuestionContext
    user_answer: str = Field(..., max_length=2000)
    knowledge_node: Optional[KnowledgeNodeContext] = None
    # null on first turn (server constructs initial user message from above);
    # filled on follow-ups, contains all prior messages excluding system,
    # last entry is the latest user message to answer.
    # history 列表自行长度由 ChatMessage 单条 4000 限制兜底; 此处加 list 长度限制防滥用
    history: Optional[list[ChatMessage]] = Field(default=None, max_length=50)


class ExplainQuestionResponse(BaseModel):
    reply: str
