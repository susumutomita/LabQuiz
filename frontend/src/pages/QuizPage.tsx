import { useState, useEffect, useRef, useCallback } from "react";
import { getCategories, getScenarios, judgeScenario, type Category, type Scenario, type SessionResult, type JudgmentResult } from "../lib/api";
import { sound } from "../lib/sound";

type Phase = "select" | "inspect" | "feedback" | "arrest" | "result";

const CATEGORY_ICONS: Record<string, string> = {
  "細胞培養基本": "🧫",
  "ゾーニング": "🗺️",
  "試薬安全管理": "⚗️",
  "ラボルール": "📋",
  "報告ルート": "📡",
};

const MAX_MISS = 3;

type Rank = "S" | "A" | "B" | "F";

function getRank(score: number): Rank {
  if (score === 100) return "S";
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  return "F";
}

const RANK_CONFIG: Record<Rank, { emoji: string; color: string; textClass: string; glowClass: string; message: string }> = {
  S: { emoji: "🧬", color: "lab-amber", textClass: "text-lab-amber", glowClass: "glow-amber", message: "細胞が見えてきましたね" },
  A: { emoji: "✅", color: "lab-green", textClass: "text-lab-green", glowClass: "glow-green", message: "優秀な監査官です" },
  B: { emoji: "⚠️", color: "lab-amber", textClass: "text-lab-amber", glowClass: "", message: "もう少し注意が必要です" },
  F: { emoji: "☣️", color: "lab-pink", textClass: "text-lab-pink", glowClass: "glow-pink", message: "再訓練が必要です" },
};

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [categories, setCategories] = useState<Category[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<JudgmentResult | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Animation state
  const [charAnim, setCharAnim] = useState<"enter" | "idle" | "exit-ok" | "arrested" | "">("");
  const [hazmatVisible, setHazmatVisible] = useState(false);
  const [hazmatAnim, setHazmatAnim] = useState<"enter" | "exit" | "">("");
  const [stampText, setStampText] = useState<"PASSED" | "VIOLATION" | "">("");
  const [stampCorrect, setStampCorrect] = useState<boolean | null>(null);
  const [flashAnim, setFlashAnim] = useState<"red" | "green" | "">("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const timersRef = useRef<number[]>([]);

  const queueTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    setCategories(getCategories());
    return clearTimers;
  }, [clearTimers]);

  const startSession = (cat?: Category) => {
    setError("");
    const data = getScenarios(cat?.id);
    if (data.scenarios.length === 0) {
      setError(data.message || "シナリオがありません");
      return;
    }
    setScenarios(data.scenarios);
    setSessionId(data.sessionId);
    setSelectedCategory(cat || null);
    setCurrentIndex(0);
    setCorrectCount(0);
    setMissCount(0);
    setPhase("inspect");
    setCharAnim("enter");
    sound.play("enter");
    queueTimer(() => setCharAnim("idle"), 500);
  };

  const submitJudgment = (judgment: "pass" | "violate") => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const scenario = scenarios[currentIndex];
    const result = judgeScenario(scenario.id, judgment, sessionId);

    sound.play("stamp");
    setStampText(judgment === "pass" ? "PASSED" : "VIOLATION");
    setStampCorrect(result.isCorrect);

    if (judgment === "violate") {
      // 違反指摘 → 左へ連行（正解/不正解に関わらず）
      setFlashAnim(result.isCorrect ? "green" : "red");

      queueTimer(() => {
        sound.play(result.isCorrect ? "correct" : "alarm");
        setHazmatVisible(true);
        setHazmatAnim("enter");
      }, 400);

      queueTimer(() => {
        setCharAnim("arrested");
        setHazmatAnim("exit");
        if (!result.isCorrect) sound.play("wrong");
      }, 900);

      queueTimer(() => {
        setHazmatVisible(false);
        setHazmatAnim("");
        if (result.isCorrect) {
          setCorrectCount((c) => c + 1);
        } else {
          const newMissCount = missCount + 1;
          setMissCount(newMissCount);
          if (newMissCount >= MAX_MISS) {
            sound.play("gameOver");
            setFeedback(result);
            setFlashAnim("");
            setPhase("arrest");
            return;
          }
        }
        setFeedback(result);
        setFlashAnim("");
        setPhase("feedback");
      }, 1400);
    } else {
      // 通過許可 → 右へ通す（正解/不正解に関わらず）
      setFlashAnim(result.isCorrect ? "green" : "red");

      queueTimer(() => {
        sound.play(result.isCorrect ? "correct" : "wrong");
        if (result.isCorrect) {
          setCorrectCount((c) => c + 1);
        } else {
          const newMissCount = missCount + 1;
          setMissCount(newMissCount);
          if (newMissCount >= MAX_MISS) {
            sound.play("gameOver");
          }
        }
        setCharAnim("exit-ok");
      }, 400);

      queueTimer(() => {
        setFlashAnim("");
        setFeedback(result);
        setPhase(!result.isCorrect && missCount + 1 >= MAX_MISS ? "arrest" : "feedback");
      }, 850);
    }
  };

  const nextScenario = () => {
    clearTimers();
    setStampText("");
    setStampCorrect(null);
    setIsTransitioning(false);

    if (missCount >= MAX_MISS || currentIndex + 1 >= scenarios.length) {
      const answered = currentIndex + 1;
      const score = answered > 0 ? Math.round((correctCount / answered) * 100) : 0;
      setSessionResult({
        sessionId,
        total: answered,
        correct: correctCount,
        score,
        isPerfect: answered > 0 && correctCount === answered,
        badgeEarned: false,
      });
      setPhase("result");
      return;
    }

    setCurrentIndex((i) => i + 1);
    setFeedback(null);
    setPhase("inspect");
    setCharAnim("enter");
    sound.play("enter");
    queueTimer(() => setCharAnim("idle"), 500);
  };

  const resetQuiz = () => {
    clearTimers();
    setPhase("select");
    setScenarios([]);
    setSessionId("");
    setCurrentIndex(0);
    setFeedback(null);
    setCorrectCount(0);
    setMissCount(0);
    setSessionResult(null);
    setError("");
    setSelectedCategory(null);
    setCharAnim("");
    setHazmatVisible(false);
    setHazmatAnim("");
    setStampText("");
    setStampCorrect(null);
    setFlashAnim("");
    setIsTransitioning(false);
  };

  // ========== Category Select ==========
  if (phase === "select") {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
        <div className="card-lab max-w-lg w-full p-8 animate-slide-up text-center">
          <p className="text-lab-green text-xs tracking-[0.3em] uppercase font-mono-lab mb-2">
            LAB CHECKPOINT
          </p>
          <h2 className="text-2xl font-black text-lab-text mb-2">ラボ検問</h2>
          <p className="text-lab-muted text-sm mb-6">
            あなたはラボの安全監査官。作業者の手順をチェックせよ。
          </p>

          {error && (
            <div className="mb-4 bg-lab-pink/10 border border-lab-pink/30 text-lab-pink px-4 py-3 rounded-lg text-sm">
              {error}
              <button onClick={() => setError("")} className="ml-2 underline">閉じる</button>
            </div>
          )}

          {/* Main random button */}
          <button
            onClick={() => startSession()}
                       className="w-full p-5 mb-6 card-lab border-lab-green/50 hover:border-lab-green hover:shadow-[0_0_20px_rgba(0,255,136,0.15)] transition-all group"
          >
            <div className="text-3xl mb-2">🧬</div>
            <div className="font-black text-xl text-lab-green group-hover:text-lab-green transition-colors">
              検問開始
            </div>
            <div className="text-xs text-lab-muted mt-1">全カテゴリからランダム10問</div>
          </button>

          {/* Category training section */}
          <div className="border-t border-lab-border/30 pt-4">
            <p className="text-lab-muted text-xs font-mono-lab tracking-wider mb-3">CATEGORY TRAINING</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => startSession(cat)}
                                   className="text-left p-3 card-lab hover:border-lab-green/40 hover:shadow-[0_0_10px_rgba(0,255,136,0.08)] transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[cat.name] || "🔬"}</span>
                    <span className="font-bold text-sm text-lab-text group-hover:text-lab-green transition-colors">
                      {cat.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== Game Over (Arrest) ==========
  if (phase === "arrest") {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
        <div className="card-lab max-w-lg w-full p-8 text-center animate-contamination-pulse">
          <div className="text-7xl mb-4 animate-slide-up">☣️</div>
          <h2 className="text-3xl font-black text-lab-pink glow-pink mb-2 animate-slide-up">
            QUARANTINE
          </h2>
          <p className="text-lab-muted mb-6 animate-fade-in">
            誤判定が限界に達しました。<br />
            監査官資格を一時停止します。
          </p>

          <div className="relative h-24 mb-6 overflow-hidden card-lab">
            <div className="absolute inset-0 flex items-center justify-center gap-4">
              <span className="text-4xl animate-fade-in" style={{ animationDelay: "0.3s" }}>👮</span>
              <span className="text-4xl animate-fade-in" style={{ animationDelay: "0.5s" }}>🧑‍🔬</span>
              <span className="text-4xl animate-fade-in" style={{ animationDelay: "0.7s" }}>👮</span>
            </div>
            <div className="absolute bottom-1 left-0 right-0 text-center">
              <span className="text-[10px] font-mono-lab text-lab-pink tracking-widest">
                ESCORTING TO DECONTAMINATION ZONE...
              </span>
            </div>
          </div>

          {feedback && (
            <div className="card-lab p-4 mb-6 text-left border-lab-pink/40 animate-slide-up">
              <p className="text-xs text-lab-muted font-mono-lab mb-1">LAST JUDGMENT FEEDBACK</p>
              <p className="text-sm text-lab-text">{feedback.explanation}</p>
            </div>
          )}

          <button onClick={nextScenario} className="btn-danger">
            結果を見る
          </button>
        </div>
      </div>
    );
  }

  // ========== Result ==========
  if (phase === "result" && sessionResult) {
    const gameOver = missCount >= MAX_MISS;
    const rank = getRank(sessionResult.score);
    const rankInfo = RANK_CONFIG[rank];

    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
        <div className="card-lab max-w-lg w-full p-8 animate-slide-up text-center">
          {/* Rank display */}
          <div className="text-6xl mb-3">{rankInfo.emoji}</div>
          <div className={`text-6xl font-black ${rankInfo.textClass} mb-1`} style={rank === "S" ? {textShadow: "0 0 30px rgba(251,191,36,0.5)"} : undefined}>
            {rank}
          </div>
          <p className={`text-sm ${rankInfo.textClass} mb-1`}>{rankInfo.message}</p>

          {gameOver && (
            <p className="text-lab-muted text-xs mb-2">監査官資格が一時停止されました...</p>
          )}
          {sessionResult.badgeEarned && (
            <p className="text-lab-amber text-sm mb-2">バッジを獲得しました！</p>
          )}

          <div className="card-lab p-6 mt-4 text-left">
            <div className="font-mono-lab text-xs text-lab-muted mb-3">
              {"═══ AUDIT REPORT ═══"}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-lab-muted text-xs">モード</div>
                <div className="text-lab-text font-bold">{selectedCategory?.name || "ランダム検問"}</div>
              </div>
              <div>
                <div className="text-lab-muted text-xs">スコア</div>
                <div className={`text-3xl font-black ${rankInfo.textClass}`}>
                  {sessionResult.score}%
                </div>
              </div>
              <div>
                <div className="text-lab-muted text-xs">正判定</div>
                <div className="text-lab-text">{sessionResult.correct} / {sessionResult.total}</div>
              </div>
              <div>
                <div className="text-lab-muted text-xs">誤判定</div>
                <div className="text-lab-pink">{missCount} / {MAX_MISS}</div>
              </div>
            </div>
          </div>

          <button onClick={resetQuiz} className="btn-primary mt-6">
            トップに戻る
          </button>
        </div>
      </div>
    );
  }

  // ========== Inspection / Feedback (full-screen layout) ==========
  const scenario = scenarios[currentIndex];
  if (!scenario) return null;

  // Parse situation into key-value lines
  const situationLines = scenario.situation.split(" / ").map((line) => {
    const [key, ...rest] = line.split(": ");
    return { key: key.trim(), value: rest.join(": ").trim() };
  });

  // Parse reference into bullet points
  const referenceLines = scenario.reference.split(/[。、]/).filter(Boolean).map(s => s.trim());

  return (
    <div className={`h-[calc(100vh-56px)] flex flex-col ${flashAnim === "red" ? "animate-flash-red" : flashAnim === "green" ? "animate-flash-green" : ""}`}>
      {/* Header bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-lab-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono-lab text-xs px-2 py-0.5 bg-lab-green/10 text-lab-green border border-lab-green/30 rounded">
            {selectedCategory?.name || "ランダム検問"}
          </span>
          <span className="font-mono-lab text-[10px] text-lab-muted tracking-widest uppercase">
            Lab Checkpoint
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono-lab text-xs">
            <span className="text-lab-muted">Case </span>
            <span className="text-lab-text font-bold">{currentIndex + 1}/{scenarios.length}</span>
          </div>
          <div className="font-mono-lab text-xs">
            <span className="text-lab-muted">Score </span>
            <span className="text-lab-green font-bold">{correctCount}</span>
          </div>
          <div className="font-mono-lab text-xs">
            <span className="text-lab-muted">Miss </span>
            <span className={`font-bold ${missCount >= 2 ? "text-lab-pink" : "text-lab-amber"}`}>
              {missCount}/{MAX_MISS}
            </span>
          </div>
        </div>
      </div>

      {/* Miss gauge */}
      <div className="flex gap-0.5 shrink-0">
        {Array.from({ length: MAX_MISS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 transition-all ${
              i < missCount ? "bg-lab-pink shadow-[0_0_8px_rgba(255,62,142,0.5)]" : "bg-lab-border/30"
            }`}
          />
        ))}
      </div>

      {/* Main content area - fills remaining space */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0 overflow-hidden">
        {/* LEFT: Character + Dialogue */}
        <div className="flex flex-col border-r border-lab-border/30 overflow-y-auto">
          {/* Character stage */}
          <div className="relative p-6 flex-1 flex flex-col items-center justify-center overflow-hidden">
            {/* Character */}
            <div className={`flex flex-col items-center gap-2 ${
              charAnim === "enter" ? "animate-char-enter" :
              charAnim === "idle" ? "animate-bobbing" :
              charAnim === "exit-ok" ? "animate-char-exit-ok" :
              charAnim === "arrested" ? "animate-char-arrested" : ""
            }`}>
              <div className="text-7xl">{scenario.charAvatar}</div>
              <div className="text-center">
                <div className="text-lab-cyan text-xs font-mono-lab">{scenario.charRole}</div>
                <div className="text-lab-text font-bold text-xl">{scenario.charName}</div>
              </div>
            </div>

            {/* Hazmat team */}
            {hazmatVisible && (
              <div className={`absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 ${
                hazmatAnim === "enter" ? "animate-hazmat-enter" :
                hazmatAnim === "exit" ? "animate-hazmat-exit" : ""
              }`}>
                <span className="text-5xl">👮</span>
                <div className="text-[10px] font-mono-lab text-lab-pink tracking-wider">HAZMAT</div>
              </div>
            )}

            {/* Stamp overlay */}
            {stampText && (
              <div className="absolute top-6 right-6 animate-stamp z-10">
                <div className={`px-4 py-2 rounded-lg border-4 font-mono-lab font-black text-lg transform -rotate-12 ${
                  stampCorrect
                    ? "border-lab-green text-lab-green bg-lab-green/10"
                    : "border-lab-pink text-lab-pink bg-lab-pink/10"
                }`}>
                  {stampText}
                </div>
              </div>
            )}
          </div>

          {/* Dialogue */}
          <div className="border-t border-lab-border/30 p-4 bg-lab-darker/50">
            <div className="text-[10px] text-lab-cyan font-mono-lab mb-1.5 tracking-wider">WORKER STATEMENT</div>
            <p className="text-lab-text leading-relaxed text-[15px]">
              「{scenario.dialogue}」
            </p>
          </div>

        </div>

        {/* RIGHT: Report + Reference Manual */}
        <div className="flex flex-col overflow-y-auto">
          {/* Work report */}
          <div className="p-5 border-b border-lab-border/30">
            <div className="text-[10px] text-lab-amber font-mono-lab mb-3 tracking-wider flex items-center gap-2">
              <span>📋</span> WORK REPORT
            </div>
            <div className="space-y-3">
              {situationLines.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-lab-muted font-mono-lab text-xs min-w-[4.5rem] pt-0.5 shrink-0">{line.key}:</span>
                  <span className="text-lab-text text-sm">{line.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reference manual */}
          <div className="p-5 flex-1 bg-lab-darker/30">
            <div className="text-[10px] text-lab-green font-mono-lab mb-3 tracking-wider flex items-center gap-2">
              <span>📖</span> LAB MANUAL（参照用）
            </div>
            <div className="text-[10px] text-lab-muted font-mono-lab mb-2">今日の確認項目:</div>
            <ul className="space-y-2">
              {referenceLines.map((line, i) => (
                <li key={i} className="flex gap-2 text-sm text-lab-text">
                  <span className="text-lab-green shrink-0">・</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom action bar - pinned */}
      <div className="shrink-0 border-t border-lab-border/50 bg-lab-darker/80 backdrop-blur-sm px-4 py-3">
        {phase === "inspect" && (
          <div className="flex justify-center gap-6">
            <button
              onClick={() => submitJudgment("pass")}
              disabled={isTransitioning}
              className="btn-approve disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 px-10 py-3 text-base"
            >
              <span className="text-xl">✓</span> 通過許可
            </button>
            <button
              onClick={() => submitJudgment("violate")}
              disabled={isTransitioning}
              className="btn-danger disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 px-10 py-3 text-base"
            >
              <span className="text-xl">✗</span> 違反指摘
            </button>
          </div>
        )}
      </div>

      {/* Feedback modal */}
      {feedback && phase === "feedback" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card-lab max-w-md w-full mx-4 p-6 animate-slide-up">
            <div className="text-center mb-4">
              <div className={`text-5xl mb-2 ${feedback.isCorrect ? "" : "animate-shake"}`}>
                {feedback.isCorrect ? "✅" : "❌"}
              </div>
              <h3 className={`text-xl font-black ${feedback.isCorrect ? "text-lab-green" : "text-lab-pink"}`}>
                {feedback.isCorrect ? "正しい判定！" : "誤判定..."}
              </h3>
            </div>

            <div className={`rounded-lg p-4 mb-4 ${
              feedback.isCorrect ? "bg-lab-green/10 border border-lab-green/30" : "bg-lab-pink/10 border border-lab-pink/30"
            }`}>
              <p className={`text-xs font-mono-lab mb-2 ${feedback.isCorrect ? "text-lab-green" : "text-lab-pink"}`}>
                {feedback.wasViolation ? "このケースは【違反】でした" : "このケースは【正常】でした"}
              </p>
              <p className="text-lab-text text-sm leading-relaxed">{feedback.explanation}</p>
            </div>

            <button onClick={nextScenario} className="btn-primary w-full py-3 text-base">
              {currentIndex + 1 < scenarios.length ? "次のケースへ →" : "結果を見る"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
