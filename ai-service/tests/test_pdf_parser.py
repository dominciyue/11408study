import pytest

from app.services.pdf_parser import PDFParserService


@pytest.mark.asyncio
async def test_extract_sections_splits_on_headings():
    svc = PDFParserService()
    text = "\n".join(
        [
            "第一章 绪论",
            "这是第一章内容A",
            "这是第一章内容B",
            "第二章 基础",
            "这是第二章内容",
        ]
    )
    sections = svc.extract_sections(text)
    assert len(sections) >= 2
    assert "第一章" in (sections[0]["title"] or "")
    assert "内容A" in sections[0]["content"]

