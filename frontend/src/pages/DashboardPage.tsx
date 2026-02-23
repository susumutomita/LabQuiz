import { useState, useEffect } from "react";
import { getDashboardProgress, getUsers, updateUserRole, type UserProgress, type User } from "../lib/api";

export default function DashboardPage() {
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"progress" | "users">("progress");
  const [users, setUsers] = useState<User[]>([]);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, u] = await Promise.all([getDashboardProgress(), getUsers()]);
      setProgress(p);
      setUsers(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (email: string, newRole: string) => {
    try {
      await updateUserRole(email, newRole);
      setUsers(prev => prev.map(u =>
        u.email === email ? { ...u, role: newRole as User["role"] } : u
      ));
      setSuccessMsg("ロールを変更しました");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ロール変更に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-lab-muted font-mono-lab text-sm">
        LOADING DASHBOARD DATA...
      </div>
    );
  }

  const roleStyle: Record<string, string> = {
    admin: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    reviewer: "bg-lab-cyan/10 text-lab-cyan border-lab-cyan/30",
    creator: "bg-lab-green/10 text-lab-green border-lab-green/30",
    learner: "bg-lab-amber/10 text-lab-amber border-lab-amber/30",
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <p className="text-lab-green text-xs tracking-[0.3em] uppercase font-mono-lab">
          ADMIN CONTROL CENTER
        </p>
        <h2 className="text-2xl font-black text-lab-text">ダッシュボード</h2>
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

      {/* タブ */}
      <div className="flex gap-2 mb-6">
        {(["progress", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-mono-lab tracking-wider rounded-lg transition-all ${
              tab === t
                ? "text-lab-green bg-lab-green/10 border border-lab-green/30"
                : "text-lab-muted hover:text-lab-text bg-lab-dark border border-lab-border"
            }`}
          >
            {t === "progress" ? "📊 PROGRESS" : "👥 USERS"}
          </button>
        ))}
      </div>

      {/* 学習進捗タブ */}
      {tab === "progress" && (
        <div>
          {progress.length === 0 ? (
            <div className="card-lab p-12 text-center">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-lab-muted">学習者のデータがありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {progress.map((user) => (
                <div key={user.userId} className="card-lab p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xl">🧑‍🔬</span>
                    <div>
                      <div className="font-bold text-lab-text">{user.name}</div>
                      <div className="text-xs text-lab-muted font-mono-lab">{user.email}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {user.categories.map((cat) => (
                      <div
                        key={cat.categoryId}
                        className={`p-3 rounded-lg border ${
                          cat.isWarning
                            ? "border-lab-pink/40 bg-lab-pink/5"
                            : cat.totalAnswers === 0
                            ? "border-lab-border bg-lab-dark/50"
                            : "border-lab-green/30 bg-lab-green/5"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-lab-text">{cat.categoryName}</span>
                          <div className="flex gap-1">
                            {cat.hasBadge && <span title="バッジ取得済み">🏆</span>}
                            {cat.isWarning && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-lab-pink/20 text-lab-pink rounded font-mono-lab">
                                WARN
                              </span>
                            )}
                          </div>
                        </div>
                        {cat.totalAnswers > 0 ? (
                          <>
                            <div className={`text-2xl font-black ${cat.accuracy >= 70 ? "text-lab-green" : "text-lab-pink"}`}>
                              {cat.accuracy}%
                            </div>
                            <div className="text-[10px] text-lab-muted font-mono-lab">
                              {cat.sessionCount}回 / {cat.lastAnsweredAt ? new Date(cat.lastAnsweredAt).toLocaleDateString("ja-JP") : "-"}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-lab-muted/50 font-mono-lab">未受験</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ユーザー管理タブ */}
      {tab === "users" && (
        <div>
          <p className="text-xs text-lab-muted mb-4">
            ユーザーは Google Workspace ログイン時に自動登録されます。ロールはここで変更できます。
          </p>
          <div className="card-lab overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-lab-border">
                  <th className="px-4 py-3 text-left text-[10px] font-mono-lab text-lab-muted uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-[10px] font-mono-lab text-lab-muted uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-[10px] font-mono-lab text-lab-muted uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-[10px] font-mono-lab text-lab-muted uppercase">Since</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email} className="border-b border-lab-border/30 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-sm font-medium text-lab-text">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-lab-muted font-mono-lab">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.email, e.target.value)}
                        className={`px-2 py-0.5 text-[10px] rounded border font-mono-lab bg-transparent cursor-pointer ${roleStyle[u.role] || ""}`}
                      >
                        <option value="learner">learner</option>
                        <option value="creator">creator</option>
                        <option value="reviewer">reviewer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-lab-muted font-mono-lab">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("ja-JP") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
