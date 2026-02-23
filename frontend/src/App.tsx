import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import QuizPage from "./pages/QuizPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/quiz" element={<QuizPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/quiz" replace />} />
      </Routes>
    </HashRouter>
  );
}
