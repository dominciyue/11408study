from typing import Optional

from pydantic import BaseModel, Field


class PDFParseRequest(BaseModel):
    file_url: str = Field(..., max_length=2000)
    subject: Optional[str] = Field(default=None, max_length=100)


class PDFChunk(BaseModel):
    content: str
    page_number: int
    section_title: Optional[str] = None


class PDFParseResponse(BaseModel):
    chunks: list[PDFChunk]
    total_pages: int
    title: Optional[str] = None
