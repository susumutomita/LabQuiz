import type { Category, Quiz, Choice, SessionResult, Scenario, JudgmentResult } from "./api";
import categoriesData from "@content/categories.json";
import scenariosData from "@content/scenarios.json";

// ===== In-memory data store =====

const categories: Category[] = categoriesData;

interface QuizData {
  id: string;
  category_id: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct: string;
  explanation: string;
  status: string;
}

const quizzes: QuizData[] = [
  {
    id: "q-1", category_id: "cat-1", status: "approved",
    question: "クリーンベンチ使用前に最初に行うべきことは？",
    choice_a: "UV照射を30分行う", choice_b: "70%エタノールで拭く",
    choice_c: "培地を温める", choice_d: "手袋をつける",
    correct: "b", explanation: "クリーンベンチ使用前には70%エタノールで作業面を拭いて消毒します。UV照射は使用後に行います。",
  },
  {
    id: "q-2", category_id: "cat-1", status: "approved",
    question: "細胞の継代培養で、トリプシン処理後に培地を加える主な理由は？",
    choice_a: "細胞に栄養を与える", choice_b: "トリプシンの作用を止める",
    choice_c: "細胞を洗浄する", choice_d: "pHを調整する",
    correct: "b", explanation: "培地中の血清がトリプシンを不活化し、過剰な消化を防ぎます。",
  },
  {
    id: "q-3", category_id: "cat-1", status: "approved",
    question: "培養細胞のコンタミネーションを示す兆候として最も一般的なのは？",
    choice_a: "培地の色が変化する", choice_b: "細胞が増殖しなくなる",
    choice_c: "培地が透明になる", choice_d: "フラスコに気泡ができる",
    correct: "a", explanation: "細菌コンタミでは培地のpH変化により色が黄色に変わります。",
  },
  {
    id: "q-4", category_id: "cat-2", status: "approved",
    question: "クリーンルームに入室する際、最初に行うのは？",
    choice_a: "手袋を装着する", choice_b: "エアシャワーを通過する",
    choice_c: "靴を履き替える", choice_d: "ガウンを着用する",
    correct: "c", explanation: "入室手順は靴の履き替え→ガウン着用→手袋装着→エアシャワーの順です。",
  },
  {
    id: "q-5", category_id: "cat-2", status: "approved",
    question: "準清潔エリアから清潔エリアに物品を持ち込む際に必要なのは？",
    choice_a: "消毒と滅菌", choice_b: "上長の許可",
    choice_c: "記録への記入", choice_d: "パスボックスの使用",
    correct: "d", explanation: "パスボックス（受け渡し用の小窓）を通じて物品を移動させることで交差汚染を防ぎます。",
  },
  {
    id: "q-6", category_id: "cat-3", status: "approved",
    question: "引火性の高い有機溶媒を保管する場所として適切なのは？",
    choice_a: "通常の棚", choice_b: "耐火金庫",
    choice_c: "冷蔵庫（防爆型）", choice_d: "ドラフトチャンバー内",
    correct: "c", explanation: "引火性溶媒は防爆型冷蔵庫で保管します。通常の冷蔵庫は庫内に着火源があるため使えません。",
  },
  {
    id: "q-7", category_id: "cat-4", status: "approved",
    question: "実験ノートの記録として不適切なのは？",
    choice_a: "鉛筆で記録する", choice_b: "日付と署名を入れる",
    choice_c: "訂正は二重線で消す", choice_d: "写真を貼付する",
    correct: "a", explanation: "実験ノートは改ざん防止のため、消せない筆記具（ボールペン等）で記録します。",
  },
  {
    id: "q-8", category_id: "cat-5", status: "approved",
    question: "試薬をこぼした場合、最初に行うべきことは？",
    choice_a: "上長に報告する", choice_b: "SDSを確認する",
    choice_c: "水で洗い流す", choice_d: "周囲の人に知らせる",
    correct: "d", explanation: "まず周囲の安全確保が最優先です。その後SDS確認→適切な処理→報告の手順を踏みます。",
  },
];

// ===== Scenario data (Lab Checkpoint) =====

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

const scenarios: ScenarioData[] = scenariosData;

interface AnswerRecord {
  user_email: string;
  quiz_id: string;
  session_id: string;
  choice: string;
  is_correct: boolean;
  answered_at: string;
}

interface BadgeRecord {
  user_email: string;
  category_id: string;
  earned_at: string;
}

const answers: AnswerRecord[] = [];
const badges: BadgeRecord[] = [];

// ===== Helpers =====

function shuffleArray<T>(arr: T[]): T[] {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

function uuid(): string {
  return crypto.randomUUID();
}

function delay<T>(data: T, ms = 200): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms));
}

