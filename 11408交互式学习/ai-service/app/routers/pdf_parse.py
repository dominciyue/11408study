import logging

from fastapi import APIRouter, HTTPException
import httpx

from app.models.pdf import PDFParseRequest, PDFParseResponse, PDFChunk
from app.dependencies import get_pdf_parser_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/parse-pdf", response_model=PDFParseResponse)
async def parse_pdf(request: PDFParseRequest):
    """解析PDF文件并提取文本内容"""
    try:
        service = get_pdf_parser_service()
        result = await service.parse_pdf(file_url=request.file_url)
        chunks = [PDFChunk(**chunk) for chunk in result["chunks"]]
        return PDFParseResponse(
            chunks=chunks,
            total_pages=result["total_pages"],
            title=result.get("title"),
        )
    except (httpx.HTTPStatusError, httpx.ConnectError, httpx.TimeoutException) as e:
        logger.error("PDF 下载失败: %s", e)
        raise HTTPException(status_code=502, detail=f"PDF 文件下载失败: {e}")
    except Exception as e:
        logger.error("PDF 解析失败: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"PDF 解析失败: {e}")
