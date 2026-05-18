"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, Play, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { quizApi } from "@/lib/api";
import type { QuizQuestion } from "@/types";

const PREVIEW_LIMIT = 80;

/**
 * "今日靶向 5 题"卡 — 复用后端自适应组卷（应复习 → 低掌握 → 未学）。
 *
 * <p>spec 里写的是 `/api/quiz/adaptive?count=5`，但后端实际是
 * POST /quiz/adaptive-generate，本卡直接复用 quizApi.adaptiveGenerate。
 * "开练"会带 ids 参数跳 /quiz/practice，practice 页按 id 顺序加载这 5 题。
 */
export function TodayTargetedCard() {
  const router = useRouter();
  const [items, setItems] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    quizApi
      .adaptiveGenerate(undefined, 5)
      .then((res) => {
        if (!cancelled) setItems(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const idsQuery = useMemo(() => items.map((q) => q.id).join(","), [items]);

  function goPractice() {
    if (!idsQuery) return;
    // 把题对象暂存到 sessionStorage（key = ids 串），practice 页读取后立即清除。
    // 这样 practice 页就不需要新增"按 id 列表批拉题"的后端 endpoint。
    try {
      if (typeof window !== "undefined") {
        const key = `quiz:prefetch:${idsQuery}`;
        window.sessionStorage.setItem(key, JSON.stringify(items));
      }
    } catch {
      // sessionStorage 不可用时降级：practice 页会按 ids fallback 到 adaptive 重新拉
    }
    router.push(`/quiz/practice?ids=${encodeURIComponent(idsQuery)}`);
  }

  function truncate(text: string, n = PREVIEW_LIMIT) {
    if (!text) return "";
    const t = text.replace(/\s+/g, " ").trim();
    return t.length <= n ? t : `${t.slice(0, n)}…`;
  }

  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <CardTitle className="text-base text-gray-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-blue-400" />
            今日靶向 5 题
          </span>
          <div className="flex items-center gap-1">
            {items.length > 0 ? (
              <Badge className="bg-blue-500/15 text-blue-300 text-[11px] font-normal">
                {items.length} 道
              </Badge>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-gray-200"
              onClick={() => setReloadKey((k) => k + 1)}
              title="换一批"
              disabled={isLoading}
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-gray-500">加载中…</p>
        ) : items.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              先练几道，明天就有靶向推荐。
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-white/[0.08] text-gray-200"
              onClick={() => router.push("/quiz")}
            >
              去做几道随机题
            </Button>
          </div>
        ) : (
          <>
            <ol className="space-y-2">
              {items.map((q, i) => (
                <li
                  key={q.id}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-sm flex gap-2"
                >
                  <span className="text-blue-300 font-mono shrink-0">{i + 1}.</span>
                  <span className="text-gray-300 line-clamp-2 break-words">
                    {truncate(q.content)}
                  </span>
                </li>
              ))}
            </ol>
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              onClick={goPractice}
            >
              <Play className="w-4 h-4 mr-1.5" />
              开练
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default TodayTargetedCard;
