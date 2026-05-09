import logging

from fastapi import APIRouter, HTTPException

from app.models.quiz_explain import (
    ExplainQuestionRequest,
    ExplainQuestionResponse,
)
from app.dependencies import get_quiz_explain_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/explain-question", response_model=ExplainQuestionResponse)
async def explain_question(request: ExplainQuestionRequest):
    """启发式 AI 讲题。第一轮基于题目+用户答案+知识点构造提示；
    后续轮次基于客户端维护的 history 多轮对话。"""
    try:
        service = get_quiz_explain_service()
        reply = await service.explain(request)
        return ExplainQuestionResponse(reply=reply)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("AI 讲题失败: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI 讲题失败: {e}")
