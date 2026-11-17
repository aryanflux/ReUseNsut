import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTrustScore,
  calculateSustainabilityPoints,
  checkLoanOverdueStatus,
  formatINR,
} from './metrics.ts';
import { Review, Loan, Transaction, Listing, Dispute } from '../types/schema.ts';

test('calculateTrustScore gives high score for positive reviews and perfect loan returns', () => {
  const userId = 101;
  const mockReviews: Review[] = [
    { review_id: 1, transaction_id: 1, reviewer_id: 102, reviewee_id: 101, rating: 5, comment: 'Great condition drafter!', created_at: '2026-03-01' },
    { review_id: 2, transaction_id: 2, reviewer_id: 103, reviewee_id: 101, rating: 5, comment: 'Punctual and helpful', created_at: '2026-03-05' },
  ];
  const mockLoans: Loan[] = [
    { transaction_id: 1, due_date: '2026-03-10', returned_at: '2026-03-09', loan_status: 'returned', condition_on_return: 'good' },
  ];
  const mockTransactions: Transaction[] = [
    { transaction_id: 1, request_id: 1, transaction_status: 'completed', agreed_amount: 150, created_at: '2026-03-01' },
  ];
  const mockDisputes: Dispute[] = [];

  const result = calculateTrustScore(userId, mockReviews, mockLoans, mockTransactions, mockDisputes);
  assert.equal(result.score >= 90, true);
  assert.equal(result.level, 'Elite Trustee');
  assert.equal(result.averageRating, 5);
  assert.equal(result.onTimeReturnRate, 100);
});

test('calculateTrustScore applies dispute penalties when disputes are open against user', () => {
  const userId = 105;
  const mockReviews: Review[] = [
    { review_id: 3, transaction_id: 3, reviewer_id: 102, reviewee_id: 105, rating: 2, comment: 'Item scratched', created_at: '2026-03-02' },
  ];
  const mockLoans: Loan[] = [];
  const mockTransactions: Transaction[] = [];
  const mockDisputes: Dispute[] = [
    { dispute_id: 1, transaction_id: 3, raised_by: 102, dispute_reason: 'Damaged item', description: 'Screen cracked', resolution_status: 'open', raised_at: '2026-03-03' },
  ];

  const result = calculateTrustScore(userId, mockReviews, mockLoans, mockTransactions, mockDisputes);
  assert.equal(result.score < 50, true);
  assert.equal(result.disputePenalty, 15);
});

test('calculateSustainabilityPoints computes correct scores for donations, lends, and sales', () => {
  const userId = 201;
  const mockTransactions: Transaction[] = [
    { transaction_id: 1, request_id: 1, transaction_status: 'completed', agreed_amount: 0, created_at: '2026-03-01' },
    { transaction_id: 2, request_id: 2, transaction_status: 'completed', agreed_amount: 100, created_at: '2026-03-02' },
    { transaction_id: 3, request_id: 3, transaction_status: 'completed', agreed_amount: 450, created_at: '2026-03-03' },
  ];
  const mockListings: Listing[] = [
    { listing_id: 1, item_id: 11, listing_type: 'donation', price: 0, deposit_amount: 0, posted_at: '2026-03-01', listing_status: 'completed' },
    { listing_id: 2, item_id: 12, listing_type: 'lend', price: 100, deposit_amount: 500, posted_at: '2026-03-01', listing_status: 'completed' },
    { listing_id: 3, item_id: 13, listing_type: 'sale', price: 450, deposit_amount: 0, posted_at: '2026-03-01', listing_status: 'completed' },
  ];
  const mockRequests = [
    { request_id: 1, listing_id: 1, requester_id: 202 },
    { request_id: 2, listing_id: 2, requester_id: 202 },
    { request_id: 3, listing_id: 3, requester_id: 202 },
  ];
  const mockItems = [
    { item_id: 11, owner_id: 201 },
    { item_id: 12, owner_id: 201 },
    { item_id: 13, owner_id: 201 },
  ];

  const points = calculateSustainabilityPoints(userId, mockTransactions, mockListings, mockRequests, mockItems);
  // Donation (50) + Lend (30) + Sale (20) = 100 points
  assert.equal(points.totalPoints, 100);
  assert.equal(points.donationsCount, 1);
  assert.equal(points.lendsCount, 1);
  assert.equal(points.salesCount, 1);
});

test('checkLoanOverdueStatus correctly flags overdue loans', () => {
  const refDate = new Date('2026-03-15T12:00:00Z');
  
  // Past due date
  const overdueCheck = checkLoanOverdueStatus('2026-03-10', null, refDate);
  assert.equal(overdueCheck.isOverdue, true);

  // Future due date
  const upcomingCheck = checkLoanOverdueStatus('2026-03-20', null, refDate);
  assert.equal(upcomingCheck.isOverdue, false);
  assert.equal(upcomingCheck.daysRemainingOrLate, 5);
});

test('formatINR formats numbers with Indian Rupee symbol', () => {
  const formatted = formatINR(1500);
  assert.equal(formatted.includes('1,500'), true);
});
