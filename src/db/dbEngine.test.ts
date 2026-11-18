import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseEngine, CANONICAL_QUERIES } from './dbEngine.ts';
import { SCHEMA_SQL, SEED_SQL } from './sqlScripts.ts';

test('schema.sql and seed.sql match runtime SQL DDL/DML scripts exactly', () => {
  const diskSchema = fs.readFileSync(path.resolve('src/db/schema.sql'), 'utf8');
  const diskSeed = fs.readFileSync(path.resolve('src/db/seed.sql'), 'utf8');
  assert.equal(diskSchema, SCHEMA_SQL);
  assert.equal(diskSeed, SEED_SQL);
});

test('DatabaseEngine initializes all 15 tables via SQL DDL and executes AlaSQL queries', () => {
  const engine = new DatabaseEngine();
  const state = engine.getState();

  assert.equal(state.users.length >= 6, true);
  assert.equal(state.items.length >= 10, true);
  assert.equal(state.listings.length >= 10, true);
  assert.equal(state.categories.length >= 6, true);

  // Execute canonical Query 1 (Textbooks under 500)
  const query1 = CANONICAL_QUERIES.find((q) => q.id === 'textbooks_under_price');
  assert.ok(query1);

  const res1 = engine.executeSQL(query1.sql);
  assert.equal(res1.error, undefined);
  assert.equal(Array.isArray(res1.data), true);
  assert.equal(res1.data.length > 0, true);
  assert.ok(res1.data[0].item_name);
  assert.ok(res1.data[0].seller_name);
});

test('DatabaseEngine executes joins across Loans, Transactions, and Users', () => {
  const engine = new DatabaseEngine();
  const query2 = CANONICAL_QUERIES.find((q) => q.id === 'overdue_loans');
  assert.ok(query2);

  const res2 = engine.executeSQL(query2.sql);
  assert.equal(res2.error, undefined);
  assert.equal(Array.isArray(res2.data), true);
});

test('DatabaseEngine creates a listing and executes request->loan->return via SQL DML', () => {
  const engine = new DatabaseEngine();
  const beforeCount = engine.getState().listings.length;

  const result = engine.createListing({
    ownerId: 1,
    categoryId: 2,
    itemName: 'Test Drafter Pro',
    description: 'Unit test item description',
    itemCondition: 'like_new',
    listingType: 'lend',
    price: 90,
    depositAmount: 400,
  });

  assert.ok(result.listing.listing_id);
  assert.equal(engine.getState().listings.length, beforeCount + 1);

  // Execute SQL to find this newly created item
  const query = `SELECT * FROM Listings WHERE listing_id = ${result.listing.listing_id}`;
  const sqlRes = engine.executeSQL(query);
  assert.equal(sqlRes.error, undefined);
  assert.equal(sqlRes.data.length, 1);
  assert.equal(sqlRes.data[0].price, 90);

  // Create request -> accept -> return borrowed item -> check deposit + refund rows in Payments
  const req = engine.createRequest({
    listingId: result.listing.listing_id,
    requesterId: 2,
    requestMessage: 'Borrowing for mid-sems',
  });
  const accepted = engine.acceptRequest(req.request_id);
  assert.ok(accepted.loan);
  engine.returnBorrowedItem(accepted.transaction.transaction_id, 'Perfect');

  const paymentsRes = engine.executeSQL(
    `SELECT payment_type, amount FROM Payments WHERE transaction_id = ${accepted.transaction.transaction_id} ORDER BY payment_id ASC`
  );
  assert.equal(paymentsRes.data.length, 2);
  assert.equal(paymentsRes.data[0].payment_type, 'deposit');
  assert.equal(paymentsRes.data[1].payment_type, 'refund');
});

test('All 15 relational tables are queryable via SQL and SchemaDiagram metadata is consistent', async () => {
  const { ALL_TABLES, RELATIONSHIPS } = await import('../components/SchemaDiagram.tsx');
  assert.equal(ALL_TABLES.length, 15);

  const tableNames = new Set(ALL_TABLES.map((t) => t.name));
  assert.equal(tableNames.size, 15);

  for (const rel of RELATIONSHIPS) {
    assert.ok(tableNames.has(rel.from), `Unknown relationship source table: ${rel.from}`);
    assert.ok(tableNames.has(rel.to), `Unknown relationship target table: ${rel.to}`);
  }

  const engine = new DatabaseEngine();
  for (const table of ALL_TABLES) {
    const res = engine.executeSQL(`SELECT * FROM ${table.name};`);
    assert.equal(res.error, undefined, `Query failed on table ${table.name}: ${res.error}`);
    assert.equal(Array.isArray(res.data), true);
  }
});

test('DatabaseEngine supports createReport and toggleSavedListing via SQL DML', () => {
  const engine = new DatabaseEngine();
  const initialReports = engine.getState().reports.length;
  engine.createReport({
    reporterId: 2,
    reportedUserId: 1,
    listingId: 1,
    reportReason: 'misleading_condition',
    description: 'Test SQL report insert',
  });
  assert.equal(engine.getState().reports.length, initialReports + 1);

  const savedBefore = engine.getState().savedListings.some(
    (s) => s.user_id === 2 && s.listing_id === 3
  );
  engine.toggleSavedListing(2, 3);
  const savedAfter = engine.getState().savedListings.some(
    (s) => s.user_id === 2 && s.listing_id === 3
  );
  assert.equal(savedAfter, !savedBefore);

  engine.toggleSavedListing(2, 3);
  const savedRestored = engine.getState().savedListings.some(
    (s) => s.user_id === 2 && s.listing_id === 3
  );
  assert.equal(savedRestored, savedBefore);
});
