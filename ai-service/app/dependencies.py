"""Singleton service instances used as dependencies across routers."""

from app.config import settings
from app.services.llm_service import LLMService
from app.services.knowledge_service import KnowledgeService
from app.services.pdf_parser import PDFParserService
from app.services.quiz_explain_service import QuizExplainService
from app.services.study_plan_service import StudyPlanService

_llm_service: LLMService | None = None
_knowledge_service: KnowledgeService | None = None
_pdf_parser_service: PDFParserService | None = None
_quiz_explain_service: QuizExplainService | None = None
_study_plan_service: StudyPlanService | None = None


def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService(settings)
    return _llm_service


def get_knowledge_service() -> KnowledgeService:
    global _knowledge_service
    if _knowledge_service is None:
        _knowledge_service = KnowledgeService(get_llm_service())
    return _knowledge_service


def get_pdf_parser_service() -> PDFParserService:
    global _pdf_parser_service
    if _pdf_parser_service is None:
        _pdf_parser_service = PDFParserService()
    return _pdf_parser_service


def get_quiz_explain_service() -> QuizExplainService:
    global _quiz_explain_service
    if _quiz_explain_service is None:
        _quiz_explain_service = QuizExplainService(get_llm_service())
    return _quiz_explain_service


def get_study_plan_service() -> StudyPlanService:
    global _study_plan_service
    if _study_plan_service is None:
        _study_plan_service = StudyPlanService(get_llm_service())
    return _study_plan_service
