# AccessibleSections Implementation - Testing Guide

## Overview
This guide verifies that the role-based sidebar menu filtering works correctly for staff personnel and mechanics personnel roles.

## Implementation Summary

### Backend Changes (functions/index.js)
- ✅ `createOperatorAccount`: Now sets `accessibleSections` field in user documents with role-based defaults
- ✅ `completeFirstLoginSetup`: Now syncs `accessibleSections` from authorized collections to users collection

### Frontend Changes
- ✅ SuperAdminPage: Passes `userProfile?.accessibleSections` as `userMenuAccess` prop to sidebar
- ✅ SuperAdminSidebar: Filters visible items based on `userMenuAccess` array using `menuAccessMap`
- ✅ NewUserModal: Shows only Staff Personnel, Mechanics Personnel, and Customer roles for admin users

### Role-Based Default AccessibleSections
```
Admin/Superadmin: ['dashboard', 'user-management', 'inventory', 'services', 'bookings', 'messages', 'reports', 'settings']
Staff Personnel: ['dashboard', 'inventory', 'services', 'settings']
Mechanics Personnel: ['dashboard', 'services', 'messages', 'settings']
Customer: ['dashboard', 'bookings', 'messages', 'settings']
```

## Test Scenarios

### Test 1: Create Staff Personnel User
1. Log in as superadmin/admin
2. Click "New Operator" button
3. Fill in form:
   - Full Name: "Test Staff Member"
   - Email: "staff.test@bykelink.com"
   - Role: "Staff Personnel"
   - Status: "Active"
4. Click "Register New Operator"
5. **Expected Result**: User created successfully with email verification sent

### Test 2: Staff Personnel Login & Sidebar Verification
1. Staff user receives verification email
2. Click email verification link
3. Set new password
4. Sign in with new credentials
5. **Expected Result**: 
   - Redirected to `/admin` dashboard
   - Sidebar shows ONLY items: Dashboard, Inventory, Services, Settings
   - Following items should be HIDDEN: User Management, Bookings (Financing), Messages (Chats), Reports

### Test 3: Verify Firestore Data
1. In Firebase Console, go to Firestore > "users" collection
2. Look for document with Staff user's UID
3. **Expected Result**: Document contains:
   - `accessibleSections`: `['dashboard', 'inventory', 'services', 'settings']`
   - `role`: `'staff personnel'`
   - `email`: `'staff.test@bykelink.com'`

### Test 4: Create Mechanics Personnel User  
1. Log in as superadmin/admin
2. Click "New Operator" button
3. Fill in form:
   - Full Name: "Test Mechanic"
   - Email: "mechanic.test@bykelink.com"
   - Role: "Mechanics Personnel"
   - Status: "Active"
4. Click "Register New Operator"
5. **Expected Result**: User created successfully

### Test 5: Mechanics Personnel Login & Sidebar Verification
1. Mechanic user receives verification email
2. Click email verification link
3. Set new password
4. Sign in with new credentials
5. **Expected Result**:
   - Redirected to `/admin` dashboard
   - Sidebar shows ONLY items: Dashboard, Services, Messages, Settings
   - Following items should be HIDDEN: User Management, Inventory, Bookings, Reports

### Test 6: Admin User Verification (Control Test)
1. Log in as admin user
2. **Expected Result**: Sidebar shows ALL 8 items:
   - Dashboard ✓
   - User Management ✓
   - Inventory ✓
   - Services ✓
   - Bookings ✓
   - Messages ✓
   - Reports ✓
   - Settings ✓

### Test 7: Menu Access Checkbox Functionality (Optional)
1. Create a new staff user
2. In NewUserModal, after selecting "Staff Personnel" role, check if menuAccess is set
3. **Expected Result**: Default Staff Personnel menu access is assigned

## Troubleshooting

### Issue: Sidebar Still Shows All Items for Staff User
**Possible Causes:**
1. `accessibleSections` not populated in Firestore
   - Check: user document in "users" collection has accessibleSections field
2. `userProfile` not loading properly
   - Check: Browser DevTools console for errors loading userProfile
3. `menuAccessMap` keys don't match accessibleSections values
   - Verify: Keys in menuAccessMap match values sent from backend

**Debug Steps:**
1. Open Browser DevTools → Console
2. Check for errors related to Firestore or userProfile loading
3. Add console.log in SuperAdminSidebar to log userMenuAccess value
4. Verify Firestore document has accessibleSections field

### Issue: Staff User Not Redirected to `/admin`
**Check:**
1. Backend function `getDashboardPath` has correct mapping for staff personnel role
2. Verify: `functions/index.js` line ~370 routes staff to '/admin'
3. Function deployment successful: firebase deploy --only functions completed without errors

### Issue: New Operator Modal Shows Unwanted Roles
**Check:**
1. NewUserModal role dropdown options (lines 176-185)
2. Only Staff Personnel, Mechanics Personnel, Customer should show for admin
3. Admin and Superadmin options should only appear for superadmin users

## Verification Checklist

- [ ] Staff user created successfully
- [ ] Staff user receives verification email
- [ ] Staff user can log in with new password
- [ ] Staff user redirected to `/admin`
- [ ] Staff sidebar shows only 4 items: Dashboard, Inventory, Services, Settings
- [ ] Mechanics user created successfully
- [ ] Mechanics user can log in
- [ ] Mechanics sidebar shows only 4 items: Dashboard, Services, Messages, Settings
- [ ] Admin user sees all 8 sidebar items
- [ ] Firestore "users" collection contains accessibleSections field
- [ ] No console errors during login/sidebar rendering
- [ ] NewUserModal shows correct role options

## Notes

- Cloud Functions deployed: ✅ (createOperatorAccount, completeFirstLoginSetup)
- Frontend updated: ✅ (SuperAdminPage, SuperAdminSidebar, NewUserModal)
- Default values set: ✅ (backend and frontend aligned)

---

**Date Tested:** [Add date]
**Tested By:** [Add name]
**Status:** [Pending/In Progress/Passed/Failed]
