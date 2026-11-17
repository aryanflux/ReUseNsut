import React, { useState, useEffect } from 'react';
import { db } from './db/dbEngine.ts';
import { User, EnrichedListing, ListingType } from './types/schema.ts';
import { Navbar } from './components/Navbar.tsx';
import { MarketplaceView } from './components/MarketplaceView.tsx';
import { ListingDetailModal } from './components/ListingDetailModal.tsx';
import { CreateListingModal } from './components/CreateListingModal.tsx';
import { BorrowAndLoansView } from './components/BorrowAndLoansView.tsx';
import { OrdersAndRequestsView } from './components/OrdersAndRequestsView.tsx';
import { TrustAndEcoLeaderboard } from './components/TrustAndEcoLeaderboard.tsx';
import { AdminConsoleView } from './components/AdminConsoleView.tsx';
import { SqlExplorerView } from './components/SqlExplorerView.tsx';
import { CampusChatModal } from './components/CampusChatModal.tsx';
import { CheckCircle2 } from 'lucide-react';
import { canAccessAdminConsole, canAccessSqlStudio } from './utils/access.ts';

export default function App() {
  const [, setDbVersion] = useState(0);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    return db.getState().users[0];
  });
  const [activeTab, setActiveTab] = useState<string>('marketplace');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<ListingType[]>([]);
  const [savedOnly, setSavedOnly] = useState<boolean>(false);

  const [selectedListingDetail, setSelectedListingDetail] =
    useState<EnrichedListing | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatReceiverId, setChatReceiverId] = useState<number | null>(null);
  const [chatListingId, setChatListingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setDbVersion((v) => v + 1);
      const refreshedUser = db
        .getState()
        .users.find((u) => u.user_id === currentUser.user_id);
      if (refreshedUser) {
        setCurrentUser(refreshedUser);
      }
    });
    return unsubscribe;
  }, [currentUser.user_id]);

  useEffect(() => {
    if (
      (activeTab === 'admin' && !canAccessAdminConsole(currentUser)) ||
      (activeTab === 'sql' && !canAccessSqlStudio(currentUser))
    ) {
      setActiveTab('marketplace');
    }
  }, [activeTab, currentUser]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 4000);
  };

  const handleOpenChatWith = (receiverId: number, listingId: number) => {
    setChatReceiverId(receiverId);
    setChatListingId(listingId);
    setIsChatModalOpen(true);
  };

  const handleToggleType = (type: ListingType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSetSingleType = (type: ListingType | 'all') => {
    if (type === 'all') {
      setSelectedTypes([]);
    } else {
      setSelectedTypes([type]);
    }
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSavedOnly(false);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F4] text-[#2C2927] font-sans antialiased flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2C2927] text-white px-4 py-3 shadow-xl border border-[#433E3B] flex items-center gap-3 text-xs max-w-md">
          <CheckCircle2 className="w-4 h-4 text-[#D96B27] shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Editorial Two-Tier Header */}
      <Navbar
        currentUser={currentUser}
        onSelectUser={(u) => {
          setCurrentUser(u);
          if (
            (activeTab === 'admin' && !canAccessAdminConsole(u)) ||
            (activeTab === 'sql' && !canAccessSqlStudio(u))
          ) {
            setActiveTab('marketplace');
          }
          showToast(`Switched active view to ${u.name} (${u.account_role})`);
        }}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (
            (tab === 'admin' && !canAccessAdminConsole(currentUser)) ||
            (tab === 'sql' && !canAccessSqlStudio(currentUser))
          ) {
            setActiveTab('marketplace');
            return;
          }
          setActiveTab(tab);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onQuickFilterDonation={() => {
          setSelectedTypes(['donation']);
          setSavedOnly(false);
        }}
        onToggleSavedView={() => {
          setSavedOnly((prev) => !prev);
        }}
        savedOnlyActive={savedOnly}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenChatModal={() => {
          setChatReceiverId(null);
          setChatListingId(null);
          setIsChatModalOpen(true);
        }}
        dbEngine={db}
      />

      {/* Main Content */}
      <main className="flex-1">
        {activeTab === 'marketplace' && (
          <MarketplaceView
            currentUser={currentUser}
            dbEngine={db}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTypes={selectedTypes}
            onToggleType={handleToggleType}
            onSetSingleType={handleSetSingleType}
            savedOnly={savedOnly}
            onToggleSavedOnly={() => setSavedOnly((prev) => !prev)}
            onClearAllFilters={handleClearAllFilters}
            onOpenListingDetail={setSelectedListingDetail}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'borrows' && (
          <BorrowAndLoansView
            currentUser={currentUser}
            dbEngine={db}
            onOpenChatWith={handleOpenChatWith}
            onSuccess={showToast}
          />
        )}

        {activeTab === 'requests' && (
          <OrdersAndRequestsView
            currentUser={currentUser}
            dbEngine={db}
            onOpenChatWith={handleOpenChatWith}
            onSuccess={showToast}
          />
        )}

        {activeTab === 'leaderboard' && (
          <TrustAndEcoLeaderboard currentUser={currentUser} dbEngine={db} />
        )}

        {activeTab === 'admin' && canAccessAdminConsole(currentUser) && (
          <AdminConsoleView
            currentUser={currentUser}
            dbEngine={db}
            onSuccess={showToast}
          />
        )}

        {activeTab === 'sql' && canAccessSqlStudio(currentUser) && (
          <SqlExplorerView currentUser={currentUser} dbEngine={db} />
        )}
      </main>

      {/* Modals */}
      {selectedListingDetail && (
        <ListingDetailModal
          listingItem={selectedListingDetail}
          currentUser={currentUser}
          dbEngine={db}
          onClose={() => setSelectedListingDetail(null)}
          onOpenChatWith={(recId, listId) => {
            setSelectedListingDetail(null);
            handleOpenChatWith(recId, listId);
          }}
          onSuccessAction={showToast}
        />
      )}

      {isCreateModalOpen && (
        <CreateListingModal
          currentUser={currentUser}
          dbEngine={db}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={showToast}
        />
      )}

      {isChatModalOpen && (
        <CampusChatModal
          currentUser={currentUser}
          dbEngine={db}
          onClose={() => setIsChatModalOpen(false)}
          defaultReceiverId={chatReceiverId}
          defaultListingId={chatListingId}
        />
      )}

      {/* Editorial Footer */}
      <footer className="border-t border-[#E5E0D8] bg-[#FAF8F5] py-8 text-xs text-[#7A746E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-serif text-base font-bold text-[#2C2927]">
              ReUseNSUT
            </div>
            <div>
              A circular campus economy platform for student academic reuse, lending, and exchange.
            </div>
          </div>
          <div className="flex items-center gap-4 text-[#7A746E]">
            <span>Secure Student Escrow</span>
            <span aria-hidden="true">·</span>
            <span>Relational Schema (15 Tables)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
