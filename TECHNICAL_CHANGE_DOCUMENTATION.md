BYKELINK MOTOR INC. MANAGEMENT SYSTEM
TECHNICAL CHANGE AND ARCHITECTURE DOCUMENTATION

System Name      : Bykelink Motor Inc. Management System (bykelinkmotorinc-system)
Repository       : RICKYLER/jwel (Branch: main)
Covered Commits  : 2501951, 0f38403, afb2a59
Date             : November 21, 2026


================================================================================
EXECUTIVE SUMMARY
================================================================================

This document outlines the recent architectural updates, security enhancements,
feature additions, module removals, and deployment fixes applied to the Bykelink
Motor Inc. Management System. The primary objective of this release is to focus
the platform on core dealership, inventory, point-of-sale (POS), and service
operations while strengthening administrative oversight, auditability, and
production deployment stability.

Summary of Key Changes:

  1. Complete decommissioning of the Financing module across the customer
     portal, admin console, backend Cloud Functions, and Firestore rules.
  2. Two-tier Admin Verification workflow for sensitive inventory actions such
     as product renaming, archiving/deletion, and permanent deletion.
  3. Immutable, admin-only System Transaction History (Audit Trail) covering
     POS, Inventory, Service Bookings, User Management, and Master Data, while
     isolating raw transaction logs from cashier access.
  4. Itemized walk-in purchase visibility and bulk-order detection inside
     Sales Analytics and Transaction History, keeping one clean row per
     transaction with an on-click purchase breakdown modal.
  5. Vercel production hosting configuration and resolution of a Vite 8 peer
     dependency conflict caused by an unused PWA package.


================================================================================
TABLE OF CONTENTS
================================================================================

  1. Decommissioning of the Financing Subsystem
  2. Inventory Governance and Admin Verification
  3. Admin-Only System Audit Trail and Access Isolation
  4. Point-of-Sale Itemized Walk-In Breakdown and Bulk Order Detection
  5. Vercel Deployment Configuration and Build Pipeline Fix
  6. Firestore Security Rules and Collection Access Summary
  7. Summary of Added, Modified, and Removed Files
  8. Verification Results and Deployment Checklist


================================================================================
1. DECOMMISSIONING OF THE FINANCING SUBSYSTEM
================================================================================

The financing application and approval workflow was retired across the entire
stack to remove unused code paths, simplify navigation, reduce production bundle
size, and block legacy client writes to financing collections.

1.1 Removed Modules

  Customer Portal (src/pages/customer/):
    - FinancingPage.jsx
    - ConfirmApplicationPage.jsx
    - FinancingSubmittedPage.jsx
    - ApprovedApplicationPage.jsx
    - FinancingStatusPage.jsx and FinancingStatusPage.css

  Admin and Superadmin Console (src/pages/superadmin/sections/):
    - FinancingApplicationsSection.jsx and FinancingApplicationsSection.css
    - ApprovedApplicationsSection.jsx and ApprovedApplicationsSection.css
    - FinancingApplicationDetailSection.jsx

1.2 Routing, Navigation, and Interface Updates

  - src/App.jsx
    Removed all customer financing routes (/financing, /financing/:productId,
    /financing/confirm, /financing/submitted/:id, /financing/approved/:id,
    /financing/status, /financing/status/:id), admin financing routes
    (/(superadmin|admin|staff)/financing-applications*), and financing props.

  - Customer Navigation and Showroom Pages
    Removed Financing and Track My Status links and the financingApplications
    listener from NavHeaderCustomer.jsx. Removed financing buttons and labels
    from HeroSection.jsx, ShowroomPage.jsx, ProductDetailsPage.jsx, and
    CustomerShowroomPage.jsx. In HeroSection.jsx, the financing counter was
    replaced with Showroom Units.

  - Shared Page Prop Cleanup
    Removed unused financing navigation callbacks from CashierPage.jsx,
    CustomerProfilePage.jsx, CustomerServicePage.jsx, CustomerMessagesPage.jsx,
    and CustomerServiceBookingsPage.jsx.

  - Admin Console Navigation
    Removed financing-applications and approved-applications menu items,
    state listeners, and financingStatusOptions from SuperAdminPage.jsx,
    SuperAdminSidebar.jsx, and superadminUtils.js.

1.3 Backend and Security Lockdown

  - functions/index.js
    Removed the Cloud Functions submitFinancingApplication,
    getFinancingApplicationStatus, approveFinancingApplication, and
    updateFinancingApplicationStatus.

  - firestore.rules
    Locked down financingApplications and its nested messages subcollection by
    setting both read and write permissions to false. Historical records remain
    preserved in the database while preventing client-side access.


