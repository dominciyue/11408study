import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.dependencies import get_llm_service
from app.routers import (
    knowledge_extract,
    quiz_generate,
    relation_suggest,
    content_enhance,
    pdf_parse,
    quiz_explain,
    study_plan,
)

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== %s 启动 ===", settings.app_name)
    logger.info("LLM 提供商: %s", settings.llm_provider)
    logger.info("调试模式: %s", settings.debug)

    # P0-13: 启动时校验 LLM key 配置，避免第一次调用时才发现缺失（重试 14 秒）
    llm_service = get_llm_service()
    try:
        llm_service.validate_config()
        logger.info("[OK] LLM 配置校验通过 (provider=%s)", settings.llm_provider)
    except ValueError as e:
        if settings.allow_missing_llm_key:
            logger.warning(
                "[WARN] LLM 配置校验失败但已放行 (ALLOW_MISSING_LLM_KEY=true): %s", e
            )
            logger.warning(
                "[WARN] AI 调用将立即失败（不再做 14 秒重试），请配置正确的 API key 后重启"
            )
        else:
            logger.error("[FAIL] LLM 配置校验失败: %s", e)
            raise

    yield
    logger.info("=== %s 关闭 ===", settings.app_name)


app = FastAPI(
    title="11408 AI Service",
    version="1.0.0",
    description="11408 考研学习平台 AI 微服务",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(knowledge_extract.router, prefix="/ai", tags=["知识点提取"])
app.include_router(quiz_generate.router, prefix="/ai", tags=["测验生成"])
app.include_router(relation_suggest.router, prefix="/ai", tags=["关系分析"])
app.include_router(content_enhance.router, prefix="/ai", tags=["内容增强"])
app.include_router(pdf_parse.router, prefix="/ai", tags=["PDF解析"])
app.include_router(quiz_explain.router, prefix="/ai", tags=["AI讲题"])
app.include_router(study_plan.router, prefix="/ai", tags=["AI学习计划"])


@app.get("/ai/health")
async def health_check():
    return {
        "status": "ok",
        "service": settings.app_name,
        "llm_provider": settings.llm_provider,
    }
