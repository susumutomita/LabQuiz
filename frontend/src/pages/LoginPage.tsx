// LoginPage is no longer used - Google Workspace handles authentication.
// Kept as placeholder to avoid breaking any potential references.

import { Navigate } from "react-router-dom";

export default function LoginPage() {
  return <Navigate to="/quiz" replace />;
}
