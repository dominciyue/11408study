"""知识点抽取接口单测：覆盖 source_excerpt 字段。

LLM 通过 mock.patch 替换，不真实调用 DeepSeek。
"""

import json
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.knowledge import (
    Difficulty,
    ExtractionResponse,
    KnowledgePoint,
)
from app.services.knowledge_service import KnowledgeService


# ---------- model 反序列化 ----------

def test_knowledge_point_accepts_source_excerpt():
    """LLM 返回 source_excerpt 时，KnowledgePoint 应能正常构造。"""
    kp = KnowledgePoint(
        title="栈",
        content="LIFO 结构",
        difficulty=Difficulty.EASY,
        source_excerpt="栈是一种后进先出的线性表。",
    )
    assert kp.source_excerpt == "栈是一种后进先出的线性表。"


def test_knowledge_point_source_excerpt_optional():
    """老 LLM 回包不含 source_excerpt 时，应默认 None，向后兼容。"""
    kp = KnowledgePoint(
        title="队列",
        content="FIFO 结构",
        difficulty=Difficulty.EASY,
    )
    assert kp.source_excerpt is None


def test_extraction_response_round_trip_with_excerpt():
    """ExtractionResponse 整体 dump/load 不丢 source_excerpt。"""
    resp = ExtractionResponse(
        knowledge_points=[
            KnowledgePoint(
                title="哈希表",
                content="基于散列函数的键值存储",
                difficulty=Difficulty.MEDIUM,
                source_excerpt="哈希表通过散列函数将键映射到桶。",
            )
        ],
        raw_text="原文片段",
    )
    payload = json.loads(resp.model_dump_json())
    assert payload["knowledge_points"][0]["source_excerpt"] == (
        "哈希表通过散列函数将键映射到桶。"
    )


# ---------- service.extract_knowledge ----------

@pytest.mark.asyncio
async def test_extract_knowledge_propagates_source_excerpt_from_llm():
    """LLM 返回带 source_excerpt 的 JSON 数组时，service 应原样透传。"""
    fake_llm = AsyncMock()
    fake_llm.generate.return_value = json.dumps(
        [
            {
                "title": "二叉树",
                "content": "每个节点最多两个子节点",
                "difficulty": "EASY",
                "source_excerpt": "二叉树是每个节点至多有两个子节点的树。",
            }
        ],
        ensure_ascii=False,
    )

    service = KnowledgeService(fake_llm)
    points = await service.extract_knowledge("文本", subject="408")

    assert len(points) == 1
    assert points[0]["source_excerpt"] == "二叉树是每个节点至多有两个子节点的树。"


@pytest.mark.asyncio
async def test_extract_knowledge_prompt_asks_for_source_excerpt():
    """service 必须在 prompt 中显式要求 LLM 返回 source_excerpt 字段。"""
    fake_llm = AsyncMock()
    fake_llm.generate.return_value = "[]"

    service = KnowledgeService(fake_llm)
    await service.extract_knowledge("文本")

    fake_llm.generate.assert_awaited_once()
    sent_prompt = fake_llm.generate.call_args.args[0]
    assert "source_excerpt" in sent_prompt


# ---------- HTTP 路由 ----------

def test_extract_endpoint_returns_source_excerpt_in_response():
    """/ai/extract 端到端：mock LLM → 响应 JSON 应能被 ExtractionResponse 反序列化，
    且包含 source_excerpt 字段。"""
    fake_service = AsyncMock(spec=KnowledgeService)
    fake_service.extract_knowledge.return_value = [
        {
            "title": "线性表",
            "content": "数据元素的有限序列",
            "difficulty": "EASY",
            "source_excerpt": "线性表是 n 个具有相同特性数据元素的有限序列。",
        }
    ]
    with patch(
        "app.routers.knowledge_extract.get_knowledge_service",
        return_value=fake_service,
    ):
        client = TestClient(app)
        resp = client.post(
            "/ai/extract",
            json={"text": "原文内容..."},
        )

    assert resp.status_code == 200
    body = resp.json()
    assert len(body["knowledge_points"]) == 1
    assert body["knowledge_points"][0]["source_excerpt"] == (
        "线性表是 n 个具有相同特性数据元素的有限序列。"
    )
    # 反向反序列化验证：ExtractionResponse 不会因 source_excerpt 报错
    parsed = ExtractionResponse(**body)
    assert parsed.knowledge_points[0].source_excerpt is not None
