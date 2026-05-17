// ─── API Response ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Spring Page<T> 序列化形态。任何后端返回 Page 的接口都用这个类型，避免误当数组 .slice()。 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
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

  // ─── link-based 题目字段 (V11) ─────────────────────────────────────────────
  // externalUrl 非空时，practice 页切换为"外链 + 自评"渲染
  externalUrl?: string;
  externalSource?: string;
  year?: number;
  questionNumber?: number;
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
  topicName?: string;
  nodeTitle?: string;
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
  /** 后端入库成功时返回的 plan id，失败/未入库时缺省 */
  planId?: number;
}

/**
 * 后端 study_plans 表的 DTO 形态（GET /study/ai-plans 返回）。
 * planJson 是 ObjectMapper.writeValueAsString(WeekPlan[]) 的结果，
 * 前端展示时 JSON.parse 还原为 WeekPlan[]。
 */
export interface StudyPlanRecord {
  id: number;
  subjectId?: number;
  weeks: number;
  goal: string;
  summary?: string;
  planJson: string;
  createdAt: string;
  updatedAt: string;
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

// ─── Curated Study Paths (V13) ─────────────────────────────────────────────
export interface StudyPathWeekItem {
  id: number;
  weekNo: number;
  title: string;
  goal?: string;
  dailyTasks: string[];
  focusTopics: string[];
  resourceHints: string[];
}

export interface CuratedStudyPath {
  id: number;
  code: string;
  subjectId?: number;
  title: string;
  description?: string;
  durationWeeks: number;
  difficulty?: string;
  targetAudience?: string;
  totalHours?: number;
  weeks?: StudyPathWeekItem[];  // 详情时填充
}
