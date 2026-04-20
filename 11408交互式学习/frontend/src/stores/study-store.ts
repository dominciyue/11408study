import { create } from "zustand";
import type { KnowledgeNode, StudyProgress, StudyFeedback } from "@/types";
import { studyApi } from "@/lib/api";

interface StudyState {
  currentNode: KnowledgeNode | null;
  reviewQueue: KnowledgeNode[];
  studyPath: KnowledgeNode[];
  progress: StudyProgress[];
  streak: number;
  isLoading: boolean;
}

interface StudyActions {
  fetchReviewQueue: () => Promise<void>;
  fetchStudyPath: (subjectId: number) => Promise<void>;
  fetchProgress: () => Promise<void>;
  submitFeedback: (data: StudyFeedback) => Promise<void>;
  setCurrentNode: (node: KnowledgeNode | null) => void;
}

export const useStudyStore = create<StudyState & StudyActions>((set) => ({
  currentNode: null,
  reviewQueue: [],
  studyPath: [],
  progress: [],
  streak: 0,
  isLoading: false,

  fetchReviewQueue: async () => {
    set({ isLoading: true });
    try {
      const res = await studyApi.getReviewQueue();
      set({ reviewQueue: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchStudyPath: async (subjectId) => {
    set({ isLoading: true });
    try {
      const res = await studyApi.getStudyPath(subjectId);
      set({ studyPath: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchProgress: async () => {
    set({ isLoading: true });
    try {
      const res = await studyApi.getProgress();
      set({ progress: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  submitFeedback: async (data) => {
    try {
      await studyApi.submitFeedback(data);
    } catch {
      // handled upstream
    }
  },

  setCurrentNode: (node) => set({ currentNode: node }),
}));
