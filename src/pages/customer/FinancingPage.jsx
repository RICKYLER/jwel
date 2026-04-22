import { useState, useEffect, useRef } from 'react'
import { signOut } from 'firebase/auth'
import { collection, doc, getDoc, onSnapshot, query } from 'firebase/firestore'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'
import { auth, db } from '../../firebase'
import NavHeaderCustomer from './components/NavHeaderCustomer'

export default function FinancingPage({ currentUser, onNavigateBack, onSignOut, productId, onNavigateToService, onNavigateToMessages, onNavigateToProfile, onNavigateToServiceBookings, onNavigateToConfirmApplication }) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [userProfileComplete, setUserProfileComplete] = useState(true)
  const [unreadNotifications] = useState([
    { id: 1, title: 'Financing Available', message: '0% APR financing up to 24 months', timestamp: 'Just now', read: false },
  ])
  const [motorcycles, setMotorcycles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [preSelectedProduct, setPreSelectedProduct] = useState(null)
  const [selectedMotorcycle, setSelectedMotorcycle] = useState('')
  const hasInitializedMotorcycleRef = useRef(false)
  const [downPaymentPercent, setDownPaymentPercent] = useState(30)
  const [paymentTerm, setPaymentTerm] = useState(24)
  const [incomeRange, setIncomeRange] = useState('₱30k - ₱50k')
  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    purok: '',
    barangay: '',
    city: '',
    province: '',
    identityFile: null,
  })
  const [identityFilePreview, setIdentityFilePreview] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [userAvatar, setUserAvatar] = useState(null)

  // Helper functions to parse and build addresses
  const parseAddress = (address) => {
    const parts = address.split('|')
    return {
      purok: parts[0]?.trim() || '',
      barangay: parts[1]?.trim() || '',
      city: parts[2]?.trim() || '',
      province: parts[3]?.trim() || '',
    }
  }

  const buildAddress = () => {
    return `${formData.purok}|${formData.barangay}|${formData.city}|${formData.province}`
  }

  // Fetch pre-selected product if productId is provided
  useEffect(() => {
    if (!productId) return

    const fetchProduct = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'inventory', productId))
        if (docSnap.exists()) {
          const data = docSnap.data()
          setPreSelectedProduct({ id: productId, ...data })
          setSelectedMotorcycle(data.name || '')
          hasInitializedMotorcycleRef.current = true
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      }
    }

    fetchProduct()
  }, [productId])

  // Fetch inventory from Firestore (motorcycles only, no spare parts)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'inventory')),
      (snapshot) => {
        const items = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            price: doc.data().price,
            imageUrl: doc.data().imageUrl,
            gallery: doc.data().gallery,
            category: doc.data().category,
            itemType: doc.data().itemType,
          }))
          .filter((item) => item.price > 0)
          .filter((item) => item.category !== 'Spare Parts' && item.itemType !== 'Spare Parts')
          .slice(0, 6)

        setMotorcycles(items)
        // Only initialize if not already set by preSelectedProduct effect
        if (items.length > 0 && !hasInitializedMotorcycleRef.current) {
          setSelectedMotorcycle(items[0].name)
          hasInitializedMotorcycleRef.current = true
        }
        setIsLoading(false)
      },
      (error) => {
        console.error('Unable to load inventory:', error)
        setMotorcycles([])
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  // Fetch user profile data and pre-fill form
  useEffect(() => {
    if (!currentUser?.uid) return

    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          
          // Pre-fill fullName from user data
          if (data?.fullName) {
            setFormData((prev) => ({ ...prev, fullName: data.fullName }))
          }
          
          // Pre-fill contactNumber if available
          if (data?.phone) {
            setFormData((prev) => ({ ...prev, contactNumber: data.phone }))
          }
          
          // Pre-fill address components if available
          if (data?.address) {
            const addressParts = parseAddress(data.address)
            setFormData((prev) => ({
              ...prev,
              purok: addressParts.purok,
              barangay: addressParts.barangay,
              city: addressParts.city,
              province: addressParts.province,
            }))
          }
          
          // Fetch user avatar
          if (data?.avatar) {
            setUserAvatar(data.avatar)
          }
          
          // Check if profile is complete
          const isComplete = data?.fullName && data?.phone && data?.address
          setUserProfileComplete(isComplete)
        } else {
          // Use display name from auth if available
          if (currentUser?.displayName) {
            setFormData((prev) => ({ ...prev, fullName: currentUser.displayName }))
          }
          setUserProfileComplete(false)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [currentUser?.uid, currentUser?.displayName])

  const selectedMotoData = preSelectedProduct || motorcycles.find((m) => m.id === productId) || motorcycles.find((m) => m.name === selectedMotorcycle) || motorcycles[0] || { name: 'Loading...', price: 0 }
  const selectedMotoPrice = selectedMotoData?.price || 1099000
  const selectedMotoImage = selectedMotoData?.imageUrl || selectedMotoData?.gallery?.[0]
  const isSingleProductMode = Boolean(productId)
  const motorcyclesToDisplay = isSingleProductMode
    ? (selectedMotoData?.name ? [selectedMotoData] : [])
    : motorcycles

  const downPaymentAmount = Math.round(selectedMotoPrice * (downPaymentPercent / 100))
  const remainingBalance = selectedMotoPrice - downPaymentAmount
  const monthlyAmortization = Math.round(remainingBalance / paymentTerm)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('File size must be less than 5MB')
        return
      }
      
      // Show preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setIdentityFilePreview(event.target.result)
        }
        reader.readAsDataURL(file)
      } else {
        // For PDFs, show file name without preview
        setIdentityFilePreview(null)
      }
      
      setFormData((prev) => ({ ...prev, identityFile: file }))
      setSubmitError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (!selectedMotoData?.id) {
      setSubmitError('Selected motorcycle is not available. Please reload and try again.')
      return
    }

    // Validate full name
    if (!formData.fullName.trim()) {
      setSubmitError('Please complete Full Name before submitting.')
      return
    }

    // Validate contact number
    if (!formData.contactNumber.trim()) {
      setSubmitError('Please complete Contact Number before submitting.')
      return
    }

    // Validate all address components
    if (!formData.purok.trim() || !formData.barangay.trim() || !formData.city.trim() || !formData.province.trim()) {
      setSubmitError('Please complete all address fields (Purok, Barangay, City, Province) before submitting.')
      return
    }

    // Validate identity file
    if (!formData.identityFile) {
      setSubmitError('Please upload a valid ID (JPG, PNG, or PDF) before submitting.')
      return
    }

    // Navigate to ConfirmApplication page with application data
    const applicationData = {
      motorcycle: {
        id: selectedMotoData.id,
        name: selectedMotoData.name || selectedMotorcycle || '',
        price: Number(selectedMotoData.price || 0),
        imageUrl: selectedMotoImage || '',
      },
      applicant: {
        fullName: formData.fullName.trim(),
        contactNumber: formData.contactNumber.trim(),
        address: buildAddress(),
        email: currentUser?.email || '',
        uid: currentUser?.uid || '',
        identityFile: formData.identityFile,
        identityFileName: formData.identityFile?.name || '',
      },
      terms: {
        downPaymentPercent,
        paymentTerm,
        incomeRange,
        downPaymentAmount,
        remainingBalance,
        monthlyAmortization,
      },
    }

    onNavigateToConfirmApplication?.(applicationData)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      if (onSignOut) onSignOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-['Manrope']">
      <NavHeaderCustomer
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        activePage="financing"
        unreadNotifications={unreadNotifications}
        onNavigateToShowroom={onNavigateBack}
        onNavigateToService={onNavigateToService}
        onNavigateToFinancing={() => {}}
        onNavigateToFinancingStatus={() => {}}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToServiceBookings={onNavigateToServiceBookings}
        onSignOut={currentUser ? handleLogout : null}
        userAvatar={userAvatar}
      />

      {/* Hero Section */}
      <section className="relative h-80 sm:h-96 overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
            alt="close-up of a high-performance Yamaha superbike engine and frame with dramatic red lighting and industrial textures"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI3sKI1gj8VA_OeGEgu-OssNmJL5BudoDQH4iH0bj6-UrXXYzvf_FWakNI1cY3VCg8qjH-v4w2h02h78bAS_UYby4h0BUqyCJ6o15oxQHSi5UUjGTcQuQW111aHk8v2FTu4L3UwdjcUxsew2clNk8zoHWjTuzmPtTzsWQSBdi39E3JusJC1_cBowiuiyHisZi_BLlcfd6wUqfSDKE_kjV8_OmpX5zuqN3oA-uhUWfvNSkcDhpsTz1TiedsTNhPv7nEvowVGWbcaSSp"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-black/10" />
        </div>
        <div className="relative h-full flex flex-col justify-center px-4 sm:px-8 md:px-16 max-w-7xl mx-auto">
          <span className="text-red-600 font-bold tracking-[0.2em] uppercase text-xs mb-4">The Precision Apex</span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black italic tracking-tighter text-white leading-none">
            ENGINEERED
            <br />
            <span className="text-red-600">FINANCING.</span>
          </h1>
        </div>
      </section>

      {/* Financing Hub */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 -mt-12 sm:-mt-16 pb-16 sm:pb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0">
          {/* Left Column: Step 1 Calculator */}
          <div className="lg:col-span-7 bg-slate-900/50 p-6 sm:p-8 md:p-12 border border-slate-800/30">
            <div className="flex items-center gap-4 mb-8 sm:mb-10">
              <span className="text-3xl sm:text-4xl font-black text-slate-700 opacity-30">01</span>
              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight uppercase">Financing Calculator</h2>
            </div>
            <form className="space-y-6 sm:space-y-8">
              {/* Motorcycle Selection */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Selected Motorcycle Unit</label>
                {isLoading ? (
                  <div className="p-4 border border-slate-700 bg-slate-900/30 rounded text-center text-slate-400 text-sm">
                    {isSingleProductMode ? 'Loading selected motorcycle...' : 'Loading available motorcycles...'}
                  </div>
                ) : motorcyclesToDisplay.length === 0 ? (
                  <div className="p-4 border border-slate-700 bg-slate-900/30 rounded text-center text-slate-400 text-sm">
                    {isSingleProductMode ? 'Selected motorcycle not found' : 'No motorcycles available'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {motorcyclesToDisplay.map((moto) => (
                      <div
                        key={moto.id}
                        onClick={() => {
                          if (!isSingleProductMode) {
                            setSelectedMotorcycle(moto.name)
                          }
                        }}
                        className={`p-4 ring-2 relative group cursor-pointer transition-all ${
                          selectedMotorcycle === moto.name || (isSingleProductMode && selectedMotoData?.id === moto.id)
                            ? 'ring-red-600 bg-red-600/10'
                            : 'ring-slate-700 bg-slate-900/30 hover:ring-slate-600'
                        }`}
                      >
                        <div className="absolute top-2 right-2">
                          {selectedMotorcycle === moto.name && <CheckCircleIcon className="text-red-600" />}
                        </div>
                        <h3 className="font-black italic text-white text-sm sm:text-base">{moto.name}</h3>
                        <p className="text-xs sm:text-sm text-slate-400">SRP ₱{(moto.price || 0).toLocaleString()}</p>
                        {(moto.imageUrl || moto.gallery?.[0]) && (
                          <img
                            className="mt-4 w-full h-24 sm:h-32 object-contain group-hover:scale-110 transition-transform opacity-80"
                            alt={moto.name}
                            src={moto.imageUrl || moto.gallery?.[0]}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Configurator Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Down Payment Option</label>
                  <div className="grid grid-cols-5 gap-1">
                    {[10, 20, 30, 40, 50].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => setDownPaymentPercent(percent)}
                        type="button"
                        className={`py-2 sm:py-3 text-xs font-bold transition-all ${
                          downPaymentPercent === percent
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-red-600 hover:text-white'
                        }`}
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Payment Term (Months)</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[12, 24, 36].map((months) => (
                      <button
                        key={months}
                        onClick={() => setPaymentTerm(months)}
                        type="button"
                        className={`py-2 sm:py-3 text-xs font-bold transition-all ${
                          paymentTerm === months
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-red-600 hover:text-white'
                        }`}
                      >
                        {months}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Monthly Income Range</label>
                <select
                  value={incomeRange}
                  onChange={(e) => setIncomeRange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-300 py-3 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                >
                  <option>₱10k - ₱20k</option>
                  <option>₱20k - ₱30k</option>
                  <option>₱30k - ₱50k</option>
                  <option>₱50k+</option>
                </select>
              </div>
            </form>

            {/* Real-time Results Banner */}
            <div className="mt-8 sm:mt-12 bg-slate-950 text-white p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 border border-slate-800">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Down Payment</p>
                <p className="text-xl sm:text-2xl font-black tracking-tight italic">₱{downPaymentAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Remaining Balance</p>
                <p className="text-xl sm:text-2xl font-black tracking-tight italic">₱{remainingBalance.toLocaleString()}</p>
              </div>
              <div className="md:border-l border-slate-700 md:pl-8">
                <p className="text-[10px] uppercase tracking-widest text-red-600 font-bold mb-1">Monthly Amortization</p>
                <p className="text-2xl sm:text-3xl font-black tracking-tighter italic text-red-600">₱{monthlyAmortization.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Step 2 Application Form */}
          <div className="lg:col-span-5 bg-slate-950 p-6 sm:p-8 md:p-12 border border-slate-800 shadow-2xl relative">
            <div className="flex items-center gap-4 mb-8 sm:mb-10">
              <span className="text-3xl sm:text-4xl font-black text-slate-700 opacity-30">02</span>
              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight uppercase">Application Form</h2>
            </div>

            {/* Profile Completion Warning */}
            {!userProfileComplete && (
              <div className="mb-6 p-4 sm:p-5 bg-amber-950/50 border border-amber-700/50 rounded-lg flex items-start gap-4">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-300 mb-2">Complete Your Profile</p>
                  <p className="text-xs text-amber-200 mb-4">Please update your personal information (Full Name, Contact Number, and Address) to proceed with financing.</p>
                  <button
                    type="button"
                    onClick={() => onNavigateToProfile?.()}
                    className="text-xs font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition underline"
                  >
                    Update Profile Now →
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Selected Motorcycle Display */}
              <div className="bg-slate-900/50 p-4 sm:p-6 rounded-lg border border-slate-800 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Unit</p>
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black italic text-white">{selectedMotoData?.name || 'Loading...'}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">SRP ₱{(selectedMotoData?.price || 0).toLocaleString()}</p>
                  </div>
                  {selectedMotoImage && (
                    <img
                      className="w-24 sm:w-32 h-20 sm:h-24 object-contain rounded"
                      alt={selectedMotoData?.name}
                      src={selectedMotoImage}
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-3 sm:p-4 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-slate-600"
                  placeholder="Johnathan Doe"
                  type="text"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Number</label>
                  <input
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-3 sm:p-4 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-slate-600"
                    placeholder="+63 900 000 0000"
                    type="tel"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Pre-filled Unit</label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 text-slate-400 p-3 sm:p-4 text-xs sm:text-sm font-bold"
                    disabled
                    type="text"
                    value={selectedMotorcycle || ''}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Purok/Street *</label>
                  <input
                    name="purok"
                    value={formData.purok}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-3 sm:p-4 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-slate-600"
                    placeholder="Purok/Street Name"
                    type="text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Barangay *</label>
                  <input
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-3 sm:p-4 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-slate-600"
                    placeholder="Barangay"
                    type="text"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">City/Municipality *</label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-3 sm:p-4 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-slate-600"
                    placeholder="City/Municipality"
                    type="text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Province *</label>
                  <input
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-3 sm:p-4 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-slate-600"
                    placeholder="Province"
                    type="text"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Terms Applied</label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 text-slate-400 p-3 sm:p-4 text-xs sm:text-sm font-bold"
                    disabled
                    type="text"
                    value={`${downPaymentPercent}% / ${paymentTerm} Months`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Income Range</label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 text-slate-400 p-3 sm:p-4 text-xs sm:text-sm font-bold"
                    disabled
                    type="text"
                    value={incomeRange}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Verify Identity (Valid ID) *</label>
                <div className="border-2 border-dashed border-slate-700 bg-slate-900 p-6 sm:p-8 text-center cursor-pointer hover:bg-slate-900/80 hover:border-red-600/50 transition-all relative group">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".jpg,.jpeg,.png,.pdf"
                  />
                  <CloudUploadIcon className="text-3xl sm:text-4xl text-slate-600 mb-2 group-hover:text-red-600" />
                  <p className="text-xs font-bold text-slate-400 uppercase">Drag & Drop or Click to Upload</p>
                  {formData.identityFile && <p className="text-[10px] text-green-500 italic mt-2">✓ {formData.identityFile.name}</p>}
                  {!formData.identityFile && <p className="text-[10px] text-slate-500 italic mt-1">JPG, PNG, PDF up to 5MB</p>}
                </div>
                
                {/* Preview Section */}
                {identityFilePreview && (
                  <div className="border border-slate-700 bg-slate-900/50 p-4 rounded">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Identity Preview</p>
                    <img src={identityFilePreview} alt="Identity Preview" className="max-w-full max-h-64 mx-auto rounded" />
                  </div>
                )}
              </div>
              <div className="pt-4 sm:pt-6">
                {submitError && (
                  <p className="mb-3 rounded border border-red-900 bg-red-950/40 px-4 py-3 text-[11px] font-semibold text-red-300">
                    {submitError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-4 sm:py-5 bg-blue-600 text-white font-black italic tracking-widest uppercase hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-4 text-xs sm:text-sm"
                >
                  Submit Application
                  <TrendingFlatIcon sx={{ fontSize: 18 }} />
                </button>
                <p className="text-[10px] text-center text-slate-500 mt-3 sm:mt-4 px-4 sm:px-8">
                  By submitting, you agree to our Terms & Conditions and Data Privacy Policy. Your data is encrypted and handled with precision.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation Modal - Removed, now navigates to ConfirmApplication page */}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-8 py-8 sm:py-12 w-full max-w-7xl mx-auto gap-8">
          <div>
            <div className="text-base sm:text-lg font-bold text-white mb-2 uppercase tracking-tighter italic">Yamaha Kinetic Edge</div>
            <div className="text-xs uppercase tracking-widest text-slate-600">© 2024 Yamaha Motor Co., Ltd. All Rights Reserved.</div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-xs uppercase tracking-widest">
            <a href="#" className="text-slate-500 hover:text-red-600 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-slate-500 hover:text-red-600 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-slate-500 hover:text-red-600 transition-colors">
              Dealer Locator
            </a>
            <a href="#" className="text-slate-500 hover:text-red-600 transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
