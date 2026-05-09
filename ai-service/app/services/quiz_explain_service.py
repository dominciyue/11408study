import logging

from app.models.quiz_explain import (
    ExplainQuestionRequest,
    ChatMessage,
)
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = (
    "你是一位耐心、富有启发性的考研辅导老师，擅长帮学生从错题中真正理解概念。"
    "面对学生的错题：\n"
    "1. 先简短肯定学生的思考方向（如有），再具体指出他选项的问题，避免直接说\"你错了\"。\n"
    "2. 引导学生回到核心概念，逐步推出正确答案的推理。\n"
    "3. 如给出了相关知识点上下文，结合上下文解释，避免空泛。\n"
    "4. 简洁、口语化中文（≤300 字），避免冗长说教。\n"
    "5. 结尾鼓励学生提出后续疑问。"
)


def build_initial_user_prompt(req: ExplainQuestionRequest) -> str:
    parts: list[str] = []
    if req.knowledge_node:
        parts.append(f"【相关知识点】{req.knowledge_node.title}")
        if req.knowledge_node.content:
            parts.append(f"概念说明：{req.knowledge_node.content[:400]}")
    parts.append(f"【题目】{req.question.content}")
    if req.question.options:
        parts.append("【选项】\n" + "\n".join(req.question.options))
    parts.append(f"【正确答案】{req.question.correct_answer}")
    if req.question.stored_explanation:
        parts.append(f"【参考解析】{req.question.stored_explanation}")
    parts.append(f"【我的作答】{req.user_answer}")
    parts.append("请先指出我选项的具体问题，再用启发式方法引导我推出正确答案。")
    return "\n\n".join(parts)


class QuizExplainService:
    def __init__(self, llm_service: LLMService):
        self.llm = llm_service

    async def explain(self, req: ExplainQuestionRequest) -> str:
        if not req.history:
            prompt = build_initial_user_prompt(req)
            logger.info(
                "AI 讲题 first-turn, 题型=%s, 用户答=%s",
                req.question.question_type,
                req.user_answer[:30],
            )
            return await self.llm.generate(prompt, system_prompt=SYSTEM_PROMPT)

        if req.history[-1].role != "user":
            raise ValueError("history 最后一条必须是 role=user 的待回复消息")

        messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages.append(
            {"role": "user", "content": build_initial_user_prompt(req)}
        )
        for m in req.history:
            messages.append({"role": m.role, "content": m.content})

        logger.info(
            "AI 讲题 follow-up, history len=%d, 最新追问=%s",
            len(req.history),
            req.history[-1].content[:30],
        )
        return await self.llm.chat(messages)
