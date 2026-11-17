import React, { useState } from 'react';
import { Database, GitBranch, Key, ArrowRight } from 'lucide-react';
import { DatabaseState } from '../db/dbEngine.ts';

export type SchemaDomain = 'identity' | 'catalog' | 'fulfillment' | 'safety';

export interface TableColumnDef {
  name: string;
  type: string;
  key?: 'PK' | 'FK' | 'PK,FK' | 'UK' | 'UK,FK';
  ref?: string;
}

export interface TableSchemaDef {
  name: string;
  domain: SchemaDomain;
  pk: string;
  summary: string;
  x: number;
  y: number;
  columns: TableColumnDef[];
}

export interface RelationshipDef {
  id: string;
  from: string;
  to: string;
  cardinality: '1:N' | '1:1' | '1:0..1' | 'M:N';
  fk: string;
  label: string;
}

export const ALL_TABLES: TableSchemaDef[] = [
  {
    name: 'Users',
    domain: 'identity',
    pk: 'user_id',
    summary: 'Verified students and admin proctors with campus account status.',
    x: 24,
    y: 36,
    columns: [
      { name: 'user_id', type: 'int', key: 'PK' },
      { name: 'roll_number', type: 'varchar(30)', key: 'UK' },
      { name: 'name', type: 'varchar(100)' },
      { name: 'university_email', type: 'varchar(150)', key: 'UK' },
      { name: 'phone', type: 'varchar(20)', key: 'UK' },
      { name: 'password_hash', type: 'varchar(255)' },
      { name: 'verification_status', type: 'enum' },
      { name: 'account_role', type: 'enum' },
      { name: 'account_status', type: 'enum' },
      { name: 'joined_at', type: 'timestamp' },
    ],
  },
  {
    name: 'Categories',
    domain: 'catalog',
    pk: 'category_id',
    summary: 'Academic item categories (Textbooks, Calculators, Drafters, Kits).',
    x: 24,
    y: 196,
    columns: [
      { name: 'category_id', type: 'int', key: 'PK' },
      { name: 'category_name', type: 'varchar(100)', key: 'UK' },
      { name: 'description', type: 'text' },
    ],
  },
  {
    name: 'Messages',
    domain: 'identity',
    pk: 'message_id',
    summary: 'Peer-to-peer chat messages optionally tied to a marketplace listing.',
    x: 24,
    y: 344,
    columns: [
      { name: 'message_id', type: 'int', key: 'PK' },
      { name: 'sender_id', type: 'int', key: 'FK', ref: 'Users' },
      { name: 'receiver_id', type: 'int', key: 'FK', ref: 'Users' },
      { name: 'listing_id', type: 'int', key: 'FK', ref: 'Listings' },
      { name: 'message_text', type: 'text' },
      { name: 'sent_at', type: 'timestamp' },
      { name: 'read_at', type: 'timestamp' },
    ],
  },
  {
    name: 'Saved_Listings',
    domain: 'identity',
    pk: '(user_id, listing_id)',
    summary: 'Composite-PK junction table for bookmarked listings (M:N).',
    x: 24,
    y: 492,
    columns: [
      { name: 'user_id', type: 'int', key: 'PK,FK', ref: 'Users' },
      { name: 'listing_id', type: 'int', key: 'PK,FK', ref: 'Listings' },
      { name: 'saved_at', type: 'timestamp' },
    ],
  },
  {
    name: 'Items',
    domain: 'catalog',
    pk: 'item_id',
    summary: 'Physical student-owned items with condition grading.',
    x: 300,
    y: 36,
    columns: [
      { name: 'item_id', type: 'int', key: 'PK' },
      { name: 'owner_id', type: 'int', key: 'FK', ref: 'Users' },
      { name: 'category_id', type: 'int', key: 'FK', ref: 'Categories' },
      { name: 'item_name', type: 'varchar(150)' },
      { name: 'description', type: 'text' },
      { name: 'item_condition', type: 'enum' },
      { name: 'created_at', type: 'timestamp' },
    ],
  },
  {
    name: 'Item_Images',
    domain: 'catalog',
    pk: 'image_id',
    summary: 'Image assets attached to physical items (1:N).',
    x: 300,
    y: 196,
    columns: [
      { name: 'image_id', type: 'int', key: 'PK' },
      { name: 'item_id', type: 'int', key: 'FK', ref: 'Items' },
      { name: 'image_url', type: 'varchar(500)' },
      { name: 'uploaded_at', type: 'timestamp' },
    ],
  },
  {
    name: 'Listings',
    domain: 'catalog',
    pk: 'listing_id',
    summary: 'Marketplace offers for sale, lend, exchange, or donation.',
    x: 300,
    y: 344,
    columns: [
      { name: 'listing_id', type: 'int', key: 'PK' },
      { name: 'item_id', type: 'int', key: 'FK', ref: 'Items' },
      { name: 'listing_type', type: 'enum' },
      { name: 'price', type: 'decimal(10,2)' },
      { name: 'deposit_amount', type: 'decimal(10,2)' },
      { name: 'posted_at', type: 'timestamp' },
      { name: 'expiry_date', type: 'date' },
      { name: 'listing_status', type: 'enum' },
    ],
  },
  {
    name: 'Listing_Requests',
    domain: 'fulfillment',
    pk: 'request_id',
    summary: 'Student requests on listings (unique per requester & listing).',
    x: 300,
    y: 492,
    columns: [
      { name: 'request_id', type: 'int', key: 'PK' },
      { name: 'listing_id', type: 'int', key: 'FK', ref: 'Listings' },
      { name: 'requester_id', type: 'int', key: 'FK', ref: 'Users' },
      { name: 'offered_item_id', type: 'int', key: 'FK', ref: 'Items' },
      { name: 'request_message', type: 'text' },
      { name: 'requested_at', type: 'timestamp' },
      { name: 'request_status', type: 'enum' },
    ],
  },
  {
    name: 'Transactions',
    domain: 'fulfillment',
    pk: 'transaction_id',
    summary: 'Confirmed 1:1 handover order created from an accepted request.',
    x: 585,
    y: 36,
    columns: [
      { name: 'transaction_id', type: 'int', key: 'PK' },
      { name: 'request_id', type: 'int', key: 'UK,FK', ref: 'Listing_Requests' },
      { name: 'transaction_status', type: 'enum' },
      { name: 'agreed_amount', type: 'decimal(10,2)' },
      { name: 'created_at', type: 'timestamp' },
      { name: 'completed_at', type: 'timestamp' },
    ],
  },
  {
    name: 'Loans',
    domain: 'fulfillment',
    pk: 'transaction_id',
    summary: 'Extension subtype (1:0..1) tracking due dates & return state.',
    x: 585,
    y: 196,
    columns: [
      { name: 'transaction_id', type: 'int', key: 'PK,FK', ref: 'Transactions' },
      { name: 'due_date', type: 'date' },
      { name: 'returned_at', type: 'timestamp' },
      { name: 'loan_status', type: 'enum' },
      { name: 'condition_on_return', type: 'text' },
    ],
  },
  {
    name: 'Payments',
    domain: 'fulfillment',
    pk: 'payment_id',
    summary: 'UPI/cash ledger for purchases, deposits, refunds, and penalties.',
    x: 585,
    y: 344,
    columns: [
      { name: 'payment_id', type: 'int', key: 'PK' },
      { name: 'transaction_id', type: 'int', key: 'FK', ref: 'Transactions' },
      { name: 'payer_id', type: 'int', key: 'FK', ref: 'Users' },
      { name: 'payment_type', type: 'enum' },
      { name: 'amount', type: 'decimal(10,2)' },
      { name: 'payment_method', type: 'enum' },
      { name: 'payment_status', type: 'enum' },
      { name: 'paid_at', type: 'timestamp' },
    ],
  },
  {
    name: 'Reviews',
    domain: 'safety',
    pk: 'review_id',
    summary: 'Mutual transaction ratings (1-5) feeding student trust scores.',
    x: 585,
    y: 492,
    columns: [
      { name: 'review_id', type: 'int', key: 'PK' },
      { name: 'transaction_id', type: 'int', key: 'FK', ref: 'Transactions' },
      { name: 'reviewer_id', type: 'int', key: 'FK', ref: 'Users' },
      { name: 'reviewee_id', type: 'int', key: 'FK', ref: 'Users' },
      { name: 'rating', type: 'int' },
      { name: 'comment', type: 'text' },
      { name: 'created_at', type: 'timestamp' },
    ],
  },
  {
    name: 'Disputes',
    domain: 'safety',
    pk: 'dispute_id',
    summary: 'Escalated transaction complaints assigned to admin proctors.',
    x: 870,
    y: 110,
    columns: [
      { name: 'dispute_id', type: 'int', key: 'PK' },
      { name: 'transaction_id', type: 'int', key: 'FK', ref: 'Transactions' },
      { name: 'raised_by', type: 'int', key: 'FK', ref: 'Users' },
      { name: 'dispute_reason', type: 'varchar(100)' },
      { name: 'description', type: 'text' },
      { name: 'resolution_status', type: 'enum' },
      { name: 'resolution', type: 'text' },
      { name: 'assigned_admin', type: 'int', key: 'FK', ref: 'Users' },
      { name: 'raised_at', type: 'timestamp' },
      { name: 'resolved_at', type: 'timestamp' },
    ],
  },
  {
    name: 'Reports',
    domain: 'safety',
    pk: 'report_id',
    summary: 'User or listing moderation flags submitted for review.',
    x: 870,
    y: 280,
    columns: [
      { name: 'report_id', type: 'int', key: 'PK' },
      { name: 'reporter_id', type: 'int', key: 'FK', ref: 'Users' },
      { name: 'reported_user_id', type: 'int', key: 'FK', ref: 'Users' },
      { name: 'listing_id', type: 'int', key: 'FK', ref: 'Listings' },
      { name: 'report_reason', type: 'varchar(100)' },
      { name: 'description', type: 'text' },
      { name: 'report_status', type: 'enum' },
      { name: 'reported_at', type: 'timestamp' },
    ],
  },
  {
    name: 'Report_Actions',
    domain: 'safety',
    pk: 'report_action_id',
    summary: 'Audit trail of moderation actions taken by admins on reports.',
    x: 870,
    y: 450,
    columns: [
      { name: 'report_action_id', type: 'int', key: 'PK' },
      { name: 'report_id', type: 'int', key: 'FK', ref: 'Reports' },
      { name: 'admin_id', type: 'int', key: 'FK', ref: 'Users' },
      { name: 'action_taken', type: 'varchar(100)' },
      { name: 'action_details', type: 'text' },
      { name: 'action_date', type: 'timestamp' },
    ],
  },
];

