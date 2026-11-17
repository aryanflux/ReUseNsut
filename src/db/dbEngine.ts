// ReUseNSUT Relational Database Engine and State Store
// Integrates in-memory store with alasql for real-time SQL queries

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
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_ITEMS,
  INITIAL_ITEM_IMAGES,
  INITIAL_LISTINGS,
  INITIAL_LISTING_REQUESTS,
  INITIAL_TRANSACTIONS,
  INITIAL_LOANS,
  INITIAL_PAYMENTS,
  INITIAL_REVIEWS,
  INITIAL_DISPUTES,
  INITIAL_SAVED_LISTINGS,
  INITIAL_REPORTS,
  INITIAL_REPORT_ACTIONS,
  INITIAL_MESSAGES,
} from './seedData.ts';

const STORAGE_KEY = 'reusensut_db_v4';

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

export class DatabaseEngine {
  private state: DatabaseState;
  private listeners: (() => void)[] = [];

  constructor() {
    this.state = this.loadState();
    this.syncAlasql();
  }

  private loadState(): DatabaseState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback if localStorage is disabled or corrupt
    }

    return {
      users: [...INITIAL_USERS],
      categories: [...INITIAL_CATEGORIES],
      items: [...INITIAL_ITEMS],
      itemImages: [...INITIAL_ITEM_IMAGES],
      listings: [...INITIAL_LISTINGS],
      listingRequests: [...INITIAL_LISTING_REQUESTS],
      transactions: [...INITIAL_TRANSACTIONS],
      loans: [...INITIAL_LOANS],
      payments: [...INITIAL_PAYMENTS],
      reviews: [...INITIAL_REVIEWS],
      disputes: [...INITIAL_DISPUTES],
      savedListings: [...INITIAL_SAVED_LISTINGS],
      reports: [...INITIAL_REPORTS],
      reportActions: [...INITIAL_REPORT_ACTIONS],
      messages: [...INITIAL_MESSAGES],
    };
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore write errors
    }
    this.syncAlasql();
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

  public resetToDefault() {
    this.state = {
      users: [...INITIAL_USERS],
      categories: [...INITIAL_CATEGORIES],
      items: [...INITIAL_ITEMS],
      itemImages: [...INITIAL_ITEM_IMAGES],
      listings: [...INITIAL_LISTINGS],
      listingRequests: [...INITIAL_LISTING_REQUESTS],
      transactions: [...INITIAL_TRANSACTIONS],
      loans: [...INITIAL_LOANS],
      payments: [...INITIAL_PAYMENTS],
      reviews: [...INITIAL_REVIEWS],
      disputes: [...INITIAL_DISPUTES],
      savedListings: [...INITIAL_SAVED_LISTINGS],
      reports: [...INITIAL_REPORTS],
      reportActions: [...INITIAL_REPORT_ACTIONS],
      messages: [...INITIAL_MESSAGES],
    };
    this.saveState();
  }

  /**
   * Registers/syncs all 15 tables with AlaSQL so real SQL queries can be run!
   */
  public syncAlasql() {
    try {
      alasql('DROP TABLE IF EXISTS Users');
      alasql('DROP TABLE IF EXISTS Categories');
      alasql('DROP TABLE IF EXISTS Items');
      alasql('DROP TABLE IF EXISTS Item_Images');
      alasql('DROP TABLE IF EXISTS Listings');
      alasql('DROP TABLE IF EXISTS Listing_Requests');
      alasql('DROP TABLE IF EXISTS Transactions');
      alasql('DROP TABLE IF EXISTS Loans');
      alasql('DROP TABLE IF EXISTS Payments');
      alasql('DROP TABLE IF EXISTS Reviews');
      alasql('DROP TABLE IF EXISTS Disputes');
      alasql('DROP TABLE IF EXISTS Saved_Listings');
      alasql('DROP TABLE IF EXISTS Reports');
      alasql('DROP TABLE IF EXISTS Report_Actions');
      alasql('DROP TABLE IF EXISTS Messages');

      alasql.tables.Users = { data: JSON.parse(JSON.stringify(this.state.users)) };
      alasql.tables.Categories = { data: JSON.parse(JSON.stringify(this.state.categories)) };
      alasql.tables.Items = { data: JSON.parse(JSON.stringify(this.state.items)) };
      alasql.tables.Item_Images = { data: JSON.parse(JSON.stringify(this.state.itemImages)) };
      alasql.tables.Listings = { data: JSON.parse(JSON.stringify(this.state.listings)) };
      alasql.tables.Listing_Requests = { data: JSON.parse(JSON.stringify(this.state.listingRequests)) };
      alasql.tables.Transactions = { data: JSON.parse(JSON.stringify(this.state.transactions)) };
      alasql.tables.Loans = { data: JSON.parse(JSON.stringify(this.state.loans)) };
      alasql.tables.Payments = { data: JSON.parse(JSON.stringify(this.state.payments)) };
      alasql.tables.Reviews = { data: JSON.parse(JSON.stringify(this.state.reviews)) };
      alasql.tables.Disputes = { data: JSON.parse(JSON.stringify(this.state.disputes)) };
      alasql.tables.Saved_Listings = { data: JSON.parse(JSON.stringify(this.state.savedListings)) };
      alasql.tables.Reports = { data: JSON.parse(JSON.stringify(this.state.reports)) };
      alasql.tables.Report_Actions = { data: JSON.parse(JSON.stringify(this.state.reportActions)) };
      alasql.tables.Messages = { data: JSON.parse(JSON.stringify(this.state.messages)) };
    } catch (e) {
      console.error('Failed to sync tables to AlaSQL:', e);
    }
  }

  /**
   * Execute an arbitrary SQL query against the 15 live tables
   */
  public executeSQL(sqlQuery: string): { data: any[]; executionTimeMs: number; error?: string } {
    const startTime = performance.now();
    try {
      this.syncAlasql();
      const cleanSql = sqlQuery.trim();
      const result = alasql(cleanSql);
      const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
      return {
        data: Array.isArray(result) ? result : [result],
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
    return this.state.listings.map((listing) => {
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

  // --- CRUD Mutations ---

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
    const newItemId = this.state.items.length > 0 ? Math.max(...this.state.items.map((i) => i.item_id)) + 1 : 1;
    const now = new Date().toISOString();

    const newItem: Item = {
      item_id: newItemId,
      owner_id: params.ownerId,
      category_id: params.categoryId,
      item_name: params.itemName,
      description: params.description,
      item_condition: params.itemCondition,
      created_at: now,
    };

    const newImageId = this.state.itemImages.length > 0 ? Math.max(...this.state.itemImages.map((img) => img.image_id)) + 1 : 1;
    const newImage: ItemImage = {
      image_id: newImageId,
      item_id: newItemId,
      image_url: params.imageUrl || '/images/items/clrs-algorithms.jpg',
      uploaded_at: now,
    };

    const newListingId = this.state.listings.length > 0 ? Math.max(...this.state.listings.map((l) => l.listing_id)) + 1 : 1;
    const newListing: Listing = {
      listing_id: newListingId,
      item_id: newItemId,
      listing_type: params.listingType,
      price: params.price,
      deposit_amount: params.depositAmount,
      posted_at: now,
      expiry_date: params.expiryDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      listing_status: 'active',
    };

    this.state.items.unshift(newItem);
    this.state.itemImages.unshift(newImage);
    this.state.listings.unshift(newListing);
    this.saveState();

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
    const newRequestId = this.state.listingRequests.length > 0
      ? Math.max(...this.state.listingRequests.map((r) => r.request_id)) + 1
      : 1;

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

    this.state.listingRequests.unshift(newRequest);
    this.saveState();
    return newRequest;
  }

  public acceptRequest(requestId: number): { transaction: Transaction; loan?: Loan } {
    const request = this.state.listingRequests.find((r) => r.request_id === requestId);
    if (!request) throw new Error('Request not found');

    request.request_status = 'accepted';

    const listing = this.state.listings.find((l) => l.listing_id === request.listing_id);
    if (listing) {
      listing.listing_status = 'reserved';
    }

    const newTxId = this.state.transactions.length > 0
      ? Math.max(...this.state.transactions.map((t) => t.transaction_id)) + 1
      : 1;

    const newTransaction: Transaction = {
      transaction_id: newTxId,
      request_id: requestId,
      transaction_status: 'in_progress',
      agreed_amount: listing ? listing.price : 0,
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    this.state.transactions.unshift(newTransaction);

    let newLoan: Loan | undefined = undefined;
    if (listing && listing.listing_type === 'lend') {
      // Default loan 14 days or due date
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      newLoan = {
        transaction_id: newTxId,
        due_date: dueDate,
        returned_at: null,
        loan_status: 'active',
        condition_on_return: null,
      };
      this.state.loans.unshift(newLoan);

      // Record deposit payment
      if (listing.deposit_amount > 0) {
        const newPaymentId = this.state.payments.length > 0
          ? Math.max(...this.state.payments.map((p) => p.payment_id)) + 1
          : 1;
        this.state.payments.unshift({
          payment_id: newPaymentId,
          transaction_id: newTxId,
          payer_id: request.requester_id,
          payment_type: 'deposit',
          amount: listing.deposit_amount,
          payment_method: 'upi',
          payment_status: 'completed',
          paid_at: new Date().toISOString(),
        });
      }
    }

    this.saveState();
    return { transaction: newTransaction, loan: newLoan };
  }

  public rejectRequest(requestId: number) {
    const request = this.state.listingRequests.find((r) => r.request_id === requestId);
    if (request) {
      request.request_status = 'rejected';
      this.saveState();
    }
  }

  public completeTransaction(transactionId: number) {
    const tx = this.state.transactions.find((t) => t.transaction_id === transactionId);
    if (!tx) return;

    tx.transaction_status = 'completed';
    tx.completed_at = new Date().toISOString();

    const request = this.state.listingRequests.find((r) => r.request_id === tx.request_id);
    if (request) {
      request.request_status = 'fulfilled';
      const listing = this.state.listings.find((l) => l.listing_id === request.listing_id);
      if (listing) {
        listing.listing_status = 'completed';
      }
    }

    this.saveState();
  }

  public returnBorrowedItem(transactionId: number, conditionNotes: string = 'Item returned in sound condition') {
    const loan = this.state.loans.find((l) => l.transaction_id === transactionId);
    if (!loan) return;

    const now = new Date().toISOString();
    loan.loan_status = 'returned';
    loan.returned_at = now;
    loan.condition_on_return = conditionNotes;

    // Trigger deposit refund payment
    const tx = this.state.transactions.find((t) => t.transaction_id === transactionId);
    if (tx) {
      tx.transaction_status = 'completed';
      tx.completed_at = now;

      const request = this.state.listingRequests.find((r) => r.request_id === tx.request_id);
      if (request) {
        request.request_status = 'fulfilled';
        const listing = this.state.listings.find((l) => l.listing_id === request.listing_id);
        if (listing && listing.deposit_amount > 0) {
          const item = this.state.items.find((i) => i.item_id === listing.item_id);
          const refundPaymentId = this.state.payments.length > 0
            ? Math.max(...this.state.payments.map((p) => p.payment_id)) + 1
            : 1;

          this.state.payments.unshift({
            payment_id: refundPaymentId,
            transaction_id: transactionId,
            payer_id: item ? item.owner_id : 1, // Lender refunds to borrower
            payment_type: 'refund',
            amount: listing.deposit_amount,
            payment_method: 'upi',
            payment_status: 'refunded',
            paid_at: now,
          });
        }
      }
    }

    this.saveState();
  }

  public addReview(params: {
    transactionId: number;
    reviewerId: number;
    revieweeId: number;
    rating: number;
    comment: string;
  }) {
    const newRevId = this.state.reviews.length > 0
      ? Math.max(...this.state.reviews.map((r) => r.review_id)) + 1
      : 1;

    this.state.reviews.unshift({
      review_id: newRevId,
      transaction_id: params.transactionId,
      reviewer_id: params.reviewerId,
      reviewee_id: params.revieweeId,
      rating: params.rating,
      comment: params.comment,
      created_at: new Date().toISOString(),
    });

    this.saveState();
  }

  public raiseDispute(params: {
    transactionId: number;
    raisedBy: number;
    disputeReason: string;
    description: string;
  }) {
    const newDispId = this.state.disputes.length > 0
      ? Math.max(...this.state.disputes.map((d) => d.dispute_id)) + 1
      : 1;

    this.state.disputes.unshift({
      dispute_id: newDispId,
      transaction_id: params.transactionId,
      raised_by: params.raisedBy,
      dispute_reason: params.disputeReason,
      description: params.description,
      resolution_status: 'open',
      assigned_admin: 6, // Faculty Dr. Vivek Mehta
      raised_at: new Date().toISOString(),
      resolved_at: null,
    });

    const tx = this.state.transactions.find((t) => t.transaction_id === params.transactionId);
    if (tx) {
      tx.transaction_status = 'disputed';
    }

    this.saveState();
  }

  public resolveDispute(disputeId: number, resolution: string, status: 'resolved' | 'rejected') {
    const disp = this.state.disputes.find((d) => d.dispute_id === disputeId);
    if (disp) {
      disp.resolution_status = status;
      disp.resolution = resolution;
      disp.resolved_at = new Date().toISOString();
      this.saveState();
    }
  }

  public verifyUser(userId: number, status: 'verified' | 'rejected') {
    const user = this.state.users.find((u) => u.user_id === userId);
    if (user) {
      user.verification_status = status;
      this.saveState();
    }
  }

  public toggleSavedListing(userId: number, listingId: number) {
    const index = this.state.savedListings.findIndex(
      (sl) => sl.user_id === userId && sl.listing_id === listingId
    );
    if (index >= 0) {
      this.state.savedListings.splice(index, 1);
    } else {
      this.state.savedListings.push({
        user_id: userId,
        listing_id: listingId,
        saved_at: new Date().toISOString(),
      });
    }
    this.saveState();
  }

  public sendMessage(params: {
    senderId: number;
    receiverId: number;
    listingId?: number | null;
    messageText: string;
  }) {
    const newMsgId = this.state.messages.length > 0
      ? Math.max(...this.state.messages.map((m) => m.message_id)) + 1
      : 1;

    this.state.messages.push({
      message_id: newMsgId,
      sender_id: params.senderId,
      receiver_id: params.receiverId,
      listing_id: params.listingId || null,
      message_text: params.messageText,
      sent_at: new Date().toISOString(),
      read_at: null,
    });

    this.saveState();
  }
}

export const db = new DatabaseEngine();
