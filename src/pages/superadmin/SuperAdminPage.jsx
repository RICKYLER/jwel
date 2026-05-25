import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { updateProfile as updateAuthProfile } from 'firebase/auth'
import { collection, doc, limit, onSnapshot, query, serverTimestamp, setDoc, getDocs, where, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded'
import BuildRoundedIcon from '@mui/icons-material/BuildRounded'
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import EngineeringRoundedIcon from '@mui/icons-material/EngineeringRounded'
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import TwoWheelerRoundedIcon from '@mui/icons-material/TwoWheelerRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { db, functions, storage } from '../../firebase'
import { useTheme } from '../../context/ThemeContext'
import useToast from '../../context/useToast'
import ConfirmationModal from './components/ConfirmationModal'
import EditUserModal from './components/EditUserModal'
import NewUserModal from './components/NewUserModal'
import NotificationsDrawer from './components/NotificationsDrawer'
import ProfileSection from './components/ProfileSection'
import SuperAdminHeader from './components/SuperAdminHeader'
import SuperAdminSidebar from './components/SuperAdminSidebar/SuperAdminSidebar'
import AnalyticsSection from './sections/AnalyticsSection'
import ChatsManagementSection from './sections/ChatsManagementSection'
import DashboardSection from './sections/DashboardSection'
import InventorySection from './sections/InventorySection'
import InventoryReportsSection from './sections/InventoryReportsSection'
import InventoryDeleteArchivedSection from './sections/InventoryDeleteArchivedSection'
import MasterDataManagementSection from './sections/MasterDataManagementSection'
import ServiceRequestsSection from './sections/ServiceRequestsSection'
import FinancingApplicationsSection from './sections/FinancingApplicationsSection'
import FinancingApplicationDetailSection from './sections/FinancingApplicationDetailSection'
import ApprovedApplicationsSection from './sections/ApprovedApplicationsSection'
import TechniciansSection from './sections/TechniciansSection'
import UserManagementSection from './sections/UserManagementSection'
import ServiceTypeSection from './sections/ServiceTypeSection'
import { saveAccessAssignment } from '../../services/userService';
import {
  buildChartBars,
  fallbackTechnicians,
  financingStatusOptions,
  formatCurrency,
  formatDate,
  getStatusClasses,
  inventoryStatusOptions,
  normalizeText,
  roleOptions,
  serviceStatusOptions,
  technicianStatusOptions,
} from './sections/superadminUtils'
import './SuperAdminPage.css'

const baseSidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardRoundedIcon },
  { id: 'user-management', label: 'User Management', icon: ManageAccountsRoundedIcon },
  { 
    id: 'inventory-management', 
    label: 'Inventory Management', 
    icon: TwoWheelerRoundedIcon,
    subitems: [
      { id: 'inventory', label: 'Inventory Items' },
      { id: 'inventory-reports', label: 'Inventory Reports' },
      { id: 'inventory-delete-archived', label: 'Inventory Delete Archived' },
    ]
  },
  {
    id: 'unit-management',
    label: 'Unit Management',
    icon: TwoWheelerRoundedIcon,
    subitems: [
      { id: 'master-categories', label: 'Categories' },
      { id: 'master-models', label: 'Models' },
      { id: 'master-variants', label: 'Variants' },
    ]
  },
  { id: 'chats-management', label: 'Chats Management', icon: ChatBubbleRoundedIcon },
  { 
    id: 'service-management', 
    label: 'Service Management', 
    icon: TuneRoundedIcon,
    subitems: [
      { id: 'service-type', label: 'Service Type' },
      { id: 'service-logs', label: 'Service Logs' },
    ]
  },
  { id: 'financing-applications', label: 'Financing Applications', icon: AnalyticsRoundedIcon },
  { id: 'approved-applications', label: 'Approved Applications', icon: TrendingUpRoundedIcon },
  { id: 'analytics', label: 'Analytics', icon: AnalyticsRoundedIcon },
  { id: 'profile', label: 'Profile', icon: PersonRoundedIcon },
]

const DEFAULT_OPERATOR_PASSWORD = 'Password123'

const defaultInviteForm = {
  fullName: '',
  email: '',
  role: 'admin',
  status: 'active',
  temporaryPassword: DEFAULT_OPERATOR_PASSWORD,
  menuAccess: ['dashboard', 'user-management', 'inventory', 'services', 'bookings', 'messages', 'reports', 'settings'],
}

const defaultEditUserForm = {
  fullName: '',
  email: '',
  role: 'admin',
  status: 'active',
  accessibleSections: [],
}

