"use client";

import React, { useEffect, useState } from "react";
import { BookX, Sparkles } from "lucide-react";
import { quizApi } from "@/lib/api";
import type { WrongAnswer } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AiExplainDialog from "@/components/quiz/ai-explain-dialog";

export default function WrongAnswersPage() {
  const [items, setItems] = useState<WrongAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [askingFor, setAskingFor] = useState<WrongAnswer | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    quizApi
      .getWrongAnswers()
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <BookX className="w-6 h-6 text-orange-400" />
        <h1 className="text-2xl font-bold text-white">错题本</h1>
        <Badge className="bg-orange-500/20 text-orange-400">{items.length}</Badge>
      </div>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-base text-gray-200">未解决错题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="text-gray-500">加载中…</div>
          ) : items.length === 0 ? (
            <div className="text-gray-500">暂无错题。</div>
          ) : (
            items.map((w) => (
              <div key={w.id} className="p-4 rounded-xl border border-white/[0.06] bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm text-gray-200 whitespace-pre-wrap">{w.questionText}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      你的答案：<span className="text-red-300">{w.userAnswer}</span> · 正确答案：
                      <span className="text-green-300">{w.correctAnswer}</span>
                    </div>
                    {w.explanation ? (
                      <div className="text-xs text-gray-400 mt-2 whitespace-pre-wrap">{w.explanation}</div>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 shrink-0"
                    onClick={() => setAskingFor(w)}
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    AI 讲解
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

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
