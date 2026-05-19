"""
错题"病因" AI 归类模型。
"""
from typing import Literal, Optional

from pydantic import BaseModel, Field

ErrorCategory = Literal[
    "CONCEPT_UNCLEAR",      # 概念不清 — 对题面涉及的基础概念/定义把握不准
    "CALCULATION_ERROR",    # 计算失误 — 思路对但运算/笔误出错
    "MISREAD_QUESTION",     # 审题偏差 — 看错题目要求/限制条件/范围
    "KNOWLEDGE_GAP",        # 知识盲区 — 完全没学过相关知识点
    "UNFAMILIAR_TYPE",      # 题型陌生 — 知识点会但题型套路不熟
]


class WrongAnswerClassifyRequest(BaseModel):
    """对一条错题做 1-of-5 归类。"""

    question_text: str = Field(..., max_length=4000, description="题目正文")
    options: Optional[list[str]] = Field(default=None, description="选择题的选项,可空")
    correct_answer: str = Field(..., max_length=2000)
    user_answer: str = Field(..., max_length=2000)
    explanation: Optional[str] = Field(default=None, max_length=4000, description="题目自带的解析,可空")


class WrongAnswerClassifyResponse(BaseModel):
    category: ErrorCategory
    reason: str = Field(..., max_length=200, description="一句话归类理由,中文,不超过 80 字")
