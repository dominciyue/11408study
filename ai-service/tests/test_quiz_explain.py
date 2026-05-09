"""AI 讲题接口单测。LLM 通过 mock.patch 替换，不真实调用 DeepSeek。"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.quiz_explain import (
    ChatMessage,
    ExplainQuestionRequest,
    KnowledgeNodeContext,
    QuizQuestionContext,
)
from app.services.quiz_explain_service import (
    QuizExplainService,
    build_initial_user_prompt,
)


# ---------- prompt 构造逻辑 ----------

def test_initial_prompt_includes_question_options_and_user_answer():
    req = ExplainQuestionRequest(
        question=QuizQuestionContext(
            content="栈的特性是？",
            options=["A. FIFO", "B. LIFO", "C. 随机", "D. 双端"],
            correct_answer="B",
        ),
        user_answer="A",
    )
    prompt = build_initial_user_prompt(req)
    assert "栈的特性是？" in prompt
    assert "FIFO" in prompt and "LIFO" in prompt
    assert "正确答案】B" in prompt
    assert "我的作答】A" in prompt


def test_initial_prompt_includes_knowledge_node_when_provided():
    req = ExplainQuestionRequest(
        question=QuizQuestionContext(content="题", correct_answer="X"),
        user_answer="Y",
        knowledge_node=KnowledgeNodeContext(title="栈", content="LIFO 数据结构"),
    )
    prompt = build_initial_user_prompt(req)
    assert "栈" in prompt
    assert "LIFO 数据结构" in prompt


def test_initial_prompt_omits_knowledge_node_when_absent():
    req = ExplainQuestionRequest(
        question=QuizQuestionContext(content="题", correct_answer="X"),
        user_answer="Y",
    )
    prompt = build_initial_user_prompt(req)
    assert "相关知识点" not in prompt


# ---------- service.explain ----------

@pytest.mark.asyncio
async def test_explain_first_turn_calls_generate():
    fake_llm = AsyncMock()
    fake_llm.generate.return_value = "这是 AI 的解答..."

    service = QuizExplainService(fake_llm)
    req = ExplainQuestionRequest(
        question=QuizQuestionContext(content="题", correct_answer="B"),
        user_answer="A",
    )
    reply = await service.explain(req)

    assert reply == "这是 AI 的解答..."
    fake_llm.generate.assert_awaited_once()
    fake_llm.chat.assert_not_called()


@pytest.mark.asyncio
async def test_explain_followup_calls_chat_with_full_history():
    fake_llm = AsyncMock()
    fake_llm.chat.return_value = "针对追问的更细致回答..."

    service = QuizExplainService(fake_llm)
    req = ExplainQuestionRequest(
        question=QuizQuestionContext(content="题", correct_answer="B"),
        user_answer="A",
        history=[
            ChatMessage(role="user", content="（initial 占位 — 实际服务端重建）"),
            ChatMessage(role="assistant", content="先前 AI 回复"),
            ChatMessage(role="user", content="为什么不选 C？"),
        ],
    )
    reply = await service.explain(req)

    assert reply == "针对追问的更细致回答..."
    fake_llm.chat.assert_awaited_once()
    args, _ = fake_llm.chat.call_args
    sent_messages = args[0]
    # system + initial-question + 3 history messages = 5
    assert len(sent_messages) == 5
    assert sent_messages[0]["role"] == "system"
    assert sent_messages[1]["role"] == "user"  # rebuilt initial question prompt
    assert sent_messages[-1]["role"] == "user"
    assert "为什么不选 C？" in sent_messages[-1]["content"]


@pytest.mark.asyncio
async def test_explain_followup_rejects_history_not_ending_in_user():
    service = QuizExplainService(AsyncMock())
    req = ExplainQuestionRequest(
        question=QuizQuestionContext(content="题", correct_answer="B"),
        user_answer="A",
        history=[
            ChatMessage(role="user", content="问"),
            ChatMessage(role="assistant", content="答"),
        ],
    )
    with pytest.raises(ValueError, match="role=user"):
        await service.explain(req)


# ---------- HTTP 路由 ----------

def test_explain_endpoint_returns_200_and_reply():
    fake_service = AsyncMock(spec=QuizExplainService)
    fake_service.explain.return_value = "AI 答复内容"
    with patch(
        "app.routers.quiz_explain.get_quiz_explain_service",
        return_value=fake_service,
    ):
        client = TestClient(app)
        resp = client.post(
            "/ai/explain-question",
            json={
                "question": {"content": "题", "correct_answer": "B"},
                "user_answer": "A",
            },
        )
    assert resp.status_code == 200
    assert resp.json() == {"reply": "AI 答复内容"}


def test_explain_endpoint_returns_400_on_value_error():
    fake_service = AsyncMock(spec=QuizExplainService)
    fake_service.explain.side_effect = ValueError("history 必须以 user 结尾")
    with patch(
        "app.routers.quiz_explain.get_quiz_explain_service",
        return_value=fake_service,
    ):
        client = TestClient(app)
        resp = client.post(
            "/ai/explain-question",
            json={
                "question": {"content": "题", "correct_answer": "B"},
                "user_answer": "A",
                "history": [
                    {"role": "user", "content": "x"},
                    {"role": "assistant", "content": "y"},
                ],
            },
        )
    assert resp.status_code == 400
    assert "history" in resp.json()["detail"]
