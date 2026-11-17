import React, { useState } from 'react';
import {
  ArrowLeftRight,
  MapPin,
  Clock,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { User } from '../types/schema.ts';
import { DatabaseEngine } from '../db/dbEngine.ts';
import { formatINR } from '../utils/metrics.ts';

interface OrdersAndRequestsViewProps {
  currentUser: User;
  dbEngine: DatabaseEngine;
  onOpenChatWith: (receiverId: number, listingId: number) => void;
  onSuccess: (message: string) => void;
}

export const OrdersAndRequestsView: React.FC<OrdersAndRequestsViewProps> = ({
  currentUser,
  dbEngine,
  onOpenChatWith,
  onSuccess,
}) => {
  const [filterType, setFilterType] = useState<'incoming' | 'outgoing'>('incoming');
  const state = dbEngine.getState();
  const { listingRequests, listings, items, users, transactions } = state;

  const incomingRequests = listingRequests
    .map((req) => {
      const listing = listings.find((l) => l.listing_id === req.listing_id);
      if (!listing) return null;
      const item = items.find((i) => i.item_id === listing.item_id);
      if (!item || item.owner_id !== currentUser.user_id) return null;

      const requester = users.find((u) => u.user_id === req.requester_id);
      const offeredItem = req.offered_item_id
        ? items.find((i) => i.item_id === req.offered_item_id)
        : null;
      const tx = transactions.find((t) => t.request_id === req.request_id);

      return {
        request: req,
        listing,
        item,
        requester,
        offeredItem,
        transaction: tx,
      };
    })
    .filter(Boolean) as any[];

  const outgoingRequests = listingRequests
    .map((req) => {
      if (req.requester_id !== currentUser.user_id) return null;
      const listing = listings.find((l) => l.listing_id === req.listing_id);
      if (!listing) return null;
      const item = items.find((i) => i.item_id === listing.item_id);
      if (!item) return null;
      const owner = users.find((u) => u.user_id === item.owner_id);
      const offeredItem = req.offered_item_id
        ? items.find((i) => i.item_id === req.offered_item_id)
        : null;
      const tx = transactions.find((t) => t.request_id === req.request_id);

      return {
        request: req,
        listing,
        item,
        owner,
        offeredItem,
        transaction: tx,
      };
    })
    .filter(Boolean) as any[];

  const handleAcceptRequest = (requestId: number, requesterName: string) => {
    dbEngine.acceptRequest(requestId);
    onSuccess(
      `Request from ${requesterName} accepted! Order created with designated campus handover spot.`
    );
  };

  const handleRejectRequest = (requestId: number) => {
    dbEngine.rejectRequest(requestId);
    onSuccess('Request declined.');
  };

  const handleCompleteHandover = (txId: number) => {
    dbEngine.completeTransaction(txId);
    onSuccess('Handover confirmed complete! Sustainability points and record updated.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-6">
      {/* Header */}
      <div className="bg-[#2C2927] p-6 sm:p-8 text-white space-y-3 border border-[#1E1C1A]">
        <div className="flex items-center gap-2 text-xs font-medium text-[#D96B27]">
          <span>Campus Handovers</span>
          <span aria-hidden="true">·</span>
          <span>Order Management &amp; Meeting Points</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">
          Requests &amp; Handover Orders
        </h1>
        <p className="text-xs text-[#CFC9C2] max-w-2xl leading-relaxed">
          Review incoming requests on your items, agree on campus meeting places (Student Center, Central Library, Amul Cafe), and record handovers.
        </p>

        <div className="pt-3 flex gap-3">
          <button
            onClick={() => setFilterType('incoming')}
            className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
              filterType === 'incoming'
                ? 'bg-[#D96B27] text-white'
                : 'bg-[#3D3936] text-[#CFC9C2] hover:text-white'
            }`}
          >
            Incoming on My Items ({incomingRequests.length})
          </button>
          <button
            onClick={() => setFilterType('outgoing')}
            className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
              filterType === 'outgoing'
                ? 'bg-[#D96B27] text-white'
                : 'bg-[#3D3936] text-[#CFC9C2] hover:text-white'
            }`}
          >
            My Outgoing Requests ({outgoingRequests.length})
          </button>
        </div>
      </div>

      {/* Incoming Requests */}
      {filterType === 'incoming' && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="bg-white border border-[#E5E0D8] p-10 text-center text-xs text-[#7A746E] space-y-2">
              <ArrowLeftRight className="w-8 h-8 text-[#9E978E] mx-auto" />
              <p className="font-semibold text-[#2C2927]">No incoming requests yet</p>
              <p>When peers request your items, their offers appear here for approval.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map((entry) => (
                <div
                  key={entry.request.request_id}
                  className="bg-white border border-[#E5E0D8] p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E0D8] pb-3">
                    <div>
                      <div className="text-[11px] text-[#7A746E]">
                        Request #{entry.request.request_id} · Item #{entry.item.item_id}
                      </div>
                      <h3 className="font-serif font-bold text-[#2C2927] text-base">
                        {entry.item.item_name}
                      </h3>
                      <div className="text-xs text-[#7A746E] capitalize">
                        Mode: {entry.listing.listing_type}
                        {entry.listing.listing_type !== 'donation' &&
                          entry.listing.listing_type !== 'exchange' && (
                            <span className="font-semibold text-[#D96B27] ml-1.5">
                              ({formatINR(entry.listing.price)})
                            </span>
                          )}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-semibold px-3 py-1 capitalize self-start sm:self-center ${
                        entry.request.request_status === 'accepted'
                          ? 'bg-[#1E5B3E] text-white'
                          : entry.request.request_status === 'pending'
                          ? 'bg-[#D96B27] text-white'
                          : 'bg-[#EFECE7] text-[#524D48]'
                      }`}
                    >
                      {entry.request.request_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2 bg-[#FAF8F5] p-3.5 border border-[#E5E0D8]">
                      <div className="font-semibold text-[#2C2927]">
                        Requester: {entry.requester?.name}
                      </div>
                      <p className="text-[#524D48] italic">
                        &ldquo;{entry.request.request_message}&rdquo;
                      </p>
                      {entry.offeredItem && (
                        <div className="p-2 bg-white border border-[#D5CFC7] text-[#2C2927]">
                          <span className="font-semibold">Offered in Barter:</span>{' '}
                          {entry.offeredItem.item_name} ({entry.offeredItem.item_condition})
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 bg-[#FAF8F5] p-3.5 border border-[#E5E0D8]">
                      <div className="flex items-center gap-1.5 text-[#2C2927] font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#D96B27] shrink-0" />
                        <span>
                          Spot: {entry.request.handover_location || 'Campus Student Center'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#524D48]">
                        <Clock className="w-3.5 h-3.5 text-[#7A746E] shrink-0" />
                        <span>
                          Time: {entry.request.handover_time || 'Lunch Break'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#7A746E] pt-1.5 border-t border-[#E5E0D8]">
                        Received {new Date(entry.request.requested_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() =>
                        onOpenChatWith(
                          entry.requester?.user_id,
                          entry.listing.listing_id
                        )
                      }
                      className="text-xs text-[#524D48] hover:text-[#D96B27] font-medium flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat with {entry.requester?.name?.split(' ')[0]}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {entry.request.request_status === 'pending' && (
                        <>
                          <button
                            onClick={() =>
                              handleRejectRequest(entry.request.request_id)
                            }
                            className="px-3.5 py-1.5 text-xs text-[#524D48] border border-[#D5CFC7] hover:border-[#2C2927]"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() =>
                              handleAcceptRequest(
                                entry.request.request_id,
                                entry.requester?.name
                              )
                            }
                            className="px-4 py-1.5 bg-[#D96B27] hover:bg-[#C0581A] text-white text-xs font-semibold"
                          >
                            Accept Handover
                          </button>
                        </>
                      )}

                      {entry.request.request_status === 'accepted' &&
                        entry.transaction && (
                          <button
                            onClick={() =>
                              handleCompleteHandover(entry.transaction.transaction_id)
                            }
                            className="px-4 py-1.5 bg-[#2C2927] hover:bg-[#1E1C1A] text-white text-xs font-semibold"
                          >
                            Confirm Handover Complete
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Outgoing Requests */}
      {filterType === 'outgoing' && (
        <div className="space-y-4">
          {outgoingRequests.length === 0 ? (
            <div className="bg-white border border-[#E5E0D8] p-10 text-center text-xs text-[#7A746E] space-y-2">
              <ArrowLeftRight className="w-8 h-8 text-[#9E978E] mx-auto" />
              <p className="font-semibold text-[#2C2927]">
                You haven&apos;t requested any items yet
              </p>
              <p>Browse the Marketplace to request textbooks, calculators, or drafters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {outgoingRequests.map((entry) => (
                <div
                  key={entry.request.request_id}
                  className="bg-white border border-[#E5E0D8] p-5 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
                    <div>
                      <div className="text-[11px] text-[#7A746E]">
                        Request #{entry.request.request_id}
                      </div>
                      <h3 className="font-serif font-bold text-[#2C2927] text-base">
                        {entry.item.item_name}
                      </h3>
                      <div className="text-xs text-[#7A746E]">
                        Owner:{' '}
                        <span className="font-medium text-[#2C2927]">
                          {entry.owner?.name}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-semibold px-3 py-1 capitalize ${
                        entry.request.request_status === 'accepted'
                          ? 'bg-[#1E5B3E] text-white'
                          : entry.request.request_status === 'pending'
                          ? 'bg-[#D96B27] text-white'
                          : 'bg-[#EFECE7] text-[#524D48]'
                      }`}
                    >
                      {entry.request.request_status}
                    </span>
                  </div>

                  <div className="bg-[#FAF8F5] p-3.5 border border-[#E5E0D8] text-xs space-y-1.5">
                    <p className="text-[#524D48] italic">
                      &ldquo;{entry.request.request_message}&rdquo;
                    </p>
                    <div className="text-[#7A746E] pt-1.5 border-t border-[#E5E0D8] flex flex-wrap gap-4">
                      <span>Location: {entry.request.handover_location}</span>
                      <span>Time: {entry.request.handover_time}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() =>
                        onOpenChatWith(
                          entry.owner?.user_id,
                          entry.listing.listing_id
                        )
                      }
                      className="text-xs text-[#524D48] hover:text-[#D96B27] font-medium flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat with {entry.owner?.name?.split(' ')[0]}</span>
                    </button>

                    {entry.request.request_status === 'accepted' && (
                      <span className="text-xs font-semibold text-[#1E5B3E] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accepted · Meet at {entry.request.handover_location}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
