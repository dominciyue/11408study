"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardCheck, ChevronLeft, ChevronRight, Sparkles, Timer as TimerIcon } from "lucide-react";
import { knowledgeApi, quizApi } from "@/lib/api";
import type { KnowledgeNode, QuizQuestion } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AiExplainDialog from "@/components/quiz/ai-explain-dialog";

function parseOptions(options?: string): string[] {
  if (!options) return [];
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

const SUBJECT_NAMES: Record<number, string> = {
  1: "政治",
  2: "英一",
  3: "数一",
  4: "408",
};

const TIMED_PER_QUESTION = 60; // 秒

function formatMMSS(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function QuizPracticeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adaptiveFlag = searchParams.get("adaptive") === "1";
  const timedFlag = searchParams.get("timed") === "1";
  const rawSubjectId = searchParams.get("subjectId");
  const subjectId = rawSubjectId ? Number(rawSubjectId) : undefined;
  const rawNodeId = searchParams.get("nodeId");
  const nodeId =
    rawNodeId && Number.isFinite(Number(rawNodeId)) && Number(rawNodeId) > 0
      ? Number(rawNodeId)
      : undefined;
  // 优先级：nodeId > subjectId（自适应/学科）。nodeId 模式直接拉本节点的题，
  // 不走自适应（自适应是跨节点推题，与"在该节点学习"语义冲突）。
  const useAdaptive = !nodeId && (adaptiveFlag || subjectId == null);

  type SubmitResult = { correct: boolean; correctAnswer: string; explanation?: string };

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(timedFlag ? TIMED_PER_QUESTION : null);

  // 用 ref 保留最新 selected/result，避免 setInterval 闭包过期
  const selectedRef = useRef<string | null>(null);
  const resultRef = useRef<SubmitResult | null>(null);
  const submittingRef = useRef(false);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const q = questions[idx] || null;
  const options = useMemo(() => parseOptions(q?.options), [q?.options]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setIsLoading(true);
      setResult(null);
      setSelected(null);
      try {
        let questionsData: QuizQuestion[] = [];
        // 单节点模式：只拉该节点的题（来自 V2/V8/V9/V10 真题种子或既往 AI 生题）
        if (nodeId) {
          try {
            const quizRes = await quizApi.generate([nodeId], 10);
            questionsData = quizRes.data || [];
          } catch (_err) {
            // 静默降级
          }
        } else {
          try {
            if (useAdaptive) {
              const adaptiveRes = await quizApi.adaptiveGenerate(undefined, 10);
              questionsData = adaptiveRes.data || [];
            } else {
              const adaptiveRes = await quizApi.adaptiveGenerate(subjectId, 10);
              questionsData = adaptiveRes.data || [];
            }
          } catch (_err) {
            // 静默降级
          }
          if (questionsData.length === 0 && subjectId != null) {
            const nodesRes = await knowledgeApi.getNodes({ subjectId });
            const nodeIds = nodesRes.data.slice(0, 20).map((n: KnowledgeNode) => n.id);
            const quizRes = await quizApi.generate(nodeIds, 10);
            questionsData = quizRes.data;
          }
        }
        if (!cancelled) {
          setQuestions(questionsData);
          setIdx(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [subjectId, useAdaptive, nodeId]);

  // 提交（手动 / 自动），auto=true 时未选当作错（提交一个占位串）
  const submit = useCallback(
    async (auto = false) => {
      if (!q) return;
      if (submittingRef.current) return;
      if (resultRef.current) return; // 已经提交过
      const userAnswer = selectedRef.current ?? (auto ? "(超时未作答)" : null);
      if (userAnswer == null) return;
      submittingRef.current = true;
      try {
        const res = await quizApi.submit({ questionId: q.id, userAnswer });
        setResult(res.data);
      } finally {
        submittingRef.current = false;
      }
    },
    [q]
  );

  // 切题时重置 timer / 选项 / 结果
  useEffect(() => {
    setSelected(null);
    setResult(null);
    if (timedFlag) setTimeLeft(TIMED_PER_QUESTION);
    else setTimeLeft(null);
  }, [idx, timedFlag]);

  // 倒计时（仅 timed 模式 + 当前题未提交时跑）
  useEffect(() => {
    if (!timedFlag) return;
    if (!q) return;
    if (result) return; // 已提交，停表
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          clearInterval(t);
          // 触发自动提交
          submit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timedFlag, q, result, submit, idx]);

  const headerBadge = useMemo(() => {
    if (nodeId) return { text: "单节点练习", cls: "bg-emerald-500/20 text-emerald-300" };
    if (adaptiveFlag) return { text: "自适应", cls: "bg-purple-500/20 text-purple-300" };
    if (timedFlag) return { text: "限时模拟", cls: "bg-red-500/20 text-red-300" };
    if (subjectId != null && SUBJECT_NAMES[subjectId])
      return { text: SUBJECT_NAMES[subjectId], cls: "bg-blue-500/20 text-blue-300" };
    return { text: "自适应", cls: "bg-purple-500/20 text-purple-300" };
  }, [adaptiveFlag, timedFlag, subjectId, nodeId]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <ClipboardCheck className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">
            {timedFlag ? "限时模拟" : adaptiveFlag ? "智能组卷" : "专项练习"}
          </h1>
          <Badge className={headerBadge.cls}>{headerBadge.text}</Badge>
          {timedFlag && timeLeft != null ? (
            <Badge
              className={
                timeLeft < 10
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "bg-orange-500/15 text-orange-300 border border-orange-500/20"
              }
            >
              <TimerIcon className="w-3.5 h-3.5 mr-1" />
              {formatMMSS(timeLeft)}
            </Badge>
          ) : null}
        </div>
        <Button variant="outline" className="border-white/[0.08] text-gray-200" onClick={() => router.push("/quiz")}>
          返回
        </Button>
      </div>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-base text-gray-200">
            {isLoading ? "加载中…" : q ? `第 ${idx + 1} / ${questions.length} 题` : "暂无题目"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {q ? (
            <>
              <div className="text-gray-200 whitespace-pre-wrap">{q.content}</div>
              <div className="grid gap-2">
                {(options.length ? options : ["(无选项，直接填空作答)"]).map((opt) => (
                  <Button
                    key={opt}
                    variant="outline"
                    className={
                      selected === opt
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-200 justify-start"
                        : "border-white/[0.08] hover:bg-white/10 text-gray-200 justify-start"
                    }
                    onClick={() => setSelected(opt)}
                    disabled={!!result}
                  >
                    {opt}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!selected || !!result}
                  onClick={() => submit(false)}
                >
                  提交
                </Button>
                <Button
                  variant="outline"
                  className="border-white/[0.08] text-gray-200"
                  onClick={() => {
                    setSelected(null);
                    setResult(null);
                  }}
                  disabled={!!result}
                >
                  重选
                </Button>
              </div>

              {result ? (
                <div className="p-4 rounded-xl border border-white/[0.08] bg-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={result.correct ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                      {result.correct ? "回答正确" : "回答错误"}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                      onClick={() => setAiOpen(true)}
                      disabled={!q || !selected}
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      AI 启发式讲题
                    </Button>
                  </div>
                  <div className="text-sm text-gray-300">正确答案：{result.correctAnswer}</div>
                  {result.explanation ? (
                    <div className="text-sm text-gray-400 whitespace-pre-wrap">{result.explanation}</div>
                  ) : null}
                </div>
              ) : null}

              {q && selected ? (
                <AiExplainDialog
                  open={aiOpen}
                  onOpenChange={setAiOpen}
                  questionId={q.id}
                  userAnswer={selected}
                  questionPreview={q.content}
                />
              ) : null}
            </>
          ) : (
            <div className="text-gray-500">暂无题目（可能题库为空）。</div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              className="border-white/[0.08] text-gray-200"
              disabled={idx <= 0}
              onClick={() => {
                setIdx((v) => Math.max(0, v - 1));
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              上一题
            </Button>
            <Button
              variant="outline"
              className="border-white/[0.08] text-gray-200"
              disabled={idx >= questions.length - 1}
              onClick={() => {
                setIdx((v) => Math.min(questions.length - 1, v + 1));
              }}
            >
              下一题
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function QuizPracticePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto p-6 text-gray-500">
          加载中…
        </div>
      }
    >
      <QuizPracticeInner />
    </Suspense>
  );
}