================================================================================
2. INVENTORY GOVERNANCE AND ADMIN VERIFICATION
================================================================================

To protect inventory integrity, product name changes, product deletions, and
permanent archive deletions now enforce role-based approval and administrator
identity verification.

2.1 Role-Based Change Workflow

  - Accurate Role Resolution (InventorySection.jsx)
    Updated inventory permission checks to read from currentAccessRole instead
    of currentUser?.role so access rights accurately reflect assigned roles.

  - Staff Personnel Flow
    Staff personnel can no longer rename or delete live inventory products
    directly. Instead, their edits or deletions submit a pending verification
    request through the submitInventoryChangeRequest Cloud Function.

  - Admin and Superadmin Flow
    Direct product renames, product deletions, and approvals or rejections under
    the Pending Verifications tab require confirmation via the Admin
    Verification Modal.

  - Archive Domain Protection (InventoryDeleteArchivedSection.jsx)
    Filtered out archived user records from the inventory archive view, gated
    permanent deletion behind AdminVerificationModal (permanent-delete mode),
    and recorded restore and permanent-delete events in the audit trail.

2.2 Admin Verification Modal (AdminVerificationModal.jsx)

  Located at src/pages/superadmin/components/AdminVerificationModal.jsx, this
  component handles five verification modes: rename, delete, approve-rename,
  approve-delete, and permanent-delete.

  - Email/Password Admins
    Requires password re-authentication via Firebase Auth
    (reauthenticateWithCredential with EmailAuthProvider.credential) and tags
    the verification record as admin-password.

  - Google-Authenticated Admins
    Requires exact manual entry of the target product name as a confirmation
    phrase and tags the verification record as admin-phrase-confirmation.

2.3 Server-Side Request and Approval Callables (functions/index.js)

  - submitInventoryChangeRequest
    Permitted for staff personnel, admin, and superadmin. Validates the itemId
    and requestType (rename or delete), saves a snapshot of the product into
    the inventoryChangeRequests collection with status pending, and logs a
    PRODUCT_RENAME_REQUESTED or PRODUCT_DELETE_REQUESTED audit entry.

  - verifyInventoryChangeRequest
    Restricted strictly to admin and superadmin. Supports approve or reject
    decisions on pending requests:
      * Reject: Updates request status to rejected, stores verifier details
        and note, and logs PRODUCT_CHANGE_REJECTED.
      * Approve (Rename): Atomically updates the product name and pendingUpdates
        in inventory via a Firestore batch write, records lastVerifiedBy and
        lastVerifiedAt, and logs PRODUCT_RENAMED.
      * Approve (Delete): Atomically moves the product snapshot into
        deleteArchived (marked as recordType inventory), removes the active
        document from inventory, and logs PRODUCT_DELETED.


================================================================================
3. ADMIN-ONLY SYSTEM AUDIT TRAIL AND ACCESS ISOLATION
================================================================================

An append-only audit trail was implemented across client services and backend
Cloud Functions so administrators have full visibility into system activity
while sensitive logs remain hidden from non-admin staff.

3.1 Audit Logging Architecture

  - Client Audit Service (src/services/auditLogService.js)
    Provides logSystemAuditEvent, which writes structured event documents
    (prefixed AUD-) to the auditLogs collection. Each record captures module,
    action, summary, targetType, targetId, targetName, previousData, newData,
    amount, performedBy (uid, email, name, role), verifiedBy, metadata, and
    serverTimestamp. Errors are logged as warnings so primary business actions
    are never blocked.

  - Server Audit Helper (functions/index.js)
    Provides recordAuditLog, called across completeSaleTransaction
    (SALE_COMPLETED), submitInventoryChangeRequest, verifyInventoryChangeRequest,
    and user management callables (createOperatorAccount,
    archiveOperatorAccount, deleteArchivedUserPermanently, updateUserAccess,
    and resetUserPassword).

  - Instrumented System Modules
    POS, Inventory, Inventory Archive, Service Bookings and Service Types
    (CustomerServicePage.jsx, ServiceRequestsSection.jsx, ServiceTypeSection.jsx),
    User Management, and Master Data (MasterDataManagementSection.jsx).

3.2 Transaction History Console (TransactionHistorySection.jsx)

  - Restricted to admin and superadmin roles inside SuperAdminPage.jsx and
    EditUserModal.jsx under the Transaction History section.
  - Combines auditLogs with legacy transactionLogs while deduplicating POS
    sales already captured as SALE_COMPLETED events.
  - Supports filtering by module (POS, Inventory, Service, User Management,
    Master Data), action type, date range, and text search.
  - Includes a detail inspection modal displaying before-and-after change
    values as well as Excel (.xlsx) and PDF report export via xlsx and jspdf.

