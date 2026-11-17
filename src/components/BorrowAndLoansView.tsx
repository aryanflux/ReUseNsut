import React, { useState } from 'react';
import { Clock, CheckCircle, Star } from 'lucide-react';
import { User } from '../types/schema.ts';
import { DatabaseEngine } from '../db/dbEngine.ts';
import { formatINR, checkLoanOverdueStatus } from '../utils/metrics.ts';

interface BorrowAndLoansViewProps {
  currentUser: User;
  dbEngine: DatabaseEngine;
  onOpenChatWith: (receiverId: number, listingId: number) => void;
  onSuccess: (message: string) => void;
}

export const BorrowAndLoansView: React.FC<BorrowAndLoansViewProps> = ({
  currentUser,
  dbEngine,
  onOpenChatWith,
  onSuccess,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'borrowed' | 'lent'>('borrowed');
  const [returnNotes] = useState('Returned in good working condition.');
  const [reviewingTx, setReviewingTx] = useState<{
    txId: number;
    revieweeId: number;
    revieweeName: string;
  } | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('Returned early and communicated promptly.');

  const state = dbEngine.getState();
  const { loans, transactions, listingRequests, listings, items, users } = state;

  const myBorrowedLoans = loans
    .map((loan) => {
      const tx = transactions.find((t) => t.transaction_id === loan.transaction_id);
      if (!tx) return null;
      const req = listingRequests.find((r) => r.request_id === tx.request_id);
      if (!req || req.requester_id !== currentUser.user_id) return null;

      const listing = listings.find((l) => l.listing_id === req.listing_id);
      if (!listing) return null;
      const item = items.find((i) => i.item_id === listing.item_id);
      if (!item) return null;
      const owner = users.find((u) => u.user_id === item.owner_id);

      return {
        loan,
        transaction: tx,
        request: req,
        listing,
        item,
        counterparty: owner,
        role: 'borrower' as const,
      };
    })
    .filter(Boolean) as any[];

  const myLentLoans = loans
    .map((loan) => {
      const tx = transactions.find((t) => t.transaction_id === loan.transaction_id);
      if (!tx) return null;
      const req = listingRequests.find((r) => r.request_id === tx.request_id);
      if (!req) return null;
      const listing = listings.find((l) => l.listing_id === req.listing_id);
      if (!listing) return null;
      const item = items.find((i) => i.item_id === listing.item_id);
      if (!item || item.owner_id !== currentUser.user_id) return null;

      const borrower = users.find((u) => u.user_id === req.requester_id);

      return {
        loan,
        transaction: tx,
        request: req,
        listing,
        item,
        counterparty: borrower,
        role: 'lender' as const,
      };
    })
    .filter(Boolean) as any[];

  const handleConfirmReturn = (
    transactionId: number,
    borrowerId: number,
    borrowerName: string
  ) => {
    dbEngine.returnBorrowedItem(transactionId, returnNotes);
    onSuccess(
      'Item return recorded! Security deposit marked as refunded back to borrower.'
    );
    setReviewingTx({
      txId: transactionId,
      revieweeId: borrowerId,
      revieweeName: borrowerName,
    });
  };

  const handleSaveReview = () => {
    if (!reviewingTx) return;
    dbEngine.addReview({
      transactionId: reviewingTx.txId,
      reviewerId: currentUser.user_id,
      revieweeId: reviewingTx.revieweeId,
      rating,
      comment,
    });
    onSuccess(`Trust review recorded for ${reviewingTx.revieweeName}!`);
    setReviewingTx(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-6">
      {/* Editorial Header */}
      <div className="bg-[#2C2927] p-6 sm:p-8 text-white space-y-3 border border-[#1E1C1A]">
        <div className="flex items-center gap-2 text-xs font-medium text-[#D96B27]">
          <span>Campus Lending &amp; Escrow</span>
          <span aria-hidden="true">·</span>
          <span>Security Deposits &amp; Due Dates</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">
          Active Loans &amp; Escrow Returns
        </h1>
        <p className="text-xs text-[#CFC9C2] max-w-2xl leading-relaxed">
          Track return deadlines, overdue status alerts, and refundable security deposit logs once borrowed items are verified back by lenders.
        </p>

        <div className="pt-3 flex gap-3">
          <button
            onClick={() => setActiveSubTab('borrowed')}
            className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeSubTab === 'borrowed'
                ? 'bg-[#D96B27] text-white'
                : 'bg-[#3D3936] text-[#CFC9C2] hover:text-white'
            }`}
          >
            Items I Borrowed ({myBorrowedLoans.length})
          </button>
          <button
            onClick={() => setActiveSubTab('lent')}
            className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeSubTab === 'lent'
                ? 'bg-[#D96B27] text-white'
                : 'bg-[#3D3936] text-[#CFC9C2] hover:text-white'
            }`}
          >
            Items I Lent Out ({myLentLoans.length})
          </button>
        </div>
      </div>

      {/* Borrowed Tab */}
      {activeSubTab === 'borrowed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#7A746E] border-b border-[#E5E0D8] pb-2">
            <span>Tracking active borrowed assets and refundable deposits</span>
            <span>
              {myBorrowedLoans.filter((l) => l.loan.loan_status === 'active').length} active
            </span>
          </div>

          {myBorrowedLoans.length === 0 ? (
            <div className="bg-white border border-[#E5E0D8] p-10 text-center text-xs text-[#7A746E] space-y-2">
              <Clock className="w-8 h-8 text-[#9E978E] mx-auto" />
              <p className="font-semibold text-[#2C2927]">No borrowed items at the moment</p>
              <p>Browse the Marketplace to borrow calculators, textbooks, and drafters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {myBorrowedLoans.map((item) => {
                const overdue = checkLoanOverdueStatus(
                  item.loan.due_date,
                  item.loan.returned_at
                );
                const isActive = item.loan.loan_status === 'active';

                return (
                  <div
                    key={item.loan.transaction_id}
                    className="bg-white border border-[#E5E0D8] p-5 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-[#7A746E]">
                            Loan #{item.loan.transaction_id}
                          </div>
                          <h3 className="font-serif font-bold text-[#2C2927] text-base">
                            {item.item.item_name}
                          </h3>
                        </div>

                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 ${
                            isActive
                              ? overdue.isOverdue
                                ? 'bg-[#C82333] text-white'
                                : 'bg-[#1E5B3E] text-white'
                              : 'bg-[#EFECE7] text-[#524D48]'
                          }`}
                        >
                          {isActive ? overdue.statusText : 'Returned Safely'}
                        </span>
                      </div>

                      <div className="text-xs text-[#524D48] space-y-1.5 bg-[#FAF8F5] p-3.5 border border-[#E5E0D8]">
                        <div className="flex justify-between">
                          <span className="text-[#7A746E]">Lender:</span>
                          <span className="font-medium text-[#2C2927]">
                            {item.counterparty?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A746E]">Due Date:</span>
                          <span
                            className={`font-semibold ${
                              overdue.isOverdue && isActive
                                ? 'text-[#C82333]'
                                : 'text-[#2C2927]'
                            }`}
                          >
                            {item.loan.due_date}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A746E]">Security Deposit Held:</span>
                          <span className="font-semibold text-[#1E5B3E]">
                            {formatINR(item.listing.deposit_amount)}
                          </span>
                        </div>
                        {item.loan.condition_on_return && (
                          <div className="pt-1.5 text-[11px] text-[#7A746E] italic border-t border-[#E5E0D8]">
                            Notes: &ldquo;{item.loan.condition_on_return}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-between">
                      <button
                        onClick={() =>
                          onOpenChatWith(
                            item.counterparty?.user_id,
                            item.listing.listing_id
                          )
                        }
                        className="text-xs text-[#524D48] hover:text-[#D96B27] font-medium"
                      >
                        Message Lender
                      </button>

                      {isActive ? (
                        <div className="text-xs text-[#7A746E]">
                          Coordinate return with lender for deposit refund
                        </div>
                      ) : (
                        <span className="text-xs text-[#1E5B3E] font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Deposit Refunded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lent Tab */}
      {activeSubTab === 'lent' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#7A746E] border-b border-[#E5E0D8] pb-2">
            <span>Manage items you have lent to campus peers</span>
            <span>
              {myLentLoans.filter((l) => l.loan.loan_status === 'active').length} currently on loan
            </span>
          </div>

          {myLentLoans.length === 0 ? (
            <div className="bg-white border border-[#E5E0D8] p-10 text-center text-xs text-[#7A746E] space-y-2">
              <Clock className="w-8 h-8 text-[#9E978E] mx-auto" />
              <p className="font-semibold text-[#2C2927]">No active loans issued by you</p>
              <p>When someone borrows your item, track their return deadlines here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {myLentLoans.map((item) => {
                const overdue = checkLoanOverdueStatus(
                  item.loan.due_date,
                  item.loan.returned_at
                );
                const isActive = item.loan.loan_status === 'active';

                return (
                  <div
                    key={item.loan.transaction_id}
                    className="bg-white border border-[#E5E0D8] p-5 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-[#7A746E]">
                            Loan Record #{item.loan.transaction_id}
                          </div>
                          <h3 className="font-serif font-bold text-[#2C2927] text-base">
                            {item.item.item_name}
                          </h3>
                        </div>

                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 ${
                            isActive
                              ? overdue.isOverdue
                                ? 'bg-[#C82333] text-white'
                                : 'bg-[#1E5B3E] text-white'
                              : 'bg-[#EFECE7] text-[#524D48]'
                          }`}
                        >
                          {isActive ? overdue.statusText : 'Returned & Refunded'}
                        </span>
                      </div>

                      <div className="text-xs text-[#524D48] space-y-1.5 bg-[#FAF8F5] p-3.5 border border-[#E5E0D8]">
                        <div className="flex justify-between">
                          <span className="text-[#7A746E]">Borrower:</span>
                          <span className="font-medium text-[#2C2927]">
                            {item.counterparty?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A746E]">Phone:</span>
                          <span className="font-mono text-[#2C2927]">
                            {item.counterparty?.phone || 'On campus'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A746E]">Scheduled Due Date:</span>
                          <span
                            className={`font-semibold ${
                              overdue.isOverdue && isActive
                                ? 'text-[#C82333]'
                                : 'text-[#2C2927]'
                            }`}
                          >
                            {item.loan.due_date}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A746E]">Security Deposit:</span>
                          <span className="font-semibold text-[#1E5B3E]">
                            {formatINR(item.listing.deposit_amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-between gap-2">
                      <button
                        onClick={() =>
                          onOpenChatWith(
                            item.counterparty?.user_id,
                            item.listing.listing_id
                          )
                        }
                        className="text-xs text-[#524D48] hover:text-[#D96B27] font-medium"
                      >
                        Message Borrower
                      </button>

                      {isActive ? (
                        <button
                          onClick={() =>
                            handleConfirmReturn(
                              item.loan.transaction_id,
                              item.counterparty?.user_id,
                              item.counterparty?.name
                            )
                          }
                          className="px-4 py-1.5 bg-[#1E5B3E] hover:bg-[#174830] text-white text-xs font-semibold transition-colors"
                        >
                          Confirm Return &amp; Refund Deposit
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setReviewingTx({
                              txId: item.loan.transaction_id,
                              revieweeId: item.counterparty?.user_id,
                              revieweeName: item.counterparty?.name,
                            })
                          }
                          className="text-xs text-[#D96B27] hover:underline font-semibold"
                        >
                          Review Borrower ★
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Review Dialog */}
      {reviewingTx && (
        <div className="fixed inset-0 z-50 bg-[#2C2927]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border border-[#D5CFC7] max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#2C2927]">
              Leave Trust Review for {reviewingTx.revieweeName}
            </h3>
            <p className="text-xs text-[#7A746E]">
              Peer reviews directly update campus Trust Scores.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#2C2927] mb-1">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 text-[#D96B27] hover:scale-110 transition-transform"
                    >
                      <Star
                        className="w-6 h-6"
                        fill={star <= rating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-[#2C2927] ml-2">{rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2C2927] mb-1">
                  Feedback Comment
                </label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#2C2927]"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReviewingTx(null)}
                className="px-3 py-1.5 text-xs text-[#7A746E] hover:text-[#2C2927]"
              >
                Skip
              </button>
              <button
                onClick={handleSaveReview}
                className="px-4 py-1.5 text-xs font-semibold bg-[#D96B27] hover:bg-[#C0581A] text-white transition-colors"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
