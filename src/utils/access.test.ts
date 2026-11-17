import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessAdminConsole, canAccessSqlStudio } from './access.ts';
import { INITIAL_USERS } from '../db/seedData.ts';

test('canAccessAdminConsole and canAccessSqlStudio allow admin role and Aryan Kumar Singh only', () => {
  for (const user of INITIAL_USERS) {
    const allowedAdmin = canAccessAdminConsole(user);
    const allowedSql = canAccessSqlStudio(user);
    if (user.account_role === 'admin' || user.name === 'Aryan Kumar Singh') {
      assert.equal(allowedAdmin, true, `Expected ${user.name} (${user.account_role}) to have Admin Console access`);
      assert.equal(allowedSql, true, `Expected ${user.name} (${user.account_role}) to have SQL Studio access`);
    } else {
      assert.equal(allowedAdmin, false, `Expected ${user.name} (${user.account_role}) NOT to have Admin Console access`);
      assert.equal(allowedSql, false, `Expected ${user.name} (${user.account_role}) NOT to have SQL Studio access`);
    }
  }
});

test('access helpers handle null/undefined and case-insensitive name matching', () => {
  assert.equal(canAccessAdminConsole(null), false);
  assert.equal(canAccessSqlStudio(null), false);
  assert.equal(canAccessAdminConsole(undefined), false);
  assert.equal(canAccessSqlStudio(undefined), false);
  assert.equal(
    canAccessAdminConsole({ account_role: 'student', name: '  aryan kumar singh  ' }),
    true
  );
  assert.equal(
    canAccessSqlStudio({ account_role: 'student', name: '  aryan kumar singh  ' }),
    true
  );
  assert.equal(
    canAccessSqlStudio({ account_role: 'student', name: 'Aryan Sharma' }),
    false
  );
  assert.equal(
    canAccessSqlStudio({ account_role: 'admin', name: 'Faculty Proctor' }),
    true
  );
});
