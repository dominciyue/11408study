import logging

from fastapi import APIRouter, HTTPException

from app.dependencies import get_study_plan_service
from app.models.study_plan import StudyPlanRequest, StudyPlanResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/study-plan", response_model=StudyPlanResponse)
async def generate_study_plan(request: StudyPlanRequest):
    """根据用户目标 + 周数 + 薄弱主题，生成分周学习计划。"""
    try:
        service = get_study_plan_service()
        return await service.generate(request)
    except ValueError as e:
        # LLM 返回无法解析或字段非法 → 4xx，客户端可重试
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("AI 学习计划生成失败: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI 学习计划生成失败: {e}")
