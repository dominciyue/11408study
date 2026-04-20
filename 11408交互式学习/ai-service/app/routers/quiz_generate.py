import logging

from fastapi import APIRouter, HTTPException

from app.models.quiz import (
    QuizGenerateRequest,
    QuizGenerateResponse,
    QuizQuestion,
)
from app.dependencies import get_knowledge_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate-quiz", response_model=QuizGenerateResponse)
async def generate_quiz(request: QuizGenerateRequest):
    """根据知识点生成测验题目"""
    try:
        service = get_knowledge_service()
        raw_questions = await service.generate_quiz(
            title=request.knowledge_title,
            content=request.knowledge_content,
            question_type=request.question_type.value,
            count=request.count,
            difficulty=request.difficulty,
        )
        questions = [QuizQuestion(**q) for q in raw_questions]
        return QuizGenerateResponse(questions=questions)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("题目生成失败: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"题目生成失败: {e}")
