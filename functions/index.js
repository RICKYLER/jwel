const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')
const admin = require('firebase-admin')

admin.initializeApp()

const personnelRoles = [
  'mechanics personnel',
  'inventory personnel',
  'cashier personnel',
  'front desk personnel',
]

const rolePriority = {
  customer: 0,
  staff: 1,
  'mechanics personnel': 1,
  'inventory personnel': 1,
  'cashier personnel': 1,
  'front desk personnel': 1,
  admin: 2,
  superadmin: 3,
}

const parseEmailList = (value, fallback = []) => {
  const source = value ? value.split(',') : fallback

  return [...new Set(source.map((email) => email.trim().toLowerCase()).filter(Boolean))]
}

const normalizeRole = (value = 'customer') => {
  const normalizedValue = String(value).trim().toLowerCase().replace(/[\s_-]+/g, '')

  if (normalizedValue === 'superadmin') return 'superadmin'
  if (normalizedValue === 'admin') return 'admin'
  if (normalizedValue === 'staff') return 'staff'
  if (normalizedValue === 'mechanicspersonnel' || normalizedValue === 'mechanicpersonnel') return 'mechanics personnel'
  if (normalizedValue === 'inventorypersonnel') return 'inventory personnel'
  if (normalizedValue === 'cashierpersonnel') return 'cashier personnel'
  if (normalizedValue === 'frontdeskpersonnel') return 'front desk personnel'

  return 'customer'
}

const normalizeDashboardPath = (value = '') => {
  const normalizedValue = String(value).trim()

  if (!normalizedValue) return null

  return normalizedValue.startsWith('/') ? normalizedValue : `/${normalizedValue}`
}

const isAuthorizedEntryActive = (entry = {}) => {
  const rawStatus =
    entry.active ?? entry.isActive ?? entry.enabled ?? entry.authorized ?? entry.status ?? true

  if (typeof rawStatus === 'string') {
    return !['inactive', 'disabled', 'revoked', 'false', 'no'].includes(
      rawStatus.trim().toLowerCase(),
    )
  }

  return Boolean(rawStatus)
}

const getAllowedEmails = () => ({
  superadmin: parseEmailList(process.env.SUPERADMIN_EMAILS, ['superadmin@bykelink.com']),
  admin: parseEmailList(process.env.ADMIN_EMAILS, ['admin@bykelink.com']),
  staff: parseEmailList(process.env.STAFF_EMAILS, ['staff@bykelink.com']),
})

const getDashboardPath = (role, explicitPath = '') => {
  const normalizedPath = normalizeDashboardPath(explicitPath)

  if (normalizedPath) {
    return normalizedPath
  }

  switch (role) {
    case 'superadmin':
      return '/superadmin'
    case 'admin':
      return '/admin'
    case 'staff':
    case 'mechanics personnel':
    case 'inventory personnel':
    case 'cashier personnel':
    case 'front desk personnel':
      return '/staff'
    default:
      return null
  }
}

const isStrongPassword = (value = '') => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(value))

const getWebApiKey = () =>
  String(
    process.env.FIREBASE_WEB_API_KEY ||
      process.env.WEB_API_KEY ||
      'AIzaSyACbx4Fg8mqeGHVfJZNqUcdA3q4PLUrlPQ',
  ).trim()

const sendFirebaseVerificationEmail = async ({ email, temporaryPassword }) => {
  const apiKey = getWebApiKey()

  if (!apiKey) {
    logger.warn('FIREBASE_WEB_API_KEY is missing. Firebase verification email could not be sent.', {
      email,
      structuredData: true,
    })

    return { sent: false }
  }

  const signInResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: temporaryPassword,
        returnSecureToken: true,
      }),
    },
  )

  const signInData = await signInResponse.json().catch(() => ({}))

  if (!signInResponse.ok || !signInData.idToken) {
    logger.warn('Unable to sign in the invited operator for Firebase verification dispatch.', {
      email,
      details: signInData?.error?.message || 'sign-in failed',
      structuredData: true,
    })

    return { sent: false }
  }

  const verifyResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'VERIFY_EMAIL',
        idToken: signInData.idToken,
      }),
    },
  )

  const verifyData = await verifyResponse.json().catch(() => ({}))

  if (!verifyResponse.ok) {
    logger.warn('Firebase verification email dispatch failed.', {
      email,
      details: verifyData?.error?.message || 'verify-email failed',
      structuredData: true,
    })

    return { sent: false }
  }

  return { sent: true }
}

