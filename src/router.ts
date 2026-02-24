import { handleGetCategories } from './handlers/categories';
import { handleGetQuizzes, handleAnswerQuiz, handleCompleteSession } from './handlers/quizzes';
import { handleGetScenarios, handleJudgeScenario, handleCompleteScenarioSession } from './handlers/scenarios';
import { handleSeedSpreadsheet } from './handlers/seed';

export function apiCall(action: string, params: string): string {
  try {
    const p = params ? JSON.parse(params) : {};
    let result: unknown;

    switch (action) {
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
      case 'getScenarios':
        result = handleGetScenarios(p);
        break;
      case 'judgeScenario':
        result = handleJudgeScenario(p);
        break;
      case 'completeScenarioSession':
        result = handleCompleteScenarioSession(p);
        break;
      case 'seedSpreadsheet':
        result = handleSeedSpreadsheet();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return JSON.stringify({ success: true, data: result });
  } catch (e) {
    return JSON.stringify({ success: false, error: (e as Error).message });
  }
}
