const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')
const admin = require('firebase-admin')

admin.initializeApp()

const DEFAULT_OPERATOR_PASSWORD = 'Password123'

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

const isAuthorizedCollectionSource = (source = '') =>
  ['authorizedSuperadmin', 'authorizedAdmin', 'authorizedPersonnel'].includes(String(source).trim())

const getAuthorizedCollectionNameForRole = (role = 'customer') => {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole === 'superadmin') return 'authorizedSuperadmin'
  if (normalizedRole === 'admin') return 'authorizedAdmin'
  if (normalizedRole === 'staff' || personnelRoles.includes(normalizedRole)) return 'authorizedPersonnel'

  return null
}

const deleteMatchingUserDocs = async ({ uid = '', email = '' } = {}) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const usersCollection = admin.firestore().collection('users')
  const deleteOperations = []

  if (uid) {
    deleteOperations.push(usersCollection.doc(uid).delete().catch(() => undefined))
  }

  if (normalizedEmail) {
    const snapshot = await usersCollection.where('email', '==', normalizedEmail).get()
    snapshot.forEach((docSnapshot) => {
      deleteOperations.push(docSnapshot.ref.delete().catch(() => undefined))
    })
  }

  await Promise.all(deleteOperations)
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

const getRoleFromEmail = async (email = '', options = {}) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedUid = String(options.uid || '').trim()
  const claimsRole = normalizeRole(options.claimsRole || 'customer')

  const resolvedProfiles = []

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

  const [superadminProfileResult, adminProfileResult, personnelProfileResult] = await Promise.allSettled([
    findCollectionRole('authorizedSuperadmin', 'superadmin'),
    findCollectionRole('authorizedAdmin', 'admin'),
    findCollectionRole('authorizedPersonnel', 'staff'),
  ])

  resolvedProfiles.push(
    superadminProfileResult.status === 'fulfilled' ? superadminProfileResult.value : null,
    adminProfileResult.status === 'fulfilled' ? adminProfileResult.value : null,
    personnelProfileResult.status === 'fulfilled' ? personnelProfileResult.value : null,
  )

  const accessLookupErrors = [superadminProfileResult, adminProfileResult, personnelProfileResult]
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

    if (!resolvedProfiles.filter(Boolean).length && claimsRole !== 'customer') {
      resolvedProfiles.push({
        role: claimsRole,
        dashboardPath: getDashboardPath(claimsRole),
        source: 'auth-claim-fallback',
      })
    }
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
  const shouldSyncUsersCollection = !isAuthorizedCollectionSource(accessRecord.source)
  const userRef = shouldSyncUsersCollection ? admin.firestore().collection('users').doc(uid) : null
  let existingUserData = {}

  if (userRef) {
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

  if (userRef) {
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
    source: accessRecord.source,
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
  const temporaryPassword = DEFAULT_OPERATOR_PASSWORD

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

  if (temporaryPassword.length < 8) {
    throw new HttpsError(
      'invalid-argument',
      'Temporary password must be at least 8 characters long.',
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
      admin.firestore().collection(alternateCollection).doc(email).delete(),
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
      : `Operator created for ${email}. Firebase verification email could not be sent automatically.`,
  }
})

exports.archiveOperatorAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to archive an operator.')
  }

  const requesterEmail = String(request.auth.token.email || '').trim().toLowerCase()

  try {
    var requesterAccess = await getRoleFromEmail(requesterEmail, {
      uid: request.auth.uid,
      claimsRole: request.auth.token.role,
    })
  } catch (error) {
    logger.error('Unable to resolve requester access in archiveOperatorAccount', {
      email: requesterEmail,
      details: error.message,
      structuredData: true,
    })
    throw new HttpsError('internal', `Unable to resolve your access permissions. ${error.message}`)
  }

  if (!['admin', 'superadmin'].includes(requesterAccess.role)) {
    throw new HttpsError('permission-denied', 'Only admin or superadmin can archive user accounts.')
  }

  const email = String(request.data?.email || '').trim().toLowerCase()
  const fullName = String(request.data?.fullName || '').trim()
  const role = normalizeRole(request.data?.role || 'customer')

  if (!email || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'Enter a valid email address to archive.')
  }

  if (requesterAccess.role === 'admin' && ['admin', 'superadmin'].includes(role)) {
    throw new HttpsError('permission-denied', 'Admin can archive non-admin accounts only.')
  }

  const accessCollection = getAuthorizedCollectionNameForRole(role)
  const archiveRef = admin.firestore().collection('deleteArchived').doc(email)
  const authApi = admin.auth()
  let authUser = null
  let accessRecord = {}

  try {
    if (accessCollection) {
      const accessSnapshot = await admin.firestore().collection(accessCollection).doc(email).get()
      accessRecord = accessSnapshot.data() || {}
    }
  } catch (error) {
    logger.warn('Unable to read the active access record before archiving.', {
      email,
      role,
      details: error.message,
      structuredData: true,
    })
  }

  try {
    authUser = await authApi.getUserByEmail(email)
    await authApi.updateUser(authUser.uid, { disabled: true })
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw new HttpsError('internal', `Unable to archive the user account. ${error.message}`)
    }
  }

  try {
    await archiveRef.set(
      {
        email,
        fullName: fullName || accessRecord.fullName || authUser?.displayName || '',
        role,
        accessLevel: accessRecord.accessLevel || (role === 'admin' ? 'admin' : 'staff'),
        personnelRole: personnelRoles.includes(role) ? role : '',
        dashboardPath: getDashboardPath(role),
        archivedBy: requesterEmail,
        archivedByRole: requesterAccess.role,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'archived',
        active: false,
        authUid: authUser?.uid || '',
        originalCollection: accessCollection || 'users',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    await Promise.all([
      admin.firestore().collection('authorizedSuperadmin').doc(email).delete().catch(() => undefined),
      admin.firestore().collection('authorizedAdmin').doc(email).delete().catch(() => undefined),
      admin.firestore().collection('authorizedPersonnel').doc(email).delete().catch(() => undefined),
      deleteMatchingUserDocs({ uid: authUser?.uid || '', email }),
    ])
  } catch (error) {
    throw new HttpsError('internal', `Unable to move the user into Delete Archived. ${error.message}`)
  }

  return {
    ok: true,
    email,
    message: `${email} moved to Delete Archived successfully.`,
  }
})

