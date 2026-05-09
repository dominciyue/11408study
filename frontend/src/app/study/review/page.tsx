"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RotateCcw, Star } from "lucide-react";
import { studyApi } from "@/lib/api";
import type { KnowledgeNode } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ReviewQueuePage() {
  const [queue, setQueue] = useState<KnowledgeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    studyApi
      .getReviewQueue()
      .then((res) => {
        if (!cancelled) setQueue(res.data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const title = useMemo(() => {
    if (isLoading) return "复习队列";
    return `复习队列（${queue.length}）`;
  }, [isLoading, queue.length]);

  async function submitRating(nodeId: number, rating: number) {
    setSubmittingId(nodeId);
    try {
      await studyApi.submitFeedback({ nodeId, rating });
      setQueue((prev) => prev.filter((n) => n.id !== nodeId));
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <RotateCcw className="w-6 h-6 text-orange-400" />
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <Badge className="bg-orange-500/20 text-orange-400">SM-2</Badge>
      </div>

      {isLoading ? (
        <Card className="border-white/[0.06]">
          <CardContent className="p-6 text-gray-500">加载中…</CardContent>
        </Card>
      ) : queue.length === 0 ? (
        <Card className="border-white/[0.06]">
          <CardContent className="p-6 text-gray-500">今天没有到期复习内容。</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {queue.map((node) => (
            <Card key={node.id} className="border-white/[0.06]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-200">{node.title}</CardTitle>
                <div className="text-xs text-gray-500">
                  {node.subjectName || "—"} / {node.topicName || "—"} · 难度 {node.difficulty ?? "—"}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant="outline"
                      className="border-white/[0.08] hover:bg-white/10 text-gray-200"
                      disabled={submittingId === node.id}
                      onClick={() => submitRating(node.id, rating)}
                    >
                      <Star className="w-4 h-4 mr-2 text-yellow-400" />
                      {rating}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

