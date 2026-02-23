import { getSheetData, findRowIndex, updateCell } from '../sheets';
import { getCurrentUser, requireRole } from '../auth';

export function handleGetUsers(): User[] {
  const user = getCurrentUser();
  requireRole(user, 'admin');

  const rows = getSheetData('users');
  return rows.map(r => ({
    email: r.email,
    name: r.name,
    role: r.role,
    created_at: r.created_at,
  }));
}

export function handleUpdateUserRole(params: { email: string; role: string }): User {
  const user = getCurrentUser();
  requireRole(user, 'admin');

  const validRoles = ['learner', 'creator', 'reviewer', 'admin'];
  if (!validRoles.includes(params.role)) {
    throw new Error('Invalid role');
  }

  const rowIndex = findRowIndex('users', 'email', params.email);
  if (rowIndex === -1) throw new Error('User not found');

  updateCell('users', rowIndex, 'role', params.role);

  const users = getSheetData('users');
  const updated = users.find(u => u.email === params.email)!;
  return {
    email: updated.email,
    name: updated.name,
    role: updated.role,
    created_at: updated.created_at,
  };
}
