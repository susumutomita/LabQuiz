import { useState, useEffect, useRef, useCallback } from "react";
import { getCategories, getQuizzes, answerQuiz, completeSession, type Category, type Quiz, type SessionResult } from "../lib/api";
import { sound } from "../lib/sound";

type Phase = "select" | "quiz" | "feedback" | "arrest" | "result";

const CATEGORY_ICONS: Record<string, string> = {
  "細胞培養基本": "🧫",
  "ゾーニング": "🗺️",
  "試薬安全管理": "⚗️",
  "ラボルール": "📋",
  "報告ルート": "📡",
};

const MAX_MISS = 3;

// 新人研究員の名前（ランダム）
const ROOKIE_NAMES = ["田中", "鈴木", "高橋", "佐藤", "渡辺", "山田", "中村", "小林"];

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [categories, setCategories] = useState<Category[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctChoiceId: string;
    explanation: string;
  } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [rookieName, setRookieName] = useState("田中");

  // アニメーション状態
  const [charAnim, setCharAnim] = useState<"enter" | "idle" | "exit-ok" | "arrested" | "">("");
  const [hazmatVisible, setHazmatVisible] = useState(false);
  const [hazmatAnim, setHazmatAnim] = useState<"enter" | "exit" | "">("");
  const [stampText, setStampText] = useState<"SAFE" | "CONTAMINATED" | "">("");
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

  const startQuiz = async (cat: Category) => {
    setLoading(true);
    setError("");
    try {
      const data = await getQuizzes(cat.id);
      if (data.quizzes.length === 0) {
        setError(data.message || "このカテゴリにはまだ問題がありません");
        return;
      }
      setQuizzes(data.quizzes);
      setSessionId(data.sessionId);
      setSelectedCategory(cat);
      setCurrentIndex(0);
      setCorrectCount(0);
      setMissCount(0);
      setRookieName(ROOKIE_NAMES[Math.floor(Math.random() * ROOKIE_NAMES.length)]);
      setPhase("quiz");
      // キャラ登場アニメーション
      setCharAnim("enter");
      sound.play("enter");
      queueTimer(() => setCharAnim("idle"), 500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedChoice || isTransitioning) return;
    setIsTransitioning(true);
    setLoading(true);

    try {
      const quiz = quizzes[currentIndex];
      const result = await answerQuiz(quiz.id, selectedChoice, sessionId);

      // スタンプ音
      sound.play("stamp");

      if (result.isCorrect) {
        // === 正解演出 ===
        setStampText("SAFE");
        setFlashAnim("green");
        queueTimer(() => {
          sound.play("correct");
          setFeedback(result);
          setCorrectCount((c) => c + 1);
          setPhase("feedback");
          queueTimer(() => setFlashAnim(""), 500);
        }, 400);
      } else {
        // === 不正解 → 連行演出 ===
        setStampText("CONTAMINATED");
        setFlashAnim("red");
        const newMissCount = missCount + 1;
        setMissCount(newMissCount);

        queueTimer(() => {
          sound.play("alarm");
          // 防護服チーム登場
          setHazmatVisible(true);
          setHazmatAnim("enter");
        }, 400);

        queueTimer(() => {
          // キャラ連行 + 防護服チーム退場
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

  const nextQuestion = async () => {
    clearTimers();
    setStampText("");
    setIsTransitioning(false);

    // ミス上限 or 最終問題 → セッション完了
    if (missCount >= MAX_MISS || currentIndex + 1 >= quizzes.length) {
      setLoading(true);
      try {
        const result = await completeSession(sessionId);
        setSessionResult(result);
        setPhase("result");
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
      return;
    }

    // 次の問題
    setCurrentIndex((i) => i + 1);
    setSelectedChoice(null);
    setFeedback(null);
    setPhase("quiz");
    // キャラ再登場
    setCharAnim("enter");
    sound.play("enter");
    queueTimer(() => setCharAnim("idle"), 500);
  };

  const resetQuiz = () => {
    clearTimers();
    setPhase("select");
    setQuizzes([]);
    setSessionId("");
    setCurrentIndex(0);
    setSelectedChoice(null);
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

  // ========== カテゴリ選択画面 ==========
  if (phase === "select") {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
        <div className="card-lab max-w-lg w-full p-8 animate-slide-up text-center">
          <p className="text-lab-green text-xs tracking-[0.3em] uppercase font-mono-lab mb-2">
            SAFETY TRAINING MODULE
          </p>
          <h2 className="text-2xl font-black text-lab-text mb-2">研修カテゴリを選択</h2>
          <p className="text-lab-muted text-sm mb-6">
            あなたはラボの安全監査官。新人の知識をチェックせよ。
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
                onClick={() => startQuiz(cat)}
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

  // ========== ゲームオーバー連行画面 ==========
  if (phase === "arrest") {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
        <div className="card-lab max-w-lg w-full p-8 text-center animate-contamination-pulse">
          <div className="text-7xl mb-4 animate-slide-up">☣️</div>
          <h2 className="text-3xl font-black text-lab-pink glow-pink mb-2 animate-slide-up">
            QUARANTINE
          </h2>
          <p className="text-lab-muted mb-6 animate-fade-in">
            コンタミレベルが限界に達しました。<br />
            防護チームにより隔離区域へ連行されます。
          </p>

          {/* 連行シーン */}
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

          {/* フィードバック（最後の問題の解説） */}
          {feedback && (
            <div className="card-lab p-4 mb-6 text-left border-lab-pink/40 animate-slide-up">
              <p className="text-xs text-lab-muted font-mono-lab mb-1">LAST QUESTION FEEDBACK</p>
              <p className="text-sm text-lab-text">{feedback.explanation}</p>
            </div>
          )}

          <button onClick={nextQuestion} disabled={loading} className="btn-danger">
            {loading ? "処理中..." : "結果を見る"}
          </button>
        </div>
      </div>
    );
  }

  // ========== 結果画面 ==========
  if (phase === "result" && sessionResult) {
    const gameOver = missCount >= MAX_MISS;
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
        <div className="card-lab max-w-lg w-full p-8 animate-slide-up text-center">
          {gameOver ? (
            <>
              <div className="text-6xl mb-4">☣️</div>
              <h2 className="text-3xl font-black text-lab-pink glow-pink mb-2">CONTAMINATED</h2>
              <p className="text-lab-muted mb-4">隔離処理が完了しました...</p>
            </>
          ) : sessionResult.isPerfect ? (
            <>
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-black text-lab-amber mb-2" style={{textShadow: "0 0 20px rgba(251,191,36,0.4)"}}>
                PERFECT CLEAR
              </h2>
              {sessionResult.badgeEarned && (
                <p className="text-lab-amber text-sm mb-4">バッジを獲得しました！</p>
              )}
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">{sessionResult.score >= 70 ? "✅" : "⚠️"}</div>
              <h2 className={`text-3xl font-black mb-2 ${sessionResult.score >= 70 ? "text-lab-green glow-green" : "text-lab-amber"}`}>
                {sessionResult.score >= 70 ? "PASSED" : "NEEDS REVIEW"}
              </h2>
            </>
          )}

          <div className="card-lab p-6 mt-6 text-left">
            <div className="font-mono-lab text-xs text-lab-muted mb-3">
              {"═══ INSPECTION REPORT ═══"}
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
                <div className="text-lab-muted text-xs">正解数</div>
                <div className="text-lab-text">{sessionResult.correct} / {sessionResult.total}</div>
              </div>
              <div>
                <div className="text-lab-muted text-xs">コンタミレベル</div>
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

  // ========== クイズ出題 / フィードバック ==========
  const quiz = quizzes[currentIndex];
  if (!quiz) return null;

  return (
    <div className={`max-w-4xl mx-auto p-4 ${flashAnim === "red" ? "animate-flash-red" : flashAnim === "green" ? "animate-flash-green" : ""}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="font-mono-lab text-xs px-2 py-1 bg-lab-green/10 text-lab-green border border-lab-green/30 rounded">
            {selectedCategory?.name}
          </span>
          <span className="font-mono-lab text-xs text-lab-muted">
            問題 {currentIndex + 1}/{quizzes.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono-lab text-xs">
            <span className="text-lab-muted">スコア </span>
            <span className="text-lab-green font-bold">{correctCount}</span>
          </div>
          <div className="font-mono-lab text-xs">
            <span className="text-lab-muted">コンタミ </span>
            <span className={`font-bold ${missCount >= 2 ? "text-lab-pink" : "text-lab-amber"}`}>
              {missCount}/{MAX_MISS}
            </span>
          </div>
        </div>
      </div>

      {/* コンタミゲージ */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: MAX_MISS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i < missCount ? "bg-lab-pink shadow-[0_0_8px_rgba(255,62,142,0.5)]" : "bg-lab-border"
            }`}
          />
        ))}
      </div>

      <div className="card-lab p-6 relative overflow-hidden">
        {/* キャラクターステージ */}
        <div className="relative h-28 mb-6 flex items-center justify-center overflow-hidden">
          {/* 新人キャラクター */}
          <div className={`flex items-center gap-3 ${
            charAnim === "enter" ? "animate-char-enter" :
            charAnim === "idle" ? "animate-bobbing" :
            charAnim === "exit-ok" ? "animate-char-exit-ok" :
            charAnim === "arrested" ? "animate-char-arrested" : ""
          }`}>
            <div className="text-5xl">🧑‍🔬</div>
            <div>
              <div className="text-lab-cyan text-xs font-mono-lab">新人研究員</div>
              <div className="text-lab-text font-bold">{rookieName}</div>
            </div>
          </div>

          {/* 防護服チーム（連行時のみ表示） */}
          {hazmatVisible && (
            <div className={`absolute right-4 flex items-center gap-2 ${
              hazmatAnim === "enter" ? "animate-hazmat-enter" :
              hazmatAnim === "exit" ? "animate-hazmat-exit" : ""
            }`}>
              <span className="text-4xl">🛡️</span>
              <div className="text-center">
                <div className="text-[10px] font-mono-lab text-lab-pink tracking-wider">HAZMAT</div>
                <div className="text-[10px] font-mono-lab text-lab-pink">TEAM</div>
              </div>
            </div>
          )}
        </div>

        {/* スタンプ（SAFE / CONTAMINATED） */}
        {stampText && (
          <div className="absolute top-6 right-6 animate-stamp z-10">
            <div className={`px-4 py-2 rounded-lg border-4 font-mono-lab font-black text-lg transform -rotate-12 ${
              stampText === "SAFE"
                ? "border-lab-green text-lab-green bg-lab-green/10"
                : "border-lab-pink text-lab-pink bg-lab-pink/10"
            }`}>
              {stampText}
            </div>
          </div>
        )}

        {/* 質問 */}
        <div className="card-lab p-4 mb-6">
          <div className="text-xs text-lab-muted font-mono-lab mb-2">QUESTION</div>
          <p className="text-lab-text font-semibold leading-relaxed">{quiz.question}</p>
        </div>

        {/* 2択ボタン */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {quiz.choices.map((choice) => {
            let cls = "p-5 rounded-xl border-2 transition-all font-bold text-center text-base leading-relaxed ";

            if (feedback) {
              if (choice.id === feedback.correctChoiceId) {
                cls += "border-lab-green bg-lab-green/15 text-lab-green shadow-[0_0_20px_rgba(0,255,136,0.2)]";
              } else if (choice.id === selectedChoice && !feedback.isCorrect) {
                cls += "border-lab-pink bg-lab-pink/15 text-lab-pink shadow-[0_0_20px_rgba(255,62,142,0.2)]";
              } else {
                cls += "border-lab-border/30 text-lab-muted/50";
              }
            } else if (choice.id === selectedChoice) {
              cls += "border-lab-cyan bg-lab-cyan/15 text-lab-cyan shadow-[0_0_15px_rgba(34,211,238,0.2)]";
            } else {
              cls += "border-lab-border hover:border-lab-cyan/50 text-lab-text hover:bg-white/[0.03] hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] cursor-pointer";
            }

            return (
              <button
                key={choice.id}
                onClick={() => !feedback && !isTransitioning && setSelectedChoice(choice.id)}
                disabled={!!feedback || isTransitioning}
                className={cls}
              >
                {choice.text}
                {feedback && choice.id === feedback.correctChoiceId && (
                  <span className="block text-lab-green text-2xl mt-1">&#10004;</span>
                )}
                {feedback && choice.id === selectedChoice && !feedback.isCorrect && (
                  <span className="block text-lab-pink text-2xl mt-1">&#10008;</span>
                )}
              </button>
            );
          })}
        </div>

        {/* フィードバック */}
        {feedback && phase === "feedback" && (
          <div className={`card-lab p-4 mb-6 animate-slide-up ${
            feedback.isCorrect ? "border-lab-green/40" : "border-lab-pink/40"
          }`}>
            <p className={`font-black text-lg mb-2 ${feedback.isCorrect ? "text-lab-green glow-green" : "text-lab-pink glow-pink"}`}>
              {feedback.isCorrect ? "✓ 正解！" : "✗ 不正解"}
            </p>
            <p className="text-lab-text text-sm leading-relaxed">{feedback.explanation}</p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex justify-center gap-4">
          {phase === "quiz" ? (
            <button
              onClick={submitAnswer}
              disabled={!selectedChoice || loading || isTransitioning}
              className="btn-approve disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? "判定中..." : "回答する"}
            </button>
          ) : phase === "feedback" ? (
            <button onClick={nextQuestion} disabled={loading} className="btn-primary">
              {loading ? "処理中..." :
                currentIndex + 1 < quizzes.length ? "次の問題へ" : "結果を見る"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