3.3 Cashier Log Removal and Immutability Rules

  - Removed transactionLogs Firestore queries and the F3 Transaction Logs modal
    from src/pages/cashier/CashierPage.jsx.
  - Hardened firestore.rules so auditLogs and transactionLogs allow read access
    only to admin and superadmin, while update and delete operations are
    blocked entirely (false) to preserve audit immutability.


================================================================================
4. POS ITEMIZED WALK-IN BREAKDOWN AND BULK ORDER DETECTION
================================================================================

POS sales records were enhanced so administrators can see exact purchased
products, quantities, and bulk orders without cluttering the transaction table.

4.1 Server-Side Transaction Payload (completeSaleTransaction)

  - Normalizes all cartItems in functions/index.js with id, name, sku, type
    (service or product), qty, unitPrice, and subtotal.
  - Computes itemCount, totalQuantity, and isBulkOrder (true when totalQuantity
    is 5 or more) and stores them on both transactionLogs and the corresponding
    SALE- audit record.
  - Deducts inventory stock (stock, quantity, onHand) only for physical product
    items, automatically skipping service entries (IDs starting with service-).

4.2 Shared Sale Summarization Utility (superadminUtils.js)

  - Defines BULK_PURCHASE_THRESHOLD = 5.
  - Exports summarizeSaleItems, which computes normalized items, totalQuantity,
    itemCount, isBulk (true when totalQuantity >= 5 or any single item qty >= 5),
    a compact summaryLabel (primary item name, quantity, and extra item count),
    and searchableText containing product names and SKUs.

4.3 Sales Analytics and Audit UI Updates

  - AnalyticsSection.jsx and AnalyticsSection.css
    Keeps one row per transaction while adding a Products / Qty column showing
    the primary product name, piece count badge, and a Bulk badge when
    applicable. Search matching now includes product names and SKUs. Clicking
    any row opens the Walk-in Purchase Breakdown Modal with an itemized table
    (Product / Item, SKU, Qty, Unit Price, Subtotal) and full receipt totals.

  - TransactionHistorySection.jsx and TransactionHistorySection.css
    Displays the item summary, piece count, and Bulk badge on POS audit rows
    and renders the itemized purchase table inside the audit detail modal.


================================================================================
5. VERCEL DEPLOYMENT CONFIGURATION AND BUILD PIPELINE FIX
================================================================================

5.1 Vercel Configuration (vercel.json - Commit 0f38403)

  Added vercel.json at the project root to match Firebase Hosting behavior:
    - Applies Cross-Origin-Opener-Policy: same-origin-allow-popups and
      Cross-Origin-Embedder-Policy: unsafe-none across all routes so popup-based
      authentication flows operate reliably.
    - Configures an SPA rewrite from /(.*) to /index.html so direct page loads
      and browser refreshes on client-side routes do not return 404 errors.

5.2 Vite 8 Peer Dependency Resolution (Commit afb2a59)

  - Root Cause
    Vercel deployments failed during npm install because package.json included
    vite-plugin-pwa (^1.2.0), whose peer dependency range only supports Vite
    versions 3 through 7, conflicting with the project's Vite 8 (^8.0.4).

  - Resolution
    Verified that VitePWA was imported in vite.config.js but never registered
    in the active plugins array (which only uses react() and tailwindcss()).
    Removed vite-plugin-pwa from package.json, removed the unused import from
    vite.config.js, and regenerated package-lock.json cleanly.


================================================================================
6. FIRESTORE SECURITY RULES AND COLLECTION ACCESS SUMMARY
================================================================================

Verified directly against firestore.rules:

  Collection: /financingApplications/{docId} (and /messages/{messageId})
    Read: Disabled (false)
    Create/Update/Delete: Disabled (false)

  Collection: /inventory/{docId}
    Read: Public
    Create/Update/Delete: Admin or Superadmin
    Note: Staff renames and deletions are submitted via Cloud Functions.

  Collection: /inventoryChangeRequests/{docId}
    Read/Create: Admin, Superadmin, or Staff Personnel
    Update/Delete: Admin or Superadmin

  Collection: /inventoryLogs/{docId}
    Read/Update/Delete: Admin or Superadmin
    Create: Admin, Superadmin, or Staff Personnel

  Collection: /auditLogs/{docId}
    Read: Admin or Superadmin
    Create: Signed-in users
    Update/Delete: Disabled (false) - immutable append-only log

  Collection: /transactionLogs/{docId}
    Read/Create: Admin or Superadmin
    Update/Delete: Disabled (false) - hidden from cashier, append-only

  Collection: /deleteArchived/{docId}
    Read/Create/Update: Admin or Superadmin
    Delete: Superadmin only

  Collection: /masterData/inventory/{categories,models,variants,series}/{docId}
    Read: Public
    Create/Update/Delete: Admin or Superadmin

  Collection: /technicians/{docId}
    Read/Create/Update/Delete: Admin or Superadmin

  Collection: /services/{docId} and /settings/{docId}
    Read: Public
    Create/Update/Delete: Admin or Superadmin

  Collection: /adminPasswordResetRequests/{docId}
    Read: Admin, Superadmin, or matching user email
    Create: Signed-in users
    Update/Delete: Admin or Superadmin


