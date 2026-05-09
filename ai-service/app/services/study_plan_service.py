"""学习计划生成服务。

设计要点：
1. SYSTEM_PROMPT 把 LLM 定位为 "考研规划老师"，强调输出严格 JSON。
2. 用户 prompt 注入 goal / weeks / subject_name / weak_topics / 进度，
   让 LLM 据此个性化排周。
3. LLM 必须返回 JSON 数组（每个元素是 WeekPlan），解析失败抛 ValueError，
   Router 会转 400。
4. 复用 knowledge_service._parse_json_response，把可能包裹的 markdown
   代码块剥掉再 json.loads。
"""

import logging

from app.models.study_plan import (
    StudyPlanRequest,
    StudyPlanResponse,
    WeekPlan,
)
from app.services.knowledge_service import _parse_json_response
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = (
    "你是一位经验丰富的中国考研规划老师，擅长为不同基础的学生制订可执行的周计划。"
    "你需要：\n"
    "1. 根据学生目标、剩余周数、薄弱主题与学习进度，输出分周学习方案。\n"
    "2. 节奏要现实：循序渐进、留出复习与冲刺周，避免一周塞满 30 个新知识点。\n"
    "3. 若给出薄弱主题，必须在前 1/3 的周次里安排针对性复习。\n"
    "4. 每周给出 3-5 条 goals（本周宏观目标）和 5-7 条 daily_tasks "
    "（具体到 \"周一-周日\" 任务示例，可重复）。\n"
    "5. 必须严格以 JSON 数组返回，不要任何额外说明文字、Markdown 或前后缀。\n"
    "6. 全程使用简体中文。"
)


def build_user_prompt(req: StudyPlanRequest) -> str:
    """根据请求构造 LLM 用户消息。把所有可选信息逐条注入。"""
    parts: list[str] = []
    parts.append(f"【学习目标】{req.goal}")
    parts.append(f"【计划周数】{req.weeks} 周")
    if req.subject_name:
        parts.append(f"【主攻学科】{req.subject_name}")
    if req.weak_topics:
        parts.append(
            "【薄弱主题（请在计划中重点安排复习）】\n"
            + "\n".join(f"- {t}" for t in req.weak_topics)
        )
    if req.studied_nodes is not None and req.total_nodes is not None:
        parts.append(
            f"【当前进度】已学 {req.studied_nodes} / {req.total_nodes} 个知识点"
        )
    elif req.studied_nodes is not None:
        parts.append(f"【已学知识点数】{req.studied_nodes}")

    parts.append(
        "请生成 {n} 周的学习计划，严格以 JSON 数组返回，每个元素结构为：\n"
        "{{\n"
        '  "week": 1,\n'
        '  "title": "本周主题",\n'
        '  "goals": ["目标1", "目标2", ...],\n'
        '  "daily_tasks": ["周一: ...", "周二: ...", ...],\n'
        '  "review_focus": ["薄弱知识点1", ...]    // 可选，无可省略\n'
        "}}\n"
        "注意：\n"
        "- week 字段从 1 递增到 {n}，不能漏周不能重复。\n"
        "- 如未提供薄弱主题，可省略 review_focus。\n"
        "- 不要返回任何额外文本，只返回纯 JSON 数组。".format(n=req.weeks)
    )
    return "\n\n".join(parts)


class StudyPlanService:
    def __init__(self, llm_service: LLMService):
        self.llm = llm_service

    async def generate(self, req: StudyPlanRequest) -> StudyPlanResponse:
        prompt = build_user_prompt(req)
        logger.info(
            "生成学习计划: weeks=%d, subject=%s, weak_topics=%d, goal=%s",
            req.weeks,
            req.subject_name,
            len(req.weak_topics) if req.weak_topics else 0,
            req.goal[:30],
        )
        response = await self.llm.generate(prompt, system_prompt=SYSTEM_PROMPT)

        try:
            parsed = _parse_json_response(response)
        except Exception as e:
            logger.warning("LLM 返回内容无法解析为 JSON: %s ; 原始: %s", e, response[:200])
            raise ValueError(f"AI 返回的计划无法解析为 JSON: {e}")

        # 兼容两种格式：1) 顶层数组（即 plan 数组）；2) 顶层对象包含 plan + summary。
        summary: str | None = None
        plan_data: list
        if isinstance(parsed, list):
            plan_data = parsed
        elif isinstance(parsed, dict):
            plan_data = parsed.get("plan") or parsed.get("weeks") or []
            if "summary" in parsed and isinstance(parsed["summary"], str):
                summary = parsed["summary"]
        else:
            raise ValueError(f"AI 返回的不是数组或对象: {type(parsed).__name__}")

        if not isinstance(plan_data, list) or not plan_data:
            raise ValueError("AI 返回的 plan 为空或不是数组")

        try:
            plan = [WeekPlan(**item) for item in plan_data]
        except Exception as e:
            logger.warning("WeekPlan 字段校验失败: %s", e)
            raise ValueError(f"AI 返回的周计划字段不合法: {e}")

        logger.info("成功生成 %d 周学习计划", len(plan))
        return StudyPlanResponse(plan=plan, summary=summary)
