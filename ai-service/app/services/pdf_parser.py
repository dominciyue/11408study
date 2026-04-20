import re
import logging
from typing import Optional

import httpx
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

HEADING_PATTERNS = [
    re.compile(r"^第[一二三四五六七八九十百千\d]+[章节篇部]"),
    re.compile(r"^\d+[\.\、]\d*\s*"),
    re.compile(r"^[一二三四五六七八九十]+[\、\.\s]"),
    re.compile(r"^Chapter\s+\d+", re.IGNORECASE),
]


class PDFParserService:
    async def parse_pdf(self, file_url: str) -> dict:
        logger.info("开始下载 PDF: %s", file_url)
        pdf_bytes = await self._download_pdf(file_url)

        logger.info("开始解析 PDF 内容")
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)
        title = doc.metadata.get("title") if doc.metadata else None

        chunks = []
        for page_num in range(total_pages):
            page = doc.load_page(page_num)
            text = page.get_text("text").strip()
            if not text:
                continue

            sections = self.extract_sections(text)
            if sections:
                for section in sections:
                    chunks.append(
                        {
                            "content": section["content"],
                            "page_number": page_num + 1,
                            "section_title": section.get("title"),
                        }
                    )
            else:
                chunks.append(
                    {
                        "content": text,
                        "page_number": page_num + 1,
                        "section_title": None,
                    }
                )

        doc.close()
        logger.info("PDF 解析完成，共 %d 页，%d 个文本块", total_pages, len(chunks))

        return {
            "chunks": chunks,
            "total_pages": total_pages,
            "title": title if title else None,
        }

    def extract_sections(self, text: str) -> list[dict]:
        lines = text.split("\n")
        sections: list[dict] = []
        current_title: Optional[str] = None
        current_lines: list[str] = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            is_heading = any(p.match(stripped) for p in HEADING_PATTERNS)

            if is_heading:
                if current_lines:
                    sections.append(
                        {
                            "title": current_title,
                            "content": "\n".join(current_lines).strip(),
                        }
                    )
                current_title = stripped
                current_lines = []
            else:
                current_lines.append(stripped)

        if current_lines:
            sections.append(
                {
                    "title": current_title,
                    "content": "\n".join(current_lines).strip(),
                }
            )

        return sections

    async def _download_pdf(self, file_url: str) -> bytes:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(file_url)
            response.raise_for_status()
            return response.content
