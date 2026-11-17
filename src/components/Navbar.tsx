import React, { useState } from 'react';
import {
  Search,
  Home,
  Clock,
  ArrowLeftRight,
  Leaf,
  ShieldCheck,
  Terminal,
  Tag,
  Bookmark,
  MessageSquare,
  ChevronDown,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { User } from '../types/schema.ts';
import { DatabaseEngine } from '../db/dbEngine.ts';
import { calculateTrustScore } from '../utils/metrics.ts';
import { canAccessAdminConsole, canAccessSqlStudio } from '../utils/access.ts';

interface NavbarProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onQuickFilterDonation: () => void;
  onToggleSavedView: () => void;
  savedOnlyActive: boolean;
  onOpenCreateModal: () => void;
  onOpenChatModal: () => void;
  dbEngine: DatabaseEngine;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  onQuickFilterDonation,
  onToggleSavedView,
  savedOnlyActive,
  onOpenCreateModal,
  onOpenChatModal,
  dbEngine,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const state = dbEngine.getState();
  const allUsers = state.users;

  const trustInfo = calculateTrustScore(
    currentUser.user_id,
    state.reviews,
    state.loans,
    state.transactions,
    state.disputes
  );

  const savedCount = state.savedListings.filter(
    (s) => s.user_id === currentUser.user_id
  ).length;

  const pendingRequestsCount = state.listingRequests.filter((r) => {
    const listing = state.listings.find((l) => l.listing_id === r.listing_id);
    if (!listing) return false;
    const item = state.items.find((i) => i.item_id === listing.item_id);
    return item?.owner_id === currentUser.user_id && r.request_status === 'pending';
  }).length;

  const unreadMessagesCount = state.messages.filter(
    (m) => m.receiver_id === currentUser.user_id && !m.read_at
  ).length;

  const pendingVerificationsCount = state.users.filter(
    (u) => u.verification_status === 'pending'
  ).length;
  const openDisputesCount = state.disputes.filter(
    (d) => d.resolution_status === 'open'
  ).length;
  const hasAdminAccess = canAccessAdminConsole(currentUser);
  const hasSqlAccess = canAccessSqlStudio(currentUser);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab !== 'marketplace') {
      onSelectTab('marketplace');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5] border-b border-[#E5E0D8]">
      {/* Primary Top Tier: Brand Wordmark, Wide Search Bar, Saved Box & User Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
          {/* Editorial Serif Brand Wordmark */}
          <button
            onClick={() => onSelectTab('marketplace')}
            className="flex items-baseline gap-2.5 text-left focus:outline-none group"
          >
            <span className="font-serif text-2xl sm:text-[26px] font-bold tracking-tight text-[#2C2927] group-hover:text-[#D96B27] transition-colors">
              ReUseNSUT
            </span>
          </button>

          {/* Center Editorial Search Bar + Burnt Orange Search Button */}
          <form
            onSubmit={handleSearchSubmit}
            className="order-3 lg:order-2 w-full lg:flex-1 lg:max-w-md flex items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (activeTab !== 'marketplace') {
                  onSelectTab('marketplace');
                }
              }}
              placeholder="Search textbooks, calculators, drafters, kits..."
              aria-label="Search campus listings"
              className="flex-1 h-10 px-3.5 text-xs sm:text-sm bg-[#EFECE7] text-[#2C2927] placeholder:text-[#8E8780] border border-transparent focus:border-[#D96B27] focus:bg-white focus:outline-none transition-colors"
            />
            <button
              type="submit"
              aria-label="Search"
              className="w-10 h-10 bg-[#D96B27] hover:bg-[#C0581A] text-white flex items-center justify-center transition-colors shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right Action Cluster */}
          <div className="order-2 lg:order-3 flex items-center gap-2.5">
            {/* Saved Items Box (Matches reference cart box aesthetic) */}
            <button
              onClick={() => {
                onToggleSavedView();
                if (activeTab !== 'marketplace') {
                  onSelectTab('marketplace');
                }
              }}
              className={`h-10 px-3.5 border text-xs font-medium flex items-center gap-2 transition-colors ${
                savedOnlyActive && activeTab === 'marketplace'
                  ? 'border-[#D96B27] bg-[#D96B27]/10 text-[#D96B27]'
                  : 'border-[#D5CFC7] bg-white hover:border-[#2C2927] text-[#2C2927]'
              }`}
              title="View Saved Items"
            >
              <Bookmark
                className="w-3.5 h-3.5"
                fill={savedOnlyActive ? 'currentColor' : 'none'}
              />
              <span>Saved ({savedCount})</span>
            </button>

            {/* Post Item */}
            <button
              onClick={onOpenCreateModal}
              className="h-10 px-3.5 border border-[#2C2927] bg-[#2C2927] hover:bg-[#1E1C1A] text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Post Item</span>
            </button>

            {/* Messages */}
            <button
              onClick={onOpenChatModal}
              className="relative h-10 w-10 border border-[#D5CFC7] bg-white hover:border-[#2C2927] text-[#2C2927] flex items-center justify-center transition-colors"
              title="Campus Messages"
              aria-label="Open campus messages"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#D96B27] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="h-10 px-2.5 border border-[#D5CFC7] bg-white hover:border-[#2C2927] flex items-center gap-2 text-xs text-[#2C2927] transition-colors focus:outline-none"
                aria-expanded={userDropdownOpen}
                aria-label="Switch user persona"
              >
                <img
                  src={
                    currentUser.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'
                  }
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover border border-[#E5E0D8]"
                />
                <span className="hidden md:inline font-medium max-w-[110px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="hidden md:inline text-[11px] text-[#1E5B3E] font-semibold">
                  ★ {trustInfo.score}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#7A746E]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white border border-[#D5CFC7] shadow-lg py-2 z-50 text-xs">
                  <div className="px-3.5 py-2 border-b border-[#E5E0D8]">
                    <p className="text-[11px] text-[#7A746E] uppercase font-semibold tracking-wider">
                      Switch Active Account
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {allUsers.map((u) => (
                      <button
                        key={u.user_id}
                        onClick={() => {
                          onSelectUser(u);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-[#F9F7F4] transition-colors ${
                          u.user_id === currentUser.user_id
                            ? 'bg-[#F3EFE9] font-semibold'
                            : ''
                        }`}
                      >
                        <img
                          src={
                            u.avatar_url ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'
                          }
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover border border-[#E5E0D8] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[#2C2927] truncate flex items-center justify-between gap-1.5">
                            <span>{u.name}</span>
                            {u.account_role === 'admin' ? (
                              <span className="text-[10px] text-[#D96B27] font-semibold">
                                Admin
                              </span>
                            ) : u.verification_status === 'pending' ? (
                              <span className="text-[10px] text-amber-700">
                                Pending
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#1E5B3E]">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#7A746E] truncate">
                            {u.branch || 'Student'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="px-3.5 pt-2 border-t border-[#E5E0D8] flex items-center justify-between">
                    <span className="text-[11px] text-[#7A746E]">
                      Campus Database
                    </span>
                    <button
                      onClick={() => {
                        dbEngine.resetToDefault();
                        setUserDropdownOpen(false);
                      }}
                      className="text-[11px] text-[#7A746E] hover:text-[#D96B27] flex items-center gap-1 font-medium"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Second Tier: Clean Editorial Text Navigation Bar */}
      <div className="border-t border-[#E5E0D8] bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Primary navigation"
            className="flex items-center justify-between gap-4 overflow-x-auto py-2.5 no-scrollbar text-xs"
          >
            <div className="flex items-center gap-6">
              <button
                onClick={() => onSelectTab('marketplace')}
                className={`flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'marketplace'
                    ? 'text-[#D96B27] font-semibold'
                    : 'text-[#524D48] hover:text-[#2C2927]'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Marketplace</span>
              </button>

              <button
                onClick={() => onSelectTab('borrows')}
                className={`flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'borrows'
                    ? 'text-[#D96B27] font-semibold'
                    : 'text-[#524D48] hover:text-[#2C2927]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Active Loans</span>
              </button>

              <button
                onClick={() => onSelectTab('requests')}
                className={`flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'requests'
                    ? 'text-[#D96B27] font-semibold'
                    : 'text-[#524D48] hover:text-[#2C2927]'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>
                  Requests & Orders
                  {pendingRequestsCount > 0 ? ` (${pendingRequestsCount})` : ''}
                </span>
              </button>

              <button
                onClick={() => onSelectTab('leaderboard')}
                className={`flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'leaderboard'
                    ? 'text-[#D96B27] font-semibold'
                    : 'text-[#524D48] hover:text-[#2C2927]'
                }`}
              >
                <Leaf className="w-3.5 h-3.5" />
                <span>Trust & Sustainability</span>
              </button>

              {hasAdminAccess && (
                <button
                  onClick={() => onSelectTab('admin')}
                  className={`flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeTab === 'admin'
                      ? 'text-[#D96B27] font-semibold'
                      : 'text-[#524D48] hover:text-[#2C2927]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    Admin Console
                    {pendingVerificationsCount + openDisputesCount > 0
                      ? ` (${pendingVerificationsCount + openDisputesCount})`
                      : ''}
                  </span>
                </button>
              )}

              {hasSqlAccess && (
                <button
                  onClick={() => onSelectTab('sql')}
                  className={`flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    activeTab === 'sql'
                      ? 'text-[#D96B27] font-semibold'
                      : 'text-[#524D48] hover:text-[#2C2927]'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>SQL Studio</span>
                </button>
              )}
            </div>

            {/* Right Crimson Highlight Link (Matches SALE link in reference UI) */}
            <button
              onClick={() => {
                onQuickFilterDonation();
                if (activeTab !== 'marketplace') {
                  onSelectTab('marketplace');
                }
              }}
              className="flex items-center gap-1.5 whitespace-nowrap text-[#C82333] hover:text-[#A31B29] font-semibold shrink-0"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>FREE DONATIONS</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
