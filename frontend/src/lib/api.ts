import {
  mockGetCurrentUser,
  mockGetCategories,
  mockGetQuizzes,
  mockAnswerQuiz,
  mockCompleteSession,
  mockGetPendingQuizzes,
  mockReviewQuiz,
  mockGetDashboardProgress,
  mockGetUsers,
  mockUpdateUserRole,
} from "./mock";

// ===== Environment detection =====

declare const google: {
  script: {
    run: {
      withSuccessHandler(fn: (data: string) => void): typeof google.script.run;
      withFailureHandler(fn: (error: Error) => void): typeof google.script.run;
      apiCall(action: string, params: string): void;
    };
  };
};

const isGas = typeof google !== "undefined" && !!google?.script?.run;

// ===== GAS API call =====

function callGas<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((response: string) => {
        const parsed = JSON.parse(response);
        if (parsed.success) {
          resolve(parsed.data as T);
        } else {
          reject(new Error(parsed.error || "エラーが発生しました"));
        }
      })
      .withFailureHandler((error: Error) => {
        reject(error);
      })
      .apiCall(action, JSON.stringify(params));
  });
}

// ===== Public API (auto-switches between GAS and mock) =====

// Auth
export const getCurrentUser = (): Promise<User> =>
  isGas ? callGas("getCurrentUser") : mockGetCurrentUser();

// Categories
export const getCategories = (): Promise<Category[]> =>
  isGas ? callGas("getCategories") : mockGetCategories();

// Quizzes
export const getQuizzes = (categoryId: string, count = 10) =>
  isGas
    ? callGas<{ sessionId: string; quizzes: Quiz[]; message?: string }>("getQuizzes", { categoryId, count })
    : mockGetQuizzes(categoryId, count);

export const answerQuiz = (quizId: string, choiceId: string, sessionId: string) =>
  isGas
    ? callGas<{ isCorrect: boolean; correctChoiceId: string; explanation: string }>("answerQuiz", { quizId, choiceId, sessionId })
    : mockAnswerQuiz(quizId, choiceId, sessionId);

export const completeSession = (sessionId: string) =>
  isGas
    ? callGas<SessionResult>("completeSession", { sessionId })
    : mockCompleteSession(sessionId);

// Review
export const getPendingQuizzes = (): Promise<PendingQuiz[]> =>
  isGas ? callGas("getPendingQuizzes") : mockGetPendingQuizzes();

export const reviewQuiz = (quizId: string, action: "approve" | "reject", _updatedAt: string) =>
  isGas
    ? callGas<{ success: boolean }>("reviewQuiz", { quizId, action })
    : mockReviewQuiz(quizId, action);

// Dashboard
export const getDashboardProgress = (): Promise<UserProgress[]> =>
  isGas ? callGas("getDashboardProgress") : mockGetDashboardProgress();

// Users
export const getUsers = (): Promise<User[]> =>
  isGas ? callGas("getUsers") : mockGetUsers();

export const updateUserRole = (email: string, role: string) =>
  isGas
    ? callGas<User>("updateUserRole", { email, role })
    : mockUpdateUserRole(email, role);

// ===== Types =====

export interface User {
  email: string;
  name: string;
  role: "learner" | "creator" | "reviewer" | "admin";
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface Choice {
  id: string;
  text: string;
}

export interface Quiz {
  id: string;
  categoryId: string;
  question: string;
  choices: Choice[];
}

export interface PendingQuiz {
  id: string;
  category_id: string;
  category_name: string;
  creator_name: string;
  question: string;
  choices: Choice[];
  correct_choice_id: string;
  explanation: string;
  status: string;
  updated_at: string;
  created_at: string;
}

export interface SessionResult {
  sessionId: string;
  total: number;
  correct: number;
  score: number;
  isPerfect: boolean;
  badgeEarned: boolean;
}

export interface CategoryProgress {
  categoryId: string;
  categoryName: string;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  sessionCount: number;
  lastAnsweredAt: string | null;
  hasBadge: boolean;
  isWarning: boolean;
}

export interface UserProgress {
  userId: string;
  name: string;
  email: string;
  categories: CategoryProgress[];
}
