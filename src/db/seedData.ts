// Realistic seed data representing the NSUT Delhi campus marketplace
// Aligned with the 15-table DBML schema

import {
  User,
  Category,
  Item,
  ItemImage,
  Listing,
  ListingRequest,
  Transaction,
  Loan,
  Payment,
  Review,
  Dispute,
  SavedListing,
  Report,
  ReportAction,
  Message,
} from '../types/schema.ts';

export const INITIAL_USERS: User[] = [
  {
    user_id: 1,
    roll_number: '2025UCS1649',
    name: 'Aryan Kumar Singh',
    university_email: 'aryank.ug25@nsut.ac.in',
    phone: '+91 98101 23456',
    password_hash: 'argon2_hash_pbkdf2_nsut_secure',
    verification_status: 'verified',
    account_role: 'student',
    account_status: 'active',
    joined_at: '2025-08-10T10:00:00Z',
    branch: 'B.Tech CSE',
    year: '2nd Year (3rd Sem)',
    hostel_status: 'Hosteller',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    user_id: 2,
    roll_number: '2024UEC1210',
    name: 'Sneha Verma',
    university_email: 'snehav.ug24@nsut.ac.in',
    phone: '+91 98765 43210',
    password_hash: 'argon2_hash_pbkdf2_nsut_secure',
    verification_status: 'verified',
    account_role: 'student',
    account_status: 'active',
    joined_at: '2024-08-01T09:30:00Z',
    branch: 'B.Tech ECE',
    year: '3rd Year (5th Sem)',
    hostel_status: 'Day Scholar',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    user_id: 3,
    roll_number: '2025UIT1080',
    name: 'Rohan Gupta',
    university_email: 'rohang.ug25@nsut.ac.in',
    phone: '+91 97112 34567',
    password_hash: 'argon2_hash_pbkdf2_nsut_secure',
    verification_status: 'verified',
    account_role: 'student',
    account_status: 'active',
    joined_at: '2025-08-12T14:15:00Z',
    branch: 'B.Tech IT',
    year: '2nd Year (3rd Sem)',
    hostel_status: 'Hosteller',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    user_id: 4,
    roll_number: '2023UME1045',
    name: 'Priya Sharma',
    university_email: 'priyas.ug23@nsut.ac.in',
    phone: '+91 99887 76655',
    password_hash: 'argon2_hash_pbkdf2_nsut_secure',
    verification_status: 'verified',
    account_role: 'student',
    account_status: 'active',
    joined_at: '2023-08-05T11:00:00Z',
    branch: 'B.Tech ME',
    year: '4th Year (7th Sem)',
    hostel_status: 'Hosteller',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  },
  {
    user_id: 5,
    roll_number: '2026UCS1901',
    name: 'Tanmay Bhattacharya',
    university_email: 'tanmayb.ug26@nsut.ac.in',
    phone: '+91 91234 56789',
    password_hash: 'argon2_hash_pbkdf2_nsut_secure',
    verification_status: 'pending',
    account_role: 'student',
    account_status: 'active',
    joined_at: '2026-08-18T16:20:00Z',
    branch: 'B.Tech CSE',
    year: '1st Year (1st Sem)',
    hostel_status: 'Day Scholar',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    user_id: 6,
    roll_number: 'FAC-CSE-004',
    name: 'Dr. Vivek Mehta',
    university_email: 'vivek.mehta@nsut.ac.in',
    phone: '+91 98111 22334',
    password_hash: 'argon2_admin_secure_salt',
    verification_status: 'verified',
    account_role: 'admin',
    account_status: 'active',
    joined_at: '2020-01-15T08:00:00Z',
    branch: 'CSE Department Faculty',
    year: 'Faculty & Proctor',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    category_id: 1,
    category_name: 'Textbooks & Course Notes',
    description: 'Core B.Tech semester textbooks, reference books, lecture notes, and question banks.',
    icon_name: 'BookOpen',
  },
  {
    category_id: 2,
    category_name: 'Calculators & Math Tools',
    description: 'Scientific calculators approved for university exams (Casio fx-991 series).',
    icon_name: 'Calculator',
  },
  {
    category_id: 3,
    category_name: 'Lab Drafters & Aprons',
    description: 'Engineering drawing drafters, drawing sheets, T-squares, and chemistry lab aprons.',
    icon_name: 'Compass',
  },
  {
    category_id: 4,
    category_name: 'Electronics & Kits',
    description: 'Arduino boards, ESP32, breadboards, Raspberry Pi, multimeters, and electronic components.',
    icon_name: 'Cpu',
  },
  {
    category_id: 5,
    category_name: 'Hostel & Room Essentials',
    description: 'Electric kettles, study lamps, storage crates, shoe racks, and room heaters.',
    icon_name: 'Home',
  },
  {
    category_id: 6,
    category_name: 'Bicycles & Sports Gear',
    description: 'Campus commute bicycles, badminton rackets, cricket gear, and footballs.',
    icon_name: 'Bike',
  },
];

