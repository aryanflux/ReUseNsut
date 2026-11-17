import React, { useState, useMemo } from 'react';
import {
  Home,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  List,
  Bookmark,
  Check,
  Search,
} from 'lucide-react';
import {
  User,
  EnrichedListing,
  ListingType,
  ItemCondition,
} from '../types/schema.ts';
import { DatabaseEngine } from '../db/dbEngine.ts';
import { formatINR, calculateTrustScore } from '../utils/metrics.ts';

interface MarketplaceViewProps {
  currentUser: User;
  dbEngine: DatabaseEngine;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTypes: ListingType[];
  onToggleType: (type: ListingType) => void;
  onSetSingleType: (type: ListingType | 'all') => void;
  savedOnly: boolean;
  onToggleSavedOnly: () => void;
  onClearAllFilters: () => void;
  onOpenListingDetail: (listing: EnrichedListing) => void;
  onOpenCreateModal: () => void;
  onSelectTab: (tab: string) => void;
}

const FALLBACK_IMAGE = '/images/items/clrs-algorithms.jpg';

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  currentUser,
  dbEngine,
  searchQuery,
  onSearchChange,
  selectedTypes,
  onToggleType,
  onSetSingleType,
  savedOnly,
  onToggleSavedOnly,
  onClearAllFilters,
  onOpenListingDetail,
  onOpenCreateModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [selectedConditions, setSelectedConditions] = useState<ItemCondition[]>([]);
  const [priceBracket, setPriceBracket] = useState<'all' | 'free' | 'under200' | 'under500'>('all');
  const [depositFilter, setDepositFilter] = useState<'all' | 'zero' | 'refundable'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'trust'>('recommended');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    type: true,
    condition: true,
    price: true,
    deposit: true,
  });

  const state = dbEngine.getState();
  const allActiveListings = useMemo(
    () =>
      dbEngine
        .getEnrichedListings(currentUser.user_id)
        .filter((item) => item.listing.listing_status === 'active'),
    [dbEngine, currentUser.user_id, state]
  );

  const categories = state.categories;

  const toggleCondition = (cond: ItemCondition) => {
    setSelectedConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Compute live counts for sidebar facets
  const countsByType = useMemo(() => {
    const map: Record<ListingType, number> = { sale: 0, lend: 0, exchange: 0, donation: 0 };
    allActiveListings.forEach((l) => {
      map[l.listing.listing_type]++;
    });
    return map;
  }, [allActiveListings]);

  const countsByCondition = useMemo(() => {
    const map: Record<ItemCondition, number> = { new: 0, like_new: 0, good: 0, fair: 0, poor: 0 };
    allActiveListings.forEach((l) => {
      map[l.item.item_condition]++;
    });
    return map;
  }, [allActiveListings]);

  // Apply all filters + sorting
  const filteredListings = useMemo(() => {
    const filtered = allActiveListings.filter((item) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.listing.listing_type)) {
        return false;
      }
      if (selectedCategory !== 'all' && item.item.category_id !== selectedCategory) {
        return false;
      }
      if (
        selectedConditions.length > 0 &&
        !selectedConditions.includes(item.item.item_condition)
      ) {
        return false;
      }
      if (priceBracket === 'free' && item.listing.price > 0) return false;
      if (priceBracket === 'under200' && item.listing.price > 200) return false;
      if (priceBracket === 'under500' && item.listing.price > 500) return false;

      if (depositFilter === 'zero' && item.listing.deposit_amount > 0) return false;
      if (depositFilter === 'refundable' && item.listing.deposit_amount <= 0) return false;

      if (savedOnly && !item.isSaved) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.item.item_name.toLowerCase().includes(q) ||
          item.item.description.toLowerCase().includes(q) ||
          item.category.category_name.toLowerCase().includes(q) ||
          item.owner.name.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });

    const withTrust = filtered.map((item) => ({
      item,
      trust: calculateTrustScore(
        item.owner.user_id,
        state.reviews,
        state.loans,
        state.transactions,
        state.disputes
      ).score,
    }));

    if (sortBy === 'price_asc') {
      withTrust.sort((a, b) => a.item.listing.price - b.item.listing.price);
    } else if (sortBy === 'price_desc') {
      withTrust.sort((a, b) => b.item.listing.price - a.item.listing.price);
    } else if (sortBy === 'trust') {
      withTrust.sort((a, b) => b.trust - a.trust);
    }

    return withTrust.map((w) => w.item);
  }, [
    allActiveListings,
    selectedTypes,
    selectedCategory,
    selectedConditions,
    priceBracket,
    depositFilter,
    savedOnly,
    searchQuery,
    sortBy,
    state.reviews,
    state.loans,
    state.transactions,
    state.disputes,
  ]);

  // Featured items for the dark showcase carousel strip (matching image_319eed78.png)
  const featuredFirst = allActiveListings[0];
  const featuredSecond = allActiveListings.find((l) => l.listing.listing_type === 'lend') || allActiveListings[1];

  const activeCategoryName =
    selectedCategory === 'all'
      ? 'All Campus Gear'
      : categories.find((c) => c.category_id === selectedCategory)?.category_name || 'Campus Gear';

  const activeSingleTab: 'all' | 'trust' | 'lend' | 'donation' | 'sale' =
    sortBy === 'trust' && selectedTypes.length === 0
      ? 'trust'
      : selectedTypes.length === 1 && selectedTypes[0] === 'lend'
      ? 'lend'
      : selectedTypes.length === 1 && selectedTypes[0] === 'donation'
      ? 'donation'
      : selectedTypes.length === 1 && selectedTypes[0] === 'sale'
      ? 'sale'
      : 'all';

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedCategory !== 'all' ||
    selectedConditions.length > 0 ||
    priceBracket !== 'all' ||
    depositFilter !== 'all' ||
    savedOnly ||
    searchQuery.trim() !== '';

  const resetAll = () => {
    setSelectedCategory('all');
    setSelectedConditions([]);
    setPriceBracket('all');
    setDepositFilter('all');
    setSortBy('recommended');
    onClearAllFilters();
  };

  return (
    <div className="pb-16">
      {/* Dark Charcoal Showcase Strip with 3 Editorial Spotlight Cards (inspired by image_319eed78.png) */}
      <section className="bg-[#2C2927] py-6 px-4 sm:px-6 lg:px-8 border-b border-[#1E1C1A]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Featured Textbook / Sale */}
          {featuredFirst && (
            <div className="bg-white p-5 flex items-center justify-between gap-4 border border-[#E5E0D8]">
              <div className="flex flex-col justify-between h-full space-y-3 min-w-0">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#2C2927] leading-tight line-clamp-2">
                    {featuredFirst.item.item_name.split('(')[0].trim()}
                  </h2>
                  <p className="text-xs text-[#7A746E] mt-1">
                    {featuredFirst.owner.name} · {formatINR(featuredFirst.listing.price)}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => onOpenListingDetail(featuredFirst)}
                    className="px-4 py-1.5 border border-[#D96B27] text-[#D96B27] hover:bg-[#D96B27] hover:text-white text-xs font-medium transition-colors"
                  >
                    View item
                  </button>
                </div>
              </div>
              <img
                src={featuredFirst.images[0]?.image_url || FALLBACK_IMAGE}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
                alt={featuredFirst.item.item_name}
                className="w-24 h-32 object-cover shrink-0 bg-[#EFECE7]"
              />
            </div>
          )}

          {/* Card 2: Featured Campus Lend */}
          {featuredSecond && (
            <div className="bg-white p-5 flex items-center justify-between gap-4 border border-[#E5E0D8]">
              <div className="flex flex-col justify-between h-full space-y-3 min-w-0">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#2C2927] leading-tight line-clamp-2">
                    {featuredSecond.item.item_name.split('(')[0].trim()}
                  </h2>
                  <p className="text-xs text-[#7A746E] mt-1">
                    Borrow from {featuredSecond.owner.name.split(' ')[0]} ·{' '}
                    {formatINR(featuredSecond.listing.price)}/sem
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => onOpenListingDetail(featuredSecond)}
                    className="px-4 py-1.5 border border-[#D96B27] text-[#D96B27] hover:bg-[#D96B27] hover:text-white text-xs font-medium transition-colors"
                  >
                    Borrow now
                  </button>
                </div>
              </div>
              <img
                src={featuredSecond.images[0]?.image_url || FALLBACK_IMAGE}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
                alt={featuredSecond.item.item_name}
                className="w-24 h-32 object-cover shrink-0 bg-[#EFECE7]"
              />
            </div>
          )}

          {/* Card 3: Free Campus Donations Promo (Matches right card in image_319eed78.png) */}
          <div
            onClick={() => {
              onSetSingleType('donation');
              setSelectedCategory('all');
            }}
            className="bg-white p-5 flex flex-col justify-between border border-[#E5E0D8] cursor-pointer group hover:border-[#D96B27] transition-colors"
          >
            <div className="h-20 w-full overflow-hidden bg-[#EFECE7] mb-3">
              <img
                src="/images/items/campus-donations.jpg"
                alt="Campus book sharing"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="text-center">
              <h2 className="font-serif text-lg font-bold text-[#2C2927] group-hover:text-[#D96B27] transition-colors">
                Free Senior-to-Junior Gear
              </h2>
              <p className="text-xs text-[#7A746E] mt-0.5">
                Claim textbooks & lab coats at ₹0 · Zero deposit
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Container (matching image_cd4a8f47.png) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#7A746E]">
          <Home className="w-3.5 h-3.5" />
          <button
            onClick={resetAll}
            className="hover:text-[#2C2927] transition-colors"
          >
            Home
          </button>
          <span>/</span>
          <span>Campus Marketplace</span>
          <span>/</span>
          <span className="text-[#2C2927] font-medium">{activeCategoryName}</span>
        </div>

        {/* Serif Catalog Title & Interactive Topic/Category Pills */}
        <div className="mt-3 pb-6 border-b border-[#E5E0D8]">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C2927] tracking-tight">
              {activeCategoryName}
            </h1>
            {hasActiveFilters && (
              <button
                onClick={resetAll}
                className="text-xs font-medium text-[#D96B27] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Interactive Oval Category Controls (Matches topic buttons under H1 in sample UI) */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'border-[#2C2927] bg-[#2C2927] text-white'
                  : 'border-[#D5CFC7] bg-white text-[#524D48] hover:border-[#2C2927]'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                onClick={() => setSelectedCategory(cat.category_id)}
                className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                  selectedCategory === cat.category_id
                    ? 'border-[#D96B27] bg-[#D96B27]/10 text-[#D96B27]'
                    : 'border-[#D5CFC7] bg-white text-[#524D48] hover:border-[#2C2927]'
                }`}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>

        {/* Two-Column Editorial Split: Left Filter Sidebar + Right Catalog Grid */}
        <div className="flex flex-col lg:flex-row gap-8 pt-6">
          {/* Left Filter Sidebar */}
          <aside
            aria-label="Catalog filters"
            className="w-full lg:w-60 shrink-0 lg:border-r lg:border-[#E5E0D8] lg:pr-6"
          >
            {/* Filter Group 1: Listing Mode */}
            <div className="pb-4 border-b border-[#E5E0D8]">
              <button
                onClick={() => toggleAccordion('type')}
                className="w-full flex items-center justify-between text-xs font-bold text-[#2C2927] py-1"
              >
                <span>Listing type</span>
                {openAccordions.type ? (
                  <ChevronUp className="w-4 h-4 text-[#7A746E]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#7A746E]" />
                )}
              </button>
              {openAccordions.type && (
                <div className="mt-2.5 space-y-2 text-xs">
                  {(
                    [
                      { key: 'lend', label: 'Lend / Borrow' },
                      { key: 'sale', label: 'Direct Sale' },
                      { key: 'exchange', label: 'Barter Exchange' },
                      { key: 'donation', label: 'Free Donation' },
                    ] as { key: ListingType; label: string }[]
                  ).map((opt) => {
                    const checked = selectedTypes.includes(opt.key);
                    return (
                      <label
                        key={opt.key}
                        className="flex items-center gap-2.5 cursor-pointer group select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleType(opt.key)}
                          className="sr-only"
                        />
                        <span
                          className={`w-4 h-4 rounded-[3px] flex items-center justify-center border transition-colors ${
                            checked
                              ? 'bg-[#D96B27] border-[#D96B27] text-white'
                              : 'bg-white border-[#C8C2BA] group-hover:border-[#2C2927]'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="text-[#2C2927]">{opt.label}</span>
                        <span className="text-[#8E8780] ml-auto">
                          ({countsByType[opt.key]})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter Group 2: Item Condition */}
            <div className="py-4 border-b border-[#E5E0D8]">
              <button
                onClick={() => toggleAccordion('condition')}
                className="w-full flex items-center justify-between text-xs font-bold text-[#2C2927] py-1"
              >
                <span>Item condition</span>
                {openAccordions.condition ? (
                  <ChevronUp className="w-4 h-4 text-[#7A746E]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#7A746E]" />
                )}
              </button>
              {openAccordions.condition && (
                <div className="mt-2.5 space-y-2 text-xs">
                  {(
                    [
                      { key: 'new', label: 'Brand New' },
                      { key: 'like_new', label: 'Like New' },
                      { key: 'good', label: 'Good' },
                      { key: 'fair', label: 'Fair' },
                    ] as { key: ItemCondition; label: string }[]
                  ).map((opt) => {
                    const checked = selectedConditions.includes(opt.key);
                    return (
                      <label
                        key={opt.key}
                        className="flex items-center gap-2.5 cursor-pointer group select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCondition(opt.key)}
                          className="sr-only"
                        />
                        <span
                          className={`w-4 h-4 rounded-[3px] flex items-center justify-center border transition-colors ${
                            checked
                              ? 'bg-[#D96B27] border-[#D96B27] text-white'
                              : 'bg-white border-[#C8C2BA] group-hover:border-[#2C2927]'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="text-[#2C2927]">{opt.label}</span>
                        <span className="text-[#8E8780] ml-auto">
                          ({countsByCondition[opt.key]})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter Group 3: Price Bracket */}
            <div className="py-4 border-b border-[#E5E0D8]">
              <button
                onClick={() => toggleAccordion('price')}
                className="w-full flex items-center justify-between text-xs font-bold text-[#2C2927] py-1"
              >
                <span>Price range</span>
                {openAccordions.price ? (
                  <ChevronUp className="w-4 h-4 text-[#7A746E]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#7A746E]" />
                )}
              </button>
              {openAccordions.price && (
                <div className="mt-2.5 space-y-2 text-xs">
                  {(
                    [
                      { key: 'all', label: 'All prices' },
                      { key: 'free', label: 'Free (₹0)' },
                      { key: 'under200', label: 'Under ₹200' },
                      { key: 'under500', label: 'Under ₹500' },
                    ] as const
                  ).map((opt) => {
                    const checked = priceBracket === opt.key;
                    return (
                      <label
                        key={opt.key}
                        className="flex items-center gap-2.5 cursor-pointer group select-none"
                      >
                        <input
                          type="radio"
                          name="priceBracket"
                          checked={checked}
                          onChange={() => setPriceBracket(opt.key)}
                          className="sr-only"
                        />
                        <span
                          className={`w-4 h-4 rounded-[3px] flex items-center justify-center border transition-colors ${
                            checked
                              ? 'bg-[#D96B27] border-[#D96B27] text-white'
                              : 'bg-white border-[#C8C2BA] group-hover:border-[#2C2927]'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="text-[#2C2927]">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter Group 4: Show Only / Deposit */}
            <div className="py-4">
              <button
                onClick={() => toggleAccordion('deposit')}
                className="w-full flex items-center justify-between text-xs font-bold text-[#2C2927] py-1"
              >
                <span>Show only</span>
                {openAccordions.deposit ? (
                  <ChevronUp className="w-4 h-4 text-[#7A746E]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#7A746E]" />
                )}
              </button>
              {openAccordions.deposit && (
                <div className="mt-2.5 space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={savedOnly}
                      onChange={onToggleSavedOnly}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center border transition-colors ${
                        savedOnly
                          ? 'bg-[#D96B27] border-[#D96B27] text-white'
                          : 'bg-white border-[#C8C2BA] group-hover:border-[#2C2927]'
                      }`}
                    >
                      {savedOnly && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="text-[#2C2927]">Saved items</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={depositFilter === 'refundable'}
                      onChange={() =>
                        setDepositFilter(
                          depositFilter === 'refundable' ? 'all' : 'refundable'
                        )
                      }
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center border transition-colors ${
                        depositFilter === 'refundable'
                          ? 'bg-[#D96B27] border-[#D96B27] text-white'
                          : 'bg-white border-[#C8C2BA] group-hover:border-[#2C2927]'
                      }`}
                    >
                      {depositFilter === 'refundable' && (
                        <Check className="w-3 h-3 stroke-[3]" />
                      )}
                    </span>
                    <span className="text-[#2C2927]">Refundable deposit</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={depositFilter === 'zero'}
                      onChange={() =>
                        setDepositFilter(depositFilter === 'zero' ? 'all' : 'zero')
                      }
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center border transition-colors ${
                        depositFilter === 'zero'
                          ? 'bg-[#D96B27] border-[#D96B27] text-white'
                          : 'bg-white border-[#C8C2BA] group-hover:border-[#2C2927]'
                      }`}
                    >
                      {depositFilter === 'zero' && (
                        <Check className="w-3 h-3 stroke-[3]" />
                      )}
                    </span>
                    <span className="text-[#2C2927]">Zero deposit</span>
                  </label>
                </div>
              )}
            </div>
          </aside>

          {/* Right Product Grid Area */}
          <div className="flex-1 min-w-0">
            {/* Sub-bar with Underline Tabs, View Switcher, and Sort Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E0D8] mb-6">
              <div className="flex items-center gap-6 overflow-x-auto no-scrollbar text-xs">
                <button
                  onClick={() => {
                    onSetSingleType('all');
                    setSortBy('recommended');
                  }}
                  className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeSingleTab === 'all'
                      ? 'border-[#D96B27] text-[#2C2927] font-semibold'
                      : 'border-transparent text-[#7A746E] hover:text-[#2C2927]'
                  }`}
                >
                  All items ({allActiveListings.length})
                </button>
                <button
                  onClick={() => {
                    onSetSingleType('all');
                    setSortBy('trust');
                  }}
                  className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeSingleTab === 'trust'
                      ? 'border-[#D96B27] text-[#2C2927] font-semibold'
                      : 'border-transparent text-[#7A746E] hover:text-[#2C2927]'
                  }`}
                >
                  Top trusted
                </button>
                <button
                  onClick={() => onSetSingleType('lend')}
                  className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeSingleTab === 'lend'
                      ? 'border-[#D96B27] text-[#2C2927] font-semibold'
                      : 'border-transparent text-[#7A746E] hover:text-[#2C2927]'
                  }`}
                >
                  Borrow &amp; lend
                </button>
                <button
                  onClick={() => onSetSingleType('sale')}
                  className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeSingleTab === 'sale'
                      ? 'border-[#D96B27] text-[#2C2927] font-semibold'
                      : 'border-transparent text-[#7A746E] hover:text-[#2C2927]'
                  }`}
                >
                  Direct sale
                </button>
                <button
                  onClick={() => onSetSingleType('donation')}
                  className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeSingleTab === 'donation'
                      ? 'border-[#C82333] text-[#C82333] font-semibold'
                      : 'border-transparent text-[#C82333]/80 hover:text-[#C82333] font-medium'
                  }`}
                >
                  Free donations
                </button>
              </div>

              <div className="flex items-center gap-3 pb-2.5 text-xs">
                {/* Grid / List View Buttons */}
                <div className="flex items-center gap-1 border-r border-[#E5E0D8] pr-3">
                  <button
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className={`p-1.5 transition-colors ${
                      viewMode === 'grid'
                        ? 'text-[#2C2927]'
                        : 'text-[#9E978E] hover:text-[#2C2927]'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    className={`p-1.5 transition-colors ${
                      viewMode === 'list'
                        ? 'text-[#2C2927]'
                        : 'text-[#9E978E] hover:text-[#2C2927]'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Select */}
                <div className="flex items-center gap-1.5 text-[#524D48]">
                  <label htmlFor="sort-select" className="text-[#7A746E]">
                    Sort by:
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent font-medium text-[#2C2927] focus:outline-none cursor-pointer"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="trust">Highest Trust</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {filteredListings.length === 0 ? (
              <div className="bg-white border border-[#E5E0D8] p-12 text-center space-y-3">
                <Search className="w-8 h-8 text-[#9E978E] mx-auto" />
                <h3 className="font-serif text-lg font-bold text-[#2C2927]">
                  No matching campus items found
                </h3>
                <p className="text-xs text-[#7A746E] max-w-md mx-auto">
                  Try clearing a filter or searching with another keyword, or post this item yourself.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={resetAll}
                    className="px-4 py-1.5 rounded-full border border-[#2C2927] text-xs font-medium text-[#2C2927] hover:bg-[#2C2927] hover:text-white transition-colors"
                  >
                    Reset all filters
                  </button>
                  <button
                    onClick={onOpenCreateModal}
                    className="px-4 py-1.5 rounded-full bg-[#D96B27] text-white text-xs font-medium hover:bg-[#C0581A] transition-colors"
                  >
                    Post an item
                  </button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              /* 4-Column Clean Editorial Card Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                {filteredListings.map((entry) => {
                  const ownerTrust = calculateTrustScore(
                    entry.owner.user_id,
                    state.reviews,
                    state.loans,
                    state.transactions,
                    state.disputes
                  );

                  const displayImage = entry.images[0]?.image_url || FALLBACK_IMAGE;

                  const cornerBadge =
                    entry.listing.listing_type === 'donation'
                      ? { label: 'Free', cls: 'bg-[#1E5B3E] text-white' }
                      : entry.listing.listing_type === 'lend'
                      ? { label: 'Lend', cls: 'bg-[#1E5B3E] text-white' }
                      : entry.listing.listing_type === 'sale'
                      ? { label: 'Sale', cls: 'bg-[#C82333] text-white' }
                      : { label: 'Swap', cls: 'bg-[#D96B27] text-white' };

                  const actionLabel =
                    entry.listing.listing_type === 'lend'
                      ? 'Borrow'
                      : entry.listing.listing_type === 'donation'
                      ? 'Claim'
                      : entry.listing.listing_type === 'exchange'
                      ? 'Swap'
                      : 'Buy';

                  return (
                    <article
                      key={entry.listing.listing_id}
                      onClick={() => onOpenListingDetail(entry)}
                      className="group cursor-pointer flex flex-col"
                    >
                      {/* Clean Cover Container */}
                      <div className="relative aspect-[4/4.6] bg-[#EFECE7] overflow-hidden shadow-xs group-hover:shadow-md transition-shadow">
                        <img
                          src={displayImage}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                          }}
                          alt={entry.item.item_name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          loading="lazy"
                        />

                        {/* Sharp Corner Status Tag (Matching New / -10% in reference UI) */}
                        <span
                          className={`absolute top-2.5 right-0 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${cornerBadge.cls}`}
                        >
                          {cornerBadge.label}
                        </span>

                        {/* Bookmark Action */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dbEngine.toggleSavedListing(
                              currentUser.user_id,
                              entry.listing.listing_id
                            );
                          }}
                          aria-label={`Save ${entry.item.item_name}`}
                          className={`absolute top-2.5 left-2.5 p-1.5 transition-opacity ${
                            entry.isSaved
                              ? 'bg-[#D96B27] text-white opacity-100'
                              : 'bg-white/90 text-[#2C2927] opacity-0 group-hover:opacity-100 hover:bg-white'
                          }`}
                        >
                          <Bookmark
                            className="w-3.5 h-3.5"
                            fill={entry.isSaved ? 'currentColor' : 'none'}
                          />
                        </button>
                      </div>

                      {/* Item Info */}
                      <div className="pt-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-[13px] font-semibold text-[#2C2927] group-hover:text-[#D96B27] transition-colors line-clamp-1">
                            {entry.item.item_name}
                          </h3>
                          <p className="text-xs text-[#7A746E] mt-0.5 line-clamp-1">
                            {entry.owner.name} · ★ {ownerTrust.score} ·{' '}
                            <span className="capitalize">
                              {entry.item.item_condition.replace('_', ' ')}
                            </span>
                          </p>
                        </div>

                        {/* Price + Pill Outline CTA Row (Matching $24 [Buy] in reference UI) */}
                        <div className="pt-3 flex items-center justify-between gap-2">
                          <div>
                            {entry.listing.listing_type === 'donation' ? (
                              <span className="text-[15px] font-bold text-[#1E5B3E]">
                                Free
                              </span>
                            ) : entry.listing.listing_type === 'exchange' ? (
                              <span className="text-sm font-bold text-[#D96B27]">
                                Exchange
                              </span>
                            ) : (
                              <div className="flex items-baseline gap-1">
                                <span className="text-[15px] font-bold text-[#D96B27]">
                                  {formatINR(entry.listing.price)}
                                </span>
                                {entry.listing.listing_type === 'lend' && (
                                  <span className="text-[11px] text-[#7A746E]">
                                    /sem
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenListingDetail(entry);
                            }}
                            className="rounded-full border border-[#2C2927] px-4 py-1 text-xs font-medium text-[#2C2927] hover:bg-[#2C2927] hover:text-white transition-colors"
                          >
                            {actionLabel}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* Clean Editorial List View */
              <div className="divide-y divide-[#E5E0D8] border-t border-b border-[#E5E0D8] bg-white">
                {filteredListings.map((entry) => {
                  const ownerTrust = calculateTrustScore(
                    entry.owner.user_id,
                    state.reviews,
                    state.loans,
                    state.transactions,
                    state.disputes
                  );
                  const displayImage = entry.images[0]?.image_url || FALLBACK_IMAGE;

                  return (
                    <div
                      key={entry.listing.listing_id}
                      onClick={() => onOpenListingDetail(entry)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F5] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <img
                          src={displayImage}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                          }}
                          alt={entry.item.item_name}
                          className="w-16 h-20 object-cover bg-[#EFECE7] shrink-0"
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="text-[11px] text-[#7A746E]">
                            {entry.category.category_name} ·{' '}
                            <span className="capitalize">
                              {entry.item.item_condition.replace('_', ' ')}
                            </span>{' '}
                            · <span className="capitalize">{entry.listing.listing_type}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-[#2C2927] truncate">
                            {entry.item.item_name}
                          </h3>
                          <p className="text-xs text-[#7A746E] line-clamp-1">
                            {entry.item.description}
                          </p>
                          <div className="text-[11px] text-[#524D48]">
                            Listed by {entry.owner.name} · Trust ★ {ownerTrust.score}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 sm:pl-4">
                        <div className="text-right">
                          <div className="text-base font-bold text-[#D96B27]">
                            {entry.listing.listing_type === 'donation'
                              ? 'Free'
                              : entry.listing.listing_type === 'exchange'
                              ? 'Exchange'
                              : formatINR(entry.listing.price)}
                          </div>
                          {entry.listing.listing_type === 'lend' &&
                            entry.listing.deposit_amount > 0 && (
                              <div className="text-[11px] text-[#1E5B3E]">
                                {formatINR(entry.listing.deposit_amount)} deposit
                              </div>
                            )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenListingDetail(entry);
                          }}
                          className="rounded-full border border-[#2C2927] px-4 py-1.5 text-xs font-medium text-[#2C2927] hover:bg-[#2C2927] hover:text-white transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
