import { useEffect, useRef, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth'
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import HeroSection from './pages/herosection/HeroSection'
import ServicePage from './pages/herosection/ServicePage'
import ShowroomPage from './pages/herosection/ShowroomPage'
import PasswordChangeRequiredModal from './pages/superadmin/components/PasswordChangeRequiredModal'
import SuperAdminPage from './pages/superadmin/SuperAdminPage'
import { auth, db, functions, googleProvider } from './firebase'

const navLinks = [
  { label: 'Home', id: 'home' },
  { label: 'Showroom', id: 'showroom' },
  { label: 'Service', id: 'service' },
  { label: 'About', id: 'about' },
  { label: 'Contact', id: 'contact' },
]

const roleLabels = {
  guest: 'Guest',
  customer: 'Customer',
  staff: 'Staff',
  'mechanics personnel': 'Mechanics Personnel',
  'inventory personnel': 'Inventory Personnel',
  'cashier personnel': 'Cashier Personnel',
  'front desk personnel': 'Front Desk Personnel',
  admin: 'Admin',
  superadmin: 'Superadmin',
}

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

const dashboardByRole = {
  staff: '/staff',
  'mechanics personnel': '/staff',
  'inventory personnel': '/staff',
  'cashier personnel': '/staff',
  'front desk personnel': '/staff',
  admin: '/admin',
  superadmin: '/superadmin',
}

const dashboardRequirements = {
  '/staff': 'staff',
  '/admin': 'admin',
  '/superadmin': 'superadmin',
}

const defaultAccessProfile = {
  role: 'guest',
  label: 'Guest',
  dashboardPath: null,
  isPrivileged: false,
  authorized: false,
  mustChangePassword: false,
  firstLoginRequired: false,
  source: 'guest',
}

const isAuthorizedAccessCollectionSource = (source = '') =>
  [
    'authorized-superadmin-collection',
    'authorized-admin-collection',
    'authorized-personnel-collection',
    'authorizedSuperadmin',
    'authorizedAdmin',
    'authorizedPersonnel',
  ].includes(String(source).trim())

const getAuthorizedAccessDocRef = (email = '', source = '') => {
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (!normalizedEmail) {
    return null
  }

  if (source === 'authorized-superadmin-collection' || source === 'authorizedSuperadmin') {
    return doc(db, 'authorizedSuperadmin', normalizedEmail)
  }

  if (source === 'authorized-admin-collection' || source === 'authorizedAdmin') {
    return doc(db, 'authorizedAdmin', normalizedEmail)
  }

  if (source === 'authorized-personnel-collection' || source === 'authorizedPersonnel') {
    return doc(db, 'authorizedPersonnel', normalizedEmail)
  }

  return null
}

const GOOGLE_AUTH_PERSONA_STORAGE_KEY = 'bykelink-google-auth-persona'
const VERIFICATION_EMAIL_COOLDOWN_MS = 5 * 60 * 1000

const formatAuthError = (error) => {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in instead.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.'
    case 'auth/weak-password':
      return 'Password must be at least 8 characters long and include uppercase, lowercase, and a number.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was canceled before completion.'
    case 'auth/popup-blocked':
      return 'Google sign-in was blocked by the browser. Please allow popups or try again.'
    case 'auth/web-storage-unsupported':
      return 'This browser mode is blocking Google sign-in storage. Please open the app normally and try again.'
    case 'auth/account-exists-with-different-credential':
      return 'This email already uses a different sign-in method. Try email and password instead.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/operation-not-allowed':
      return 'Enable Email/Password and Google sign-in in your Firebase console to use this form.'
    default:
      return error?.message || 'Something went wrong. Please try again.'
  }
}

const normalizePath = (path) => {
  if (path?.startsWith('/showroom')) return '/showroom'
  if (path?.startsWith('/service')) return '/service'
  if (path?.startsWith('/superadmin')) return '/superadmin'
  if (path?.startsWith('/admin')) return '/admin'
  if (path?.startsWith('/staff')) return '/staff'
  return '/'
}

const getNavLabelForPath = (path, hash = '') => {
  const matchedLink = navLinks.find((link) => link.id === hash)

  if (path === '/showroom') return 'Showroom'
  if (path === '/service') return 'Service'
  if (dashboardRequirements[path]) return 'Dashboard'

  return matchedLink?.label || 'Home'
}

