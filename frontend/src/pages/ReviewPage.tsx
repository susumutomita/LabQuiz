import { useState, useEffect } from "react";
import {
  getPendingQuizzes,
  reviewQuiz,
  getCategories,
  type PendingQuiz,
  type Category,
} from "../lib/api";

export default function ReviewPage() {
  const [quizzes, setQuizzes] = useState<PendingQuiz[]>([]);
  const [_categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [q, c] = await Promise.all([getPendingQuizzes(), getCategories()]);
      setQuizzes(q);
      setCategories(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReview = async (quiz: PendingQuiz, action: "approve" | "reject") => {
    try {
      await reviewQuiz(quiz.id, action, quiz.updated_at);
      setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
      setSuccessMsg(action === "approve" ? "承認しました" : "却下しました");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-lab-muted font-mono-lab text-sm">
        LOADING REVIEW QUEUE...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-lab-green text-xs tracking-[0.3em] uppercase font-mono-lab">
            EXPERT REVIEW PANEL
          </p>
          <h2 className="text-2xl font-black text-lab-text">クイズレビュー</h2>
          <p className="text-xs text-lab-muted mt-1">
            スプレッドシートで作成したクイズの承認・却下
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-lab-pink/10 border border-lab-pink/30 text-lab-pink px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">閉じる</button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 bg-lab-green/10 border border-lab-green/30 text-lab-green px-4 py-3 rounded-lg text-sm animate-slide-up">
          {successMsg}
        </div>
      )}

      {/* レビュー待ちクイズ一覧 */}
      {quizzes.length === 0 ? (
        <div className="card-lab p-12 text-center">
          <div className="text-4xl mb-4">🔬</div>
          <p className="text-lab-muted">レビュー待ちの問題はありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-mono-lab text-lab-muted">
            PENDING: {quizzes.length} items
          </p>
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="card-lab p-6 animate-slide-up">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs px-2 py-0.5 bg-lab-cyan/10 text-lab-cyan border border-lab-cyan/30 rounded font-mono-lab">
                  {quiz.category_name}
                </span>
              </div>

              <h4 className="font-bold text-lab-text mb-4">{quiz.question}</h4>

              <div className="space-y-2 mb-4">
                {quiz.choices.map((choice) => (
                  <div
                    key={choice.id}
                    className={`px-3 py-2 rounded text-sm ${
                      choice.id === quiz.correct_choice_id
                        ? "bg-lab-green/10 border border-lab-green/30 text-lab-green"
                        : "bg-lab-dark/50 border border-lab-border/50 text-lab-text"
                    }`}
                  >
                    <span className="font-mono-lab text-xs mr-1">{choice.id.toUpperCase()}.</span>
                    {choice.text}
                    {choice.id === quiz.correct_choice_id && (
                      <span className="ml-2 text-lab-green font-mono-lab text-xs">[正答]</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-lab-dark/50 rounded-lg p-3 mb-4 border border-lab-border/30">
                <p className="text-xs text-lab-muted font-mono-lab mb-1">EXPLANATION</p>
                <p className="text-sm text-lab-text">{quiz.explanation}</p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => handleReview(quiz, "reject")}
                  className="btn-danger text-sm"
                >
                  ✗ 却下
                </button>
                <button
                  onClick={() => handleReview(quiz, "approve")}
                  className="btn-approve text-sm"
                >
                  ✓ 承認
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
