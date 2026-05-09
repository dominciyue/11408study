"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Timer,
  Target,
  ListChecks,
  BookX,
  Trophy,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const quizModes = [
  {
    title: "智能组卷",
    description: "AI 根据你的薄弱知识点智能出题，精准打击弱项",
    icon: Target,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    title: "限时模拟",
    description: "模拟真实考试环境，限时作答，检验综合能力",
    icon: Timer,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  {
    title: "专项练习",
    description: "选择特定学科或知识点进行专项训练",
    icon: ListChecks,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    title: "错题重练",
    description: "重新练习之前答错的题目，巩固薄弱环节",
    icon: BookX,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
];

const recentResults = [
  { name: "数据结构专项", score: 85, total: 100, date: "今天", correct: 17, wrong: 3 },
  { name: "操作系统随机", score: 72, total: 100, date: "昨天", correct: 18, wrong: 7 },
  { name: "408综合模拟", score: 68, total: 150, date: "3天前", correct: 34, wrong: 16 },
];

export default function QuizPage() {
  const router = useRouter();
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardCheck className="w-7 h-7 text-blue-400" />
            测验中心
          </h1>
          <p className="text-gray-400 mt-1">检验学习成果，找到薄弱环节</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-400 px-3 py-1">
            <Trophy className="w-3.5 h-3.5 mr-1" />
            总正确率 76%
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizModes.map((mode) => (
          <Card
            key={mode.title}
            className={`border ${mode.borderColor} hover:scale-[1.01] transition-all duration-300 cursor-pointer group`}
            onClick={() => {
              if (mode.title === "专项练习") router.push("/quiz/practice?subjectId=4");
              if (mode.title === "错题重练") router.push("/quiz/wrong");
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${mode.bgColor} shrink-0`}>
                  <mode.icon className={`w-6 h-6 ${mode.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-100 mb-1">{mode.title}</h3>
                  <p className="text-sm text-gray-400">{mode.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          最近测验
        </h2>
        <div className="space-y-3">
          {recentResults.map((result, idx) => (
            <Card key={idx} className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                    result.score / result.total >= 0.8 ? "bg-green-500/10 text-green-400" :
                    result.score / result.total >= 0.6 ? "bg-orange-500/10 text-orange-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>
                    {Math.round(result.score / result.total * 100)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{result.name}</p>
                    <p className="text-xs text-gray-500">
                      {result.date} · 正确 {result.correct} 题 · 错误 {result.wrong} 题
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
                  查看详情
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
