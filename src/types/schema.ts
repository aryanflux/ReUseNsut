// ReUseNSUT Database Types and Schema Definitions
// Based on DBMS Project Document & DBML Schema for NSUT Delhi

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type AccountRole = 'student' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'deactivated';

export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';
export type ListingType = 'sale' | 'lend' | 'exchange' | 'donation';
export type ListingStatus = 'active' | 'reserved' | 'completed' | 'withdrawn' | 'expired';

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'fulfilled';
export type TransactionStatus = 'pending_handover' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export type LoanStatus = 'active' | 'returned' | 'lost';

export type PaymentType = 'purchase' | 'deposit' | 'refund' | 'penalty';
export type PaymentMethod = 'upi' | 'cash' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'rejected';
export type ReportStatus = 'pending' | 'under_review' | 'action_taken' | 'dismissed';

export interface User {
  user_id: number;
  roll_number: string;
  name: string;
  university_email: string;
  phone: string;
  password_hash: string;
  verification_status: VerificationStatus;
  account_role: AccountRole;
  account_status: AccountStatus;
  joined_at: string;
  // Augmented UI profile fields
  branch?: string;
  year?: string;
  hostel_status?: 'Hosteller' | 'Day Scholar';
  avatar_url?: string;
}

export interface Category {
  category_id: number;
  category_name: string;
  description: string;
  icon_name?: string;
}

export interface Item {
  item_id: number;
  owner_id: number;
  category_id: number;
  item_name: string;
  description: string;
  item_condition: ItemCondition;
  created_at: string;
}

export interface ItemImage {
  image_id: number;
  item_id: number;
  image_url: string;
  uploaded_at: string;
}

export interface Listing {
  listing_id: number;
  item_id: number;
  listing_type: ListingType;
  price: number;
  deposit_amount: number;
  posted_at: string;
  expiry_date?: string;
  listing_status: ListingStatus;
}

export interface ListingRequest {
  request_id: number;
  listing_id: number;
  requester_id: number;
  offered_item_id?: number | null;
  request_message: string;
  requested_at: string;
  request_status: RequestStatus;
  handover_location?: string;
  handover_time?: string;
}

export interface Transaction {
  transaction_id: number;
  request_id: number;
  transaction_status: TransactionStatus;
  agreed_amount: number;
  created_at: string;
  completed_at?: string | null;
}

export interface Loan {
  transaction_id: number;
  due_date: string;
  returned_at?: string | null;
  loan_status: LoanStatus;
  condition_on_return?: string | null;
}

export interface Payment {
  payment_id: number;
  transaction_id: number;
  payer_id: number;
  payment_type: PaymentType;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  paid_at?: string | null;
}

export interface Review {
  review_id: number;
  transaction_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number; // 1-5
  comment: string;
  created_at: string;
}

export interface Dispute {
  dispute_id: number;
  transaction_id: number;
  raised_by: number;
  dispute_reason: string;
  description: string;
  resolution_status: DisputeStatus;
  resolution?: string | null;
  assigned_admin?: number | null;
  raised_at: string;
  resolved_at?: string | null;
}

export interface SavedListing {
  user_id: number;
  listing_id: number;
  saved_at: string;
}

export interface Report {
  report_id: number;
  reporter_id: number;
  reported_user_id?: number | null;
  listing_id?: number | null;
  report_reason: string;
  description: string;
  report_status: ReportStatus;
  reported_at: string;
}

export interface ReportAction {
  report_action_id: number;
  report_id: number;
  admin_id: number;
  action_taken: string;
  action_details: string;
  action_date: string;
}

export interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  listing_id?: number | null;
  message_text: string;
  sent_at: string;
  read_at?: string | null;
}

// Joined View Models for Rich UI Rendering
export interface EnrichedListing {
  listing: Listing;
  item: Item;
  category: Category;
  owner: User;
  images: ItemImage[];
  requestCount: number;
  isSaved?: boolean;
}
