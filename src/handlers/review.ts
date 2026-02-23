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
  const user = getCurrentUser();
  requireRole(user, 'reviewer', 'admin');

  const rowIndex = findRowIndex('quizzes', 'id', params.quizId);
  if (rowIndex === -1) throw new Error('Quiz not found');

  const newStatus = params.action === 'approve' ? 'approved' : 'rejected';
  updateCell('quizzes', rowIndex, 'status', newStatus);

  return { success: true };
}
