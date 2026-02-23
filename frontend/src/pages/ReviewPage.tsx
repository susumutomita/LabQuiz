import { useState, useEffect } from "react";
import {
  getPendingScenarios,
  reviewScenario,
  getCategories,
  type PendingScenario,
  type Category,
} from "../lib/api";

export default function ReviewPage() {
  const [scenarios, setScenarios] = useState<PendingScenario[]>([]);
  const [_categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([getPendingScenarios(), getCategories()]);
      setScenarios(s);
      setCategories(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReview = async (scenario: PendingScenario, action: "approve" | "reject") => {
    try {
      await reviewScenario(scenario.id, action);
      setScenarios((prev) => prev.filter((s) => s.id !== scenario.id));
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
            SCENARIO REVIEW PANEL
          </p>
          <h2 className="text-2xl font-black text-lab-text">シナリオレビュー</h2>
          <p className="text-xs text-lab-muted mt-1">
            スプレッドシートで作成したシナリオの承認・却下
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

      {scenarios.length === 0 ? (
        <div className="card-lab p-12 text-center">
          <div className="text-4xl mb-4">🔬</div>
          <p className="text-lab-muted">レビュー待ちのシナリオはありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-mono-lab text-lab-muted">
            PENDING: {scenarios.length} items
          </p>
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="card-lab p-6 animate-slide-up">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs px-2 py-0.5 bg-lab-cyan/10 text-lab-cyan border border-lab-cyan/30 rounded font-mono-lab">
                  {scenario.category_name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono-lab ${
                  scenario.is_violation
                    ? "bg-lab-pink/10 text-lab-pink border border-lab-pink/30"
                    : "bg-lab-green/10 text-lab-green border border-lab-green/30"
                }`}>
                  {scenario.is_violation ? "VIOLATION" : "SAFE"}
                </span>
              </div>

              {/* Character info */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{scenario.char_avatar}</span>
                <div>
                  <div className="text-lab-cyan text-xs font-mono-lab">{scenario.char_role}</div>
                  <div className="text-lab-text font-bold">{scenario.char_name}</div>
                </div>
              </div>

              {/* Situation */}
              <div className="bg-lab-dark/50 rounded-lg p-3 mb-3 border border-lab-border/30">
                <p className="text-xs text-lab-amber font-mono-lab mb-1">SITUATION</p>
                <p className="text-sm text-lab-text">{scenario.situation}</p>
              </div>

              {/* Dialogue */}
              <div className="bg-lab-dark/50 rounded-lg p-3 mb-3 border border-lab-cyan/20">
                <p className="text-xs text-lab-cyan font-mono-lab mb-1">DIALOGUE</p>
                <p className="text-sm text-lab-text">「{scenario.dialogue}」</p>
              </div>

              {/* Reference */}
              <div className="bg-lab-dark/50 rounded-lg p-3 mb-3 border border-lab-green/20">
                <p className="text-xs text-lab-green font-mono-lab mb-1">REFERENCE</p>
                <p className="text-sm text-lab-text">{scenario.reference}</p>
              </div>

              {/* Explanation */}
              <div className="bg-lab-dark/50 rounded-lg p-3 mb-4 border border-lab-border/30">
                <p className="text-xs text-lab-muted font-mono-lab mb-1">EXPLANATION</p>
                <p className="text-sm text-lab-text">{scenario.explanation}</p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => handleReview(scenario, "reject")}
                  className="btn-danger text-sm"
                >
                  ✗ 却下
                </button>
                <button
                  onClick={() => handleReview(scenario, "approve")}
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