export default function SuperAdminPage({ onNavigateHome, onSignOut, currentUser, accessProfile, dashboardPath = '/superadmin', currentPath = '/superadmin', initialSection = 'dashboard', initialFinancingApplicationId = '', onNavigateDashboardPath }) {

  const [activeSection, setActiveSection] = useState(initialFinancingApplicationId ? 'financing-application-detail' : initialSection)
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [serviceRequests, setServiceRequests] = useState([])
  const [financingApplications, setFinancingApplications] = useState([])
  const [selectedFinancingApplication, setSelectedFinancingApplication] = useState(null)
  const [inventory, setInventory] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [authorizedAdmins, setAuthorizedAdmins] = useState([])
  const [authorizedPersonnel, setAuthorizedPersonnel] = useState([])
  const [archivedUsers, setArchivedUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [models, setModels] = useState([])
  const [variants, setVariants] = useState([])
  const [inventoryLogs, setInventoryLogs] = useState([])
  const [deletedItems, setDeletedItems] = useState([])
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0)
  const audioContextRef = useRef(null)
  const hasHydratedUnreadRef = useRef(false)
  const unreadConversationCountsRef = useRef({})
  const unreadListenersRef = useRef(new Map())

  const [, setLoadingState] = useState({
    users: true,
    serviceRequests: true,
    financingApplications: true,
    inventory: true,
    technicians: true,
    authorizedAdmins: true,
    authorizedPersonnel: true,
    archivedUsers: true,
    categories: true,
    models: true,
    variants: true,
    inventoryLogs: true,
    conversations: true,
  })
  const [actionMessage, setActionMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteForm, setInviteForm] = useState(defaultInviteForm)
  const [editUserForm, setEditUserForm] = useState(defaultEditUserForm)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 1024,
  )
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notificationConfirmation, setNotificationConfirmation] = useState(null)
  const [resetPasswordConfirmation, setResetPasswordConfirmation] = useState(null)
  const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false)
  const [logoutConfirmation, setLogoutConfirmation] = useState(false)
  const [chatNotifications, setChatNotifications] = useState(() => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const storedNotifications = window.localStorage.getItem('bykelink-chat-notifications')
      return storedNotifications ? JSON.parse(storedNotifications) : []
    } catch {
      return []
    }
  })
  const [chatFocusRequest, setChatFocusRequest] = useState(null)
  const { isDarkMode, toggleTheme } = useTheme()
  const { success: toastSuccess, error: toastError } = useToast()
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    title: '',
    phone: '',
    location: '',
    latitude: '',
    longitude: '',
    bio: '',
  })
  const [savedProfileSnapshot, setSavedProfileSnapshot] = useState(null)
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false)
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false)
  const [pendingSection, setPendingSection] = useState(null)

  const sectionTitle = useMemo(() => {
    if (activeSection === 'financing-application-detail') return 'Financing Application Detail'
    return baseSidebarItems.find((item) => item.id === activeSection)?.label ?? 'Dashboard'
  }, [activeSection])

  const adminName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Administrator'
  const adminEmail = currentUser?.email || 'No email'
  const consoleLabel = accessProfile?.label || 'Superadmin'
  const currentAccessRole = accessProfile?.role || 'guest'
  const canManageAccess = ['admin', 'superadmin'].includes(currentAccessRole)
  const canEditOperations = ['admin', 'superadmin'].includes(currentAccessRole)
  const personnelInviteRoles = useMemo(
    () => [
      'mechanics personnel',
      'staff',
    ],
    []
  )
  const assignableInviteRoles =
    currentAccessRole === 'superadmin' ? ['admin', ...personnelInviteRoles] : personnelInviteRoles
  const assignableRoleOptions =
    currentAccessRole === 'superadmin'
      ? roleOptions.filter((role) => role !== 'superadmin')
      : roleOptions.filter((role) => !['admin', 'superadmin'].includes(role))


      
 useEffect(() => {
  if (!currentUser?.uid) return

  const unsub = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
    if (snap.exists()) {
      setUserProfile(snap.data())
    }
  })

  return () => unsub()
}, [currentUser?.uid])

  // Load profile data from Firestore
  useEffect(() => {
    if (!currentUser?.uid) return

    const loadProfile = async () => {
      try {
        const normalizedRole = normalizeText(accessProfile?.role || 'superadmin')
        const privilegedCollectionName =
          normalizedRole === 'superadmin'
            ? 'authorizedSuperadmin'
            : normalizedRole === 'admin'
              ? 'authorizedAdmin'
              : personnelInviteRoles.includes(normalizedRole) || normalizedRole === 'staff'
                ? 'authorizedPersonnel'
                : null
        const profileDocRef =
          privilegedCollectionName && currentUser.email
            ? doc(db, privilegedCollectionName, String(currentUser.email || '').trim().toLowerCase())
            : doc(db, 'users', currentUser.uid)

        // Use real-time listener to keep profile in sync and capture saved snapshot
        const unsubscribe = onSnapshot(profileDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data()
            setProfileForm((current) => {
              const updated = {
                ...current,
                fullName: data.fullName || current.fullName,
                title: data.title || current.title,
                phone: data.phone || current.phone,
                location: data.location || current.location,
                bio: data.bio || current.bio,
                latitude: data.latitude || current.latitude,
                longitude: data.longitude || current.longitude,
                avatarUrl: data.avatarUrl || current.avatarUrl,
              }
              // Update saved snapshot with the same values to prevent false unsaved-change detection
              setSavedProfileSnapshot({
                fullName: updated.fullName || '',
                title: updated.title || '',
                phone: updated.phone || '',
                location: updated.location || '',
                bio: updated.bio || '',
                latitude: updated.latitude || '',
                longitude: updated.longitude || '',
                avatarUrl: updated.avatarUrl || '',
              })
              return updated
            })
          }
        })

        return unsubscribe
      } catch (error) {
        console.error('Failed to load profile:', error)
      }
    }

    let unsubscribe
    loadProfile().then((unsub) => {
      unsubscribe = unsub
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [currentUser?.uid, currentUser?.email, accessProfile?.role, personnelInviteRoles])

  // Load flagship location from settings
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'flagshipLocation')
    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setProfileForm((current) => {
          const updated = {
            ...current,
            latitude: data.latitude || current.latitude,
            longitude: data.longitude || current.longitude,
            location: data.location || current.location,
          }
          // Update saved snapshot to match
          setSavedProfileSnapshot((current) => ({
            ...current,
            latitude: updated.latitude || '',
            longitude: updated.longitude || '',
            location: updated.location || '',
          }))
          return updated
        })
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (initialFinancingApplicationId) {
      setActiveSection('financing-application-detail')
      return
    }

    setActiveSection(initialSection)
  }, [initialFinancingApplicationId, initialSection])

  useEffect(() => {
    if (!initialFinancingApplicationId) {
      if (!currentPath.includes('/financing-applications/')) {
        setSelectedFinancingApplication(null)
      }
      return
    }

    const matchedApplication = financingApplications.find((item) => item.id === initialFinancingApplicationId)

    if (matchedApplication) {
      setSelectedFinancingApplication(matchedApplication)
      setActiveSection('financing-application-detail')
    }
  }, [currentPath, financingApplications, initialFinancingApplicationId])

  useEffect(() => {
    if (!actionMessage) {
      return undefined
    }

    const timerId = window.setTimeout(() => setActionMessage(null), 5000)

    return () => window.clearTimeout(timerId)
  }, [actionMessage])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      'bykelink-chat-notifications',
      JSON.stringify(chatNotifications.slice(0, 50)),
    )
  }, [chatNotifications])

  useEffect(() => {
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
    const now = Date.now()

    setChatNotifications((current) => {
      const filtered = current.filter((notification) => {
        const createdAt = notification.createdAt instanceof Date
          ? notification.createdAt.getTime()
          : new Date(notification.createdAt).getTime()
        return now - createdAt < ONE_WEEK_MS
      })
      return filtered.length < current.length ? filtered : current
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const subscribeToCollection = ({
      collectionName,
      stateKey,
      setter,
      shouldSubscribe = true,
    }) => {
      if (!shouldSubscribe) {
        setLoadingState((current) => ({ ...current, [stateKey]: false }))
        setter([])
        return () => {}
      }

      return onSnapshot(
        query(collection(db, collectionName), orderBy('updatedAt', 'desc'), limit(200)),
        (snapshot) => {
          setter(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
          setLoadingState((current) => ({ ...current, [stateKey]: false }))
        },
        (error) => {
          console.error(`Unable to load ${collectionName}`, error)
          setLoadingState((current) => ({ ...current, [stateKey]: false }))
          setActionMessage({
            type: 'error',
            text: `Unable to load ${collectionName} from Firebase. Check Firestore rules for ${consoleLabel.toLowerCase()} access.`,
          })
        },
      )
    }

    const unsubscribers = [
      subscribeToCollection({
        collectionName: 'serviceBookings',
        stateKey: 'serviceRequests',
        setter: setServiceRequests,
      }),
      subscribeToCollection({
        collectionName: 'financingApplications',
        stateKey: 'financingApplications',
        setter: setFinancingApplications,
      }),
      subscribeToCollection({
        collectionName: 'inventory',
        stateKey: 'inventory',
        setter: setInventory,
      }),
     

currentAccessRole === 'staff personnel' && currentUser?.email
  ? onSnapshot(
      doc(db, 'authorizedPersonnel', currentUser.email.toLowerCase()),
      (snap) => {
        if (snap.exists()) {
          setTechnicians([{ id: snap.id, ...snap.data() }])
        } else {
          setTechnicians([])
        }

        setLoadingState((current) => ({
          ...current,
          technicians: false,
        }))
      },
      (error) => {
        console.error('Unable to load authorizedPersonnel (self)', error)
        setTechnicians([]) 
      }
    )
  : subscribeToCollection({
      collectionName: 'authorizedPersonnel',
      stateKey: 'technicians',
      setter: setTechnicians,
    }),


      subscribeToCollection({
        collectionName: 'users',
        stateKey: 'users',
        setter: setUsers,
        shouldSubscribe: canEditOperations,
      }),
      subscribeToCollection({
        collectionName: 'authorizedAdmin',
        stateKey: 'authorizedAdmins',
        setter: setAuthorizedAdmins,
        shouldSubscribe: canEditOperations,
      }),
      subscribeToCollection({
        collectionName: 'authorizedPersonnel',
        stateKey: 'authorizedPersonnel',
        setter: setAuthorizedPersonnel,
        shouldSubscribe: canEditOperations,
      }),
      subscribeToCollection({
        collectionName: 'deleteArchived',
        stateKey: 'archivedUsers',
        setter: setArchivedUsers,
        shouldSubscribe: canEditOperations,
      }),
      subscribeToCollection({
        collectionName: 'inventoryLogs',
        stateKey: 'inventoryLogs',
        setter: setInventoryLogs,
        shouldSubscribe: canEditOperations,
      }),
      subscribeToCollection({
        collectionName: 'deleteArchived',
        stateKey: 'deletedItems',
        setter: setDeletedItems,
        shouldSubscribe: canEditOperations,
      }),
    ]

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.())
    }
  
}, [
  canEditOperations,
  consoleLabel,
  currentAccessRole, 
  currentUser?.email 
])


  // Load unread user messages in real time across all chat conversations
  const recountUnreadMessages = useCallback(() => {
    const totalUnread = Object.values(unreadConversationCountsRef.current).reduce(
      (sum, count) => sum + (Number.isFinite(count) ? count : 0),
      0,
    )
    setUnreadChatCount(totalUnread)
  }, [])

  useEffect(() => {
    if (!canEditOperations || !currentUser?.uid) {
      unreadListenersRef.current.forEach((unsubscribe) => unsubscribe())
      unreadListenersRef.current.clear()
      unreadConversationCountsRef.current = {}
      setUnreadChatCount(0)
      setLoadingState((current) => ({ ...current, conversations: false }))
      return undefined
    }

    const conversationsRef = collection(db, 'conversations')
    const conversationsQuery = query(conversationsRef, limit(100))
    const unreadListeners = unreadListenersRef.current

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const activeConversationIds = new Set(snapshot.docs.map((conversationDoc) => conversationDoc.id))

        unreadListeners.forEach((stopListening, conversationId) => {
          if (!activeConversationIds.has(conversationId)) {
            stopListening()
            unreadListeners.delete(conversationId)
            delete unreadConversationCountsRef.current[conversationId]
          }
        })

        snapshot.docs.forEach((conversationDoc) => {
          const conversationId = conversationDoc.id
          const conversationData = conversationDoc.data()

          if (unreadListeners.has(conversationId)) {
            return
          }

          const unreadMessagesQuery = query(
            collection(db, `conversations/${conversationId}/messages`),
            where('read', '==', false),
            where('type', '==', 'user'),
          )

          const stopUnreadListener = onSnapshot(
            unreadMessagesQuery,
            (unreadSnapshot) => {
              unreadConversationCountsRef.current[conversationId] = unreadSnapshot.size

              unreadSnapshot.docChanges().forEach((change) => {
                if (change.type !== 'added') {
                  return
                }

                const messageData = change.doc.data()
                const createdAt = messageData.timestamp?.toDate?.() || new Date()
                const notificationId = `${conversationId}-${change.doc.id}`

                setChatNotifications((current) => {
                  const existingIndex = current.findIndex((item) => item.id === notificationId)
                  const nextNotification = {
                    id: notificationId,
                    type: 'CHAT',
                    title: `${conversationData.userName || 'Guest User'} sent a message`,
                    description: messageData.text || 'New customer message received.',
                    conversationId,
                    messageId: change.doc.id,
                    read: false,
                    createdAt: createdAt.toISOString(),
                  }

                  if (existingIndex >= 0) {
                    const updated = [...current]
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      ...nextNotification,
                    }
                    return updated
                  }

                  return [nextNotification, ...current].slice(0, 50)
                })
              })

              recountUnreadMessages()
              setLoadingState((current) => ({ ...current, conversations: false }))
            },
            (error) => {
              console.error(`Error loading unread messages for conversation ${conversationId}:`, error)
              unreadConversationCountsRef.current[conversationId] = 0
              recountUnreadMessages()
              setLoadingState((current) => ({ ...current, conversations: false }))
            },
          )

          unreadListeners.set(conversationId, stopUnreadListener)
        })

        recountUnreadMessages()
        setLoadingState((current) => ({ ...current, conversations: false }))
      },
      (error) => {
        console.error('Error loading chat notification conversations:', error)
        setLoadingState((current) => ({ ...current, conversations: false }))
      },
    )

    return () => {
      unsubscribe()
      unreadListeners.forEach((stopListening) => stopListening())
      unreadListeners.clear()
      unreadConversationCountsRef.current = {}
    }
  }, [canEditOperations, currentUser?.uid, recountUnreadMessages])

  // Load master data collections
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const categoriesSnap = await getDocs(collection(db, 'masterData', 'inventory', 'categories'))
        setCategories(categoriesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setLoadingState((current) => ({ ...current, categories: false }))

        const modelsSnap = await getDocs(collection(db, 'masterData', 'inventory', 'models'))
        setModels(modelsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setLoadingState((current) => ({ ...current, models: false }))

        const variantsSnap = await getDocs(collection(db, 'masterData', 'inventory', 'variants'))
        setVariants(variantsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setLoadingState((current) => ({ ...current, variants: false }))
      } catch (error) {
        console.warn('Master data collections not yet created', error)
        setLoadingState((current) => ({ ...current, categories: false, models: false, variants: false }))
      }
    }
    loadMasterData()
  }, [])

  const ensureNotificationAudioReady = useCallback(async () => {
    if (typeof window === 'undefined') {
      return
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      return
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass()
    }

    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume()
      } catch (error) {
        console.warn('Could not resume notification audio:', error)
      }
    }
  }, [])

  // Unlock notification audio after the first user interaction
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const unlockAudio = () => {
      ensureNotificationAudioReady()
    }

    window.addEventListener('pointerdown', unlockAudio, { once: true })
    window.addEventListener('keydown', unlockAudio, { once: true })

    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [ensureNotificationAudioReady])

  // Play notification sound when new unread messages arrive
  const playNotificationSound = useCallback(async () => {
    try {
      await ensureNotificationAudioReady()

      const audioContext = audioContextRef.current
      if (!audioContext) {
        return
      }

      const now = audioContext.currentTime
      const oscillator = audioContext.createOscillator()
      const envelope = audioContext.createGain()

      oscillator.connect(envelope)
      envelope.connect(audioContext.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, now)
      envelope.gain.setValueAtTime(0.0001, now)
      envelope.gain.exponentialRampToValueAtTime(0.25, now + 0.02)
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)

      oscillator.start(now)
      oscillator.stop(now + 0.28)
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }, [ensureNotificationAudioReady])

  useEffect(() => {
    if (!hasHydratedUnreadRef.current) {
      hasHydratedUnreadRef.current = true
      setPreviousUnreadCount(unreadChatCount)
      return
    }

    if (unreadChatCount > previousUnreadCount) {
      playNotificationSound()

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('New Chat Message', {
          body: `You have ${unreadChatCount} unread message${unreadChatCount !== 1 ? 's' : ''} from customers.`,
          tag: 'bykelink-chat-notification',
          renotify: true,
        })
      }
    }

    setPreviousUnreadCount(unreadChatCount)
  }, [playNotificationSound, unreadChatCount, previousUnreadCount])

  const handleToggleNotifications = useCallback(async () => {
    await ensureNotificationAudioReady()

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch (error) {
        console.warn('Could not request notification permission:', error)
      }
    }

    setIsNotificationsOpen((current) => !current)
  }, [ensureNotificationAudioReady])

  const visibleTechnicians = technicians.length ? technicians : fallbackTechnicians
  const normalizedSearchTerm = normalizeText(searchTerm)

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const haystack = [user.fullName, user.displayName, user.email, user.role].join(' ')
      return haystack.toLowerCase().includes(normalizedSearchTerm)
    })
  }, [normalizedSearchTerm, users])


  const filteredServiceRequests = useMemo(() => {
    return serviceRequests.filter((request) => {
      const haystack = [request.customer, request.customerName, request.model, request.service, request.status].join(' ')
      return haystack.toLowerCase().includes(normalizedSearchTerm)
    })
  }, [normalizedSearchTerm, serviceRequests])

  // Mechanics with activeJobs count
  const mechanicsWithActiveJobs = useMemo(() => {
    return technicians.map((tech) => {
      const isMechanic = (tech.role || tech.personnelRole || '').toLowerCase().includes('mechanic');
      if (!isMechanic) return tech;
      const activeJobs = serviceRequests.filter(
        (req) =>
          req.status && req.status.toLowerCase() === 'in progress' &&
          req.assignedTechnician &&
          (req.assignedTechnician === tech.email || req.assignedTechnician === tech.id)
      ).length;
      return { ...tech, activeJobs };
    });
  }, [technicians, serviceRequests]);

  const filteredFinancingApplications = useMemo(() => {
    return financingApplications.filter((application) => {
      const haystack = [
        application.referenceId,
        application.status,
        application.applicant?.fullName,
        application.submittedBy?.email,
        application.motorcycle?.name,
      ].join(' ')

      return haystack.toLowerCase().includes(normalizedSearchTerm)
    })
  }, [financingApplications, normalizedSearchTerm])

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const haystack = [item.name, item.category, item.status].join(' ')
      return haystack.toLowerCase().includes(normalizedSearchTerm)
    })
  }, [inventory, normalizedSearchTerm])

  const filteredTechnicians = useMemo(() => {
    return visibleTechnicians.filter((item) => {
      const haystack = [item.name, item.specialty, item.status].join(' ')
      return haystack.toLowerCase().includes(normalizedSearchTerm)
    })
  }, [normalizedSearchTerm, visibleTechnicians])

  const filteredAuthorizedAccess = useMemo(() => {
    return [...authorizedAdmins, ...authorizedPersonnel].filter((item) => {
      const haystack = [item.email, item.role, item.personnelRole, item.dashboardPath, item.status].join(' ')
      return haystack.toLowerCase().includes(normalizedSearchTerm)
    })
  }, [authorizedAdmins, authorizedPersonnel, normalizedSearchTerm])

  const myUserRecord = useMemo(() => {
    return users.find((item) => item.id === currentUser?.uid) || {}
  }, [currentUser?.uid, users])

  useEffect(() => {
    setProfileForm({
      fullName: myUserRecord.fullName || currentUser?.displayName || '',
      title: myUserRecord.title || `${consoleLabel} Lead`,
      phone: myUserRecord.phone || '',
      location: myUserRecord.location || 'Bykelink HQ',
      bio:
        myUserRecord.bio ||
        'Focused on real-time operations, service visibility, and secure access control across the Bykelink ecosystem.',
    })
  }, [consoleLabel, currentUser?.displayName, myUserRecord.bio, myUserRecord.fullName, myUserRecord.location, myUserRecord.phone, myUserRecord.title])

  // Load admin contact requests from Firestore
  useEffect(() => {
    const loadAdminRequests = async () => {
      try {
        const requestsSnapshot = await getDocs(
          query(
            collection(db, 'adminPasswordResetRequests'),
            where('status', '==', 'pending'),
            limit(50)
          )
        )

        const requests = requestsSnapshot.docs.map((doc) => ({
          id: `admin-request-${doc.id}`,
          type: 'PASSWORD_RESET_REQUEST',
          title: 'Password Reset Request',
          description: `Admin contact from ${doc.data().fullName || doc.id}`,
          read: doc.data().read || false,
          createdAt: doc.data().requestedAt?.toISOString?.() || new Date().toISOString(),
          email: doc.id,
        }))

        if (requests.length > 0) {
          // Only add if not already in notifications
          setChatNotifications((current) => {
            const existingIds = new Set(current.map((n) => n.id))
            const newRequests = requests.filter((r) => !existingIds.has(r.id))
            
            if (newRequests.length > 0) {
              const updatedNotifications = [...newRequests, ...current]
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('bykelink-chat-notifications', JSON.stringify(updatedNotifications))
              }
              return updatedNotifications
            }
            return current
          })
        }
      } catch (error) {
        console.error('[SuperAdmin] Error loading admin requests:', error)
      }
    }

    loadAdminRequests()
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'adminPasswordResetRequests'),
        where('status', '==', 'pending')
      ),
      (snapshot) => {
        const requests = snapshot.docs.map((doc) => ({
          id: `admin-request-${doc.id}`,
          type: 'PASSWORD_RESET_REQUEST',
          title: 'Password Reset Request',
          description: `Admin contact from ${doc.data().fullName || doc.id}`,
          read: doc.data().read || false,
          createdAt: doc.data().requestedAt?.toISOString?.() || new Date().toISOString(),
          email: doc.id,
        }))

        setChatNotifications((current) => {
          const otherNotifications = current.filter((n) => !n.id.startsWith('admin-request-'))
          const updatedNotifications = [...requests, ...otherNotifications]
          
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('bykelink-chat-notifications', JSON.stringify(updatedNotifications))
          }
          return updatedNotifications
        })
      },
      (error) => {
        console.error('[SuperAdmin] Error listening to admin requests:', error)
      }
    )

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  const activeServices = filteredServiceRequests.filter(
    (item) => !['completed', 'cancelled'].includes(normalizeText(item.status)),
  ).length
  const completedServices = filteredServiceRequests.filter(
    (item) => normalizeText(item.status) === 'completed',
  ).length
  const estimatedRevenue = filteredServiceRequests.reduce((total, item) => {
    const nextValue = Number(item.cost ?? item.price ?? item.amount ?? 0)
    return total + (Number.isFinite(nextValue) ? nextValue : 0)
  }, 0)
  const averageServiceHours = filteredServiceRequests.length
    ? (
        filteredServiceRequests.reduce((total, item) => {
          const nextValue = Number(item.estimatedHours ?? item.hours ?? 4)
          return total + (Number.isFinite(nextValue) ? nextValue : 4)
        }, 0) / filteredServiceRequests.length
      ).toFixed(1)
    : '0.0'
  const onlineTechnicians = filteredTechnicians.filter((item) => normalizeText(item.status) === 'online').length
  const techAvailability = filteredTechnicians.length
    ? Math.round((onlineTechnicians / filteredTechnicians.length) * 100)
    : 0
  const chartBars = useMemo(() => buildChartBars(filteredServiceRequests), [filteredServiceRequests])

  const notificationItems = useMemo(() => {
    return [...chatNotifications]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .map((item) => ({
        ...item,
        time: item.time || formatDate(new Date(item.createdAt || Date.now())),
      }))
  }, [chatNotifications])

  


