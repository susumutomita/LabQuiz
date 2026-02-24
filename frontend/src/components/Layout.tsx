import { Outlet, Link, useLocation } from "react-router-dom";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-lab-darker">
      <nav className="border-b border-lab-border bg-lab-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/quiz" className="text-lab-green font-black text-lg glow-green hover:opacity-80 transition-opacity">
              LAB CHECKPOINT
            </Link>
            <div className="flex items-center gap-4 text-sm font-mono-lab">
              <Link
                to="/quiz"
                className={`transition-colors ${location.pathname === "/quiz" ? "text-lab-green" : "text-lab-muted hover:text-lab-text"}`}
              >
                検問
              </Link>
              <Link
                to="/history"
                className={`transition-colors ${location.pathname === "/history" ? "text-lab-green" : "text-lab-muted hover:text-lab-text"}`}
              >
                履歴
              </Link>
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
