// ─── API Response ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  nickname?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  username: string;
  email: string;
  nickname: string;
  avatar?: string;
  role: string;
  createdAt: string;
}

// ─── Subject ─────────────────────────────────────────────────────────────────
export interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  icon?: string;
  color: string;
  topicCount: number;
  nodeCount: number;
  progress?: number;
}

// ─── Topic ───────────────────────────────────────────────────────────────────
export interface Topic {
  id: number;
  subjectId: number;
  name: string;
  description: string;
  orderIndex: number;
  nodeCount: number;
  progress?: number;
}

// ─── Knowledge ───────────────────────────────────────────────────────────────
export interface KnowledgeNode {
  id: number;
  subjectId: number;
  topicId: number;
  title: string;
  content: string;
  summary: string;
  difficulty: number;
  importance: number;
  type: "concept" | "theorem" | "formula" | "method" | "example";
  tags: string[];
  metadata?: Record<string, unknown>;
  mastery?: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
}

export interface KnowledgeEdge {
  id: number;
  sourceId: number;
  targetId: number;
  relationship: "prerequisite" | "related" | "includes" | "extends";
  weight: number;
  label?: string;
}

export interface GraphData {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

// ─── Material ────────────────────────────────────────────────────────────────
export interface Material {
  id: number;
  subjectId: number;
  title: string;
  type: "pdf" | "video" | "audio" | "document" | "image";
  url: string;
  size: number;
  description?: string;
  tags: string[];
  createdAt: string;
}

// ─── Study ───────────────────────────────────────────────────────────────────
export interface StudyProgress {
  nodeId: number;
  mastery: number;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt: string;
  nextReviewAt: string;
  easeFactor: number;
  interval: number;
}

export interface StudyFeedback {
  nodeId: number;
  quality: number; // 0-5 SM-2 rating
  timeSpent: number;
}

export interface StudySession {
  id: number;
  userId: number;
  subjectId?: number;
  mode: string;
  startedAt: string;
  endedAt?: string;
  nodesStudied: number;
  duration: number;
}

// ─── Quiz ────────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  id: number;
  nodeId: number;
  type: "single_choice" | "multiple_choice" | "true_false" | "fill_blank" | "short_answer";
  question: string;
  options?: string[];
  difficulty: number;
  explanation?: string;
}

export interface QuizSubmission {
  questions: { questionId: number; answer: string | string[] }[];
  timeSpent: number;
}

export interface WrongAnswer {
  id: number;
  questionId: number;
  question: QuizQuestion;
  userAnswer: string;
  correctAnswer: string;
  createdAt: string;
  reviewed: boolean;
}

// ─── Note ────────────────────────────────────────────────────────────────────
export interface Note {
  id: number;
  nodeId: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Stats ───────────────────────────────────────────────────────────────────
export interface StatsOverview {
  totalNodes: number;
  masteredNodes: number;
  studiedToday: number;
  reviewedToday: number;
  studyTimeToday: number;
  streak: number;
  weeklyStudyTime: number[];
  subjectProgress: { subjectId: number; name: string; progress: number; color: string }[];
}

// ─── Graph View ──────────────────────────────────────────────────────────────
export interface GraphFilter {
  subjectId?: number;
  topicId?: number;
  difficulty?: number;
  type?: string;
}
