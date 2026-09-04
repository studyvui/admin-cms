export type UserRole =
  | "student"
  | "parent"
  | "teacher"
  | "editor"
  | "admin"
  | "qa"
  | "support";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

// Cấu hình hệ thống (GĐ1 Settings) — admin xem/sửa qua GET/PATCH /admin/settings.
export type SettingType = "boolean" | "number" | "string" | "json";
export type SettingValue = boolean | number | string | Record<string, unknown>;

export interface AppSetting {
  id: string;
  key: string;
  value: SettingValue;
  valueType: SettingType;
  category: string;
  label: string;
  description?: string | null;
  isPublic: boolean;
  updatedBy?: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

// Tài khoản cá nhân (GĐ1 Settings) — GET /users/me/profile. KHÔNG mở rộng User (chưa có căn cứ
// backend trả thêm field nào khác trong GĐ1) — chỉ các field đã xác nhận trong brief.
export interface MyProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface UpdateMeInput {
  name?: string;
  avatarUrl?: string;
}

// Quản lý người dùng (GĐ2) — admin xem/sửa user khác qua /admin/users/*. Khác MyProfile (GĐ1,
// chỉ "tôi"): đây là hồ sơ ĐẦY ĐỦ 1 user bất kỳ, admin xem được.
export type UserStatus = "active" | "inactive" | "deleted" | "all";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface AdminUserDetail extends AdminUser {
  studentProfile?: { grade: number } | null;
  stats: { answers: number; lessonsCompleted: number; lastAnswerAt: string | null };
}

export interface UserStats {
  total: number;
  byRole: Record<UserRole, number>;
  active: number;
  inactive: number;
  deleted: number;
  newLast30Days: number;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  grade?: number;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export type Subject = "english" | "math";

export type LessonStatus =
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "archived";

export type QuestionStatus =
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "deprecated";

export interface Course {
  id: string;
  code: string;
  subject: Subject;
  grade: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  code: string;
  subject: Subject;
  grade: number;
  name: string;
  description?: string;
}

export interface UpdateCourseInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface VocabItem {
  word: string;
  meaning?: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  code: string;
  week: number;
  orderIndex: number;
  name: string;
  lessonType: string;
  skills: string[];
  status: LessonStatus;
  isPremium: boolean;
  vocabulary?: VocabItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonInput {
  courseId: string;
  code: string;
  week: number;
  orderIndex: number;
  name: string;
  lessonType: string;
  skills: string[];
  vocabulary?: VocabItem[];
}

export interface UpdateLessonInput {
  name?: string;
  lessonType?: string;
  skills?: string[];
  week?: number;
  orderIndex?: number;
  vocabulary?: VocabItem[];
}

export interface Question {
  id: string;
  lessonId: string;
  code: string;
  type: string;
  skill: string;
  difficulty: number;
  content: Record<string, unknown>;
  correctAnswer: string;
  assetRefs: string[];
  status: QuestionStatus;
  authorId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionInput {
  lessonId: string;
  code: string;
  type: string;
  skill: string;
  difficulty: number;
  content: Record<string, unknown>;
  correctAnswer: string;
  assetRefs?: string[];
}

export interface UpdateQuestionInput {
  type?: string;
  skill?: string;
  difficulty?: number;
  content?: Record<string, unknown>;
  correctAnswer?: string;
  assetRefs?: string[];
}

export type AssetType = "image" | "audio";

export interface AssetItem {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  type: AssetType;
}

export interface ApiErrorPayload {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "archive"
  | "bulk_import"
  | "status_change"
  | "rollback";

export interface AuditUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: AuditUser | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityCode?: string | null;
  changes: Record<string, unknown>;
  metadata: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface ReviewLessonItem extends Lesson {
  course?: { code: string; name: string };
}

export interface ReviewQuestionItem extends Question {
  lesson?: { code: string; name: string };
}

export interface ReviewQueue {
  lessonsForReview: ReviewLessonItem[];
  questionsForReview: ReviewQuestionItem[];
}

export interface DailyQuestionStat {
  day: string;
  created: number;
  approved: number;
  published: number;
  review: number;
  rejected: number;
  draftNew: number;
}

export interface DashboardOverview {
  users: { total: number; activeLast7Days: number };
  content: {
    courses: number;
    lessons: { total: number; byStatus: Record<string, number> };
    questions: { total: number; byStatus: Record<string, number> };
  };
  activity: { answersToday: number };
  business: { activeSubscriptions: number };
}
