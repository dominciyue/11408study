"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, BookOpen, Brain, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { knowledgeApi, type AiEnhanceType } from "@/lib/api";

interface AiEnhanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: number;
  nodeTitle: string;
}

const TYPE_LABELS: { value: AiEnhanceType; label: string; icon: typeof BookOpen }[] = [
  { value: "EXPLAIN", label: "详解", icon: BookOpen },
  { value: "MNEMONIC", label: "口诀", icon: Brain },
  { value: "ANALOGY", label: "类比", icon: ImageIcon },
];

export default function AiEnhanceDialog({
  open,
  onOpenChange,
  nodeId,
  nodeTitle,
}: AiEnhanceDialogProps) {
  const [activeType, setActiveType] = useState<AiEnhanceType>("EXPLAIN");
  // 缓存每种 type 的 AI 输出，避免切换 tab 重复调用
  const cacheRef = useRef<Partial<Record<AiEnhanceType, string>>>({});
  const [content, setContent] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 关闭时重置全部状态
  useEffect(() => {
    if (!open) {
      cacheRef.current = {};
      setContent("");
      setError(null);
      setPending(false);
      setActiveType("EXPLAIN");
    }
  }, [open]);

  // 打开 + type 切换时调用 AI，命中缓存则跳过
  useEffect(() => {
    if (!open) return;
    const cached = cacheRef.current[activeType];
    if (cached) {
      setContent(cached);
      setError(null);
      return;
    }
    let cancelled = false;
    setPending(true);
    setError(null);
    setContent("");
    knowledgeApi
      .aiEnhance(nodeId, activeType)
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        if (data && typeof data.enhanced_content === "string") {
          cacheRef.current[activeType] = data.enhanced_content;
          setContent(data.enhanced_content);
        } else if (data && data.error) {
          setError(data.error);
        } else {
          setError("AI 服务返回为空");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, nodeId, activeType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col gap-3 max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-300">
            <Sparkles className="w-5 h-5" /> AI 深入解读
          </DialogTitle>
          <DialogDescription className="text-gray-400 line-clamp-1">
            {nodeTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Type 切换 */}
        <div className="flex gap-1 rounded-lg bg-white/[0.04] border border-white/[0.06] p-1">
          {TYPE_LABELS.map((t) => {
            const Icon = t.icon;
            const isActive = t.value === activeType;
            return (
              <button
                key={t.value}
                onClick={() => setActiveType(t.value)}
                disabled={pending}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-purple-500/20 text-purple-200"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                } disabled:opacity-50`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 内容区 */}
        <div className="flex-1 min-h-[260px] max-h-[55vh] overflow-y-auto rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
          {pending ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              AI 正在生成{TYPE_LABELS.find((t) => t.value === activeType)?.label}...
            </div>
          ) : error ? (
            <div className="text-sm text-red-400 whitespace-pre-wrap">{error}</div>
          ) : content ? (
            <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          ) : (
            <div className="text-sm text-gray-500">点击上方切换不同类型的 AI 解读</div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button
            variant="outline"
            size="sm"
            className="border-white/[0.08] text-gray-300"
            onClick={() => onOpenChange(false)}
          >
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as { message?: string; code?: number | string };
    if (e.message) return e.message;
    if (e.code !== undefined) return `错误码 ${e.code}`;
  }
  return "AI 调用失败，请稍后重试";
}
