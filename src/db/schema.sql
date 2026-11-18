-- ============================================================================
-- ReUseNSUT Relational Database Schema (SQL DDL)
-- 15 Normalized Tables (3NF) across Identity, Catalog, Fulfillment & Trust
-- ============================================================================

DROP TABLE IF EXISTS Messages;
DROP TABLE IF EXISTS Report_Actions;
DROP TABLE IF EXISTS Reports;
DROP TABLE IF EXISTS Saved_Listings;
DROP TABLE IF EXISTS Disputes;
DROP TABLE IF EXISTS Reviews;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS Loans;
DROP TABLE IF EXISTS Transactions;
DROP TABLE IF EXISTS Listing_Requests;
DROP TABLE IF EXISTS Listings;
DROP TABLE IF EXISTS Item_Images;
DROP TABLE IF EXISTS Items;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Users;

-- 1. Users: Verified students and campus administrator accounts
CREATE TABLE Users (
  user_id INT PRIMARY KEY,
  roll_number VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  university_email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  account_role VARCHAR(20) NOT NULL DEFAULT 'student',
  account_status VARCHAR(20) NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP NOT NULL,
  branch VARCHAR(100),
  year VARCHAR(50),
  hostel_status VARCHAR(30),
  avatar_url VARCHAR(500),
  CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  CHECK (account_role IN ('student', 'admin')),
  CHECK (account_status IN ('active', 'suspended', 'deactivated'))
);

-- 2. Categories: Academic and campus item taxonomy
CREATE TABLE Categories (
  category_id INT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_name VARCHAR(50)
);

-- 3. Items: Physical student-owned academic gear (decoupled from Listings)
CREATE TABLE Items (
  item_id INT PRIMARY KEY,
  owner_id INT NOT NULL,
  category_id INT NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  description TEXT,
  item_condition VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CHECK (item_condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  FOREIGN KEY (owner_id) REFERENCES Users(user_id),
  FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

-- 4. Item_Images: Photographs linked to physical items (1:N)
CREATE TABLE Item_Images (
  image_id INT PRIMARY KEY,
  item_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL,
  FOREIGN KEY (item_id) REFERENCES Items(item_id)
);

-- 5. Listings: Marketplace offers (sale, lend, exchange, donation)
CREATE TABLE Listings (
  listing_id INT PRIMARY KEY,
  item_id INT NOT NULL,
  listing_type VARCHAR(20) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  posted_at TIMESTAMP NOT NULL,
  expiry_date DATE,
  listing_status VARCHAR(20) NOT NULL DEFAULT 'active',
  CHECK (listing_type IN ('sale', 'lend', 'exchange', 'donation')),
  CHECK (listing_status IN ('active', 'reserved', 'completed', 'withdrawn', 'expired')),
  FOREIGN KEY (item_id) REFERENCES Items(item_id)
);

-- 6. Listing_Requests: Student requests on listings (unique per requester & listing)
CREATE TABLE Listing_Requests (
  request_id INT PRIMARY KEY,
  listing_id INT NOT NULL,
  requester_id INT NOT NULL,
  offered_item_id INT NULL,
  request_message TEXT,
  requested_at TIMESTAMP NOT NULL,
  request_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  handover_location VARCHAR(150),
  handover_time VARCHAR(100),
  CHECK (request_status IN ('pending', 'accepted', 'rejected', 'cancelled', 'fulfilled')),
  CONSTRAINT uq_listing_requester UNIQUE (listing_id, requester_id),
  FOREIGN KEY (listing_id) REFERENCES Listings(listing_id),
  FOREIGN KEY (requester_id) REFERENCES Users(user_id),
  FOREIGN KEY (offered_item_id) REFERENCES Items(item_id)
);

-- 7. Transactions: Confirmed 1:1 handover order created from an accepted request
CREATE TABLE Transactions (
  transaction_id INT PRIMARY KEY,
  request_id INT NOT NULL UNIQUE,
  transaction_status VARCHAR(30) NOT NULL DEFAULT 'pending_handover',
  agreed_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NULL,
  CHECK (transaction_status IN ('pending_handover', 'in_progress', 'completed', 'cancelled', 'disputed')),
  FOREIGN KEY (request_id) REFERENCES Listing_Requests(request_id)
);

-- 8. Loans: 1:0..1 subtype extension tracking return deadlines for lend orders
CREATE TABLE Loans (
  transaction_id INT PRIMARY KEY,
  due_date DATE NOT NULL,
  returned_at TIMESTAMP NULL,
  loan_status VARCHAR(20) NOT NULL DEFAULT 'active',
  condition_on_return TEXT NULL,
  CHECK (loan_status IN ('active', 'returned', 'lost')),
  FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id)
);

-- 9. Payments: Financial ledger for purchases, deposits, refunds & penalties
CREATE TABLE Payments (
  payment_id INT PRIMARY KEY,
  transaction_id INT NOT NULL,
  payer_id INT NOT NULL,
  payment_type VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'upi',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP NULL,
  CHECK (payment_type IN ('purchase', 'deposit', 'refund', 'penalty')),
  CHECK (payment_method IN ('upi', 'cash', 'other')),
  CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id),
  FOREIGN KEY (payer_id) REFERENCES Users(user_id)
);