const sidebarItems = useMemo(() => {
  const defaultSectionsByRole = {
    'staff personnel': ['dashboard', 'inventory-management', 'service-management', 'profile', 'chats-management', 'financing-applications',
      'service-requests','financing-application-detail','approved-applications',
    ],
    'mechanics personnel': ['dashboard', 'service-management', 'chats-management', 'profile'],
  }
  
  let allowedSections =
    accessProfile?.role === 'superadmin' ||
    accessProfile?.role === 'admin'
      ? null
      : (accessProfile?.accessibleSections || [])

  // If privileged user has empty sections, provide defaults based on role
  const firestoreSections = allowedSections && Array.isArray(allowedSections) ? allowedSections : []
  const hasEmptySections = firestoreSections.length === 0
  
  if (
    hasEmptySections &&
    accessProfile?.isPrivileged &&
    accessProfile?.authorized &&
    defaultSectionsByRole[accessProfile?.role]
  ) {
    allowedSections = defaultSectionsByRole[accessProfile?.role]
  }

  return baseSidebarItems
    .filter((item) => {
      if (item.id === 'dashboard' || item.id === 'profile') return true
      if (!allowedSections) return true

      return allowedSections.includes(item.id)
    })
    .map((item) => {
      if (item.id === 'chats-management') {
        return {
          ...item,
          badge: unreadChatCount > 0 ? unreadChatCount : null,
        }
      }

      return {
        ...item,
        subitems:
          item.subitems && allowedSections
            ? allowedSections.includes(item.id)
              ? item.subitems
              : []
            : item.subitems,
            
      }
    })
}, [unreadChatCount, accessProfile?.accessibleSections, accessProfile?.role, accessProfile?.isPrivileged, accessProfile?.authorized])




  const metricCards = useMemo(
    () => [
      {
        title: 'Active Services',
        value: String(activeServices),
        detail: `${filteredServiceRequests.length} total requests synced`,
        tone: 'emerald',
      },
      {
        title: 'Total Revenue (MTD)',
        value: formatCurrency(estimatedRevenue),
        detail: `${completedServices} completed jobs`,
        tone: 'emerald',
      },
      {
        title: 'Avg Service Time',
        value: `${averageServiceHours} hrs`,
        detail: `${filteredTechnicians.length} technicians active`,
        tone: 'red',
      },
      {
        title: 'Tech Availability',
        value: `${techAvailability}%`,
        progress: techAvailability,
      },
    ],
    [activeServices, averageServiceHours, completedServices, estimatedRevenue, filteredServiceRequests.length, filteredTechnicians.length, techAvailability],
  )

  const handleCollectionUpdate = async (collectionName, docId, payload) => {
    // If called without parameters, just trigger a re-subscription refresh
    if (!collectionName || !docId) {
      return
    }

    if (!canEditOperations) {
      setActionMessage({
        type: 'error',
        text: 'Your current role can view this data but cannot change it.',
      })
      return
    }

    try {
      await setDoc(
        doc(db, collectionName, docId),
        {
          ...payload,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      setActionMessage({
        type: 'success',
        text: `${collectionName} updated successfully in Firebase.`,
      })
    } catch (error) {
      console.error(`Unable to update ${collectionName}`, error)
      setActionMessage({
        type: 'error',
        text: `Unable to update ${collectionName}. ${error.message}`,
      })
    }
  }

  const handleOpenNewUserModal = () => {
    if (!canManageAccess) {
      setActionMessage({
        type: 'error',
        text: 'Only admin or superadmin can open the account registration form.',
      })
      return
    }

    setInviteForm({
      ...defaultInviteForm,
      role: assignableInviteRoles[0] || defaultInviteForm.role,
      temporaryPassword: DEFAULT_OPERATOR_PASSWORD,
    })
    setIsNewUserModalOpen(true)
  }

  const handleCloseNewUserModal = () => {
    setIsNewUserModalOpen(false)
    setInviteForm(defaultInviteForm)
  }

  const handleOpenEditUserModal = (user) => {
    if (!canManageAccess) {
      setActionMessage({
        type: 'error',
        text: 'Only admin or superadmin can edit user access records.',
      })
      return
    }

    const normalizedRole = normalizeText(user?.role)

    if (currentAccessRole === 'admin' && ['admin', 'superadmin'].includes(normalizedRole)) {
      setActionMessage({
        type: 'error',
        text: 'Admin can edit non-admin users only.',
      })
      return
    }

    setSelectedUser(user)
    setEditUserForm({
      fullName: user.fullName || user.displayName || '',
      email: user.email || '',
      role: user.role || assignableRoleOptions[0] || 'customer',
      status: user.status?.toLowerCase() === 'suspended' ? 'inactive' : 'active',
      accessibleSections: user.accessibleSections || [],
    })
    setIsEditUserModalOpen(true)
  }

  const handleCloseEditUserModal = () => {
    setSelectedUser(null)
    setEditUserForm(defaultEditUserForm)
    setIsEditUserModalOpen(false)
  }

  const saveProfileToFirebase = async () => {
    if (!currentUser?.uid) {
      throw new Error('No authenticated profile is available to update.')
    }

    const fullName = profileForm.fullName.trim() || currentUser.displayName || adminName
    const normalizedRole = normalizeText(accessProfile?.role || 'superadmin')
    const privilegedCollectionName =
      normalizedRole === 'superadmin'
        ? 'authorizedSuperadmin'
        : normalizedRole === 'admin'
          ? 'authorizedAdmin'
          : personnelInviteRoles.includes(normalizedRole) || normalizedRole === 'staff'
            ? 'authorizedPersonnel'
            : null
    const profileDocRef =
      privilegedCollectionName && currentUser.email
        ? doc(db, privilegedCollectionName, String(currentUser.email || '').trim().toLowerCase())
        : doc(db, 'users', currentUser.uid)

    if (fullName && fullName !== currentUser.displayName) {
      await updateAuthProfile(currentUser, {
        displayName: fullName,
      })
    }

    let avatarUrl = null
    // Upload avatar to Storage if file exists
    if (profileForm.avatarFile instanceof File) {
      const avatarPath = `users/${currentUser.uid}/avatar.${profileForm.avatarFile.name.split('.').pop()}`
      const avatarRef = ref(storage, avatarPath)
      await uploadBytes(avatarRef, profileForm.avatarFile)
      avatarUrl = await getDownloadURL(avatarRef)
    }

    // Save profile information
    const profileData = {
      fullName,
      phone: profileForm.phone.trim(),
      title: profileForm.title.trim(),
      location: profileForm.location.trim(),
      bio: profileForm.bio.trim(),
      role: accessProfile?.role || 'superadmin',
      email: currentUser.email || '',
      active: true,
      status: 'active',
      updatedAt: serverTimestamp(),
    }
    if (avatarUrl) profileData.avatarUrl = avatarUrl

    await setDoc(
      profileDocRef,
      profileData,
      { merge: true },
    )

    // Save flagship location to settings if coordinates are provided
    if (profileForm.latitude && profileForm.longitude) {
      const flagshipLocationRef = doc(db, 'settings', 'flagshipLocation')
      await setDoc(
        flagshipLocationRef,
        {
          latitude: parseFloat(profileForm.latitude),
          longitude: parseFloat(profileForm.longitude),
          location: profileForm.location.trim() || 'Bykelink Flagship Location',
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.email || currentUser.uid,
        },
        { merge: true },
      )
    }
  }

  const handleProfileFieldChange = (event) => {
    const { name, value } = event.target

    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleProfileSave = async (event) => {
    event.preventDefault()
    setIsSaveConfirmOpen(true)
  }

  const doSaveProfile = async () => {
    setIsSaveConfirmOpen(false)
    setIsSubmitting(true)
    try {
      await saveProfileToFirebase()
      toastSuccess('Profile updated successfully!')
      setSavedProfileSnapshot({
        fullName: profileForm.fullName || '',
        title: profileForm.title || '',
        phone: profileForm.phone || '',
        location: profileForm.location || '',
        bio: profileForm.bio || '',
        latitude: profileForm.latitude || '',
        longitude: profileForm.longitude || '',
        avatarUrl: profileForm.avatarUrl || '',
      })
    } catch (error) {
      console.error('Unable to save profile', error)
      toastError(`Unable to save profile: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSectionChange = (sectionId) => {
    // If navigating away from profile and there are unsaved changes, confirm
    const hasUnsaved = (() => {
      if (!savedProfileSnapshot) return false

      const normalizePhone = (p) => String(p || '').replace(/\D/g, '')
      const numEqual = (a, b) => {
        const na = parseFloat(a)
        const nb = parseFloat(b)
        if (Number.isNaN(na) && Number.isNaN(nb)) return true
        if (Number.isNaN(na) || Number.isNaN(nb)) return false
        return Math.abs(na - nb) < 0.000001
      }

      // Compare relevant keys with normalization for phone and numeric tolerance for coords
      if (String(profileForm.fullName || '') !== String(savedProfileSnapshot.fullName || '')) return true
      if (String(profileForm.title || '') !== String(savedProfileSnapshot.title || '')) return true
      if (normalizePhone(profileForm.phone) !== normalizePhone(savedProfileSnapshot.phone)) return true
      if (String(profileForm.location || '') !== String(savedProfileSnapshot.location || '')) return true
      if (String(profileForm.bio || '') !== String(savedProfileSnapshot.bio || '')) return true
      if (!numEqual(profileForm.latitude, savedProfileSnapshot.latitude)) return true
      if (!numEqual(profileForm.longitude, savedProfileSnapshot.longitude)) return true
      if (String(profileForm.avatarUrl || '') !== String(savedProfileSnapshot.avatarUrl || '')) return true

      return false
    })()

    if (activeSection === 'profile' && sectionId !== 'profile' && hasUnsaved) {
      setPendingSection(sectionId)
      setIsLeaveConfirmOpen(true)
      return
    }

    setActiveSection(sectionId)

    // Update URL based on section type
    if (sectionId === 'financing-applications') {
      onNavigateDashboardPath?.(`${dashboardPath}/financing-applications`)
    } else if (sectionId === 'approved-applications') {
      onNavigateDashboardPath?.(`${dashboardPath}/approved-applications`)
    } else if (sectionId !== 'financing-application-detail' && sectionId !== 'dashboard') {
      // For other sections, keep current path structure or update appropriately
      onNavigateDashboardPath?.(dashboardPath)
    } else if (sectionId === 'dashboard') {
      onNavigateDashboardPath?.(dashboardPath)
    }

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }

  const handleOpenFinancingApplication = (application) => {
    setSelectedFinancingApplication(application || null)
    handleSectionChange('financing-application-detail')
    if (application?.id) {
      onNavigateDashboardPath?.(`${dashboardPath}/financing-applications/${encodeURIComponent(application.id)}`)
    }
  }

  const handleBackToFinancingApplications = () => {
    setSelectedFinancingApplication(null)
    handleSectionChange('financing-applications')
  }

  const markConversationNotificationsRead = useCallback((conversationId) => {
    setChatNotifications((current) =>
      current.map((item) =>
        item.conversationId === conversationId
          ? { ...item, read: true }
          : item,
      ),
    )
  }, [])

  const handleNotificationClick = useCallback((notification) => {
    if (!notification) {
      return
    }

    // Handle password reset notifications from admin reset action
    if (notification.type === 'PASSWORD_RESET') {
      setIsNotificationsOpen(false)
      setActiveSection('user-management')
      
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setIsSidebarOpen(false)
      }
      
      return
    }

    // Handle password reset request notifications from "Contact Administrator"
    if (notification.type === 'PASSWORD_RESET_REQUEST') {
      setIsNotificationsOpen(false)
      setActiveSection('user-management')
      
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setIsSidebarOpen(false)
      }
      
      return
    }

    // Handle chat notifications
    if (!notification?.conversationId) {
      return
    }

    markConversationNotificationsRead(notification.conversationId)
    setChatFocusRequest({
      conversationId: notification.conversationId,
      requestedAt: Date.now(),
    })
    setIsNotificationsOpen(false)
    setActiveSection('chats-management')

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }, [markConversationNotificationsRead])

  const handleDeleteNotification = useCallback((notificationId) => {
    setNotificationConfirmation({
      type: 'delete',
      notificationId,
      title: 'Delete Notification',
      message: 'Are you sure you want to delete this notification? This action cannot be undone.',
    })
  }, [])

  const handleDeleteAllNotifications = useCallback(() => {
    setNotificationConfirmation({
      type: 'deleteAll',
      title: 'Delete All Notifications',
      message: 'Are you sure you want to delete all notifications? This action cannot be undone.',
    })
  }, [])

  const handleMarkAllAsRead = useCallback(() => {
    setChatNotifications((current) =>
      current.map((item) => ({ ...item, read: true }))
    )
  }, [])

  const confirmNotificationAction = useCallback(async () => {
    if (!notificationConfirmation) return

    if (notificationConfirmation.type === 'delete' && notificationConfirmation.notificationId) {
      setChatNotifications((current) =>
        current.filter((item) => item.id !== notificationConfirmation.notificationId)
      )
    } else if (notificationConfirmation.type === 'deleteAll') {
      setChatNotifications([])
    }

    setNotificationConfirmation(null)
  }, [notificationConfirmation])

  const handleLogoutClick = useCallback(() => {
    setLogoutConfirmation(true)
  }, [])

  const confirmLogout = useCallback(() => {
    setLogoutConfirmation(false)
    onSignOut?.()
  }, [onSignOut])

 const handleEditUserSave = async (event) => {
  event.preventDefault();

  if (!selectedUser?.email) {
    setActionMessage({
      type: 'error',
      text: 'No user record is selected for editing.',
    });
    return;
  }

  setIsSubmitting(true);

  try {
    const fullName = editUserForm.fullName.trim();
    if (!fullName) {
      throw new Error('Enter the full name before saving the user profile.');
    }

    const normalizedRole = normalizeText(editUserForm.role);

    const updatePayload = {
      fullName,
      status: editUserForm.status,
      accessibleSections: editUserForm.accessibleSections || [],
      temporaryPassword: selectedUser.temporaryPassword || DEFAULT_OPERATOR_PASSWORD,
      mustChangePassword: Boolean(selectedUser.mustChangePassword || selectedUser.requiresPasswordChange),
      firstLoginRequired: Boolean(selectedUser.firstLoginRequired || selectedUser.requiresPasswordChange),
      createdAt: selectedUser.createdAt,
      invitedBy: selectedUser.invitedBy,
    };

    // ✅ Call service layer
    await saveAccessAssignment(editUserForm.email.trim().toLowerCase(), normalizedRole, updatePayload);

    setActionMessage({
      type: 'success',
      text: `${editUserForm.email} updated successfully.`,
    });
    handleCloseEditUserModal();
  } catch (error) {
    console.error('Unable to update user', error);
    setActionMessage({
      type: 'error',
      text: `Unable to update the user. ${error.message}`,
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const handleGrantAccess = async (event) => {
    event.preventDefault()

    if (!canManageAccess) {
      setActionMessage({
        type: 'error',
        text: 'Only admin or superadmin can manage account access assignments.',
      })
      return
    }

    const normalizedEmail = inviteForm.email.trim().toLowerCase()

    if (!normalizedEmail) {
      setActionMessage({
        type: 'error',
        text: 'Enter an email address before granting access.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (!inviteForm.fullName.trim()) {
        throw new Error('Enter the operator full name before creating the account entry.')
      }

      const normalizedInviteRole = normalizeText(inviteForm.role)

      
      // Define allowed roles dynamically
      const allowedRolesByUser = {
        admin: ['staff personnel', 'mechanics personnel', 'customer'],
        superadmin: [
          'staff personnel',
          'mechanics personnel',
          'customer',
          'admin',
          'superadmin',
        ],
      }

      const assignableInviteRoles = allowedRolesByUser[currentAccessRole] || []

      if (!assignableInviteRoles.includes(normalizedInviteRole)) {
        throw new Error(
          currentAccessRole === 'admin'
            ? 'Admin accounts can only register non-admin operator roles.'
            : 'You are not allowed to assign that role from this console.',
        )
      }

      const temporaryPassword = DEFAULT_OPERATOR_PASSWORD
      const createOperatorAccount = httpsCallable(functions, 'createOperatorAccount')
      const response = await createOperatorAccount({
        ...inviteForm,
        email: normalizedEmail,
        temporaryPassword,
      })

      await saveAccessAssignment(normalizedEmail, inviteForm.role, {
        ...inviteForm,
        temporaryPassword,
        mustChangePassword: true,
        firstLoginRequired: true,
        accessibleSections: inviteForm.menuAccess || [],
      })

      setActionMessage({
        type: 'success',
        text:
          response?.data?.message ||
          `${normalizedEmail} now has ${inviteForm.role} access and a verification email has been prepared.`,
      })
      handleCloseNewUserModal()
    } catch (error) {
      console.error('Unable to grant access', error)
      setActionMessage({
        type: 'error',
        text: `Unable to save access assignment. ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleArchiveUser = async (user) => {
    if (!canManageAccess) {
      setActionMessage({
        type: 'error',
        text: 'Only admin or superadmin can archive user accounts.',
      })
      return
    }

    const normalizedRole = normalizeText(user.role)

    if (currentAccessRole === 'admin' && ['admin', 'superadmin'].includes(normalizedRole)) {
      setActionMessage({
        type: 'error',
        text: 'Admin can archive non-admin users only.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const archiveOperatorAccount = httpsCallable(functions, 'archiveOperatorAccount')
      const response = await archiveOperatorAccount({
        email: String(user.email || '').trim().toLowerCase(),
        role: normalizedRole,
        fullName: user.fullName || user.displayName || '',
      })

      setActionMessage({
        type: 'success',
        text: response?.data?.message || `${user.email || user.id} moved to Delete Archived.`,
      })
    } catch (error) {
      console.error('Unable to archive user', error)
      setActionMessage({
        type: 'error',
        text: `Unable to archive the user. ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteArchivedUserPermanently = async (user) => {
    if (currentAccessRole !== 'superadmin') {
      setActionMessage({
        type: 'error',
        text: 'Only superadmin can permanently delete archived records.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const deleteArchivedUserPermanently = httpsCallable(functions, 'deleteArchivedUserPermanently')
      const response = await deleteArchivedUserPermanently({
        email: String(user.email || '').trim().toLowerCase(),
      })

      setActionMessage({
        type: 'success',
        text: response?.data?.message || `${user.email || user.id} permanently deleted.`,
      })
    } catch (error) {
      console.error('Unable to permanently delete archived user', error)
      setActionMessage({
        type: 'error',
        text: `Unable to permanently delete the archived user. ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = (user) => {
    if (!canManageAccess) {
      setActionMessage({
        type: 'error',
        text: 'Only admin or superadmin can reset user passwords.',
      })
      return
    }

    const normalizedRole = normalizeText(user.role)

    if (currentAccessRole === 'admin' && ['admin', 'superadmin'].includes(normalizedRole)) {
      setActionMessage({
        type: 'error',
        text: 'Admin can reset non-admin passwords only.',
      })
      return
    }

    // Show confirmation modal
    setResetPasswordConfirmation({
      user,
    })
  }

  const handleConfirmResetPassword = async () => {
    if (!resetPasswordConfirmation?.user) return

    const user = resetPasswordConfirmation.user
    setIsResetPasswordLoading(true)

    try {
      const resetUserPassword = httpsCallable(functions, 'resetUserPassword')
      const response = await resetUserPassword({
        email: String(user.email || '').trim().toLowerCase(),
        newPassword: DEFAULT_OPERATOR_PASSWORD,
      })

      // Add notification for password reset
      const newNotification = {
        id: `password-reset-${user.email}-${Date.now()}`,
        type: 'PASSWORD_RESET',
        title: 'Password Reset',
        description: `Password reset for ${user.fullName || user.email}`,
        read: false,
        createdAt: new Date().toISOString(),
        email: user.email,
      }

      const updatedNotifications = [newNotification, ...chatNotifications]
      setChatNotifications(updatedNotifications)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('bykelink-chat-notifications', JSON.stringify(updatedNotifications))
      }

      setActionMessage({
        type: 'success',
        text: response?.data?.message || `${user.email || user.id} password reset to default.`,
      })
      
      toastSuccess(`Password reset successfully for ${user.fullName || user.email}`)
      
      // Close modal after success
      setResetPasswordConfirmation(null)
    } catch (error) {
      console.error('Unable to reset user password', error)
      setActionMessage({
        type: 'error',
        text: `Unable to reset password. ${error.message}`,
      })
      
      toastError(`Failed to reset password: ${error.message}`)
      
      // Close modal after error
      setResetPasswordConfirmation(null)
    } finally {
      setIsResetPasswordLoading(false)
    }
  }

  const handleCleanupDuplicatedPrivilegedUsers = async () => {
    if (!canManageAccess) {
      setActionMessage({
        type: 'error',
        text: 'Only admin or superadmin can clean up duplicated users.',
      })
      return
    }



    setIsSubmitting(true)

    try {
      const cleanupPrivilegedUserDuplicates = httpsCallable(functions, 'cleanupPrivilegedUserDuplicates')
      const response = await cleanupPrivilegedUserDuplicates({})
      const deletedCount = Number(response?.data?.deletedCount || 0)
      const skippedCount = Number(response?.data?.skippedCount || 0)

      setActionMessage({
        type: 'success',
        text: `Duplicate cleanup finished. Deleted ${deletedCount} stale user record(s) and skipped ${skippedCount}.`,
      })
    } catch (error) {
      console.error('Unable to clean up duplicated privileged users', error)
      setActionMessage({
        type: 'error',
        text: `Unable to clean up duplicated privileged users. ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  

  const isDashboardView = activeSection === 'dashboard'

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'service-logs':
      case 'service-requests':
        return (
          <ServiceRequestsSection
            requests={filteredServiceRequests}
            canEditOperations={canEditOperations}
            serviceStatusOptions={serviceStatusOptions}
            handleCollectionUpdate={handleCollectionUpdate}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getStatusClasses={getStatusClasses}
            isDarkMode={isDarkMode}
          />
        )
      case 'financing-applications':
        return (
          <FinancingApplicationsSection
            applications={filteredFinancingApplications}
            canEditOperations={canEditOperations}
            financingStatusOptions={financingStatusOptions}
            handleCollectionUpdate={handleCollectionUpdate}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onOpenApplication={handleOpenFinancingApplication}
            isDarkMode={isDarkMode}
          />
        )
      case 'financing-application-detail':
        return (
          <FinancingApplicationDetailSection
            application={selectedFinancingApplication}
            canEditOperations={canEditOperations}
            handleCollectionUpdate={handleCollectionUpdate}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onBack={handleBackToFinancingApplications}
            isDarkMode={isDarkMode}
          />
        )
      case 'approved-applications':
        return (
          <ApprovedApplicationsSection
            applications={filteredFinancingApplications}
            canEditOperations={canEditOperations}
            handleCollectionUpdate={handleCollectionUpdate}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onOpenApplication={handleOpenFinancingApplication}
            isDarkMode={isDarkMode}
          />
        )
      case 'chats-management':
        return (
          <ChatsManagementSection
            searchTerm={searchTerm}
            onUnreadCountChange={recountUnreadMessages}
            focusRequest={chatFocusRequest}
            onConversationRead={markConversationNotificationsRead}
            isDarkMode={isDarkMode}
          />
        )
      case 'service-management':
      case 'service-type':
        return (
          <ServiceTypeSection
            isDarkMode={isDarkMode}
          />
        )
      case 'technicians':
        return (
          <TechniciansSection
            technicians={filteredTechnicians}
            canEditOperations={canEditOperations}
            technicianStatusOptions={technicianStatusOptions}
            handleCollectionUpdate={handleCollectionUpdate}
            getStatusClasses={getStatusClasses}
            isDarkMode={isDarkMode}
          />
        )
      case 'analytics':
        return (
          <AnalyticsSection
            users={users}
            authorizedAdmins={[...authorizedAdmins, ...authorizedPersonnel]}
            serviceRequests={serviceRequests}
            inventory={inventory}
            technicians={technicians}
            roleOptions={roleOptions}
            normalizeText={normalizeText}
            isDarkMode={isDarkMode}
          />
        )
      case 'user-management':
        return (
          <UserManagementSection
            filteredAuthorizedAdmins={filteredAuthorizedAccess}
            filteredUsers={filteredUsers}
            archivedUsers={archivedUsers}
            canManageAccess={canManageAccess}
            currentAccessRole={currentAccessRole}
            isSubmitting={isSubmitting}
            roleOptions={assignableRoleOptions}
            formatDate={formatDate}
            getStatusClasses={getStatusClasses}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onOpenNewUserModal={handleOpenNewUserModal}
            onCleanupDuplicates={handleCleanupDuplicatedPrivilegedUsers}
            onEditUser={handleOpenEditUserModal}
            onArchiveUser={handleArchiveUser}
            onDeleteArchivedUser={handleDeleteArchivedUserPermanently}
            onResetPassword={handleResetPassword}
            isDarkMode={isDarkMode}
          />
        )
      case 'profile':
        return (
          <ProfileSection
            currentUser={currentUser}
            accessProfile={accessProfile}
            profileForm={profileForm}
            onProfileFieldChange={handleProfileFieldChange}
            onProfileSave={handleProfileSave}
            isSubmitting={isSubmitting}
            formatDate={formatDate}
            isDarkMode={isDarkMode}
          />
        )
      case 'inventory':
        return (
          <InventorySection
            items={filteredInventory}
            canEditOperations={canEditOperations}
            inventoryStatusOptions={inventoryStatusOptions}
            handleCollectionUpdate={handleCollectionUpdate}
            formatCurrency={formatCurrency}
            getStatusClasses={getStatusClasses}
            categories={categories}
            models={models}
            variants={variants}
            currentUser={currentUser}
            isDarkMode={isDarkMode}
          />
        )
      case 'inventory-reports':
        return (
          <InventoryReportsSection
            inventoryLogs={inventoryLogs}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            currentUser={currentUser}
            isDarkMode={isDarkMode}
          />
        )
      case 'inventory-delete-archived':
        return (
          <InventoryDeleteArchivedSection
            deletedItems={deletedItems}
            canDeletePermanently={currentAccessRole === 'superadmin'}
            handleCollectionUpdate={handleCollectionUpdate}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            isDarkMode={isDarkMode}
            currentUser={currentUser}
            currentAccessRole={currentAccessRole}
          />
        )
      case 'master-categories':
      case 'master-models':
      case 'master-variants':
        return (
          <MasterDataManagementSection
            dataType={activeSection}
            categories={categories}
            models={models}
            canEditOperations={canEditOperations}
            isDarkMode={isDarkMode}
          />
        )
      default:
        return (
          <DashboardSection
            chartBars={chartBars}
            technicians={mechanicsWithActiveJobs}
            serviceRequests={filteredServiceRequests}
            setActiveSection={handleSectionChange}
            getStatusClasses={getStatusClasses}
            isDarkMode={isDarkMode}
          />
        )
    }
  }

  return (
    <div 
      className="superadmin-shell font-['Manrope']"
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      <NotificationsDrawer
        open={isNotificationsOpen}
        notifications={notificationItems}
        onClose={() => setIsNotificationsOpen(false)}
        onNotificationClick={handleNotificationClick}
        onDeleteNotification={handleDeleteNotification}
        onDeleteAllNotifications={handleDeleteAllNotifications}
        onMarkAllAsRead={handleMarkAllAsRead}
      />

      <NewUserModal
        open={isNewUserModalOpen}
        onClose={handleCloseNewUserModal}
        inviteForm={inviteForm}
        setInviteForm={setInviteForm}
        onSubmit={handleGrantAccess}
        availableRoles={assignableInviteRoles}
        canManageAccess={canManageAccess}
        isSubmitting={isSubmitting}
        isDarkMode={isDarkMode}
        currentUserRole={userProfile?.role}
      />

      <EditUserModal
        open={isEditUserModalOpen}
        onClose={handleCloseEditUserModal}
        editUserForm={editUserForm}
        setEditUserForm={setEditUserForm}
        onSubmit={handleEditUserSave}
        availableRoles={assignableRoleOptions}
        currentUserRole={userProfile?.role}
        canManageAccess={canManageAccess}
        isSubmitting={isSubmitting}
        sidebarItems={baseSidebarItems}
        userMenuAccess={userProfile?.accessibleSections ?? []}
      />

      <ConfirmationModal
        open={!!notificationConfirmation}
        title={notificationConfirmation?.title || ''}
        message={notificationConfirmation?.message || ''}
        confirmText={notificationConfirmation?.type === 'deleteAll' ? 'Delete All' : 'Delete'}
        cancelText="Cancel"
        onConfirm={confirmNotificationAction}
        onCancel={() => setNotificationConfirmation(null)}
        isDangerous={true}
        isDarkMode={isDarkMode}
      />

      <ConfirmationModal
        open={logoutConfirmation}
        title="Logout?"
        message="Are you sure you want to log out? You will need to sign in again to access this dashboard."
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={confirmLogout}
        onCancel={() => setLogoutConfirmation(false)}
        isDangerous={true}
        isDarkMode={isDarkMode}
      />

      <ConfirmationModal
        open={!!resetPasswordConfirmation}
        title="Reset Password?"
        message={`Reset password for ${resetPasswordConfirmation?.user?.fullName || resetPasswordConfirmation?.user?.email || 'this user'} to default (${DEFAULT_OPERATOR_PASSWORD})?`}
        confirmText="Reset Password"
        cancelText="Cancel"
        onConfirm={handleConfirmResetPassword}
        onCancel={() => setResetPasswordConfirmation(null)}
        isDangerous={true}
        isDarkMode={isDarkMode}
        isLoading={isResetPasswordLoading}
      />

      <SuperAdminSidebar
        sidebarItems={sidebarItems}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        onNavigateHome={onNavigateHome}
        onSignOut={handleLogoutClick}
        consoleLabel={consoleLabel}
        userMenuAccess={userProfile?.accessibleSections ?? []}
      />

      <div className="superadmin-content">
        <SuperAdminHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sectionTitle={sectionTitle}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
          onToggleNotifications={handleToggleNotifications}
          notificationCount={unreadChatCount}
          adminName={adminName}
          consoleLabel={consoleLabel}
          onOpenProfile={() => handleSectionChange('profile')}
          avatarUrl={profileForm.avatarUrl}
        />

        {/* Confirmation modals for save and unsaved-navigation */}
        <ConfirmationModal
          open={isSaveConfirmOpen}
          title="Save Profile & Location"
          message="Do you want to save the profile and location now?"
          confirmText="Save"
          cancelText="Cancel"
          onConfirm={doSaveProfile}
          onCancel={() => setIsSaveConfirmOpen(false)}
          isDangerous={false}
          isDarkMode={isDarkMode}
        />

        <ConfirmationModal
          open={isLeaveConfirmOpen}
          title="Unsaved Changes"
          message="You have unsaved changes. Leave without saving?"
          confirmText="Leave"
          cancelText="Stay"
          onConfirm={() => {
            // discard changes and navigate
            if (savedProfileSnapshot) {
              setProfileForm(() => ({ ...savedProfileSnapshot }))
            }
            setIsLeaveConfirmOpen(false)
            if (pendingSection) setActiveSection(pendingSection)
            setPendingSection(null)
          }}
          onCancel={() => setIsLeaveConfirmOpen(false)}
          isDangerous={true}
          isDarkMode={isDarkMode}
        />

        <main className="superadmin-main ml-64 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
          {isDashboardView && (
            <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-['Epilogue'] text-4xl font-black uppercase italic tracking-tighter sm:text-5xl">
                  Velocity <span className="text-red-600">Pulse</span>
                </h2>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="superadmin-summary-card flex flex-col rounded-lg px-4 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Signed in as</span>
                  <span className="font-['Epilogue'] text-sm font-bold text-white">{adminEmail}</span>
                </div>
                
              </div>
            </div>
          )}

          {actionMessage && (
            <div
              className={`superadmin-alert mb-6 rounded-2xl border px-4 py-3 text-sm ${
                actionMessage.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-red-500/30 bg-red-500/10 text-red-200'
              }`}
            >
              {actionMessage.text}
            </div>
          )}

          {isDashboardView && (
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((card) => (
                <article
                  key={card.title}
                  className="superadmin-summary-card superadmin-metric-card group relative overflow-hidden rounded-lg p-6 transition-all hover:border-red-600/30"
                >
                  <div className="absolute -bottom-4 -right-4 opacity-5 transition-opacity group-hover:opacity-10">
                    {card.title.includes('Availability') ? (
                      <EngineeringRoundedIcon sx={{ fontSize: 80 }} />
                    ) : card.title.includes('Revenue') ? (
                      <AnalyticsRoundedIcon sx={{ fontSize: 80 }} />
                    ) : null}
                  </div>

                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/40">{card.title}</p>
                  <h3 className="font-['Epilogue'] text-3xl font-black text-white">{card.value}</h3>

                  {card.progress !== undefined ? (
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div className="h-full bg-red-600" style={{ width: `${card.progress}%` }} />
                    </div>
                  ) : (
                    <div
                      className={`mt-4 flex items-center gap-1 text-xs font-bold ${
                        card.tone === 'emerald' ? 'text-emerald-400' : 'text-red-600'
                      }`}
                    >
                      {card.tone === 'emerald' ? (
                        <TrendingUpRoundedIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <TrendingDownRoundedIcon sx={{ fontSize: 16 }} />
                      )}
                      {card.detail}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {renderActiveSection()}
        </main>
      </div>
    </div>
  )
}
