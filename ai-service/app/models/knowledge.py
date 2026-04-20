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
