import { useEffect, useRef, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updatePassword,
  updateProfile,
  checkActionCode,
} from 'firebase/auth'
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import HeroSection from './pages/herosection/HeroSection'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import PasswordResetConfirmationPage from './pages/PasswordResetConfirmationPage'
import EmailPasswordResetPage from './pages/EmailPasswordResetPage'
import ServicePage from './pages/herosection/ServicePage'
import ShowroomPage from './pages/herosection/ShowroomPage'
import SparePartsPage from './pages/herosection/SparePartsPage'
import CustomerShowroomPage from './pages/customer/CustomerShowroomPage'
import CustomerServicePage from './pages/customer/CustomerServicePage'
import CustomerMessagesPage from './pages/customer/CustomerMessagesPage'
import CustomerServiceBookingsPage from './pages/customer/CustomerServiceBookingsPage'
import ProductDetailsPage from './pages/customer/ProductDetailsPage'
import FinancingPage from './pages/customer/FinancingPage'
import ConfirmApplicationPage from './pages/customer/ConfirmApplicationPage'
import CustomerProfilePage from './pages/customer/CustomerProfilePage'
import FinancingSubmittedPage from './pages/customer/FinancingSubmittedPage'
import ApprovedApplicationPage from './pages/customer/ApprovedApplicationPage'
import FinancingStatusPage from './pages/customer/FinancingStatusPage'
import PasswordChangeRequiredModal from './pages/superadmin/components/PasswordChangeRequiredModal'
import SuperAdminPage from './pages/superadmin/SuperAdminPage'
import GlobalLoadingScreen from './components/GlobalLoadingScreen'
import ToastNotification from './components/ToastNotification'
import EmailVerifiedModal from './components/EmailVerifiedModal'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
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
  customer: '/customer',
  staff: '/staff',
  'mechanics personnel': '/staff',
  'inventory personnel': '/staff',
  'cashier personnel': '/staff',
  'front desk personnel': '/staff',
  admin: '/admin',
  superadmin: '/superadmin',
}

const dashboardRequirements = {
  '/customer': 'customer',
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
  if (path?.startsWith('/financing/')) return path
  if (path?.startsWith('/superadmin/')) return path
  if (path?.startsWith('/admin/')) return path
  if (path?.startsWith('/staff/')) return path
  if (path?.startsWith('/customer/')) return path
  if (path?.startsWith('/login')) return '/login'
  if (path?.startsWith('/forgot-password')) return '/forgot-password'
  if (path?.startsWith('/password-reset-confirmation')) return '/password-reset-confirmation'
  if (path?.startsWith('/customer')) return '/customer'
  if (path?.startsWith('/showroom')) return '/showroom'
  if (path?.startsWith('/spare-parts')) return '/spare-parts'
  if (path?.startsWith('/service')) return '/service'
  if (path?.startsWith('/financing')) return '/financing'
  if (path?.startsWith('/superadmin')) return '/superadmin'
  if (path?.startsWith('/admin')) return '/admin'
  if (path?.startsWith('/staff')) return '/staff'
  return '/'
}

const getNavLabelForPath = (path, hash = '') => {
  const matchedLink = navLinks.find((link) => link.id === hash)

  if (path === '/showroom') return 'Showroom'
  if (path === '/spare-parts') return 'Spare Parts'
  if (path === '/service') return 'Service'
  if (path === '/financing' || path?.startsWith('/financing/')) return 'Financing'
  if (path?.startsWith('/superadmin') || path?.startsWith('/admin') || path?.startsWith('/staff')) return 'Dashboard'
  if (dashboardRequirements[path]) return 'Dashboard'

  return matchedLink?.label || 'Home'
}

