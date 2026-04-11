import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { updateProfile as updateAuthProfile } from 'firebase/auth'
import { collection, deleteDoc, doc, limit, onSnapshot, query, serverTimestamp, setDoc, getDocs, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
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
import { db, functions } from '../../firebase'
import ConfirmationModal from './components/ConfirmationModal'
import EditUserModal from './components/EditUserModal'
import NewUserModal from './components/NewUserModal'
import NotificationsDrawer from './components/NotificationsDrawer'
import ProfileSection from './components/ProfileSection'
import SuperAdminHeader from './components/SuperAdminHeader'
import SuperAdminSidebar from './components/SuperAdminSidebar'
import AnalyticsSection from './sections/AnalyticsSection'
import ChatsManagementSection from './sections/ChatsManagementSection'
import DashboardSection from './sections/DashboardSection'
import InventorySection from './sections/InventorySection'
import InventoryReportsSection from './sections/InventoryReportsSection'
import InventoryDeleteArchivedSection from './sections/InventoryDeleteArchivedSection'
import MasterDataManagementSection from './sections/MasterDataManagementSection'
import ServiceRequestsSection from './sections/ServiceRequestsSection'
import TechniciansSection from './sections/TechniciansSection'
import UserManagementSection from './sections/UserManagementSection'
import {
  buildChartBars,
  fallbackTechnicians,
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
  { id: 'service-logs', label: 'Service Logs', icon: BuildRoundedIcon },
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
}

const defaultEditUserForm = {
  fullName: '',
  email: '',
  role: 'admin',
  status: 'active',
}

export default function SuperAdminPage({ onNavigateHome, onSignOut, currentUser, accessProfile }) {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState([])
  const [serviceRequests, setServiceRequests] = useState([])
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
  const [loadingState, setLoadingState] = useState({
    users: true,
    serviceRequests: true,
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    const savedTheme =
      window.localStorage.getItem('bykelink-theme') ||
      window.localStorage.getItem('bykelink-superadmin-theme')

    if (savedTheme) {
      return savedTheme !== 'light'
    }

    return !window.matchMedia('(prefers-color-scheme: light)').matches
  })
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    title: '',
    phone: '',
    location: '',
    bio: '',
  })

  const sectionTitle = useMemo(() => {
    return baseSidebarItems.find((item) => item.id === activeSection)?.label ?? 'Dashboard'
  }, [activeSection])

  const adminName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Administrator'
  const adminEmail = currentUser?.email || 'No email'
  const consoleLabel = accessProfile?.label || 'Superadmin'
  const currentAccessRole = accessProfile?.role || 'guest'
  const canManageAccess = ['admin', 'superadmin'].includes(currentAccessRole)
  const canEditOperations = ['admin', 'superadmin'].includes(currentAccessRole)
  const personnelInviteRoles = [
    'mechanics personnel',
    'inventory personnel',
    'cashier personnel',
    'front desk personnel',
  ]
  const assignableInviteRoles =
    currentAccessRole === 'superadmin' ? ['admin', ...personnelInviteRoles] : personnelInviteRoles
  const assignableRoleOptions =
    currentAccessRole === 'superadmin'
      ? roleOptions.filter((role) => role !== 'superadmin')
      : roleOptions.filter((role) => !['admin', 'superadmin'].includes(role))

  useEffect(() => {
    if (!actionMessage) {
      return undefined
    }

    const timerId = window.setTimeout(() => setActionMessage(null), 5000)

    return () => window.clearTimeout(timerId)
  }, [actionMessage])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const theme = isDarkMode ? 'dark' : 'light'

    window.localStorage.setItem('bykelink-theme', theme)
    window.localStorage.setItem('bykelink-superadmin-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)

    return undefined
  }, [isDarkMode])

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
        query(collection(db, collectionName), limit(30)),
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
        collectionName: 'inventory',
        stateKey: 'inventory',
        setter: setInventory,
      }),
      subscribeToCollection({
        collectionName: 'technicians',
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
  }, [canEditOperations, consoleLabel])

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
    return baseSidebarItems.map((item) => {
      if (item.id === 'chats-management') {
        return {
          ...item,
          badge: unreadChatCount > 0 ? unreadChatCount : null,
        }
      }
      return item
    })
  }, [unreadChatCount])

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
      console.log('Refreshing collection subscriptions...')
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

  const saveAccessAssignment = async (email, role, extraData = {}) => {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedRole = normalizeText(role)
    const normalizedStatus = String(extraData.status || 'active').trim().toLowerCase()
    const personnelRoles = [
      'mechanics personnel',
      'inventory personnel',
      'cashier personnel',
      'front desk personnel',
    ]
    const isPersonnelRole = personnelRoles.includes(normalizedRole)
    const isAdminRole = ['admin', 'superadmin'].includes(normalizedRole)
    const isActive = normalizedStatus !== 'inactive' && normalizedRole !== 'customer'
    const dashboardPath =
      normalizedRole === 'superadmin'
        ? '/superadmin'
        : normalizedRole === 'admin'
          ? '/admin'
          : isPersonnelRole || normalizedRole === 'staff'
            ? '/staff'
            : null
    const collectionName = isAdminRole ? 'authorizedAdmin' : 'authorizedPersonnel'
    const alternateCollection = isAdminRole ? 'authorizedPersonnel' : 'authorizedAdmin'
    const accessLevel = normalizedRole === 'superadmin' || normalizedRole === 'admin' ? normalizedRole : 'staff'

    const writeOperations = [
      setDoc(
        doc(db, collectionName, normalizedEmail),
        {
          email: normalizedEmail,
          fullName: extraData.fullName?.trim() || '',
          role: normalizedRole,
          personnelRole: isPersonnelRole ? normalizedRole : '',
          accessLevel,
          status: isActive ? 'active' : 'inactive',
          active: isActive,
          temporaryPassword: extraData.temporaryPassword?.trim() || '',
          mustChangePassword: Boolean(extraData.mustChangePassword),
          firstLoginRequired: Boolean(extraData.firstLoginRequired),
          dashboardPath,
          invitedBy: extraData.invitedBy || currentUser?.email || '',
          updatedAt: serverTimestamp(),
          createdAt: extraData.createdAt || serverTimestamp(),
        },
        { merge: true },
      ),
    ]

    if (currentAccessRole === 'superadmin') {
      writeOperations.push(deleteDoc(doc(db, alternateCollection, normalizedEmail)))
    }

    await Promise.all(writeOperations)

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

    await setDoc(
      profileDocRef,
      {
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
      },
      { merge: true },
    )
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
    setIsSubmitting(true)

    try {
      await saveProfileToFirebase()
      setActionMessage({
        type: 'success',
        text: 'Profile updated successfully in Firebase.',
      })
    } catch (error) {
      console.error('Unable to save profile', error)
      setActionMessage({
        type: 'error',
        text: `Unable to save the profile. ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId)

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
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

  const filterOldNotifications = useCallback((notifications) => {
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
    const now = Date.now()
    return notifications.filter((notification) => {
      const createdAt = notification.createdAt instanceof Date ? notification.createdAt.getTime() : new Date(notification.createdAt).getTime()
      return now - createdAt < ONE_WEEK_MS
    })
  }, [])

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
    event.preventDefault()

    if (!selectedUser?.email) {
      setActionMessage({
        type: 'error',
        text: 'No user record is selected for editing.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (!editUserForm.fullName.trim()) {
        throw new Error('Enter the full name before saving the user profile.')
      }

      const normalizedRole = normalizeText(editUserForm.role)

      if (!assignableRoleOptions.includes(normalizedRole)) {
        throw new Error(
          currentAccessRole === 'admin'
            ? 'Admin accounts can only assign non-admin roles.'
            : 'You are not allowed to assign that role from this console.',
        )
      }

      await saveAccessAssignment(editUserForm.email, normalizedRole, {
        fullName: editUserForm.fullName,
        status: editUserForm.status,
        temporaryPassword: selectedUser.temporaryPassword || DEFAULT_OPERATOR_PASSWORD,
        mustChangePassword: Boolean(selectedUser.mustChangePassword || selectedUser.requiresPasswordChange),
        firstLoginRequired: Boolean(selectedUser.firstLoginRequired || selectedUser.requiresPasswordChange),
        createdAt: selectedUser.createdAt,
        invitedBy: selectedUser.invitedBy,
      })

      setActionMessage({
        type: 'success',
        text: `${editUserForm.email} updated successfully.`,
      })
      handleCloseEditUserModal()
    } catch (error) {
      console.error('Unable to update user', error)
      setActionMessage({
        type: 'error',
        text: `Unable to update the user. ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Archive ${user.fullName || user.email || 'this user'}?`)

      if (!confirmed) {
        return
      }
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

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Permanently delete ${user.fullName || user.email || 'this archived user'}?`)

      if (!confirmed) {
        return
      }
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

  const loadingMessage = Object.entries(loadingState)
    .filter(([, isLoading]) => isLoading)
    .map(([key]) => key)
    .join(', ')

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
      case 'chats-management':
        return (
          <ChatsManagementSection
            searchTerm={searchTerm}
            onUnreadCountChange={recountUnreadMessages}
            focusRequest={chatFocusRequest}
            onConversationRead={markConversationNotificationsRead}
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
            onEditUser={handleOpenEditUserModal}
            onArchiveUser={handleArchiveUser}
            onDeleteArchivedUser={handleDeleteArchivedUserPermanently}
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
            technicians={filteredTechnicians}
            serviceRequests={filteredServiceRequests}
            setActiveSection={handleSectionChange}
            getStatusClasses={getStatusClasses}
          />
        )
    }
  }

  return (
    <div className={`superadmin-shell ${isDarkMode ? 'dark-mode' : 'light-mode'} font-['Manrope'] text-[#e5e2e1]`}>
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
      />

      <EditUserModal
        open={isEditUserModalOpen}
        onClose={handleCloseEditUserModal}
        editUserForm={editUserForm}
        setEditUserForm={setEditUserForm}
        onSubmit={handleEditUserSave}
        availableRoles={assignableRoleOptions}
        canManageAccess={canManageAccess}
        isSubmitting={isSubmitting}
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

      <SuperAdminSidebar
        sidebarItems={sidebarItems}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        onNavigateHome={onNavigateHome}
        onSignOut={handleLogoutClick}
        consoleLabel={consoleLabel}
      />

      <div className="superadmin-content">
        <SuperAdminHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sectionTitle={sectionTitle}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((current) => !current)}
          onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
          onToggleNotifications={handleToggleNotifications}
          notificationCount={unreadChatCount}
          adminName={adminName}
          consoleLabel={consoleLabel}
          onOpenProfile={() => handleSectionChange('profile')}
        />

        <main className="superadmin-main ml-64 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
          {isDashboardView && (
            <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-['Epilogue'] text-4xl font-black uppercase italic tracking-tighter sm:text-5xl">
                  Velocity <span className="text-[#e10100]">Pulse</span>
                </h2>
                <p className="mt-2 font-medium text-white/40">
                  Firebase live sync • {consoleLabel} access • Focus: {sectionTitle}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="superadmin-summary-card flex flex-col rounded-lg px-4 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Signed in as</span>
                  <span className="font-['Epilogue'] text-sm font-bold text-white">{adminEmail}</span>
                </div>
                <div className="superadmin-summary-card flex flex-col rounded-lg px-4 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Firebase Status</span>
                  <span className="font-['Epilogue'] font-bold text-[#e10100]">
                    {loadingMessage ? 'Syncing...' : 'Live'}
                  </span>
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
                  className="superadmin-summary-card superadmin-metric-card group relative overflow-hidden rounded-lg p-6 transition-all hover:border-[#e10100]/30"
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
                      <div className="h-full bg-[#e10100]" style={{ width: `${card.progress}%` }} />
                    </div>
                  ) : (
                    <div
                      className={`mt-4 flex items-center gap-1 text-xs font-bold ${
                        card.tone === 'emerald' ? 'text-emerald-400' : 'text-[#e10100]'
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
