// Bundled SQL DDL & DML scripts for isomorphic execution in browser (Vite) & Node tests (tsx)
// Tested in dbEngine.test.ts to stay 100% identical to src/db/schema.sql and src/db/seed.sql

export const SCHEMA_SQL = `-- ============================================================================
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
`;

export const SEED_SQL = `-- ============================================================================
-- ReUseNSUT Seed Data (SQL DML)
-- Populates all 15 relational tables using standard SQL INSERT statements
-- ============================================================================

INSERT INTO Users (user_id, roll_number, name, university_email, phone, password_hash, verification_status, account_role, account_status, joined_at, branch, year, hostel_status, avatar_url) VALUES
(1, '2025UCS1649', 'Aryan Kumar Singh', 'aryank.ug25@nsut.ac.in', '+91 98101 23456', 'argon2_hash_pbkdf2_nsut_secure', 'verified', 'student', 'active', '2025-08-10T10:00:00Z', 'B.Tech CSE', '2nd Year (3rd Sem)', 'Hosteller', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
(2, '2024UEC1210', 'Sneha Verma', 'snehav.ug24@nsut.ac.in', '+91 98765 43210', 'argon2_hash_pbkdf2_nsut_secure', 'verified', 'student', 'active', '2024-08-01T09:30:00Z', 'B.Tech ECE', '3rd Year (5th Sem)', 'Day Scholar', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'),
(3, '2025UIT1080', 'Rohan Gupta', 'rohang.ug25@nsut.ac.in', '+91 97112 34567', 'argon2_hash_pbkdf2_nsut_secure', 'verified', 'student', 'active', '2025-08-12T14:15:00Z', 'B.Tech IT', '2nd Year (3rd Sem)', 'Hosteller', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
(4, '2023UME1045', 'Priya Sharma', 'priyas.ug23@nsut.ac.in', '+91 99887 76655', 'argon2_hash_pbkdf2_nsut_secure', 'verified', 'student', 'active', '2023-08-05T11:00:00Z', 'B.Tech ME', '4th Year (7th Sem)', 'Hosteller', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80'),
(5, '2026UCS1901', 'Tanmay Bhattacharya', 'tanmayb.ug26@nsut.ac.in', '+91 91234 56789', 'argon2_hash_pbkdf2_nsut_secure', 'pending', 'student', 'active', '2026-08-18T16:20:00Z', 'B.Tech CSE', '1st Year (1st Sem)', 'Day Scholar', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
(6, 'ADMIN-001', 'Admin', 'admin@nsut.ac.in', '+91 98111 22334', 'argon2_admin_secure_salt', 'verified', 'admin', 'active', '2020-01-15T08:00:00Z', 'Campus Administration', 'Administrator', 'Day Scholar', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80');

INSERT INTO Categories (category_id, category_name, description, icon_name) VALUES
(1, 'Textbooks & Course Notes', 'Core B.Tech semester textbooks, reference books, lecture notes, and question banks.', 'BookOpen'),
(2, 'Calculators & Math Tools', 'Scientific calculators approved for university exams (Casio fx-991 series).', 'Calculator'),
(3, 'Lab Drafters & Aprons', 'Engineering drawing drafters, drawing sheets, T-squares, and chemistry lab aprons.', 'Compass'),
(4, 'Electronics & Kits', 'Arduino boards, ESP32, breadboards, Raspberry Pi, multimeters, and electronic components.', 'Cpu'),
(5, 'Hostel & Room Essentials', 'Electric kettles, study lamps, storage crates, shoe racks, and room heaters.', 'Home'),
(6, 'Bicycles & Sports Gear', 'Campus commute bicycles, badminton rackets, cricket gear, and footballs.', 'Bike');

INSERT INTO Items (item_id, owner_id, category_id, item_name, description, item_condition, created_at) VALUES
(1, 1, 1, 'Cormen (CLRS) Introduction to Algorithms (4th Edition)', 'Hardcover textbook for 3rd semester Data Structures & Algorithms. Crisp pages with helpful pencil highlights for dynamic programming and graphs.', 'like_new', '2026-02-10T12:00:00Z'),
(2, 2, 2, 'Casio fx-991CW ClassWiz Scientific Calculator', 'Genuine natural textbook display calculator. All buttons tested and responsive with fresh solar battery. Essential for engineering math and circuits exams.', 'like_new', '2026-02-12T14:30:00Z'),
(3, 4, 3, 'Omega Engineering Mini Drafter with Deluxe Padded Case', 'High-precision stainless steel mini drafter with clamp and 360-degree protractor head. Used for 1st year Engineering Graphics. Zero slack.', 'good', '2026-02-14T09:15:00Z'),
(4, 3, 4, 'Arduino Uno R3 Ultimate Starter Kit with 30+ Sensors', 'Complete embedded systems lab kit with Uno board, ultrasonic sensor, RFID, LCD 16x2, stepper motor, and jumper wires.', 'good', '2026-02-15T18:40:00Z'),
(5, 1, 1, 'Silberschatz & Galvin Operating System Concepts (10th Ed)', 'Standard dinosaur book for 4th semester OS course. Giving away freely to juniors who need it for mid-sems.', 'good', '2026-02-18T11:20:00Z'),
(6, 2, 6, 'Hero Sprint 26T Single Speed Campus Bicycle with Number Lock', 'Reliable campus cycle for moving between Moksha ground, library, and APJ lecture complex. New tyres and lubricated chain.', 'good', '2026-02-20T16:00:00Z'),
(7, 3, 1, 'Database System Concepts by Silberschatz, Korth & Sudarshan (7th Ed)', 'The definitive DBMS book for CSE/IT students. Clean condition, includes CD and SQL practice guides.', 'like_new', '2026-02-22T10:00:00Z'),
(8, 4, 3, 'Pure Cotton Chemistry Lab Coat / Apron (Size M)', 'Preshrunk thick white lab coat with deep pockets. Required for Chemistry and Material Science lab sessions.', 'good', '2026-02-24T13:45:00Z'),
(9, 1, 5, 'Prestige 1.5 Litre Stainless Steel Electric Kettle', 'Fast boiling 1500W electric kettle with auto shut-off. Perfect for late-night hostel study sessions and noodles.', 'good', '2026-02-25T15:10:00Z'),
(10, 3, 2, 'Casio fx-991EX ClassWiz Classic Scientific Calculator', 'Trusted high-speed spreadsheet calculator with QR code graph view. Battery checked last week.', 'fair', '2026-02-26T17:30:00Z');

INSERT INTO Item_Images (image_id, item_id, image_url, uploaded_at) VALUES
(1, 1, '/images/items/clrs-algorithms.jpg', '2026-02-10T12:05:00Z'),
(2, 2, '/images/items/casio-991cw.jpg', '2026-02-12T14:35:00Z'),
(3, 3, '/images/items/mini-drafter.jpg', '2026-02-14T09:20:00Z'),
(4, 4, '/images/items/arduino-kit.jpg', '2026-02-15T18:45:00Z'),
(5, 5, '/images/items/os-textbook.jpg', '2026-02-18T11:25:00Z'),
(6, 6, '/images/items/campus-bicycle.jpg', '2026-02-20T16:05:00Z'),
(7, 7, '/images/items/dbms-textbook.jpg', '2026-02-22T10:05:00Z'),
(8, 8, '/images/items/chemistry-lab-coat.jpg', '2026-02-24T13:50:00Z'),
(9, 9, '/images/items/electric-kettle.jpg', '2026-02-25T15:15:00Z'),
(10, 10, '/images/items/casio-991ex.jpg', '2026-02-26T17:35:00Z');

INSERT INTO Listings (listing_id, item_id, listing_type, price, deposit_amount, posted_at, expiry_date, listing_status) VALUES
(1, 1, 'sale', 450, 0, '2026-02-10T12:10:00Z', '2026-05-15', 'active'),
(2, 2, 'lend', 80, 500, '2026-02-12T14:40:00Z', '2026-04-30', 'active'),
(3, 3, 'lend', 50, 300, '2026-02-14T09:25:00Z', '2026-05-01', 'completed'),
(4, 4, 'exchange', 0, 0, '2026-02-15T18:50:00Z', '2026-06-01', 'active'),
(5, 5, 'donation', 0, 0, '2026-02-18T11:30:00Z', '2026-04-20', 'active'),
(6, 6, 'lend', 150, 800, '2026-02-20T16:10:00Z', '2026-05-20', 'active'),
(7, 7, 'sale', 320, 0, '2026-02-22T10:10:00Z', '2026-05-10', 'active'),
(8, 8, 'donation', 0, 0, '2026-02-24T13:55:00Z', '2026-04-30', 'active'),
(9, 9, 'sale', 350, 0, '2026-02-25T15:20:00Z', '2026-05-30', 'active'),
(10, 10, 'lend', 60, 400, '2026-02-26T17:40:00Z', '2026-04-15', 'active');

INSERT INTO Listing_Requests (request_id, listing_id, requester_id, request_message, requested_at, request_status, handover_location, handover_time) VALUES
(1, 3, 1, 'Hi Priya! Need this mini drafter for my EG mid-sem sheet next week. Can meet at Student Center.', '2026-02-16T10:00:00Z', 'accepted', 'Student Center, Ground Floor', '1:30 PM (Lunch break)'),
(2, 1, 3, 'Hey Aryan, interested in buying the CLRS book. Can we meet near Amul Cafe today?', '2026-02-23T14:00:00Z', 'pending', 'Amul Cafe NSUT', '5:00 PM'),
(4, 5, 4, 'Thank you for donating this Aryan! Our junior wing in GH-1 will really benefit from it.', '2026-02-25T11:00:00Z', 'accepted', 'Girls Hostel 1 Gate', '6:00 PM');

INSERT INTO Listing_Requests (request_id, listing_id, requester_id, offered_item_id, request_message, requested_at, request_status, handover_location, handover_time) VALUES
(3, 4, 2, 2, 'Hi Rohan! I have an extra Casio fx-991CW that I can exchange for your Arduino kit for this semester IoT project.', '2026-02-24T16:00:00Z', 'pending', 'Central Library Lawn', '4:15 PM');

INSERT INTO Transactions (transaction_id, request_id, transaction_status, agreed_amount, created_at, completed_at) VALUES
(1, 1, 'completed', 50, '2026-02-16T11:00:00Z', '2026-02-23T17:00:00Z');

INSERT INTO Transactions (transaction_id, request_id, transaction_status, agreed_amount, created_at) VALUES
(2, 4, 'in_progress', 0, '2026-02-25T12:00:00Z');

INSERT INTO Loans (transaction_id, due_date, returned_at, loan_status, condition_on_return) VALUES
(1, '2026-02-22', '2026-02-21T16:30:00Z', 'returned', 'Excellent condition, all scales intact and calibrated.');

INSERT INTO Payments (payment_id, transaction_id, payer_id, payment_type, amount, payment_method, payment_status, paid_at) VALUES
(1, 1, 1, 'purchase', 50, 'upi', 'completed', '2026-02-16T11:30:00Z'),
(2, 1, 1, 'deposit', 300, 'upi', 'completed', '2026-02-16T11:30:00Z'),
(3, 1, 4, 'refund', 300, 'upi', 'refunded', '2026-02-21T16:35:00Z');

INSERT INTO Reviews (review_id, transaction_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES
(1, 1, 4, 1, 5, 'Aryan returned the mini drafter a day early and in pristine shape. Highly recommended borrower!', '2026-02-22T09:00:00Z'),
(2, 1, 1, 4, 5, 'Smooth handover at Student Center, prompt deposit refund upon return. Great senior!', '2026-02-22T09:30:00Z'),
(3, 1, 2, 3, 4, 'Reliable person, fast communication on campus.', '2026-02-10T15:00:00Z');

INSERT INTO Disputes (dispute_id, transaction_id, raised_by, dispute_reason, description, resolution_status, resolution, assigned_admin, raised_at, resolved_at) VALUES
(1, 1, 3, 'Deposit Refund Delay', 'Security deposit was not instantly marked refunded on UPI; student resolved it post message confirmation.', 'resolved', 'Verified UPI reference number, deposit marked as refunded safely by proctor.', 6, '2026-02-15T14:00:00Z', '2026-02-16T10:00:00Z');

INSERT INTO Saved_Listings (user_id, listing_id, saved_at) VALUES
(1, 2, '2026-02-13T10:00:00Z'),
(1, 6, '2026-02-21T08:30:00Z'),
(3, 1, '2026-02-11T19:00:00Z');

INSERT INTO Reports (report_id, reporter_id, reported_user_id, report_reason, description, report_status, reported_at) VALUES
(1, 2, 5, 'Unverified email documentation', 'Account profile needs confirmation of roll number ID card before posting permissions.', 'pending', '2026-02-27T11:00:00Z');

INSERT INTO Messages (message_id, sender_id, receiver_id, listing_id, message_text, sent_at, read_at) VALUES
(1, 1, 4, 3, 'Hey Priya, is the mini drafter available for next week?', '2026-02-15T18:00:00Z', '2026-02-15T18:05:00Z'),
(2, 4, 1, 3, 'Yes Aryan! We can meet at the Student Center tomorrow at 1:30 PM.', '2026-02-15T18:10:00Z', '2026-02-15T18:12:00Z');

INSERT INTO Messages (message_id, sender_id, receiver_id, listing_id, message_text, sent_at) VALUES
(3, 3, 1, 1, 'Hi Aryan, can you negotiate ₹400 for CLRS Algorithms book? I am at BH-1 hostel.', '2026-02-23T14:05:00Z');
`;
