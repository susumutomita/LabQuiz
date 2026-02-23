// google.script.run type declaration
declare const google: {
  script: {
    run: GoogleScriptRun;
  };
};

interface GoogleScriptRun {
  withSuccessHandler(fn: (data: string) => void): GoogleScriptRun;
  withFailureHandler(fn: (error: Error) => void): GoogleScriptRun;
  apiCall(action: string, params: string): void;
}

function callGas<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((response: string) => {
        const parsed = JSON.parse(response);
        if (parsed.success) {
          resolve(parsed.data as T);
        } else {
          reject(new Error(parsed.error || 'エラーが発生しました'));
        }
      })
      .withFailureHandler((error: Error) => {
        reject(error);
      })
      .apiCall(action, JSON.stringify(params));
  });
}

// Auth
export const getCurrentUser = () =>
  callGas<User>('getCurrentUser');

// Categories
export const getCategories = () =>
  callGas<Category[]>('getCategories');

// Quizzes
export const getQuizzes = (categoryId: string, count = 10) =>
  callGas<{ sessionId: string; quizzes: Quiz[]; message?: string }>(
    'getQuizzes', { categoryId, count }
  );

export const answerQuiz = (quizId: string, choiceId: string, sessionId: string) =>
  callGas<{ isCorrect: boolean; correctChoiceId: string; explanation: string }>(
    'answerQuiz', { quizId, choiceId, sessionId }
  );

export const completeSession = (sessionId: string) =>
  callGas<SessionResult>('completeSession', { sessionId });

// Review
export const getPendingQuizzes = () =>
  callGas<PendingQuiz[]>('getPendingQuizzes');

export const reviewQuiz = (
  quizId: string,
  action: "approve" | "reject",
  _updatedAt: string,
) =>
  callGas<{ success: boolean }>('reviewQuiz', { quizId, action });

// Dashboard
export const getDashboardProgress = () =>
  callGas<UserProgress[]>('getDashboardProgress');

// Users
export const getUsers = () =>
  callGas<User[]>('getUsers');

export const updateUserRole = (email: string, role: string) =>
  callGas<User>('updateUserRole', { email, role });

// Types
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
