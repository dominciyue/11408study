import { create } from "zustand";

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

export const usePomodoroStore = create<PomodoroState & PomodoroActions>((set, get) => ({
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
}));

export const formatTime = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
