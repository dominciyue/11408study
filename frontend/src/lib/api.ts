import axios from "axios";
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Subject,
  Topic,
  KnowledgeNode,
  KnowledgeEdge,
  GraphData,
  Material,
  StudyProgress,
  QuizQuestion,
  WrongAnswer,
  Note,
  StudySession,
  StudyFeedback,
  QuizSubmission,
  StatsOverview,
  User,
} from "@/types";
import { getToken, clearAuth } from "@/lib/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<unknown, ApiResponse<AuthResponse>>("/auth/login", data),
  register: (data: RegisterRequest) =>
    api.post<unknown, ApiResponse<AuthResponse>>("/auth/register", data),
  refresh: (refreshToken: string) =>
    api.post<unknown, ApiResponse<AuthResponse>>("/auth/refresh", { refreshToken }),
  me: () => api.get<unknown, ApiResponse<User>>("/auth/me"),
};

// ─── Subjects ────────────────────────────────────────────────────────────────
export const subjectsApi = {
  list: () => api.get<unknown, ApiResponse<Subject[]>>("/subjects"),
  get: (id: number) => api.get<unknown, ApiResponse<Subject>>(`/subjects/${id}`),
};

// ─── Topics ──────────────────────────────────────────────────────────────────
export const topicsApi = {
  listBySubject: (subjectId: number) =>
    api.get<unknown, ApiResponse<Topic[]>>(`/subjects/${subjectId}/topics`),
  get: (id: number) => api.get<unknown, ApiResponse<Topic>>(`/topics/${id}`),
};

// ─── Knowledge Nodes & Edges ─────────────────────────────────────────────────
export type AiEnhanceType = "EXPLAIN" | "MNEMONIC" | "ANALOGY";

export const knowledgeApi = {
  aiEnhance: (nodeId: number, type: AiEnhanceType = "EXPLAIN") =>
    api.post<unknown, ApiResponse<{ enhanced_content?: string; enhance_type?: string; error?: string }>>(
      `/knowledge/nodes/${nodeId}/ai-enhance`,
      null,
      { params: { type }, timeout: 90000 } // LLM 详解通常 5-30s
    ),
  getNodes: (params?: { subjectId?: number; topicId?: number; difficulty?: number }) =>
    api.get<unknown, ApiResponse<KnowledgeNode[]>>("/knowledge/nodes", { params }),
  getNode: (id: number) =>
    api.get<unknown, ApiResponse<KnowledgeNode>>(`/knowledge/nodes/${id}`),
  createNode: (data: { title: string; content: string; difficulty?: number; topicId: number; metadata?: Record<string, unknown> }) =>
    api.post<unknown, ApiResponse<KnowledgeNode>>("/knowledge/nodes", data),
  createEdge: (data: { sourceId: number; targetId: number; relationType: string; weight?: number; description?: string }) =>
    api.post<unknown, ApiResponse<KnowledgeEdge>>("/knowledge/edges", data),
  getEdges: (params?: { subjectId?: number }) =>
    api.get<unknown, ApiResponse<KnowledgeEdge[]>>("/knowledge/edges", { params }),
  getGraphData: (params?: { subjectId?: number; topicId?: number }) =>
    api.get<unknown, ApiResponse<GraphData>>("/knowledge/graph", { params }),
};

// ─── Study ───────────────────────────────────────────────────────────────────
export const studyApi = {
  getProgress: () =>
    api.get<unknown, ApiResponse<StudyProgress[]>>("/study/progress"),
  getNodeProgress: (nodeId: number) =>
    api.get<unknown, ApiResponse<StudyProgress>>(`/study/progress/${nodeId}`),
  submitFeedback: (data: StudyFeedback) =>
    api.post<unknown, ApiResponse<void>>("/study/feedback", data),
  getReviewQueue: () =>
    api.get<unknown, ApiResponse<KnowledgeNode[]>>("/study/review-queue"),
  getStudyPath: (subjectId: number) =>
    api.get<unknown, ApiResponse<KnowledgeNode[]>>(`/study/path/${subjectId}`),
  startSession: (data: { subjectId?: number; mode: string }) =>
    api.post<unknown, ApiResponse<StudySession>>("/study/sessions", data),
  endSession: (sessionId: number) =>
    api.put<unknown, ApiResponse<StudySession>>(`/study/sessions/${sessionId}/end`),
};

// ─── Quiz ────────────────────────────────────────────────────────────────────
export const quizApi = {
  generate: (nodeIds: number[], count: number = 10) =>
    api.post<unknown, ApiResponse<QuizQuestion[]>>("/quiz/generate", null, { params: { nodeIds, count } }),
  submit: (data: { questionId: number; userAnswer: string }) =>
    api.post<unknown, ApiResponse<{ correct: boolean; correctAnswer: string; explanation?: string }>>(
      "/quiz/submit",
      data
    ),
  getWrongAnswers: () =>
    api.get<unknown, ApiResponse<WrongAnswer[]>>("/quiz/wrong-answers"),
  adaptiveGenerate: (subjectId?: number, count: number = 10) =>
    api.post<unknown, ApiResponse<QuizQuestion[]>>(
      "/quiz/adaptive-generate",
      null,
      { params: { subjectId, count } }
    ),
  aiExplain: (
    questionId: number,
    body: {
      userAnswer: string;
      history?: { role: "user" | "assistant"; content: string }[];
    }
  ) =>
    api.post<unknown, ApiResponse<{ reply?: string; error?: string }>>(
      `/quiz/${questionId}/ai-explain`,
      body,
      { timeout: 90000 } // LLM 调用 5-30s 不等，避免被默认 15s 超时截掉
    ),
};

// ─── Materials ───────────────────────────────────────────────────────────────
export const materialsApi = {
  list: (params?: { subjectId?: number; type?: string }) =>
    api.get<unknown, ApiResponse<Material[]>>("/materials", { params }),
  get: (id: number) =>
    api.get<unknown, ApiResponse<Material>>(`/materials/${id}`),
  upload: (formData: FormData) =>
    api.post<unknown, ApiResponse<Material>>("/materials/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: number) =>
    api.delete<unknown, ApiResponse<void>>(`/materials/${id}`),
};

// ─── Notes ───────────────────────────────────────────────────────────────────
export const notesApi = {
  list: (params?: { nodeId?: number }) =>
    api.get<unknown, ApiResponse<Note[]>>("/notes", { params }),
  create: (data: { nodeId: number; content: string; title?: string }) =>
    api.post<unknown, ApiResponse<Note>>("/notes", data),
  update: (id: number, data: { content: string; title?: string }) =>
    api.put<unknown, ApiResponse<Note>>(`/notes/${id}`, data),
  delete: (id: number) =>
    api.delete<unknown, ApiResponse<void>>(`/notes/${id}`),
};

// ─── Stats ───────────────────────────────────────────────────────────────────
export const statsApi = {
  overview: () =>
    api.get<unknown, ApiResponse<StatsOverview>>("/stats/overview"),
  daily: () =>
    api.get<unknown, ApiResponse<Array<{ date: string; sessions: number; studiedNodes: number; reviewedNodes: number; studyMinutes: number }>>>(
      "/stats/daily"
    ),
  weakness: () =>
    api.get<unknown, ApiResponse<{ topWrongNodes: Array<{ nodeId: number; wrongCount: number; nodeTitle?: string; topicName?: string }>; lowMasteryNodes: Array<{ nodeId: number; masteryLevel: number; nodeTitle?: string }> }>>(
      "/stats/weakness"
    ),
};

export default api;
