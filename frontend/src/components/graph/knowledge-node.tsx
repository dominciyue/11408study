"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

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
  [key: string]: unknown;
}

function KnowledgeNodeComponent({ data }: NodeProps) {
  const nodeData = data as KnowledgeNodeData;
  const colors = subjectColors[nodeData.topicName || ""] || subjectColors["default"];
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
        <div className="mt-2">
          <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${nodeData.mastery}%` }}
            />
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-gray-500 !w-2 !h-2 !border-0" />
    </div>
  );
}

export const KnowledgeNode = memo(KnowledgeNodeComponent);
