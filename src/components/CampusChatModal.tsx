import React, { useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { User } from '../types/schema.ts';
import { DatabaseEngine } from '../db/dbEngine.ts';

interface CampusChatModalProps {
  currentUser: User;
  dbEngine: DatabaseEngine;
  onClose: () => void;
  defaultReceiverId?: number | null;
  defaultListingId?: number | null;
}

export const CampusChatModal: React.FC<CampusChatModalProps> = ({
  currentUser,
  dbEngine,
  onClose,
  defaultReceiverId,
  defaultListingId,
}) => {
  const state = dbEngine.getState();
  const { messages, users } = state;

  const chatPartnerIds = Array.from(
    new Set(
      messages
        .filter(
          (m) =>
            m.sender_id === currentUser.user_id ||
            m.receiver_id === currentUser.user_id
        )
        .map((m) =>
          m.sender_id === currentUser.user_id ? m.receiver_id : m.sender_id
        )
    )
  );

  if (defaultReceiverId && !chatPartnerIds.includes(defaultReceiverId)) {
    chatPartnerIds.unshift(defaultReceiverId);
  }

  const [selectedPartnerId, setSelectedPartnerId] = useState<number>(
    defaultReceiverId || (chatPartnerIds.length > 0 ? chatPartnerIds[0] : 2)
  );
  const [inputText, setInputText] = useState('');

  const activePartner = users.find((u) => u.user_id === selectedPartnerId);

  const conversationMessages = messages.filter(
    (m) =>
      (m.sender_id === currentUser.user_id &&
        m.receiver_id === selectedPartnerId) ||
      (m.sender_id === selectedPartnerId &&
        m.receiver_id === currentUser.user_id)
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    dbEngine.sendMessage({
      senderId: currentUser.user_id,
      receiverId: selectedPartnerId,
      listingId: defaultListingId || null,
      messageText: inputText.trim(),
    });

    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2C2927]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] max-w-2xl w-full h-[540px] shadow-2xl border border-[#D5CFC7] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E5E0D8] bg-white">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-[#D96B27]" />
            <div>
              <h3 className="font-serif font-bold text-[#2C2927] text-base">
                Campus Messages
              </h3>
              <p className="text-[11px] text-[#7A746E]">
                Coordinate handovers, condition checks &amp; returns
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7A746E] hover:text-[#2C2927] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-[#E5E0D8] bg-[#FAF8F5] flex flex-col">
            <div className="p-3 border-b border-[#E5E0D8] text-[11px] font-semibold text-[#7A746E] uppercase tracking-wider">
              Conversations ({chatPartnerIds.length})
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-[#E5E0D8]">
              {chatPartnerIds.map((partnerId) => {
                const partner = users.find((u) => u.user_id === partnerId);
                if (!partner) return null;
                const isSelected = selectedPartnerId === partnerId;

                return (
                  <button
                    key={partnerId}
                    onClick={() => setSelectedPartnerId(partnerId)}
                    className={`w-full p-3 text-left flex items-center gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-white font-semibold border-l-2 border-l-[#D96B27]'
                        : 'hover:bg-[#EFECE7]/60'
                    }`}
                  >
                    <img
                      src={
                        partner.avatar_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'
                      }
                      alt={partner.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#E5E0D8] shrink-0"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="text-[#2C2927] truncate">{partner.name}</div>
                      <div className="text-[10px] text-[#7A746E] truncate">
                        {partner.branch || 'Student'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Thread */}
          <div className="flex-1 flex flex-col bg-white">
            {activePartner && (
              <div className="px-4 py-2.5 border-b border-[#E5E0D8] flex items-center justify-between text-xs bg-[#FAF8F5]/60">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#2C2927]">
                    {activePartner.name}
                  </span>
                  <span className="text-[11px] text-[#7A746E]">
                    ({activePartner.branch || 'Student'})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#7A746E]">
                  {activePartner.phone}
                </span>
              </div>
            )}

            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {conversationMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#7A746E] text-xs">
                  No messages yet. Suggest a campus meeting spot to coordinate handover.
                </div>
              ) : (
                conversationMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.user_id;
                  return (
                    <div
                      key={msg.message_id}
                      className={`flex flex-col ${
                        isMe ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[75%] px-3.5 py-2 text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#D96B27] text-white'
                            : 'bg-[#EFECE7] text-[#2C2927]'
                        }`}
                      >
                        {msg.message_text}
                      </div>
                      <span className="text-[10px] text-[#8E8780] mt-1 px-1">
                        {new Date(msg.sent_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-[#E5E0D8] flex gap-2 bg-[#FAF8F5]"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activePartner?.name?.split(' ')[0] || 'student'}...`}
                className="flex-1 px-3 py-2 text-xs bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#2C2927]"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="px-4 py-2 bg-[#D96B27] hover:bg-[#C0581A] text-white transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
