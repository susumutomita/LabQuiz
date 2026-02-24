import scenariosData from '../../content/scenarios.json';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function handleGetScenarios(params: { categoryId?: string; count?: number }): {
  sessionId: string;
  scenarios: Scenario[];
  message?: string;
} {
  const filtered = params.categoryId
    ? scenariosData.filter(s => s.category_id === params.categoryId && s.status === 'approved')
    : scenariosData.filter(s => s.status === 'approved');

  if (filtered.length === 0) {
    return { sessionId: '', scenarios: [], message: params.categoryId ? 'このカテゴリにはまだシナリオがありません' : 'シナリオがありません' };
  }

  const count = Math.min(params.count || 10, filtered.length);
  const selected = shuffleArray(filtered).slice(0, count);
  const sessionId = Utilities.getUuid();

  const scenarios: Scenario[] = selected.map(s => ({
    id: s.id,
    categoryId: s.category_id,
    charName: s.char_name,
    charRole: s.char_role,
    charAvatar: s.char_avatar || '🧑‍🔬',
    situation: s.situation,
    dialogue: s.dialogue,
    reference: s.reference,
    isViolation: s.is_violation,
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

  const scenario = scenariosData.find(s => s.id === params.scenarioId);
  if (!scenario) throw new Error('Scenario not found');

  const playerChoseViolate = params.judgment === 'violate';
  const isCorrect = playerChoseViolate === scenario.is_violation;

  return {
    isCorrect,
    wasViolation: scenario.is_violation,
    explanation: scenario.explanation,
  };
}

export function handleCompleteScenarioSession(params: {
  sessionId: string;
  total: number;
  correct: number;
}): SessionResult {
  const total = params.total || 0;
  const correct = params.correct || 0;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPerfect = total > 0 && correct === total;

  return {
    sessionId: params.sessionId,
    total,
    correct,
    score,
    isPerfect,
    badgeEarned: false,
  };
}
