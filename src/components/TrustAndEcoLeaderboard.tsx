import React from 'react';
import { Leaf, Shield, Star } from 'lucide-react';
import { User } from '../types/schema.ts';
import { DatabaseEngine } from '../db/dbEngine.ts';
import {
  calculateTrustScore,
  calculateSustainabilityPoints,
  formatINR,
} from '../utils/metrics.ts';

interface TrustAndEcoLeaderboardProps {
  currentUser: User;
  dbEngine: DatabaseEngine;
}

export const TrustAndEcoLeaderboard: React.FC<TrustAndEcoLeaderboardProps> = ({
  currentUser,
  dbEngine,
}) => {
  const state = dbEngine.getState();
  const {
    users,
    transactions,
    listings,
    listingRequests,
    items,
    reviews,
    loans,
    disputes,
  } = state;

  const studentRankings = users
    .filter((u) => u.account_role === 'student')
    .map((user) => {
      const eco = calculateSustainabilityPoints(
        user.user_id,
        transactions,
        listings,
        listingRequests,
        items
      );
      const trust = calculateTrustScore(
        user.user_id,
        reviews,
        loans,
        transactions,
        disputes
      );

      return {
        user,
        eco,
        trust,
      };
    })
    .sort((a, b) => b.eco.totalPoints - a.eco.totalPoints);

  const myTrust = calculateTrustScore(
    currentUser.user_id,
    reviews,
    loans,
    transactions,
    disputes
  );
  const myEco = calculateSustainabilityPoints(
    currentUser.user_id,
    transactions,
    listings,
    listingRequests,
    items
  );

  const completedTx = transactions.filter(
    (t) => t.transaction_status === 'completed'
  );
  const estimatedSavings = completedTx.length * 520;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-6">
      {/* Banner */}
      <div className="bg-[#2C2927] p-6 sm:p-8 text-white space-y-4 border border-[#1E1C1A]">
        <div className="flex items-center gap-2 text-xs font-medium text-[#D96B27]">
          <span>Trust Scoring</span>
          <span aria-hidden="true">·</span>
          <span>Campus Circular Economy</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">
          Sustainability Points &amp; Trust Metric
        </h1>
        <p className="text-xs text-[#CFC9C2] max-w-2xl leading-relaxed">
          Students earn sustainability eco-points every time they donate, lend, exchange, or sell used course items. Trust scores protect lenders by tracking on-time returns and peer reviews.
        </p>

        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#433E3B] text-xs">
          <div>
            <div className="text-xl font-bold text-[#D96B27]">
              {studentRankings.reduce((sum, r) => sum + r.eco.totalPoints, 0)}
            </div>
            <div className="text-[#CFC9C2]">Total Eco Points Earned</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              {completedTx.length} items
            </div>
            <div className="text-[#CFC9C2]">Kept in Campus Circulation</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              {formatINR(estimatedSavings)}
            </div>
            <div className="text-[#CFC9C2]">Est. Student Money Saved</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#1E5B3E] bg-white/95 inline-block px-2 py-0.5">
              98.2%
            </div>
            <div className="text-[#CFC9C2] mt-1">On-Time Loan Return Rate</div>
          </div>
        </div>
      </div>

      {/* Current User Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-[#E5E0D8] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#1E5B3E]" />
              <h3 className="font-serif font-bold text-[#2C2927] text-base">
                Your Campus Trust Score
              </h3>
            </div>
            <span className="text-xs font-semibold text-[#1E5B3E]">
              {myTrust.level}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#2C2927]">
              {myTrust.score}
            </span>
            <span className="text-xs text-[#7A746E] font-medium">
              / 100 points
            </span>
          </div>

          <div className="text-xs text-[#524D48] space-y-1.5 pt-3 border-t border-[#E5E0D8]">
            <div className="flex justify-between">
              <span className="text-[#7A746E]">Peer Rating Average:</span>
              <span className="font-semibold text-[#2C2927]">
                ★ {myTrust.averageRating} / 5 ({myTrust.totalReviews} reviews)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A746E]">On-Time Return Punctuality:</span>
              <span className="font-semibold text-[#2C2927]">
                {myTrust.onTimeReturnRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A746E]">Active Disputes Penalty:</span>
              <span className="font-semibold text-[#2C2927]">
                -{myTrust.disputePenalty} pts
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D8] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-[#D96B27]" />
              <h3 className="font-serif font-bold text-[#2C2927] text-base">
                Your Sustainability Eco Points
              </h3>
            </div>
            <span className="text-xs font-semibold text-[#D96B27]">
              Level {Math.floor(myEco.totalPoints / 50) + 1} Contributor
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#D96B27]">
              {myEco.totalPoints}
            </span>
            <span className="text-xs text-[#7A746E] font-medium">
              eco points
            </span>
          </div>

          <div className="text-xs text-[#524D48] space-y-1.5 pt-3 border-t border-[#E5E0D8]">
            <div className="flex justify-between">
              <span className="text-[#7A746E]">
                Free Course Donations (+50 pts ea):
              </span>
              <span className="font-semibold text-[#2C2927]">
                {myEco.donationsCount} items
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A746E]">
                Items Lent / Borrowed (+30 pts ea):
              </span>
              <span className="font-semibold text-[#2C2927]">
                {myEco.lendsCount} items
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A746E]">
                Second-Hand Sales (+20 pts ea):
              </span>
              <span className="font-semibold text-[#2C2927]">
                {myEco.salesCount} items
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white border border-[#E5E0D8] overflow-hidden">
        <div className="p-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-[#2C2927] text-base">
              Green Sharing Leaderboard
            </h3>
            <p className="text-xs text-[#7A746E]">
              Recognizing students keeping books and gear in active circulation
            </p>
          </div>
          <span className="text-xs text-[#7A746E]">Live database sync</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#524D48]">
            <thead className="bg-[#FAF8F5] text-[#7A746E] uppercase text-[10px] tracking-wider border-b border-[#E5E0D8]">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Trust Score</th>
                <th className="px-4 py-3 text-right">Eco Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8]">
              {studentRankings.map((entry, idx) => (
                <tr
                  key={entry.user.user_id}
                  className={`hover:bg-[#FAF8F5] transition-colors ${
                    entry.user.user_id === currentUser.user_id
                      ? 'bg-[#F3EFE9]/60 font-semibold'
                      : ''
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-[#2C2927]">
                    {idx === 0
                      ? '🥇 #1'
                      : idx === 1
                      ? '🥈 #2'
                      : idx === 2
                      ? '🥉 #3'
                      : `#${idx + 1}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          entry.user.avatar_url ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'
                        }
                        alt={entry.user.name}
                        className="w-6 h-6 rounded-full object-cover border border-[#E5E0D8]"
                      />
                      <span className="text-[#2C2927]">{entry.user.name}</span>
                      {entry.user.user_id === currentUser.user_id && (
                        <span className="text-[10px] text-[#D96B27] font-semibold">
                          (You)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#7A746E]">{entry.user.branch}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-[#1E5B3E]">
                      ★ {entry.trust.score}/100
                    </span>
                    <span className="text-[11px] text-[#7A746E] ml-1">
                      ({entry.trust.totalReviews} reviews)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#D96B27] text-sm">
                    {entry.eco.totalPoints} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Peer Reviews Feed */}
      <div className="bg-white border border-[#E5E0D8] p-5 space-y-4">
        <h3 className="font-serif font-bold text-[#2C2927] text-base">
          Recent Verified Student Reviews
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((rev) => {
            const reviewer = users.find((u) => u.user_id === rev.reviewer_id);
            const reviewee = users.find((u) => u.user_id === rev.reviewee_id);

            return (
              <div
                key={rev.review_id}
                className="p-4 bg-[#FAF8F5] border border-[#E5E0D8] text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-[#2C2927]">
                    {reviewer?.name.split(' ')[0]} → {reviewee?.name.split(' ')[0]}
                  </div>
                  <div className="flex text-[#D96B27]">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-[#524D48] italic">&ldquo;{rev.comment}&rdquo;</p>
                <div className="text-[11px] text-[#7A746E]">
                  {new Date(rev.created_at).toLocaleDateString()} · Tx #
                  {rev.transaction_id}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