export const INITIAL_ITEMS: Item[] = [
  {
    item_id: 1,
    owner_id: 1, // Aryan
    category_id: 1,
    item_name: 'Cormen (CLRS) Introduction to Algorithms (4th Edition)',
    description: 'Hardcover textbook for 3rd semester Data Structures & Algorithms. Crisp pages with helpful pencil highlights for dynamic programming and graphs.',
    item_condition: 'like_new',
    created_at: '2026-02-10T12:00:00Z',
  },
  {
    item_id: 2,
    owner_id: 2, // Sneha
    category_id: 2,
    item_name: 'Casio fx-991CW ClassWiz Scientific Calculator',
    description: 'Genuine natural textbook display calculator. All buttons tested and responsive with fresh solar battery. Essential for engineering math and circuits exams.',
    item_condition: 'like_new',
    created_at: '2026-02-12T14:30:00Z',
  },
  {
    item_id: 3,
    owner_id: 4, // Priya
    category_id: 3,
    item_name: 'Omega Engineering Mini Drafter with Deluxe Padded Case',
    description: 'High-precision stainless steel mini drafter with clamp and 360-degree protractor head. Used for 1st year Engineering Graphics. Zero slack.',
    item_condition: 'good',
    created_at: '2026-02-14T09:15:00Z',
  },
  {
    item_id: 4,
    owner_id: 3, // Rohan
    category_id: 4,
    item_name: 'Arduino Uno R3 Ultimate Starter Kit with 30+ Sensors',
    description: 'Complete embedded systems lab kit with Uno board, ultrasonic sensor, RFID, LCD 16x2, stepper motor, and jumper wires.',
    item_condition: 'good',
    created_at: '2026-02-15T18:40:00Z',
  },
  {
    item_id: 5,
    owner_id: 1, // Aryan
    category_id: 1,
    item_name: 'Silberschatz & Galvin Operating System Concepts (10th Ed)',
    description: 'Standard dinosaur book for 4th semester OS course. Giving away freely to juniors who need it for mid-sems.',
    item_condition: 'good',
    created_at: '2026-02-18T11:20:00Z',
  },
  {
    item_id: 6,
    owner_id: 2, // Sneha
    category_id: 6,
    item_name: 'Hero Sprint 26T Single Speed Campus Bicycle with Number Lock',
    description: 'Reliable campus cycle for moving between Moksha ground, library, and APJ lecture complex. New tyres and lubricated chain.',
    item_condition: 'good',
    created_at: '2026-02-20T16:00:00Z',
  },
  {
    item_id: 7,
    owner_id: 3, // Rohan
    category_id: 1,
    item_name: 'Database System Concepts by Silberschatz, Korth & Sudarshan (7th Ed)',
    description: 'The definitive DBMS book for CSE/IT students. Clean condition, includes CD and SQL practice guides.',
    item_condition: 'like_new',
    created_at: '2026-02-22T10:00:00Z',
  },
  {
    item_id: 8,
    owner_id: 4, // Priya
    category_id: 3,
    item_name: 'Pure Cotton Chemistry Lab Coat / Apron (Size M)',
    description: 'Preshrunk thick white lab coat with deep pockets. Required for Chemistry and Material Science lab sessions.',
    item_condition: 'good',
    created_at: '2026-02-24T13:45:00Z',
  },
  {
    item_id: 9,
    owner_id: 1, // Aryan
    category_id: 5,
    item_name: 'Prestige 1.5 Litre Stainless Steel Electric Kettle',
    description: 'Fast boiling 1500W electric kettle with auto shut-off. Perfect for late-night hostel study sessions and noodles.',
    item_condition: 'good',
    created_at: '2026-02-25T15:10:00Z',
  },
  {
    item_id: 10,
    owner_id: 3, // Rohan
    category_id: 2,
    item_name: 'Casio fx-991EX ClassWiz Classic Scientific Calculator',
    description: 'Trusted high-speed spreadsheet calculator with QR code graph view. Battery checked last week.',
    item_condition: 'fair',
    created_at: '2026-02-26T17:30:00Z',
  },
];

