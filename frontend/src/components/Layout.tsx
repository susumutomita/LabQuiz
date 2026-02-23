import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-lab-darker">
      <nav className="border-b border-lab-border bg-lab-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center h-14">
            <span className="text-lab-green font-black text-lg glow-green">LAB CHECKPOINT</span>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
