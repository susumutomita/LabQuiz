import type { User, Category, Quiz, Choice, PendingQuiz, SessionResult, UserProgress, CategoryProgress } from "./api";

// ===== In-memory data store =====

const categories: Category[] = [
  { id: "cat-1", name: "細胞培養基本", description: "細胞培養の基本的な手順と知識" },
  { id: "cat-2", name: "ゾーニング", description: "クリーンルームのエリア区分と入退室ルール" },
  { id: "cat-3", name: "試薬安全管理", description: "試薬の取り扱い・保管・廃棄のルール" },
  { id: "cat-4", name: "ラボルール", description: "ラボ内での行動規範・記録管理" },
  { id: "cat-5", name: "報告ルート", description: "インシデント・異常時の報告手順" },
];

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
  {
    id: "q-9", category_id: "cat-3", status: "pending",
    question: "GHS分類で「髑髏マーク」が示す危険性は？",
    choice_a: "環境有害", choice_b: "急性毒性（高い）",
    choice_c: "引火性", choice_d: "酸化性",
    correct: "b", explanation: "髑髏と骨のマークは急性毒性が高いことを示します。",
  },
  {
    id: "q-10", category_id: "cat-5", status: "pending",
    question: "バイオハザードレベル2の微生物が漏洩した場合の最初の対応は？",
    choice_a: "全員退避", choice_b: "消毒液で処理",
    choice_c: "換気をする", choice_d: "防護具を着用する",
    correct: "d", explanation: "BSL2漏洩時は防護具（手袋・マスク・ゴーグル）を着用してから処理を行います。",
  },
];

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

const users: User[] = [
  { email: "admin@example.com", name: "管理者", role: "admin", created_at: "2026-01-01T00:00:00Z" },
  { email: "reviewer@example.com", name: "監査官", role: "reviewer", created_at: "2026-01-15T00:00:00Z" },
  { email: "user@example.com", name: "新人研究員", role: "learner", created_at: "2026-02-01T00:00:00Z" },
];

const answers: AnswerRecord[] = [];
const badges: BadgeRecord[] = [];

// Current mock user (admin by default for full UI access)
let currentUser: User = users[0];

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

export function setMockUser(user: User) {
  currentUser = user;
}

export function mockGetCurrentUser(): Promise<User> {
  return delay(currentUser);
}

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
    user_email: currentUser.email,
    quiz_id: quizId,
    session_id: sessionId,
    choice: choiceId,
    is_correct: isCorrect,
    answered_at: new Date().toISOString(),
  });
  return delay({ isCorrect, correctChoiceId: quiz.correct, explanation: quiz.explanation });
}

export function mockCompleteSession(sessionId: string): Promise<SessionResult> {
  const sessionAnswers = answers.filter(a => a.session_id === sessionId && a.user_email === currentUser.email);
  const total = sessionAnswers.length;
  const correct = sessionAnswers.filter(a => a.is_correct).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPerfect = total > 0 && correct === total;

  let badgeEarned = false;
  if (isPerfect && sessionAnswers.length > 0) {
    const quiz = quizzes.find(q => q.id === sessionAnswers[0].quiz_id);
    if (quiz) {
      const hasBadge = badges.some(b => b.user_email === currentUser.email && b.category_id === quiz.category_id);
      if (!hasBadge) {
        badges.push({ user_email: currentUser.email, category_id: quiz.category_id, earned_at: new Date().toISOString() });
        badgeEarned = true;
      }
    }
  }
  return delay({ sessionId, total, correct, score, isPerfect, badgeEarned });
}

export function mockGetPendingQuizzes(): Promise<PendingQuiz[]> {
  const pending = quizzes.filter(q => q.status === "pending");
  const catMap: Record<string, string> = {};
  categories.forEach(c => { catMap[c.id] = c.name; });
  return delay(pending.map(q => ({
    id: q.id,
    category_id: q.category_id,
    category_name: catMap[q.category_id] || "",
    creator_name: "Spreadsheet",
    question: q.question,
    choices: [
      { id: "a", text: q.choice_a },
      { id: "b", text: q.choice_b },
      { id: "c", text: q.choice_c },
      { id: "d", text: q.choice_d },
    ].filter(c => c.text),
    correct_choice_id: q.correct,
    explanation: q.explanation,
    status: q.status,
    updated_at: "",
    created_at: "",
  })));
}

export function mockReviewQuiz(quizId: string, action: "approve" | "reject"): Promise<{ success: boolean }> {
  const quiz = quizzes.find(q => q.id === quizId);
  if (!quiz) return Promise.reject(new Error("Quiz not found"));
  quiz.status = action === "approve" ? "approved" : "rejected";
  return delay({ success: true });
}

export function mockGetDashboardProgress(): Promise<UserProgress[]> {
  const quizCategoryMap: Record<string, string> = {};
  quizzes.forEach(q => { quizCategoryMap[q.id] = q.category_id; });

  return delay(users.map(u => {
    const userAnswers = answers.filter(a => a.user_email === u.email);
    const catProgress: CategoryProgress[] = categories.map(cat => {
      const catAnswers = userAnswers.filter(a => quizCategoryMap[a.quiz_id] === cat.id);
      const totalAnswers = catAnswers.length;
      const correctAnswers = catAnswers.filter(a => a.is_correct).length;
      const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
      const sessions = new Set(catAnswers.map(a => a.session_id));
      const sorted = [...catAnswers].sort((a, b) => b.answered_at.localeCompare(a.answered_at));
      const hasBadge = badges.some(b => b.user_email === u.email && b.category_id === cat.id);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        totalAnswers,
        correctAnswers,
        accuracy,
        sessionCount: sessions.size,
        lastAnsweredAt: sorted[0]?.answered_at ?? null,
        hasBadge,
        isWarning: totalAnswers > 0 && accuracy < 70,
      };
    });
    return { userId: u.email, name: u.name, email: u.email, categories: catProgress };
  }));
}

export function mockGetUsers(): Promise<User[]> {
  return delay([...users]);
}

export function mockUpdateUserRole(email: string, role: string): Promise<User> {
  const user = users.find(u => u.email === email);
  if (!user) return Promise.reject(new Error("User not found"));
  user.role = role as User["role"];
  return delay({ ...user });
}
