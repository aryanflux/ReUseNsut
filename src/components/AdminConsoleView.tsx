import React, { useState } from 'react';
import { CheckCircle, ShieldAlert } from 'lucide-react';
import { User } from '../types/schema.ts';
import { DatabaseEngine } from '../db/dbEngine.ts';
import { canAccessAdminConsole } from '../utils/access.ts';

interface AdminConsoleViewProps {
  currentUser: User;
  dbEngine: DatabaseEngine;
  onSuccess: (message: string) => void;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({
  currentUser,
  dbEngine,
  onSuccess,
}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<
    'verification' | 'disputes' | 'reports' | 'database'
  >('verification');
  const [resolutionText, setResolutionText] = useState(
    'Proctor verified transaction log. Security deposit released.'
  );
  const [resolvingDisputeId, setResolvingDisputeId] = useState<number | null>(
    null
  );

  if (!canAccessAdminConsole(currentUser)) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white border border-[#E5E0D8] p-8 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-[#C82333] mx-auto" />
          <h2 className="font-serif text-xl font-bold text-[#2C2927]">
            Admin Console Access Restricted
          </h2>
          <p className="text-xs text-[#7A746E]">
            This console is restricted to faculty/proctor administrators and authorized coordinator accounts.
          </p>
        </div>
      </div>
    );
  }

  const state = dbEngine.getState();
  const { users, disputes, reports } = state;

  const pendingUsers = users.filter((u) => u.verification_status === 'pending');
  const openDisputes = disputes.filter(
    (d) => d.resolution_status === 'open' || d.resolution_status === 'under_review'
  );

  const handleVerify = (
    userId: number,
    studentName: string,
    status: 'verified' | 'rejected'
  ) => {
    dbEngine.verifyUser(userId, status);
    onSuccess(
      `Student ${studentName} verification status updated to "${status}".`
    );
  };

  const handleResolveDispute = (
    disputeId: number,
    status: 'resolved' | 'rejected'
  ) => {
    dbEngine.resolveDispute(disputeId, resolutionText, status);
    onSuccess(`Dispute #${disputeId} marked as ${status}.`);
    setResolvingDisputeId(null);
  };

