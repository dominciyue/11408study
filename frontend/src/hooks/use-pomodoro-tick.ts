"use client";

import { useEffect, useRef } from "react";
import { usePomodoroStore } from "@/stores/pomodoro-store";

const requestNotificationPermission = async (): Promise<NotificationPermission | null> => {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return null;
  }
};

const fireNotification = (title: string, body: string): void => {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body });
  } catch {
    // Some browsers throw on construction outside a service worker; ignore.
  }
};

/**
 * Drives the pomodoro store: ticks every second while running and dispatches a
 * browser notification whenever a cycle completes (focus -> break, break -> focus).
 *
 * Mount this hook ONCE near the app root (e.g. inside the layout component).
 */
export function usePomodoroTick(): void {
  const isRunning = usePomodoroStore((s) => s.isRunning);
  const tick = usePomodoroStore((s) => s.tick);
  const flashKey = usePomodoroStore((s) => s.flashKey);
  const mode = usePomodoroStore((s) => s.mode);

  // Track previous flashKey to detect cycle completions (flashKey is monotonic).
  const previousFlashKeyRef = useRef(flashKey);

  // Ask for notification permission once running starts (gesture-driven).
  useEffect(() => {
    if (!isRunning) return;
    void requestNotificationPermission();
  }, [isRunning]);

  // Tick interval.
  useEffect(() => {
    if (!isRunning) return;
    const intervalId = window.setInterval(() => {
      tick();
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [isRunning, tick]);

  // Notify on cycle completion. After complete(), `mode` is already the NEW mode.
  useEffect(() => {
    if (flashKey === previousFlashKeyRef.current) return;
    previousFlashKeyRef.current = flashKey;

    // Just transitioned: if the new mode is "break", we just finished focus.
    if (mode === "break") {
      fireNotification("专注完成", "休息 5 分钟，放松一下。");
    } else {
      fireNotification("休息结束", "开始新的 25 分钟专注。");
    }
  }, [flashKey, mode]);
}
