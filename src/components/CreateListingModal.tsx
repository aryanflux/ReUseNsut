import React, { useState } from 'react';
import { X, Info, Check } from 'lucide-react';
import { User, ListingType, ItemCondition } from '../types/schema.ts';
import { DatabaseEngine } from '../db/dbEngine.ts';

interface CreateListingModalProps {
  currentUser: User;
  dbEngine: DatabaseEngine;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const PRESET_IMAGES = [
  {
    name: 'CLRS Algorithms Book',
    url: '/images/items/clrs-algorithms.jpg',
  },
  {
    name: 'Casio ClassWiz Calculator',
    url: '/images/items/casio-991cw.jpg',
  },
  {
    name: 'Engineering Mini Drafter',
    url: '/images/items/mini-drafter.jpg',
  },
  {
    name: 'Arduino Lab Kit',
    url: '/images/items/arduino-kit.jpg',
  },
  {
    name: 'Campus Bicycle',
    url: '/images/items/campus-bicycle.jpg',
  },
  {
    name: 'Hostel Electric Kettle',
    url: '/images/items/electric-kettle.jpg',
  },
  {
    name: 'Lab Coat / Apron',
    url: '/images/items/chemistry-lab-coat.jpg',
  },
  {
    name: 'DBMS Textbook',
    url: '/images/items/dbms-textbook.jpg',
  },
];

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  currentUser,
  dbEngine,
  onClose,
  onSuccess,
}) => {
  const categories = dbEngine.getState().categories;

  const [itemName, setItemName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [itemCondition, setItemCondition] = useState<ItemCondition>('good');
  const [listingType, setListingType] = useState<ListingType>('lend');
  const [price, setPrice] = useState<number>(50);
  const [depositAmount, setDepositAmount] = useState<number>(300);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isVerified = currentUser.verification_status === 'verified';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isVerified) {
      setErrorMsg('Only verified accounts can publish items.');
      return;
    }

    if (!itemName.trim()) {
      setErrorMsg('Please enter an item name.');
      return;
    }

    const expiryDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    dbEngine.createListing({
      ownerId: currentUser.user_id,
      categoryId,
      itemName: itemName.trim(),
      description: description.trim(),
      itemCondition,
      listingType,
      price: listingType === 'donation' || listingType === 'exchange' ? 0 : Number(price),
      depositAmount: listingType === 'lend' ? Number(depositAmount) : 0,
      expiryDate,
      imageUrl,
    });

    onSuccess(`"${itemName}" listed successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2C2927]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-[#FAF8F5] max-w-xl w-full shadow-2xl border border-[#D5CFC7] overflow-hidden my-8"
        role="dialog"
        aria-labelledby="create-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8] bg-white">
          <div>
            <h2 id="create-modal-title" className="font-serif text-lg font-bold text-[#2C2927]">
              Post an Item to Marketplace
            </h2>
            <p className="text-xs text-[#7A746E]">
              Listing as <span className="font-semibold text-[#2C2927]">{currentUser.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7A746E] hover:text-[#2C2927] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isVerified && (
          <div className="p-3.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              Account pending verification. Switch to an Admin account in the top menu to approve verification first.
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border-b border-red-200 text-xs text-[#C82333]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          <div>
            <label className="block font-semibold text-[#2C2927] mb-1">
              Item Name &amp; Edition / Model *
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Casio fx-991CW Calculator / CLRS 4th Edition / Omega Mini Drafter"
              className="w-full px-3 py-2 text-xs bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#2C2927]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#2C2927] mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#2C2927]"
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#2C2927] mb-1">
                Item Condition *
              </label>
              <select
                value={itemCondition}
                onChange={(e) => setItemCondition(e.target.value as ItemCondition)}
                className="w-full px-3 py-2 bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#2C2927] capitalize"
              >
                <option value="new">Brand New (Unused)</option>
                <option value="like_new">Like New (Mint)</option>
                <option value="good">Good (Normal semester wear)</option>
                <option value="fair">Fair (Usable with pencil marks)</option>
                <option value="poor">Poor (Heavy wear)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#2C2927] mb-1.5">
              Listing Mode *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setListingType('lend');
                  setPrice(50);
                }}
                className={`p-2.5 border text-left transition-all ${
                  listingType === 'lend'
                    ? 'border-[#D96B27] bg-white text-[#2C2927] font-semibold shadow-xs'
                    : 'border-[#E5E0D8] bg-[#F3EFE9]/50 text-[#524D48] hover:border-[#2C2927]'
                }`}
              >
                <div className="font-bold">Lend / Borrow</div>
                <div className="text-[10px] text-[#7A746E] mt-0.5">With deposit</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setListingType('sale');
                  setPrice(350);
                }}
                className={`p-2.5 border text-left transition-all ${
                  listingType === 'sale'
                    ? 'border-[#D96B27] bg-white text-[#2C2927] font-semibold shadow-xs'
                    : 'border-[#E5E0D8] bg-[#F3EFE9]/50 text-[#524D48] hover:border-[#2C2927]'
                }`}
              >
                <div className="font-bold">Sell</div>
                <div className="text-[10px] text-[#7A746E] mt-0.5">Direct sale</div>
              </button>

              <button
                type="button"
                onClick={() => setListingType('exchange')}
                className={`p-2.5 border text-left transition-all ${
                  listingType === 'exchange'
                    ? 'border-[#D96B27] bg-white text-[#2C2927] font-semibold shadow-xs'
                    : 'border-[#E5E0D8] bg-[#F3EFE9]/50 text-[#524D48] hover:border-[#2C2927]'
                }`}
              >
                <div className="font-bold">Exchange</div>
                <div className="text-[10px] text-[#7A746E] mt-0.5">Barter swap</div>
              </button>

              <button
                type="button"
                onClick={() => setListingType('donation')}
                className={`p-2.5 border text-left transition-all ${
                  listingType === 'donation'
                    ? 'border-[#D96B27] bg-white text-[#2C2927] font-semibold shadow-xs'
                    : 'border-[#E5E0D8] bg-[#F3EFE9]/50 text-[#524D48] hover:border-[#2C2927]'
                }`}
              >
                <div className="font-bold">Donate</div>
                <div className="text-[10px] text-[#7A746E] mt-0.5">Free (₹0)</div>
              </button>
            </div>
          </div>

          {(listingType === 'sale' || listingType === 'lend') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white border border-[#E5E0D8]">
              <div>
                <label className="block font-semibold text-[#2C2927] mb-1">
                  {listingType === 'lend' ? 'Lending Fee (₹)' : 'Selling Price (₹)'} *
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#2C2927]"
                  required
                />
              </div>

              {listingType === 'lend' && (
                <div>
                  <label className="block font-semibold text-[#2C2927] mb-1">
                    Refundable Security Deposit (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#2C2927]"
                    required
                  />
                  <p className="text-[10px] text-[#7A746E] mt-0.5">
                    Refunded when returned on time in good condition.
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#2C2927] mb-1">
              Description &amp; Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mention semester relevance, highlights, missing parts, battery state, etc."
              className="w-full px-3 py-2 bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#2C2927]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#2C2927] mb-1.5">
              Item Photo (Select Preset or Paste URL)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-2">
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setImageUrl(preset.url)}
                  className={`aspect-square overflow-hidden border-2 transition-all relative ${
                    imageUrl === preset.url
                      ? 'border-[#D96B27]'
                      : 'border-[#E5E0D8] hover:border-[#2C2927]'
                  }`}
                  title={preset.name}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  {imageUrl === preset.url && (
                    <div className="absolute inset-0 bg-[#D96B27]/35 flex items-center justify-center text-white">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or paste external image URL..."
              className="w-full px-3 py-1.5 bg-white border border-[#D5CFC7] focus:border-[#D96B27] focus:outline-none text-[#524D48] text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E0D8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#524D48] hover:text-[#2C2927] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isVerified}
              className="px-5 py-2 bg-[#D96B27] hover:bg-[#C0581A] disabled:opacity-50 text-white font-semibold transition-colors"
            >
              Publish Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
