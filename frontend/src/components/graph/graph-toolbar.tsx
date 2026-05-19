"use client";

import React from "react";
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/**
 * masteryFilter: null = 全部 | 0 = 未学（mastery<=0 / undefined） | 1-5 = 该星级
 */
export type MasteryFilter = null | 0 | 1 | 2 | 3 | 4 | 5;

interface GraphToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  masteryFilter?: MasteryFilter;
  onMasteryFilter?: (filter: MasteryFilter) => void;
  heatmapOn?: boolean;
  onHeatmapToggle?: (next: boolean) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onReset: () => void;
  nodeCount: number;
  edgeCount: number;
}

const MASTERY_OPTIONS: { value: MasteryFilter; label: string }[] = [
  { value: null, label: "全部" },
  { value: 0, label: "未学" },
  { value: 1, label: "1 星" },
  { value: 2, label: "2 星" },
  { value: 3, label: "3 星" },
  { value: 4, label: "4 星" },
  { value: 5, label: "5 星" },
];

export function GraphToolbar({
  searchQuery,
  onSearchChange,
  masteryFilter = null,
  onMasteryFilter,
  heatmapOn = false,
  onHeatmapToggle,
  onZoomIn,
  onZoomOut,
  onFitView,
  onReset,
  nodeCount,
  edgeCount,
}: GraphToolbarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative pointer-events-auto w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="搜索知识点..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-[#111118]/90 backdrop-blur-md border-white/[0.08] text-sm"
          />
        </div>

        {/* Subject 子主题筛选：原硬编码 ds/co/os/cn 仅 408 适用，现已移除；
            学科切换由 /subjects 入口或 URL ?subjectId= 控制。 */}

        {/* Heatmap toggle — 热度地图：按掌握度给节点上色（红=薄弱/黄=一般/绿=已掌握） */}
        {onHeatmapToggle ? (
          <div className="pointer-events-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onHeatmapToggle(!heatmapOn)}
              className={
                heatmapOn
                  ? "bg-orange-500/15 border-orange-500/40 text-orange-300 hover:bg-orange-500/25"
                  : "bg-[#111118]/90 border-white/[0.08] text-gray-300 hover:bg-white/10"
              }
              title="按掌握度给节点上色"
            >
              <Flame className="w-3.5 h-3.5 mr-1.5" />
              热度地图
            </Button>
          </div>
        ) : null}

        {/* Mastery filter */}
        {onMasteryFilter ? (
          <div className="pointer-events-auto">
            <select
              value={masteryFilter === null ? "ALL" : String(masteryFilter)}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "ALL") onMasteryFilter(null);
                else onMasteryFilter(Number(v) as MasteryFilter);
              }}
              className="rounded-md border border-white/[0.08] bg-[#111118]/90 backdrop-blur-md px-2.5 py-1.5 text-xs text-gray-300 outline-none focus:border-yellow-500/40 cursor-pointer"
              title="按能力等级筛选；非匹配节点会被淡化"
            >
              {MASTERY_OPTIONS.map((o) => (
                <option key={String(o.value)} value={o.value === null ? "ALL" : String(o.value)}>
                  {o.value === null ? "★ 全部" : (o.value === 0 ? "○ 未学" : "★ " + o.label)}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="flex-1" />

        {/* Stats */}
        <div className="pointer-events-auto flex items-center gap-2">
          <Badge variant="outline" className="bg-[#111118]/90 backdrop-blur-md border-white/[0.08] text-gray-400 text-xs">
            {nodeCount} 个知识点
          </Badge>
          <Badge variant="outline" className="bg-[#111118]/90 backdrop-blur-md border-white/[0.08] text-gray-400 text-xs">
            {edgeCount} 条关系
          </Badge>
        </div>

        {/* Zoom controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-[#111118]/90 backdrop-blur-md rounded-lg border border-white/[0.08] p-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-200" onClick={onZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-200" onClick={onZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-200" onClick={onFitView}>
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-200" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