  const tableCounts = [
    { name: 'Users', count: state.users.length },
    { name: 'Categories', count: state.categories.length },
    { name: 'Items', count: state.items.length },
    { name: 'Item_Images', count: state.itemImages.length },
    { name: 'Listings', count: state.listings.length },
    { name: 'Listing_Requests', count: state.listingRequests.length },
    { name: 'Transactions', count: state.transactions.length },
    { name: 'Loans', count: state.loans.length },
    { name: 'Payments', count: state.payments.length },
    { name: 'Reviews', count: state.reviews.length },
    { name: 'Disputes', count: state.disputes.length },
    { name: 'Saved_Listings', count: state.savedListings.length },
    { name: 'Reports', count: state.reports.length },
    { name: 'Report_Actions', count: state.reportActions.length },
    { name: 'Messages', count: state.messages.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-6">
      {/* Header */}
      <div className="bg-[#2C2927] p-6 sm:p-8 text-white space-y-3 border border-[#1E1C1A]">
        <div className="flex items-center gap-2 text-xs font-medium text-[#D96B27]">
          <span>Faculty &amp; Proctor Administrative Controls</span>
          <span aria-hidden="true">·</span>
          <span>Security &amp; Verification</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">
              Campus Admin &amp; Proctor Console
            </h1>
            <p className="text-xs text-[#CFC9C2] mt-1">
              Active Reviewer: <span className="text-white font-semibold">{currentUser.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-[#3D3936] text-[#F5C6A5] font-medium">
              {pendingUsers.length} Pending Verifications
            </span>
            <span className="px-3 py-1 bg-[#C82333] text-white font-medium">
              {openDisputes.length} Open Disputes
            </span>
          </div>
        </div>

        <div className="pt-3 flex gap-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedSubTab('verification')}
            className={`px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedSubTab === 'verification'
                ? 'bg-[#D96B27] text-white'
                : 'bg-[#3D3936] text-[#CFC9C2] hover:text-white'
            }`}
          >
            Verification Queue ({pendingUsers.length})
          </button>
          <button
            onClick={() => setSelectedSubTab('disputes')}
            className={`px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedSubTab === 'disputes'
                ? 'bg-[#D96B27] text-white'
                : 'bg-[#3D3936] text-[#CFC9C2] hover:text-white'
            }`}
          >
            Disputes Desk ({openDisputes.length})
          </button>
          <button
            onClick={() => setSelectedSubTab('reports')}
            className={`px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedSubTab === 'reports'
                ? 'bg-[#D96B27] text-white'
                : 'bg-[#3D3936] text-[#CFC9C2] hover:text-white'
            }`}
          >
            Proctor Reports ({reports.length})
          </button>
          <button
            onClick={() => setSelectedSubTab('database')}
            className={`px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedSubTab === 'database'
                ? 'bg-[#D96B27] text-white'
                : 'bg-[#3D3936] text-[#CFC9C2] hover:text-white'
            }`}
          >
            Database Schema Health (15 Tables)
          </button>
        </div>
      </div>

      {/* SubTab 1: Verification Queue */}
      {selectedSubTab === 'verification' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#7A746E] border-b border-[#E5E0D8] pb-2">
            <span>Verify student credentials and institutional email accounts</span>
            <span>{pendingUsers.length} waiting</span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="bg-white border border-[#E5E0D8] p-10 text-center text-xs text-[#7A746E] space-y-2">
              <CheckCircle className="w-8 h-8 text-[#1E5B3E] mx-auto" />
              <p className="font-semibold text-[#2C2927]">
                All registered students are verified
              </p>
              <p>No new account requests pending approval.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pendingUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="bg-white border border-[#E5E0D8] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          user.avatar_url ||
                          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80'
                        }
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#E5E0D8]"
                      />
                      <div>
                        <h4 className="font-serif font-bold text-[#2C2927] text-base">
                          {user.name}
                        </h4>
                        <div className="text-xs text-[#7A746E] font-mono">
                          {user.roll_number}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-[#D96B27] text-white">
                      Pending
                    </span>
                  </div>

                  <div className="bg-[#FAF8F5] p-3.5 border border-[#E5E0D8] text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#7A746E]">University Email:</span>
                      <span className="font-mono text-[#2C2927]">
                        {user.university_email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7A746E]">Branch &amp; Year:</span>
                      <span className="text-[#2C2927]">
                        {user.branch} · {user.year}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7A746E]">Hostel Status:</span>
                      <span className="text-[#2C2927]">
                        {user.hostel_status || 'Day Scholar'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7A746E]">Registered On:</span>
                      <span className="text-[#2C2927]">
                        {new Date(user.joined_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E0D8]">
                    <button
                      onClick={() =>
                        handleVerify(user.user_id, user.name, 'rejected')
                      }
                      className="px-3.5 py-1.5 text-xs text-[#C82333] border border-[#C82333]/40 hover:bg-[#C82333] hover:text-white font-medium transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() =>
                        handleVerify(user.user_id, user.name, 'verified')
                      }
                      className="px-4 py-1.5 text-xs bg-[#1E5B3E] hover:bg-[#174830] text-white font-semibold transition-colors"
                    >
                      Approve Student Account
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab 2: Disputes Desk */}
      {selectedSubTab === 'disputes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#7A746E] border-b border-[#E5E0D8] pb-2">
            <span>Formal complaints regarding unreturned or damaged items</span>
            <span>{disputes.length} total logged</span>
          </div>

          <div className="space-y-4">
            {disputes.map((disp) => {
              const raiser = users.find((u) => u.user_id === disp.raised_by);

              return (
                <div
                  key={disp.dispute_id}
                  className="bg-white border border-[#E5E0D8] p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[11px] text-[#7A746E]">
                        Dispute #{disp.dispute_id} · Transaction #{disp.transaction_id}
                      </div>
                      <h4 className="font-serif font-bold text-[#2C2927] text-base">
                        {disp.dispute_reason}
                      </h4>
                      <div className="text-xs text-[#7A746E]">
                        Raised by{' '}
                        <span className="font-semibold text-[#2C2927]">
                          {raiser?.name}
                        </span>{' '}
                        on {new Date(disp.raised_at).toLocaleString()}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-semibold px-2.5 py-1 capitalize ${
                        disp.resolution_status === 'resolved'
                          ? 'bg-[#1E5B3E] text-white'
                          : disp.resolution_status === 'rejected'
                          ? 'bg-[#EFECE7] text-[#524D48]'
                          : 'bg-[#C82333] text-white'
                      }`}
                    >
                      {disp.resolution_status}
                    </span>
                  </div>

                  <p className="text-xs text-[#524D48] bg-[#FAF8F5] p-3.5 border border-[#E5E0D8] leading-relaxed">
                    &ldquo;{disp.description}&rdquo;
                  </p>

                  {disp.resolution && (
                    <div className="text-xs bg-[#FAF8F5] text-[#1E5B3E] p-3.5 border border-[#1E5B3E]/30">
                      <span className="font-semibold">
                        Official Proctor Resolution:
                      </span>{' '}
                      {disp.resolution}
                      {disp.resolved_at && (
                        <span className="block text-[11px] text-[#7A746E] mt-1">
                          Resolved at: {new Date(disp.resolved_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  {disp.resolution_status === 'open' && (
                    <div className="pt-2 border-t border-[#E5E0D8] space-y-2">
                      {resolvingDisputeId === disp.dispute_id ? (
                        <div className="space-y-2 text-xs">
                          <label className="block font-semibold text-[#2C2927]">
                            Enter Official Resolution Notes:
                          </label>
                          <textarea
                            rows={2}
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#2C2927]"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setResolvingDisputeId(null)}
                              className="px-3 py-1.5 text-[#7A746E] hover:text-[#2C2927]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() =>
                                handleResolveDispute(disp.dispute_id, 'rejected')
                              }
                              className="px-3 py-1.5 text-[#C82333] border border-[#C82333]/40 hover:bg-[#C82333] hover:text-white font-medium"
                            >
                              Dismiss Complaint
                            </button>
                            <button
                              onClick={() =>
                                handleResolveDispute(disp.dispute_id, 'resolved')
                              }
                              className="px-4 py-1.5 bg-[#1E5B3E] hover:bg-[#174830] text-white font-semibold"
                            >
                              Confirm Resolution
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <button
                            onClick={() => setResolvingDisputeId(disp.dispute_id)}
                            className="px-4 py-1.5 text-xs font-semibold bg-[#D96B27] hover:bg-[#C0581A] text-white"
                          >
                            Resolve Complaint
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 3: Reports */}
      {selectedSubTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#7A746E] border-b border-[#E5E0D8] pb-2">
            <span>Flagged user behavior and listing policy reviews</span>
            <span>{reports.length} reports</span>
          </div>

          <div className="space-y-3">
            {reports.map((rep) => {
              const reporter = users.find((u) => u.user_id === rep.reporter_id);
              return (
                <div
                  key={rep.report_id}
                  className="bg-white border border-[#E5E0D8] p-4 text-xs space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#2C2927]">
                      {rep.report_reason}
                    </span>
                    <span className="text-[11px] uppercase font-semibold px-2 py-0.5 bg-[#EFECE7] text-[#524D48]">
                      {rep.report_status}
                    </span>
                  </div>
                  <p className="text-[#524D48] italic">
                    &ldquo;{rep.description}&rdquo;
                  </p>
                  <div className="text-[11px] text-[#7A746E]">
                    Reported by {reporter?.name} on{' '}
                    {new Date(rep.reported_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 4: Database Schema Health */}
      {selectedSubTab === 'database' && (
        <div className="bg-white border border-[#E5E0D8] p-6 space-y-4">
          <div>
            <h3 className="font-serif font-bold text-[#2C2927] text-base">
              Live 15-Table Relational Schema Audit
            </h3>
            <p className="text-xs text-[#7A746E]">
              All relational tables are active in-memory with synchronized query bindings.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {tableCounts.map((tbl) => (
              <div
                key={tbl.name}
                className="p-3.5 bg-[#FAF8F5] border border-[#E5E0D8] text-xs space-y-1"
              >
                <div className="text-[#7A746E] font-mono font-medium truncate">
                  {tbl.name}
                </div>
                <div className="text-lg font-bold text-[#2C2927]">
                  {tbl.count} rows
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
