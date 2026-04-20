import logging

from fastapi import APIRouter, HTTPException

from app.models.knowledge import (
    ExtractionRequest,
    ExtractionResponse,
    KnowledgePoint,
)
from app.services.knowledge_service import KnowledgeService
from app.dependencies import get_knowledge_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/extract", response_model=ExtractionResponse)
async def extract_knowledge(request: ExtractionRequest):
    """从文本中提取知识点"""
    try:
        service = get_knowledge_service()
        raw_points = await service.extract_knowledge(
            text=request.text,
            subject=request.subject,
            topic=request.topic,
        )
        knowledge_points = [KnowledgePoint(**kp) for kp in raw_points]
        return ExtractionResponse(
            knowledge_points=knowledge_points,
            raw_text=request.text[:500] if len(request.text) > 500 else request.text,
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("知识点提取失败: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"知识点提取失败: {e}")
