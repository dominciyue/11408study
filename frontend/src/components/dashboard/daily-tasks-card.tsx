"use client";

import React from "react";
import { ListChecks, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DailyTask } from "@/types";

interface DailyTasksCardProps {
  tasks: DailyTask[] | undefined;
}

export function DailyTasksCard({ tasks }: DailyTasksCardProps) {
  if (!tasks) return null;
  const done = tasks.filter((t) => t.completed).length;

  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <CardTitle className="text-base text-gray-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-green-400" />
            今日任务
          </span>
          <span className="text-xs text-gray-500 font-normal">
            完成 {done} / {tasks.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((t) => {
          const pct = Math.min(100, Math.round((t.current / Math.max(t.target, 1)) * 100));
          return (
            <div key={t.code}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-300">
                  {t.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-500" />
                  )}
                  <span className={t.completed ? "line-through text-gray-500" : ""}>
                    {t.name}
                  </span>
                </span>
                <span
                  className={
                    t.completed ? "text-green-400 text-xs" : "text-gray-400 text-xs"
                  }
                >
                  {t.current} / {t.target}
                </span>
              </div>
              <Progress
                value={pct}
                className="h-1.5 mt-1.5"
                indicatorClassName={t.completed ? "bg-green-500" : "bg-blue-500"}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
