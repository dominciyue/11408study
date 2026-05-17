"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { quizApi } from "@/lib/api";

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

interface AiExplainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: number;
  userAnswer: string;
  questionPreview?: string;
}

export default function AiExplainDialog({
  open,
  onOpenChange,
  questionId,
  userAnswer,
  questionPreview,
}: AiExplainDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, pending]);

  useEffect(() => {
    if (!open) return;
    if (messages.length > 0) return;
    let cancelled = false;
    setPending(true);
    setError(null);
    quizApi
      .aiExplain(questionId, { userAnswer })
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        if (data && typeof data.reply === "string") {
          setMessages([{ role: "assistant", content: data.reply }]);
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
  }, [open, questionId, userAnswer, messages.length]);

  useEffect(() => {
    if (!open) {
      setMessages([]);
      setInput("");
      setError(null);
      setPending(false);
    }
  }, [open]);

  async function sendFollowup() {
    const text = input.trim();
    if (!text || pending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setPending(true);
    setError(null);
    try {
      // history 上限：最近 10 轮 = 20 条消息，防 DeepSeek context 4096 超限 + 费用爆炸
      const MAX_HISTORY = 20;
      const trimmedHistory = next.length > MAX_HISTORY
          ? next.slice(next.length - MAX_HISTORY)
          : next;
      const res = await quizApi.aiExplain(questionId, {
        userAnswer,
        history: trimmedHistory,
      });
      const data = res.data;
      if (data && typeof data.reply === "string") {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      } else if (data && data.error) {
        setError(data.error);
      } else {
        setError("AI 服务返回为空");
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col gap-3 max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-300">
            <Sparkles className="w-5 h-5" /> AI 启发式讲题
          </DialogTitle>
          {questionPreview ? (
            <DialogDescription className="line-clamp-2 text-gray-400">
              {questionPreview}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div
          ref={scrollerRef}
          className="flex-1 min-h-[200px] max-h-[55vh] overflow-y-auto rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-3"
        >
          {messages.length === 0 && pending ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              AI 正在分析你的答案...
            </div>
          ) : null}

          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "assistant"
                  ? "text-gray-200 whitespace-pre-wrap text-sm leading-relaxed"
                  : "text-blue-200 text-sm whitespace-pre-wrap pl-3 border-l-2 border-blue-500/40"
              }
            >
              {m.role === "user" ? "Q: " : null}
              {m.content}
            </div>
          ))}

          {pending && messages.length > 0 ? (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" /> 思考中...
            </div>
          ) : null}

          {error ? (
            <div className="text-sm text-red-400 whitespace-pre-wrap">{error}</div>
          ) : null}
        </div>

        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="继续追问，比如：为什么不能选 C？"
            rows={2}
            disabled={pending}
            className="flex-1 rounded-lg border border-white/[0.08] bg-white/5 p-2 text-sm text-gray-200 outline-none focus:border-blue-500/40 resize-none disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendFollowup();
              }
            }}
          />
          <Button
            onClick={sendFollowup}
            disabled={!input.trim() || pending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
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
