"use client";

import { useEffect } from "react";

/**
 * Next App Router 段级 error boundary —— 任意子页面/组件抛 throw 时被这里接住，
 * 防止"单组件崩 → 整页白屏"。reset() 会让用户重试该段。
 *
 * 对应 H2 修复：之前全站无 error boundary，graph-store 引用不存在字段、
 * resources new URL 异常、recharts 数据格式异常等都会让整页变白屏不可恢复。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground px-4">
      <div className="max-w-md w-full p-6 rounded-xl border border-red-500/30 bg-red-500/5 space-y-3">
        <div className="text-lg font-semibold text-red-300">页面加载出错</div>
        <div className="text-sm text-muted-foreground break-words">
          {error.message || "未知错误"}
          {error.digest ? (
            <span className="block text-[10px] text-muted-foreground/60 mt-1 font-mono">
              digest: {error.digest}
            </span>
          ) : null}
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            重试
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-3 py-1.5 rounded-md border border-white/10 text-sm hover:bg-foreground/5"
          >
            回到仪表盘
          </button>
        </div>
      </div>
    </div>
  );
}
