"use client";

import { useState } from "react";
import { Cherry, Coffee, Pause, Play, RotateCcw, Timer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  durationFor,
  formatTime,
  usePomodoroStore,
  type PomodoroMode,
} from "@/stores/pomodoro-store";
import { usePomodoroTick } from "@/hooks/use-pomodoro-tick";

const MODE_LABEL: Record<PomodoroMode, string> = {
  focus: "专注",
  break: "休息",
};

const focusTone = "from-orange-500 to-red-500";
const breakTone = "from-teal-500 to-emerald-500";

export function PomodoroFab() {
  // Drives the timer + notifications globally for the whole app.
  usePomodoroTick();

  const [open, setOpen] = useState(false);

  const mode = usePomodoroStore((s) => s.mode);
  const secondsLeft = usePomodoroStore((s) => s.secondsLeft);
  const isRunning = usePomodoroStore((s) => s.isRunning);
  const completedFocusCycles = usePomodoroStore((s) => s.completedFocusCycles);
  const flashKey = usePomodoroStore((s) => s.flashKey);
  const start = usePomodoroStore((s) => s.start);
  const pause = usePomodoroStore((s) => s.pause);
  const reset = usePomodoroStore((s) => s.reset);

  const isFocus = mode === "focus";
  const totalForMode = durationFor(mode);
  const progress = Math.min(100, Math.max(0, ((totalForMode - secondsLeft) / totalForMode) * 100));

  const fabBg = isFocus
    ? "bg-orange-500 hover:bg-orange-600"
    : "bg-teal-500 hover:bg-teal-600";

  return (
    <>
      {/* Visual flash overlay – animates briefly each time a cycle completes. */}
      {flashKey > 0 && (
        <div
          key={`pomodoro-flash-${flashKey}`}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-40"
          style={{
            animation: "pomodoro-flash 800ms ease-out 1",
            backgroundColor: isFocus
              ? "rgba(249, 115, 22, 0.18)"
              : "rgba(20, 184, 166, 0.18)",
            opacity: 0,
          }}
        />
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`番茄钟 (${MODE_LABEL[mode]} ${formatTime(secondsLeft)})`}
        className={cn(
          "fixed right-6 bottom-6 z-50 flex h-16 w-16 flex-col items-center justify-center rounded-full text-white shadow-lg shadow-black/40 transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]",
          fabBg
        )}
      >
        {isFocus ? (
          <Cherry className="h-5 w-5" strokeWidth={2.25} />
        ) : (
          <Coffee className="h-5 w-5" strokeWidth={2.25} />
        )}
        <span className="mt-0.5 font-mono text-[11px] leading-none tracking-tight">
          {formatTime(secondsLeft)}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-gray-300" />
              番茄钟
            </DialogTitle>
            <DialogDescription>
              25 分钟专注 / 5 分钟休息，按节奏循环。
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  isFocus
                    ? "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30"
                    : "bg-white/5 text-gray-400 ring-1 ring-white/10"
                )}
              >
                专注 25:00
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  !isFocus
                    ? "bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/30"
                    : "bg-white/5 text-gray-400 ring-1 ring-white/10"
                )}
              >
                休息 05:00
              </span>
            </div>

            <div
              className={cn(
                "relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br p-1",
                isFocus ? focusTone : breakTone
              )}
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#111118]">
                <span className="font-mono text-4xl font-semibold tracking-tight text-white tabular-nums">
                  {formatTime(secondsLeft)}
                </span>
                <span className="mt-1 text-xs uppercase tracking-widest text-gray-400">
                  {MODE_LABEL[mode]}
                </span>
              </div>
            </div>

            <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-[width] duration-500",
                  isFocus ? focusTone : breakTone
                )}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex w-full items-center gap-2">
              {isRunning ? (
                <Button onClick={pause} variant="secondary" className="flex-1">
                  <Pause className="h-4 w-4" />
                  暂停
                </Button>
              ) : (
                <Button onClick={start} className="flex-1">
                  <Play className="h-4 w-4" />
                  开始
                </Button>
              )}
              <Button onClick={reset} variant="outline" size="icon" aria-label="重置">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex w-full items-center justify-between text-xs text-gray-400">
              <span>已完成专注周期</span>
              <span className="font-mono text-sm text-gray-200 tabular-nums">
                {completedFocusCycles}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
