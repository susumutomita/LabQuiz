import { handleGetCategories } from './handlers/categories';
import { handleGetScenarios, handleJudgeScenario, handleCompleteScenarioSession } from './handlers/scenarios';

export function apiCall(action: string, params: string): string {
  try {
    const p = params ? JSON.parse(params) : {};
    let result: unknown;

    switch (action) {
      case 'getCategories':
        result = handleGetCategories();
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
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return JSON.stringify({ success: true, data: result });
  } catch (e) {
    return JSON.stringify({ success: false, error: (e as Error).message });
  }
}
