"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Activity, ChevronDown, ChevronRight, Target } from "lucide-react";
import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { statsApi } from "@/lib/api";
import type { WeaknessRadarResponse } from "@/types";

/**
 * 弱点画像卡 — 4 学科 mastery 雷达 + Top10 弱 topic 详情。
 *
 * <p>数据来自 GET /api/stats/weakness-radar，自带空数据兜底。
 * 该组件自身负责拉数据 + loading / error，调用方只需 <WeaknessRadarCard/>。
 */
export function WeaknessRadarCard() {
  const [data, setData] = useState<WeaknessRadarResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    statsApi
      .getWeaknessRadar()
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => {
        // 静默失败：UI 会显示"暂无画像"兜底
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 雷达数据：4 个学科一条 polygon。即便后端少返学科也直接显示，不补位。
  const radarData = useMemo(() => {
    const subjects = data?.subjects ?? [];
    return subjects.map((s) => ({
      subject: s.name,
      mastery: Math.max(0, Math.min(100, Math.round(s.mastery))),
    }));
  }, [data]);

  // 空数据判定：完全没有学科 OR 所有 studied=0
  const isEmpty = useMemo(() => {
    const subjects = data?.subjects ?? [];
    if (subjects.length === 0) return true;
    return subjects.every((s) => s.studied === 0);
  }, [data]);

  const weakTopics = data?.weakTopics ?? [];

  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <CardTitle className="text-base text-gray-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            弱点画像
          </span>
          {!isEmpty && weakTopics.length > 0 ? (
            <Badge variant="outline" className="border-white/[0.08] text-gray-400 text-xs font-normal">
              {weakTopics.length} 个薄弱主题
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-gray-500 h-56 flex items-center justify-center">
            加载中…
          </div>
        ) : isEmpty ? (
          <div className="text-sm text-gray-500 h-56 flex flex-col items-center justify-center gap-2">
            <Target className="w-8 h-8 text-gray-600" />
            <p>开始练几道题就能看到画像了。</p>
          </div>
        ) : (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.12)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                    angle={90}
                  />
                  <Radar
                    name="掌握度"
                    dataKey="mastery"
                    stroke="rgba(167, 139, 250, 0.9)"
                    fill="rgba(167, 139, 250, 0.35)"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.92)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.9)",
                    }}
                    formatter={(v) => [`${v ?? 0}/100`, "掌握度"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* 学科一行小指标，方便看具体数值 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(data?.subjects ?? []).map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2"
                  title={`${s.studied}/${s.nodes} 个节点已学习`}
                >
                  <p className="text-xs text-gray-500">{s.name}</p>
                  <p className="text-base font-semibold text-purple-300 mt-0.5">
                    {Math.round(s.mastery)}
                    <span className="text-[10px] text-gray-500 font-normal"> /100</span>
                  </p>
                </div>
              ))}
            </div>

            {weakTopics.length > 0 ? (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 h-7 text-xs text-gray-400 hover:text-gray-200"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? (
                    <ChevronDown className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 mr-1" />
                  )}
                  Top {weakTopics.length} 薄弱主题
                </Button>
                {expanded ? (
                  <div className="mt-2 space-y-2">
                    {weakTopics.map((t) => {
                      const pct = Math.max(0, Math.min(100, Math.round(t.mastery)));
                      return (
                        <div
                          key={t.id}
                          className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-200 truncate flex-1 mr-2">
                              {t.name}
                              {t.subjectName ? (
                                <span className="text-gray-500 ml-1.5">· {t.subjectName}</span>
                              ) : null}
                            </span>
                            <span className="text-orange-300 shrink-0">{pct} / 100</span>
                          </div>
                          <Progress
                            value={pct}
                            className="h-1.5 mt-1.5"
                            indicatorClassName="bg-orange-500"
                          />
                          <p className="text-[10px] text-gray-500 mt-1">{t.nodes} 个节点</p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default WeaknessRadarCard;