const canAccessRole = (currentRole, requiredRole) => {
  return (rolePriority[currentRole] ?? -1) >= (rolePriority[requiredRole] ?? Number.MAX_SAFE_INTEGER)
}

const normalizeAccessRole = (value = 'customer') => {
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

  return normalizePath(normalizedValue.startsWith('/') ? normalizedValue : `/${normalizedValue}`)
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

const buildAuthorizedAdminProfile = (
  entry = {},
  { fallbackRole = 'admin', source = 'authorized-admin-collection' } = {},
) => {
  if (!isAuthorizedEntryActive(entry)) {
    return null
  }

  const role = normalizeAccessRole(
    entry.role || entry.assignedRole || entry.accessRole || entry.accountRole || fallbackRole,
  )

  if (role === 'customer') {
    return null
  }

  return {
    role,
    label: roleLabels[role] || 'Admin',
    dashboardPath:
      normalizeDashboardPath(
        entry.dashboardPath || entry.assignedPage || entry.redirectTo || entry.page,
      ) || dashboardByRole[role] || null,
    isPrivileged: true,
    authorized: true,
    mustChangePassword: Boolean(entry.mustChangePassword),
    firstLoginRequired: Boolean(entry.firstLoginRequired),
    source,
  }
}

const getAuthorizedAdminProfile = async (email = '') => {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    return null
  }

  const collectionsToCheck = [
    {
      name: 'authorizedSuperadmin',
      fallbackRole: 'superadmin',
      source: 'authorized-superadmin-collection',
    },
    {
      name: 'authorizedAdmin',
      fallbackRole: 'admin',
      source: 'authorized-admin-collection',
    },
    {
      name: 'authorizedPersonnel',
      fallbackRole: 'staff',
      source: 'authorized-personnel-collection',
    },
  ]
  const emailFields = ['email', 'emailAddress', 'authorizedEmail', 'userEmail']

  try {
    for (const { name: collectionName, fallbackRole, source } of collectionsToCheck) {
      const directSnapshot = await getDoc(doc(db, collectionName, normalizedEmail))

      if (directSnapshot.exists()) {
        const directProfile = buildAuthorizedAdminProfile(directSnapshot.data(), {
          fallbackRole,
          source,
        })

        if (directProfile) {
          return directProfile
        }
      }

      for (const fieldName of emailFields) {
        const filteredSnapshot = await getDocs(
          query(collection(db, collectionName), where(fieldName, '==', normalizedEmail), limit(1)),
        )

        const matchedDocument = filteredSnapshot.docs[0]

        if (matchedDocument) {
          const matchedProfile = buildAuthorizedAdminProfile(matchedDocument.data(), {
            fallbackRole,
            source,
          })

          if (matchedProfile) {
            return matchedProfile
          }
        }
      }
    }
  } catch {
    return null
  }

  return null
}

const isStrongPassword = (password = '') => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)
}

const shouldUseRedirectForGoogleAuth = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone === true ||
    /Android|iPhone|iPad|iPod/i.test(window.navigator?.userAgent || '')
  )
}

