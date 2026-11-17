// Utility calculations for ReUseNSUT campus sharing metrics

import { Review, Loan, Transaction, Listing, Dispute } from '../types/schema.ts';

export interface TrustScoreBreakdown {
  score: number; // 0 - 100
  level: 'Elite Trustee' | 'Verified Trustee' | 'Standard Student' | 'Under Observation';
  averageRating: number;
  totalReviews: number;
  onTimeReturnRate: number; // 0 - 100%
  completedLoansCount: number;
  disputePenalty: number;
}

/**
 * Calculates a verified student's trust score based on peer reviews,
 * on-time loan returns, and dispute history.
 */
export function calculateTrustScore(
  userId: number,
  reviews: Review[],
  loans: Loan[],
  transactions: Transaction[],
  disputes: Dispute[]
): TrustScoreBreakdown {
  // 1. Peer Reviews received by this user
  const userReviews = reviews.filter((r) => r.reviewee_id === userId);
  const totalReviews = userReviews.length;
  const averageRating = totalReviews > 0
    ? userReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 4.5; // Default baseline trust for verified student

  // Review component: 0 to 70 points
  const reviewPoints = (averageRating / 5) * 70;

  // 2. On-time loan return performance (for items this student borrowed)
  // Find transactions where the user was the requester/borrower
  const userLoanTransactions = loans.filter((loan) => {
    // Check if this loan belongs to this user's transactions
    return transactions.some((t) => t.transaction_id === loan.transaction_id);
  });

  let onTimeReturns = 0;
  let returnedLoans = 0;

  userLoanTransactions.forEach((loan) => {
    if (loan.loan_status === 'returned') {
      returnedLoans++;
      if (loan.returned_at && loan.due_date) {
        const returnDate = new Date(loan.returned_at).getTime();
        const dueDate = new Date(loan.due_date).getTime();
        if (returnDate <= dueDate) {
          onTimeReturns++;
        }
      } else {
        onTimeReturns++;
      }
    }
  });

  const onTimeReturnRate = returnedLoans > 0
    ? Math.round((onTimeReturns / returnedLoans) * 100)
    : 100;

  // Return punctuality component: 0 to 30 points
  const loanPoints = (onTimeReturnRate / 100) * 30;

  // 3. Dispute penalties
  const unresolvedDisputes = disputes.filter(
    (d) => d.raised_by !== userId && d.resolution_status !== 'rejected' && d.resolution_status !== 'resolved'
  ).length;
  const disputePenalty = unresolvedDisputes * 15;

  let finalScore = Math.round(reviewPoints + loanPoints - disputePenalty);
  finalScore = Math.max(10, Math.min(100, finalScore));

  let level: TrustScoreBreakdown['level'] = 'Standard Student';
  if (finalScore >= 90) level = 'Elite Trustee';
  else if (finalScore >= 75) level = 'Verified Trustee';
  else if (finalScore >= 50) level = 'Standard Student';
  else level = 'Under Observation';

  return {
    score: finalScore,
    level,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    onTimeReturnRate,
    completedLoansCount: returnedLoans,
    disputePenalty,
  };
}

/**
 * Calculates sustainability eco-points for campus reuse activities
 */
export function calculateSustainabilityPoints(
  userId: number,
  transactions: Transaction[],
  listings: Listing[],
  allListingRequests: { request_id: number; listing_id: number; requester_id: number }[],
  allItems: { item_id: number; owner_id: number }[]
): { totalPoints: number; donationsCount: number; lendsCount: number; salesCount: number; exchangesCount: number } {
  let donationsCount = 0;
  let lendsCount = 0;
  let salesCount = 0;
  let exchangesCount = 0;

  transactions.forEach((tx) => {
    if (tx.transaction_status === 'completed' || tx.transaction_status === 'in_progress') {
      const req = allListingRequests.find((r) => r.request_id === tx.request_id);
      if (!req) return;

      const listing = listings.find((l) => l.listing_id === req.listing_id);
      if (!listing) return;

      const item = allItems.find((i) => i.item_id === listing.item_id);
      if (!item) return;

      // Count if user is owner OR requester (both save campus waste!)
      const isParticipant = item.owner_id === userId || req.requester_id === userId;
      if (!isParticipant) return;

      if (listing.listing_type === 'donation') donationsCount++;
      else if (listing.listing_type === 'lend') lendsCount++;
      else if (listing.listing_type === 'sale') salesCount++;
      else if (listing.listing_type === 'exchange') exchangesCount++;
    }
  });

  const totalPoints =
    donationsCount * 50 +
    lendsCount * 30 +
    exchangesCount * 25 +
    salesCount * 20;

  return {
    totalPoints,
    donationsCount,
    lendsCount,
    salesCount,
    exchangesCount,
  };
}

/**
 * Evaluates whether a loan is overdue compared to reference date
 */
export function checkLoanOverdueStatus(
  dueDateStr: string,
  returnedAtStr?: string | null,
  referenceDate: Date = new Date()
): { isOverdue: boolean; daysRemainingOrLate: number; statusText: string } {
  const dueTime = new Date(dueDateStr).getTime();
  
  if (returnedAtStr) {
    const returnTime = new Date(returnedAtStr).getTime();
    const diffDays = Math.round((returnTime - dueTime) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      return { isOverdue: true, daysRemainingOrLate: diffDays, statusText: `Returned ${diffDays} day(s) late` };
    }
    return { isOverdue: false, daysRemainingOrLate: Math.abs(diffDays), statusText: 'Returned on time' };
  }

  const nowTime = referenceDate.getTime();
  const diffTime = dueTime - nowTime;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { isOverdue: true, daysRemainingOrLate: Math.abs(diffDays), statusText: `${Math.abs(diffDays)} day(s) overdue` };
  } else if (diffDays === 0) {
    return { isOverdue: false, daysRemainingOrLate: 0, statusText: 'Due today' };
  } else {
    return { isOverdue: false, daysRemainingOrLate: diffDays, statusText: `${diffDays} day(s) left` };
  }
}

/**
 * Formats Indian Currency (INR) cleanly
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
