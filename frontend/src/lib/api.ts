import {
  mockGetCategories,
  mockGetQuizzes,
  mockAnswerQuiz,
  mockCompleteSession,
  mockGetScenarios,
  mockJudgeScenario,
  mockCompleteScenarioSession,
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

// Scenarios (Lab Checkpoint)
export const getScenarios = (categoryId?: string, count = 10) =>
  isGas
    ? callGas<{ sessionId: string; scenarios: Scenario[]; message?: string }>("getScenarios", { ...(categoryId ? { categoryId } : {}), count })
    : mockGetScenarios(categoryId, count);

export const judgeScenario = (scenarioId: string, judgment: "pass" | "violate", sessionId: string) =>
  isGas
    ? callGas<JudgmentResult>("judgeScenario", { scenarioId, judgment, sessionId })
    : mockJudgeScenario(scenarioId, judgment, sessionId);

export const completeScenarioSession = (sessionId: string) =>
  isGas
    ? callGas<SessionResult>("completeScenarioSession", { sessionId })
    : mockCompleteScenarioSession(sessionId);

// ===== Types =====

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

export interface SessionResult {
  sessionId: string;
  total: number;
  correct: number;
  score: number;
  isPerfect: boolean;
  badgeEarned: boolean;
}

export interface Scenario {
  id: string;
  categoryId: string;
  charName: string;
  charRole: string;
  charAvatar: string;
  situation: string;
  dialogue: string;
  reference: string;
  isViolation: boolean;
}

export interface JudgmentResult {
  isCorrect: boolean;
  wasViolation: boolean;
  explanation: string;
}
