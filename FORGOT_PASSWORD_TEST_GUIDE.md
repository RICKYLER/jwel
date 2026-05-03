# Forgot Password Cloud Function - Test Guide

## Deployment Status ✅
- **Cloud Function**: `checkEmailExists` deployed successfully to Firebase (us-central1)
- **Frontend**: Build verified (1322 modules transformed)
- **Dev Server**: Running on `http://localhost:5174`

## What Was Implemented

### Backend (Cloud Functions)
**File**: `functions/index.js` (lines ~1586-1660)

New callable function `checkEmailExists` that:
1. Accepts email parameter (no authentication required)
2. Checks Firebase Auth using admin SDK
3. Queries all 4 Firestore collections:
   - `users` (customers)
   - `authorizedAdmin`
   - `authorizedSuperadmin`
   - `authorizedPersonnel`
4. Returns: `{ found: boolean, collection?: string, authMethods?: string[] }`
5. Bypasses Firestore security rules (uses admin privileges)

### Frontend (ForgotPasswordPage.jsx)
**File**: `src/pages/ForgotPasswordPage.jsx`

Updated to use Cloud Function:
- Removed direct Firestore queries (which were blocked by security rules)
- Added `httpsCallable` from Firebase Functions
- Created `checkEmailWithCloudFunction()` wrapper
- Updated `handleSubmit()` to call Cloud Function
- Updated `checkEmailRegistered()` (onBlur email validation) to call Cloud Function

## How to Test

### Test 1: Valid Registered Email (Email/Password Account)
1. Navigate to: `http://localhost:5174/forgot-password`
2. Enter a registered email with password authentication (e.g., `robert.llemit@gmail.com`)
3. **Expected Behavior**:
   - Console shows: `[ForgotPassword] Cloud Function result: {found: true, collection: "...", authMethods: [...]}`
   - "SEND RESET LINK" button becomes **enabled** (not greyed out)
   - Click "SEND RESET LINK"
   - Message appears: "Password reset link sent! Check your inbox and spam folder."
   - Email field clears

### Test 2: Google Sign-In Only Account
1. Navigate to: `http://localhost:5174/forgot-password`
2. Enter an email that only has Google Sign-In (no password auth)
3. After entering email and clicking blur (or submit):
   - **Expected Message**: "This account uses Google Sign-In. Please sign in with Google instead."
   - Reset button should NOT send email
   - Shows inline info message instead

### Test 3: Non-Existent Email
1. Navigate to: `http://localhost:5174/forgot-password`
2. Enter a random email not in the system
3. **Expected Behavior**:
   - Console shows: `[ForgotPassword] Cloud Function result: {found: false, ...}`
   - "SEND RESET LINK" button becomes **disabled** (greyed out)
   - Message appears: "No account found for that email."
   - Button stays disabled until valid email is entered

### Test 4: Email Validation on Blur
1. Navigate to: `http://localhost:5174/forgot-password`
2. Type an email address
3. Click outside the input field (blur event)
4. **Expected Behavior**:
   - Cloud Function is called automatically
   - Button enables/disables based on email existence
   - Message appears immediately (error if not found, or info if Google-only)

## Console Logging
Open browser DevTools (F12) → Console tab to see debug logs:
```
[ForgotPassword] Checking email: test@example.com
[ForgotPassword] Cloud Function result: {found: true, collection: "users", authMethods: ["password"]}
```

## Troubleshooting

### If "Unable to check email" error appears:
1. Check Firebase Functions are deployed: `firebase deploy --only functions`
2. Verify Cloud Function is active in Firebase Console:
   - Go to: https://console.firebase.google.com/project/bykelink-system/functions
   - Look for `checkEmailExists` function
3. Check browser console for full error details

### If button stays disabled:
1. Verify email is in one of the 4 collections: users, authorizedAdmin, authorizedSuperadmin, authorizedPersonnel
2. Confirm email is stored in lowercase in Firestore
3. Check Cloud Function logs: `firebase functions:log`

### If password reset email doesn't arrive:
1. Check that email has "password" in `authMethods` array (not just Google)
2. Verify Firebase Email/Password is enabled in Firebase Auth settings
3. Check Gmail spam folder if using Gmail
4. Verify email address is verified in Firebase Auth

## Files Modified

| File | Changes |
|------|---------|
| `functions/index.js` | Added `checkEmailExists` Cloud Function (~75 lines) |
| `src/pages/ForgotPasswordPage.jsx` | Updated to call Cloud Function instead of direct Firestore queries |
| `src/firebase.js` | No changes (functions already imported) |

## API Reference

### Cloud Function Call
```javascript
const checkEmailExists = httpsCallable(functions, 'checkEmailExists')
const result = await checkEmailExists({ email: 'user@example.com' })
```

### Response Format
```javascript
{
  found: true,                           // boolean
  collection: 'users',                   // 'auth' | 'users' | 'authorizedAdmin' | 'authorizedSuperadmin' | 'authorizedPersonnel'
  authMethods: ['password']              // array of auth methods ('password', 'google.com', etc.)
}
```

## Security Notes

✅ **What's Secure**:
- Cloud Function uses admin SDK (no client auth restrictions)
- No authentication required (appropriate for forgot password)
- Firestore rules still protect data from other unauthenticated access
- Email validation only checks existence, not passwords

⚠️ **Rate Limiting** (Optional Future Enhancement):
- Consider adding Cloud Function rate limiting to prevent abuse
- Firebase allows ~20 invocations/second per user by default

## Next Steps (Optional)
1. Add rate limiting/throttling to Cloud Function
2. Add additional validation (e.g., email format)
3. Set up email notification when password reset is requested
4. Add analytics tracking for forgot password usage
