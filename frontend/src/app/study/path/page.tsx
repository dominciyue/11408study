"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Route, ChevronRight } from "lucide-react";
import { subjectsApi, studyApi } from "@/lib/api";
import type { KnowledgeNode, Subject } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function StudyPathPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [path, setPath] = useState<KnowledgeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    subjectsApi
      .list()
      .then((res) => {
        if (cancelled) return;
        setSubjects(res.data);
        setSelectedSubjectId(res.data[0]?.id ?? null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;
    let cancelled = false;
    setIsLoading(true);
    studyApi
      .getStudyPath(selectedSubjectId)
      .then((res) => {
        if (!cancelled) setPath(res.data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSubjectId]);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) ?? null,
    [subjects, selectedSubjectId]
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Route className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">学习路径</h1>
        <Badge className="bg-blue-500/20 text-blue-400">拓扑排序</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <Button
            key={s.id}
            variant="outline"
            className={
              s.id === selectedSubjectId
                ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                : "border-white/[0.08] hover:bg-white/10 text-gray-200"
            }
            onClick={() => setSelectedSubjectId(s.id)}
          >
            {s.name}
          </Button>
        ))}
      </div>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-base text-gray-200">
            {selectedSubject ? `${selectedSubject.name} · 路径（${path.length}）` : "路径"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-gray-500">加载中…</div>
          ) : path.length === 0 ? (
            <div className="text-gray-500">该学科暂无可生成的路径（可能还没有知识点数据）。</div>
          ) : (
            <div className="space-y-2">
              {path.map((node, idx) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold text-gray-400">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-200 truncate">{node.title}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {node.topicName || "—"} · 难度 {node.difficulty ?? "—"}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-white/[0.08] hover:bg-white/10 text-gray-200"
                    onClick={() => {
                      // 暂时跳到图谱页；后续可做“学习该节点”专页
                      window.location.href = "/graph";
                    }}
                  >
                    去图谱
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

