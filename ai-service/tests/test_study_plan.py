"""AI 学习计划生成接口单测。

LLM 通过 mock.patch 替换，不真实调用 DeepSeek。
覆盖：Pydantic 校验、prompt 注入、HTTP happy path、HTTP 解析失败 → 400。
"""

import json
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.models.study_plan import StudyPlanRequest
from app.services.study_plan_service import (
    StudyPlanService,
    build_user_prompt,
)


# ---------- Pydantic validation ----------

def test_request_rejects_weeks_zero():
    with pytest.raises(ValidationError):
        StudyPlanRequest(goal="冲 408", weeks=0)


def test_request_rejects_weeks_too_large():
    with pytest.raises(ValidationError):
        StudyPlanRequest(goal="冲 408", weeks=53)


def test_request_accepts_minimal_payload():
    req = StudyPlanRequest(goal="数学一 130", weeks=12)
    assert req.weeks == 12
    assert req.weak_topics is None


# ---------- prompt 构造 ----------

def test_user_prompt_includes_goal_and_weeks():
    req = StudyPlanRequest(goal="考 408 目标 130 分", weeks=12)
    p = build_user_prompt(req)
    assert "考 408 目标 130 分" in p
    assert "12 周" in p


def test_user_prompt_includes_weak_topics_when_provided():
    req = StudyPlanRequest(
        goal="冲刺",
        weeks=4,
        weak_topics=["B+ 树", "图的最短路", "TCP 拥塞控制"],
    )
    p = build_user_prompt(req)
    assert "B+ 树" in p
    assert "图的最短路" in p
    assert "TCP 拥塞控制" in p
    assert "薄弱主题" in p


def test_user_prompt_includes_subject_and_progress():
    req = StudyPlanRequest(
        goal="冲刺",
        weeks=4,
        subject_name="408 计算机专业基础",
        studied_nodes=80,
        total_nodes=200,
    )
    p = build_user_prompt(req)
    assert "408 计算机专业基础" in p
    assert "80" in p and "200" in p


def test_user_prompt_omits_optional_blocks_when_absent():
    req = StudyPlanRequest(goal="冲刺", weeks=2)
    p = build_user_prompt(req)
    # 用方括号标签前缀避免误匹配 JSON schema 示例里的描述文字
    assert "【薄弱主题" not in p
    assert "【主攻学科】" not in p
    assert "【当前进度】" not in p


# ---------- service.generate ----------

@pytest.mark.asyncio
async def test_generate_passes_weak_topics_into_prompt():
    fake_llm = AsyncMock()
    fake_llm.generate.return_value = json.dumps([
        {
            "week": 1,
            "title": "B+ 树补强",
            "goals": ["掌握 B+ 树插入", "掌握 B+ 树删除"],
            "daily_tasks": ["周一 阅读", "周二 习题", "周三 复盘"],
            "review_focus": ["B+ 树"],
        },
    ])

    service = StudyPlanService(fake_llm)
    req = StudyPlanRequest(
        goal="408 130 分",
        weeks=1,
        weak_topics=["B+ 树"],
    )
    resp = await service.generate(req)

    fake_llm.generate.assert_awaited_once()
    args, kwargs = fake_llm.generate.call_args
    sent_prompt = args[0]
    assert "B+ 树" in sent_prompt
    assert "408 130 分" in sent_prompt
    assert resp.plan[0].title == "B+ 树补强"
    assert resp.plan[0].review_focus == ["B+ 树"]


@pytest.mark.asyncio
async def test_generate_accepts_object_with_summary_and_plan():
    fake_llm = AsyncMock()
    fake_llm.generate.return_value = json.dumps({
        "summary": "节奏稳健，重点补图论。",
        "plan": [
            {
                "week": 1,
                "title": "图论基础",
                "goals": ["DFS / BFS", "最短路"],
                "daily_tasks": ["周一", "周二", "周三"],
            }
        ],
    })

    service = StudyPlanService(fake_llm)
    req = StudyPlanRequest(goal="冲", weeks=1)
    resp = await service.generate(req)

    assert resp.summary == "节奏稳健，重点补图论。"
    assert len(resp.plan) == 1
    assert resp.plan[0].week == 1


@pytest.mark.asyncio
async def test_generate_raises_value_error_on_unparsable_llm_response():
    fake_llm = AsyncMock()
    fake_llm.generate.return_value = "我无法返回 JSON，对不起。"

    service = StudyPlanService(fake_llm)
    req = StudyPlanRequest(goal="冲", weeks=1)
    with pytest.raises(ValueError):
        await service.generate(req)


@pytest.mark.asyncio
async def test_generate_raises_value_error_on_missing_required_field():
    # 缺 goals → WeekPlan 校验失败 → ValueError
    fake_llm = AsyncMock()
    fake_llm.generate.return_value = json.dumps([
        {"week": 1, "title": "x", "daily_tasks": ["a"]}
    ])

    service = StudyPlanService(fake_llm)
    req = StudyPlanRequest(goal="冲", weeks=1)
    with pytest.raises(ValueError):
        await service.generate(req)


# ---------- HTTP 路由 ----------

def test_endpoint_returns_200_on_happy_path():
    fake_service = AsyncMock(spec=StudyPlanService)
    from app.models.study_plan import StudyPlanResponse, WeekPlan

    fake_service.generate.return_value = StudyPlanResponse(
        plan=[
            WeekPlan(
                week=1,
                title="数据结构基础",
                goals=["线性表", "栈与队列"],
                daily_tasks=["周一 阅读", "周二 题目"],
            )
        ],
        summary=None,
    )

    with patch(
        "app.routers.study_plan.get_study_plan_service",
        return_value=fake_service,
    ):
        client = TestClient(app)
        resp = client.post(
            "/ai/study-plan",
            json={"goal": "考 408 目标 130 分", "weeks": 1},
        )

    assert resp.status_code == 200
    body = resp.json()
    assert len(body["plan"]) == 1
    assert body["plan"][0]["week"] == 1
    assert body["plan"][0]["title"] == "数据结构基础"


def test_endpoint_returns_400_on_value_error():
    fake_service = AsyncMock(spec=StudyPlanService)
    fake_service.generate.side_effect = ValueError("AI 返回非 JSON")
    with patch(
        "app.routers.study_plan.get_study_plan_service",
        return_value=fake_service,
    ):
        client = TestClient(app)
        resp = client.post(
            "/ai/study-plan",
            json={"goal": "x", "weeks": 4},
        )
    assert resp.status_code == 400
    assert "AI" in resp.json()["detail"]


def test_endpoint_returns_422_when_weeks_invalid():
    # weeks=0 应被 Pydantic 拒，返回 422
    client = TestClient(app)
    resp = client.post(
        "/ai/study-plan",
        json={"goal": "冲", "weeks": 0},
    )
    assert resp.status_code == 422


def test_endpoint_returns_422_when_weeks_too_large():
    client = TestClient(app)
    resp = client.post(
        "/ai/study-plan",
        json={"goal": "冲", "weeks": 53},
    )
    assert resp.status_code == 422
