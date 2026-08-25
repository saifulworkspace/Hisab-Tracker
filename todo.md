# Project TODO

- [x] Create database schema for people, receivables, payables, properties, property payments, and sync configuration
- [x] Generate and apply database migrations
- [x] Seed Ibrahim, Ismail, Shorif, Emon, Ariful Islam, Istanbul Hotel & Resort, and Three Thirteen Uddyog Bangladesh
- [x] Implement typed backend procedures for dashboard summaries, lists, detail views, and mutations
- [x] Implement optional Google Sheets sync for the exact tabs Receivables, Payables, and Properties when a spreadsheet and write credential are configured
- [x] Add optional Google Sheets configuration for API key, spreadsheet ID, and write-capable OAuth or Apps Script credential
- [x] Build Scandinavian minimalist bilingual dashboard shell with sidebar navigation
- [x] Build Summary Dashboard with BDT and SR totals and property progress
- [x] Build Receivables / পাওনা list and add/edit/receive-money flow
- [x] Build Payables / দেনা list and add/edit/give-money flow
- [x] Build Properties / সম্পত্তি list with itemized payment history and add-payment flow
- [x] Add automatic cache refresh and sync status feedback after mutations
- [x] Add responsive mobile layout, accessible interactions, and loading/error/empty states
- [x] Write and run Vitest coverage for calculations and currency/property accounting logic
- [x] Run typecheck, build, and visual verification before delivery
- [x] Make built-in database the primary source of truth; keep Google Sheets sync optional and disabled until configured
- [x] Align pre-seeded receivable names with the requested short names: Ibrahim, Ismail, Shorif, and Emon
- [x] Add dedicated list/detail procedures or document the aggregate dashboard contract
- [x] Implement receive-money and give-money flows with outstanding balances and transaction history
- [x] Add visible optional Google Sheets status feedback showing local-first / not configured state
- [x] Add mobile section navigation for Receivables, Payables, and Properties
- [x] Improve modal keyboard accessibility with Escape handling and focus behavior
- [x] Run and verify the production build command

# Multi-user Upgrade

- [x] Scope all finance records by authenticated user ID so each person's hisab is private
- [x] Add safe ownership migration for existing finance records and assign legacy data to the current owner
- [x] Require authentication for finance queries, mutations, and sheet configuration
- [x] Make seed data initialize separately for each new user without duplicating records
- [x] Scope optional Google Sheets configuration per user
- [x] Update UI with login/private-account messaging and first-login empty/onboarding states
- [x] Verify multi-user isolation with Vitest and production build
- [x] Save a checkpoint and prepare the free-domain publish flow

# GitHub Pages + Firebase Migration

- [x] Convert the frontend deployment target to GitHub Pages-compatible static hosting
- [x] Add Firebase client configuration through VITE_FIREBASE_* environment variables
- [x] Add Firebase Authentication with email/password and Google sign-in options
- [x] Replace Manus-auth finance reads and writes with Firebase Auth + Firestore user-scoped data
- [x] Ensure every new user's receivables, payables, properties, and transaction totals start at 0/null with no seeded records
- [x] Add Firestore security rules guidance enforcing request.auth.uid ownership
- [x] Preserve bilingual Hisab UI, CRUD flows, settlement history, and property payment tracking
- [x] Add GitHub Pages deployment workflow and Firebase setup documentation
- [x] Add tests for zero-state initialization and cross-user Firestore path isolation
- [x] Run typecheck, tests, production build, and package the updated source archive

# Firebase Quality Follow-up

- [x] Implement Firestore-backed immutable settlement history under each user's account
- [x] Display recent received/paid settlement history in the Firebase dashboard
- [x] Add Firebase-focused tests for zero-state defaults and UID-scoped document paths
- [x] Create and verify a new post-migration source ZIP archive