const buildResolvedAccessProfile = (profiles = [], fallbackRole = 'customer') => {
  const normalizedFallbackRole = normalizeRole(fallbackRole)

  return profiles.filter(Boolean).reduce(
    (highestProfile, profile) => {
      const normalizedRole = normalizeRole(profile.role || normalizedFallbackRole)
      const normalizedDashboardPath = getDashboardPath(
        normalizedRole,
        profile.dashboardPath || profile.assignedPage || profile.redirectTo || profile.page,
      )
      const candidateProfile = {
        ...profile,
        role: normalizedRole,
        dashboardPath: normalizedDashboardPath,
      }

      const currentPriority = rolePriority[candidateProfile.role] ?? 0
      const highestPriority = rolePriority[highestProfile.role] ?? 0

      if (currentPriority > highestPriority) {
        return candidateProfile
      }

      if (
        currentPriority === highestPriority &&
        !highestProfile.dashboardPath &&
        candidateProfile.dashboardPath
      ) {
        return candidateProfile
      }

      return highestProfile
    },
    {
      role: normalizedFallbackRole,
      dashboardPath: getDashboardPath(normalizedFallbackRole),
      source: 'default',
    },
  )
}

const getRoleFromUsersCollection = async ({ uid = '', email = '' } = {}) => {
  const normalizedUid = String(uid || '').trim()
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (!normalizedUid && !normalizedEmail) {
    return null
  }

  const usersCollection = admin.firestore().collection('users')

  const toUserProfile = (data = {}) => {
    const role = normalizeRole(
      data.role || data.personnelRole || data.assignedRole || data.accessRole || data.accountRole,
    )

    if (role === 'customer') {
      return null
    }

    return {
      role,
      dashboardPath: getDashboardPath(
        role,
        data.dashboardPath || data.assignedPage || data.redirectTo || data.page,
      ),
      source: 'users-collection',
    }
  }

  try {
    if (normalizedUid) {
      const userDoc = await usersCollection.doc(normalizedUid).get()

      if (userDoc.exists) {
        const userProfile = toUserProfile(userDoc.data() || {})

        if (userProfile) {
          return userProfile
        }
      }
    }

    if (normalizedEmail) {
      const userSnapshot = await usersCollection.where('email', '==', normalizedEmail).limit(1).get()
      const matchedUser = userSnapshot.docs[0]

      if (matchedUser) {
        return toUserProfile(matchedUser.data() || {})
      }
    }
  } catch (error) {
    logger.warn('Unable to read the users collection while resolving access.', {
      uid: normalizedUid,
      email: normalizedEmail,
      details: error.message,
      structuredData: true,
    })
  }

  return null
}

