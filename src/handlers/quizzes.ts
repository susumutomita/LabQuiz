import { getSheetData, appendRow, generateId, shuffleArray } from '../sheets';
import { getCurrentUser } from '../auth';

export function handleGetQuizzes(params: { categoryId: string; count?: number }): {
  sessionId: string;
  quizzes: Quiz[];
  message?: string;
} {
  getCurrentUser(); // ensure authenticated

  const allQuizzes = getSheetData('quizzes');
  const categoryQuizzes = allQuizzes.filter(
    q => q.category_id === params.categoryId && q.status === 'approved'
  );

  if (categoryQuizzes.length === 0) {
    return { sessionId: '', quizzes: [], message: 'このカテゴリにはまだ問題がありません' };
  }

  const count = Math.min(params.count || 10, categoryQuizzes.length);
  const selected = shuffleArray(categoryQuizzes).slice(0, count);
  const sessionId = generateId();

  const quizzes: Quiz[] = selected.map(q => {
    const allChoices: Choice[] = [
      { id: 'a', text: q.choice_a },
      { id: 'b', text: q.choice_b },
      { id: 'c', text: q.choice_c },
      { id: 'd', text: q.choice_d },
    ].filter(c => c.text);

    // Pick correct answer + 1 random wrong answer, then shuffle
    const correct = allChoices.find(c => c.id === q.correct)!;
    const wrong = shuffleArray(allChoices.filter(c => c.id !== q.correct));
    const twoChoices = shuffleArray([correct, wrong[0]]);

    return {
      id: q.id,
      categoryId: q.category_id,
      question: q.question,
      choices: twoChoices,
    };
  });

  return { sessionId, quizzes };
}

export function handleAnswerQuiz(params: { quizId: string; choiceId: string; sessionId: string }): {
  isCorrect: boolean;
  correctChoiceId: string;
  explanation: string;
} {
  const user = getCurrentUser();

  const quiz = getSheetData('quizzes').find(q => q.id === params.quizId);
  if (!quiz) throw new Error('Quiz not found');

  const isCorrect = quiz.correct === params.choiceId;

  appendRow('quiz_answers', {
    user_email: user.email,
    quiz_id: params.quizId,
    session_id: params.sessionId,
    choice: params.choiceId,
    is_correct: isCorrect ? 'TRUE' : 'FALSE',
    answered_at: new Date().toISOString(),
  });

  return {
    isCorrect,
    correctChoiceId: quiz.correct,
    explanation: quiz.explanation,
  };
}

export function handleCompleteSession(params: { sessionId: string }): SessionResult {
  const user = getCurrentUser();

  const answers = getSheetData('quiz_answers').filter(
    a => a.session_id === params.sessionId && a.user_email === user.email
  );

  const total = answers.length;
  const correct = answers.filter(a => a.is_correct === 'TRUE').length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPerfect = total > 0 && correct === total;

  let badgeEarned = false;
  if (isPerfect && answers.length > 0) {
    const firstQuizId = answers[0].quiz_id;
    const quiz = getSheetData('quizzes').find(q => q.id === firstQuizId);
    if (quiz) {
      const categoryId = quiz.category_id;
      const badges = getSheetData('badges');
      const hasBadge = badges.some(
        b => b.user_email === user.email && b.category_id === categoryId
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
