import { getSheetData, findRowIndex, updateCell } from '../sheets';
import { getCurrentUser, requireRole } from '../auth';

export function handleGetPendingQuizzes(): PendingQuiz[] {
  const user = getCurrentUser();
  requireRole(user, 'reviewer', 'admin');

  const quizzes = getSheetData('quizzes').filter(q => q.status === 'pending');
  const categories = getSheetData('categories');
  const catMap: Record<string, string> = {};
  categories.forEach(c => { catMap[c.id] = c.name; });

  return quizzes.map(q => ({
    id: q.id,
    category_id: q.category_id,
    category_name: catMap[q.category_id] || '',
    creator_name: 'Spreadsheet',
    question: q.question,
    choices: [
      { id: 'a', text: q.choice_a },
      { id: 'b', text: q.choice_b },
      { id: 'c', text: q.choice_c },
      { id: 'd', text: q.choice_d },
    ].filter(c => c.text),
    correct_choice_id: q.correct,
    explanation: q.explanation,
    status: q.status,
    updated_at: '',
    created_at: '',
  }));
}

export function handleReviewQuiz(params: { quizId: string; action: 'approve' | 'reject' }): { success: boolean } {
  if (!params.quizId) {
    throw new Error('quizId is required');
  }

  const validActions = ['approve', 'reject'];
  if (!validActions.includes(params.action)) {
    throw new Error('action must be "approve" or "reject"');
  }

  const user = getCurrentUser();
  requireRole(user, 'reviewer', 'admin');

  const rowIndex = findRowIndex('quizzes', 'id', params.quizId);
  if (rowIndex === -1) throw new Error('Quiz not found');

  const newStatus = params.action === 'approve' ? 'approved' : 'rejected';
  updateCell('quizzes', rowIndex, 'status', newStatus);

  return { success: true };
}

export function handleGetPendingScenarios(): PendingScenario[] {
  const user = getCurrentUser();
  requireRole(user, 'reviewer', 'admin');

  const scenarios = getSheetData('scenarios').filter(s => s.status === 'pending');
  const categories = getSheetData('categories');
  const catMap: Record<string, string> = {};
  categories.forEach(c => { catMap[c.id] = c.name; });

  return scenarios.map(s => ({
    id: s.id,
    category_id: s.category_id,
    category_name: catMap[s.category_id] || '',
    char_name: s.char_name,
    char_role: s.char_role,
    char_avatar: s.char_avatar || '🧑‍🔬',
    situation: s.situation,
    dialogue: s.dialogue,
    reference: s.reference,
    is_violation: s.is_violation === 'TRUE',
    explanation: s.explanation,
    status: s.status,
  }));
}

export function handleReviewScenario(params: { scenarioId: string; action: 'approve' | 'reject' }): { success: boolean } {
  if (!params.scenarioId) {
    throw new Error('scenarioId is required');
  }

  const validActions = ['approve', 'reject'];
  if (!validActions.includes(params.action)) {
    throw new Error('action must be "approve" or "reject"');
  }

  const user = getCurrentUser();
  requireRole(user, 'reviewer', 'admin');

  const rowIndex = findRowIndex('scenarios', 'id', params.scenarioId);
  if (rowIndex === -1) throw new Error('Scenario not found');

  const newStatus = params.action === 'approve' ? 'approved' : 'rejected';
  updateCell('scenarios', rowIndex, 'status', newStatus);

  return { success: true };
}
