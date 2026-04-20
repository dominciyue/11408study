"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Languages,
  Calculator,
  Cpu,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const subjects = [
  {
    name: "政治",
    code: "politics",
    icon: BookOpen,
    color: "#ef4444",
    bgGradient: "from-red-500/20 to-red-600/5",
    borderColor: "border-red-500/20",
    textColor: "text-red-400",
    description: "马克思主义基本原理、毛中特、近代史纲要、思修法基、形势与政策",
    topics: ["马克思主义基本原理", "毛中特", "中国近现代史纲要", "思修与法基", "形势与政策"],
    progress: 35,
    nodeCount: 120,
    mastered: 42,
  },
  {
    name: "英语一",
    code: "english",
    icon: Languages,
    color: "#3b82f6",
    bgGradient: "from-blue-500/20 to-blue-600/5",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-400",
    description: "阅读理解、完形填空、翻译、写作、核心词汇",
    topics: ["阅读理解", "完形填空", "翻译", "写作", "核心词汇"],
    progress: 28,
    nodeCount: 95,
    mastered: 31,
  },
  {
    name: "数学一",
    code: "math",
    icon: Calculator,
    color: "#22c55e",
    bgGradient: "from-green-500/20 to-green-600/5",
    borderColor: "border-green-500/20",
    textColor: "text-green-400",
    description: "高等数学、线性代数、概率论与数理统计",
    topics: ["高等数学", "线性代数", "概率论与数理统计"],
    progress: 45,
    nodeCount: 180,
    mastered: 67,
  },
  {
    name: "408计算机专业基础",
    code: "cs408",
    icon: Cpu,
    color: "#a855f7",
    bgGradient: "from-purple-500/20 to-purple-600/5",
    borderColor: "border-purple-500/20",
    textColor: "text-purple-400",
    description: "数据结构、计算机组成原理、操作系统、计算机网络",
    topics: ["数据结构", "计算机组成原理", "操作系统", "计算机网络"],
    progress: 22,
    nodeCount: 200,
    mastered: 28,
  },
];

export default function SubjectsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-blue-400" />
          学科总览
        </h1>
        <p className="text-gray-400 mt-1">选择学科开始系统化学习</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subjects.map((subject) => (
          <Card
            key={subject.code}
            className={`border ${subject.borderColor} bg-gradient-to-br ${subject.bgGradient} hover:scale-[1.01] transition-all duration-300 cursor-pointer group`}
            onClick={() => router.push(`/graph?subject=${subject.code}`)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${subject.color}20` }}
                  >
                    <subject.icon className="w-6 h-6" style={{ color: subject.color }} />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${subject.textColor}`}>{subject.name}</h2>
                    <p className="text-sm text-gray-500">{subject.nodeCount} 个知识点</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
              </div>

              <p className="text-sm text-gray-400 mb-4">{subject.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {subject.topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-2.5 py-1 rounded-md text-xs bg-white/5 text-gray-400 border border-white/[0.06]"
                  >
                    {topic}
                  </span>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">已掌握 {subject.mastered} 个知识点</span>
                  <span className={subject.textColor}>{subject.progress}%</span>
                </div>
                <Progress value={subject.progress} className="h-2" indicatorClassName={`bg-[${subject.color}]`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
