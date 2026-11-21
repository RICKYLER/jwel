import { useEffect, useState } from 'react'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import CheckIcon from '@mui/icons-material/Check'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../firebase'

export default function ApprovedApplicationPage({ referenceId, motorcycleName, applicationStatus, onNavigateToShowroom, onTrackApplication }) {
  const [status, setStatus] = useState(applicationStatus || 'approved')
  const [isLoading, setIsLoading] = useState(!applicationStatus)

  // Fetch the latest status from Firebase if not provided
  useEffect(() => {
    if (applicationStatus) {
      setStatus(applicationStatus)
      return
    }

    if (!referenceId) return

    const fetchStatus = async () => {
      try {
        setIsLoading(true)
        const getStatus = httpsCallable(functions, 'getFinancingApplicationStatus')
        const result = await getStatus({ referenceId })
        if (result?.data?.status) {
          setStatus(result.data.status)
        }
      } catch (error) {
        console.error('Error fetching status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()
  }, [referenceId, applicationStatus])

  // Check if application is completed (stage 4)
  const isCompleted = status?.toLowerCase() === 'completed'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-['Manrope'] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
          <p className="text-slate-400">Loading application status...</p>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-['Manrope']">
        <main className="relative flex min-h-screen flex-col items-start justify-start overflow-hidden px-4 py-12">
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
                    {referenceId || 'REF-COMPLETED'}
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
              
              <div className="relative mb-6 grid grid-cols-4 px-1 sm:px-4">
                <div className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-green-500/70" aria-hidden="true" />
                {[
                  { label: 'INQUIRY', completed: true },
                  { label: 'FINANCING APPROVED', completed: true },
                  { label: 'DOCUMENT REVIEW', completed: true },
                  { label: 'FINAL', completed: true, active: true }
                ].map((stage, idx) => (
                  <div key={idx} className="relative z-10 flex min-w-0 flex-col items-center">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
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
                      <p className={`mt-3 max-w-[120px] text-center text-[10px] font-black uppercase leading-tight tracking-[0.08em] sm:text-xs sm:tracking-tight ${
                        stage.active ? 'text-red-600' : stage.completed ? 'text-green-400' : 'text-slate-500'
                      }`}>
                        {stage.label}
                      </p>
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
                onClick={(e) => {
                  e.preventDefault()
                  console.log('TRACK MY STATUS clicked, referenceId:', referenceId, 'callback:', typeof onTrackApplication)
                  if (typeof onTrackApplication === 'function') {
                    onTrackApplication()
                  } else {
                    console.error('onTrackApplication is not a function')
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
        </main>
      </div>
    )
  }

  // Original approved view
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-['Manrope']">
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-20">
        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-full w-1/2 translate-x-24 -skew-x-12 bg-red-600/5" />

        <div className="grid w-full max-w-4xl items-stretch border border-slate-800 bg-slate-900/60 shadow-[0px_20px_40px_rgba(0,0,0,0.3)] backdrop-blur-sm rounded-lg md:grid-cols-2 overflow-hidden">
          {/* Left side - Image */}
          <div className="group relative min-h-64 overflow-hidden md:min-h-full bg-slate-800">
            <img
              className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
              alt="Close-up of a sleek red sportbike fuel tank with chrome Yamaha badge"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuChRzd7zwwLzJTjJ0Umhp_tJJmKGQlJPYMsWpiX9RkJQbypU6gbiEyZNCzxVv5Bs7q_VA7ngHFsu_L4-6CRQiXW48bhpgZkuEkIMsLfmb50ZaSS3NYCUOQINERkcjQVIaE_2FTwmLSKS2IfrpB5hPmXMAf9zaai1gRFv6wt-ve90qOTkd9LFQRl284VQE0mUeiHIUBH6AgEuulI4eNcMfi2f4xgmN5OgwAXJduCRUsivtn3-cKyagpsgK4AARdQYyJt0Lu2DRtgTGk"
            />
            <div className="absolute inset-0 bg-red-600/20 mix-blend-multiply" />
            <div className="absolute bottom-0 left-0 p-8">
              <span className="mb-2 inline-block bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white rounded-sm">Approved</span>
              <h2 className="text-4xl font-black italic leading-none tracking-tighter text-white">{motorcycleName || 'YAMAHA BIKE'}</h2>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
            <div className="mb-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center bg-linear-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                  <CheckCircleRoundedIcon sx={{ fontSize: 36 }} className="text-white" />
                </div>
                <h1 className="text-3xl font-black italic uppercase leading-none tracking-tighter md:text-4xl">
                  Application
                  <br />
                  Approved
                </h1>
              </div>

              <div className="border-l-4 border-green-500 bg-slate-800/50 p-4 rounded-r-lg">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference ID</p>
                <p className="font-mono text-lg font-bold tracking-tight text-green-400">
                  {referenceId || 'REF-APPROVED'}
                </p>
              </div>
            </div>

            <div className="mb-10 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-red-600">What's Next</h3>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full" />
                  <div className="mt-1 h-12 w-0.5 bg-slate-700" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300">Congratulations!</p>
                  <p className="mt-1 text-sm text-slate-400">Your financing application has been approved. You can now proceed to complete the paperwork and financing agreement.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 bg-slate-600 rounded-full" />
                  <div className="mt-1 h-12 w-0.5 bg-slate-700" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300">Review Terms & Conditions</p>
                  <p className="mt-1 text-sm text-slate-400">Our team will contact you shortly with the final financing agreement details and next steps.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 bg-slate-600 rounded-full" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300">Complete & Sign</p>
                  <p className="mt-1 text-sm text-slate-400">Sign the financing agreement and we'll process your bike release immediately.</p>
                </div>
              </div>
            </div>

            <div className="mb-8 space-y-4 border-t border-slate-700 pt-8">
              <div className="flex items-start gap-3">
                <TrendingUpRoundedIcon sx={{ fontSize: 20 }} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Approval Savings</p>
                  <p className="text-lg font-black text-white mt-1">Instant Payment Processing</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  console.log('Track Application clicked, referenceId:', referenceId, 'callback:', typeof onTrackApplication)
                  if (typeof onTrackApplication === 'function') {
                    onTrackApplication()
                  } else {
                    console.error('onTrackApplication is not a function')
                  }
                }}
                className="flex items-center justify-center gap-2 rounded-sm bg-red-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-red-700 active:scale-95"
              >
                Track Application
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
      </main>
    </div>
  )
}
