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

export type QuestionStatus =
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "deprecated";

export type LessonStatus =
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "archived";

export type Subject = "english" | "math";

export interface Course {
  id: string;
  code: string;
  subject: Subject;
  grade: number;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  code: string;
  week: number;
  orderIndex: number;
  title: string;
  description?: string | null;
  lessonType?: string | null;
  status: LessonStatus;
  isPremium: boolean;
  prerequisites: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  lessonId: string;
  code: string;
  type: string;
  skill?: string | null;
  difficulty: number;
  text?: string | null;
  options?: unknown;
  correctAnswer?: unknown;
  imagePath?: string | null;
  audioPath?: string | null;
  status: QuestionStatus;
  authorId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorPayload {
  statusCode: number;
  message: string | string[];
  error?: string;
}
