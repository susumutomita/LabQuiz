import categoriesData from "@content/categories.json";
import scenariosData from "@content/scenarios.json";

// ===== Types =====

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface Scenario {
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

export interface JudgmentResult {
  isCorrect: boolean;
  wasViolation: boolean;
  explanation: string;
}

export interface SessionResult {
  sessionId: string;
  total: number;
  correct: number;
  score: number;
  isPerfect: boolean;
  badgeEarned: boolean;
}

// ===== Data =====

interface ScenarioData {
  id: string;
  category_id: string;
  char_name: string;
  char_role: string;
  char_avatar: string;
  situation: string;
  dialogue: string;
  reference: string;
  is_violation: boolean;
  explanation: string;
  status: string;
}

const categories: Category[] = categoriesData;
const scenarios: ScenarioData[] = scenariosData;

// ===== Helpers =====

function shuffleArray<T>(arr: T[]): T[] {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

// ===== API =====

export function getCategories(): Category[] {
  return [...categories];
}

export function getScenarios(categoryId?: string, count = 10): { sessionId: string; scenarios: Scenario[]; message?: string } {
  const approved = categoryId
    ? scenarios.filter(s => s.category_id === categoryId && s.status === "approved")
    : scenarios.filter(s => s.status === "approved");
  if (approved.length === 0) {
    return { sessionId: "", scenarios: [], message: categoryId ? "このカテゴリにはまだシナリオがありません" : "シナリオがありません" };
  }
  const selected = shuffleArray(approved).slice(0, Math.min(count, approved.length));
  const sessionId = crypto.randomUUID();
  const mapped: Scenario[] = selected.map(s => ({
    id: s.id,
    categoryId: s.category_id,
    charName: s.char_name,
    charRole: s.char_role,
    charAvatar: s.char_avatar,
    situation: s.situation,
    dialogue: s.dialogue,
    reference: s.reference,
    isViolation: s.is_violation,
  }));
  return { sessionId, scenarios: mapped };
}

export function judgeScenario(scenarioId: string, judgment: "pass" | "violate", _sessionId: string): JudgmentResult {
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (!scenario) throw new Error("Scenario not found");
  const playerChoseViolate = judgment === "violate";
  const isCorrect = playerChoseViolate === scenario.is_violation;
  return { isCorrect, wasViolation: scenario.is_violation, explanation: scenario.explanation };
}
