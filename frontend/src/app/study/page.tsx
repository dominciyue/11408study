"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  RotateCcw,
  Route,
  Sparkles,
  Clock,
  Target,
  Brain,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { knowledgeApi, statsApi, studyApi } from "@/lib/api";

function minutesToHoursText(minutes: number) {
  if (!Number.isFinite(minutes)) return "0h";
  const h = minutes / 60;
  if (h < 1) return `${Math.max(0, Math.round(minutes))}m`;
  return `${h.toFixed(1)}h`;
}

/** ISO 时间字符串 -> 相对时间展示 */
function toRelativeTime(iso: string | undefined | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  const diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 60) return "刚刚";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}天前`;
  const d = new Date(t);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface RecentStudyItem {
  id: number;
  nodeId: number;
  subjectId?: number;
  title: string;
  subject: string;
  time: string;
  mastery: number;
}

export default function StudyPage() {
  const router = useRouter();
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [todayMinutes, setTodayMinutes] = useState<number | null>(null);
  const [studiedToday, setStudiedToday] = useState<number | null>(null);
  const [recentStudy, setRecentStudy] = useState<RecentStudyItem[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([studyApi.getReviewQueue(), statsApi.overview()]).then((results) => {
      if (cancelled) return;
      const [reviewRes, overviewRes] = results;
      if (reviewRes.status === "fulfilled") setReviewCount(reviewRes.value.data.length);
      if (overviewRes.status === "fulfilled") {
        setTodayMinutes(overviewRes.value.data.studyTimeTodayMinutes);
        setStudiedToday(overviewRes.value.data.studiedToday);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 拉真实"最近学习"：progress -> 按 lastReview 倒序 -> 取前 5 -> 并行查 node 元数据
  useEffect(() => {
    let cancelled = false;
    setRecentLoading(true);
    studyApi
      .getProgress()
      .then(async (res) => {
        if (cancelled) return;
        const progresses = (res.data || [])
          .slice()
          .sort((a, b) => {
            const ta = a.lastReview ? Date.parse(a.lastReview) : 0;
            const tb = b.lastReview ? Date.parse(b.lastReview) : 0;
            // null/缺失 lastReview 排到最后
            if (!ta && !tb) return 0;
            if (!ta) return 1;
            if (!tb) return -1;
            return tb - ta;
          })
          .slice(0, 5);

        if (progresses.length === 0) {
          if (!cancelled) setRecentStudy([]);
          return;
        }

        const nodeResults = await Promise.allSettled(
          progresses.map((p) => knowledgeApi.getNode(p.nodeId)),
        );

        if (cancelled) return;
        const items: RecentStudyItem[] = progresses.map((p, idx) => {
          const r = nodeResults[idx];
          const node = r.status === "fulfilled" ? r.value.data : undefined;
          return {
            id: p.id,
            nodeId: p.nodeId,
            subjectId: node?.subjectId,
            title: node?.title ?? `知识点 #${p.nodeId}`,
            subject: node?.subjectName ?? node?.topicName ?? "其他",
            time: toRelativeTime(p.lastReview),
            mastery: Math.round(p.masteryLevel ?? 0),
          };
        });
        setRecentStudy(items);
      })
      .catch(() => {
        if (!cancelled) setRecentStudy([]);
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const studyModes = useMemo(
    () => [
      {
        title: "AI 学习计划",
        description: "DeepSeek 根据你的学科、目标和薄弱点，生成个性化周计划",
        icon: Sparkles,
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/20",
        badge: "DeepSeek",
        badgeColor: "bg-purple-500/20 text-purple-400",
        href: "/study/plan",
      },
      {
        title: "复习队列",
        description: "基于间隔重复算法（SM-2），自动生成今日复习队列",
        icon: RotateCcw,
        color: "text-orange-400",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/20",
        badge: reviewCount == null ? "…" : `${reviewCount} 待复习`,
        badgeColor: "bg-orange-500/20 text-orange-400",
        href: "/study/review",
      },
      {
        title: "学习路径",
        description: "按知识图谱拓扑排序，从基础到进阶系统化学习",
        icon: Route,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
        badge: "系统学习",
        badgeColor: "bg-blue-500/20 text-blue-400",
        href: "/study/path",
      },
      {
        title: "自由学习",
        description: "自由选择学科和知识点，按自己的节奏学习",
        icon: BookOpen,
        color: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20",
        badge: "自由模式",
        badgeColor: "bg-green-500/20 text-green-400",
        href: "/graph",
      },
    ],
    [reviewCount]
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="w-7 h-7 text-blue-400" />
            学习模式
          </h1>
          <p className="text-gray-400 mt-1">选择适合你的学习方式</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>今日已学 {minutesToHoursText(todayMinutes ?? 0)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Target className="w-4 h-4" />
            <span>已学 {studiedToday ?? 0} 个知识点</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {studyModes.map((mode) => (
          <Card
            key={mode.title}
            className={`border ${mode.borderColor} hover:scale-[1.01] transition-all duration-300 cursor-pointer group`}
            onClick={() => router.push(mode.href)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${mode.bgColor} shrink-0`}>
                  <mode.icon className={`w-6 h-6 ${mode.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-100">{mode.title}</h3>
                    <Badge className={mode.badgeColor}>{mode.badge}</Badge>
                  </div>
                  <p className="text-sm text-gray-400">{mode.description}</p>
                </div>
              </div>
              <Button
                className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/[0.08] text-gray-300"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(mode.href);
                }}
              >
                <Zap className="w-4 h-4 mr-2" />
                开始学习
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4">最近学习</h2>
        {recentLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[68px] rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse"
              />
            ))}
          </div>
        ) : recentStudy.length === 0 ? (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <p className="text-sm text-green-300">
                还没有学习记录，去图谱开始第一节吧
              </p>
              <Button
                className="border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                variant="outline"
                onClick={() => router.push("/subjects")}
              >
                去选学科 →
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentStudy.map((item, idx) => {
              const target =
                item.subjectId != null
                  ? `/graph?subjectId=${item.subjectId}&focusNodeId=${item.nodeId}`
                  : `/graph?focusNodeId=${item.nodeId}`;
              return (
                <Card
                  key={item.id}
                  className="border-white/[0.06] hover:border-white/[0.12] transition-colors cursor-pointer"
                  onClick={() => router.push(target)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg font-bold text-gray-500">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.subject} · {item.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-300">{item.mastery}%</p>
                        <p className="text-xs text-gray-500">掌握度</p>
                      </div>
                      <div className="w-16 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${item.mastery}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
