import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, functions, storage } from '../../firebase'
import NavHeaderCustomer from './components/NavHeaderCustomer'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'

export default function ConfirmApplicationPage({ currentUser, applicationData, onNavigateBack, onSignOut, onApplicationSubmitted, onNavigateToFinancingStatus, onNavigateToMessages, onNavigateToService, onNavigateToServiceBookings }) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [unreadNotifications] = useState([
    { id: 1, title: 'Application Confirmation', message: 'Please review and confirm your financing application', timestamp: 'Just now', read: false },
  ])

  if (!applicationData) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-['Manrope']">
        <NavHeaderCustomer
          currentUser={currentUser}
          isDarkMode={isDarkMode}
          activePage="financing"
          unreadNotifications={unreadNotifications}
          onNavigateToShowroom={onNavigateBack}
          onNavigateToService={onNavigateToService}
          onNavigateToFinancing={onNavigateBack}
          onNavigateToFinancingStatus={() => {}}
          onNavigateToMessages={onNavigateToMessages}
          onNavigateToProfile={() => {}}
          onNavigateToServiceBookings={onNavigateToServiceBookings}
          onSignOut={currentUser ? onSignOut : null}
        />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-slate-400">No application data available</p>
            <button
              onClick={onNavigateBack}
              className="mt-6 px-6 py-3 bg-red-600 text-white font-bold uppercase rounded hover:bg-red-700 transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { motorcycle, applicant, terms } = applicationData

  const handleConfirmSubmit = async () => {
    setSubmitError('')
    setIsSubmitting(true)

    try {
      let identityFileUrl = ''

      // Upload identity file to Storage if it exists
      if (applicant.identityFile && applicant.identityFile instanceof File) {
        const timestamp = Date.now()
        const fileName = `${timestamp}-${applicant.identityFile.name}`
        const storageRef = ref(storage, `financing/${currentUser?.uid}/${fileName}`)
        
        const snapshot = await uploadBytes(storageRef, applicant.identityFile)
        identityFileUrl = await getDownloadURL(snapshot.ref)
      }

      const submitFinancingApplication = httpsCallable(functions, 'submitFinancingApplication')
      const result = await submitFinancingApplication({
        motorcycle,
        applicant: {
          fullName: applicant.fullName,
          contactNumber: applicant.contactNumber,
          address: applicant.address,
          email: applicant.email,
          uid: applicant.uid,
          identityFileName: applicant.identityFileName,
          identityFileUrl: identityFileUrl,
        },
        terms,
      })

      const referenceId = result?.data?.referenceId || 'REF-PENDING'
      
      // Navigate to success page
      if (onNavigateToFinancingStatus) {
        onNavigateToFinancingStatus(referenceId)
      } else if (onApplicationSubmitted) {
        onApplicationSubmitted(referenceId)
      }
    } catch (error) {
      const message = error?.message || 'Unable to submit application. Please try again.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
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
        onNavigateToFinancing={onNavigateBack}
        onNavigateToFinancingStatus={() => {}}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToProfile={() => {}}
        onNavigateToServiceBookings={onNavigateToServiceBookings}
        onSignOut={currentUser ? handleLogout : null}
      />

      {/* Hero Section */}
      <section className="relative h-64 sm:h-80 overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
            alt="close-up of a high-performance Yamaha superbike engine"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI3sKI1gj8VA_OeGEgu-OssNmJL5BudoDQH4iH0bj6-UrXXYzvf_FWakNI1cY3VCg8qjH-v4w2h02h78bAS_UYby4h0BUqyCJ6o15oxQHSi5UUjGTcQuQW111aHk8v2FTu4L3UwdjcUxsew2clNk8zoHWjTuzmPtTzsWQSBdi39E3JusJC1_cBowiuiyHisZi_BLlcfd6wUqfSDKE_kjV8_OmpX5zuqN3oA-uhUWfvNSkcDhpsTz1TiedsTNhPv7nEvowVGWbcaSSp"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-black/10" />
        </div>
        <div className="relative h-full flex flex-col justify-center px-4 sm:px-8 md:px-16 max-w-7xl mx-auto">
          <span className="text-red-600 font-bold tracking-[0.2em] uppercase text-xs mb-4">Confirmation</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tighter text-white leading-none">
            REVIEW YOUR
            <br />
            <span className="text-red-600">APPLICATION</span>
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-16 -mt-8 sm:-mt-12 pb-16 sm:pb-24 relative z-10">
        <div className="bg-slate-900/60 p-6 sm:p-8 md:p-12 border border-slate-800/30 backdrop-blur-sm rounded-lg">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 sm:mb-10">
            <span className="text-3xl sm:text-4xl font-black text-slate-700 opacity-30">01</span>
            <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight uppercase">Confirm Application Details</h2>
          </div>

          {submitError && (
            <div className="mb-6 p-4 border border-red-900 bg-red-950/40 rounded">
              <p className="text-sm font-semibold text-red-300">{submitError}</p>
            </div>
          )}

          {/* Motorcycle Selection */}
          <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800 mb-8 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Selected Unit</p>
                <h3 className="text-lg sm:text-xl font-black italic text-white">{motorcycle.name}</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">SRP ₱{(motorcycle.price || 0).toLocaleString()}</p>
              </div>
              {motorcycle.imageUrl && (
                <img
                  className="w-32 sm:w-40 h-24 sm:h-32 object-contain rounded"
                  alt={motorcycle.name}
                  src={motorcycle.imageUrl}
                />
              )}
            </div>
          </div>

          {/* Applicant Information */}
          <div className="space-y-6 mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Applicant Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Full Name</p>
                  <p className="text-sm font-bold text-white">{applicant.fullName}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Contact Number</p>
                  <p className="text-sm font-bold text-white">{applicant.contactNumber}</p>
                </div>
                <div className="sm:col-span-2 bg-slate-800/50 border border-slate-700 rounded p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Address</p>
                  <p className="text-sm font-bold text-white whitespace-normal">{applicant.address}</p>
                </div>
                <div className="sm:col-span-2 bg-slate-800/50 border border-slate-700 rounded p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Email</p>
                  <p className="text-sm font-bold text-white whitespace-normal break-all">{applicant.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financing Terms */}
          <div className="space-y-6 mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Financing Terms</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Down Payment</p>
                  <p className="text-lg font-black text-red-600">{terms.downPaymentPercent}%</p>
                  <p className="text-xs text-slate-400 mt-1">₱{terms.downPaymentAmount.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Payment Term</p>
                  <p className="text-lg font-black text-white">{terms.paymentTerm}</p>
                  <p className="text-xs text-slate-400 mt-1">months</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Remaining Balance</p>
                  <p className="text-lg font-black text-white">₱{terms.remainingBalance.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Monthly Amortization</p>
                  <p className="text-lg font-black text-green-500">₱{terms.monthlyAmortization.toLocaleString()}</p>
                </div>
                <div className="sm:col-span-2 bg-slate-800/50 border border-slate-700 rounded p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Income Range</p>
                  <p className="text-sm font-bold text-white">{terms.incomeRange}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Identity Verification */}
          <div className="space-y-4 mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Identity Document</p>
              <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircleIcon className="text-green-500" />
                  <p className="text-sm font-bold text-green-500">✓ {applicant.identityFileName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onNavigateBack}
              disabled={isSubmitting}
              className="flex-1 py-4 sm:py-5 border border-slate-700 text-slate-300 font-black italic tracking-widest uppercase hover:bg-slate-800 transition-all active:scale-[0.98] rounded flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
              Edit Application
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="flex-1 py-4 sm:py-5 bg-red-600 text-white font-black italic tracking-widest uppercase hover:bg-red-700 transition-all active:scale-[0.98] shadow-lg rounded flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              <TrendingFlatIcon sx={{ fontSize: 18 }} />
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-500 mt-6 px-4 sm:px-8">
            By confirming, you agree to our Terms & Conditions and Data Privacy Policy. Your data is encrypted and handled with precision.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 mt-12">
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
