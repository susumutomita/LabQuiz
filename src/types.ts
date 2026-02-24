// ===== API Response Types =====

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Scenario {
  id: string;
  categoryId: string;
  charName: string;
  charRole: string;
  charAvatar: string;
  situation: string;
  dialogue: string;
  reference: string;
  isViolation: boolean;
}

interface JudgmentResult {
  isCorrect: boolean;
  wasViolation: boolean;
  explanation: string;
}

interface SessionResult {
  sessionId: string;
  total: number;
  correct: number;
  score: number;
  isPerfect: boolean;
  badgeEarned: boolean;
}
