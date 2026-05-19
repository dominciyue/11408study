"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

function masteryToStarsLevel(m: number): number {
  const v = Math.max(0, Math.min(100, m));
  if (v <= 20) return 1;
  if (v <= 40) return 2;
  if (v <= 60) return 3;
  if (v <= 80) return 4;
  return 5;
}

/**
 * 热度地图配色:按 mastery 把节点底色覆写为红/橙/绿/灰,一眼看出薄弱区。
 * undefined / 0 = 未学(灰), 1-29 = 薄弱(红), 30-69 = 一般(琥珀), 70+ = 掌握(绿)。
 */
function masteryHeatColors(m: number | undefined): { border: string; bg: string; text: string } {
  if (m == null || !Number.isFinite(m) || m <= 0) {
    return { border: "border-gray-600/40", bg: "bg-gray-700/20", text: "text-gray-300" };
  }
  if (m < 30) return { border: "border-red-500/50", bg: "bg-red-500/10", text: "text-red-300" };
  if (m < 70) return { border: "border-amber-500/50", bg: "bg-amber-500/10", text: "text-amber-300" };
  return { border: "border-emerald-500/50", bg: "bg-emerald-500/10", text: "text-emerald-300" };
}

const difficultyColors: Record<string, string> = {
  EASY: "bg-green-500",
  MEDIUM: "bg-yellow-500",
  HARD: "bg-red-500",
};

const subjectColors: Record<string, { border: string; bg: string; text: string }> = {
  "数据结构": { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-300" },
  "计算机组成原理": { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-300" },
  "操作系统": { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-300" },
  "计算机网络": { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-300" },
  "高等数学": { border: "border-green-500/40", bg: "bg-green-500/10", text: "text-green-300" },
  "线性代数": { border: "border-green-500/40", bg: "bg-green-500/10", text: "text-green-300" },
  "概率论与数理统计": { border: "border-green-500/40", bg: "bg-green-500/10", text: "text-green-300" },
  default: { border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-300" },
};

export interface KnowledgeNodeData {
  label: string;
  topicName?: string;
  subjectName?: string;
  difficulty?: string;
  mastery?: number;
  selected?: boolean;
  dimmed?: boolean;
  heatmap?: boolean;
  [key: string]: unknown;
}

function KnowledgeNodeComponent({ data }: NodeProps) {
  const nodeData = data as KnowledgeNodeData;
  const subjectPalette = subjectColors[nodeData.topicName || ""] || subjectColors["default"];
  const colors = nodeData.heatmap ? masteryHeatColors(nodeData.mastery) : subjectPalette;
  const diffColor = difficultyColors[nodeData.difficulty || "MEDIUM"] || difficultyColors.MEDIUM;

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-200 min-w-[140px] max-w-[200px]",
        colors.border,
        colors.bg,
        nodeData.selected && "ring-2 ring-blue-400 scale-105",
        nodeData.dimmed && "opacity-30"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-500 !w-2 !h-2 !border-0" />

      <div className="flex items-start gap-2">
        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", diffColor)} />
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-medium leading-tight truncate", colors.text)}>
            {nodeData.label}
          </p>
          {nodeData.topicName && (
            <p className="text-[10px] text-gray-500 mt-1 truncate">{nodeData.topicName}</p>
          )}
        </div>
      </div>

      {nodeData.mastery !== undefined && nodeData.mastery > 0 && (
        <div className="mt-2 flex items-center gap-0.5" title={`掌握度 ${nodeData.mastery}%`}>
          {[1, 2, 3, 4, 5].map((i) => {
            const filled = i <= masteryToStarsLevel(nodeData.mastery!);
            return (
              <Star
                key={i}
                className={cn(
                  "w-2.5 h-2.5",
                  filled ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                )}
              />
            );
          })}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-gray-500 !w-2 !h-2 !border-0" />
    </div>
  );
}

export const KnowledgeNode = memo(KnowledgeNodeComponent);