export const INITIAL_ITEM_IMAGES: ItemImage[] = [
  {
    image_id: 1,
    item_id: 1,
    image_url: '/images/items/clrs-algorithms.jpg',
    uploaded_at: '2026-02-10T12:05:00Z',
  },
  {
    image_id: 2,
    item_id: 2,
    image_url: '/images/items/casio-991cw.jpg',
    uploaded_at: '2026-02-12T14:35:00Z',
  },
  {
    image_id: 3,
    item_id: 3,
    image_url: '/images/items/mini-drafter.jpg',
    uploaded_at: '2026-02-14T09:20:00Z',
  },
  {
    image_id: 4,
    item_id: 4,
    image_url: '/images/items/arduino-kit.jpg',
    uploaded_at: '2026-02-15T18:45:00Z',
  },
  {
    image_id: 5,
    item_id: 5,
    image_url: '/images/items/os-textbook.jpg',
    uploaded_at: '2026-02-18T11:25:00Z',
  },
  {
    image_id: 6,
    item_id: 6,
    image_url: '/images/items/campus-bicycle.jpg',
    uploaded_at: '2026-02-20T16:05:00Z',
  },
  {
    image_id: 7,
    item_id: 7,
    image_url: '/images/items/dbms-textbook.jpg',
    uploaded_at: '2026-02-22T10:05:00Z',
  },
  {
    image_id: 8,
    item_id: 8,
    image_url: '/images/items/chemistry-lab-coat.jpg',
    uploaded_at: '2026-02-24T13:50:00Z',
  },
  {
    image_id: 9,
    item_id: 9,
    image_url: '/images/items/electric-kettle.jpg',
    uploaded_at: '2026-02-25T15:15:00Z',
  },
  {
    image_id: 10,
    item_id: 10,
    image_url: '/images/items/casio-991ex.jpg',
    uploaded_at: '2026-02-26T17:35:00Z',
  },
];

export const INITIAL_LISTINGS: Listing[] = [
  {
    listing_id: 1,
    item_id: 1, // CLRS Algorithm book
    listing_type: 'sale',
    price: 450,
    deposit_amount: 0,
    posted_at: '2026-02-10T12:10:00Z',
    expiry_date: '2026-05-15',
    listing_status: 'active',
  },
  {
    listing_id: 2,
    item_id: 2, // Casio 991CW
    listing_type: 'lend',
    price: 80, // Lending fee for exam period
    deposit_amount: 500, // Refundable security deposit
    posted_at: '2026-02-12T14:40:00Z',
    expiry_date: '2026-04-30',
    listing_status: 'active',
  },
  {
    listing_id: 3,
    item_id: 3, // Mini Drafter
    listing_type: 'lend',
    price: 50,
    deposit_amount: 300,
    posted_at: '2026-02-14T09:25:00Z',
    expiry_date: '2026-05-01',
    listing_status: 'completed',
  },
  {
    listing_id: 4,
    item_id: 4, // Arduino Kit
    listing_type: 'exchange',
    price: 0,
    deposit_amount: 0,
    posted_at: '2026-02-15T18:50:00Z',
    expiry_date: '2026-06-01',
    listing_status: 'active',
  },
  {
    listing_id: 5,
    item_id: 5, // Silberschatz OS book
    listing_type: 'donation',
    price: 0,
    deposit_amount: 0,
    posted_at: '2026-02-18T11:30:00Z',
    expiry_date: '2026-04-20',
    listing_status: 'active',
  },
  {
    listing_id: 6,
    item_id: 6, // Campus cycle
    listing_type: 'lend',
    price: 150,
    deposit_amount: 800,
    posted_at: '2026-02-20T16:10:00Z',
    expiry_date: '2026-05-20',
    listing_status: 'active',
  },
  {
    listing_id: 7,
    item_id: 7, // Korth DBMS book
    listing_type: 'sale',
    price: 320,
    deposit_amount: 0,
    posted_at: '2026-02-22T10:10:00Z',
    expiry_date: '2026-05-10',
    listing_status: 'active',
  },
  {
    listing_id: 8,
    item_id: 8, // Chemistry apron
    listing_type: 'donation',
    price: 0,
    deposit_amount: 0,
    posted_at: '2026-02-24T13:55:00Z',
    expiry_date: '2026-04-30',
    listing_status: 'active',
  },
  {
    listing_id: 9,
    item_id: 9, // Electric kettle
    listing_type: 'sale',
    price: 350,
    deposit_amount: 0,
    posted_at: '2026-02-25T15:20:00Z',
    expiry_date: '2026-05-30',
    listing_status: 'active',
  },
  {
    listing_id: 10,
    item_id: 10, // Casio 991EX
    listing_type: 'lend',
    price: 60,
    deposit_amount: 400,
    posted_at: '2026-02-26T17:40:00Z',
    expiry_date: '2026-04-15',
    listing_status: 'active',
  },
];