function App() {
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname))
  const [activeSlide, setActiveSlide] = useState(0)
  const [activeNav, setActiveNav] = useState(() =>
    getNavLabelForPath(normalizePath(window.location.pathname), window.location.hash.replace('#', '')),
  )
  const [authMode, setAuthMode] = useState('signup')
  const [authPersona, setAuthPersona] = useState('customer')
  const [authLoading, setAuthLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isAuthInitializing, setIsAuthInitializing] = useState(true)
  const [isAccessResolving, setIsAccessResolving] = useState(false)
  const [authMessage, setAuthMessage] = useState(null)
  const [authForm, setAuthForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [currentUser, setCurrentUser] = useState(null)
  const [accessProfile, setAccessProfile] = useState(defaultAccessProfile)
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false)
  const [passwordChangeMessage, setPasswordChangeMessage] = useState(null)
  const [passwordChangeForm, setPasswordChangeForm] = useState({
    password: '',
    confirmPassword: '',
  })
  const authPersonaRef = useRef(authPersona)
  const completeAccessFlowRef = useRef(null)

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setIsPageLoading(false)
    }, 1200)

    return () => window.clearTimeout(timerId)
  }, [])

  useEffect(() => {
    authPersonaRef.current = authPersona
  }, [authPersona])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setIsAccessResolving(Boolean(user))
      setIsAuthInitializing(false)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isSubscribed = true

    const resolveGoogleRedirect = async () => {
      try {
        const credentials = await getRedirectResult(auth)

        if (!credentials?.user || !isSubscribed) {
          return
        }

        const requestedRole =
          window.sessionStorage.getItem(GOOGLE_AUTH_PERSONA_STORAGE_KEY) || authPersonaRef.current || 'customer'

        window.sessionStorage.removeItem(GOOGLE_AUTH_PERSONA_STORAGE_KEY)

        await completeAccessFlowRef.current?.(
          credentials.user,
          requestedRole,
          requestedRole === 'customer'
            ? 'Google sign-in successful. Your rider account is now connected.'
            : `${roleLabels[requestedRole]} access verified with Google sign-in.`,
        )
      } catch (error) {
        if (isSubscribed && error?.code !== 'auth/no-auth-event') {
          setAuthMessage({
            type: 'error',
            text: formatAuthError(error),
          })
        }
      } finally {
        if (isSubscribed) {
          setGoogleLoading(false)
        }
      }
    }

    resolveGoogleRedirect()

    return () => {
      isSubscribed = false
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const nextPath = normalizePath(window.location.pathname)
      const hash = window.location.hash.replace('#', '')

      setCurrentPath(nextPath)
      setActiveNav(getNavLabelForPath(nextPath, hash))
    }

    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % 3)
    }, 4500)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const sections = navLinks
      .map((link) => document.getElementById(link.id))
      .filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (!visibleEntry) return

        const matchedLink = navLinks.find((link) => link.id === visibleEntry.target.id)

        if (matchedLink) {
          setActiveNav(matchedLink.label)
        }
      },
      {
        threshold: [0.25, 0.45, 0.65],
        rootMargin: '-20% 0px -55% 0px',
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [currentPath])

  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      },
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [currentPath])

  useEffect(() => {
    const requestedRole = dashboardRequirements[currentPath] || 'customer'

    if (!currentUser) {
      setAccessProfile(defaultAccessProfile)
      setRequiresPasswordChange(false)
      setPasswordChangeMessage(null)
      setPasswordChangeForm({
        password: '',
        confirmPassword: '',
      })
      setIsAccessResolving(false)
      return
    }

    const resolveAccessProfile = async () => {
      setIsAccessResolving(true)

      try {
        const profile = await resolveRoleAfterLogin(currentUser, requestedRole)
        setAccessProfile(profile)
      } finally {
        setIsAccessResolving(false)
      }
    }

    resolveAccessProfile()
  }, [currentPath, currentUser])

  useEffect(() => {
    if (
      currentPath === '/' &&
      currentUser &&
      !isAccessResolving &&
      accessProfile.isPrivileged &&
      accessProfile.dashboardPath
    ) {
      navigateTo(accessProfile.dashboardPath)
    }
  }, [currentPath, currentUser, isAccessResolving, accessProfile.isPrivileged, accessProfile.dashboardPath])

  useEffect(() => {
    if (currentUser) {
      setRequiresPasswordChange(Boolean(accessProfile.mustChangePassword || accessProfile.firstLoginRequired))
    }
  }, [currentUser, accessProfile.firstLoginRequired, accessProfile.mustChangePassword])

  useEffect(() => {
    let isSubscribed = true

    const loadPasswordRequirement = async () => {
      if (!currentUser?.uid) {
        if (isSubscribed) {
          setRequiresPasswordChange(false)
        }
        return
      }

      try {
        const authorizedProfile = await getAuthorizedAdminProfile(currentUser.email || '')

        if (authorizedProfile && isSubscribed) {
          const shouldChangePassword = Boolean(authorizedProfile.mustChangePassword || authorizedProfile.firstLoginRequired)
          setRequiresPasswordChange(shouldChangePassword)
          return
        }

        const userSnapshot = await getDoc(doc(db, 'users', currentUser.uid))
        const userData = userSnapshot.data() || {}
        const shouldChangePassword = Boolean(userData.mustChangePassword || userData.firstLoginRequired)

        if (isSubscribed) {
          setRequiresPasswordChange(shouldChangePassword)
        }
      } catch {
        if (isSubscribed) {
          setRequiresPasswordChange(false)
        }
      }
    }

    loadPasswordRequirement()

    return () => {
      isSubscribed = false
    }
  }, [currentUser])

  const customerName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Rider'

  const openAuthPanel = (mode, persona = authPersona) => {
    setAuthPersona(persona)
    setAuthMode(persona === 'customer' ? mode : 'login')
    setAuthMessage(null)
  }

  const goToHomeSection = (sectionId = 'home', label = 'Home') => {
    const nextUrl = sectionId === 'home' ? '/#home' : `/#${sectionId}`

    if (window.location.pathname !== '/' || window.location.hash !== `#${sectionId}`) {
      window.history.pushState({}, '', nextUrl)
    }

    setCurrentPath('/')
    setActiveNav(label)

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const section = document.getElementById(sectionId)

        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      })
    })
  }

  const openAuthSection = (mode, persona = authPersona) => {
    openAuthPanel(mode, persona)
    goToHomeSection(mode === 'signup' && persona === 'customer' ? 'signup' : 'login', 'Home')
  }

  const navigateTo = (path) => {
    const nextPath = normalizePath(path)

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }

    setCurrentPath(nextPath)
    setActiveNav(getNavLabelForPath(nextPath))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelectAuthPersona = (persona) => {
    setAuthPersona(persona)
    setAuthMode((current) => (persona === 'customer' ? current : 'login'))
    setAuthMessage(null)
  }

  const handleAuthFieldChange = (event) => {
    const { name, value } = event.target

    setAuthForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handlePasswordChangeField = (event) => {
    const { name, value } = event.target

    setPasswordChangeForm((current) => ({
      ...current,
      [name]: value,
    }))
    setPasswordChangeMessage(null)
  }

  const syncUserDocument = async (user, profile = {}) => {
    if (isAuthorizedAccessCollectionSource(profile?.source)) {
      return
    }

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          fullName: authForm.fullName.trim() || user.displayName || user.email?.split('@')[0] || 'Rider',
          phone: authForm.phone.trim(),
          email: user.email?.trim().toLowerCase() || '',
          role: profile?.role || 'customer',
          emailVerified: Boolean(user.emailVerified),
          providers: user.providerData.map((provider) => provider.providerId),
          lastSignInProvider: user.providerData[0]?.providerId || 'password',
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    } catch (error) {
      console.warn('Unable to sync user document to Firestore.', error)
    }
  }

  const sendVerificationEmailWithCooldown = async (user, options = {}) => {
    if (!user?.uid) {
      return { sent: false, reason: 'missing-user' }
    }

    const { force = false } = options
    let verificationDocRef = doc(db, 'users', user.uid)

    try {
      const authorizedProfile = await getAuthorizedAdminProfile(user.email || '')
      const authorizedDocRef = getAuthorizedAccessDocRef(user.email || '', authorizedProfile?.source)

      if (authorizedDocRef) {
        verificationDocRef = authorizedDocRef
      }
    } catch (error) {
      console.warn('Unable to resolve the verification email storage location.', error)
    }

    if (!force) {
      try {
        const userSnapshot = await getDoc(verificationDocRef)
        const userData = userSnapshot.data() || {}
        const rawLastSentAt = userData.verificationEmailSentAt
        const lastSentAt = rawLastSentAt?.toDate
          ? rawLastSentAt.toDate()
          : rawLastSentAt
            ? new Date(rawLastSentAt)
            : null

        if (lastSentAt && !Number.isNaN(lastSentAt.getTime())) {
          const elapsedMs = Date.now() - lastSentAt.getTime()

          if (elapsedMs < VERIFICATION_EMAIL_COOLDOWN_MS) {
            return { sent: false, reason: 'cooldown', lastSentAt }
          }
        }
      } catch (error) {
        console.warn('Unable to inspect the last verification email timestamp.', error)
      }
    }

    await sendEmailVerification(user)

    try {
      await setDoc(
        verificationDocRef,
        {
          email: user.email?.trim().toLowerCase() || '',
          emailVerified: Boolean(user.emailVerified),
          verificationEmailSentAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    } catch (error) {
      console.warn('Unable to store the verification email timestamp.', error)
    }

    return { sent: true, reason: force ? 'forced' : 'fresh' }
  }

  const resolveRoleAfterLogin = async (user, requestedRole) => {
    const syncUserAccess = httpsCallable(functions, 'syncUserAccess')

    const [authorizedAdminResult, cloudResult] = await Promise.allSettled([
      getAuthorizedAdminProfile(user.email),
      syncUserAccess({ requestedRole }),
    ])

    const authorizedAdminProfile =
      authorizedAdminResult.status === 'fulfilled' ? authorizedAdminResult.value : null
    const cloudData = cloudResult.status === 'fulfilled' ? cloudResult.value?.data ?? null : null

    const candidateRoles = [normalizeAccessRole(cloudData?.role), authorizedAdminProfile?.role].filter(Boolean)

    const resolvedRole = candidateRoles.reduce((highestRole, role) => {
      return canAccessRole(role, highestRole) ? role : highestRole
    }, 'customer')

    const dashboardPath =
      authorizedAdminProfile?.dashboardPath ||
      normalizeDashboardPath(cloudData?.dashboardPath) ||
      dashboardByRole[resolvedRole] ||
      null

    return {
      role: resolvedRole,
      label: roleLabels[resolvedRole] || 'Customer',
      dashboardPath,
      isPrivileged: resolvedRole !== 'customer',
      authorized: requestedRole === 'customer' || canAccessRole(resolvedRole, requestedRole),
      mustChangePassword: Boolean(authorizedAdminProfile?.mustChangePassword || cloudData?.mustChangePassword),
      firstLoginRequired: Boolean(
        authorizedAdminProfile?.firstLoginRequired ||
          cloudData?.firstLoginRequired ||
          authorizedAdminProfile?.mustChangePassword ||
          cloudData?.mustChangePassword,
      ),
      source: authorizedAdminProfile?.source || cloudData?.source || 'client-fallback',
    }
  }

  const completeAccessFlow = async (user, requestedRole, successText) => {
    const profile = await resolveRoleAfterLogin(user, requestedRole)

    if (requestedRole !== 'customer' && !profile.authorized) {
      await signOut(auth)
      setAccessProfile(defaultAccessProfile)
      setAuthMessage({
        type: 'error',
        text: `This email is not assigned for ${roleLabels[requestedRole]} access. Add it to the proper authorized Firestore collection first.`,
      })
      navigateTo('/')
      return null
    }

    await syncUserDocument(user, profile)
    setAccessProfile(profile)
    setAuthMessage({
      type: 'success',
      text: profile.isPrivileged
        ? `${profile.label} access verified. Opening the secure console.`
        : successText,
    })

    if (profile.dashboardPath) {
      navigateTo(profile.dashboardPath)
    }

    return profile
  }

  completeAccessFlowRef.current = completeAccessFlow

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthMessage(null)

    try {
      const requestedRole = authPersona

      if (!authForm.email.trim()) {
        throw new Error('Please enter your email address.')
      }

      if (authMode === 'signup') {
        if (!authForm.fullName.trim()) {
          throw new Error('Please enter your full name to create a secure account.')
        }

        if (!isStrongPassword(authForm.password)) {
          throw new Error('Use a stronger password with at least 8 characters, uppercase, lowercase, and a number.')
        }

        if (authForm.password !== authForm.confirmPassword) {
          throw new Error('Passwords do not match. Please confirm your password again.')
        }
      }

      if (requestedRole === 'customer' && authMode === 'signup') {
        const credentials = await createUserWithEmailAndPassword(auth, authForm.email.trim().toLowerCase(), authForm.password)

        if (authForm.fullName.trim()) {
          await updateProfile(credentials.user, {
            displayName: authForm.fullName.trim(),
          })
        }

        await syncUserDocument(credentials.user, {
          role: 'customer',
          source: 'customer-signup',
        })
        await sendVerificationEmailWithCooldown(credentials.user, { force: true })
        await signOut(auth)
        setAccessProfile(defaultAccessProfile)
        setAuthMessage({
          type: 'success',
          text: 'Account created securely. We sent a verification email—please use the newest link before your first login.',
        })
      } else {
        const credentials = await signInWithEmailAndPassword(auth, authForm.email.trim().toLowerCase(), authForm.password)

        if (!credentials.user.emailVerified && requestedRole !== 'superadmin') {
          const verificationDispatch = await sendVerificationEmailWithCooldown(credentials.user)
          await signOut(auth)
          setAccessProfile(defaultAccessProfile)
          throw new Error(
            verificationDispatch.sent
              ? 'Your email is not verified yet. We sent a fresh verification link—please use the newest email in your inbox.'
              : 'Your email is not verified yet. Please use the latest verification email already sent to your inbox. New resend links replace older ones.',
          )
        }

        await completeAccessFlow(
          credentials.user,
          requestedRole,
          requestedRole === 'customer'
            ? 'Welcome back. Your account is ready.'
            : `${roleLabels[requestedRole]} access verified.`,
        )
      }

      setAuthForm({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
      })
    } catch (error) {
      setAuthMessage({
        type: 'error',
        text: formatAuthError(error),
      })
    } finally {
      setAuthLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setAuthMessage(null)

    const requestedRole = authPersona

    try {
      if (shouldUseRedirectForGoogleAuth()) {
        window.sessionStorage.setItem(GOOGLE_AUTH_PERSONA_STORAGE_KEY, requestedRole)
        await signInWithRedirect(auth, googleProvider)
        return
      }

      const credentials = await signInWithPopup(auth, googleProvider)

      await completeAccessFlow(
        credentials.user,
        requestedRole,
        requestedRole === 'customer'
          ? 'Google sign-in successful. Your rider account is now connected.'
          : `${roleLabels[requestedRole]} access verified with Google sign-in.`,
      )
    } catch (error) {
      const shouldFallbackToRedirect =
        error?.code === 'auth/popup-blocked' ||
        error?.code === 'auth/web-storage-unsupported' ||
        String(error?.message || '').includes('Cross-Origin-Opener-Policy')

      if (shouldFallbackToRedirect) {
        window.sessionStorage.setItem(GOOGLE_AUTH_PERSONA_STORAGE_KEY, requestedRole)
        await signInWithRedirect(auth, googleProvider)
        return
      }

      setAuthMessage({
        type: 'error',
        text: formatAuthError(error),
      })
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    setAccessProfile(defaultAccessProfile)
    setRequiresPasswordChange(false)
    setPasswordChangeMessage(null)
    setPasswordChangeForm({
      password: '',
      confirmPassword: '',
    })
    setAuthMessage({
      type: 'success',
      text: 'You have been signed out successfully.',
    })
    navigateTo('/')
  }

  const handleRequiredPasswordChange = async (event) => {
    event.preventDefault()
    setPasswordChangeLoading(true)
    setPasswordChangeMessage(null)

    try {
      if (!passwordChangeForm.password.trim()) {
        throw new Error('Enter your new password first.')
      }

      if (!isStrongPassword(passwordChangeForm.password)) {
        throw new Error('Use a stronger password with at least 8 characters, uppercase, lowercase, and a number.')
      }

      if (passwordChangeForm.password !== passwordChangeForm.confirmPassword) {
        throw new Error('Passwords do not match. Please confirm your password again.')
      }

      if (!auth.currentUser) {
        throw new Error('Your session expired. Please sign in again with the temporary password.')
      }

      await updatePassword(auth.currentUser, passwordChangeForm.password)

      const completeFirstLoginSetup = httpsCallable(functions, 'completeFirstLoginSetup')
      await completeFirstLoginSetup({})

      if (auth.currentUser) {
        try {
          await auth.currentUser.getIdToken(true)
        } catch (tokenError) {
          console.warn('Unable to refresh the auth token after first-login completion.', tokenError)
        }
      }

      setRequiresPasswordChange(false)
      setPasswordChangeForm({
        password: '',
        confirmPassword: '',
      })
      setAuthMessage({
        type: 'success',
        text: 'Password updated successfully. Your account is now fully activated.',
      })
    } catch (error) {
      const passwordMessage =
        error?.code === 'auth/requires-recent-login'
          ? 'Please sign in again using the temporary password, then update it immediately.'
          : formatAuthError(error)

      setPasswordChangeMessage({
        type: 'error',
        text: passwordMessage,
      })
    } finally {
      setPasswordChangeLoading(false)
    }
  }

  const requiredDashboardRole = dashboardRequirements[currentPath]
  const canViewCurrentDashboard = requiredDashboardRole
    ? canAccessRole(accessProfile.role, requiredDashboardRole)
    : false

  const displayAuthMessage =
    authMessage ||
    (requiredDashboardRole && !currentUser
      ? {
          type: 'error',
          text: `Sign in with an authorized ${roleLabels[requiredDashboardRole].toLowerCase()} email to access this dashboard.`,
        }
      : requiredDashboardRole && currentUser && !isAccessResolving && !canViewCurrentDashboard
        ? {
            type: 'error',
            text: `${currentUser.email} is signed in, but it is not authorized for ${roleLabels[requiredDashboardRole]} access.`,
          }
        : null)

  const shouldShowAccessLoader =
    (Boolean(requiredDashboardRole) && (isAuthInitializing || isAccessResolving)) ||
    (currentPath === '/' &&
      currentUser &&
      (isAuthInitializing || isAccessResolving || (accessProfile.isPrivileged && accessProfile.dashboardPath)))

  const passwordChangeModal = (
    <PasswordChangeRequiredModal
      open={Boolean(currentUser && requiresPasswordChange)}
      currentUser={currentUser}
      passwordChangeForm={passwordChangeForm}
      onFieldChange={handlePasswordChangeField}
      onSubmit={handleRequiredPasswordChange}
      isSubmitting={passwordChangeLoading}
      message={passwordChangeMessage}
    />
  )

  const withSecurityModal = (content) => (
    <>
      {content}
      {passwordChangeModal}
    </>
  )

  if (currentPath === '/showroom') {
    return withSecurityModal(
      <ShowroomPage
        onNavigateHome={() => goToHomeSection('home', 'Home')}
        onNavigateSection={goToHomeSection}
        onNavigateService={() => navigateTo('/service')}
        onOpenSignup={() => openAuthSection('signup', 'customer')}
      />,
    )
  }

  if (currentPath === '/service') {
    return withSecurityModal(
      <ServicePage
        onNavigateHome={() => goToHomeSection('home', 'Home')}
        onNavigateShowroom={() => navigateTo('/showroom')}
        onNavigateSection={goToHomeSection}
        onOpenSignup={() => openAuthSection('signup', 'customer')}
      />,
    )
  }

  if (shouldShowAccessLoader) {
    return withSecurityModal(
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#e10100]">Bykelink Secure Access</p>
          <h1 className="mt-4 font-['Epilogue'] text-3xl font-black uppercase italic tracking-tighter sm:text-5xl">
            Preparing{' '}
            <span className="text-[#e10100]">{requiredDashboardRole ? roleLabels[requiredDashboardRole] : 'Dashboard'}</span>
          </h1>
          <p className="mt-3 text-sm text-white/60 sm:text-base">
            Verifying your session and routing you to the correct access page.
          </p>
          <div className="mx-auto mt-6 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#e10100]" />
          </div>
        </div>
      </div>,
    )
  }

  if (dashboardRequirements[currentPath] && currentUser && canViewCurrentDashboard && !isAccessResolving) {
    return withSecurityModal(
      <SuperAdminPage
        onNavigateHome={() => goToHomeSection('home', 'Home')}
        onSignOut={handleSignOut}
        currentUser={currentUser}
        accessProfile={accessProfile}
      />,
    )
  }

  return withSecurityModal(
    <HeroSection
      isPageLoading={isPageLoading}
      activeNav={activeNav}
      activeSlide={activeSlide}
      currentUser={currentUser}
      customerName={customerName}
      authMode={authMode}
      authPersona={authPersona}
      accessProfile={accessProfile}
      authLoading={authLoading || isAccessResolving}
      googleLoading={googleLoading}
      authMessage={displayAuthMessage}
      authForm={authForm}
      onSelectSlide={setActiveSlide}
      onOpenAuthPanel={openAuthPanel}
      onOpenAuthSection={openAuthSection}
      onSelectAuthPersona={handleSelectAuthPersona}
      onGoogleSignIn={handleGoogleSignIn}
      onAuthFieldChange={handleAuthFieldChange}
      onAuthSubmit={handleAuthSubmit}
      onNavigateShowroom={() => navigateTo('/showroom')}
      onNavigateService={() => navigateTo('/service')}
      onNavigateSection={goToHomeSection}
      onOpenDashboard={() => accessProfile.dashboardPath && navigateTo(accessProfile.dashboardPath)}
      onSignOut={handleSignOut}
    />,
  )
}

export default App
