"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  Upload,
  Flame,
  TrendingUp,
  Clock,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/auth-store";

const subjects = [
  {
    name: "政治",
    code: "politics",
    color: "from-red-500/20 to-red-600/5",
    borderColor: "border-red-500/20",
    textColor: "text-red-400",
    barColor: "bg-red-500",
    progress: 35,
    topics: 12,
    mastered: 42,
  },
  {
    name: "英语一",
    code: "english",
    color: "from-blue-500/20 to-blue-600/5",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-400",
    barColor: "bg-blue-500",
    progress: 28,
    topics: 8,
    mastered: 31,
  },
  {
    name: "数学一",
    code: "math",
    color: "from-green-500/20 to-green-600/5",
    borderColor: "border-green-500/20",
    textColor: "text-green-400",
    barColor: "bg-green-500",
    progress: 45,
    topics: 15,
    mastered: 67,
  },
  {
    name: "408计算机",
    code: "cs408",
    color: "from-purple-500/20 to-purple-600/5",
    borderColor: "border-purple-500/20",
    textColor: "text-purple-400",
    barColor: "bg-purple-500",
    progress: 22,
    topics: 20,
    mastered: 28,
  },
];

const todayStats = [
  { label: "已学习", value: "12", icon: CheckCircle2, color: "text-green-400" },
  { label: "待复习", value: "8", icon: RotateCcw, color: "text-orange-400" },
  { label: "学习时长", value: "2.5h", icon: Clock, color: "text-blue-400" },
  { label: "连续天数", value: "7", icon: Flame, color: "text-red-400" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            你好，{user?.nickname || user?.username || "同学"} 👋
          </h1>
          <p className="text-gray-400 mt-1">今天也要加油学习哦！坚持就是胜利</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-orange-400 font-bold text-lg">7</span>
            <span className="text-orange-400/70 text-sm">天连续</span>
          </div>
        </div>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {todayStats.map((stat) => (
          <Card key={stat.label} className="border-white/[0.06]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-white/5">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject progress cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          学科进度
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((subject) => (
            <Card
              key={subject.code}
              className={`border ${subject.borderColor} bg-gradient-to-br ${subject.color} hover:border-opacity-40 transition-all duration-300 cursor-pointer`}
              onClick={() => router.push(`/subjects/${subject.code}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${subject.textColor}`}>{subject.name}</h3>
                  <span className="text-sm text-gray-400">{subject.topics} 个专题</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">已掌握 {subject.mastered} 个知识点</span>
                    <span className={subject.textColor}>{subject.progress}%</span>
                  </div>
                  <Progress
                    value={subject.progress}
                    className="h-2"
                    indicatorClassName={subject.barColor}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 border-white/[0.08] hover:border-blue-500/30 hover:bg-blue-500/5"
            onClick={() => router.push("/study")}
          >
            <BookOpen className="w-8 h-8 text-blue-400" />
            <div className="text-center">
              <p className="font-medium text-gray-200">开始学习</p>
              <p className="text-xs text-gray-500 mt-1">智能推荐学习内容</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 border-white/[0.08] hover:border-green-500/30 hover:bg-green-500/5"
            onClick={() => router.push("/quiz")}
          >
            <ClipboardCheck className="w-8 h-8 text-green-400" />
            <div className="text-center">
              <p className="font-medium text-gray-200">快速测验</p>
              <p className="text-xs text-gray-500 mt-1">检验学习成果</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 border-white/[0.08] hover:border-purple-500/30 hover:bg-purple-500/5"
            onClick={() => router.push("/materials")}
          >
            <Upload className="w-8 h-8 text-purple-400" />
            <div className="text-center">
              <p className="font-medium text-gray-200">上传资料</p>
              <p className="text-xs text-gray-500 mt-1">管理学习资料</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Placeholder charts area */}
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4">学习趋势</h2>
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-base text-gray-300">每周学习时长</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-gray-600" />
                </div>
                <p>图表功能将在后续版本实现</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
