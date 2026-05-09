from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field


class Difficulty(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class RelationType(str, Enum):
    PREREQUISITE = "PREREQUISITE"
    RELATED = "RELATED"
    EXTENDS = "EXTENDS"
    CROSS_SUBJECT = "CROSS_SUBJECT"


class RelationSuggestion(BaseModel):
    source_title: Optional[str] = None
    target_title: str
    relation_type: RelationType
    confidence: float = Field(ge=0.0, le=1.0)


class KnowledgePoint(BaseModel):
    title: str
    content: str
    difficulty: Difficulty
    suggested_relations: Optional[list[RelationSuggestion]] = None
    # source_excerpt：来自原文的 1-3 句直接引用（≤120 字），用于"出处定位"。
    # LLM 不一定每次都返回；为兼容老回包默认设为 None。
    source_excerpt: Optional[str] = Field(default=None, max_length=120)


class ExtractionRequest(BaseModel):
    text: str
    subject: Optional[str] = None
    topic: Optional[str] = None


class ExtractionResponse(BaseModel):
    knowledge_points: list[KnowledgePoint]
    raw_text: Optional[str] = None


class KnowledgePointBrief(BaseModel):
    title: str
    content: str


class RelationRequest(BaseModel):
    knowledge_points: list[KnowledgePointBrief]


class RelationResponse(BaseModel):
    relations: list[RelationSuggestion]


class EnhanceType(str, Enum):
    EXPLAIN = "EXPLAIN"
    MNEMONIC = "MNEMONIC"
    ANALOGY = "ANALOGY"


class EnhanceRequest(BaseModel):
    title: str
    content: str
    enhance_type: EnhanceType


class EnhanceResponse(BaseModel):
    enhanced_content: str
    enhance_type: EnhanceType
