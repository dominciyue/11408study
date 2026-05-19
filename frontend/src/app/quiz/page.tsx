"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Timer,
  Target,
  ListChecks,
  BookX,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { quizApi, statsApi } from "@/lib/api";
import type { WrongAnswer, StatsOverview } from "@/types";
import AiExplainDialog from "@/components/quiz/ai-explain-dialog";

const SUBJECTS: { id: number; name: string; color: string }[] = [
  { id: 1, name: "政治", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  { id: 2, name: "英一", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { id: 3, name: "数一", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { id: 4, name: "408", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
];

const quizModes = [
  {
    key: "adaptive",
    title: "智能组卷",
    description: "AI 根据你的薄弱知识点智能出题，精准打击弱项",
    icon: Target,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    key: "timed",
    title: "限时模拟",
    description: "模拟真实考试环境，限时作答，检验综合能力",
    icon: Timer,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  {
    key: "subject",
    title: "专项练习",
    description: "选择特定学科或知识点进行专项训练",
    icon: ListChecks,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    key: "wrong",
    title: "错题重练",
    description: "重新练习之前答错的题目，巩固薄弱环节",
    icon: BookX,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
] as const;

function truncate(s: string | undefined, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

type SubjectCounts = {
  subjectId: number;
  name: string;
  code: string;
  totalNodes: number;
  inlineQs: number;
  externalQs: number;
};

export default function QuizPage() {
  const router = useRouter();
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[] | null>(null);
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [askingFor, setAskingFor] = useState<WrongAnswer | null>(null);
  const [subjectCounts, setSubjectCounts] = useState<SubjectCounts[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const tasks = await Promise.allSettled([
        quizApi.getWrongAnswers(),
        statsApi.overview(),
        statsApi.subjectQuestionCounts(),
      ]);
      if (cancelled) return;
      if (tasks[0].status === "fulfilled") {
        const list = tasks[0].value.data || [];
        setWrongAnswers(list);
      } else {
        setWrongAnswers([]);
      }
      if (tasks[1].status === "fulfilled") {
        setOverview(tasks[1].value.data);
      }
      if (tasks[2].status === "fulfilled") {
        setSubjectCounts(tasks[2].value.data || []);
      }
      setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  function countFor(subjectId: number): SubjectCounts | undefined {
    return subjectCounts.find((s) => s.subjectId === subjectId);
  }

  const unresolvedWrong = useMemo(() => {
    if (!wrongAnswers) return [] as WrongAnswer[];
    return [...wrongAnswers]
      .filter((w) => !w.resolved)
      .sort((a, b) => (a.answeredAt < b.answeredAt ? 1 : -1));
  }, [wrongAnswers]);

  const unresolvedCount = unresolvedWrong.length;
  const studiedToday = overview?.studiedToday ?? 0;
  const reviewedToday = overview?.reviewedToday ?? 0;

  function handleModeClick(key: (typeof quizModes)[number]["key"]) {
    if (key === "adaptive") router.push("/quiz/practice?adaptive=1");
    else if (key === "timed") router.push("/quiz/practice?timed=1&adaptive=1");
    else if (key === "wrong") router.push("/quiz/wrong");
    // "subject" 模式由内部 chips 处理，外层不动作
  }

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
          {overview ? (
            <Badge className="bg-blue-500/20 text-blue-300 px-3 py-1 border border-blue-500/20">
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              今日已学 {studiedToday} 题
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizModes.map((mode) => (
          <Card
            key={mode.key}
            className={`border ${mode.borderColor} hover:scale-[1.01] transition-all duration-300 ${
              mode.key === "subject" ? "" : "cursor-pointer"
            } group`}
            onClick={() => handleModeClick(mode.key)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${mode.bgColor} shrink-0`}>
                  <mode.icon className={`w-6 h-6 ${mode.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-100 mb-1">{mode.title}</h3>
                  <p className="text-sm text-gray-400">{mode.description}</p>
                  {mode.key === "subject" ? (
                    <div
                      className="flex flex-wrap gap-2 mt-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {SUBJECTS.map((s) => {
                        const c = countFor(s.id);
                        const inlineN = c?.inlineQs ?? 0;
                        const disabled = inlineN === 0;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            disabled={disabled}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!disabled) router.push(`/quiz/practice?subjectId=${s.id}`);
                            }}
                            title={
                              disabled
                                ? `${s.name} 暂无可练题（AI 题库扩充中或仅有外部链接题）`
                                : `${s.name} 共 ${inlineN} 道可练题`
                            }
                            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                              disabled
                                ? "opacity-40 cursor-not-allowed bg-gray-500/10 text-gray-500 border-gray-500/20"
                                : "hover:opacity-90 " + s.color
                            }`}
                          >
                            {s.name}
                            {c ? (
                              <span className="ml-1 opacity-70">({inlineN})</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                {mode.key !== "subject" ? (
                  <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          近期表现
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className="bg-blue-500/15 text-blue-300 border border-blue-500/20 px-3 py-1">
            今日已学 {studiedToday}
          </Badge>
          <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-3 py-1">
            今日复习 {reviewedToday}
          </Badge>
          <Badge className="bg-orange-500/15 text-orange-300 border border-orange-500/20 px-3 py-1">
            待解决错题 {unresolvedCount}
          </Badge>
        </div>

        <div className="space-y-3">
          {loading ? (
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 text-sm text-gray-500">加载中…</CardContent>
            </Card>
          ) : unresolvedWrong.length === 0 ? (
            <Card className="border-emerald-500/20">
              <CardContent className="p-4 flex items-center gap-3 text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">暂无待解决错题，做得不错！</span>
              </CardContent>
            </Card>
          ) : (
            unresolvedWrong.slice(0, 5).map((w) => (
              <Card key={w.id} className="border-white/[0.06]">
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 break-words">
                      {truncate(w.questionText, 80) || "(题面缺失)"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {w.topicName ? (
                        <Badge className="bg-white/5 text-gray-300 border border-white/10 text-xs">
                          {w.topicName}
                        </Badge>
                      ) : null}
                      {w.nodeTitle ? (
                        <span className="text-xs text-gray-500">{w.nodeTitle}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
                      onClick={() => router.push("/quiz/wrong")}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      去解题
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                      onClick={() => setAskingFor(w)}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      AI 讲解
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {askingFor ? (
        <AiExplainDialog
          open={!!askingFor}
          onOpenChange={(open) => {
            if (!open) setAskingFor(null);
          }}
          questionId={askingFor.questionId}
          userAnswer={askingFor.userAnswer}
          questionPreview={askingFor.questionText}
        />
      ) : null}
    </div>
  );
}
