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

  // backend DTO compatibility
  topicName?: string;
  subjectName?: string;
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
  title: string;
  type: string;
  fileUrl: string;
  originalName?: string;
  fileSize?: number;
  nodeId?: number;
  uploaderId?: number;
  description?: string;
  tags: string[];
  createdAt: string;
}

// ─── Study ───────────────────────────────────────────────────────────────────
export interface StudyProgress {
  id: number;
  userId: number;
  nodeId: number;
  masteryLevel: number;
  lastReview?: string;
  nextReview?: string;
  repetitionCount: number;
  easeFactor: number;
}

export interface StudyFeedback {
  nodeId: number;
  rating: number; // 0-5 SM-2 rating
}

export interface StudySession {
  id: number;
  userId: number;
  subjectId?: number;
  mode: string;
  startTime: string;
  endTime?: string;
  studiedNodes: number;
  reviewedNodes: number;
}

// ─── Quiz ────────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  id: number;
  nodeId: number;
  questionType: string;
  content: string;
  options?: string; // json string
  explanation?: string;
  answer?: string;
}

export interface QuizSubmission {
  questions: { questionId: number; answer: string | string[] }[];
  timeSpent: number;
}

export interface WrongAnswer {
  id: number;
  questionId: number;
  nodeId?: number;
  questionText?: string;
  userAnswer: string;
  correctAnswer?: string;
  explanation?: string;
  answeredAt: string;
  resolved: boolean;
}

// ─── Note ────────────────────────────────────────────────────────────────────
export interface Note {
  id: number;
  nodeId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;

  nodeTitle?: string;
  subjectName?: string;
  topicName?: string;
}

// ─── Stats ───────────────────────────────────────────────────────────────────
export interface Badge {
  code: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  current: number;
  target: number;
}

export interface DailyTask {
  code: string;
  name: string;
  current: number;
  target: number;
  completed: boolean;
}

export interface WeekPlan {
  week: number;
  title: string;
  goals: string[];
  daily_tasks: string[];
  review_focus?: string[];
}

export interface WeeklyReport {
  weekStart: string; // ISO yyyy-MM-dd
  weekEnd: string;
  totalMinutes: number;
  daysActive: number;
  studiedNodesThisWeek: number;
  reviewedNodesThisWeek: number;
  dailyMinutes: number[]; // length 7, 0=earliest, 6=today
  streakDays: number;
  topWeakTopics: string[];
  earnedBadges: number;
}

export interface StudyPlanResponse {
  plan: WeekPlan[];
  summary?: string;
  error?: string;
}

export interface StatsOverview {
  totalNodes: number;
  studiedNodes: number;
  masteredNodes: number;
  averageMastery: number;
  totalStudyMinutes: number;
  studiedToday: number;
  reviewedToday: number;
  studyTimeTodayMinutes: number;
  streakDays: number;
  weeklyStudyTimeMinutes: number[];
  subjectProgress: {
    subjectId: number;
    name: string;
    code: string;
    color: string;
    progress: number;
    totalNodes: number;
    studiedNodes: number;
    masteredNodes: number;
  }[];
  badges?: Badge[];
  dailyTasks?: DailyTask[];
}

// ─── Graph View ──────────────────────────────────────────────────────────────
export interface GraphFilter {
  subjectId?: number;
  topicId?: number;
  difficulty?: number;
  type?: string;
}