const getDashboardBasePath = (path = '') => {
  if (path?.startsWith('/superadmin')) return '/superadmin'
  if (path?.startsWith('/admin')) return '/admin'
  if (path?.startsWith('/staff')) return '/staff'
  return path
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
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [confirmationType, setConfirmationType] = useState('reset') // 'reset' or 'authorized'
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
  const [pendingApplicationData, setPendingApplicationData] = useState(null)
  const [accessProfile, setAccessProfile] = useState(defaultAccessProfile)
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false)
  const [passwordChangeMessage, setPasswordChangeMessage] = useState(null)
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false)
  const [passwordChangeForm, setPasswordChangeForm] = useState({
    password: '',
    confirmPassword: '',
  })
  const [emailPasswordResetCode, setEmailPasswordResetCode] = useState(null)
  const [emailVerificationCode, setEmailVerificationCode] = useState(null)
  const [emailVerificationEmail, setEmailVerificationEmail] = useState(null)
  const [signupSuccessEmail, setSignupSuccessEmail] = useState(null)
  const [signupSuccessUser, setSignupSuccessUser] = useState(null)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [showEmailVerifiedModal, setShowEmailVerifiedModal] = useState(false)
  const authPersonaRef = useRef(authPersona)
  const completeAccessFlowRef = useRef(null)

  // Extract verification code and email from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verificationCode = params.get('verification')
    const verificationEmail = params.get('email')
    
    if (verificationCode && verificationEmail) {
      setEmailVerificationCode(verificationCode)
      setEmailVerificationEmail(decodeURIComponent(verificationEmail))
      // Clean up URL to avoid re-processing on every render
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])


  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setIsPageLoading(false)
    }, 5000) // Extended to account for GlobalLoadingScreen completion (~4.3s)

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

  // Check for email verification success when navigating to customer dashboard
  useEffect(() => {
    if (currentPath === '/customer' && currentUser && accessProfile.role === 'customer') {
      const emailVerifiedFlag = window.sessionStorage.getItem('email_verified_success')
      console.log('[EMAIL VERIFIED MODAL] Checking flag on /customer route:', emailVerifiedFlag)
      if (emailVerifiedFlag) {
        console.log('[EMAIL VERIFIED MODAL] Flag found! Setting modal to true')
        setShowEmailVerifiedModal(true)
        window.sessionStorage.removeItem('email_verified_success')
      }
    }
  }, [currentPath, currentUser, accessProfile.role])

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

  // Detect Firebase action codes from email links (password reset, email verification, etc.)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const oobCode = urlParams.get('oobCode')

    if (!oobCode) return

    // Determine the action type by checking the code
    const detectActionType = async () => {
      try {
        console.log('[AUTH ACTION] Detecting action type for code:', oobCode.substring(0, 20) + '...')
        const actionInfo = await checkActionCode(auth, oobCode)
        console.log('[AUTH ACTION] Detected operation:', actionInfo?.operation)

        if (actionInfo?.operation === 'VERIFY_EMAIL') {
          console.log('[EMAIL VERIFY] Setting verification code')
          setEmailVerificationCode(oobCode)
        } else if (actionInfo?.operation === 'PASSWORD_RESET') {
          console.log('[PASSWORD RESET] Setting reset code')
          setEmailPasswordResetCode(oobCode)
        }

        // Clean up URL to remove the query parameters
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (error) {
        console.error('[AUTH ACTION] Failed to detect action type:', error?.code, error?.message)
      }
    }

    detectActionType()
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
      accessProfile.dashboardPath &&
      (accessProfile.isPrivileged || accessProfile.role === 'customer')
    ) {
      navigateTo(accessProfile.dashboardPath)
    }
  }, [currentPath, currentUser, isAccessResolving, accessProfile.role, accessProfile.isPrivileged, accessProfile.dashboardPath])

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

    // Set authMode to 'login' when navigating to the login section
    if (sectionId === 'login') {
      setAuthMode('login')
    }

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

  const handleToggleAuthMode = (mode) => {
    setAuthMode(mode)
    setAuthMessage(null)
    setAuthForm({
      fullName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
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

  const handleResendSignupEmail = async () => {
    if (!signupSuccessUser) return
    setResendingEmail(true)
    try {
      const resendVerificationEmailFn = httpsCallable(functions, 'resendVerificationEmail')
      await resendVerificationEmailFn({ email: signupSuccessUser.email })
      setAuthMessage({
        type: 'success',
        text: 'Verification email sent! Check your inbox.',
      })
    } catch (error) {
      console.error('Error resending email:', error)
      setAuthMessage({
        type: 'error',
        text: 'Unable to resend email. Please try again.',
      })
    } finally {
      setResendingEmail(false)
    }
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
    const resolvedCloudRole = normalizeAccessRole(cloudData?.role || requestedRole)
    const cloudDashboardPath =
      normalizeDashboardPath(cloudData?.dashboardPath) ||
      dashboardByRole[resolvedCloudRole] ||
      null

    // If admin is found in authorized collections, prioritize that role
    if (authorizedAdminProfile) {
      const dashboardPath =
        authorizedAdminProfile.dashboardPath ||
        dashboardByRole[authorizedAdminProfile.role] ||
        null

      return {
        role: authorizedAdminProfile.role,
        label: roleLabels[authorizedAdminProfile.role] || 'Admin',
        dashboardPath,
        isPrivileged: true,
        authorized: true,
        mustChangePassword: Boolean(authorizedAdminProfile.mustChangePassword),
        firstLoginRequired: Boolean(authorizedAdminProfile.firstLoginRequired || authorizedAdminProfile.mustChangePassword),
        source: authorizedAdminProfile.source,
      }
    }

    // If the Cloud Function resolved a privileged role, trust the server result.
    if (resolvedCloudRole !== 'customer') {
      return {
        role: resolvedCloudRole,
        label: roleLabels[resolvedCloudRole] || 'User',
        dashboardPath: cloudDashboardPath,
        isPrivileged: true,
        authorized: Boolean(cloudData?.authorized ?? true),
        mustChangePassword: Boolean(cloudData?.mustChangePassword),
        firstLoginRequired: Boolean(cloudData?.firstLoginRequired || cloudData?.mustChangePassword),
        source: cloudData?.source || 'cloud-function',
      }
    }

    // For customer logins without authorized admin profile or privileged server result
    if (requestedRole === 'customer') {
      return {
        role: 'customer',
        label: roleLabels['customer'] || 'Customer',
        dashboardPath: '/customer',
        isPrivileged: false,
        authorized: true,
        mustChangePassword: false,
        firstLoginRequired: false,
        source: 'customer-login',
      }
    }

    // Handle staff/personnel/admin roles from cloud function
    return {
      role: resolvedCloudRole,
      label: roleLabels[resolvedCloudRole] || 'User',
      dashboardPath: cloudDashboardPath,
      isPrivileged: resolvedCloudRole !== 'customer',
      authorized: true,
      mustChangePassword: Boolean(cloudData?.mustChangePassword),
      firstLoginRequired: Boolean(cloudData?.firstLoginRequired || cloudData?.mustChangePassword),
      source: cloudData?.source || 'cloud-function',
    }
  }

  const completeAccessFlow = async (user, requestedRole, successText) => {
    const profile = await resolveRoleAfterLogin(user, requestedRole)

    // If trying to access a higher privilege role than they have
    if (requestedRole !== 'customer' && !profile.authorized && !profile.isPrivileged) {
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
        
        // Call the custom verification Cloud Function to send verification email
        try {
          const sendVerificationEmailFn = httpsCallable(functions, 'sendVerificationEmail')
          await sendVerificationEmailFn({ email: authForm.email.trim().toLowerCase() })
          console.log('[SIGNUP] Verification email sent successfully')
        } catch (emailError) {
          console.warn('[SIGNUP] Failed to send verification email:', emailError?.message)
          // Continue with signup even if email fails - user can resend later
        }
        
        // Store user and show success screen, but DON'T sign out yet
        // This allows user to retry resending email if rate-limited
        const signupEmail = authForm.email.trim().toLowerCase()
        setSignupSuccessEmail(signupEmail)
        setSignupSuccessUser(credentials.user)
        
        // Save to sessionStorage so verification link can restore signup screen
        window.sessionStorage.setItem('signup_email', signupEmail)
        
        setAuthForm({
          fullName: '',
          phone: '',
          email: '',
          password: '',
          confirmPassword: '',
        })
        return
      } else {
        const credentials = await signInWithEmailAndPassword(auth, authForm.email.trim().toLowerCase(), authForm.password)

        if (!credentials.user.emailVerified && requestedRole !== 'superadmin') {
          try {
            const sendVerificationEmailFn = httpsCallable(functions, 'sendVerificationEmail')
            await sendVerificationEmailFn({ email: credentials.user.email })
            console.log('[LOGIN] Verification email sent successfully')
          } catch (emailError) {
            console.warn('[LOGIN] Failed to send verification email:', emailError?.message)
          }
          
          await signOut(auth)
          setAccessProfile(defaultAccessProfile)
          throw new Error(
            'Your email is not verified yet. We sent a fresh verification link—please check your inbox and click the link to verify.',
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

      // Show success message instead of immediately closing
      setPasswordChangeSuccess(true)
      setPasswordChangeForm({
        password: '',
        confirmPassword: '',
      })
      setPasswordChangeMessage({
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

  const handleDismissPasswordChangeSuccess = () => {
    setPasswordChangeSuccess(false)
    setRequiresPasswordChange(false)
    setPasswordChangeMessage(null)
  }

  const currentDashboardBasePath = getDashboardBasePath(currentPath)
  const requiredDashboardRole = dashboardRequirements[currentDashboardBasePath]
  const canViewCurrentDashboard = requiredDashboardRole
    ? canAccessRole(accessProfile.role, requiredDashboardRole)
    : false

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
      isSuccessful={passwordChangeSuccess}
      onDismissSuccess={handleDismissPasswordChangeSuccess}
    />
  )

  const withSecurityModal = (content) => (
    <>
      {content}
      {passwordChangeModal}
    </>
  )

  // Handle email password reset from link in email
  if (emailPasswordResetCode) {
    return withSecurityModal(
      <EmailPasswordResetPage
        resetCode={emailPasswordResetCode}
        onNavigateBack={() => {
          setEmailPasswordResetCode(null)
          navigateTo('/login')
        }}
      />
    )
  }

  if (currentPath === '/forgot-password') {
    return withSecurityModal(
      <ForgotPasswordPage
        onNavigateBack={() => navigateTo('/login')}
        onGoogleSignIn={handleGoogleSignIn}
        onNavigateConfirmation={(email, type = 'reset') => {
          setConfirmationEmail(email)
          setConfirmationType(type)
          navigateTo('/password-reset-confirmation')
        }}
      />,
    )
  }

  if (currentPath === '/password-reset-confirmation') {
    return withSecurityModal(
      <PasswordResetConfirmationPage
        email={confirmationEmail}
        type={confirmationType}
        onNavigateBack={() => navigateTo('/login')}
        onResendEmail={(email) => setConfirmationEmail(email)}
      />,
    )
  }

  if (currentPath === '/login') {
    return withSecurityModal(
       <LoginPage
      authMode={authMode}
      onGoogleSignIn={handleGoogleSignIn}
      onAuthFieldChange={handleAuthFieldChange}
      onAuthSubmit={handleAuthSubmit}
      onSelectAuthPersona={handleSelectAuthPersona}
      onToggleAuthMode={handleToggleAuthMode}
      authForm={authForm}
      authLoading={authLoading || isAccessResolving}
      googleLoading={googleLoading}
      onNavigateBack={() => navigateTo('/login')}  
      onNavigateForgotPassword={() => navigateTo('/forgot-password')}
      authMessage={authMessage}
      onClearAuthMessage={() => setAuthMessage(null)}
      signupSuccessEmail={signupSuccessEmail}
      onSetSignupSuccessEmail={setSignupSuccessEmail}
      emailVerificationCode={emailVerificationCode}
      emailVerificationEmail={emailVerificationEmail}
      onResendSignupEmail={handleResendSignupEmail}
      resendingEmail={resendingEmail}
      onNavigateToCustomerDashboard={() => navigateTo('/customer')} // ADD THIS
    />,
    )
  }

  if (currentPath === '/showroom') {
    return withSecurityModal(
      <ShowroomPage
        onNavigateHome={() => goToHomeSection('home', 'Home')}
        onNavigateSection={goToHomeSection}
        onNavigateService={() => goToHomeSection('service', 'Service')}
        onNavigateSpareParts={() => navigateTo('/spare-parts')}
        onOpenSignup={() => openAuthSection('signup', 'customer')}
        currentUser={currentUser}
      />,
    )
  }

  if (currentPath === '/spare-parts') {
    return withSecurityModal(
      <SparePartsPage
        onNavigateHome={() => goToHomeSection('home', 'Home')}
        onNavigateSection={goToHomeSection}
        onNavigateService={() => goToHomeSection('service', 'Service')}
        onNavigateShowroom={() => navigateTo('/showroom')}
        onOpenSignup={() => openAuthSection('signup', 'customer')}
        currentUser={currentUser}
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

  if (currentPath.startsWith('/financing/approved')) {
    const approvedMatch = currentPath.match(/^\/financing\/approved\/(.+)$/)
    const referenceId = approvedMatch ? decodeURIComponent(approvedMatch[1]) : ''

    return withSecurityModal(
      <ApprovedApplicationPage
        referenceId={referenceId}
        motorcycleName={currentUser?.motorcycleName || 'Your Yamaha'}
        onNavigateToShowroom={() => navigateTo('/customer')}
        onTrackApplication={() => navigateTo(`/financing/status/${encodeURIComponent(referenceId)}`)}
      />,
    )
  }

  if (currentPath.startsWith('/financing/submitted')) {
    const submittedMatch = currentPath.match(/^\/financing\/submitted\/(.+)$/)
    const referenceId = submittedMatch ? decodeURIComponent(submittedMatch[1]) : ''

    return withSecurityModal(
      <FinancingSubmittedPage
        referenceId={referenceId}
        onNavigateToShowroom={() => navigateTo('/customer')}
        onTrackApplication={() => navigateTo(`/financing/status/${encodeURIComponent(referenceId)}`)}
      />,
    )
  }

  if (currentPath.startsWith('/financing/status')) {
    const statusMatch = currentPath.match(/^\/financing\/status(?:\/(.+))?$/)
    const referenceId = statusMatch?.[1] ? decodeURIComponent(statusMatch[1]) : ''

    return withSecurityModal(
      <FinancingStatusPage
        referenceId={referenceId}
        currentUser={currentUser}
        onNavigateToShowroom={() => navigateTo('/customer')}
        onNavigateToService={() => navigateTo('/customer/service')}
        onNavigateToFinancing={() => navigateTo('/financing')}
        onNavigateToFinancingStatus={() => navigateTo('/financing/status')}
        onNavigateToMessages={() => navigateTo('/customer/messages')}
        onNavigateToProfile={() => navigateTo('/customer/profile')}
        onSignOut={currentUser ? handleSignOut : null}
      />,
    )
  }

  if (currentPath === '/financing/confirm' && currentUser && accessProfile.role === 'customer' && pendingApplicationData) {
    return withSecurityModal(
      <ConfirmApplicationPage
        currentUser={currentUser}
        applicationData={pendingApplicationData}
        onNavigateBack={() => {
          setPendingApplicationData(null)
          navigateTo('/financing')
        }}
        onNavigateToService={() => navigateTo('/customer/service')}
        onNavigateToMessages={() => navigateTo('/customer/messages')}
        onNavigateToFinancingStatus={(referenceId) => {
          setPendingApplicationData(null)
          navigateTo(`/financing/status/${encodeURIComponent(referenceId)}`)
        }}
        onApplicationSubmitted={(referenceId) => {
          setPendingApplicationData(null)
          navigateTo(`/financing/submitted/${encodeURIComponent(referenceId)}`)
        }}
        onSignOut={currentUser ? handleSignOut : null}
      />,
    )
  }

  if (currentPath.startsWith('/financing')) {
    const financingProductMatch = currentPath.match(/^\/financing\/(.+)$/)
    const financingProductId = financingProductMatch ? decodeURIComponent(financingProductMatch[1]) : null

    return withSecurityModal(
      <FinancingPage
        currentUser={currentUser}
        onNavigateBack={() => navigateTo('/customer')}
        onSignOut={currentUser ? handleSignOut : null}
        productId={financingProductId}
        onNavigateToService={() => navigateTo('/customer/service')}
        onNavigateToMessages={() => navigateTo('/customer/messages')}
        onNavigateToProfile={() => navigateTo('/customer/profile')}
        onNavigateToServiceBookings={() => navigateTo('/customer/service-bookings')}
        onNavigateToConfirmApplication={(applicationData) => {
          setPendingApplicationData(applicationData)
          navigateTo('/financing/confirm')
        }}
        onApplicationSubmitted={(referenceId) =>
          navigateTo(`/financing/submitted/${encodeURIComponent(referenceId)}`)
        }
      />, 
    )
  }

  if (currentPath === '/customer' && currentUser && accessProfile.role === 'customer') {
    const handleNavigateToProduct = (productId) => {
      setCurrentPath(`/customer/product/${productId}`)
    }
    return (
      <>
        {showEmailVerifiedModal && (
          <EmailVerifiedModal onClose={() => setShowEmailVerifiedModal(false)} />
        )}
        {withSecurityModal(
          <CustomerShowroomPage
            currentUser={currentUser}
            onNavigateHome={() => goToHomeSection('home', 'Home')}
            onSignOut={handleSignOut}
            onNavigateToProduct={handleNavigateToProduct}
            onNavigateToService={() => navigateTo('/customer/service')}
            onNavigateToFinancing={() => navigateTo('/financing')}
            onNavigateToFinancingStatus={() => navigateTo('/financing/status')}
            onNavigateToMessages={() => navigateTo('/customer/messages')}
            onNavigateToProfile={() => navigateTo('/customer/profile')}
            onNavigateToServiceBookings={() => navigateTo('/customer/service-bookings')}
            onNavigateBack={() => goToHomeSection('home', 'Home')}
          />, 
        )}
      </>
    )
  }

  // Customer Service Page Route
  if (currentPath === '/customer/service' && currentUser && accessProfile.role === 'customer') {
    return withSecurityModal(
      <CustomerServicePage
        currentUser={currentUser}
        onNavigateHome={() => goToHomeSection('home', 'Home')}
        onSignOut={handleSignOut}
        onNavigateToShowroom={() => navigateTo('/customer')}
        onNavigateToService={() => navigateTo('/customer/service')}
        onNavigateToFinancing={() => navigateTo('/financing')}
        onNavigateToFinancingStatus={() => navigateTo('/financing/status')}
        onNavigateToMessages={() => navigateTo('/customer/messages')}
        onNavigateToProfile={() => navigateTo('/customer/profile')}
        onNavigateToServiceBookings={() => navigateTo('/customer/service-bookings')}
        onNavigateBack={() => navigateTo('/customer')}
      />, 
    )
  }

  // Customer Messages Page Route
  if (currentPath === '/customer/messages' && currentUser && accessProfile.role === 'customer') {
    return withSecurityModal(
      <CustomerMessagesPage
        currentUser={currentUser}
        isDarkMode={true}
        onNavigateToShowroom={() => navigateTo('/customer')}
        onNavigateToService={() => navigateTo('/customer/service')}
        onNavigateToFinancing={() => navigateTo('/financing')}
        onNavigateToFinancingStatus={() => navigateTo('/financing/status')}
        onNavigateToMessages={() => navigateTo('/customer/messages')}
        onNavigateToProfile={() => navigateTo('/customer/profile')}
        onNavigateToServiceBookings={() => navigateTo('/customer/service-bookings')}
        onSignOut={handleSignOut}
      />, 
    )
  }

  // Customer Service Bookings Page Route
  if (currentPath === '/customer/service-bookings' && currentUser && accessProfile.role === 'customer') {
    return withSecurityModal(
      <CustomerServiceBookingsPage
        currentUser={currentUser}
        isDarkMode={true}
        onNavigateToShowroom={() => navigateTo('/customer')}
        onNavigateToService={() => navigateTo('/customer/service')}
        onNavigateToFinancing={() => navigateTo('/financing')}
        onNavigateToFinancingStatus={() => navigateTo('/financing/status')}
        onNavigateToMessages={() => navigateTo('/customer/messages')}
        onNavigateToProfile={() => navigateTo('/customer/profile')}
        onNavigateToServiceBookings={() => navigateTo('/customer/service-bookings')}
        onSignOut={handleSignOut}
      />, 
    )
  }


  // Product Details Page Route
  const productDetailMatch = currentPath.match(/^\/customer\/product\/(.+)$/)
  if (productDetailMatch && currentUser && accessProfile.role === 'customer') {
    const productId = productDetailMatch[1]
    const handleNavigateBack = () => {
      setCurrentPath('/customer')
    }
    return withSecurityModal(
      <ProductDetailsPage
        productId={productId}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onNavigateBack={handleNavigateBack}
        onNavigateToFinancing={(pId) => navigateTo(`/financing/${encodeURIComponent(pId)}`)}
      />,
    )
  }

  // Customer Profile Page Route
  if (currentPath === '/customer/profile' && currentUser && accessProfile.role === 'customer') {
    return withSecurityModal(
      <CustomerProfilePage
        currentUser={currentUser}
        onNavigateBack={() => navigateTo('/customer')}
        onNavigateToShowroom={() => navigateTo('/customer')}
        onNavigateToService={() => navigateTo('/customer/service')}
        onNavigateToFinancing={() => navigateTo('/financing')}
        onNavigateToFinancingStatus={() => navigateTo('/financing/status')}
        onNavigateToMessages={() => navigateTo('/customer/messages')}
        onNavigateToProfile={() => navigateTo('/customer/profile')}
        onNavigateToServiceBookings={() => navigateTo('/customer/service-bookings')}
        onSignOut={handleSignOut}
      />, 
    )
  }

  if (shouldShowAccessLoader) {
    return (
      <GlobalLoadingScreen
        role={requiredDashboardRole ? roleLabels[requiredDashboardRole] : 'Dashboard'}
        delay={300}
      />
    )
  }

  if (dashboardRequirements[currentDashboardBasePath] && currentUser && canViewCurrentDashboard && !isAccessResolving) {
    const financingDetailMatch = currentPath.match(/^\/(superadmin|admin)\/financing-applications\/(.+)$/)
    const financingListMatch = currentPath.match(/^\/(superadmin|admin)\/financing-applications$/)
    const approvedApplicationsMatch = currentPath.match(/^\/(superadmin|admin)\/approved-applications$/)

    let initialSection = 'dashboard'
    if (financingDetailMatch || financingListMatch) {
      initialSection = 'financing-applications'
    } else if (approvedApplicationsMatch) {
      initialSection = 'approved-applications'
    }

    return withSecurityModal(
      <SuperAdminPage
        onNavigateHome={() => goToHomeSection('home', 'Home')}
        onSignOut={handleSignOut}
        currentUser={currentUser}
        accessProfile={accessProfile}
        dashboardPath={currentDashboardBasePath}
        currentPath={currentPath}
        initialSection={initialSection}
        initialFinancingApplicationId={financingDetailMatch?.[2] ? decodeURIComponent(financingDetailMatch[2]) : ''}
        onNavigateDashboardPath={(nextPath) => navigateTo(nextPath)}
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
      onSelectSlide={setActiveSlide}
      onOpenAuthSection={openAuthSection}
      onNavigateShowroom={() => navigateTo('/showroom')}
      onNavigateSpareParts={() => navigateTo('/spare-parts')}
      onNavigateLogin={() => navigateTo('/login')}
      onNavigateSection={goToHomeSection}
      onSignOut={handleSignOut}
    />,
  )
}

function AppWithToast() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <App />
        <ToastNotification />
      </ToastProvider>
    </ThemeProvider>
  )
}

export default AppWithToast
