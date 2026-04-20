"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  RotateCcw,
  Route,
  Sparkles,
  Clock,
  Target,
  Brain,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const studyModes = [
  {
    title: "智能推荐",
    description: "基于你的学习进度和薄弱点，AI 智能推荐今日学习内容",
    icon: Sparkles,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    badge: "推荐",
    badgeColor: "bg-purple-500/20 text-purple-400",
  },
  {
    title: "复习队列",
    description: "基于间隔重复算法（SM-2），自动生成今日复习队列",
    icon: RotateCcw,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    badge: "8 待复习",
    badgeColor: "bg-orange-500/20 text-orange-400",
  },
  {
    title: "学习路径",
    description: "按知识图谱拓扑排序，从基础到进阶系统化学习",
    icon: Route,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    badge: "系统学习",
    badgeColor: "bg-blue-500/20 text-blue-400",
  },
  {
    title: "自由学习",
    description: "自由选择学科和知识点，按自己的节奏学习",
    icon: BookOpen,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    badge: "自由模式",
    badgeColor: "bg-green-500/20 text-green-400",
  },
];

const recentStudy = [
  { title: "栈和队列", subject: "数据结构", time: "2小时前", mastery: 75 },
  { title: "进程同步", subject: "操作系统", time: "5小时前", mastery: 45 },
  { title: "TCP三次握手", subject: "计算机网络", time: "昨天", mastery: 60 },
  { title: "矩阵运算", subject: "线性代数", time: "昨天", mastery: 30 },
];

export default function StudyPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="w-7 h-7 text-blue-400" />
            学习模式
          </h1>
          <p className="text-gray-400 mt-1">选择适合你的学习方式</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>今日已学 2.5h</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Target className="w-4 h-4" />
            <span>已学 12 个知识点</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {studyModes.map((mode) => (
          <Card
            key={mode.title}
            className={`border ${mode.borderColor} hover:scale-[1.01] transition-all duration-300 cursor-pointer group`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${mode.bgColor} shrink-0`}>
                  <mode.icon className={`w-6 h-6 ${mode.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-100">{mode.title}</h3>
                    <Badge className={mode.badgeColor}>{mode.badge}</Badge>
                  </div>
                  <p className="text-sm text-gray-400">{mode.description}</p>
                </div>
              </div>
              <Button
                className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/[0.08] text-gray-300"
                variant="outline"
              >
                <Zap className="w-4 h-4 mr-2" />
                开始学习
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4">最近学习</h2>
        <div className="space-y-2">
          {recentStudy.map((item, idx) => (
            <Card key={idx} className="border-white/[0.06] hover:border-white/[0.12] transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg font-bold text-gray-500">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.subject} · {item.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-300">{item.mastery}%</p>
                    <p className="text-xs text-gray-500">掌握度</p>
                  </div>
                  <div className="w-16 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${item.mastery}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
