import { User } from '../types/schema.ts';

/**
 * Determines whether a user is authorized to access privileged operator tools
 * (Admin Console & SQL Studio).
 * Restricted strictly to admin-role accounts and Aryan Kumar Singh.
 */
function isPrivilegedOperator(
  user: Pick<User, 'account_role' | 'name'> | null | undefined
): boolean {
  if (!user) return false;
  if (user.account_role === 'admin') return true;
  return user.name.trim().toLowerCase() === 'aryan kumar singh';
}

export function canAccessAdminConsole(
  user: Pick<User, 'account_role' | 'name'> | null | undefined
): boolean {
  return isPrivilegedOperator(user);
}

export function canAccessSqlStudio(
  user: Pick<User, 'account_role' | 'name'> | null | undefined
): boolean {
  return isPrivilegedOperator(user);
}
