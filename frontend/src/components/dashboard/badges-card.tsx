"use client";

import React from "react";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Badge } from "@/types";

interface BadgesCardProps {
  badges: Badge[] | undefined;
}

export function BadgesCard({ badges }: BadgesCardProps) {
  if (!badges) return null;
  const earned = badges.filter((b) => b.earned).length;

  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <CardTitle className="text-base text-gray-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            徽章成就
          </span>
          <span className="text-xs text-gray-500 font-normal">
            已解锁 {earned} / {badges.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {badges.map((b) => {
            const pct = Math.min(100, Math.round((b.current / Math.max(b.target, 1)) * 100));
            return (
              <div
                key={b.code}
                className={
                  b.earned
                    ? "rounded-xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/15 to-orange-500/5 p-2 text-center transition-transform hover:scale-105"
                    : "rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center grayscale opacity-60"
                }
                title={`${b.name} — ${b.description}（${b.current}/${b.target}）`}
              >
                <div className="text-2xl leading-tight">{b.icon}</div>
                <div className="text-[10px] text-gray-300 mt-1 line-clamp-1">{b.name}</div>
                {!b.earned ? (
                  <div className="mt-1 h-0.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-blue-400/60 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
