from app.models.knowledge import (
    KnowledgePoint,
    RelationSuggestion,
    ExtractionRequest,
    ExtractionResponse,
    RelationRequest,
    RelationResponse,
    EnhanceRequest,
    EnhanceResponse,
)
from app.models.quiz import (
    QuizGenerateRequest,
    QuizQuestion,
    QuizGenerateResponse,
)
from app.models.pdf import (
    PDFParseRequest,
    PDFChunk,
    PDFParseResponse,
)

__all__ = [
    "KnowledgePoint",
    "RelationSuggestion",
    "ExtractionRequest",
    "ExtractionResponse",
    "RelationRequest",
    "RelationResponse",
    "EnhanceRequest",
    "EnhanceResponse",
    "QuizGenerateRequest",
    "QuizQuestion",
    "QuizGenerateResponse",
    "PDFParseRequest",
    "PDFChunk",
    "PDFParseResponse",
]
