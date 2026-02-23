import { getSheetData } from '../sheets';
import { getCurrentUser, requireRole } from '../auth';

export function handleGetDashboardProgress(): UserProgress[] {
  const user = getCurrentUser();
  requireRole(user, 'admin');

  const users = getSheetData('users');
  const answers = getSheetData('quiz_answers');
  const quizzes = getSheetData('quizzes');
  const categories = getSheetData('categories');
  const badges = getSheetData('badges');

  // Build quiz-to-category map
  const quizCategoryMap: Record<string, string> = {};
  quizzes.forEach(q => { quizCategoryMap[q.id] = q.category_id; });

  return users.map(u => {
    const userAnswers = answers.filter(a => a.user_email === u.email);

    const categoryProgress: CategoryProgress[] = categories.map(cat => {
      const catAnswers = userAnswers.filter(a => quizCategoryMap[a.quiz_id] === cat.id);
      const totalAnswers = catAnswers.length;
      const correctAnswers = catAnswers.filter(a => a.is_correct === 'TRUE').length;
      const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

      // Count unique sessions
      const sessions = new Set(catAnswers.map(a => a.session_id));

      // Last answered
      const sorted = catAnswers.sort((a, b) => b.answered_at.localeCompare(a.answered_at));
      const lastAnsweredAt = sorted.length > 0 ? sorted[0].answered_at : null;

      // Badge check
      const hasBadge = badges.some(
        b => b.user_email === u.email && b.category_id === cat.id
      );

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        totalAnswers,
        correctAnswers,
        accuracy,
        sessionCount: sessions.size,
        lastAnsweredAt,
        hasBadge,
        isWarning: totalAnswers > 0 && accuracy < 70,
      };
    });

    return {
      userId: u.email,
      name: u.name,
      email: u.email,
      categories: categoryProgress,
    };
  });
}