export const INITIAL_LISTING_REQUESTS: ListingRequest[] = [
  {
    request_id: 1,
    listing_id: 3, // Priya's Mini Drafter
    requester_id: 1, // Aryan requested it
    offered_item_id: null,
    request_message: 'Hi Priya! Need this mini drafter for my EG mid-sem sheet next week. Can meet at Student Center.',
    requested_at: '2026-02-16T10:00:00Z',
    request_status: 'accepted',
    handover_location: 'Student Center, Ground Floor',
    handover_time: '1:30 PM (Lunch break)',
  },
  {
    request_id: 2,
    listing_id: 1, // Aryan's CLRS book
    requester_id: 3, // Rohan
    offered_item_id: null,
    request_message: 'Hey Aryan, interested in buying the CLRS book. Can we meet near Amul Cafe today?',
    requested_at: '2026-02-23T14:00:00Z',
    request_status: 'pending',
    handover_location: 'Amul Cafe NSUT',
    handover_time: '5:00 PM',
  },
  {
    request_id: 3,
    listing_id: 4, // Rohan's Arduino Kit (Exchange)
    requester_id: 2, // Sneha
    offered_item_id: 2, // Offers Casio Calculator
    request_message: 'Hi Rohan! I have an extra Casio fx-991CW that I can exchange for your Arduino kit for this semester IoT project.',
    requested_at: '2026-02-24T16:00:00Z',
    request_status: 'pending',
    handover_location: 'Central Library Lawn',
    handover_time: '4:15 PM',
  },
  {
    request_id: 4,
    listing_id: 5, // Aryan's free OS book donation
    requester_id: 4, // Priya
    offered_item_id: null,
    request_message: 'Thank you for donating this Aryan! Our junior wing in GH-1 will really benefit from it.',
    requested_at: '2026-02-25T11:00:00Z',
    request_status: 'accepted',
    handover_location: 'Girls Hostel 1 Gate',
    handover_time: '6:00 PM',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    transaction_id: 1,
    request_id: 1, // Drafter loan accepted
    transaction_status: 'completed',
    agreed_amount: 50,
    created_at: '2026-02-16T11:00:00Z',
    completed_at: '2026-02-23T17:00:00Z',
  },
  {
    transaction_id: 2,
    request_id: 4, // OS book donation
    transaction_status: 'in_progress',
    agreed_amount: 0,
    created_at: '2026-02-25T12:00:00Z',
    completed_at: null,
  },
];

export const INITIAL_LOANS: Loan[] = [
  {
    transaction_id: 1, // Aryan borrowed Priya's drafter
    due_date: '2026-02-22',
    returned_at: '2026-02-21T16:30:00Z', // Returned 1 day early!
    loan_status: 'returned',
    condition_on_return: 'Excellent condition, all scales intact and calibrated.',
  },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    payment_id: 1,
    transaction_id: 1,
    payer_id: 1, // Aryan paid fee
    payment_type: 'purchase',
    amount: 50,
    payment_method: 'upi',
    payment_status: 'completed',
    paid_at: '2026-02-16T11:30:00Z',
  },
  {
    payment_id: 2,
    transaction_id: 1,
    payer_id: 1, // Aryan paid security deposit
    payment_type: 'deposit',
    amount: 300,
    payment_method: 'upi',
    payment_status: 'completed',
    paid_at: '2026-02-16T11:30:00Z',
  },
  {
    payment_id: 3,
    transaction_id: 1,
    payer_id: 4, // Priya refunded the deposit back to Aryan on safe return
    payment_type: 'refund',
    amount: 300,
    payment_method: 'upi',
    payment_status: 'refunded',
    paid_at: '2026-02-21T16:35:00Z',
  },
];

