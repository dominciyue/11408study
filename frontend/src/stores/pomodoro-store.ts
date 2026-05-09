import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type PomodoroMode = "focus" | "break";

export const FOCUS_DURATION_SECONDS = 25 * 60;
export const BREAK_DURATION_SECONDS = 5 * 60;

export const durationFor = (mode: PomodoroMode): number =>
  mode === "focus" ? FOCUS_DURATION_SECONDS : BREAK_DURATION_SECONDS;

interface PomodoroState {
  mode: PomodoroMode;
  secondsLeft: number;
  isRunning: boolean;
  completedFocusCycles: number;
  /** Monotonic counter incremented every time a cycle completes; used as a flash trigger. */
  flashKey: number;
}

interface PomodoroActions {
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  complete: () => void;
}

export const usePomodoroStore = create<PomodoroState & PomodoroActions>()(
  persist(
    (set, get) => ({
      mode: "focus",
      secondsLeft: FOCUS_DURATION_SECONDS,
      isRunning: false,
      completedFocusCycles: 0,
      flashKey: 0,

      start: () => set({ isRunning: true }),

      pause: () => set({ isRunning: false }),

      reset: () =>
        set((state) => ({
          isRunning: false,
          secondsLeft: durationFor(state.mode),
        })),

      tick: () => {
        const { secondsLeft, isRunning } = get();
        if (!isRunning) return;
        if (secondsLeft <= 1) {
          // Reach zero -> hand over to complete()
          get().complete();
          return;
        }
        set({ secondsLeft: secondsLeft - 1 });
      },

      complete: () => {
        const { mode, completedFocusCycles, flashKey } = get();
        const nextMode: PomodoroMode = mode === "focus" ? "break" : "focus";
        set({
          mode: nextMode,
          secondsLeft: durationFor(nextMode),
          isRunning: false,
          completedFocusCycles:
            mode === "focus" ? completedFocusCycles + 1 : completedFocusCycles,
          flashKey: flashKey + 1,
        });
      },
    }),
    {
      name: "study11408:pomodoro-v2",
      storage: createJSONStorage(() => localStorage),
      // 不持久化 isRunning 和 flashKey：刷新后总是停在暂停态，避免后台 tick 失真；
      // flashKey 是 transient UI hint，没必要跨 session 保留。
      partialize: (s) => ({
        mode: s.mode,
        secondsLeft: s.secondsLeft,
        completedFocusCycles: s.completedFocusCycles,
      }),
    }
  )
);

export const formatTime = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