const getRoleFromEmail = async (email = '', options = {}) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedUid = String(options.uid || '').trim()
  const claimsRole = normalizeRole(options.claimsRole || 'customer')
  const allowlist = getAllowedEmails()

  const resolvedProfiles = []

  if (claimsRole !== 'customer') {
    resolvedProfiles.push({
      role: claimsRole,
      dashboardPath: getDashboardPath(claimsRole),
      source: 'auth-claim',
    })
  }

  if (!normalizedEmail && !normalizedUid) {
    return buildResolvedAccessProfile(resolvedProfiles, 'customer')
  }

  const findCollectionRole = async (collectionName, fallbackRole) => {
    const accessCollection = admin.firestore().collection(collectionName)
    const emailFields = ['email', 'emailAddress', 'authorizedEmail', 'userEmail']

    const toAccessProfile = (data = {}) => {
      if (!isAuthorizedEntryActive(data)) {
        return null
      }

      const role = normalizeRole(
        data.role ||
          data.personnelRole ||
          data.assignedRole ||
          data.accessRole ||
          data.accountRole ||
          fallbackRole,
      )

      if (role === 'customer') {
        return null
      }

      return {
        role,
        dashboardPath: getDashboardPath(
          role,
          data.dashboardPath || data.assignedPage || data.redirectTo || data.page,
        ),
        source: collectionName,
      }
    }

    try {
      if (normalizedUid) {
        const uidDoc = await accessCollection.doc(normalizedUid).get()

        if (uidDoc.exists) {
          const uidProfile = toAccessProfile(uidDoc.data() || {})

          if (uidProfile) {
            return uidProfile
          }
        }
      }

      if (normalizedEmail) {
        const emailDoc = await accessCollection.doc(normalizedEmail).get()

        if (emailDoc.exists) {
          const emailProfile = toAccessProfile(emailDoc.data() || {})

          if (emailProfile) {
            return emailProfile
          }
        }

        for (const fieldName of emailFields) {
          const emailSnapshot = await accessCollection.where(fieldName, '==', normalizedEmail).limit(1).get()
          const matchedDoc = emailSnapshot.docs[0]

          if (matchedDoc) {
            const matchedProfile = toAccessProfile(matchedDoc.data() || {})

            if (matchedProfile) {
              return matchedProfile
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Unable to read an access collection while resolving role.', {
        collectionName,
        email: normalizedEmail,
        uid: normalizedUid,
        details: error.message,
        structuredData: true,
      })
    }

    return null
  }

  const [adminProfileResult, personnelProfileResult, userProfileResult] = await Promise.allSettled([
    findCollectionRole('authorizedAdmin', 'admin'),
    findCollectionRole('authorizedPersonnel', 'staff'),
    getRoleFromUsersCollection({ uid: normalizedUid, email: normalizedEmail }),
  ])

  resolvedProfiles.push(
    adminProfileResult.status === 'fulfilled' ? adminProfileResult.value : null,
    personnelProfileResult.status === 'fulfilled' ? personnelProfileResult.value : null,
    userProfileResult.status === 'fulfilled' ? userProfileResult.value : null,
  )

  const accessLookupErrors = [adminProfileResult, personnelProfileResult, userProfileResult]
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason?.message)
    .filter(Boolean)

  if (accessLookupErrors.length) {
    logger.warn('Some access lookups failed while resolving role; continuing with successful sources.', {
      email: normalizedEmail,
      uid: normalizedUid,
      details: accessLookupErrors.join(' | '),
      structuredData: true,
    })
  }

  if (allowlist.superadmin.includes(normalizedEmail)) {
    resolvedProfiles.push({ role: 'superadmin', dashboardPath: '/superadmin', source: 'env-allowlist' })
  }

  if (allowlist.admin.includes(normalizedEmail)) {
    resolvedProfiles.push({ role: 'admin', dashboardPath: '/admin', source: 'env-allowlist' })
  }

  if (allowlist.staff.includes(normalizedEmail)) {
    resolvedProfiles.push({ role: 'staff', dashboardPath: '/staff', source: 'env-allowlist' })
  }

  return buildResolvedAccessProfile(resolvedProfiles, 'customer')
}

exports.api = onRequest((request, response) => {
  logger.info('Bykelink Motor Inc system function called', {
    structuredData: true,
  })

  response.json({
    ok: true,
    message: 'Bykelink Motor Inc system Firebase Cloud Function is running.',
    timestamp: new Date().toISOString(),
  })
})

exports.syncUserAccess = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to sync access.')
  }

  const uid = request.auth.uid
  const email = request.auth.token.email || request.data?.email || ''

  if (!email) {
    throw new HttpsError('failed-precondition', 'No email is associated with this account.')
  }

  const requestedRole = String(request.data?.requestedRole || 'customer').toLowerCase()
  const accessRecord = await getRoleFromEmail(email, {
    uid,
    claimsRole: request.auth.token.role,
  }).catch((error) => {
    logger.warn('Unable to resolve role from Firestore; using a safe fallback profile.', {
      email,
      uid,
      details: error.message,
      structuredData: true,
    })

    return buildResolvedAccessProfile(
      [
        request.auth.token.role
          ? {
              role: request.auth.token.role,
              dashboardPath: getDashboardPath(request.auth.token.role),
              source: 'auth-claim-fallback',
            }
          : null,
      ],
      'customer',
    )
  })
  const role = accessRecord.role
  const dashboardPath = accessRecord.dashboardPath || getDashboardPath(role)
  const isPrivileged = role !== 'customer'
  const userRef = admin.firestore().collection('users').doc(uid)
  let existingUserData = {}

  try {
    const existingUserSnapshot = await userRef.get()
    existingUserData = existingUserSnapshot.data() || {}
  } catch (error) {
    logger.warn('Unable to read the user profile from Firestore during syncUserAccess.', {
      uid,
      email,
      details: error.message,
      structuredData: true,
    })
  }

  const mustChangePassword = Boolean(existingUserData.mustChangePassword || request.auth.token.mustChangePassword)
  const authorized =
    requestedRole === 'customer' ||
    (rolePriority[role] ?? 0) >= (rolePriority[requestedRole] ?? Number.MAX_SAFE_INTEGER)

  try {
    await admin.auth().setCustomUserClaims(uid, {
      role,
      isPrivileged,
      dashboardPath: dashboardPath || '',
      mustChangePassword,
    })
  } catch (error) {
    logger.warn('Unable to set custom claims for syncUserAccess; continuing without claims.', {
      uid,
      email,
      details: error.message,
      structuredData: true,
    })
  }

  try {
    await userRef.set(
      {
        email: email.toLowerCase(),
        displayName: request.auth.token.name || null,
        role,
        isPrivileged,
        dashboardPath,
        mustChangePassword,
        firstLoginRequired: Boolean(existingUserData.firstLoginRequired || mustChangePassword),
        lastRequestedRole: requestedRole,
        provider: request.auth.token.firebase?.sign_in_provider || 'password',
        accessSource: accessRecord.source,
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    logger.warn('Unable to persist the synced user profile to Firestore; returning access data without blocking sign-in.', {
      uid,
      email,
      details: error.message,
      structuredData: true,
    })
  }

  logger.info('Bykelink access sync complete', {
    uid,
    email,
    role,
    requestedRole,
    authorized,
    dashboardPath,
    mustChangePassword,
    source: accessRecord.source,
    structuredData: true,
  })

  return {
    ok: true,
    role,
    requestedRole,
    authorized,
    isPrivileged,
    dashboardPath,
    mustChangePassword,
  }
})

