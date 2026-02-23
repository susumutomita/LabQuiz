// ===== Spreadsheet Row Types =====

interface CategoryRow {
  id: string;
  name: string;
  description: string;
}

interface QuizRow {
  id: string;
  category_id: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct: string; // 'a' | 'b' | 'c' | 'd'
  explanation: string;
  status: string; // 'pending' | 'approved' | 'rejected'
}

interface UserRow {
  email: string;
  name: string;
  role: string; // 'learner' | 'creator' | 'reviewer' | 'admin'
  created_at: string;
}

interface QuizAnswerRow {
  user_email: string;
  quiz_id: string;
  session_id: string;
  choice: string;
  is_correct: string; // 'TRUE' | 'FALSE'
  answered_at: string;
}

interface BadgeRow {
  user_email: string;
  category_id: string;
  earned_at: string;
}

// ===== API Response Types =====

interface User {
  email: string;
  name: string;
  role: string;
  created_at?: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Choice {
  id: string;
  text: string;
}

interface Quiz {
  id: string;
  categoryId: string;
  question: string;
  choices: Choice[];
}

interface SessionResult {
  sessionId: string;
  total: number;
  correct: number;
  score: number;
  isPerfect: boolean;
  badgeEarned: boolean;
}

interface CategoryProgress {
  categoryId: string;
  categoryName: string;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  sessionCount: number;
  lastAnsweredAt: string | null;
  hasBadge: boolean;
  isWarning: boolean;
}

interface UserProgress {
  userId: string;
  name: string;
  email: string;
  categories: CategoryProgress[];
}

interface PendingQuiz {
  id: string;
  category_id: string;
  category_name: string;
  creator_name: string;
  question: string;
  choices: Choice[];
  correct_choice_id: string;
  explanation: string;
  status: string;
  updated_at: string;
  created_at: string;
}
