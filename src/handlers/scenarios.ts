import { getSheetData, appendRow, generateId, shuffleArray } from '../sheets';
import { getCurrentUser } from '../auth';

export function handleGetScenarios(params: { categoryId?: string; count?: number }): {
  sessionId: string;
  scenarios: Scenario[];
  message?: string;
} {
  getCurrentUser(); // ensure authenticated

  const allScenarios = getSheetData('scenarios');
  const filtered = params.categoryId
    ? allScenarios.filter(
        (s: Record<string, string>) => s.category_id === params.categoryId && s.status === 'approved'
      )
    : allScenarios.filter((s: Record<string, string>) => s.status === 'approved');

  if (filtered.length === 0) {
    return { sessionId: '', scenarios: [], message: params.categoryId ? 'このカテゴリにはまだシナリオがありません' : 'シナリオがありません' };
  }

  const count = Math.min(params.count || 10, filtered.length);
  const selected = shuffleArray(filtered).slice(0, count);
  const sessionId = generateId();

  const scenarios: Scenario[] = selected.map((s: Record<string, string>) => ({
    id: s.id,
    categoryId: s.category_id,
    charName: s.char_name,
    charRole: s.char_role,
    charAvatar: s.char_avatar || '🧑‍🔬',
    situation: s.situation,
    dialogue: s.dialogue,
    reference: s.reference,
    isViolation: s.is_violation === 'TRUE',
  }));

  return { sessionId, scenarios };
}

export function handleJudgeScenario(params: {
  scenarioId: string;
  judgment: 'pass' | 'violate';
  sessionId: string;
}): JudgmentResult {
  if (!params.scenarioId || !params.judgment || !params.sessionId) {
    throw new Error('scenarioId, judgment, and sessionId are required');
  }

  if (params.judgment !== 'pass' && params.judgment !== 'violate') {
    throw new Error('judgment must be "pass" or "violate"');
  }

  const user = getCurrentUser();

  const scenario = getSheetData('scenarios').find(
    (s: Record<string, string>) => s.id === params.scenarioId
  );
  if (!scenario) throw new Error('Scenario not found');

  const wasViolation = scenario.is_violation === 'TRUE';
  const playerChoseViolate = params.judgment === 'violate';
  const isCorrect = playerChoseViolate === wasViolation;

  appendRow('quiz_answers', {
    user_email: user.email,
    quiz_id: params.scenarioId,
    session_id: params.sessionId,
    choice: params.judgment,
    is_correct: isCorrect ? 'TRUE' : 'FALSE',
    answered_at: new Date().toISOString(),
  });

  return {
    isCorrect,
    wasViolation,
    explanation: scenario.explanation,
  };
}

export function handleCompleteScenarioSession(params: { sessionId: string }): SessionResult {
  if (!params.sessionId) {
    throw new Error('sessionId is required');
  }

  const user = getCurrentUser();

  const answers = getSheetData('quiz_answers').filter(
    (a: Record<string, string>) => a.session_id === params.sessionId && a.user_email === user.email
  );

  if (answers.length === 0) {
    throw new Error('No answers found for this session');
  }

  const total = answers.length;
  const correct = answers.filter((a: Record<string, string>) => a.is_correct === 'TRUE').length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPerfect = total > 0 && correct === total;

  let badgeEarned = false;
  if (isPerfect) {
    const firstScenarioId = answers[0].quiz_id;
    const scenario = getSheetData('scenarios').find(
      (s: Record<string, string>) => s.id === firstScenarioId
    );
    if (scenario) {
      const categoryId = scenario.category_id;
      const badges = getSheetData('badges');
      const hasBadge = badges.some(
        (b: Record<string, string>) => b.user_email === user.email && b.category_id === categoryId
      );

      if (!hasBadge) {
        appendRow('badges', {
          user_email: user.email,
          category_id: categoryId,
          earned_at: new Date().toISOString(),
        });
        badgeEarned = true;
      }
    }
  }

  return {
    sessionId: params.sessionId,
    total,
    correct,
    score,
    isPerfect,
    badgeEarned,
  };
}
