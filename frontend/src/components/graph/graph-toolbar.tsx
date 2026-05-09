"use client";

import React from "react";
import {
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Star,
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
  activeSubject: string | null;
  onSubjectFilter: (subject: string | null) => void;
  masteryFilter?: MasteryFilter;
  onMasteryFilter?: (filter: MasteryFilter) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onReset: () => void;
  nodeCount: number;
  edgeCount: number;
}

const subjects = [
  { code: "ds", name: "数据结构", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { code: "co", name: "组成原理", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { code: "os", name: "操作系统", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { code: "cn", name: "计算机网络", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
];

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
  activeSubject,
  onSubjectFilter,
  masteryFilter = null,
  onMasteryFilter,
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

        {/* Subject filters */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <Button
            variant="outline"
            size="sm"
            className={`text-xs border-white/[0.08] bg-[#111118]/90 backdrop-blur-md ${
              activeSubject === null ? "text-blue-400 border-blue-500/30" : "text-gray-400"
            }`}
            onClick={() => onSubjectFilter(null)}
          >
            全部
          </Button>
          {subjects.map((s) => (
            <Button
              key={s.code}
              variant="outline"
              size="sm"
              className={`text-xs bg-[#111118]/90 backdrop-blur-md ${
                activeSubject === s.code ? s.color : "border-white/[0.08] text-gray-500"
              }`}
              onClick={() => onSubjectFilter(activeSubject === s.code ? null : s.code)}
            >
              {s.name}
            </Button>
          ))}
        </div>

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
