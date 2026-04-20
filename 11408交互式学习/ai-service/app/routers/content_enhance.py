import logging

from fastapi import APIRouter, HTTPException

from app.models.knowledge import EnhanceRequest, EnhanceResponse
from app.dependencies import get_knowledge_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/enhance", response_model=EnhanceResponse)
async def enhance_content(request: EnhanceRequest):
    """增强知识点内容（详解/助记/类比）"""
    try:
        service = get_knowledge_service()
        enhanced = await service.enhance_content(
            title=request.title,
            content=request.content,
            enhance_type=request.enhance_type.value,
        )
        return EnhanceResponse(
            enhanced_content=enhanced,
            enhance_type=request.enhance_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("内容增强失败: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"内容增强失败: {e}")