-- 10. Reviews: Mutual peer ratings feeding student trust scores
CREATE TABLE Reviews (
  review_id INT PRIMARY KEY,
  transaction_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  reviewee_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP NOT NULL,
  CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT uq_transaction_reviewer UNIQUE (transaction_id, reviewer_id),
  FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id),
  FOREIGN KEY (reviewer_id) REFERENCES Users(user_id),
  FOREIGN KEY (reviewee_id) REFERENCES Users(user_id)
);

-- 11. Disputes: Escalated transaction complaints assigned to Admin
CREATE TABLE Disputes (
  dispute_id INT PRIMARY KEY,
  transaction_id INT NOT NULL,
  raised_by INT NOT NULL,
  dispute_reason VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  resolution_status VARCHAR(20) NOT NULL DEFAULT 'open',
  resolution TEXT NULL,
  assigned_admin INT NULL,
  raised_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP NULL,
  CHECK (resolution_status IN ('open', 'under_review', 'resolved', 'rejected')),
  FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id),
  FOREIGN KEY (raised_by) REFERENCES Users(user_id),
  FOREIGN KEY (assigned_admin) REFERENCES Users(user_id)
);

-- 12. Saved_Listings: Composite-PK junction table (M:N) for bookmarked listings
CREATE TABLE Saved_Listings (
  user_id INT NOT NULL,
  listing_id INT NOT NULL,
  saved_at TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, listing_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (listing_id) REFERENCES Listings(listing_id)
);

-- 13. Reports: User or listing safety/moderation flags
CREATE TABLE Reports (
  report_id INT PRIMARY KEY,
  reporter_id INT NOT NULL,
  reported_user_id INT NULL,
  listing_id INT NULL,
  report_reason VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  report_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reported_at TIMESTAMP NOT NULL,
  CHECK (report_status IN ('pending', 'under_review', 'action_taken', 'dismissed')),
  FOREIGN KEY (reporter_id) REFERENCES Users(user_id),
  FOREIGN KEY (reported_user_id) REFERENCES Users(user_id),
  FOREIGN KEY (listing_id) REFERENCES Listings(listing_id)
);

-- 14. Report_Actions: Audit trail of admin moderation actions
CREATE TABLE Report_Actions (
  report_action_id INT PRIMARY KEY,
  report_id INT NOT NULL,
  admin_id INT NOT NULL,
  action_taken VARCHAR(100) NOT NULL,
  action_details TEXT NOT NULL,
  action_date TIMESTAMP NOT NULL,
  FOREIGN KEY (report_id) REFERENCES Reports(report_id),
  FOREIGN KEY (admin_id) REFERENCES Users(user_id)
);

-- 15. Messages: Direct peer-to-peer campus chat optionally linked to a listing
CREATE TABLE Messages (
  message_id INT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  listing_id INT NULL,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP NOT NULL,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (sender_id) REFERENCES Users(user_id),
  FOREIGN KEY (receiver_id) REFERENCES Users(user_id),
  FOREIGN KEY (listing_id) REFERENCES Listings(listing_id)
);