export const RELATIONSHIPS: RelationshipDef[] = [
  { id: 'r1', from: 'Users', to: 'Items', cardinality: '1:N', fk: 'owner_id', label: 'owns' },
  { id: 'r2', from: 'Categories', to: 'Items', cardinality: '1:N', fk: 'category_id', label: 'classifies' },
  { id: 'r3', from: 'Items', to: 'Item_Images', cardinality: '1:N', fk: 'item_id', label: 'has photos' },
  { id: 'r4', from: 'Items', to: 'Listings', cardinality: '1:N', fk: 'item_id', label: 'listed as' },
  { id: 'r5', from: 'Listings', to: 'Listing_Requests', cardinality: '1:N', fk: 'listing_id', label: 'receives' },
  { id: 'r6', from: 'Users', to: 'Listing_Requests', cardinality: '1:N', fk: 'requester_id', label: 'places' },
  { id: 'r7', from: 'Items', to: 'Listing_Requests', cardinality: '1:N', fk: 'offered_item_id', label: 'offered in barter' },
  { id: 'r8', from: 'Listing_Requests', to: 'Transactions', cardinality: '1:1', fk: 'request_id (UNIQUE)', label: 'converts to' },
  { id: 'r9', from: 'Transactions', to: 'Loans', cardinality: '1:0..1', fk: 'transaction_id (PK,FK)', label: 'tracks loan' },
  { id: 'r10', from: 'Transactions', to: 'Payments', cardinality: '1:N', fk: 'transaction_id', label: 'settles' },
  { id: 'r11', from: 'Users', to: 'Payments', cardinality: '1:N', fk: 'payer_id', label: 'pays' },
  { id: 'r12', from: 'Transactions', to: 'Reviews', cardinality: '1:N', fk: 'transaction_id', label: 'rated by' },
  { id: 'r13', from: 'Users', to: 'Reviews', cardinality: '1:N', fk: 'reviewer_id / reviewee_id', label: 'writes & receives' },
  { id: 'r14', from: 'Transactions', to: 'Disputes', cardinality: '1:N', fk: 'transaction_id', label: 'escalates' },
  { id: 'r15', from: 'Users', to: 'Disputes', cardinality: '1:N', fk: 'raised_by / assigned_admin', label: 'raises / resolves' },
  { id: 'r16', from: 'Users', to: 'Saved_Listings', cardinality: '1:N', fk: 'user_id (PK,FK)', label: 'bookmarks (M:N)' },
  { id: 'r17', from: 'Listings', to: 'Saved_Listings', cardinality: '1:N', fk: 'listing_id (PK,FK)', label: 'bookmarked in (M:N)' },
  { id: 'r18', from: 'Users', to: 'Messages', cardinality: '1:N', fk: 'sender_id / receiver_id', label: 'chats' },
  { id: 'r19', from: 'Listings', to: 'Messages', cardinality: '1:N', fk: 'listing_id', label: 'discussed in' },
  { id: 'r20', from: 'Users', to: 'Reports', cardinality: '1:N', fk: 'reporter_id / reported_user_id', label: 'flags' },
  { id: 'r21', from: 'Listings', to: 'Reports', cardinality: '1:N', fk: 'listing_id', label: 'reported in' },
  { id: 'r22', from: 'Reports', to: 'Report_Actions', cardinality: '1:N', fk: 'report_id', label: 'resolved via' },
  { id: 'r23', from: 'Users', to: 'Report_Actions', cardinality: '1:N', fk: 'admin_id', label: 'actioned by' },
];

