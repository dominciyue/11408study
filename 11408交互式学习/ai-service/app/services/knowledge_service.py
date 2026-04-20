import json
import re
import logging
from typing import Optional

from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "你是一个专业的考研辅导AI助手，专注于11408考研科目的知识点提取、整理和教学。"
    "请始终使用中文回答，并确保内容准确、专业、易于理解。"
    "当需要返回结构化数据时，请严格按照JSON格式返回，不要添加额外的说明文字。"
)


def _parse_json_response(text: str) -> list | dict:
    """Parse JSON from LLM response, handling markdown code blocks."""
    cleaned = text.strip()
    pattern = r"```(?:json)?\s*([\s\S]*?)```"
    match = re.search(pattern, cleaned)
    if match:
        cleaned = match.group(1).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        array_match = re.search(r"(\[[\s\S]*\])", cleaned)
        if array_match:
            return json.loads(array_match.group(1))
        obj_match = re.search(r"(\{[\s\S]*\})", cleaned)
        if obj_match:
            return json.loads(obj_match.group(1))
        raise


class KnowledgeService:
    def __init__(self, llm_service: LLMService):
        self.llm = llm_service

    async def extract_knowledge(
        self,
        text: str,
        subject: Optional[str] = None,
        topic: Optional[str] = None,
    ) -> list[dict]:
        subject_hint = f"，学科为「{subject}」" if subject else ""
        topic_hint = f"，主题为「{topic}」" if topic else ""

        prompt = (
            f"请从以下文本中提取关键知识点{subject_hint}{topic_hint}。\n\n"
            "对于每个知识点，请提供：\n"
            "- title: 知识点标题（简洁明了）\n"
            "- content: 详细内容说明（准确、完整）\n"
            "- difficulty: 难度等级（EASY / MEDIUM / HARD）\n"
            "- suggested_relations: 与其他概念的关系列表，每个关系包含：\n"
            "  - target_title: 相关知识点标题\n"
            "  - relation_type: 关系类型（PREREQUISITE / RELATED / EXTENDS / CROSS_SUBJECT）\n"
            "  - confidence: 置信度（0.0 ~ 1.0）\n\n"
            "请严格以JSON数组格式返回，不要包含其他文字。\n\n"
            f"--- 文本内容 ---\n{text}"
        )

        logger.info("开始提取知识点，文本长度: %d", len(text))
        response = await self.llm.generate(prompt, system_prompt=SYSTEM_PROMPT)
        knowledge_points = _parse_json_response(response)
        logger.info("成功提取 %d 个知识点", len(knowledge_points))
        return knowledge_points

    async def suggest_relations(self, knowledge_points: list[dict]) -> list[dict]:
        points_desc = "\n".join(
            f"- 「{kp['title']}」: {kp['content'][:100]}"
            for kp in knowledge_points
        )

        prompt = (
            "请分析以下知识点之间的关系，找出它们之间的内在联系。\n\n"
            f"知识点列表：\n{points_desc}\n\n"
            "对于每对有关系的知识点，请提供：\n"
            "- source_title: 来源知识点标题\n"
            "- target_title: 目标知识点标题\n"
            "- relation_type: 关系类型（PREREQUISITE: 前置知识 / RELATED: 相关联 / "
            "EXTENDS: 扩展延伸 / CROSS_SUBJECT: 跨学科关联）\n"
            "- confidence: 置信度（0.0 ~ 1.0）\n\n"
            "请严格以JSON数组格式返回，不要包含其他文字。"
        )

        logger.info("开始分析 %d 个知识点之间的关系", len(knowledge_points))
        response = await self.llm.generate(prompt, system_prompt=SYSTEM_PROMPT)
        relations = _parse_json_response(response)
        logger.info("发现 %d 个知识点关系", len(relations))
        return relations

    async def enhance_content(
        self, title: str, content: str, enhance_type: str
    ) -> str:
        type_prompts = {
            "EXPLAIN": (
                f"请对以下考研知识点进行详细的多角度解释，帮助学生深入理解。\n\n"
                f"知识点：「{title}」\n"
                f"内容：{content}\n\n"
                "请从以下角度进行解释：\n"
                "1. 概念本质：这个知识点的核心含义是什么？\n"
                "2. 来龙去脉：这个概念是如何产生的？背景是什么？\n"
                "3. 重点难点：学习这个知识点需要注意什么？\n"
                "4. 考试要点：考研中通常如何考察这个知识点？\n"
                "5. 常见误区：学生容易在哪些地方犯错？"
            ),
            "MNEMONIC": (
                f"请为以下考研知识点创建有效的记忆口诀或助记方法。\n\n"
                f"知识点：「{title}」\n"
                f"内容：{content}\n\n"
                "请提供：\n"
                "1. 简洁好记的口诀或顺口溜\n"
                "2. 联想记忆法（将抽象概念与具体形象关联）\n"
                "3. 关键词串联法\n"
                "4. 如有公式，提供公式记忆技巧\n"
                "要求：朗朗上口，容易记忆，且能准确涵盖核心要点。"
            ),
            "ANALOGY": (
                f"请用生动形象的类比来解释以下考研知识点，帮助学生直观理解。\n\n"
                f"知识点：「{title}」\n"
                f"内容：{content}\n\n"
                "请提供：\n"
                "1. 日常生活类比：用日常经验类比这个概念\n"
                "2. 形象化比喻：用生动的比喻描述核心原理\n"
                "3. 场景故事：编一个小故事来说明这个知识点\n"
                "要求：类比要贴切，不能为了生动而牺牲准确性。"
            ),
        }

        prompt = type_prompts.get(enhance_type, type_prompts["EXPLAIN"])
        logger.info("增强知识点内容: %s, 类型: %s", title, enhance_type)
        response = await self.llm.generate(prompt, system_prompt=SYSTEM_PROMPT)
        return response

    async def generate_quiz(
        self,
        title: str,
        content: str,
        question_type: str,
        count: int = 3,
        difficulty: Optional[str] = None,
    ) -> list[dict]:
        type_names = {
            "CHOICE": "选择题（单选，包含4个选项A/B/C/D）",
            "TRUE_FALSE": "判断题（答案为"正确"或"错误"）",
            "FILL_BLANK": "填空题（用____标记空白处）",
        }
        type_desc = type_names.get(question_type, type_names["CHOICE"])
        difficulty_hint = f"，难度要求为{difficulty}" if difficulty else ""

        prompt = (
            f"请根据以下知识点生成 {count} 道{type_desc}{difficulty_hint}。\n\n"
            f"知识点：「{title}」\n"
            f"内容：{content}\n\n"
            "对于每道题目，请提供：\n"
            "- question: 题目内容\n"
            f"- question_type: \"{question_type}\"\n"
        )

        if question_type == "CHOICE":
            prompt += "- options: 选项列表 [\"A. ...\", \"B. ...\", \"C. ...\", \"D. ...\"]\n"
        prompt += (
            "- answer: 正确答案\n"
            "- explanation: 详细解析（说明为什么这个答案是正确的）\n\n"
            "请严格以JSON数组格式返回，不要包含其他文字。"
        )

        logger.info("生成测验题目: %s, 题型: %s, 数量: %d", title, question_type, count)
        response = await self.llm.generate(prompt, system_prompt=SYSTEM_PROMPT)
        questions = _parse_json_response(response)
        logger.info("成功生成 %d 道题目", len(questions))
        return questions
