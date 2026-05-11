"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Languages,
  Calculator,
  Cpu,
  ArrowRight,
  TrendingUp,
  Loader2,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { subjectsApi, statsApi } from "@/lib/api";
import type { Subject, StatsOverview } from "@/types";

/**
 * 按学科 code 决定卡片图标 / 渐变色 / 边框。
 * 后端 code 取值：politics / english / math / cs408（与 subjects 种子保持一致）。
 * 未匹配时回退到默认蓝色。
 */
const SUBJECT_STYLES: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    bgGradient: string;
    borderColor: string;
    textColor: string;
  }
> = {
  politics: {
    icon: BookOpen,
    bgGradient: "from-red-500/20 to-red-600/5",
    borderColor: "border-red-500/20",
    textColor: "text-red-400",
  },
  english: {
    icon: Languages,
    bgGradient: "from-blue-500/20 to-blue-600/5",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-400",
  },
  math: {
    icon: Calculator,
    bgGradient: "from-green-500/20 to-green-600/5",
    borderColor: "border-green-500/20",
    textColor: "text-green-400",
  },
  cs408: {
    icon: Cpu,
    bgGradient: "from-purple-500/20 to-purple-600/5",
    borderColor: "border-purple-500/20",
    textColor: "text-purple-400",
  },
};

function getSubjectStyle(code: string) {
  return (
    SUBJECT_STYLES[code] || {
      icon: Layers,
      bgGradient: "from-blue-500/20 to-blue-600/5",
      borderColor: "border-blue-500/20",
      textColor: "text-blue-400",
    }
  );
}

interface MergedSubject {
  id: number;
  name: string;
  code: string;
  color: string;
  description: string;
  topicCount: number;
  nodeCount: number;
  progress: number;
  studiedNodes: number;
  masteredNodes: number;
  totalNodes: number;
}

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMsg(null);
    Promise.allSettled([subjectsApi.list(), statsApi.overview()])
      .then(([subjRes, ovRes]) => {
        if (cancelled) return;
        if (subjRes.status === "fulfilled") {
          setSubjects(subjRes.value.data || []);
        } else {
          setErrorMsg("学科列表加载失败");
        }
        if (ovRes.status === "fulfilled") {
          setOverview(ovRes.value.data || null);
        }
        // overview 失败不阻塞列表，进度退化为 0 即可
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 把 subject 与 overview.subjectProgress 同 subjectId merge
  const merged: MergedSubject[] = useMemo(() => {
    const progressMap = new Map<
      number,
      { progress: number; totalNodes: number; studiedNodes: number; masteredNodes: number }
    >();
    overview?.subjectProgress?.forEach((p) => {
      progressMap.set(p.subjectId, {
        progress: p.progress ?? 0,
        totalNodes: p.totalNodes ?? 0,
        studiedNodes: p.studiedNodes ?? 0,
        masteredNodes: p.masteredNodes ?? 0,
      });
    });
    return subjects.map((s) => {
      const p = progressMap.get(s.id);
      return {
        id: s.id,
        name: s.name,
        code: s.code,
        color: s.color || "#3b82f6",
        description: s.description || "",
        topicCount: s.topicCount ?? 0,
        nodeCount: s.nodeCount ?? p?.totalNodes ?? 0,
        progress: p?.progress ?? s.progress ?? 0,
        studiedNodes: p?.studiedNodes ?? 0,
        masteredNodes: p?.masteredNodes ?? 0,
        totalNodes: p?.totalNodes ?? s.nodeCount ?? 0,
      };
    });
  }, [subjects, overview]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-blue-400" />
          学科总览
        </h1>
        <p className="text-gray-400 mt-1">选择学科开始系统化学习</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          加载中…
        </div>
      ) : errorMsg ? (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-6 text-sm text-red-400">{errorMsg}</CardContent>
        </Card>
      ) : merged.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-gray-500">
            暂无学科数据。请先在后端导入学科种子。
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {merged.map((subject) => {
            const styleCfg = getSubjectStyle(subject.code);
            const Icon = styleCfg.icon;
            const progressInt = Math.round(subject.progress);
            return (
              <Card
                key={subject.id}
                className={`border ${styleCfg.borderColor} bg-gradient-to-br ${styleCfg.bgGradient} hover:scale-[1.01] transition-all duration-300 cursor-pointer group`}
                onClick={() => router.push(`/subjects/${subject.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/subjects/${subject.id}`);
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${subject.color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: subject.color }} />
                      </div>
                      <div>
                        <h2
                          className={`text-xl font-bold ${styleCfg.textColor}`}
                        >
                          {subject.name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {subject.totalNodes || subject.nodeCount} 个知识点 · {subject.topicCount} 个章节
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                  </div>

                  {subject.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {subject.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        已掌握 {subject.masteredNodes} / 已学 {subject.studiedNodes}
                      </span>
                      <span className={styleCfg.textColor}>{progressInt}%</span>
                    </div>
                    <Progress
                      value={progressInt}
                      className="h-2"
                      indicatorClassName="bg-current"
                      style={{ color: subject.color } as React.CSSProperties}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