// ===== Mock API handlers =====

export function mockGetCategories(): Promise<Category[]> {
  return delay([...categories]);
}

export function mockGetQuizzes(categoryId: string, count = 10): Promise<{ sessionId: string; quizzes: Quiz[]; message?: string }> {
  const approved = quizzes.filter(q => q.category_id === categoryId && q.status === "approved");
  if (approved.length === 0) {
    return delay({ sessionId: "", quizzes: [], message: "このカテゴリにはまだ問題がありません" });
  }
  const selected = shuffleArray(approved).slice(0, Math.min(count, approved.length));
  const sessionId = uuid();
  const mapped: Quiz[] = selected.map(q => {
    const allChoices: Choice[] = [
      { id: "a", text: q.choice_a },
      { id: "b", text: q.choice_b },
      { id: "c", text: q.choice_c },
      { id: "d", text: q.choice_d },
    ].filter(c => c.text);
    const correct = allChoices.find(c => c.id === q.correct)!;
    const wrong = shuffleArray(allChoices.filter(c => c.id !== q.correct));
    return {
      id: q.id,
      categoryId: q.category_id,
      question: q.question,
      choices: shuffleArray([correct, wrong[0]]),
    };
  });
  return delay({ sessionId, quizzes: mapped });
}

export function mockAnswerQuiz(quizId: string, choiceId: string, sessionId: string): Promise<{ isCorrect: boolean; correctChoiceId: string; explanation: string }> {
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) return Promise.reject(new Error("Quiz not found"));
  const isCorrect = quiz.correct === choiceId;
  answers.push({
    user_email: "anonymous@local",
    quiz_id: quizId,
    session_id: sessionId,
    choice: choiceId,
    is_correct: isCorrect,
    answered_at: new Date().toISOString(),
  });
  return delay({ isCorrect, correctChoiceId: quiz.correct, explanation: quiz.explanation });
}

export function mockCompleteSession(sessionId: string): Promise<SessionResult> {
  const sessionAnswers = answers.filter(a => a.session_id === sessionId);
  const total = sessionAnswers.length;
  const correct = sessionAnswers.filter(a => a.is_correct).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPerfect = total > 0 && correct === total;
  return delay({ sessionId, total, correct, score, isPerfect, badgeEarned: false });
}

// ===== Scenario mock handlers =====

export function mockGetScenarios(categoryId?: string, count = 10): Promise<{ sessionId: string; scenarios: Scenario[]; message?: string }> {
  const approved = categoryId
    ? scenarios.filter(s => s.category_id === categoryId && s.status === "approved")
    : scenarios.filter(s => s.status === "approved");
  if (approved.length === 0) {
    return delay({ sessionId: "", scenarios: [], message: categoryId ? "このカテゴリにはまだシナリオがありません" : "シナリオがありません" });
  }
  const selected = shuffleArray(approved).slice(0, Math.min(count, approved.length));
  const sessionId = uuid();
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
  return delay({ sessionId, scenarios: mapped });
}

export function mockJudgeScenario(scenarioId: string, judgment: "pass" | "violate", sessionId: string): Promise<JudgmentResult> {
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (!scenario) return Promise.reject(new Error("Scenario not found"));
  const playerChoseViolate = judgment === "violate";
  const isCorrect = playerChoseViolate === scenario.is_violation;
  answers.push({
    user_email: "anonymous@local",
    quiz_id: scenarioId,
    session_id: sessionId,
    choice: judgment,
    is_correct: isCorrect,
    answered_at: new Date().toISOString(),
  });
  return delay({ isCorrect, wasViolation: scenario.is_violation, explanation: scenario.explanation });
}

export function mockCompleteScenarioSession(sessionId: string): Promise<SessionResult> {
  const sessionAnswers = answers.filter(a => a.session_id === sessionId);
  const total = sessionAnswers.length;
  const correct = sessionAnswers.filter(a => a.is_correct).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPerfect = total > 0 && correct === total;

  let badgeEarned = false;
  if (isPerfect && sessionAnswers.length > 0) {
    const scenario = scenarios.find(s => s.id === sessionAnswers[0].quiz_id);
    if (scenario) {
      const hasBadge = badges.some(b => b.user_email === "anonymous@local" && b.category_id === scenario.category_id);
      if (!hasBadge) {
        badges.push({ user_email: "anonymous@local", category_id: scenario.category_id, earned_at: new Date().toISOString() });
        badgeEarned = true;
      }
    }
  }
  return delay({ sessionId, total, correct, score, isPerfect, badgeEarned });
}
