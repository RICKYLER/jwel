import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import { functions } from '../../firebase'

const statusColorByValue = {
  submitted: 'text-amber-500',
  reviewing: 'text-blue-500',
  approved: 'text-emerald-500',
  rejected: 'text-red-500',
}

export default function FinancingStatusPage({ referenceId, onNavigateToShowroom }) {
  const [isLoading, setIsLoading] = useState(true)
  const [statusData, setStatusData] = useState(null)
  const [error, setError] = useState('')
  const [trackedReferenceId, setTrackedReferenceId] = useState(referenceId || '')

  const loadStatus = async (inputReferenceId = trackedReferenceId) => {
    const normalizedReferenceId = String(inputReferenceId || '').trim().toUpperCase()
    if (!normalizedReferenceId) {
      setStatusData(null)
      setError('Reference ID is missing.')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError('')
      const getStatus = httpsCallable(functions, 'getFinancingApplicationStatus')
      const result = await getStatus({ referenceId: normalizedReferenceId })
      setStatusData(result?.data || null)
      setTrackedReferenceId(normalizedReferenceId)
    } catch (err) {
      setStatusData(null)
      setError(err?.message || 'Unable to load application status.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!referenceId) {
      setIsLoading(false)
      return
    }

    loadStatus(referenceId)
  }, [referenceId])

  const handleTrack = (e) => {
    e.preventDefault()
    loadStatus(trackedReferenceId)
  }

  const normalizedStatus = String(statusData?.status || 'submitted').toLowerCase()
  const statusClass = statusColorByValue[normalizedStatus] || 'text-slate-900'

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 to-slate-200 px-4 py-12 text-slate-900 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <button
          onClick={onNavigateToShowroom}
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 transition hover:text-red-600"
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
          Back to Showroom
        </button>

        <div className="border border-slate-300 bg-white p-6 shadow-xl sm:p-10">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">Financing Application</p>
              <h1 className="mt-2 text-3xl font-black italic uppercase tracking-tight sm:text-4xl">Status Tracker</h1>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Reference ID: {trackedReferenceId || 'N/A'}
              </p>
            </div>
            <button
              onClick={() => loadStatus(trackedReferenceId)}
              className="inline-flex items-center gap-2 border border-slate-400 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 transition hover:border-red-600 hover:text-red-600"
            >
              <AutorenewRoundedIcon sx={{ fontSize: 16 }} />
              Refresh
            </button>
          </div>

          <form onSubmit={handleTrack} className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={trackedReferenceId}
              onChange={(e) => setTrackedReferenceId(e.target.value.toUpperCase())}
              placeholder="Enter reference ID (e.g., REF-YAM-2026-1234)"
              className="w-full border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold tracking-wide text-slate-900 outline-none transition focus:border-red-600"
            />
            <button
              type="submit"
              className="bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-red-700"
            >
              Track
            </button>
          </form>

          {isLoading ? (
            <div className="border border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-600">Loading application status...</div>
          ) : error ? (
            <div className="border border-red-300 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>
          ) : statusData ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border border-slate-300 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Current Status</p>
                  <p className={`mt-2 text-2xl font-black uppercase tracking-tight ${statusClass}`}>{normalizedStatus}</p>
                </div>
                <div className="border border-slate-300 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Applicant</p>
                  <p className="mt-2 text-xl font-black tracking-tight text-slate-900">{statusData?.applicantName || 'N/A'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="border border-slate-300 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Motorcycle</p>
                  <p className="mt-2 text-sm font-extrabold uppercase tracking-wide text-slate-900">{statusData?.motorcycleName || 'N/A'}</p>
                </div>
                <div className="border border-slate-300 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Monthly Amortization</p>
                  <p className="mt-2 text-sm font-extrabold uppercase tracking-wide text-slate-900">{statusData?.monthlyAmortization || 'N/A'}</p>
                </div>
                <div className="border border-slate-300 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Submitted At</p>
                  <p className="mt-2 text-sm font-extrabold uppercase tracking-wide text-slate-900">{statusData?.submittedAt || 'N/A'}</p>
                </div>
              </div>

              <div className="border border-slate-300 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Decision Note</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{statusData?.message || 'Your application is currently under review.'}</p>
              </div>
            </div>
          ) : (
            <div className="border border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
              Enter your reference ID to check your financing application status.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
