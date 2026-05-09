"use client";

import React, { useState } from "react";
import {
  X,
  BookOpen,
  Link2,
  ArrowRight,
  Tag,
  BarChart3,
  ExternalLink,
  Sparkles,
  Star,
  Loader2,
  ListPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import AiEnhanceDialog from "@/components/graph/ai-enhance-dialog";
import { quizApi } from "@/lib/api";

interface NodeDetailPanelProps {
  node: {
    id: string;
    title: string;
    content?: string;
    difficulty?: string;
    topicName?: string;
    subjectName?: string;
    mastery?: number;
  } | null;
  relatedNodes: Array<{
    id: string;
    title: string;
    relationType: string;
  }>;
  onClose: () => void;
  onNodeClick: (nodeId: string) => void;
}

function masteryToStarsLevel(mastery100: number): number {
  const m = Math.max(0, Math.min(100, mastery100));
  if (m <= 20) return 1;
  if (m <= 40) return 2;
  if (m <= 60) return 3;
  if (m <= 80) return 4;
  return 5;
}

const relationLabels: Record<string, { label: string; color: string }> = {
  PREREQUISITE: { label: "前置依赖", color: "bg-orange-500/20 text-orange-400" },
  RELATED: { label: "相关知识", color: "bg-blue-500/20 text-blue-400" },
  EXTENDS: { label: "深入拓展", color: "bg-green-500/20 text-green-400" },
  CROSS_SUBJECT: { label: "跨学科", color: "bg-purple-500/20 text-purple-400" },
};

const difficultyLabels: Record<string, { label: string; color: string }> = {
  EASY: { label: "基础", color: "bg-green-500/20 text-green-400" },
  MEDIUM: { label: "中等", color: "bg-yellow-500/20 text-yellow-400" },
  HARD: { label: "困难", color: "bg-red-500/20 text-red-400" },
};

export function NodeDetailPanel({ node, relatedNodes, onClose, onNodeClick }: NodeDetailPanelProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const [genPending, setGenPending] = useState(false);
  const [genStatus, setGenStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  if (!node) return null;

  const diffInfo = difficultyLabels[node.difficulty || "MEDIUM"] || difficultyLabels.MEDIUM;
  const numericNodeId = Number(node.id);
  const aiEnabled = Number.isFinite(numericNodeId) && numericNodeId > 0;

  return (
    <div className="w-[380px] h-full bg-[#0f0f17] border-l border-white/[0.06] flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-base font-semibold text-gray-100 truncate flex-1">{node.title}</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-300" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-5">
          {/* Meta info */}
          <div className="flex flex-wrap gap-2">
            {node.subjectName && (
              <Badge variant="outline" className="bg-white/5 border-white/[0.08] text-gray-400 text-xs">
                {node.subjectName}
              </Badge>
            )}
            {node.topicName && (
              <Badge variant="outline" className="bg-white/5 border-white/[0.08] text-gray-400 text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {node.topicName}
              </Badge>
            )}
            <Badge className={`${diffInfo.color} text-xs`}>{diffInfo.label}</Badge>
          </div>

          {/* Mastery — 1-5 星能力等级（与知能行考研对齐） */}
          {node.mastery !== undefined && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5" />
                  能力等级
                </span>
                <span className="text-xs text-gray-300">
                  {masteryToStarsLevel(node.mastery)} 星 · {node.mastery}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => {
                  const filled = i <= masteryToStarsLevel(node.mastery!);
                  return (
                    <Star
                      key={i}
                      className={
                        filled
                          ? "w-5 h-5 text-yellow-400 fill-yellow-400"
                          : "w-5 h-5 text-gray-600"
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}

          <Separator className="bg-white/[0.06]" />

          {/* Content */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              知识点内容
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
              {node.content || "暂无内容"}
            </p>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Related nodes */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              关联知识点 ({relatedNodes.length})
            </h4>
            <div className="space-y-2">
              {relatedNodes.map((related) => {
                const relInfo = relationLabels[related.relationType] || relationLabels.RELATED;
                return (
                  <button
                    key={related.id}
                    onClick={() => onNodeClick(related.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] transition-colors text-left cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 text-gray-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate">{related.title}</p>
                      <Badge className={`${relInfo.color} text-[10px] mt-1`}>{relInfo.label}</Badge>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  </button>
                );
              })}
              {relatedNodes.length === 0 && (
                <p className="text-sm text-gray-600 text-center py-4">暂无关联知识点</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm">
              <BookOpen className="w-4 h-4 mr-2" />
              开始学习
            </Button>
            <Button
              variant="outline"
              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-sm"
              onClick={() => setAiOpen(true)}
              disabled={!aiEnabled}
              title={aiEnabled ? "AI 详解 / 口诀 / 类比" : "节点 ID 无效"}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              AI 解读
            </Button>
          </div>

          {aiEnabled ? (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full border-green-500/30 text-green-300 hover:bg-green-500/10 text-sm"
                disabled={genPending}
                onClick={async () => {
                  setGenPending(true);
                  setGenStatus(null);
                  try {
                    const res = await quizApi.generateForNode(numericNodeId, { count: 5 });
                    const d = res.data || {};
                    if (d.error) {
                      setGenStatus({ kind: "err", text: d.error });
                    } else {
                      setGenStatus({
                        kind: "ok",
                        text: `已为本节点生成 ${d.generated ?? 0} 道 ${d.questionType ?? "CHOICE"} 题`,
                      });
                    }
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "AI 调用失败";
                    setGenStatus({ kind: "err", text: msg });
                  } finally {
                    setGenPending(false);
                  }
                }}
                title="调用 DeepSeek 为本节点生成 5 道选择题并入库"
              >
                {genPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    生成中（30-90s）...
                  </>
                ) : (
                  <>
                    <ListPlus className="w-4 h-4 mr-1.5" />
                    AI 生成 5 道题入库
                  </>
                )}
              </Button>
              {genStatus ? (
                <p
                  className={
                    genStatus.kind === "ok"
                      ? "text-xs text-green-400 text-center"
                      : "text-xs text-red-400 text-center"
                  }
                >
                  {genStatus.text}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </ScrollArea>

      {aiEnabled ? (
        <AiEnhanceDialog
          open={aiOpen}
          onOpenChange={setAiOpen}
          nodeId={numericNodeId}
          nodeTitle={node.title}
        />
      ) : null}
    </div>
  );
}
