import axios from "axios";
import type {
  ApiResponse,
  PageResponse,
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
  WrongAnswerGroup,
  WrongAnswerItem,
  SimilarQuestionsResponse,
  WeaknessRadarResponse,
  Note,
  StudySession,
  StudyFeedback,
  QuizSubmission,
  StatsOverview,
  StudyPlanRecord,
  WeeklyReport,
  User,
  CuratedStudyPath,
} from "@/types";
import { getToken, clearAuth } from "@/lib/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
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
  sendEmailCode: (email: string) =>
    api.post<unknown, ApiResponse<null>>("/auth/send-email-code", { email }),
  me: () => api.get<unknown, ApiResponse<User>>("/auth/me"),
};

// ─── Stats ───────────────────────────────────────────────────────────────────
// (statsApi defined further below; this re-export adds /weekly-report support
// while staying near the related types.)

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
  /** 后端 GET /knowledge/nodes 返回 Spring Page<T>。
   *  之前误当数组直接 .slice() 会 undefined.slice is not a function。 */
  getNodes: (params?: { subjectId?: number; topicId?: number; keyword?: string; page?: number; size?: number }) =>
    api.get<unknown, ApiResponse<PageResponse<KnowledgeNode>>>("/knowledge/nodes", { params }),
  getNode: (id: number) =>
    api.get<unknown, ApiResponse<KnowledgeNode>>(`/knowledge/nodes/${id}`),
  createNode: (data: { title: string; content: string; difficulty?: number; topicId: number; metadata?: Record<string, unknown> }) =>
    api.post<unknown, ApiResponse<KnowledgeNode>>("/knowledge/nodes", data),
  createEdge: (data: { sourceId: number; targetId: number; relationType: string; weight?: number; description?: string }) =>
    api.post<unknown, ApiResponse<KnowledgeEdge>>("/knowledge/edges", data),
  // 注意：后端 /knowledge/edges 需要 nodeId 必填，返回该节点关联的边。
  // 学科级图谱（节点 + 边）请用 getGraphData(subjectId)。
  getEdgesByNode: (nodeId: number) =>
    api.get<unknown, ApiResponse<KnowledgeEdge[]>>("/knowledge/edges", { params: { nodeId } }),
  getGraphData: (params: { subjectId: number; topicId?: number }) =>
    api.get<unknown, ApiResponse<GraphData>>(
      `/knowledge/graph/${params.subjectId}`,
      params.topicId ? { params: { topicId: params.topicId } } : undefined,
    ),
};

// ─── Study ───────────────────────────────────────────────────────────────────
export const studyApi = {
  getProgress: () =>
    api.get<unknown, ApiResponse<StudyProgress[]>>("/study/progress"),
  getNodeProgress: (nodeId: number) =>
    api.get<unknown, ApiResponse<StudyProgress>>(`/study/progress/${nodeId}`),
  touchProgress: (nodeId: number) =>
    api.post<unknown, ApiResponse<StudyProgress>>("/study/progress/touch", null, {
      params: { nodeId },
    }),
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
  aiPlan: (body: { subjectId?: number; weeks: number; goal: string }) =>
    api.post<
      unknown,
      ApiResponse<{ plan?: unknown[]; summary?: string; error?: string; planId?: number }>
    >(
      "/study/ai-plan",
      body,
      { timeout: 120000 } // LLM 周计划生成可能 20-60s
    ),
  // —— v2: AI 周计划入库 ——
  listPlans: () =>
    api.get<unknown, ApiResponse<StudyPlanRecord[]>>("/study/ai-plans"),
  getPlan: (planId: number) =>
    api.get<unknown, ApiResponse<StudyPlanRecord>>(`/study/ai-plans/${planId}`),
  deletePlan: (planId: number) =>
    api.delete<unknown, ApiResponse<void>>(`/study/ai-plans/${planId}`),
};

// ─── Curated Study Paths (V13) ─────────────────────────────────────────────
export const studyPathsApi = {
  list: (subjectId?: number) =>
    api.get<unknown, ApiResponse<CuratedStudyPath[]>>("/study-paths", {
      params: subjectId ? { subjectId } : undefined,
    }),
  get: (id: number) =>
    api.get<unknown, ApiResponse<CuratedStudyPath>>(`/study-paths/${id}`),
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
  generateForNode: (
    nodeId: number,
    opts?: { count?: number; type?: "CHOICE" | "TRUE_FALSE" | "FILL_BLANK"; difficulty?: string }
  ) =>
    api.post<
      unknown,
      ApiResponse<{ generated?: number; questionType?: string; nodeId?: number; error?: string }>
    >(
      `/quiz/nodes/${nodeId}/generate-questions`,
      null,
      {
        params: {
          count: opts?.count ?? 5,
          type: opts?.type ?? "CHOICE",
          ...(opts?.difficulty ? { difficulty: opts.difficulty } : {}),
        },
        timeout: 120000, // LLM 批量生题可能 30-90s
      }
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
  create: (data: { nodeId?: number; content: string; title: string }) =>
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
  weeklyReport: () =>
    api.get<unknown, ApiResponse<WeeklyReport>>("/stats/weekly-report"),
  weakness: () =>
    api.get<unknown, ApiResponse<{ topWrongNodes: Array<{ nodeId: number; wrongCount: number; nodeTitle?: string; topicName?: string }>; lowMasteryNodes: Array<{ nodeId: number; masteryLevel: number; nodeTitle?: string }> }>>(
      "/stats/weakness"
    ),
  /** V14 — 4 学科雷达 + Top10 弱主题，用于 dashboard 弱点画像卡。 */
  getWeaknessRadar: () =>
    api.get<unknown, ApiResponse<WeaknessRadarResponse>>("/stats/weakness-radar"),
};

// ─── 错题闭环 (V14) ─────────────────────────────────────────────────────────
// 与 quizApi.getWrongAnswers 并存：旧 /quiz/wrong-answers 返回平铺列表（quiz 主页
// 用来显示错题计数）；新 /wrong-answers/* 返回按 node 聚合的 group 结构，
// 支持相似题与"已掌握"闭环（错题本页用）。
export const wrongAnswersApi = {
  /** 按 node 聚合的错题本 */
  list: () =>
    api.get<unknown, ApiResponse<WrongAnswerGroup[]>>("/wrong-answers"),
  /** 相似题（同 node → topic → subject → AI 兜底）。LLM 兜底可能 5-30s。 */
  similar: (wrongAnswerId: number, limit: number = 5) =>
    api.get<unknown, ApiResponse<SimilarQuestionsResponse>>(
      `/wrong-answers/${wrongAnswerId}/similar`,
      { params: { limit }, timeout: 60000 }
    ),
  /** 标记某条错题已掌握（幂等）。后端会从复习队列移除。 */
  resolve: (wrongAnswerId: number) =>
    api.post<unknown, ApiResponse<WrongAnswerItem>>(
      `/wrong-answers/${wrongAnswerId}/resolve`
    ),
  /** 触发未归类错题的 AI 病因归类(每次最多 3 条)。返回本次实际归类条数。
   *  AI 调用 5-15s,timeout 给宽点;失败时该批保留 null 等下次重试。 */
  classifyPending: () =>
    api.post<unknown, ApiResponse<{ classified: number }>>(
      "/wrong-answers/classify-pending",
      undefined,
      { timeout: 60000 }
    ),
};

export default api;
