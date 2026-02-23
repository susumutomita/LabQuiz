import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/quiz", label: "QUIZ", icon: "🧬", roles: ["learner", "creator", "reviewer", "admin"] },
    { path: "/review", label: "REVIEW", icon: "🔬", roles: ["reviewer", "admin"] },
    { path: "/dashboard", label: "DASHBOARD", icon: "📊", roles: ["admin"] },
  ];

  const roleLabel: Record<string, string> = {
    learner: "研修生",
    creator: "研究員",
    reviewer: "監査官",
    admin: "管理者",
  };

  return (
    <div className="min-h-screen bg-lab-darker">
      <nav className="border-b border-lab-border bg-lab-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-lab-green font-black text-lg glow-green">LAB QUIZ</span>
              </Link>
              <div className="flex gap-1">
                {navItems
                  .filter((item) => user && item.roles.includes(user.role))
                  .map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3 py-1.5 text-xs font-mono-lab tracking-wider rounded transition-all ${
                        location.pathname === item.path
                          ? "text-lab-green bg-lab-green/10 border border-lab-green/30"
                          : "text-lab-muted hover:text-lab-text hover:bg-white/5"
                      }`}
                    >
                      <span className="mr-1" aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-lab-text">{user?.name}</div>
                <div className="text-[10px] text-lab-cyan font-mono-lab">
                  {roleLabel[user?.role || ""] || user?.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
