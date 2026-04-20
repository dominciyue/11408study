import logging

from fastapi import APIRouter, HTTPException

from app.models.knowledge import (
    RelationRequest,
    RelationResponse,
    RelationSuggestion,
)
from app.dependencies import get_knowledge_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/suggest-relations", response_model=RelationResponse)
async def suggest_relations(request: RelationRequest):
    """分析知识点之间的关系"""
    try:
        service = get_knowledge_service()
        points_data = [kp.model_dump() for kp in request.knowledge_points]
        raw_relations = await service.suggest_relations(points_data)
        relations = [RelationSuggestion(**r) for r in raw_relations]
        return RelationResponse(relations=relations)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("关系分析失败: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"关系分析失败: {e}")
