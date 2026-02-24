import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getHistory, getScenarioStats, clearHistory } from "../lib/history";
import { getCategories } from "../lib/api";
import scenariosData from "@content/scenarios.json";

interface ScenarioData {
  id: string;
  category_id: string;
  char_name: string;
  char_avatar: string;
  situation: string;
}

const allScenarios = scenariosData as ScenarioData[];

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function rateColor(rate: number): string {
  if (rate === 100) return "text-lab-green";
  if (rate >= 50) return "text-lab-amber";
  return "text-lab-pink";
}

function rateBg(rate: number): string {
  if (rate === 100) return "bg-lab-green/10 border-lab-green/30";
  if (rate >= 50) return "bg-lab-amber/10 border-lab-amber/30";
  return "bg-lab-pink/10 border-lab-pink/30";
}

export default function HistoryPage() {
  const [tab, setTab] = useState<"scenarios" | "sessions">("scenarios");
  const [refreshKey, setRefreshKey] = useState(0);

  const history = useMemo(() => getHistory(), [refreshKey]);
  const stats = useMemo(() => getScenarioStats(), [refreshKey]);
  const categories = useMemo(() => getCategories(), []);
  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const scenarioRows = useMemo(() => {
    return allScenarios
      .filter((s) => stats.has(s.id))
      .map((s) => {
        const st = stats.get(s.id)!;
        const shortSituation = s.situation.split(" / ")[2]?.replace("行動: ", "") || s.situation.slice(0, 30);
        return {
          id: s.id,
          charName: s.char_name,
          charAvatar: s.char_avatar,
          situation: shortSituation,
          category: catMap.get(s.category_id) || "",
          ...st,
        };
      })
      .sort((a, b) => a.rate - b.rate);
  }, [stats, catMap]);

  const handleClear = () => {
    if (window.confirm("全ての回答履歴を削除しますか？")) {
      clearHistory();
      setRefreshKey((k) => k + 1);
    }
  };

  const isEmpty = history.length === 0;

  return (
    <div className="min-h-[calc(100vh-56px)] p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-lab-green text-xs tracking-[0.3em] uppercase font-mono-lab mb-1">
              AUDIT LOG
            </p>
            <h2 className="text-2xl font-black text-lab-text">回答履歴</h2>
          </div>
          <Link to="/quiz" className="text-sm text-lab-muted hover:text-lab-green transition-colors font-mono-lab">
            &larr; トップへ
          </Link>
        </div>

        {isEmpty ? (
          <div className="card-lab p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lab-muted mb-4">まだ回答履歴がありません</p>
            <Link to="/quiz" className="btn-primary inline-block">
              検問を始める
            </Link>
          </div>
        ) : (
          <>
            {/* Tab switcher */}
            <div className="flex gap-1 mb-4">
              <button
                onClick={() => setTab("scenarios")}
                className={`px-4 py-2 text-sm font-mono-lab rounded-t transition-colors ${
                  tab === "scenarios"
                    ? "bg-lab-dark text-lab-green border border-b-0 border-lab-border/50"
                    : "text-lab-muted hover:text-lab-text"
                }`}
              >
                シナリオ別
              </button>
              <button
                onClick={() => setTab("sessions")}
                className={`px-4 py-2 text-sm font-mono-lab rounded-t transition-colors ${
                  tab === "sessions"
                    ? "bg-lab-dark text-lab-green border border-b-0 border-lab-border/50"
                    : "text-lab-muted hover:text-lab-text"
                }`}
              >
                セッション履歴
              </button>
            </div>

            {/* Scenario stats table */}
            {tab === "scenarios" && (
              <div className="card-lab overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-lab-border/50 text-lab-muted font-mono-lab text-xs">
                      <th className="text-left p-3">キャラ</th>
                      <th className="text-left p-3 hidden sm:table-cell">行動</th>
                      <th className="text-center p-3">回数</th>
                      <th className="text-center p-3">正答率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioRows.map((row) => (
                      <tr key={row.id} className="border-b border-lab-border/20 hover:bg-lab-green/5 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{row.charAvatar}</span>
                            <div>
                              <div className="text-lab-text font-bold">{row.charName}</div>
                              <div className="text-lab-muted text-xs">{row.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-lab-muted hidden sm:table-cell">
                          {row.situation}
                        </td>
                        <td className="p-3 text-center text-lab-text font-mono-lab">{row.attempts}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded border text-xs font-bold font-mono-lab ${rateBg(row.rate)} ${rateColor(row.rate)}`}>
                            {row.rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {scenarioRows.length === 0 && (
                  <div className="p-8 text-center text-lab-muted text-sm">データなし</div>
                )}
              </div>
            )}

            {/* Session history */}
            {tab === "sessions" && (
              <div className="space-y-2">
                {[...history].reverse().map((session) => (
                  <div key={session.sessionId} className="card-lab p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black font-mono-lab" style={
                          session.rank === "S" ? { color: "var(--lab-amber)" } :
                          session.rank === "A" ? { color: "var(--lab-green)" } :
                          session.rank === "B" ? { color: "var(--lab-amber)" } :
                          { color: "var(--lab-pink)" }
                        }>
                          {session.rank || "-"}
                        </span>
                        <div>
                          <div className="text-lab-text font-bold text-sm">
                            {session.categoryId ? catMap.get(session.categoryId) || "カテゴリ" : "ランダム検問"}
                          </div>
                          <div className="text-lab-muted text-xs font-mono-lab">
                            {formatDate(session.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-black font-mono-lab ${
                          session.score >= 80 ? "text-lab-green" :
                          session.score >= 60 ? "text-lab-amber" :
                          "text-lab-pink"
                        }`}>
                          {session.score}%
                        </div>
                        <div className="text-lab-muted text-xs">
                          {session.answers.filter((a) => a.isCorrect).length}/{session.answers.length}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Clear button */}
            <div className="mt-6 text-center">
              <button
                onClick={handleClear}
                className="text-xs text-lab-muted hover:text-lab-pink transition-colors font-mono-lab border border-lab-border/30 hover:border-lab-pink/30 px-4 py-2 rounded"
              >
                履歴をクリア
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
