/* ==========================================================
   OkasyoNest – Demo data (front-end prototype only)
   ----------------------------------------------------------
   Everything here is LOCAL DEMO DATA, kept apart from the UI
   logic. When the backend is ready, replace these objects with
   API responses (see API_BASE_URL and the TODO notes in
   js/reservation.js).
   ========================================================== */

/* Base URL of the future backend API. Leave empty in the prototype. */
const API_BASE_URL = '';

/* Reservation deposit to lock a date (PHP). */
const DEPOSIT_AMOUNT = 5000;

/* Halls – keys are used in URLs: reservation.html?hall=<key> */
const HALLS = {
  'bauan-grand-pavilion': {
    name: 'Bauan Grand Pavilion',
    location: 'Poblacion, Bauan, Batangas',
    capacity: 250,
    rate: 42000
  },
  'san-roque-garden-veranda': {
    name: 'San Roque Garden & Veranda',
    location: 'San Roque, Bauan, Batangas',
    capacity: 150,
    rate: 42000
  },
  'manghinao-executive-hall': {
    name: 'Manghinao Executive Function Hall',
    location: 'Manghinao, Bauan, Batangas',
    capacity: 80,
    rate: 22000
  }
};

/* Catering packages – keys are used in URLs: reservation.html?package=<key> */
const PACKAGES = {
  'executive-milestone': { name: 'Executive & Milestone', pricePerHead: 450 },
  'classic-bauan-feast': { name: 'Classic Bauan Feast', pricePerHead: 550 },
  'grand-celebration': { name: 'Grand Celebration', pricePerHead: 780 }
};

/* Promotions. Only ONE (the highest eligible) is applied.
   NOTE: in the real system, first-time vs. returning client
   detection is done by the backend using reservation history.
   The front end uses the dropdown as a demo input. */
const PROMOS = {
  'first-time': { name: 'First-Time Client Promo', percent: 20 },
  'repeat': { name: 'Repeat Client Discount', percent: 10 }
};

/* Time slots */
const SLOTS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening'
};

/* Online payment accounts – EDITABLE PLACEHOLDERS.
   Replace with the real OkasyoNest payment details once supplied. */
const PAYMENT_ACCOUNTS = {
  gcash: {
    title: 'GCash Express Send',
    accountName: '[OkasyoNest GCash account name]',
    accountNumber: '[GCash number – to be supplied]',
    bankName: '',
    refPlaceholder: 'e.g., GCash Reference Number'
  },
  maya: {
    title: 'Maya Transfer',
    accountName: '[OkasyoNest Maya account name]',
    accountNumber: '[Maya number – to be supplied]',
    bankName: '',
    refPlaceholder: 'e.g., Maya Reference Number'
  },
  bank: {
    title: 'Bank Transfer (BDO / BPI)',
    accountName: '[OkasyoNest bank account name]',
    accountNumber: '[Bank account number – to be supplied]',
    bankName: '[Bank name – BDO or BPI]',
    refPlaceholder: 'e.g., Bank Transfer Reference Number'
  }
};
