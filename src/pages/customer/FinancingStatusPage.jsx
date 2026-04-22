import { useEffect, useState, useRef } from 'react'
import { httpsCallable } from 'firebase/functions'
import { collection, query, where, addDoc, serverTimestamp, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { functions } from '../../firebase'
import NavHeaderCustomer from './components/NavHeaderCustomer'
import CheckIcon from '@mui/icons-material/Check'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import './FinancingStatusPage.css'

export default function FinancingStatusPage({ referenceId, currentUser, onNavigateToShowroom, onNavigateToService, onNavigateToFinancing, onNavigateToFinancingStatus, onNavigateToMessages, onNavigateToProfile, onNavigateToServiceBookings, onSignOut }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [statusData, setStatusData] = useState(null)
  const [allApplications, setAllApplications] = useState([])
  const [error, setError] = useState('')
  const [trackedReferenceId, setTrackedReferenceId] = useState(referenceId || '')
  const [messageInput, setMessageInput] = useState('')
  const [isMessageLoading, setIsMessageLoading] = useState(false)
  const [conversationMessages, setConversationMessages] = useState([])
  const [applicationId, setApplicationId] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [userAvatar, setUserAvatar] = useState(null)
  const [unreadNotifications] = useState([
    { id: 1, title: 'Application Update', message: 'Your financing application is under review', timestamp: 'Just now', read: false },
    { id: 2, title: 'Document Received', message: 'We have received your income verification', timestamp: '1 hour ago', read: true },
  ])
  const unsubscribeRef = useRef(null)
  const statusUnsubscribeRef = useRef(null)
  const applicationsUnsubscribeRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Helper function to map status to stage number
  const getStageFromStatus = (status) => {
    if (!status) return 1
    const statusLower = status.toLowerCase()
    if (statusLower === 'pending') return 1
    if (statusLower === 'reviewing' || statusLower === 'under review') return 2
    if (statusLower === 'approved') return 3
    if (statusLower === 'completed') return 4
    return 1
  }

  // Helper function to get current task based on status
  const getCurrentTask = (status) => {
    if (!status) return 'Application Review'
    const statusLower = status.toLowerCase()
    if (statusLower === 'pending') return 'Application Submission'
    if (statusLower === 'reviewing' || statusLower === 'under review') return 'Document Verification'
    if (statusLower === 'approved') return 'Agreement Review'
    if (statusLower === 'completed') return 'Documentation Complete'
    return 'Application Review'
  }

  // Helper function to get status message
  const getStatusMessage = (status) => {
    if (!status) return 'Your application is being reviewed. You will receive updates via email.'
    const statusLower = status.toLowerCase()
    if (statusLower === 'pending') return 'Your application has been submitted. Our team is reviewing your information.'
    if (statusLower === 'reviewing' || statusLower === 'under review') return 'Your application is currently under review by our financing specialists.'
    if (statusLower === 'approved') return 'Congratulations! Your application has been approved. Please proceed with the documentation.'
    if (statusLower === 'completed') return 'Your application is complete and your unit is ready for pickup.'
    return 'Your application is being reviewed. You will receive updates via email.'
  }

  // Wait for auth to be ready
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setIsAuthReady(true)
    })
    return unsubscribe
  }, [])

  // Fetch user avatar
  useEffect(() => {
    if (!currentUser?.uid) return

    const fetchUserAvatar = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists() && userDoc.data()?.avatar) {
          setUserAvatar(userDoc.data().avatar)
        }
      } catch (error) {
        console.error('Error fetching user avatar:', error)
      }
    }

    fetchUserAvatar()
  }, [currentUser?.uid])

  // Clear state when referenceId is removed (user navigating back to list)
  useEffect(() => {
    if (referenceId === undefined || referenceId === null || referenceId === '') {
      setStatusData(null)
      setApplicationId(null)
      setTrackedReferenceId('')
      setError('')
      setConversationMessages([])
    }
  }, [referenceId])

  // Auto-load application if referenceId is provided
  useEffect(() => {
    if (!referenceId || !isAuthReady) return
    
    // First, check if this application is already in the list
    const app = allApplications.find(a => a.referenceId === referenceId)
    if (app && !applicationId) {
      setTrackedReferenceId(referenceId)
      setApplicationId(app.id)
      return
    }

    // If not found and we don't have statusData yet, try to load it directly
    if (!statusData) {
      const loadDirectly = async () => {
        try {
          const getStatus = httpsCallable(functions, 'getFinancingApplicationStatus')
          const result = await getStatus({ referenceId })
          if (result?.data) {
            setStatusData(result.data)
            setTrackedReferenceId(referenceId)
            setError('')
          } else {
            setError('Application not found')
          }
        } catch (err) {
          console.error('Failed to load application directly:', err)
          setError('Failed to load application. Please try again.')
        }
      }
      loadDirectly()
    }
  }, [referenceId, isAuthReady, allApplications, statusData, applicationId])

  // Wait for auth to be ready
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setIsAuthReady(true)
    })
    return unsubscribe
  }, [])

  // Fetch financing history for the current user and auto-load latest with real-time updates
  useEffect(() => {
    if (!isAuthReady) return

    const user = auth.currentUser
    if (!user) {
      setIsLoading(false)
      setError('Please log in to view your financing applications.')
      return
    }

    // Set up real-time listeners for both queries
    const q1 = query(
      collection(db, 'financingApplications'),
      where('applicant.uid', '==', user.uid)
    )
    const q2 = query(
      collection(db, 'financingApplications'),
      where('submittedBy.uid', '==', user.uid)
    )

    let snapshot1Data = []
    let snapshot2Data = []
    let isInitialLoad = true

    // Subscribe to first query
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      snapshot1Data = snapshot.docs.map(doc => ({
        id: doc.id,
        referenceId: doc.data().referenceId,
        status: doc.data().status,
        motorcycleName: doc.data().motorcycle?.name,
        submittedAt: doc.data().createdAt?.toDate?.()?.toLocaleDateString?.('en-PH') || doc.data().createdAt,
      }))
      updateApplicationsList()
    })

    // Subscribe to second query
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      snapshot2Data = snapshot.docs.map(doc => ({
        id: doc.id,
        referenceId: doc.data().referenceId,
        status: doc.data().status,
        motorcycleName: doc.data().motorcycle?.name,
        submittedAt: doc.data().createdAt?.toDate?.()?.toLocaleDateString?.('en-PH') || doc.data().createdAt,
      }))
      updateApplicationsList()
    })

    const updateApplicationsList = () => {
      // Merge and deduplicate by referenceId
      const apps = [...snapshot1Data, ...snapshot2Data]
        .filter((app, idx, arr) =>
          app.referenceId && arr.findIndex(a => a.referenceId === app.referenceId) === idx
        )
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)) // Most recent first

      setAllApplications(apps)

      if (isInitialLoad && apps.length > 0) {
        isInitialLoad = false
        // Load the selected app or the latest one
        let selectedRef = referenceId
        if (!selectedRef) {
          selectedRef = apps[0].referenceId
        }
        
        const selectedApp = apps.find(a => a.referenceId === selectedRef)
        if (selectedApp) {
          setApplicationId(selectedApp.id)
          setTrackedReferenceId(selectedRef)
        } else if (selectedRef) {
          // If we couldn't find the app in the list but we have a referenceId,
          // try to load it directly via Cloud Function
          const loadDirectly = async () => {
            try {
              const getStatus = httpsCallable(functions, 'getFinancingApplicationStatus')
              const result = await getStatus({ referenceId: selectedRef })
              if (result?.data) {
                setStatusData(result.data)
                setTrackedReferenceId(selectedRef)
              }
            } catch (err) {
              console.error('Failed to load application directly:', err)
            }
          }
          loadDirectly()
        }
      }

      setIsLoading(false)
    }

    applicationsUnsubscribeRef.current = () => {
      unsubscribe1()
      unsubscribe2()
    }

    return () => {
      unsubscribe1()
      unsubscribe2()
    }
  }, [referenceId, isAuthReady])

  // Real-time listener for application status updates
  useEffect(() => {
    if (!applicationId) {
      // Clean up if applicationId is cleared
      if (statusUnsubscribeRef.current) {
        statusUnsubscribeRef.current()
        statusUnsubscribeRef.current = null
      }
      return
    }

    try {
      // Clean up previous listener if one exists
      if (statusUnsubscribeRef.current) {
        statusUnsubscribeRef.current()
        statusUnsubscribeRef.current = null
      }

      // Subscribe to the specific application document
      const appDocRef = doc(db, 'financingApplications', applicationId)
      
      const unsubscribe = onSnapshot(appDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          // Update statusData with fresh data from Firestore
          setStatusData(prevData => {
            const newData = {
              ...data,
              stage: getStageFromStatus(data.status),
            }
            return newData
          })
        } else {
          console.warn('Application document not found:', applicationId)
          setError('Application not found in database')
          setStatusData(null)
        }
      },
      (err) => {
        console.error('Error listening to application status:', err)
        setError('Lost connection to application data. Please refresh.')
      })
      
      statusUnsubscribeRef.current = unsubscribe
    } catch (err) {
      console.error('Error setting up status listener:', err)
      setError('Failed to load application status. Please refresh.')
    }

    return () => {
      if (statusUnsubscribeRef.current) {
        statusUnsubscribeRef.current()
        statusUnsubscribeRef.current = null
      }
    }
  }, [applicationId])

  // Real-time listener for conversation messages
  useEffect(() => {
    if (!applicationId) return

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    try {
      const messagesRef = collection(db, 'financingApplications', applicationId, 'messages')
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'))
      
      unsubscribeRef.current = onSnapshot(messagesQuery, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date(),
        }))
        setConversationMessages(msgs)
        // Auto-scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 0)
      })
    } catch (err) {
      console.error('Error setting up message listener:', err)
    }

    // Cleanup on unmount or when applicationId changes
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [applicationId])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !applicationId || isMessageLoading) return

    const user = auth.currentUser
    if (!user) return

    try {
      setIsMessageLoading(true)
      const messagesRef = collection(db, 'financingApplications', applicationId, 'messages')
      
      await addDoc(messagesRef, {
        senderType: 'customer', // customer or admin
        senderName: statusData?.applicantName || user.displayName || 'Customer',
        senderId: user.uid,
        message: messageInput.trim(),
        timestamp: serverTimestamp(),
        isRead: false,
      })
      
      setMessageInput('')
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsMessageLoading(false)
    }
  }


  const handleRefreshStatus = async () => {
    if (!trackedReferenceId) {
      alert('Please enter a reference ID')
      return
    }
    
    try {
      setIsLoading(true)
      setError('')
      const getStatus = httpsCallable(functions, 'getFinancingApplicationStatus')
      const result = await getStatus({ referenceId: trackedReferenceId })
      setStatusData(result?.data || null)
      
      // Find and set the applicationId from the all applications list
      const app = allApplications.find(a => a.referenceId === trackedReferenceId)
      if (app) {
        setApplicationId(app.id)
      }
      
      if (!result?.data) {
        setError('No application found for this reference ID')
      }
    } catch (err) {
      console.error('Error refreshing status:', err)
      setError(err?.message || 'Failed to refresh status. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectApplication = async (app) => {
    if (!app?.id || !app?.referenceId) {
      setError('Invalid application selected. Please try again.')
      return
    }

    try {
      // Clear previous data immediately when switching applications
      setStatusData(null)
      setConversationMessages([])
      setError('')
      setIsLoading(true)
      setTrackedReferenceId(app.referenceId)
      setApplicationId(app.id)  // This triggers the real-time listener useEffect
      
      // Fetch fresh status data from Cloud Function
      const getStatus = httpsCallable(functions, 'getFinancingApplicationStatus')
      const result = await getStatus({ referenceId: app.referenceId })
      
      if (result?.data) {
        setStatusData(result.data)
        setError('')
      } else {
        setError('No application data found for this reference ID')
        setStatusData(null)
      }
    } catch (err) {
      console.error('Error loading application:', err)
      const errorMsg = err?.message || 'Failed to load application. Please try again.'
      setError(errorMsg)
      setStatusData(null)
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className={`min-h-screen overflow-x-hidden ${isDarkMode ? 'bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-[#e5e2e1]' : 'bg-white text-slate-900'} font-['Manrope']`}>
      {/* Enhanced Header - Same as CustomerShowroomPage */}
      <NavHeaderCustomer
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        activePage="status"
        unreadNotifications={unreadNotifications}
        onNavigateToShowroom={onNavigateToShowroom}
        onNavigateToService={onNavigateToService}
        onNavigateToFinancing={onNavigateToFinancing}
        onNavigateToFinancingStatus={onNavigateToFinancingStatus}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToServiceBookings={onNavigateToServiceBookings}
        onSignOut={onSignOut}
        userAvatar={userAvatar}
      />

      {/* Main Content */}
      <div className={`mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8`}>
        {isLoading && !statusData ? (
          <div className={`border border-slate-800 bg-slate-900/60 p-12 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center min-h-72`}>
            <style>{`
              @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              @keyframes pulse-glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
              @keyframes slide-in { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
              .spin-animation { animation: spin-slow 3s linear infinite; }
              .pulse-animation { animation: pulse-glow 2s ease-in-out infinite; }
              .slide-animation { animation: slide-in 1s ease-out forwards; }
            `}</style>
            
            <div className="space-y-6 text-center">
              {/* Animated Motorcycle Icon */}
              <div className="flex justify-center">
                <div className="relative w-24 h-24 spin-animation">
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 border-r-red-600"></div>
                  <div className="absolute inset-4 rounded-full border-4 border-transparent border-b-red-400 border-l-red-400 animate-reverse-spin" style={{animation: 'spin-slow 2s linear infinite reverse'}}></div>
                  <div className="absolute inset-0 flex items-center justify-center text-3xl pulse-animation">🏍️</div>
                </div>
              </div>

              {/* Loading Text */}
              <div className="space-y-3">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Loading Your Application</h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Retrieving your financing status from Firestore...</p>
              </div>

              {/* Loading Bar */}
              <div className="w-full max-w-xs">
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-red-600 via-red-500 to-red-600 rounded-full" style={{animation: 'slide-in 2s ease-in-out infinite'}}></div>
                </div>
              </div>

              {/* Loading Steps */}
              <div className="grid grid-cols-3 gap-4 max-w-sm">
                <div className="flex flex-col items-center slide-animation" style={{animationDelay: '0s'}}>
                  <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-sm mb-2">1</div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Auth Check</p>
                </div>
                <div className="flex flex-col items-center slide-animation" style={{animationDelay: '0.3s'}}>
                  <div className="w-10 h-10 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-black text-sm mb-2 pulse-animation">2</div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Fetching Data</p>
                </div>
                <div className="flex flex-col items-center slide-animation" style={{animationDelay: '0.6s'}}>
                  <div className="w-10 h-10 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-black text-sm mb-2">3</div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Decrypting</p>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className={`border border-red-600/50 bg-red-600/10 p-8 rounded-lg text-center`}>
            <p className="text-base font-bold uppercase tracking-[0.14em] text-red-400">{error}</p>
          </div>
        ) : statusData?.status?.toLowerCase() === 'completed' ? (
          // Completed State - Unit Ready for Release View
          <div className="relative flex flex-col items-start justify-start overflow-hidden">
            <div className="pointer-events-none absolute right-0 top-0 -z-10 h-full w-1/2 translate-x-24 -skew-x-12 bg-red-600/5" />

            <div className="w-full max-w-5xl mx-auto">
              {/* Header Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 border border-slate-800 bg-slate-900/60 backdrop-blur-sm rounded-lg overflow-hidden">
                {/* Left - Image */}
                <div className="group relative min-h-64 md:min-h-full bg-slate-800">
                  <img
                    className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
                    alt="Ready for release motorcycle"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuChRzd7zwwLzJTjJ0Umhp_tJJmKGQlJPYMsWpiX9RkJQbypU6gbiEyZNCzxVv5Bs7q_VA7ngHFsu_L4-6CRQiXW48bhpgZkuEkIMsLfmb50ZaSS3NYCUOQINERkcjQVIaE_2FTwmLSKS2IfrpB5hPmXMAf9zaai1gRFv6wt-ve90qOTkd9LFQRl284VQE0mUeiHIUBH6AgEuulI4eNcMfi2f4xgmN5OgwAXJduCRUsivtn3-cKyagpsgK4AARdQYyJt0Lu2DRtgTGk"
                  />
                  <div className="absolute inset-0 bg-red-600/20 mix-blend-multiply" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="mb-4 text-sm font-black uppercase tracking-widest text-red-400">Ready for</p>
                      <h2 className="text-5xl font-black italic leading-tight text-white">RELEASE</h2>
                    </div>
                  </div>
                </div>

                {/* Right - Status */}
                <div className="flex flex-col justify-center p-8 md:p-10">
                  <div className="mb-8">
                    <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-3">Completion Status</p>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-300">Verification Status</span>
                        <span className="text-2xl font-black text-green-400">100%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-linear-to-r from-red-600 to-red-500 w-full rounded-full" />
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-green-500 bg-slate-800/50 p-4 rounded-r-lg mb-6">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference ID</p>
                    <p className="font-mono text-lg font-bold tracking-tight text-green-400">
                      {trackedReferenceId || 'REF-COMPLETED'}
                    </p>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    All technical inspections, documentation, and compliance checks are completed. Your motorcycle is waiting at the apex.
                  </p>
                </div>
              </div>

              {/* Application Journey */}
              <div className="mb-12 border border-slate-800 bg-slate-900/60 backdrop-blur-sm rounded-lg p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8">Application Journey</h3>
                
                <div className="flex items-center justify-between mb-6">
                  {[
                    { label: 'INQUIRY', completed: true },
                    { label: 'FINANCING APPROVED', completed: true },
                    { label: 'DOCUMENT REVIEW', completed: true },
                    { label: 'FINAL', completed: true, active: true }
                  ].map((stage, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-3 transition-all ${
                        stage.active 
                          ? 'border-red-600 bg-red-600 shadow-lg shadow-red-600/50'
                          : stage.completed
                          ? 'border-green-500 bg-green-500/20'
                          : 'border-slate-600 bg-slate-800'
                      }`}>
                        {stage.completed ? (
                          <CheckIcon sx={{ fontSize: 20 }} className={stage.active ? 'text-white' : 'text-green-400'} />
                        ) : (
                          <span className="text-sm font-bold text-slate-300">{idx + 1}</span>
                        )}
                      </div>
                      <p className={`text-xs font-black uppercase tracking-tight text-center leading-tight ${
                        stage.active ? 'text-red-600' : stage.completed ? 'text-green-400' : 'text-slate-500'
                      }`}>
                        {stage.label}
                      </p>
                      {idx < 3 && (
                        <div className={`absolute w-[calc(25%-20px)] h-1 top-10.5 ml-[calc(12.5%+20px)] ${
                          stage.completed ? 'bg-green-500' : 'bg-slate-700'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dealership Visit & Final Signatures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Dealership Visit */}
                <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-sm rounded-lg p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-600 flex items-center justify-center shrink-0">
                      <span className="text-lg font-black text-red-600">01</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white mb-1">Dealership Visit</h4>
                      <p className="text-xs text-slate-400">Visit our showroom to inspect and finalize</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Visit us in person to inspect your selected motorcycle unit, review final paperwork, and complete the transfer process.
                  </p>
                </div>

                {/* Final Signatures */}
                <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-sm rounded-lg p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-600 flex items-center justify-center shrink-0">
                      <span className="text-lg font-black text-red-600">02</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white mb-1">Final Signatures</h4>
                      <p className="text-xs text-slate-400">Sign the transfer process documents</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Three physical documents need to be signed to complete the transfer process and finalize your purchase.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  onClick={() => {
                    // Clear state IMMEDIATELY before navigation to prevent showing stale completed view
                    setStatusData(null)
                    setApplicationId(null)
                    setTrackedReferenceId('')
                    setError('')
                    setConversationMessages([])
                    if (typeof onNavigateToFinancingStatus === 'function') {
                      onNavigateToFinancingStatus()
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-sm bg-red-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-red-700 active:scale-95"
                >
                  Track My Status
                  <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
                </button>
                <button
                  onClick={onNavigateToShowroom}
                  className="flex items-center justify-center gap-2 rounded-sm border border-slate-700 bg-transparent px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-300 transition hover:border-red-600 hover:text-red-600"
                >
                  Back to Showroom
                </button>
              </div>

              <p className="mt-8 text-[10px] text-center text-slate-500 uppercase tracking-widest">
                Financing by Yamaha Motor Finance • Licensed & Insured
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Page Header */}
            <section>
              <div className="flex flex-col gap-2 border-b border-slate-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-600">Application Tracking</p>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white">Financing Status</h2>
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Reference: <span className="text-red-600 font-black">{trackedReferenceId || 'N/A'}</span>
                </div>
              </div>
            </section>

            {/* Status Grid - Left Sidebar + Main Content */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Sidebar - Chat */}
              <aside className="lg:col-span-4">
                <div className={`space-y-4 border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm rounded-lg`}>
                  {/* Recent Applications List */}
                  {allApplications.length > 0 && (
                    <div className="space-y-3 border-b border-slate-800 pb-4">
                      <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Your Applications ({allApplications.length})</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {allApplications.map((app) => (
                          <button
                            key={app.id}
                            onClick={() => handleSelectApplication(app)}
                            disabled={isLoading}
                            className={`w-full p-3 rounded-sm text-left transition ${
                              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                            } ${
                              trackedReferenceId === app.referenceId
                                ? 'bg-red-600/20 border border-red-600/50'
                                : 'bg-slate-800/50 border border-slate-700/50 hover:border-red-600/50'
                            }`}
                          >
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{app.referenceId}</p>
                            <p className="text-xs font-bold text-white mt-1">{app.motorcycleName || 'Motorcycle'}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className={`text-[9px] font-semibold uppercase tracking-widest ${
                                app.status === 'approved' ? 'text-green-500' :
                                app.status === 'rejected' ? 'text-red-500' :
                                app.status === 'reviewing' || app.status === 'under review' ? 'text-blue-500' : 'text-slate-400'
                              }`}>
                                {app.status?.toUpperCase()}
                              </p>
                              <p className={`text-[9px] font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>{app.submittedAt}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reference Lookup */}
                  <div className="space-y-3 border-b border-slate-800 pb-4">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Lookup Reference</label>
                    <input
                      className={`w-full border border-slate-700 bg-slate-800/50 py-2 px-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-red-600/50 rounded-sm ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}
                      placeholder="Enter Reference ID"
                      type="text"
                      value={trackedReferenceId}
                      onChange={(e) => setTrackedReferenceId(e.target.value)}
                    />
                    <button 
                      onClick={handleRefreshStatus}
                      disabled={isLoading}
                      className={`w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 text-[10px] font-black uppercase tracking-[0.18em] transition rounded-sm`}
                    >
                      {isLoading ? 'Refreshing...' : 'Refresh Status'}
                    </button>
                  </div>

                  {/* Chat Box */}
                  <div className={`border border-slate-800 rounded-lg overflow-hidden flex flex-col`} style={{height: '500px'}}>
                    <div className={`p-4 border-b border-slate-800 flex items-center justify-between`}>
                      <h3 className="text-white font-black italic uppercase tracking-tight text-sm">Direct Response</h3>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">Online</span>
                      </div>
                    </div>

                    <div className="grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {conversationMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm text-center">
                          <p>No messages yet. Start a conversation!</p>
                        </div>
                      ) : (
                        conversationMessages.map((msg) => (
                          <div key={msg.id} className={`flex flex-col ${msg.senderType === 'customer' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-xs p-3 rounded-lg ${msg.senderType === 'customer' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                              <p className="text-sm">{msg.message}</p>
                            </div>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                              {msg.timestamp?.toLocaleTimeString?.('en-US', { hour: '2-digit', minute: '2-digit' }) || ''}
                            </p>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className={`p-3 border-t border-slate-800 flex gap-2`}>
                      <input
                        className={`flex-1 bg-slate-800/50 border border-slate-700 text-white text-sm py-2 px-3 focus:border-red-600/50 outline-none rounded-sm`}
                        placeholder="Type message..."
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={isMessageLoading || !messageInput.trim()}
                        className={`bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition rounded-sm`}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content - Status Details */}
              <div className="lg:col-span-8 space-y-6">
                {isLoading && !statusData ? (
                  <div className={`border border-slate-800 bg-slate-900/60 p-12 backdrop-blur-sm rounded-lg text-center`}>
                    <div className="inline-block">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                    </div>
                    <p className="text-slate-400 text-sm">Loading application details...</p>
                  </div>
                ) : error ? (
                  <div className={`border border-red-600/50 bg-red-600/10 p-6 backdrop-blur-sm rounded-lg`}>
                    <p className="text-red-400 font-semibold">Error Loading Application</p>
                    <p className="text-red-300 text-sm mt-2">{error}</p>
                    <button 
                      onClick={handleRefreshStatus}
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-black uppercase rounded-sm transition"
                    >
                      Try Again
                    </button>
                  </div>
                ) : statusData ? (
                  <>
                    {/* Application Card */}
                    <div className={`border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm rounded-lg`}>
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-600 mb-2">Current Application</p>
                          <h3 className="text-2xl font-black uppercase tracking-tight text-white">{statusData?.motorcycleName || 'Motorcycle'}</h3>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Submitted on {statusData?.submittedAt || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold uppercase ${statusData?.status === 'approved' ? 'text-green-500' : statusData?.status === 'rejected' ? 'text-red-500' : 'text-blue-500'}`}>
                            {statusData?.status?.toUpperCase() || 'PENDING'}
                          </div>
                          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Stage {getStageFromStatus(statusData?.status) || 1} of 4
                          </p>
                        </div>
                      </div>

                      {/* Progress Timeline */}
                      <div className="relative py-8 mb-6">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2"></div>
                        <div className="absolute top-1/2 left-0 h-0.5 bg-red-600 -translate-y-1/2" style={{width: `${((getStageFromStatus(statusData?.status) || 1) / 4) * 100}%`}}></div>
                        
                        <div className="relative flex justify-between items-center">
                          {['Submitted', 'Reviewing', 'Approved', 'Completed'].map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                              <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm ${idx < (getStageFromStatus(statusData?.status) || 1) ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                {idx < (getStageFromStatus(statusData?.status) || 1) ? '✓' : idx + 1}
                              </div>
                              <p className={`text-[9px] font-bold uppercase tracking-widest mt-2 ${idx < (getStageFromStatus(statusData?.status) || 1) ? 'text-red-600' : 'text-slate-400'}`}>{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className={`grid md:grid-cols-2 gap-4 border-t border-slate-800 pt-6`}>
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Next Steps</p>
                          <p className="text-sm leading-relaxed text-slate-300">
                            {getStatusMessage(statusData?.status)}
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className={`bg-slate-800/50 p-3 flex items-center gap-3 rounded-sm`}>
                            <div className="text-red-600 font-black text-lg">📄</div>
                            <div>
                              <p className={`text-[9px] font-bold uppercase tracking-[0.15em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Current Task</p>
                              <p className="text-xs font-bold">{getCurrentTask(statusData?.status)}</p>
                            </div>
                          </div>
                          <div className={`bg-slate-800/50 p-3 flex items-center gap-3 rounded-sm`}>
                            <div className="text-red-600 font-black text-lg">⏰</div>
                            <div>
                              <p className={`text-[9px] font-bold uppercase tracking-[0.15em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Est. Completion</p>
                              <p className="text-xs font-bold">{statusData?.estimatedDate || '5 Business Days'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm rounded-lg`}>
                        <p className={`text-[9px] font-black uppercase tracking-[0.18em] mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Credit Score</p>
                        <p className="text-lg font-black text-green-500">VERIFIED</p>
                      </div>
                      <div className={`border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm rounded-lg`}>
                        <p className={`text-[9px] font-black uppercase tracking-[0.18em] mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Allocation</p>
                        <p className="text-lg font-black text-green-500">RESERVED</p>
                      </div>
                    </div>

                    {/* Unit Specs */}
                    {statusData?.motorcycleName && (
                      <div className={`border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm rounded-lg`}>
                        <h3 className={`text-sm font-black uppercase tracking-[0.22em] mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Selected Unit Details</h3>
                        
                        {/* Image Section */}
                        {statusData?.motorcycleImageUrl && (
                          <div className="mb-6 rounded-lg overflow-hidden border border-slate-800">
                            <img
                              src={statusData?.motorcycleImageUrl}
                              alt={statusData?.motorcycleName}
                              className="w-full h-64 object-cover"
                            />
                          </div>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Model</p>
                            <p className="font-bold text-white">{statusData?.motorcycleName}</p>
                          </div>
                          <div>
                            <p className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Price (MSRP)</p>
                            <p className="font-bold text-white">
                              {statusData?.motorcyclePrice 
                                ? `₱${new Intl.NumberFormat('en-PH').format(statusData?.motorcyclePrice)}` 
                                : 'Contact Dealer'}
                            </p>
                          </div>
                          <div>
                            <p className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Down Payment</p>
                            <p className="font-bold text-white">
                              {statusData?.downPaymentAmount 
                                ? `₱${new Intl.NumberFormat('en-PH').format(statusData?.downPaymentAmount)}` 
                                : statusData?.downPaymentPercent
                                ? `${statusData?.downPaymentPercent}%`
                                : 'TBD'}
                            </p>
                          </div>
                          <div>
                            <p className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Monthly Payment</p>
                            <p className="font-bold text-red-600">
                              {statusData?.monthlyAmortization 
                                ? `₱${new Intl.NumberFormat('en-PH').format(statusData?.monthlyAmortization)}`
                                : 'TBD'}
                            </p>
                          </div>
                          <div>
                            <p className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Term</p>
                            <p className="font-bold text-white">
                              {statusData?.paymentTerm ? `${statusData?.paymentTerm} months` : 'TBD'}
                            </p>
                          </div>
                          <div>
                            <p className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Interest Rate</p>
                            <p className="font-bold text-white">
                              {statusData?.interestRate 
                                ? `${statusData?.interestRate}% p.a.` 
                                : statusData?.apr
                                ? `${statusData?.apr}% APR`
                                : 'TBD'}
                            </p>
                          </div>
                        </div>

                        {/* Additional Info */}
                        {statusData?.totalLoanAmount && (
                          <div className={`mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4`}>
                            <div>
                              <p className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Loan Amount</p>
                              <p className="font-bold text-white">₱{new Intl.NumberFormat('en-PH').format(statusData?.totalLoanAmount)}</p>
                            </div>
                            {statusData?.totalInterest && (
                              <div>
                                <p className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Interest</p>
                                <p className="font-bold text-white">₱{new Intl.NumberFormat('en-PH').format(statusData?.totalInterest)}</p>
                              </div>
                            )}
                            {statusData?.totalPayment && (
                              <div>
                                <p className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Payment</p>
                                <p className="font-bold text-white">₱{new Intl.NumberFormat('en-PH').format(statusData?.totalPayment)}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`border border-slate-800 bg-slate-900/60 p-12 backdrop-blur-sm rounded-lg text-center`}>
                    <p className="text-slate-400 text-sm">Select an application to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