exports.createOperatorAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to invite an operator.')
  }

  const inviterEmail = String(request.auth.token.email || '').trim().toLowerCase()
  const inviterAccess = await getRoleFromEmail(inviterEmail, {
    uid: request.auth.uid,
    claimsRole: request.auth.token.role,
  })

  const fullName = String(request.data?.fullName || '').trim()
  const email = String(request.data?.email || '').trim().toLowerCase()
  const role = normalizeRole(request.data?.role || 'admin')
  const status = String(request.data?.status || 'active').trim().toLowerCase()
  const temporaryPassword = String(request.data?.temporaryPassword || '').trim()

  if (!fullName) {
    throw new HttpsError('invalid-argument', 'Enter the operator full name first.')
  }

  if (!email || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'Enter a valid operator email address.')
  }

  if (!['admin', ...personnelRoles].includes(role)) {
    throw new HttpsError(
      'invalid-argument',
      'Only admin, mechanics personnel, inventory personnel, cashier personnel, or front desk personnel can be created from this modal.',
    )
  }

  if (!['admin', 'superadmin'].includes(inviterAccess.role)) {
    throw new HttpsError('permission-denied', 'Only admin or superadmin can create operator accounts.')
  }

  const inviterCanCreateRole =
    inviterAccess.role === 'superadmin'
      ? ['admin', ...personnelRoles].includes(role)
      : personnelRoles.includes(role)

  if (!inviterCanCreateRole) {
    throw new HttpsError(
      'permission-denied',
      inviterAccess.role === 'admin'
        ? 'Admin can only create non-admin operator accounts.'
        : 'Only superadmin can create admin operator accounts.',
    )
  }

  if (!isStrongPassword(temporaryPassword)) {
    throw new HttpsError(
      'invalid-argument',
      'Temporary password must contain uppercase, lowercase, and a number with at least 8 characters.',
    )
  }

  const active = status !== 'inactive'
  const isAdminRole = role === 'admin'
  const isPersonnelRole = personnelRoles.includes(role)
  const accessLevel = isAdminRole ? 'admin' : 'staff'
  const targetCollection = isAdminRole ? 'authorizedAdmin' : 'authorizedPersonnel'
  const alternateCollection = isAdminRole ? 'authorizedPersonnel' : 'authorizedAdmin'
  const dashboardPath = getDashboardPath(role)
  const authApi = admin.auth()
  let operatorUser

  try {
    operatorUser = await authApi.getUserByEmail(email)
    await authApi.updateUser(operatorUser.uid, {
      displayName: fullName,
      password: temporaryPassword,
      disabled: !active,
      emailVerified: false,
    })
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      operatorUser = await authApi.createUser({
        email,
        password: temporaryPassword,
        displayName: fullName,
        emailVerified: false,
        disabled: !active,
      })
    } else {
      throw new HttpsError('internal', `Unable to create the operator account. ${error.message}`)
    }
  }

  try {
    await authApi.setCustomUserClaims(operatorUser.uid, {
      role,
      accessLevel,
      isPrivileged: true,
      dashboardPath: dashboardPath || '',
      mustChangePassword: true,
    })
  } catch (error) {
    logger.warn('Unable to set custom claims for createOperatorAccount.', {
      uid: operatorUser.uid,
      email,
      details: error.message,
      structuredData: true,
    })
  }

  try {
    await Promise.all([
      admin.firestore().collection('users').doc(operatorUser.uid).set(
        {
          email,
          fullName,
          displayName: fullName,
          role,
          accessLevel,
          personnelRole: isPersonnelRole ? role : '',
          status,
          active,
          isPrivileged: true,
          dashboardPath,
          mustChangePassword: true,
          firstLoginRequired: true,
          invitedBy: inviterEmail,
          inviteSource: 'createOperatorAccount',
          emailVerified: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      ),
      admin.firestore().collection(targetCollection).doc(email).set(
        {
          email,
          fullName,
          role,
          accessLevel,
          personnelRole: isPersonnelRole ? role : '',
          status,
          active,
          dashboardPath,
          mustChangePassword: true,
          firstLoginRequired: true,
          temporaryPassword,
          invitedBy: inviterEmail,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      ),
      admin.firestore().collection(alternateCollection).doc(email).set(
        {
          email,
          status: 'inactive',
          active: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      ),
    ])
  } catch (error) {
    logger.warn('Unable to persist operator access records from Cloud Functions. The client will need deployed Firestore rules for direct writes.', {
      email,
      role,
      details: error.message,
      structuredData: true,
    })
  }

  const emailResult = await sendFirebaseVerificationEmail({
    email,
    temporaryPassword,
  })

  if (emailResult.sent) {
    try {
      await Promise.all([
        admin.firestore().collection('users').doc(operatorUser.uid).set(
          {
            verificationEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
        admin.firestore().collection(targetCollection).doc(email).set(
          {
            verificationEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
      ])
    } catch (error) {
      logger.warn('Unable to persist the verification email timestamp for the invited operator.', {
        email,
        uid: operatorUser.uid,
        details: error.message,
        structuredData: true,
      })
    }
  }

  logger.info('Operator invite created successfully.', {
    email,
    role,
    accessLevel,
    emailSent: emailResult.sent,
    targetCollection,
    structuredData: true,
  })

  return {
    ok: true,
    email,
    role,
    accessLevel,
    emailSent: emailResult.sent,
    message: emailResult.sent
      ? `Firebase verification email sent to ${email}. Please use the newest verification email link.`
      : `Operator created for ${email}. Firebase verification email could not be sent automatically. Set FIREBASE_WEB_API_KEY in Functions config.`,
  }
})

exports.completeFirstLoginSetup = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to complete first-time setup.')
  }

  const uid = request.auth.uid
  const email = String(request.auth.token.email || '').trim().toLowerCase()
  const accessRecord = await getRoleFromEmail(email, {
    uid,
    claimsRole: request.auth.token.role,
  }).catch((error) => {
    logger.warn('Unable to resolve access during first-login completion; falling back to auth claims.', {
      uid,
      email,
      details: error.message,
      structuredData: true,
    })

    return buildResolvedAccessProfile(
      [
        request.auth.token.role
          ? {
              role: request.auth.token.role,
              dashboardPath: getDashboardPath(request.auth.token.role),
              source: 'auth-claim-fallback',
            }
          : null,
      ],
      'customer',
    )
  })
  const role = accessRecord.role
  const dashboardPath = accessRecord.dashboardPath || getDashboardPath(role)

  try {
    await admin.auth().setCustomUserClaims(uid, {
      role,
      isPrivileged: role !== 'customer',
      dashboardPath: dashboardPath || '',
      mustChangePassword: false,
    })
  } catch (error) {
    logger.warn('Unable to clear mustChangePassword claim during first-login completion.', {
      uid,
      email,
      details: error.message,
      structuredData: true,
    })
  }

  let firestoreSyncCompleted = false

  try {
    await Promise.all([
      admin.firestore().collection('users').doc(uid).set(
        {
          mustChangePassword: false,
          firstLoginRequired: false,
          temporaryPassword: '',
          emailVerified: Boolean(request.auth.token.email_verified),
          passwordChangedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      ),
      email
        ? admin.firestore().collection('authorizedAdmin').doc(email).set(
            {
              mustChangePassword: false,
              firstLoginRequired: false,
              temporaryPassword: '',
              passwordChangedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          )
        : Promise.resolve(),
      email
        ? admin.firestore().collection('authorizedPersonnel').doc(email).set(
            {
              mustChangePassword: false,
              firstLoginRequired: false,
              temporaryPassword: '',
              passwordChangedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          )
        : Promise.resolve(),
    ])

    firestoreSyncCompleted = true
  } catch (error) {
    logger.warn('Unable to persist first-login completion flags to Firestore; activation will continue using auth claims.', {
      uid,
      email,
      role,
      details: error.message,
      structuredData: true,
    })
  }

  return {
    ok: true,
    role,
    dashboardPath,
    firestoreSyncCompleted,
  }
})
