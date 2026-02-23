import { useState, useEffect, useRef, useCallback } from "react";
import { getCategories, getScenarios, judgeScenario, completeScenarioSession, type Category, type Scenario, type SessionResult, type JudgmentResult } from "../lib/api";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Animation state
  const [charAnim, setCharAnim] = useState<"enter" | "idle" | "exit-ok" | "arrested" | "">("");
  const [hazmatVisible, setHazmatVisible] = useState(false);
  const [hazmatAnim, setHazmatAnim] = useState<"enter" | "exit" | "">("");
  const [stampText, setStampText] = useState<"PASSED" | "VIOLATION" | "">("");
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
    getCategories().then(setCategories).catch((e) => setError(e.message));
    return clearTimers;
  }, [clearTimers]);

  const startSession = async (cat: Category) => {
    setLoading(true);
    setError("");
    try {
      const data = await getScenarios(cat.id);
      if (data.scenarios.length === 0) {
        setError(data.message || "このカテゴリにはまだシナリオがありません");
        return;
      }
      setScenarios(data.scenarios);
      setSessionId(data.sessionId);
      setSelectedCategory(cat);
      setCurrentIndex(0);
      setCorrectCount(0);
      setMissCount(0);
      setPhase("inspect");
      setCharAnim("enter");
      sound.play("enter");
      queueTimer(() => setCharAnim("idle"), 500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const submitJudgment = async (judgment: "pass" | "violate") => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setLoading(true);

    try {
      const scenario = scenarios[currentIndex];
      const result = await judgeScenario(scenario.id, judgment, sessionId);

      sound.play("stamp");

      if (result.isCorrect) {
        setStampText(judgment === "pass" ? "PASSED" : "VIOLATION");
        setFlashAnim("green");
        queueTimer(() => {
          sound.play("correct");
          setFeedback(result);
          setCorrectCount((c) => c + 1);
          setPhase("feedback");
          queueTimer(() => setFlashAnim(""), 500);
        }, 400);
      } else {
        setStampText(judgment === "pass" ? "PASSED" : "VIOLATION");
        setFlashAnim("red");
        const newMissCount = missCount + 1;
        setMissCount(newMissCount);

        queueTimer(() => {
          sound.play("alarm");
          setHazmatVisible(true);
          setHazmatAnim("enter");
        }, 400);

        queueTimer(() => {
          setCharAnim("arrested");
          setHazmatAnim("exit");
          sound.play("wrong");
        }, 900);

        queueTimer(() => {
          setHazmatVisible(false);
          setHazmatAnim("");
          setFeedback(result);
          setPhase(newMissCount >= MAX_MISS ? "arrest" : "feedback");
          setFlashAnim("");
          if (newMissCount >= MAX_MISS) {
            sound.play("gameOver");
          }
        }, 1400);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setIsTransitioning(false);
    } finally {
      setLoading(false);
    }
  };

  const nextScenario = async () => {
    clearTimers();
    setStampText("");
    setIsTransitioning(false);

    if (missCount >= MAX_MISS || currentIndex + 1 >= scenarios.length) {
      setLoading(true);
      try {
        const result = await completeScenarioSession(sessionId);
        setSessionResult(result);
        setPhase("result");
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
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
          <h2 className="text-2xl font-black text-lab-text mb-2">検問カテゴリを選択</h2>
          <p className="text-lab-muted text-sm mb-6">
            あなたはラボの安全監査官。作業者の手順をチェックせよ。
          </p>

          {error && (
            <div className="mb-4 bg-lab-pink/10 border border-lab-pink/30 text-lab-pink px-4 py-3 rounded-lg text-sm">
              {error}
              <button onClick={() => setError("")} className="ml-2 underline">閉じる</button>
            </div>
          )}

          <div className="space-y-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => startSession(cat)}
                disabled={loading}
                className="w-full text-left p-4 card-lab hover:border-lab-green/50 hover:shadow-[0_0_15px_rgba(0,255,136,0.1)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[cat.name] || "🔬"}</span>
                  <div>
                    <div className="font-bold text-lab-text group-hover:text-lab-green transition-colors">
                      {cat.name}
                    </div>
                    {cat.description && (
                      <div className="text-xs text-lab-muted mt-0.5">{cat.description}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
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
              <span className="text-4xl animate-fade-in" style={{ animationDelay: "0.3s" }}>🛡️</span>
              <span className="text-4xl animate-fade-in" style={{ animationDelay: "0.5s" }}>🧑‍🔬</span>
              <span className="text-4xl animate-fade-in" style={{ animationDelay: "0.7s" }}>🛡️</span>
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

          <button onClick={nextScenario} disabled={loading} className="btn-danger">
            {loading ? "処理中..." : "結果を見る"}
          </button>
        </div>
      </div>
    );
  }

  // ========== Result ==========
  if (phase === "result" && sessionResult) {
    const gameOver = missCount >= MAX_MISS;
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
        <div className="card-lab max-w-lg w-full p-8 animate-slide-up text-center">
          {gameOver ? (
            <>
              <div className="text-6xl mb-4">☣️</div>
              <h2 className="text-3xl font-black text-lab-pink glow-pink mb-2">SUSPENDED</h2>
              <p className="text-lab-muted mb-4">監査官資格が一時停止されました...</p>
            </>
          ) : sessionResult.isPerfect ? (
            <>
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-black text-lab-amber mb-2" style={{textShadow: "0 0 20px rgba(251,191,36,0.4)"}}>
                PERFECT AUDIT
              </h2>
              {sessionResult.badgeEarned && (
                <p className="text-lab-amber text-sm mb-4">バッジを獲得しました！</p>
              )}
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">{sessionResult.score >= 70 ? "✅" : "⚠️"}</div>
              <h2 className={`text-3xl font-black mb-2 ${sessionResult.score >= 70 ? "text-lab-green glow-green" : "text-lab-amber"}`}>
                {sessionResult.score >= 70 ? "CERTIFIED" : "NEEDS TRAINING"}
              </h2>
            </>
          )}

          <div className="card-lab p-6 mt-6 text-left">
            <div className="font-mono-lab text-xs text-lab-muted mb-3">
              {"═══ AUDIT REPORT ═══"}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-lab-muted text-xs">カテゴリ</div>
                <div className="text-lab-text font-bold">{selectedCategory?.name}</div>
              </div>
              <div>
                <div className="text-lab-muted text-xs">スコア</div>
                <div className={`text-3xl font-black ${sessionResult.score >= 70 ? "text-lab-green" : "text-lab-pink"}`}>
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
            カテゴリ選択に戻る
          </button>
        </div>
      </div>
    );
  }

  // ========== Inspection / Feedback (2-column layout) ==========
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
    <div className={`max-w-5xl mx-auto p-4 ${flashAnim === "red" ? "animate-flash-red" : flashAnim === "green" ? "animate-flash-green" : ""}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="font-mono-lab text-xs px-2 py-1 bg-lab-green/10 text-lab-green border border-lab-green/30 rounded">
            {selectedCategory?.name}
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
      <div className="flex gap-1 mb-4">
        {Array.from({ length: MAX_MISS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i < missCount ? "bg-lab-pink shadow-[0_0_8px_rgba(255,62,142,0.5)]" : "bg-lab-border"
            }`}
          />
        ))}
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: Character + Dialogue */}
        <div className="space-y-4">
          {/* Character card */}
          <div className="card-lab p-5 relative overflow-hidden">
            <div className="relative flex items-center gap-4">
              <div className={`text-5xl ${
                charAnim === "enter" ? "animate-char-enter" :
                charAnim === "idle" ? "animate-bobbing" :
                charAnim === "exit-ok" ? "animate-char-exit-ok" :
                charAnim === "arrested" ? "animate-char-arrested" : ""
              }`}>
                {scenario.charAvatar}
              </div>
              <div>
                <div className="text-lab-cyan text-xs font-mono-lab">{scenario.charRole}</div>
                <div className="text-lab-text font-bold text-lg">{scenario.charName}</div>
              </div>

              {/* Hazmat team */}
              {hazmatVisible && (
                <div className={`absolute right-2 flex items-center gap-2 ${
                  hazmatAnim === "enter" ? "animate-hazmat-enter" :
                  hazmatAnim === "exit" ? "animate-hazmat-exit" : ""
                }`}>
                  <span className="text-3xl">🛡️</span>
                  <div className="text-center">
                    <div className="text-[10px] font-mono-lab text-lab-pink tracking-wider">HAZMAT</div>
                  </div>
                </div>
              )}
            </div>

            {/* Stamp overlay */}
            {stampText && (
              <div className="absolute top-3 right-3 animate-stamp z-10">
                <div className={`px-3 py-1.5 rounded-lg border-4 font-mono-lab font-black text-sm transform -rotate-12 ${
                  feedback?.isCorrect
                    ? "border-lab-green text-lab-green bg-lab-green/10"
                    : "border-lab-pink text-lab-pink bg-lab-pink/10"
                }`}>
                  {feedback?.isCorrect ? "CORRECT" : "WRONG"}
                </div>
              </div>
            )}
          </div>

          {/* Dialogue bubble */}
          <div className="card-lab p-4 border-lab-cyan/30">
            <div className="text-xs text-lab-cyan font-mono-lab mb-2">WORKER STATEMENT</div>
            <p className="text-lab-text leading-relaxed">
              「{scenario.dialogue}」
            </p>
          </div>

          {/* Feedback (shown after judgment) */}
          {feedback && phase === "feedback" && (
            <div className={`card-lab p-4 animate-slide-up ${
              feedback.isCorrect ? "border-lab-green/40" : "border-lab-pink/40"
            }`}>
              <p className={`font-black text-base mb-2 ${feedback.isCorrect ? "text-lab-green glow-green" : "text-lab-pink glow-pink"}`}>
                {feedback.isCorrect ? "✓ 正しい判定！" : "✗ 誤判定..."}
              </p>
              <p className="text-xs text-lab-muted font-mono-lab mb-1">
                {feedback.wasViolation ? "このケースは【違反】でした" : "このケースは【正常】でした"}
              </p>
              <p className="text-lab-text text-sm leading-relaxed">{feedback.explanation}</p>
            </div>
          )}
        </div>

        {/* RIGHT: Report + Reference Manual */}
        <div className="space-y-4">
          {/* Work report */}
          <div className="card-lab p-5">
            <div className="text-xs text-lab-amber font-mono-lab mb-3 flex items-center gap-2">
              <span>📋</span> WORK REPORT
            </div>
            <div className="space-y-2">
              {situationLines.map((line, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <span className="text-lab-muted font-mono-lab min-w-[4rem] text-xs pt-0.5">{line.key}:</span>
                  <span className="text-lab-text">{line.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reference manual */}
          <div className="card-lab p-5 border-lab-green/20">
            <div className="text-xs text-lab-green font-mono-lab mb-3 flex items-center gap-2">
              <span>📖</span> LAB MANUAL (参照用)
            </div>
            <div className="text-xs text-lab-muted font-mono-lab mb-2">今日の確認項目:</div>
            <ul className="space-y-1.5">
              {referenceLines.map((line, i) => (
                <li key={i} className="flex gap-2 text-sm text-lab-text">
                  <span className="text-lab-green mt-0.5">・</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6">
        {phase === "inspect" ? (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => submitJudgment("pass")}
              disabled={loading || isTransitioning}
              className="btn-approve disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 px-8 py-3 text-base"
            >
              <span className="text-xl">✓</span> 通過許可
            </button>
            <button
              onClick={() => submitJudgment("violate")}
              disabled={loading || isTransitioning}
              className="btn-danger disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 px-8 py-3 text-base"
            >
              <span className="text-xl">✗</span> 違反指摘
            </button>
          </div>
        ) : phase === "feedback" ? (
          <div className="flex justify-center">
            <button onClick={nextScenario} disabled={loading} className="btn-primary px-8 py-3">
              {loading ? "処理中..." :
                currentIndex + 1 < scenarios.length ? "次のケースへ" : "結果を見る"}
            </button>
          </div>
        ) : null}

        {phase === "inspect" && (
          <p className="text-center text-xs text-lab-muted mt-3">
            作業報告書とマニュアルを照合し、正しい手順なら通過、ルール違反なら指摘
          </p>
        )}
      </div>
    </div>
  );
}