export const INITIAL_REVIEWS: Review[] = [
  {
    review_id: 1,
    transaction_id: 1,
    reviewer_id: 4, // Priya reviewed Aryan
    reviewee_id: 1, // Aryan
    rating: 5,
    comment: 'Aryan returned the mini drafter a day early and in pristine shape. Highly recommended borrower!',
    created_at: '2026-02-22T09:00:00Z',
  },
  {
    review_id: 2,
    transaction_id: 1,
    reviewer_id: 1, // Aryan reviewed Priya
    reviewee_id: 4, // Priya
    rating: 5,
    comment: 'Smooth handover at Student Center, prompt deposit refund upon return. Great senior!',
    created_at: '2026-02-22T09:30:00Z',
  },
  {
    review_id: 3,
    transaction_id: 1,
    reviewer_id: 2, // Sneha had a prior verified interaction
    reviewee_id: 3, // Rohan
    rating: 4,
    comment: 'Reliable person, fast communication on campus.',
    created_at: '2026-02-10T15:00:00Z',
  },
];

export const INITIAL_DISPUTES: Dispute[] = [
  {
    dispute_id: 1,
    transaction_id: 1,
    raised_by: 3, // Sample historical dispute for admin resolution demo
    dispute_reason: 'Deposit Refund Delay',
    description: 'Security deposit was not instantly marked refunded on UPI; student resolved it post message confirmation.',
    resolution_status: 'resolved',
    resolution: 'Verified UPI reference number, deposit marked as refunded safely by proctor.',
    assigned_admin: 6, // Dr. Vivek Mehta
    raised_at: '2026-02-15T14:00:00Z',
    resolved_at: '2026-02-16T10:00:00Z',
  },
];

export const INITIAL_SAVED_LISTINGS: SavedListing[] = [
  {
    user_id: 1, // Aryan saved Casio calculator
    listing_id: 2,
    saved_at: '2026-02-13T10:00:00Z',
  },
  {
    user_id: 1, // Aryan saved cycle
    listing_id: 6,
    saved_at: '2026-02-21T08:30:00Z',
  },
  {
    user_id: 3, // Rohan saved CLRS
    listing_id: 1,
    saved_at: '2026-02-11T19:00:00Z',
  },
];

export const INITIAL_REPORTS: Report[] = [
  {
    report_id: 1,
    reporter_id: 2,
    reported_user_id: 5,
    listing_id: null,
    report_reason: 'Unverified email documentation',
    description: 'Account profile needs confirmation of roll number ID card before posting permissions.',
    report_status: 'pending',
    reported_at: '2026-02-27T11:00:00Z',
  },
];

export const INITIAL_REPORT_ACTIONS: ReportAction[] = [];

export const INITIAL_MESSAGES: Message[] = [
  {
    message_id: 1,
    sender_id: 1,
    receiver_id: 4,
    listing_id: 3,
    message_text: 'Hey Priya, is the mini drafter available for next week?',
    sent_at: '2026-02-15T18:00:00Z',
    read_at: '2026-02-15T18:05:00Z',
  },
  {
    message_id: 2,
    sender_id: 4,
    receiver_id: 1,
    listing_id: 3,
    message_text: 'Yes Aryan! We can meet at the Student Center tomorrow at 1:30 PM.',
    sent_at: '2026-02-15T18:10:00Z',
    read_at: '2026-02-15T18:12:00Z',
  },
  {
    message_id: 3,
    sender_id: 3,
    receiver_id: 1,
    listing_id: 1,
    message_text: 'Hi Aryan, can you negotiate ₹400 for CLRS Algorithms book? I am at BH-1 hostel.',
    sent_at: '2026-02-23T14:05:00Z',
    read_at: null,
  },
];
