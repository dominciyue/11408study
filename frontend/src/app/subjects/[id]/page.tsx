"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Languages,
  Calculator,
  Cpu,
  ArrowRight,
  ChevronLeft,
  GitBranch,
  Loader2,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { subjectsApi, topicsApi, statsApi } from "@/lib/api";
import type { Subject, Topic, StatsOverview } from "@/types";

const SUBJECT_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  politics: BookOpen,
  english: Languages,
  math: Calculator,
  cs408: Cpu,
};

function getSubjectIcon(code: string) {
  return SUBJECT_ICONS[code] || Layers;
}

export default function SubjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const subjectId = Number(params?.id);
  const isValidId = Number.isFinite(subjectId) && subjectId > 0;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(isValidId);
  const [notFound, setNotFound] = useState(!isValidId);

  useEffect(() => {
    if (!isValidId) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setNotFound(false);
    Promise.allSettled([
      subjectsApi.get(subjectId),
      topicsApi.listBySubject(subjectId),
      statsApi.overview(),
    ])
      .then(([subjRes, topicRes, ovRes]) => {
        if (cancelled) return;
        if (subjRes.status === "fulfilled" && subjRes.value.data) {
          setSubject(subjRes.value.data);
        } else {
          setNotFound(true);
        }
        if (topicRes.status === "fulfilled") {
          setTopics(topicRes.value.data || []);
        }
        if (ovRes.status === "fulfilled") {
          setOverview(ovRes.value.data || null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId, isValidId]);

  const subjectProgress = useMemo(() => {
    if (!overview || !subject) return null;
    return (
      overview.subjectProgress?.find((p) => p.subjectId === subject.id) || null
    );
  }, [overview, subject]);

  if (!isValidId || notFound) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-200">学科不存在</h1>
        <p className="text-gray-500">
          未找到 ID 为 {String(params?.id)} 的学科。请返回学科列表选择。
        </p>
        <Button variant="outline" onClick={() => router.push("/subjects")}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          返回学科列表
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        加载中…
      </div>
    );
  }

  const Icon = getSubjectIcon(subject?.code || "");
  const color = subject?.color || "#3b82f6";
  const progress = Math.round(subjectProgress?.progress ?? subject?.progress ?? 0);
  const totalNodes = subjectProgress?.totalNodes ?? subject?.nodeCount ?? 0;
  const studiedNodes = subjectProgress?.studiedNodes ?? 0;
  const masteredNodes = subjectProgress?.masteredNodes ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-gray-200 -ml-2 mb-3"
          onClick={() => router.push("/subjects")}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          学科列表
        </Button>

        <Card className="border-white/[0.06]">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon className="w-7 h-7" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-100">
                  {subject?.name || "学科详情"}
                </h1>
                {subject?.description && (
                  <p className="text-sm text-gray-400 mt-1">{subject.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                  <Badge variant="outline" className="bg-white/5 border-white/[0.08] text-gray-400">
                    {topics.length || subject?.topicCount || 0} 个章节
                  </Badge>
                  <Badge variant="outline" className="bg-white/5 border-white/[0.08] text-gray-400">
                    {totalNodes} 个知识点
                  </Badge>
                  {masteredNodes > 0 && (
                    <Badge variant="outline" className="bg-white/5 border-white/[0.08] text-gray-400">
                      已掌握 {masteredNodes}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  已学 {studiedNodes} · 已掌握 {masteredNodes}
                </span>
                <span style={{ color }}>{progress}%</span>
              </div>
              <Progress
                value={progress}
                className="h-2"
                indicatorClassName="bg-current"
                style={{ color } as React.CSSProperties}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-3">章节列表</h2>
        {topics.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-gray-500">
              该学科暂无章节
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((topic) => {
              const hasNodes = (topic.nodeCount ?? 0) > 0;
              const topicProgress = Math.round(topic.progress ?? 0);
              return (
                <Card
                  key={topic.id}
                  className={`border-white/[0.06] transition-all ${
                    hasNodes ? "hover:border-white/[0.12] hover:bg-white/[0.02]" : "opacity-60"
                  }`}
                >
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-100">
                        {topic.name}
                      </h3>
                      <Badge variant="outline" className="bg-white/5 border-white/[0.08] text-gray-500 text-xs shrink-0 ml-2">
                        {topic.nodeCount ?? 0} 节点
                      </Badge>
                    </div>
                    {topic.description && (
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                        {topic.description}
                      </p>
                    )}

                    {hasNodes ? (
                      <>
                        {typeof topic.progress === "number" && topic.progress > 0 && (
                          <div className="space-y-1 mb-3">
                            <div className="flex justify-between text-[11px] text-gray-500">
                              <span>章节进度</span>
                              <span>{topicProgress}%</span>
                            </div>
                            <Progress value={topicProgress} className="h-1.5" />
                          </div>
                        )}
                        <div className="mt-auto pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                            onClick={() =>
                              router.push(
                                `/graph?subjectId=${subjectId}&topicId=${topic.id}`,
                              )
                            }
                          >
                            进入此章
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="mt-auto pt-2">
                        <p className="text-[11px] text-gray-600 text-center mb-2">
                          暂无内容
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled
                        >
                          暂无内容
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          asChild
          size="lg"
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Link href={`/graph?subjectId=${subjectId}`}>
            <GitBranch className="w-5 h-5 mr-2" />
            进入完整知识图谱
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
