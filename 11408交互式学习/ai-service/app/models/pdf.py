from typing import Optional

from pydantic import BaseModel


class PDFParseRequest(BaseModel):
    file_url: str
    subject: Optional[str] = None


class PDFChunk(BaseModel):
    content: str
    page_number: int
    section_title: Optional[str] = None


class PDFParseResponse(BaseModel):
    chunks: list[PDFChunk]
    total_pages: int
    title: Optional[str] = None