const NODE_WIDTH = 204;
const NODE_HEIGHT = 76;

const DOMAIN_META: Record<
  SchemaDomain,
  { label: string; accent: string; bg: string }
> = {
  identity: { label: 'Identity & Social', accent: '#2C2927', bg: '#EFECE7' },
  catalog: { label: 'Catalog & Listings', accent: '#D96B27', bg: '#FDF3EC' },
  fulfillment: { label: 'Orders, Loans & Ledger', accent: '#1E5B3E', bg: '#EEF6F1' },
  safety: { label: 'Trust & Moderation', accent: '#C82333', bg: '#FCEEEF' },
};

function getRowCount(state: DatabaseState, tableName: string): number {
  const map: Record<string, number> = {
    Users: state.users.length,
    Categories: state.categories.length,
    Items: state.items.length,
    Item_Images: state.itemImages.length,
    Listings: state.listings.length,
    Listing_Requests: state.listingRequests.length,
    Transactions: state.transactions.length,
    Loans: state.loans.length,
    Payments: state.payments.length,
    Reviews: state.reviews.length,
    Disputes: state.disputes.length,
    Saved_Listings: state.savedListings.length,
    Reports: state.reports.length,
    Report_Actions: state.reportActions.length,
    Messages: state.messages.length,
  };
  return map[tableName] ?? 0;
}

