// ReUseNSUT Relational Database Engine
// Creates all 15 normalized tables via SQL DDL (schema.sql), seeds via SQL DML (seed.sql),
// and executes live SQL INSERT / UPDATE / DELETE / SELECT queries via AlaSQL.

import alasql from 'alasql';
import {
  User,
  Category,
  Item,
  ItemImage,
  Listing,
  ListingRequest,
  Transaction,
  Loan,
  Payment,
  Review,
  Dispute,
  SavedListing,
  Report,
  ReportAction,
  Message,
  EnrichedListing,
} from '../types/schema.ts';
import { SCHEMA_SQL, SEED_SQL } from './sqlScripts.ts';

const STORAGE_KEY = 'reusensut_db_v6_sql';

export interface DatabaseState {
  users: User[];
  categories: Category[];
  items: Item[];
  itemImages: ItemImage[];
  listings: Listing[];
  listingRequests: ListingRequest[];
  transactions: Transaction[];
  loans: Loan[];
  payments: Payment[];
  reviews: Review[];
  disputes: Dispute[];
  savedListings: SavedListing[];
  reports: Report[];
  reportActions: ReportAction[];
  messages: Message[];
}

export interface PredefinedQuery {
  id: string;
  title: string;
  description: string;
  sql: string;
  sourceDocNote: string;
}

