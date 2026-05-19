"use client";

import React, { useMemo } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  /** 最近 365 天逐日学习分钟数 (oldest -> newest)。 */
  minutesByDay?: number[];
}

const COLS = 53;
const ROWS = 7;
const MS_PER_DAY = 24 * 3600 * 1000;
const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

/** 0/1/2/3/4 五档强度,>=120min 视为最深。 */
function intensityLevel(minutes: number): number {
  if (minutes < 1) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

const INTENSITY_CLASS = [
  "bg-white/[0.04]",
  "bg-emerald-600/25",
  "bg-emerald-500/45",
  "bg-emerald-400/65",
  "bg-emerald-300/90",
];

interface Cell {
  date: Date;
  minutes: number;
  row: number; // 0=Sun..6=Sat
  col: number; // 0..COLS-1
}

interface Layout {
  cells: Cell[];
  monthLabels: { col: number; label: string }[];
  totalMinutes: number;
  activeDays: number;
}

function buildLayout(minutesByDay: number[] | undefined): Layout | null {
  if (!minutesByDay || minutesByDay.length === 0) return null;

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const weekStart = new Date(todayMidnight);
  weekStart.setDate(weekStart.getDate() - todayMidnight.getDay()); // 本周日

  const firstDate = new Date(todayMidnight);
  firstDate.setDate(firstDate.getDate() - (minutesByDay.length - 1));

  const cells: Cell[] = [];
  const monthSeen = new Set<number>();
  const monthLabels: { col: number; label: string }[] = [];
  let totalMinutes = 0;
  let activeDays = 0;

  for (let i = 0; i < minutesByDay.length; i++) {
    const cellDate = new Date(firstDate);
    cellDate.setDate(cellDate.getDate() + i);
    const dow = cellDate.getDay();
    const dayDiff = Math.floor((cellDate.getTime() - weekStart.getTime()) / MS_PER_DAY);
    const weeksFromStart = Math.floor(dayDiff / 7);
    const col = COLS - 1 + weeksFromStart;
    if (col < 0 || col >= COLS) continue;

    const minutes = minutesByDay[i] ?? 0;
    cells.push({ date: cellDate, minutes, row: dow, col });
    totalMinutes += minutes;
    if (minutes > 0) activeDays += 1;

    // 月份切换 — 每月第一次出现时记下列位置
    const month = cellDate.getMonth();
    const monthKey = cellDate.getFullYear() * 12 + month;
    if (!monthSeen.has(monthKey)) {
      monthSeen.add(monthKey);
      monthLabels.push({ col, label: MONTH_LABELS[month] });
    }
  }

  return { cells, monthLabels, totalMinutes, activeDays };
}

export function StudyHeatmapCard({ minutesByDay }: Props) {
  const layout = useMemo(() => buildLayout(minutesByDay), [minutesByDay]);

  if (!layout) {
    return null; // 没数据时不渲染整张卡(避免大空格)
  }

  // matrix[row][col] = cell (or null)
  const matrix: (Cell | null)[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null as Cell | null),
  );
  for (const c of layout.cells) {
    matrix[c.row][c.col] = c;
  }

  const hours = (layout.totalMinutes / 60).toFixed(1);

  return (
    <Card className="border-white/[0.06]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-gray-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          学习热力图
          <span className="ml-2 text-xs text-gray-500 font-normal">
            过去一年 · {layout.activeDays} 天活跃 · 累计 {hours} 小时
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 用 overflow-x 兜底窄屏 */}
        <div className="overflow-x-auto">
          <div className="inline-flex flex-col gap-1 min-w-[700px]">
            {/* 月份标签行 */}
            <div className="flex gap-[3px] pl-7 text-[10px] text-gray-500 relative h-3">
              {layout.monthLabels.map(({ col, label }) => (
                <span
                  key={`${col}-${label}`}
                  className="absolute"
                  style={{ left: `${28 + col * 13}px` }}
                >
                  {label}
                </span>
              ))}
            </div>
            {/* 7 行 × 53 列 */}
            <div className="flex gap-[3px]">
              {/* 行标签 (周一/三/五) */}
              <div className="flex flex-col gap-[3px] pr-1 text-[10px] text-gray-500">
                {["", "一", "", "三", "", "五", ""].map((d, i) => (
                  <span key={i} className="h-[10px] leading-[10px]">
                    {d}
                  </span>
                ))}
              </div>
              {/* 网格 */}
              <div className="flex gap-[3px]">
                {Array.from({ length: COLS }, (_, col) => (
                  <div key={col} className="flex flex-col gap-[3px]">
                    {Array.from({ length: ROWS }, (_, row) => {
                      const cell = matrix[row][col];
                      if (!cell) {
                        return <span key={row} className="w-[10px] h-[10px] rounded-sm" />;
                      }
                      const lv = intensityLevel(cell.minutes);
                      const dateStr = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, "0")}-${String(cell.date.getDate()).padStart(2, "0")}`;
                      return (
                        <span
                          key={row}
                          className={`w-[10px] h-[10px] rounded-sm ${INTENSITY_CLASS[lv]}`}
                          title={`${dateStr} · ${cell.minutes} 分钟`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            {/* 强度色例 */}
            <div className="flex items-center gap-2 text-[10px] text-gray-500 pl-7 mt-1">
              <span>少</span>
              {INTENSITY_CLASS.map((cls, i) => (
                <span key={i} className={`w-[10px] h-[10px] rounded-sm ${cls}`} />
              ))}
              <span>多</span>
              <span className="ml-3 text-gray-600">&lt;1min / &lt;30 / &lt;60 / &lt;120 / ≥120</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
