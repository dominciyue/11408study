"""
错题归类服务 — 用 LLM 给一条错题打 5 类标签之一。

设计要点:
- prompt 小巧:1 题 ≈ 500 tokens 输入 / 50 tokens 输出,成本可控
- 强制 JSON 输出,失败时降级到 KNOWLEDGE_GAP(最保守的兜底)
- 单题独立调用,不批量(批量 prompt 难以可靠保证逐条 1-of-5 顺序对齐)
"""
import json
import logging
import re
from typing import Optional

from app.models.wrong_answer_classify import (
    ErrorCategory,
    WrongAnswerClassifyRequest,
    WrongAnswerClassifyResponse,
)
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

ALLOWED: tuple[ErrorCategory, ...] = (
    "CONCEPT_UNCLEAR",
    "CALCULATION_ERROR",
    "MISREAD_QUESTION",
    "KNOWLEDGE_GAP",
    "UNFAMILIAR_TYPE",
)

SYSTEM_PROMPT = (
    "你是一位中国研究生入学考试(考研)的错题分析助手。"
    "学生答错一道题后,你需要把"错因"归类到下列 5 类之一:\n"
    "1. CONCEPT_UNCLEAR(概念不清) — 对题面涉及的基础概念/定义把握不准\n"
    "2. CALCULATION_ERROR(计算失误) — 思路对但运算/笔误出错\n"
    "3. MISREAD_QUESTION(审题偏差) — 看错题目要求/限制条件/范围\n"
    "4. KNOWLEDGE_GAP(知识盲区) — 完全没学过相关知识点\n"
    "5. UNFAMILIAR_TYPE(题型陌生) — 知识点会但题型套路不熟\n\n"
    "严格只输出一个 JSON 对象,字段:\n"
    '{"category": "<上面 5 个英文键之一>", "reason": "<≤80 字的中文一句话理由>"}'
)


class WrongAnswerClassifyService:
    def __init__(self, llm_service: LLMService):
        self.llm = llm_service

    async def classify(self, req: WrongAnswerClassifyRequest) -> WrongAnswerClassifyResponse:
        user_prompt = self._build_user_prompt(req)

        try:
            raw = await self.llm.chat(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
        except Exception as e:
            logger.warning("classify LLM call failed: %s", e)
            return WrongAnswerClassifyResponse(
                category="KNOWLEDGE_GAP",
                reason="AI 暂时不可用,默认归为知识盲区供后续重判",
            )

        parsed = self._parse(raw)
        if parsed is None:
            logger.warning("classify LLM returned unparseable output: %s", raw[:200])
            return WrongAnswerClassifyResponse(
                category="KNOWLEDGE_GAP",
                reason="AI 输出解析失败,默认归为知识盲区供后续重判",
            )
        return parsed

    @staticmethod
    def _build_user_prompt(req: WrongAnswerClassifyRequest) -> str:
        parts: list[str] = []
        parts.append(f"【题目】\n{req.question_text}")
        if req.options:
            parts.append("【选项】\n" + "\n".join(f"- {o}" for o in req.options))
        parts.append(f"【正确答案】{req.correct_answer}")
        parts.append(f"【学生答案】{req.user_answer}")
        if req.explanation:
            parts.append(f"【题目解析(参考)】\n{req.explanation}")
        parts.append("\n请判断学生的错因并按要求只输出 JSON。")
        return "\n\n".join(parts)

    @staticmethod
    def _parse(raw: str) -> Optional[WrongAnswerClassifyResponse]:
        if not raw:
            return None
        # LLM 可能包 ```json ... ``` 围栏或前后带文字,先抠 JSON
        match = re.search(r"\{[^{}]*\}", raw, re.DOTALL)
        if not match:
            return None
        try:
            obj = json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
        cat = obj.get("category")
        if cat not in ALLOWED:
            return None
        reason = str(obj.get("reason", ""))[:200]
        return WrongAnswerClassifyResponse(category=cat, reason=reason or "AI 归类")