export const CANONICAL_QUERIES: PredefinedQuery[] = [
  {
    id: 'textbooks_under_price',
    title: 'Available Textbooks under ₹500',
    description: 'Finds all active textbook listings under ₹500 along with seller details.',
    sourceDocNote: 'Identifies active semester course textbooks priced under ₹500',
    sql: `SELECT 
  i.item_name, 
  i.item_condition, 
  l.price, 
  l.listing_type, 
  u.name AS seller_name, 
  u.roll_number,
  u.branch
FROM Listings l
JOIN Items i ON l.item_id = i.item_id
JOIN Categories c ON i.category_id = c.category_id
JOIN Users u ON i.owner_id = u.user_id
WHERE c.category_name LIKE '%Textbook%'
  AND l.listing_status = 'active'
  AND l.price <= 500
ORDER BY l.price ASC;`,
  },
  {
    id: 'overdue_loans',
    title: 'Active & Overdue Borrowed Items',
    description: 'Tracks items currently borrowed or overdue with borrower name and security deposit.',
    sourceDocNote: 'Monitors ongoing borrowings and flags overdue loans with deposits',
    sql: `SELECT 
  i.item_name, 
  u.name AS borrower_name, 
  u.phone AS borrower_contact,
  ln.due_date, 
  ln.loan_status, 
  l.deposit_amount,
  t.agreed_amount AS fee_paid
FROM Loans ln
JOIN Transactions t ON ln.transaction_id = t.transaction_id
JOIN Listing_Requests lr ON t.request_id = lr.request_id
JOIN Listings l ON lr.listing_id = l.listing_id
JOIN Items i ON l.item_id = i.item_id
JOIN Users u ON lr.requester_id = u.user_id
WHERE ln.loan_status = 'active' OR ln.loan_status = 'returned';`,
  },
  {
    id: 'highest_trust_scores',
    title: 'Students with Highest Trust & Reviews',
    description: 'Calculates student peer rating average and review count across completed campus transactions.',
    sourceDocNote: 'Ranks students by completed transaction reviews and trust ratings',
    sql: `SELECT 
  u.user_id,
  u.name, 
  u.roll_number, 
  u.branch, 
  COUNT(r.review_id) AS total_reviews,
  ROUND(AVG(r.rating), 2) AS avg_rating
FROM Users u
JOIN Reviews r ON u.user_id = r.reviewee_id
GROUP BY u.user_id, u.name, u.roll_number, u.branch
ORDER BY avg_rating DESC, total_reviews DESC;`,
  },
  {
    id: 'total_money_saved',
    title: 'Total Money Saved by Students Through Reuse',
    description: 'Aggregates savings from completed sales, lending, and free donations compared to retail pricing.',
    sourceDocNote: 'Aggregates student savings across circular reuse transactions',
    sql: `SELECT 
  l.listing_type,
  COUNT(t.transaction_id) AS completed_exchanges,
  SUM(t.agreed_amount) AS total_spent_on_platform,
  SUM(CASE 
    WHEN l.listing_type = 'donation' THEN 800 
    WHEN l.listing_type = 'lend' THEN 650 
    WHEN l.listing_type = 'sale' THEN 500 
    ELSE 400 
  END) AS estimated_retail_mrp,
  SUM(CASE 
    WHEN l.listing_type = 'donation' THEN 800 
    WHEN l.listing_type = 'lend' THEN 650 - t.agreed_amount 
    WHEN l.listing_type = 'sale' THEN 500 - t.agreed_amount 
    ELSE 400 
  END) AS net_student_money_saved
FROM Transactions t
JOIN Listing_Requests lr ON t.request_id = lr.request_id
JOIN Listings l ON lr.listing_id = l.listing_id
WHERE t.transaction_status = 'completed'
GROUP BY l.listing_type;`,
  },
  {
    id: 'category_breakdown',
    title: 'Inventory by Category & Condition',
    description: 'Breakdown of campus assets currently in circulation by department category.',
    sourceDocNote: 'Schema distribution analysis across Categories, Items, and Listings',
    sql: `SELECT 
  c.category_name, 
  COUNT(i.item_id) AS total_items, 
  SUM(CASE WHEN l.listing_type = 'sale' THEN 1 ELSE 0 END) AS for_sale,
  SUM(CASE WHEN l.listing_type = 'lend' THEN 1 ELSE 0 END) AS for_lend,
  SUM(CASE WHEN l.listing_type = 'donation' THEN 1 ELSE 0 END) AS donations,
  SUM(CASE WHEN l.listing_type = 'exchange' THEN 1 ELSE 0 END) AS exchanges
FROM Categories c
LEFT JOIN Items i ON c.category_id = i.category_id
LEFT JOIN Listings l ON i.item_id = l.item_id
GROUP BY c.category_name
ORDER BY total_items DESC;`,
  },
  {
    id: 'unresolved_disputes',
    title: 'Open Disputes & Admin Escalations',
    description: 'Lists complaints requiring faculty or proctor intervention.',
    sourceDocNote: 'Proctor complaint review and escalation log',
    sql: `SELECT 
  d.dispute_id,
  d.dispute_reason,
  d.description,
  d.resolution_status,
  u.name AS raised_by_name,
  u.roll_number,
  d.raised_at
FROM Disputes d
JOIN Users u ON d.raised_by = u.user_id;`,
  },
  {
    id: 'security_deposits_ledger',
    title: 'Security Deposit & Payment Audit Trail',
    description: 'Tracks UPI & cash payments for security deposits and refunds.',
    sourceDocNote: 'Campus security deposit and payment ledger audit',
    sql: `SELECT 
  p.payment_id,
  p.payment_type,
  p.amount,
  p.payment_method,
  p.payment_status,
  u.name AS payer_name,
  p.paid_at
FROM Payments p
JOIN Users u ON p.payer_id = u.user_id
ORDER BY p.payment_id DESC;`,
  },
];

let dbInstanceCounter = 0;

