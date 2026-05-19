"""
POST /ai/classify-wrong-answer — 给一条错题打 5 类病因标签之一。
"""
import logging

from fastapi import APIRouter, HTTPException

from app.dependencies import get_llm_service
from app.models.wrong_answer_classify import (
    WrongAnswerClassifyRequest,
    WrongAnswerClassifyResponse,
)
from app.services.wrong_answer_classify_service import WrongAnswerClassifyService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/classify-wrong-answer", response_model=WrongAnswerClassifyResponse)
async def classify_wrong_answer(request: WrongAnswerClassifyRequest):
    """对一条错题做 1-of-5 病因归类。AI 不可用时返回兜底 KNOWLEDGE_GAP 而不抛 500,
    让后端可以记录"暂未归类"并稍后重试。"""
    try:
        service = WrongAnswerClassifyService(get_llm_service())
        return await service.classify(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # 服务层已捕获 LLM 异常,这里只兜未知错误
        logger.error("AI 错题归类失败: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI 错题归类失败: {e}")