================================================================================
7. SUMMARY OF ADDED, MODIFIED, AND REMOVED FILES
================================================================================

7.1 Added Files

  - src/pages/superadmin/components/AdminVerificationModal.jsx
  - src/services/auditLogService.js
  - src/pages/superadmin/sections/TransactionHistorySection.jsx
  - src/pages/superadmin/sections/TransactionHistorySection.css
  - src/pages/superadmin/sections/AnalyticsSection.css
  - vercel.json

7.2 Modified Core Files

  Backend and Rules:
    - firestore.rules
    - functions/index.js

  Routing, Build, and Deployment Configuration:
    - src/App.jsx
    - package.json
    - package-lock.json
    - vite.config.js

  POS and Customer Modules:
    - src/pages/cashier/CashierPage.jsx
    - src/pages/customer/components/NavHeaderCustomer.jsx
    - src/pages/customer/CustomerServicePage.jsx
    - src/pages/customer/CustomerShowroomPage.jsx
    - src/pages/customer/CustomerProfilePage.jsx
    - src/pages/customer/CustomerMessagesPage.jsx
    - src/pages/customer/CustomerServiceBookingsPage.jsx
    - src/pages/customer/ProductDetailsPage.jsx
    - src/pages/herosection/HeroSection.jsx
    - src/pages/herosection/ShowroomPage.jsx

  Admin Console Modules:
    - src/pages/superadmin/SuperAdminPage.jsx
    - src/pages/superadmin/components/SuperAdminSidebar/SuperAdminSidebar.jsx
    - src/pages/superadmin/components/EditUserModal.jsx
    - src/pages/superadmin/sections/InventorySection.jsx
    - src/pages/superadmin/sections/InventoryDeleteArchivedSection.jsx
    - src/pages/superadmin/sections/AnalyticsSection.jsx
    - src/pages/superadmin/sections/MasterDataManagementSection.jsx
    - src/pages/superadmin/sections/ServiceRequestsSection.jsx
    - src/pages/superadmin/sections/ServiceTypeSection.jsx
    - src/pages/superadmin/sections/ChatsManagementSection.jsx
    - src/pages/superadmin/sections/superadminUtils.js

7.3 Removed Files

  - src/pages/customer/FinancingPage.jsx
  - src/pages/customer/ConfirmApplicationPage.jsx
  - src/pages/customer/FinancingSubmittedPage.jsx
  - src/pages/customer/ApprovedApplicationPage.jsx
  - src/pages/customer/FinancingStatusPage.jsx
  - src/pages/customer/FinancingStatusPage.css
  - src/pages/superadmin/sections/FinancingApplicationsSection.jsx
  - src/pages/superadmin/sections/FinancingApplicationsSection.css
  - src/pages/superadmin/sections/ApprovedApplicationsSection.jsx
  - src/pages/superadmin/sections/ApprovedApplicationsSection.css
  - src/pages/superadmin/sections/FinancingApplicationDetailSection.jsx


================================================================================
8. VERIFICATION RESULTS AND DEPLOYMENT CHECKLIST
================================================================================

8.1 Checks Verified

  - Dependency Install (npm install): Passed with exit code 0 and zero peer
    dependency errors after removing vite-plugin-pwa.
  - Vite Production Build (npm run build using Vite 8.0.5): Passed cleanly,
    transforming 1,578 modules and emitting dist/ in 2.52 seconds.
  - Cloud Functions Syntax Check (node --check functions/index.js): Passed
    with exit code 0.
  - Vercel Config Validation (python3 -m json.tool vercel.json): Passed.
  - ESLint Checks: Targeted ESLint checks on modified and newly added files
    passed (vite.config.js after the latest edit; core commit 2501951 modules
    prior to push). Full-repository npm run lint still surfaces pre-existing
    errors in untouched legacy files such as ChatBox.jsx and
    GlobalLoadingScreen.jsx.

8.2 Production Deployment Steps

  1. Deploy updated Firestore security rules and Cloud Functions to Firebase:
       firebase deploy --only firestore:rules,functions

  2. Redeploy or confirm automatic deployment on Vercel from branch main of
     RICKYLER/jwel (commit afb2a59 or newer) using the Vite preset (vite build,
     output directory dist).