function normalizeRow<T extends Record<string, any>>(row: Record<string, any>): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined || (typeof v === 'number' && Number.isNaN(v))) {
      out[k] = null;
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export class DatabaseEngine {
  private sqlDb: any;
  private state!: DatabaseState;
  private listeners: (() => void)[] = [];

  constructor() {
    dbInstanceCounter += 1;
    this.sqlDb = new (alasql as any).Database(`reusensut_db_${dbInstanceCounter}`);
    this.initializeFromSQL();
  }

  private initializeFromSQL() {
    // 1. Create all 15 relational tables using SQL DDL (CREATE TABLE ...)
    this.sqlDb.exec(SCHEMA_SQL);

    // 2. Restore persisted rows if present in localStorage; otherwise execute SEED_SQL
    let restored = false;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DatabaseState;
        this.hydrateTablesFromSnapshot(parsed);
        restored = true;
      }
    } catch {
      // Fall back to fresh SQL seed if localStorage is unavailable or corrupt
    }

    if (!restored) {
      this.sqlDb.exec(SEED_SQL);
    }

    this.state = this.readAllTablesFromSQL();
  }

  private insertRow(tableName: string, row: Record<string, any>) {
    const entries = Object.entries(row).filter(
      ([, v]) => v !== null && v !== undefined
    );
    const cols = entries.map(([k]) => k).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map(([, v]) => v);
    this.sqlDb.exec(
      `INSERT INTO ${tableName} (${cols}) VALUES (${placeholders})`,
      values
    );
  }

  private hydrateTablesFromSnapshot(snapshot: DatabaseState) {
    // Insert in foreign-key dependency order
    for (const row of snapshot.users || []) this.insertRow('Users', row);
    for (const row of snapshot.categories || []) this.insertRow('Categories', row);
    for (const row of snapshot.items || []) this.insertRow('Items', row);
    for (const row of snapshot.itemImages || []) this.insertRow('Item_Images', row);
    for (const row of snapshot.listings || []) this.insertRow('Listings', row);
    for (const row of snapshot.listingRequests || []) this.insertRow('Listing_Requests', row);
    for (const row of snapshot.transactions || []) this.insertRow('Transactions', row);
    for (const row of snapshot.loans || []) this.insertRow('Loans', row);
    for (const row of snapshot.payments || []) this.insertRow('Payments', row);
    for (const row of snapshot.reviews || []) this.insertRow('Reviews', row);
    for (const row of snapshot.disputes || []) this.insertRow('Disputes', row);
    for (const row of snapshot.savedListings || []) this.insertRow('Saved_Listings', row);
    for (const row of snapshot.reports || []) this.insertRow('Reports', row);
    for (const row of snapshot.reportActions || []) this.insertRow('Report_Actions', row);
    for (const row of snapshot.messages || []) this.insertRow('Messages', row);
  }

  private queryTable<T extends Record<string, any>>(sql: string): T[] {
    const rows = this.sqlDb.exec(sql);
    if (!Array.isArray(rows)) return [];
    return rows.map((r: Record<string, any>) => normalizeRow<T>(r));
  }

  private readAllTablesFromSQL(): DatabaseState {
    return {
      users: this.queryTable<User>('SELECT * FROM Users ORDER BY user_id ASC'),
      categories: this.queryTable<Category>('SELECT * FROM Categories ORDER BY category_id ASC'),
      items: this.queryTable<Item>('SELECT * FROM Items ORDER BY item_id DESC'),
      itemImages: this.queryTable<ItemImage>('SELECT * FROM Item_Images ORDER BY image_id DESC'),
      listings: this.queryTable<Listing>('SELECT * FROM Listings ORDER BY listing_id ASC'),
      listingRequests: this.queryTable<ListingRequest>('SELECT * FROM Listing_Requests ORDER BY request_id DESC'),
      transactions: this.queryTable<Transaction>('SELECT * FROM Transactions ORDER BY transaction_id DESC'),
      loans: this.queryTable<Loan>('SELECT * FROM Loans ORDER BY transaction_id DESC'),
      payments: this.queryTable<Payment>('SELECT * FROM Payments ORDER BY payment_id DESC'),
      reviews: this.queryTable<Review>('SELECT * FROM Reviews ORDER BY review_id DESC'),
      disputes: this.queryTable<Dispute>('SELECT * FROM Disputes ORDER BY dispute_id DESC'),
      savedListings: this.queryTable<SavedListing>('SELECT * FROM Saved_Listings ORDER BY saved_at ASC'),
      reports: this.queryTable<Report>('SELECT * FROM Reports ORDER BY report_id DESC'),
      reportActions: this.queryTable<ReportAction>('SELECT * FROM Report_Actions ORDER BY report_action_id DESC'),
      messages: this.queryTable<Message>('SELECT * FROM Messages ORDER BY message_id ASC'),
    };
  }

  private syncAndPersist() {
    this.state = this.readAllTablesFromSQL();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore write errors in non-browser/private contexts
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public getSchemaSQL(): string {
    return SCHEMA_SQL;
  }

  public getSeedSQL(): string {
    return SEED_SQL;
  }

  public resetToDefault() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage removal errors
    }
    this.sqlDb.exec(SCHEMA_SQL);
    this.sqlDb.exec(SEED_SQL);
    this.syncAndPersist();
  }

  /**
   * Execute an arbitrary SQL query directly against the 15 SQL-created tables
   */
  public executeSQL(sqlQuery: string): { data: any[]; executionTimeMs: number; error?: string } {
    const startTime = performance.now();
    try {
      const cleanSql = sqlQuery.trim();
      const result = this.sqlDb.exec(cleanSql);
      const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

      // If user executed DML/DDL in SQL Studio, refresh reactive state & persistence
      if (!/^(SELECT|SHOW)\b/i.test(cleanSql)) {
        this.syncAndPersist();
      }

      const formatted = Array.isArray(result)
        ? result.map((r: any) => (r && typeof r === 'object' ? normalizeRow(r) : r))
        : [result];

      return {
        data: formatted,
        executionTimeMs,
      };
    } catch (err: any) {
      const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
      return {
        data: [],
        executionTimeMs,
        error: err?.message || 'SQL execution failed. Check table names and syntax.',
      };
    }
  }

  // --- Enriched Query Helpers ---

  public getEnrichedListings(currentUserId?: number): EnrichedListing[] {
    // Keep newly created listings (listing_id > 10) at top, seeded listings 1..10 in canonical order
    const orderedListings = [...this.state.listings].sort((a, b) => {
      const aNew = a.listing_id > 10;
      const bNew = b.listing_id > 10;
      if (aNew && !bNew) return -1;
      if (!aNew && bNew) return 1;
      if (aNew && bNew) return b.listing_id - a.listing_id;
      return a.listing_id - b.listing_id;
    });

    return orderedListings.map((listing) => {
      const item = this.state.items.find((i) => i.item_id === listing.item_id) || {
        item_id: listing.item_id,
        owner_id: 1,
        category_id: 1,
        item_name: 'Campus Item',
        description: '',
        item_condition: 'good',
        created_at: listing.posted_at,
      };

      const category = this.state.categories.find((c) => c.category_id === item.category_id) || {
        category_id: 1,
        category_name: 'General',
        description: '',
      };

      const owner = this.state.users.find((u) => u.user_id === item.owner_id) || this.state.users[0];
      const images = this.state.itemImages.filter((img) => img.item_id === item.item_id);
      const requestCount = this.state.listingRequests.filter((r) => r.listing_id === listing.listing_id).length;
      const isSaved = currentUserId
        ? this.state.savedListings.some((sl) => sl.user_id === currentUserId && sl.listing_id === listing.listing_id)
        : false;

      return {
        listing,
        item,
        category,
        owner,
        images,
        requestCount,
        isSaved,
      };
    });
  }

  private getNextId(table: string, idCol: string): number {
    const rows = this.sqlDb.exec(`SELECT MAX(${idCol}) AS max_id FROM ${table}`);
    const maxVal = Array.isArray(rows) && rows[0]?.max_id ? Number(rows[0].max_id) : 0;
    return Number.isFinite(maxVal) ? maxVal + 1 : 1;
  }

  // --- SQL DML Mutations ---

  public createListing(params: {
    ownerId: number;
    categoryId: number;
    itemName: string;
    description: string;
    itemCondition: any;
    listingType: any;
    price: number;
    depositAmount: number;
    expiryDate?: string;
    imageUrl?: string;
  }): { listing: Listing; item: Item } {
    const newItemId = this.getNextId('Items', 'item_id');
    const newImageId = this.getNextId('Item_Images', 'image_id');
    const newListingId = this.getNextId('Listings', 'listing_id');
    const now = new Date().toISOString();
    const expiryDate =
      params.expiryDate ||
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newItem: Item = {
      item_id: newItemId,
      owner_id: params.ownerId,
      category_id: params.categoryId,
      item_name: params.itemName,
      description: params.description,
      item_condition: params.itemCondition,
      created_at: now,
    };

    const newImage: ItemImage = {
      image_id: newImageId,
      item_id: newItemId,
      image_url: params.imageUrl || '/images/items/clrs-algorithms.jpg',
      uploaded_at: now,
    };

    const newListing: Listing = {
      listing_id: newListingId,
      item_id: newItemId,
      listing_type: params.listingType,
      price: params.price,
      deposit_amount: params.depositAmount,
      posted_at: now,
      expiry_date: expiryDate,
      listing_status: 'active',
    };

    this.insertRow('Items', newItem);
    this.insertRow('Item_Images', newImage);
    this.insertRow('Listings', newListing);
    this.syncAndPersist();

    return { listing: newListing, item: newItem };
  }

  public createRequest(params: {
    listingId: number;
    requesterId: number;
    requestMessage: string;
    offeredItemId?: number | null;
    handoverLocation?: string;
    handoverTime?: string;
  }): ListingRequest {
    const newRequestId = this.getNextId('Listing_Requests', 'request_id');

    const newRequest: ListingRequest = {
      request_id: newRequestId,
      listing_id: params.listingId,
      requester_id: params.requesterId,
      offered_item_id: params.offeredItemId || null,
      request_message: params.requestMessage,
      requested_at: new Date().toISOString(),
      request_status: 'pending',
      handover_location: params.handoverLocation || 'Student Center, NSUT',
      handover_time: params.handoverTime || 'Lunch Break (1:30 PM)',
    };

    this.insertRow('Listing_Requests', newRequest);
    this.syncAndPersist();
    return newRequest;
  }

  public acceptRequest(requestId: number): { transaction: Transaction; loan?: Loan } {
    const requests = this.queryTable<ListingRequest>(
      `SELECT * FROM Listing_Requests WHERE request_id = ${Number(requestId)}`
    );
    const request = requests[0];
    if (!request) throw new Error('Request not found');

    this.sqlDb.exec(
      `UPDATE Listing_Requests SET request_status = 'accepted' WHERE request_id = ?`,
      [requestId]
    );

    const listings = this.queryTable<Listing>(
      `SELECT * FROM Listings WHERE listing_id = ${Number(request.listing_id)}`
    );
    const listing = listings[0];
    if (listing) {
      this.sqlDb.exec(
        `UPDATE Listings SET listing_status = 'reserved' WHERE listing_id = ?`,
        [listing.listing_id]
      );
    }

    const newTxId = this.getNextId('Transactions', 'transaction_id');
    const newTransaction: Transaction = {
      transaction_id: newTxId,
      request_id: requestId,
      transaction_status: 'in_progress',
      agreed_amount: listing ? Number(listing.price) : 0,
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    this.insertRow('Transactions', newTransaction);

    let newLoan: Loan | undefined = undefined;
    if (listing && listing.listing_type === 'lend') {
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      newLoan = {
        transaction_id: newTxId,
        due_date: dueDate,
        returned_at: null,
        loan_status: 'active',
        condition_on_return: null,
      };
      this.insertRow('Loans', newLoan);

      if (Number(listing.deposit_amount) > 0) {
        const newPaymentId = this.getNextId('Payments', 'payment_id');
        this.insertRow('Payments', {
          payment_id: newPaymentId,
          transaction_id: newTxId,
          payer_id: request.requester_id,
          payment_type: 'deposit',
          amount: Number(listing.deposit_amount),
          payment_method: 'upi',
          payment_status: 'completed',
          paid_at: new Date().toISOString(),
        });
      }
    }

    this.syncAndPersist();
    return { transaction: newTransaction, loan: newLoan };
  }

  public rejectRequest(requestId: number) {
    this.sqlDb.exec(
      `UPDATE Listing_Requests SET request_status = 'rejected' WHERE request_id = ?`,
      [requestId]
    );
    this.syncAndPersist();
  }

  public completeTransaction(transactionId: number) {
    const txs = this.queryTable<Transaction>(
      `SELECT * FROM Transactions WHERE transaction_id = ${Number(transactionId)}`
    );
    const tx = txs[0];
    if (!tx) return;

    const now = new Date().toISOString();
    this.sqlDb.exec(
      `UPDATE Transactions SET transaction_status = 'completed', completed_at = ? WHERE transaction_id = ?`,
      [now, transactionId]
    );

    const requests = this.queryTable<ListingRequest>(
      `SELECT * FROM Listing_Requests WHERE request_id = ${Number(tx.request_id)}`
    );
    const request = requests[0];
    if (request) {
      this.sqlDb.exec(
        `UPDATE Listing_Requests SET request_status = 'fulfilled' WHERE request_id = ?`,
        [request.request_id]
      );
      this.sqlDb.exec(
        `UPDATE Listings SET listing_status = 'completed' WHERE listing_id = ?`,
        [request.listing_id]
      );
    }

    this.syncAndPersist();
  }

  public returnBorrowedItem(transactionId: number, conditionNotes: string = 'Item returned in sound condition') {
    const loans = this.queryTable<Loan>(
      `SELECT * FROM Loans WHERE transaction_id = ${Number(transactionId)}`
    );
    if (!loans[0]) return;

    const now = new Date().toISOString();
    this.sqlDb.exec(
      `UPDATE Loans SET loan_status = 'returned', returned_at = ?, condition_on_return = ? WHERE transaction_id = ?`,
      [now, conditionNotes, transactionId]
    );

    const txs = this.queryTable<Transaction>(
      `SELECT * FROM Transactions WHERE transaction_id = ${Number(transactionId)}`
    );
    const tx = txs[0];
    if (tx) {
      this.sqlDb.exec(
        `UPDATE Transactions SET transaction_status = 'completed', completed_at = ? WHERE transaction_id = ?`,
        [now, transactionId]
      );

      const requests = this.queryTable<ListingRequest>(
        `SELECT * FROM Listing_Requests WHERE request_id = ${Number(tx.request_id)}`
      );
      const request = requests[0];
      if (request) {
        this.sqlDb.exec(
          `UPDATE Listing_Requests SET request_status = 'fulfilled' WHERE request_id = ?`,
          [request.request_id]
        );
        const listings = this.queryTable<Listing>(
          `SELECT * FROM Listings WHERE listing_id = ${Number(request.listing_id)}`
        );
        const listing = listings[0];
        if (listing && Number(listing.deposit_amount) > 0) {
          const items = this.queryTable<Item>(
            `SELECT * FROM Items WHERE item_id = ${Number(listing.item_id)}`
          );
          const item = items[0];
          const refundPaymentId = this.getNextId('Payments', 'payment_id');

          this.insertRow('Payments', {
            payment_id: refundPaymentId,
            transaction_id: transactionId,
            payer_id: item ? item.owner_id : 1,
            payment_type: 'refund',
            amount: Number(listing.deposit_amount),
            payment_method: 'upi',
            payment_status: 'refunded',
            paid_at: now,
          });
        }
      }
    }

    this.syncAndPersist();
  }

  public addReview(params: {
    transactionId: number;
    reviewerId: number;
    revieweeId: number;
    rating: number;
    comment: string;
  }) {
    const newRevId = this.getNextId('Reviews', 'review_id');
    this.insertRow('Reviews', {
      review_id: newRevId,
      transaction_id: params.transactionId,
      reviewer_id: params.reviewerId,
      reviewee_id: params.revieweeId,
      rating: params.rating,
      comment: params.comment,
      created_at: new Date().toISOString(),
    });
    this.syncAndPersist();
  }

  public raiseDispute(params: {
    transactionId: number;
    raisedBy: number;
    disputeReason: string;
    description: string;
  }) {
    const newDispId = this.getNextId('Disputes', 'dispute_id');
    this.insertRow('Disputes', {
      dispute_id: newDispId,
      transaction_id: params.transactionId,
      raised_by: params.raisedBy,
      dispute_reason: params.disputeReason,
      description: params.description,
      resolution_status: 'open',
      assigned_admin: 6,
      raised_at: new Date().toISOString(),
      resolved_at: null,
    });

    this.sqlDb.exec(
      `UPDATE Transactions SET transaction_status = 'disputed' WHERE transaction_id = ?`,
      [params.transactionId]
    );
    this.syncAndPersist();
  }

  public resolveDispute(disputeId: number, resolution: string, status: 'resolved' | 'rejected') {
    this.sqlDb.exec(
      `UPDATE Disputes SET resolution_status = ?, resolution = ?, resolved_at = ? WHERE dispute_id = ?`,
      [status, resolution, new Date().toISOString(), disputeId]
    );
    this.syncAndPersist();
  }

  public verifyUser(userId: number, status: 'verified' | 'rejected') {
    this.sqlDb.exec(
      `UPDATE Users SET verification_status = ? WHERE user_id = ?`,
      [status, userId]
    );
    this.syncAndPersist();
  }

  public toggleSavedListing(userId: number, listingId: number) {
    const existing = this.queryTable<SavedListing>(
      `SELECT * FROM Saved_Listings WHERE user_id = ${Number(userId)} AND listing_id = ${Number(listingId)}`
    );
    if (existing.length > 0) {
      this.sqlDb.exec(
        `DELETE FROM Saved_Listings WHERE user_id = ? AND listing_id = ?`,
        [userId, listingId]
      );
    } else {
      this.insertRow('Saved_Listings', {
        user_id: userId,
        listing_id: listingId,
        saved_at: new Date().toISOString(),
      });
    }
    this.syncAndPersist();
  }

  public sendMessage(params: {
    senderId: number;
    receiverId: number;
    listingId?: number | null;
    messageText: string;
  }) {
    const newMsgId = this.getNextId('Messages', 'message_id');
    this.insertRow('Messages', {
      message_id: newMsgId,
      sender_id: params.senderId,
      receiver_id: params.receiverId,
      listing_id: params.listingId || null,
      message_text: params.messageText,
      sent_at: new Date().toISOString(),
      read_at: null,
    });
    this.syncAndPersist();
  }

  public createReport(params: {
    reporterId: number;
    reportedUserId: number;
    listingId?: number | null;
    reportReason: string;
    description: string;
  }) {
    const newReportId = this.getNextId('Reports', 'report_id');
    this.insertRow('Reports', {
      report_id: newReportId,
      reporter_id: params.reporterId,
      reported_user_id: params.reportedUserId,
      listing_id: params.listingId ?? null,
      report_reason: params.reportReason,
      description: params.description,
      report_status: 'pending',
      reported_at: new Date().toISOString(),
    });
    this.syncAndPersist();
  }
}

export const db = new DatabaseEngine();
