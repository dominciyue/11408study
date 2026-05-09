"""学习计划生成请求/响应模型。"""

from typing import Optional

from pydantic import BaseModel, Field


class StudyPlanRequest(BaseModel):
    """用户提交的学习计划生成请求。"""

    goal: str = Field(..., description="用户目标，如\"考 408，目标 130 分\"")
    weeks: int = Field(..., ge=1, le=52, description="计划跨度，单位周（1-52）")
    subject_name: Optional[str] = Field(
        None, description="学科名（如\"408 计算机专业基础\"）"
    )
    weak_topics: Optional[list[str]] = Field(
        None, description="用户薄弱主题名（用于针对性安排复习）"
    )
    studied_nodes: Optional[int] = Field(
        None, description="已学知识点总数（用于估计基础水平）"
    )
    total_nodes: Optional[int] = Field(
        None, description="知识点总数（用于估计剩余进度）"
    )


class WeekPlan(BaseModel):
    """单周学习计划。"""

    week: int = Field(..., description="第几周，从 1 开始")
    title: str = Field(..., description="一周主题，如\"数据结构基础 + 线性表\"")
    goals: list[str] = Field(..., description="本周目标 (3-5 条)")
    daily_tasks: list[str] = Field(..., description="每日任务示例 (5-7 条)")
    review_focus: Optional[list[str]] = Field(
        None, description="本周重点复习的薄弱知识点"
    )


class StudyPlanResponse(BaseModel):
    plan: list[WeekPlan]
    summary: Optional[str] = Field(None, description="整体计划简介")