interface SchemaDiagramProps {
  dbState: DatabaseState;
  onRunTableQuery: (tableName: string) => void;
}

export const SchemaDiagram: React.FC<SchemaDiagramProps> = ({
  dbState,
  onRunTableQuery,
}) => {
  const [selectedTable, setSelectedTable] = useState<string>('Listings');
  const [domainFilter, setDomainFilter] = useState<SchemaDomain | 'all'>('all');

  const activeTableDef =
    ALL_TABLES.find((t) => t.name === selectedTable) || ALL_TABLES[0];

  const connectedRelationships = RELATIONSHIPS.filter(
    (r) => r.from === selectedTable || r.to === selectedTable
  );

  const connectedNodeNames = new Set<string>([selectedTable]);
  connectedRelationships.forEach((r) => {
    connectedNodeNames.add(r.from);
    connectedNodeNames.add(r.to);
  });

  const visibleTables =
    domainFilter === 'all'
      ? ALL_TABLES
      : ALL_TABLES.filter((t) => t.domain === domainFilter);

  return (
    <div className="space-y-6">
      {/* Section 1: Visual Entity-Relationship & Cardinality Diagram */}
      <div className="bg-white border border-[#E5E0D8] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E5E0D8] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D96B27]">
              <GitBranch className="w-4 h-4" />
              <span>Entity-Relationship &amp; Cardinality Map</span>
            </div>
            <h3 className="font-serif font-bold text-[#2C2927] text-lg mt-0.5">
              Visual Schema Understanding Diagram (All 15 Entities)
            </h3>
            <p className="text-xs text-[#7A746E]">
              Click any entity box to highlight its foreign-key links, cardinality (<span className="font-mono">1:N</span>, <span className="font-mono">1:1</span>, <span className="font-mono">1:0..1</span>, <span className="font-mono">M:N</span>), and columns.
            </p>
          </div>

          {/* Cardinality Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] bg-[#FAF8F5] border border-[#E5E0D8] px-3 py-2 shrink-0">
            <span className="font-semibold text-[#2C2927]">Legend:</span>
            <span className="flex items-center gap-1 text-[#524D48]">
              <span className="font-mono font-bold text-[#D96B27]">1 ─&lt; N</span>
              <span>One-to-Many</span>
            </span>
            <span className="text-[#CFC9C2]">|</span>
            <span className="flex items-center gap-1 text-[#524D48]">
              <span className="font-mono font-bold text-[#1E5B3E]">1 ── 1</span>
              <span>One-to-One</span>
            </span>
            <span className="text-[#CFC9C2]">|</span>
            <span className="flex items-center gap-1 text-[#524D48]">
              <span className="font-mono font-bold text-[#2C2927]">1 ─o 0..1</span>
              <span>Optional Subtype</span>
            </span>
          </div>
        </div>

        {/* SVG Relationship Diagram */}
        <div className="overflow-x-auto bg-[#FAF8F5] border border-[#E5E0D8] p-3">
          <svg
            viewBox="0 0 1104 600"
            className="w-full min-w-[880px] h-auto select-none"
            role="img"
            aria-label="Entity Relationship and Cardinality Diagram of all 15 database tables"
          >
            <defs>
              {/* Subtle grid pattern */}
              <pattern
                id="er-grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="#EAE4DC"
                  strokeWidth="0.7"
                />
              </pattern>
            </defs>

            <rect width="1104" height="600" fill="url(#er-grid)" />

            {/* Column Group Headers */}
            <text x="24" y="20" className="fill-[#7A746E] text-[10px] font-bold uppercase tracking-wider">
              Identity &amp; Social
            </text>
            <text x="300" y="20" className="fill-[#D96B27] text-[10px] font-bold uppercase tracking-wider">
              Catalog &amp; Listings
            </text>
            <text x="585" y="20" className="fill-[#1E5B3E] text-[10px] font-bold uppercase tracking-wider">
              Orders, Loans &amp; Payments
            </text>
            <text x="870" y="20" className="fill-[#C82333] text-[10px] font-bold uppercase tracking-wider">
              Disputes &amp; Moderation
            </text>

            {/* Relationship Edges (draw non-highlighted first, highlighted on top) */}
            {[...RELATIONSHIPS]
              .sort((a, b) => {
                const aActive = a.from === selectedTable || a.to === selectedTable ? 1 : 0;
                const bActive = b.from === selectedTable || b.to === selectedTable ? 1 : 0;
                return aActive - bActive;
              })
              .map((rel) => {
                const fromNode = ALL_TABLES.find((t) => t.name === rel.from);
                const toNode = ALL_TABLES.find((t) => t.name === rel.to);
                if (!fromNode || !toNode) return null;

                const isHighlighted =
                  rel.from === selectedTable || rel.to === selectedTable;

                const isSameCol = Math.abs(fromNode.x - toNode.x) < 10;
                const ySpan = Math.abs(fromNode.y - toNode.y);
                const isAdjacentSameCol = isSameCol && ySpan < 190;
                const isSkipSameCol = isSameCol && ySpan >= 190;
                const isMultiColJump = Math.abs(fromNode.x - toNode.x) > 320;

                // Determine start and end ports on node boundaries
                const fromCx = fromNode.x + NODE_WIDTH / 2;
                const fromCy = fromNode.y + NODE_HEIGHT / 2;
                const toCx = toNode.x + NODE_WIDTH / 2;
                const toCy = toNode.y + NODE_HEIGHT / 2;

                let x1 = fromCx;
                let y1 = fromCy;
                let x2 = toCx;
                let y2 = toCy;
                let pathD = '';
                let midX = 0;
                let midY = 0;
                let dirX = 0;
                let dirY = 0;

                if (isAdjacentSameCol) {
                  // Adjacent box in same column: clean straight vertical connector
                  if (fromNode.y < toNode.y) {
                    x1 = fromCx;
                    y1 = fromNode.y + NODE_HEIGHT;
                    x2 = toCx;
                    y2 = toNode.y;
                    dirY = -1;
                  } else {
                    x1 = fromCx;
                    y1 = fromNode.y;
                    x2 = toCx;
                    y2 = toNode.y + NODE_HEIGHT;
                    dirY = 1;
                  }
                  pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
                  midX = x1;
                  midY = (y1 + y2) / 2;
                } else if (isSkipSameCol) {
                  // Skips intermediate box(es) in same column: route cleanly through right gutter
                  const gutterOffset = ySpan > 350 ? 44 : 26;
                  const portYOffset = ySpan > 350 ? 14 : -10;
                  x1 = fromNode.x + NODE_WIDTH;
                  y1 = fromCy + portYOffset;
                  x2 = toNode.x + NODE_WIDTH;
                  y2 = toCy + portYOffset;
                  const ctrlX = x1 + gutterOffset;
                  pathD = `M ${x1} ${y1} C ${ctrlX} ${y1}, ${ctrlX} ${y2}, ${x2} ${y2}`;
                  midX = x1 + gutterOffset * 0.74;
                  midY = (y1 + y2) / 2;
                  dirX = 1;
                } else {
                  if (fromNode.x < toNode.x) {
                    x1 = fromNode.x + NODE_WIDTH;
                    y1 = fromCy;
                    x2 = toNode.x;
                    y2 = toCy;
                    dirX = -1;
                  } else {
                    x1 = fromNode.x;
                    y1 = fromCy;
                    x2 = toNode.x + NODE_WIDTH;
                    y2 = toCy;
                    dirX = 1;
                  }
                  const dx = Math.abs(x2 - x1);
                  const ctrlOffset = Math.max(44, dx * 0.42);
                  // Arc multi-column edges slightly through horizontal corridors to avoid intermediate boxes
                  const arcLift = isMultiColJump ? -48 : 0;
                  const c1x = x1 + (x2 > x1 ? ctrlOffset : -ctrlOffset);
                  const c2x = x2 + (x2 > x1 ? -ctrlOffset : ctrlOffset);
                  const c1y = y1 + arcLift;
                  const c2y = y2 + arcLift;
                  pathD = `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;

                  // Place cardinality badge in open column gutter near the selected table
                  const t = rel.from === selectedTable ? 0.22 : 0.78;
                  const mt = 1 - t;
                  midX =
                    mt * mt * mt * x1 +
                    3 * mt * mt * t * c1x +
                    3 * mt * t * t * c2x +
                    t * t * t * x2;
                  midY =
                    mt * mt * mt * y1 +
                    3 * mt * mt * t * c1y +
                    3 * mt * t * t * c2y +
                    t * t * t * y2;
                }

                const strokeColor = isHighlighted
                  ? rel.cardinality === '1:1' || rel.cardinality === '1:0..1'
                    ? '#1E5B3E'
                    : '#D96B27'
                  : '#D5CFC7';

                return (
                  <g
                    key={rel.id}
                    opacity={isHighlighted ? 1 : 0.42}
                  >
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isHighlighted ? 2 : 1.1}
                      strokeDasharray={rel.cardinality === '1:0..1' ? '4 3' : undefined}
                    />

                    {/* Start Marker ("1" dot) */}
                    <circle
                      cx={x1}
                      cy={y1}
                      r={isHighlighted ? 3 : 2}
                      fill={strokeColor}
                    />

                    {/* End Marker: Crow's foot for 1:N, circle for 1:1 / 1:0..1 */}
                    {rel.cardinality === '1:N' ? (
                      <g stroke={strokeColor} strokeWidth={isHighlighted ? 2 : 1.2} fill="none">
                        <line
                          x1={x2}
                          y1={y2}
                          x2={x2 + dirX * 9 + (dirX === 0 ? -6 : 0)}
                          y2={y2 + dirY * 9 + (dirY === 0 ? -5 : 0)}
                        />
                        <line
                          x1={x2}
                          y1={y2}
                          x2={x2 + dirX * 9 + (dirX === 0 ? 6 : 0)}
                          y2={y2 + dirY * 9 + (dirY === 0 ? 5 : 0)}
                        />
                      </g>
                    ) : (
                      <circle
                        cx={x2 + dirX * 6}
                        cy={y2 + dirY * 6}
                        r={3.5}
                        fill="#FFFFFF"
                        stroke={strokeColor}
                        strokeWidth={2}
                      />
                    )}

                    {/* Cardinality Badge on Highlighted Edges */}
                    {isHighlighted && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-20"
                          y="-9"
                          width="40"
                          height="18"
                          rx="2"
                          fill="#2C2927"
                        />
                        <text
                          x="0"
                          y="3.5"
                          textAnchor="middle"
                          className="fill-white text-[9.5px] font-mono font-bold"
                        >
                          {rel.cardinality}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

            {/* Entity Boxes */}
            {ALL_TABLES.map((tbl) => {
              const isSelected = tbl.name === selectedTable;
              const isConnected = connectedNodeNames.has(tbl.name);
              const meta = DOMAIN_META[tbl.domain];
              const rowCount = getRowCount(dbState, tbl.name);

              return (
                <g
                  key={tbl.name}
                  transform={`translate(${tbl.x}, ${tbl.y})`}
                  onClick={() => setSelectedTable(tbl.name)}
                  className="cursor-pointer"
                  opacity={isConnected ? 1 : 0.68}
                >
                  {/* Card Shadow/Body */}
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    fill="#FFFFFF"
                    stroke={isSelected ? '#D96B27' : isConnected ? '#2C2927' : '#D5CFC7'}
                    strokeWidth={isSelected ? 2.2 : 1.2}
                  />
                  {/* Top Domain Accent Strip */}
                  <rect width={NODE_WIDTH} height="24" fill={isSelected ? '#D96B27' : meta.accent} />
                  <text
                    x="10"
                    y="15.5"
                    className="fill-white text-[11px] font-mono font-bold"
                  >
                    {tbl.name}
                  </text>
                  <text
                    x={NODE_WIDTH - 10}
                    y="15.5"
                    textAnchor="end"
                    className="fill-white/90 text-[9.5px] font-sans"
                  >
                    {rowCount} {rowCount === 1 ? 'row' : 'rows'}
                  </text>

                  {/* PK + Columns preview */}
                  <text
                    x="10"
                    y="43"
                    className="fill-[#2C2927] text-[10px] font-mono font-semibold"
                  >
                    PK: {tbl.pk}
                  </text>
                  <text
                    x="10"
                    y="60"
                    className="fill-[#7A746E] text-[9.5px] font-sans"
                  >
                    {tbl.columns.length} cols ·{' '}
                    {(() => {
                      const fkCount = tbl.columns.filter((c) =>
                        c.key?.includes('FK')
                      ).length;
                      return `${fkCount} ${fkCount === 1 ? 'FK' : 'FKs'}`;
                    })()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Entity Relationship Inspector */}
        <div className="bg-[#FAF8F5] border border-[#E5E0D8] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#2C2927]">
                  {activeTableDef.name}
                </span>
                <span className="text-[11px] text-[#7A746E]">
                  ({getRowCount(dbState, activeTableDef.name)} live rows)
                </span>
              </div>
              <p className="text-xs text-[#524D48] mt-0.5">
                {activeTableDef.summary}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onRunTableQuery(activeTableDef.name)}
              className="px-3.5 py-1.5 border border-[#D96B27] text-[#D96B27] hover:bg-[#D96B27] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>SELECT * FROM {activeTableDef.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs pt-2 border-t border-[#E5E0D8]">
            {connectedRelationships.map((rel) => {
              const isParent = rel.from === selectedTable;
              return (
                <div
                  key={rel.id}
                  onClick={() => setSelectedTable(isParent ? rel.to : rel.from)}
                  className="bg-white border border-[#E5E0D8] hover:border-[#D96B27] p-2.5 cursor-pointer transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] text-[#2C2927] font-semibold truncate">
                      {rel.from} ({rel.cardinality.split(':')[0]}) → {rel.to} ({rel.cardinality.split(':')[1]})
                    </div>
                    <div className="text-[10px] text-[#7A746E] truncate mt-0.5">
                      FK: <span className="font-mono text-[#524D48]">{rel.fk}</span> · {rel.label}
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-[#2C2927] text-white font-mono text-[10px] font-bold shrink-0">
                    {rel.cardinality}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Complete 15-Table Dictionary Cards */}
      <div className="bg-white border border-[#E5E0D8] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D8] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1E5B3E]">
              <Database className="w-4 h-4" />
              <span>Normalized Database Catalog</span>
            </div>
            <h3 className="font-serif font-bold text-[#2C2927] text-lg mt-0.5">
              All {ALL_TABLES.length} Relational Tables &amp; Constraints
            </h3>
          </div>

          {/* Domain Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setDomainFilter('all')}
              className={`px-3 py-1 border transition-colors ${
                domainFilter === 'all'
                  ? 'border-[#2C2927] bg-[#2C2927] text-white font-semibold'
                  : 'border-[#D5CFC7] bg-white text-[#524D48] hover:border-[#2C2927]'
              }`}
            >
              All ({ALL_TABLES.length})
            </button>
            {(Object.keys(DOMAIN_META) as SchemaDomain[]).map((dom) => (
              <button
                key={dom}
                onClick={() => setDomainFilter(dom)}
                className={`px-3 py-1 border transition-colors ${
                  domainFilter === dom
                    ? 'border-[#D96B27] bg-[#D96B27] text-white font-semibold'
                    : 'border-[#D5CFC7] bg-white text-[#524D48] hover:border-[#2C2927]'
                }`}
              >
                {DOMAIN_META[dom].label}
              </button>
            ))}
          </div>
        </div>

        {/* All 15 Table Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {visibleTables.map((tbl) => {
            const isSelected = tbl.name === selectedTable;
            const rowCount = getRowCount(dbState, tbl.name);
            const meta = DOMAIN_META[tbl.domain];

            return (
              <div
                key={tbl.name}
                onClick={() => setSelectedTable(tbl.name)}
                className={`border p-4 space-y-3 transition-colors cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#D96B27] bg-[#FAF8F5] ring-1 ring-[#D96B27]'
                    : 'border-[#E5E0D8] bg-[#FAF8F5]/60 hover:border-[#2C2927]'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#E5E0D8]">
                    <div>
                      <div className="font-mono font-bold text-sm text-[#2C2927]">
                        {tbl.name}
                      </div>
                      <div className="text-[10px] text-[#7A746E] mt-0.5">
                        {meta.label} · {rowCount} {rowCount === 1 ? 'row' : 'rows'}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#7A746E] flex items-center gap-1 shrink-0">
                      <Key className="w-3 h-3 text-[#D96B27]" />
                      {tbl.pk}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-[11px]">
                    {tbl.columns.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between gap-2 text-[#524D48]"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {col.key ? (
                            <span
                              className={`text-[9px] font-bold px-1 py-0.2 shrink-0 ${
                                col.key.includes('PK')
                                  ? 'bg-[#2C2927] text-white'
                                  : col.key.includes('UK')
                                  ? 'bg-[#1E5B3E] text-white'
                                  : 'bg-[#D96B27] text-white'
                              }`}
                            >
                              {col.key}
                            </span>
                          ) : (
                            <span className="w-5 shrink-0" />
                          )}
                          <span className="truncate text-[#2C2927]">{col.name}</span>
                        </div>
                        <span className="text-[10px] text-[#7A746E] shrink-0">
                          {col.ref ? `→ ${col.ref}` : col.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-between">
                  <span className="text-[10px] text-[#7A746E]">
                    {tbl.columns.length} columns
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRunTableQuery(tbl.name);
                    }}
                    className="text-[11px] font-semibold text-[#D96B27] hover:underline"
                  >
                    Query rows →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
