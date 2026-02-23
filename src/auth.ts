import { getSheetData, appendRow } from './sheets';

export function getCurrentUser(): User {
  const email = Session.getActiveUser().getEmail();
  if (!email) throw new Error('Not authenticated');

  const users = getSheetData('users');
  const existing = users.find(u => u.email === email);

  if (existing) {
    return {
      email: existing.email,
      name: existing.name,
      role: existing.role,
      created_at: existing.created_at,
    };
  }

  // Auto-register new user with default role
  const newUser: Record<string, string> = {
    email,
    name: email.split('@')[0],
    role: 'learner',
    created_at: new Date().toISOString(),
  };
  appendRow('users', newUser);

  return {
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    created_at: newUser.created_at,
  };
}

export function requireRole(user: User, ...roles: string[]): void {
  if (!roles.includes(user.role)) {
    throw new Error('権限がありません');
  }
}
