import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  MessageSquare,
  CheckCircle,
  Flag,
} from 'lucide-react';
import { User, EnrichedListing } from '../types/schema.ts';
import { DatabaseEngine } from '../db/dbEngine.ts';
import { formatINR, calculateTrustScore } from '../utils/metrics.ts';

interface ListingDetailModalProps {
  listingItem: EnrichedListing | null;
  currentUser: User;
  dbEngine: DatabaseEngine;
  onClose: () => void;
  onOpenChatWith: (receiverId: number, listingId: number) => void;
  onSuccessAction: (message: string) => void;
}

const FALLBACK_IMAGE = '/images/items/clrs-algorithms.jpg';

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listingItem,
  currentUser,
  dbEngine,
  onClose,
  onOpenChatWith,
  onSuccessAction,
}) => {
  if (!listingItem) return null;

  const state = dbEngine.getState();
  const { listing, item, category, owner, images } = listingItem;

  const isOwner = currentUser.user_id === owner.user_id;
  const isVerified = currentUser.verification_status === 'verified';

  const [requestMessage, setRequestMessage] = useState(
    listing.listing_type === 'lend'
      ? `Hi ${owner.name.split(' ')[0]}, I would like to borrow this for my semester courses. Can we meet for handover?`
      : listing.listing_type === 'exchange'
      ? `Hi ${owner.name.split(' ')[0]}, I have an item to offer for exchange. Please check!`
      : listing.listing_type === 'donation'
      ? `Hi ${owner.name.split(' ')[0]}, thank you for donating! I am a junior and need this for my classes.`
      : `Hi ${owner.name.split(' ')[0]}, I want to buy this. Let's arrange handover on campus.`
  );
  const [handoverLocation, setHandoverLocation] = useState('Student Center, Ground Floor');
  const [handoverTime, setHandoverTime] = useState('Lunch Break (1:30 PM)');
  const [offeredItemId, setOfferedItemId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('Incorrect category or condition');

  const existingRequest = state.listingRequests.find(
    (r) => r.listing_id === listing.listing_id && r.requester_id === currentUser.user_id
  );

  const myItems = state.items.filter((i) => i.owner_id === currentUser.user_id);

  const ownerTrust = calculateTrustScore(
    owner.user_id,
    state.reviews,
    state.loans,
    state.transactions,
    state.disputes
  );

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      return;
    }

    setIsSubmitting(true);
    try {
      dbEngine.createRequest({
        listingId: listing.listing_id,
        requesterId: currentUser.user_id,
        requestMessage,
        offeredItemId: offeredItemId ? Number(offeredItemId) : null,
        handoverLocation,
        handoverTime,
      });

      dbEngine.sendMessage({
        senderId: currentUser.user_id,
        receiverId: owner.user_id,
        listingId: listing.listing_id,
        messageText: `[Request Placed]: "${requestMessage}" (Meeting spot: ${handoverLocation})`,
      });

      onSuccessAction('Request submitted successfully! The owner will be notified.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportListing = () => {
    dbEngine.createReport({
      reporterId: currentUser.user_id,
      reportedUserId: owner.user_id,
      listingId: listing.listing_id,
      reportReason,
      description: `Reported by ${currentUser.name} regarding item #${item.item_id}`,
    });
    onSuccessAction('Listing reported to campus proctor for review.');
    setShowReportForm(false);
  };

  const displayImage = images[0]?.image_url || FALLBACK_IMAGE;

  return (
    <div className="fixed inset-0 z-50 bg-[#2C2927]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-[#FAF8F5] max-w-2xl w-full shadow-2xl border border-[#D5CFC7] overflow-hidden my-8"
        role="dialog"
        aria-labelledby="modal-item-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8] bg-white">
          <div className="flex items-center gap-2 text-xs text-[#7A746E]">
            <span>Listing #{listing.listing_id}</span>
            <span aria-hidden="true">·</span>
            <span>{category.category_name}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7A746E] hover:text-[#2C2927] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative aspect-[4/4.2] bg-[#EFECE7] border border-[#E5E0D8] overflow-hidden">
              <img
                src={displayImage}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
                alt={item.item_name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 right-0 bg-[#1E5B3E] text-white px-2.5 py-0.5 text-[11px] font-semibold capitalize">
                {listing.listing_type}
              </span>
            </div>

            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <h2 id="modal-item-title" className="font-serif text-xl font-bold text-[#2C2927] leading-snug">
                  {item.item_name}
                </h2>

                <div className="mt-2 text-xs text-[#7A746E] flex items-center gap-2">
                  <span className="capitalize font-medium text-[#2C2927]">
                    Condition: {item.item_condition.replace('_', ' ')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Posted {new Date(listing.posted_at).toLocaleDateString()}</span>
                </div>

                <div className="mt-4 p-3.5 bg-white border border-[#E5E0D8] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A746E] font-medium">Terms</span>
                    <span className="font-bold text-[#D96B27] text-base">
                      {listing.listing_type === 'donation'
                        ? 'Free Donation'
                        : listing.listing_type === 'exchange'
                        ? 'Barter Swap'
                        : formatINR(listing.price)}
                    </span>
                  </div>

                  {listing.listing_type === 'lend' && (
                    <div className="flex items-center justify-between text-[#1E5B3E] pt-1.5 border-t border-[#E5E0D8]">
                      <span>Refundable Security Deposit:</span>
                      <span className="font-semibold">{formatINR(listing.deposit_amount)}</span>
                    </div>
                  )}

                  {listing.expiry_date && (
                    <div className="flex items-center justify-between text-[#7A746E]">
                      <span>Valid until:</span>
                      <span>{listing.expiry_date}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Info */}
              <div className="p-3.5 bg-white border border-[#E5E0D8] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={owner.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                    alt={owner.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E5E0D8] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-[#2C2927] text-xs flex items-center gap-1.5">
                      <span className="truncate">{owner.name}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#1E5B3E] shrink-0" />
                    </div>
                    <div className="text-[11px] text-[#7A746E]">
                      {owner.branch || 'Student'}
                    </div>
                    <div className="text-[11px] text-[#1E5B3E] font-medium">
                      Trust {ownerTrust.score}/100 · {ownerTrust.onTimeReturnRate}% on-time
                    </div>
                  </div>
                </div>

                {!isOwner && (
                  <button
                    onClick={() => onOpenChatWith(owner.user_id, listing.listing_id)}
                    className="rounded-full border border-[#2C2927] px-3 py-1 text-xs font-medium text-[#2C2927] hover:bg-[#2C2927] hover:text-white transition-colors flex items-center gap-1 shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-[#2C2927] uppercase tracking-wider">
              Item Details &amp; Condition
            </h4>
            <p className="text-xs text-[#524D48] leading-relaxed whitespace-pre-line bg-white p-3.5 border border-[#E5E0D8]">
              {item.description || 'No additional notes provided by owner.'}
            </p>
          </div>

          {/* Request Section */}
          {isOwner ? (
            <div className="p-4 bg-white border border-[#E5E0D8] text-center space-y-1">
              <p className="text-xs font-semibold text-[#2C2927]">You listed this item.</p>
              <p className="text-xs text-[#7A746E]">
                Open Requests &amp; Orders in the top navigation to review offers and arrange handovers.
              </p>
            </div>
          ) : existingRequest ? (
            <div className="p-4 bg-white border border-[#1E5B3E]/40 space-y-1.5">
              <div className="flex items-center gap-2 text-[#1E5B3E] font-semibold text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Request submitted for this item</span>
              </div>
              <p className="text-xs text-[#524D48]">
                Status: <span className="font-bold capitalize">{existingRequest.request_status}</span>
                {existingRequest.handover_location && ` · Spot: ${existingRequest.handover_location}`}
              </p>
            </div>
          ) : !isVerified ? (
            <div className="p-4 bg-amber-50 border border-amber-200 text-xs text-amber-900">
              Your account is pending verification. Switch to an Admin persona to approve verification before sending requests.
            </div>
          ) : (
            <form onSubmit={handleSendRequest} className="space-y-4 pt-3 border-t border-[#E5E0D8]">
              <h4 className="text-xs font-bold text-[#2C2927] uppercase tracking-wider">
                Send Request to {owner.name.split(' ')[0]}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-[#2C2927] mb-1">
                    Campus Handover Spot
                  </label>
                  <select
                    value={handoverLocation}
                    onChange={(e) => setHandoverLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#2C2927]"
                  >
                    <option value="Student Center, Ground Floor">Student Center (Canteen/Amul)</option>
                    <option value="Central Library Entrance">Central Library Entrance</option>
                    <option value="APJ Lecture Complex Foyer">APJ Abdul Kalam Block</option>
                    <option value="Admin Block Lawn">Admin Block Lawn</option>
                    <option value="Moksha Sports Ground Gate">Moksha Ground Gate</option>
                    <option value="BH-1 / BH-2 Hostel Common Room">Boys Hostels Gate</option>
                    <option value="GH-1 / GH-2 Girls Hostel Gate">Girls Hostels Gate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#2C2927] mb-1">
                    Preferred Time
                  </label>
                  <input
                    type="text"
                    value={handoverTime}
                    onChange={(e) => setHandoverTime(e.target.value)}
                    placeholder="e.g. 1:30 PM or 5:00 PM"
                    className="w-full px-3 py-2 bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#2C2927]"
                  />
                </div>
              </div>

              {listing.listing_type === 'exchange' && (
                <div className="text-xs">
                  <label className="block font-medium text-[#2C2927] mb-1">
                    Select One of Your Items to Offer in Exchange
                  </label>
                  {myItems.length === 0 ? (
                    <p className="text-amber-800 bg-amber-50 p-2.5 border border-amber-200">
                      You have no listed items to offer yet. You can still message the owner or post an item first.
                    </p>
                  ) : (
                    <select
                      value={offeredItemId}
                      onChange={(e) => setOfferedItemId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#2C2927]"
                    >
                      <option value="">-- Choose item to swap --</option>
                      {myItems.map((mi) => (
                        <option key={mi.item_id} value={mi.item_id}>
                          {mi.item_name} ({mi.item_condition})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="text-xs">
                <label className="block font-medium text-[#2C2927] mb-1">
                  Message for Owner
                </label>
                <textarea
                  rows={2}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#2C2927]"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportForm(!showReportForm)}
                  className="text-xs text-[#7A746E] hover:text-[#C82333] flex items-center gap-1"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report listing</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#D96B27] hover:bg-[#C0581A] transition-colors"
                >
                  {isSubmitting
                    ? 'Submitting...'
                    : listing.listing_type === 'lend'
                    ? `Request Borrow (${formatINR(listing.price)} + ${formatINR(listing.deposit_amount)} deposit)`
                    : listing.listing_type === 'donation'
                    ? 'Claim Free Donation'
                    : listing.listing_type === 'exchange'
                    ? 'Propose Exchange'
                    : `Request Purchase (${formatINR(listing.price)})`}
                </button>
              </div>
            </form>
          )}

          {showReportForm && (
            <div className="p-3.5 bg-white border border-[#C82333]/40 space-y-2 text-xs">
              <h5 className="font-semibold text-[#C82333]">Flag listing to Campus Proctor</h5>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#D5CFC7] text-[#2C2927]"
              >
                <option value="Incorrect category or condition">Misleading condition or category</option>
                <option value="Suspected non-student or commercial resale">Suspected commercial resale</option>
                <option value="Offensive or prohibited campus item">Prohibited or damaged item</option>
                <option value="Unreasonable deposit or extortion">Unreasonable deposit terms</option>
              </select>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="px-3 py-1 text-[#524D48] hover:bg-[#EFECE7]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReportListing}
                  className="px-3 py-1 bg-[#C82333] text-white font-medium hover:bg-[#A31B29]"
                >
                  Submit Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