exports.deleteArchivedUserPermanently = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to permanently delete an archived user.')
  }

  const requesterEmail = String(request.auth.token.email || '').trim().toLowerCase()
  const requesterAccess = await getRoleFromEmail(requesterEmail, {
    uid: request.auth.uid,
    claimsRole: request.auth.token.role,
  })

  if (requesterAccess.role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Only superadmin can permanently delete archived users.')
  }

  const email = String(request.data?.email || '').trim().toLowerCase()

  if (!email || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'Enter a valid archived user email address.')
  }

  const archiveRef = admin.firestore().collection('deleteArchived').doc(email)
  const archiveSnapshot = await archiveRef.get().catch(() => null)
  const archivedData = archiveSnapshot?.data?.() || {}
  const authApi = admin.auth()
  let authUid = String(archivedData.authUid || '').trim()

  if (!authUid) {
    try {
      const authUser = await authApi.getUserByEmail(email)
      authUid = authUser.uid
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw new HttpsError('internal', `Unable to inspect the archived auth account. ${error.message}`)
      }
    }
  }

  try {
    if (authUid) {
      await authApi.deleteUser(authUid)
    }

    await Promise.all([
      archiveRef.delete().catch(() => undefined),
      admin.firestore().collection('authorizedSuperadmin').doc(email).delete().catch(() => undefined),
      admin.firestore().collection('authorizedAdmin').doc(email).delete().catch(() => undefined),
      admin.firestore().collection('authorizedPersonnel').doc(email).delete().catch(() => undefined),
      deleteMatchingUserDocs({ uid: authUid, email }),
    ])
  } catch (error) {
    throw new HttpsError('internal', `Unable to permanently delete the archived user. ${error.message}`)
  }

  return {
    ok: true,
    email,
    message: `${email} was permanently deleted from Delete Archived.`,
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
  const shouldSyncUsersCollection = !isAuthorizedCollectionSource(accessRecord.source)
  const accessCollectionsToSync = email
    ? [
        accessRecord.source === 'authorizedSuperadmin' || role === 'superadmin'
          ? 'authorizedSuperadmin'
          : role === 'admin'
            ? 'authorizedAdmin'
            : personnelRoles.includes(role) || role === 'staff'
              ? 'authorizedPersonnel'
              : null,
      ].filter(Boolean)
    : []

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
      ...(shouldSyncUsersCollection
        ? [
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
          ]
        : []),
      ...accessCollectionsToSync.map((collectionName) =>
        admin.firestore().collection(collectionName).doc(email).set(
          {
            mustChangePassword: false,
            firstLoginRequired: false,
            temporaryPassword: '',
            passwordChangedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
      ),
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
