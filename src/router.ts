import { getCurrentUser } from './auth';
import { handleGetCategories } from './handlers/categories';
import { handleGetQuizzes, handleAnswerQuiz, handleCompleteSession } from './handlers/quizzes';
import { handleGetDashboardProgress } from './handlers/dashboard';
import { handleGetPendingQuizzes, handleReviewQuiz } from './handlers/review';
import { handleGetUsers, handleUpdateUserRole } from './handlers/users';

export function apiCall(action: string, params: string): string {
  try {
    const p = params ? JSON.parse(params) : {};
    let result: unknown;

    switch (action) {
      case 'getCurrentUser':
        result = getCurrentUser();
        break;
      case 'getCategories':
        result = handleGetCategories();
        break;
      case 'getQuizzes':
        result = handleGetQuizzes(p);
        break;
      case 'answerQuiz':
        result = handleAnswerQuiz(p);
        break;
      case 'completeSession':
        result = handleCompleteSession(p);
        break;
      case 'getDashboardProgress':
        result = handleGetDashboardProgress();
        break;
      case 'getPendingQuizzes':
        result = handleGetPendingQuizzes();
        break;
      case 'reviewQuiz':
        result = handleReviewQuiz(p);
        break;
      case 'getUsers':
        result = handleGetUsers();
        break;
      case 'updateUserRole':
        result = handleUpdateUserRole(p);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return JSON.stringify({ success: true, data: result });
  } catch (e) {
    return JSON.stringify({ success: false, error: (e as Error).message });
  }
}
