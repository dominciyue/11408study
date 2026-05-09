"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { knowledgeApi, quizApi } from "@/lib/api";
import type { KnowledgeNode, QuizQuestion } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function parseOptions(options?: string): string[] {
  if (!options) return [];
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function QuizPracticeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = Number(searchParams.get("subjectId") || "4"); // 默认 408
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; correctAnswer: string; explanation?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setIsLoading(true);
      setResult(null);
      setSelected(null);
      try {
        const nodesRes = await knowledgeApi.getNodes({ subjectId });
        const nodeIds = nodesRes.data.slice(0, 20).map((n: KnowledgeNode) => n.id);
        const quizRes = await quizApi.generate(nodeIds, 10);
        if (!cancelled) {
          setQuestions(quizRes.data);
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
  }, [subjectId]);

  const q = questions[idx] || null;
  const options = useMemo(() => parseOptions(q?.options), [q?.options]);

  async function submit() {
    if (!q || selected == null) return;
    const res = await quizApi.submit({ questionId: q.id, userAnswer: selected });
    setResult(res.data);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">专项练习</h1>
          <Badge className="bg-blue-500/20 text-blue-400">{subjectId}</Badge>
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
                  >
                    {opt}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700" disabled={!selected} onClick={submit}>
                  提交
                </Button>
                <Button
                  variant="outline"
                  className="border-white/[0.08] text-gray-200"
                  onClick={() => {
                    setSelected(null);
                    setResult(null);
                  }}
                >
                  重选
                </Button>
              </div>

              {result ? (
                <div className="p-4 rounded-xl border border-white/[0.08] bg-white/5">
                  <div className={result.correct ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                    {result.correct ? "回答正确" : "回答错误"}
                  </div>
                  <div className="text-sm text-gray-300 mt-2">正确答案：{result.correctAnswer}</div>
                  {result.explanation ? (
                    <div className="text-sm text-gray-400 mt-2 whitespace-pre-wrap">{result.explanation}</div>
                  ) : null}
                </div>
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
                setSelected(null);
                setResult(null);
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
                setSelected(null);
                setResult(null);
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

