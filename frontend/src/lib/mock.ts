import type { User, Category, Quiz, Choice, PendingQuiz, SessionResult, UserProgress, CategoryProgress, Scenario, JudgmentResult, PendingScenario } from "./api";

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

const scenarios: ScenarioData[] = [
  // cat-1: 細胞培養基本 (3 scenarios)
  {
    id: "sc-001", category_id: "cat-1", status: "approved",
    char_name: "田中", char_role: "新人研究員", char_avatar: "👩‍🔬",
    situation: "場所: クリーンベンチ / 作業: 継代培養 / 手袋: 未着用 / 消毒: 未実施",
    dialogue: "手袋なしの方が細かい操作がしやすいんですよ。先輩もそうしてました。",
    reference: "クリーンベンチ作業時は必ず滅菌手袋を着用すること。作業前に70%エタノールで手指消毒を行うこと。",
    is_violation: true,
    explanation: "素手での作業は細胞へのコンタミネーションの主要原因です。必ず滅菌手袋を着用し、70%エタノールで消毒してから作業を開始してください。",
  },
  {
    id: "sc-002", category_id: "cat-1", status: "approved",
    char_name: "鈴木", char_role: "研究補助員", char_avatar: "👨‍🔬",
    situation: "場所: クリーンベンチ / 作業: 培地交換 / 手袋: 着用 / 消毒: エタノール拭き取り済み",
    dialogue: "培地交換前にベンチ内をエタノールで拭いて、手袋も消毒しました。",
    reference: "クリーンベンチ使用前に70%エタノールで作業面を拭くこと。手袋着用・消毒後に作業開始。",
    is_violation: false,
    explanation: "正しい手順です。クリーンベンチの消毒、手袋の着用・消毒を行ってから作業を開始しています。",
  },
  {
    id: "sc-003", category_id: "cat-1", status: "approved",
    char_name: "高橋", char_role: "修士1年", char_avatar: "🧑‍🔬",
    situation: "場所: クリーンベンチ / 作業: トリプシン処理 / トリプシン放置: 15分 / 培地追加: なし",
    dialogue: "トリプシンを入れて15分くらい放置してたんですが、まだ剥がれないですね...もう少し待ちます。",
    reference: "トリプシン処理は37℃で3-5分が目安。顕微鏡で細胞の剥離を確認後、速やかに培地を加えてトリプシンを不活化すること。",
    is_violation: true,
    explanation: "トリプシンの長時間処理は細胞にダメージを与えます。3-5分を目安に顕微鏡で確認し、速やかに培地（血清入り）でトリプシンを不活化してください。",
  },

  // cat-2: ゾーニング (3 scenarios)
  {
    id: "sc-004", category_id: "cat-2", status: "approved",
    char_name: "佐藤", char_role: "外部委託作業員", char_avatar: "👷",
    situation: "場所: クリーンルーム入口 / 行動: 靴履き替えなし / 装備: 普段着のまま",
    dialogue: "すぐ終わる作業なので、このまま入っても大丈夫ですよね？着替えるの面倒で。",
    reference: "クリーンルーム入室手順: 靴履き替え→専用ガウン着用→手袋装着→エアシャワー通過。例外なし。",
    is_violation: true,
    explanation: "たとえ短時間でも、クリーンルームへの入室は必ず所定の手順を踏んでください。外部からの微粒子やコンタミの持ち込みを防ぐ重要な手順です。",
  },
  {
    id: "sc-005", category_id: "cat-2", status: "approved",
    char_name: "渡辺", char_role: "技術員", char_avatar: "👩‍🔧",
    situation: "場所: パスボックス前 / 行動: 試薬をパスボックスで受け渡し / 消毒: パスボックス内UV照射済み",
    dialogue: "清潔エリアに試薬を持ち込むので、パスボックスのUVを当ててから受け渡しました。",
    reference: "準清潔エリアから清潔エリアへの物品移動はパスボックスを使用すること。UV照射または消毒を実施。",
    is_violation: false,
    explanation: "正しい手順です。パスボックスを使用し、UV照射による消毒を行った上で物品を移動しています。",
  },
  {
    id: "sc-006", category_id: "cat-2", status: "approved",
    char_name: "中村", char_role: "博士課程", char_avatar: "🧑‍🎓",
    situation: "場所: クリーンルーム内 / 行動: 携帯電話を持ち込み使用 / 理由: 緊急連絡待ち",
    dialogue: "教授からの連絡を待ってるんです。携帯は消毒してから持ち込みました。",
    reference: "クリーンルーム内への私物持ち込みは原則禁止。通信機器はクリーンルーム外の専用ロッカーに保管すること。",
    is_violation: true,
    explanation: "携帯電話は微粒子やコンタミの発生源になります。消毒しても完全には除去できません。緊急連絡はクリーンルーム外で対応してください。",
  },

  // cat-3: 試薬安全管理 (3 scenarios)
  {
    id: "sc-007", category_id: "cat-3", status: "approved",
    char_name: "山田", char_role: "学部4年", char_avatar: "👨‍🎓",
    situation: "場所: 試薬保管庫 / 行動: アセトンを一般冷蔵庫に保管 / 理由: 防爆冷蔵庫が満杯",
    dialogue: "防爆冷蔵庫がいっぱいなので、一般の冷蔵庫に入れておきました。ちゃんとフタはしてます。",
    reference: "引火性有機溶媒（アセトン、エタノール等）は必ず防爆型冷蔵庫で保管。一般冷蔵庫は庫内に着火源があり使用禁止。",
    is_violation: true,
    explanation: "一般冷蔵庫は庫内のサーモスタット等が着火源となり、引火性溶媒と組み合わせると爆発の危険があります。防爆冷蔵庫の空きを作るか、室温保管可能な試薬を移動してください。",
  },
  {
    id: "sc-008", category_id: "cat-3", status: "approved",
    char_name: "小林", char_role: "ポスドク", char_avatar: "👩‍🔬",
    situation: "場所: ドラフトチャンバー / 作業: ホルマリン固定 / 装備: 手袋+保護メガネ+マスク / 換気: ON",
    dialogue: "ホルマリン作業なのでドラフト内で、保護具もフルセットで作業します。",
    reference: "ホルマリン等の揮発性有害試薬はドラフトチャンバー内で取り扱う。保護手袋・保護メガネ・マスク着用必須。",
    is_violation: false,
    explanation: "正しい手順です。ホルマリンの取り扱いをドラフトチャンバー内で行い、適切な保護具を着用しています。",
  },
  {
    id: "sc-009", category_id: "cat-3", status: "approved",
    char_name: "伊藤", char_role: "新人研究員", char_avatar: "🧑‍🔬",
    situation: "場所: 実験台 / 行動: 酸性廃液と塩基性廃液を同じタンクに廃棄 / 理由: タンクが1つしかない",
    dialogue: "廃液タンクが1つしかなかったので、まとめて入れちゃいました。量も少ないし大丈夫ですよね。",
    reference: "酸性廃液と塩基性廃液は専用の廃液タンクに分別して廃棄すること。混合は有害ガス発生の原因となる。",
    is_violation: true,
    explanation: "酸と塩基の混合は発熱反応や有害ガスの発生を引き起こす可能性があります。必ず分別して廃棄してください。タンクが不足している場合は管理者に報告を。",
  },

  // cat-4: ラボルール (3 scenarios)
  {
    id: "sc-010", category_id: "cat-4", status: "approved",
    char_name: "加藤", char_role: "技術補佐員", char_avatar: "👩‍💼",
    situation: "場所: 実験室 / 行動: 実験ノートに鉛筆で記録 / 理由: 書き間違えた時に消せるから",
    dialogue: "鉛筆の方が消しゴムで直せるので便利なんですよ。最終的にはきれいにまとめます。",
    reference: "実験ノートは改ざん防止のため、消せない筆記具（ボールペン等）で記録すること。訂正は二重線で消し、訂正日と署名を記入。",
    is_violation: true,
    explanation: "鉛筆は消去・改ざんが可能なため、実験記録には使用できません。ボールペン等の消せない筆記具を使い、訂正は二重線+日付+署名で行ってください。",
  },
  {
    id: "sc-011", category_id: "cat-4", status: "approved",
    char_name: "松本", char_role: "准教授", char_avatar: "👨‍🏫",
    situation: "場所: 実験室 / 行動: 実験後に器具洗浄・実験台消毒・記録記入を完了 / 退室: チェックリスト記入済み",
    dialogue: "実験終了したので、片付け・消毒・記録を済ませて退室チェックリストも書きました。",
    reference: "実験終了後は器具洗浄、実験台消毒、実験ノート記入、退室チェックリストの記入を行うこと。",
    is_violation: false,
    explanation: "正しい手順です。実験後の片付け、消毒、記録、チェックリスト記入まで全て完了しています。",
  },
  {
    id: "sc-012", category_id: "cat-4", status: "approved",
    char_name: "木村", char_role: "修士2年", char_avatar: "👨‍🔬",
    situation: "場所: 実験室 / 行動: 飲食（ペットボトルの水を飲む） / 場所: 実験台の上",
    dialogue: "ちょっと喉が渇いて...実験台の端っこなら大丈夫かなと思って。",
    reference: "実験室内での飲食は厳禁。飲食は指定の休憩室で行うこと。実験台上に飲食物を置いてはならない。",
    is_violation: true,
    explanation: "実験室内での飲食は、試薬の経口摂取リスクや実験へのコンタミリスクがあります。どんな状況でも実験室内での飲食は禁止です。",
  },

  // cat-5: 報告ルート (3 scenarios)
  {
    id: "sc-013", category_id: "cat-5", status: "approved",
    char_name: "井上", char_role: "研究員", char_avatar: "👩‍🔬",
    situation: "場所: 実験室 / 事象: 試薬（塩酸）をこぼした / 対応: まず周囲に声をかけて退避させた",
    dialogue: "塩酸をこぼしてしまったので、まず周りの人に声をかけて離れてもらいました。これからSDSを確認します。",
    reference: "試薬こぼし時の手順: 1.周囲へ知らせる 2.SDS確認 3.適切な処理 4.上長へ報告。まず安全確保が最優先。",
    is_violation: false,
    explanation: "正しい対応です。まず周囲の安全確保を行い、その後SDS確認→処理→報告の手順を踏もうとしています。",
  },
  {
    id: "sc-014", category_id: "cat-5", status: "approved",
    char_name: "石田", char_role: "学部4年", char_avatar: "👨‍🎓",
    situation: "場所: 培養室 / 事象: インキュベーターの温度異常（42℃表示） / 対応: 自分で設定を調整して元に戻した",
    dialogue: "温度が42℃になってたので、37℃に設定し直しました。たぶん誰かが触っちゃったんだと思います。報告はしてません。",
    reference: "機器の異常を発見した場合は、自己判断で調整せず、直ちに上長・機器管理者に報告すること。記録を残すこと。",
    is_violation: true,
    explanation: "機器の温度異常は故障の可能性もあります。自己判断での調整ではなく、上長・管理者への報告が必須です。また、培養中の細胞への影響確認も必要です。",
  },
  {
    id: "sc-015", category_id: "cat-5", status: "approved",
    char_name: "藤田", char_role: "ポスドク", char_avatar: "👩‍🔬",
    situation: "場所: 微生物実験室 / 事象: BSL2培養液が飛散 / 対応: 防護具着用→消毒液処理→管理者に報告",
    dialogue: "BSL2の培養液が少し飛んでしまいました。防護具を着けて消毒処理した後、すぐに安全管理者に報告しました。",
    reference: "BSL2微生物漏洩時: 1.防護具着用 2.消毒液で処理 3.安全管理者へ報告 4.インシデントレポート記入。",
    is_violation: false,
    explanation: "正しい対応です。防護具着用→消毒処理→報告の手順を適切に実行しています。",
  },

  // Pending scenarios for review testing
  {
    id: "sc-016", category_id: "cat-1", status: "pending",
    char_name: "西村", char_role: "新人研究員", char_avatar: "🧑‍🔬",
    situation: "場所: クリーンベンチ / 作業: 培地調製 / 備考: ベンチのUV照射中に作業開始",
    dialogue: "UV照射が終わるまで待つと時間がもったいないので、照射中に作業を始めちゃいます。",
    reference: "UV照射中はクリーンベンチ内での作業を行わないこと。UV光は皮膚・目に有害。照射完了後に作業開始。",
    is_violation: true,
    explanation: "UV照射中の作業はUV光による皮膚や目の障害リスクがあります。照射完了を待ってから作業を開始してください。",
  },
  {
    id: "sc-017", category_id: "cat-3", status: "pending",
    char_name: "吉田", char_role: "修士1年", char_avatar: "👨‍🔬",
    situation: "場所: 試薬庫 / 行動: 期限切れの試薬を使用 / 理由: もったいないから",
    dialogue: "期限が2ヶ月前に切れてますけど、見た目は変わらないし大丈夫でしょう。",
    reference: "使用期限切れの試薬は使用禁止。実験結果の信頼性に関わるため、期限管理を徹底すること。",
    is_violation: true,
    explanation: "期限切れ試薬の使用は実験結果の信頼性を損ないます。見た目で判断せず、期限管理を徹底してください。",
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

// ===== Scenario mock handlers =====

export function mockGetScenarios(categoryId: string, count = 10): Promise<{ sessionId: string; scenarios: Scenario[]; message?: string }> {
  const approved = scenarios.filter(s => s.category_id === categoryId && s.status === "approved");
  if (approved.length === 0) {
    return delay({ sessionId: "", scenarios: [], message: "このカテゴリにはまだシナリオがありません" });
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
    user_email: currentUser.email,
    quiz_id: scenarioId,
    session_id: sessionId,
    choice: judgment,
    is_correct: isCorrect,
    answered_at: new Date().toISOString(),
  });
  return delay({ isCorrect, wasViolation: scenario.is_violation, explanation: scenario.explanation });
}

export function mockCompleteScenarioSession(sessionId: string): Promise<SessionResult> {
  const sessionAnswers = answers.filter(a => a.session_id === sessionId && a.user_email === currentUser.email);
  const total = sessionAnswers.length;
  const correct = sessionAnswers.filter(a => a.is_correct).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPerfect = total > 0 && correct === total;

  let badgeEarned = false;
  if (isPerfect && sessionAnswers.length > 0) {
    const scenario = scenarios.find(s => s.id === sessionAnswers[0].quiz_id);
    if (scenario) {
      const hasBadge = badges.some(b => b.user_email === currentUser.email && b.category_id === scenario.category_id);
      if (!hasBadge) {
        badges.push({ user_email: currentUser.email, category_id: scenario.category_id, earned_at: new Date().toISOString() });
        badgeEarned = true;
      }
    }
  }
  return delay({ sessionId, total, correct, score, isPerfect, badgeEarned });
}

export function mockGetPendingScenarios(): Promise<PendingScenario[]> {
  const pending = scenarios.filter(s => s.status === "pending");
  const catMap: Record<string, string> = {};
  categories.forEach(c => { catMap[c.id] = c.name; });
  return delay(pending.map(s => ({
    id: s.id,
    category_id: s.category_id,
    category_name: catMap[s.category_id] || "",
    char_name: s.char_name,
    char_role: s.char_role,
    char_avatar: s.char_avatar,
    situation: s.situation,
    dialogue: s.dialogue,
    reference: s.reference,
    is_violation: s.is_violation,
    explanation: s.explanation,
    status: s.status,
  })));
}

export function mockReviewScenario(scenarioId: string, action: "approve" | "reject"): Promise<{ success: boolean }> {
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (!scenario) return Promise.reject(new Error("Scenario not found"));
  scenario.status = action === "approve" ? "approved" : "rejected";
  return delay({ success: true });
}
