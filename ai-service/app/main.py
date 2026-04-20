import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    knowledge_extract,
    quiz_generate,
    relation_suggest,
    content_enhance,
    pdf_parse,
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


@app.get("/ai/health")
async def health_check():
    return {
        "status": "ok",
        "service": settings.app_name,
        "llm_provider": settings.llm_provider,
    }
