const STORAGE_KEY = "labquiz_history";

export interface AnswerRecord {
  scenarioId: string;
  judgment: "pass" | "violate";
  isCorrect: boolean;
  timestamp: number;
}

export interface SessionRecord {
  sessionId: string;
  categoryId: string | null;
  answers: AnswerRecord[];
  score: number;
  rank: string;
  timestamp: number;
}

export interface ScenarioStats {
  attempts: number;
  correct: number;
  rate: number;
}

function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: SessionRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function saveAnswer(
  sessionId: string,
  categoryId: string | null,
  scenarioId: string,
  judgment: "pass" | "violate",
  isCorrect: boolean,
): void {
  const sessions = loadSessions();
  let session = sessions.find((s) => s.sessionId === sessionId);
  if (!session) {
    session = {
      sessionId,
      categoryId,
      answers: [],
      score: 0,
      rank: "",
      timestamp: Date.now(),
    };
    sessions.push(session);
  }
  session.answers.push({
    scenarioId,
    judgment,
    isCorrect,
    timestamp: Date.now(),
  });
  saveSessions(sessions);
}

export function finalizeSession(
  sessionId: string,
  score: number,
  rank: string,
): void {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.sessionId === sessionId);
  if (session) {
    session.score = score;
    session.rank = rank;
    saveSessions(sessions);
  }
}

export function getHistory(): SessionRecord[] {
  return loadSessions();
}

export function getScenarioStats(): Map<string, ScenarioStats> {
  const sessions = loadSessions();
  const map = new Map<string, ScenarioStats>();
  for (const session of sessions) {
    for (const answer of session.answers) {
      const existing = map.get(answer.scenarioId) || {
        attempts: 0,
        correct: 0,
        rate: 0,
      };
      existing.attempts += 1;
      if (answer.isCorrect) existing.correct += 1;
      existing.rate =
        existing.attempts > 0
          ? Math.round((existing.correct / existing.attempts) * 100)
          : 0;
      map.set(answer.scenarioId, existing);
    }
  }
  return map;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
