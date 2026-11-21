import { useMemo, useState } from 'react'
import ConfirmationModal from '../components/ConfirmationModal'

const statusLabel = (status) => {
  const value = String(status || 'submitted').toLowerCase()
  if (value === 'reviewing') return 'Under Review'
  if (value === 'approved') return 'Approved'
  if (value === 'rejected') return 'Rejected'
  if (value === 'completed') return 'Completed'
  return 'Pending Review'
}

const statusClasses = (status) => {
  const value = String(status || 'submitted').toLowerCase()

  if (value === 'approved' || value === 'completed') {
    return 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
  }

  if (value === 'rejected') {
    return 'border border-red-500/30 bg-red-500/15 text-red-300'
  }

  if (value === 'reviewing') {
    return 'border border-blue-500/30 bg-blue-500/15 text-blue-300'
  }

  return 'border border-yellow-500/30 bg-yellow-500/15 text-yellow-200'
}

const formatMoney = (value, formatter) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof formatter === 'function') return formatter(Number(value) || 0)
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? `₱${numericValue.toLocaleString('en-PH')}` : '—'
}

export default function FinancingApplicationDetailSection({
  application,
  canEditOperations,
  handleFinancingStatusUpdate,
  formatCurrency,
  formatDate,
  onBack,
  isDarkMode = true,
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [statusConfirm, setStatusConfirm] = useState({ open: false, status: null })

  const details = useMemo(() => {
    if (!application) return {}

    const applicant = application.applicant || {}
    const motorcycle = application.motorcycle || {}
    const terms = application.terms || {}
    const submittedBy = application.submittedBy || {}

    const applicantName = applicant.fullName || submittedBy.fullName || submittedBy.email || 'Unknown applicant'
    const applicantEmail = applicant.email || submittedBy.email || 'No email provided'
    const applicantPhone = applicant.contactNumber || 'Not provided'
    const applicantAddress = applicant.address || 'Not provided'
    const motorcycleName = motorcycle.name || application.motorcycleName || 'Not specified'
    const motorcyclePrice = motorcycle.price ?? application.price ?? 0
    const reference = application.referenceId || application.referenceNumber || application.refNumber || application.id || 'N/A'
    const createdAt = application.createdAt || application.submittedAt || application.updatedAt

    const incomeRange = terms.incomeRange || application.incomeRange || 'Not provided'
    const downPaymentPercent = terms.downPaymentPercent ?? application.downPaymentPercent ?? 0
    const downPaymentAmount = terms.downPaymentAmount ?? application.downPaymentAmount ?? 0
    const paymentTerm = terms.paymentTerm ?? application.paymentTerm ?? 0
    const remainingBalance = terms.remainingBalance ?? application.remainingBalance ?? 0
    const monthlyAmortization = terms.monthlyAmortization ?? application.monthlyAmortization ?? 0
    const interestRate = terms.interestRate ?? application.interestRate ?? 0
    const apr = terms.apr ?? application.apr ?? 0

    return {
      applicantName,
      applicantEmail,
      applicantPhone,
      applicantAddress,
      applicantIdentityFileName: applicant.identityFileName || 'Not provided',
      applicantIdentityFileUrl: applicant.identityFileUrl || '',
      motorcycleName,
      motorcyclePrice,
      motorcycleImageUrl: motorcycle.imageUrl || '',
      reference,
      createdAt,
      status: application.status || 'submitted',
      incomeRange,
      downPaymentPercent,
      downPaymentAmount,
      paymentTerm,
      remainingBalance,
      monthlyAmortization,
      interestRate,
      apr,
    }
  }, [application])

  if (!application) {
    return (
      <section className="space-y-4 text-white">
        <button type="button" onClick={onBack} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold hover:bg-white/10">
          Back to Applications
        </button>
        <p className="text-white/60">Application not found.</p>
      </section>
    )
  }

  const currentStatus = String(details.status || 'submitted').toLowerCase()
  const statusLocked = ['approved', 'rejected', 'completed'].includes(currentStatus)

  const updateStatus = async (status) => {
    if (!canEditOperations || !status || statusLocked) return
    setIsSaving(true)
    try {
      await handleFinancingStatusUpdate(application.id, status)
      setStatusConfirm({ open: false, status: null })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusClick = (status) => {
    if (!canEditOperations || !status || statusLocked) return
    setStatusConfirm({ open: true, status })
  }

  const confirmStatusUpdate = async () => {
    if (!statusConfirm.status || statusLocked) return
    await updateStatus(statusConfirm.status)
  }

  return (
    <section className="space-y-6 text-white">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/10"
        >
          Back to Applications
        </button>

        <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] ${statusClasses(details.status)}`}>
          {statusLabel(details.status)}
        </span>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#2d2d2e] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-white/50">Application Reference</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Financing Review
            </h2>
          </div>
          <div className="text-sm text-white/60">{details.reference}</div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-5">
            <div className="rounded-xl border border-white/10 bg-[#2a2a2b] p-4">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-lg font-black text-white">
                  {details.applicantName?.split(' ').slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'NA'}
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{details.applicantName}</p>
                  <p className="text-sm text-white/60">{details.applicantEmail}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/50">Applicant</p>
                  <p className="mt-2 text-base font-semibold text-white">{details.applicantName}</p>
                </div>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/50">Motorcycle</p>
                  <p className="mt-2 text-base font-semibold text-white">{details.motorcycleName}</p>
                </div>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/50">Requested Amount</p>
                  <p className="mt-2 text-base font-semibold text-white">{formatMoney(details.motorcyclePrice, formatCurrency)}</p>
                </div>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/50">Submitted</p>
                  <p className="mt-2 text-base font-semibold text-white">{formatDate?.(details.createdAt) || '—'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#2a2a2b] p-4">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/50">Applicant Information</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/50">Full Name</p>
                  <p className="mt-2 text-base font-semibold text-white">{details.applicantName}</p>
                </div>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/50">Contact Number</p>
                  <p className="mt-2 text-base font-semibold text-white">{details.applicantPhone}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/50">Email</p>
                  <p className="mt-2 text-base font-semibold text-white">{details.applicantEmail}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/50">Address</p>
                  <p className="mt-2 text-base font-semibold text-white">{details.applicantAddress}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#2a2a2b] p-4">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/50">Financial Details</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/50">Monthly Income</p>
                  <p className="mt-2 text-base font-semibold text-white">{details.incomeRange}</p>
                </div>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/50">Down Payment</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {details.downPaymentPercent ? `${details.downPaymentPercent}%` : '—'}
                    {details.downPaymentAmount ? ` / ${formatMoney(details.downPaymentAmount, formatCurrency)}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/50">Amortization</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {details.monthlyAmortization ? formatMoney(details.monthlyAmortization, formatCurrency) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/50">Payment Term</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {details.paymentTerm ? `${details.paymentTerm} months` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/50">Remaining Balance</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {details.remainingBalance ? formatMoney(details.remainingBalance, formatCurrency) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/50">Interest / APR</p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {details.interestRate || details.apr ? `${details.interestRate || 0}% / ${details.apr || 0}%` : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#2a2a2b] p-4">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/50">Supporting Documents</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/50">Identity Document</p>
                  {details.applicantIdentityFileUrl ? (
                    <img
                      src={details.applicantIdentityFileUrl}
                      alt="Uploaded identity document"
                      className="mt-3 h-32 w-full rounded-lg border border-white/10 object-cover"
                    />
                  ) : (
                    <p className="mt-2 text-base font-semibold text-white">{details.applicantIdentityFileName}</p>
                  )}
                </div>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/50">Motorcycle Image</p>
                  {details.motorcycleImageUrl ? (
                    <img
                      src={details.motorcycleImageUrl}
                      alt="Motorcycle preview"
                      className="mt-3 h-32 w-full rounded-lg border border-white/10 object-cover"
                    />
                  ) : (
                    <p className="mt-2 text-base font-semibold text-white">Not provided</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#2a2a2b] p-4">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/50">Application Status</p>
            <div className="mt-4 space-y-3">
              {['approved', 'rejected'].map((status) => {
                const isSelectedStatus = currentStatus === status
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusClick(status)}
                    disabled={!canEditOperations || isSaving || statusLocked || isSelectedStatus}
                    className={`w-full rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-[0.12em] transition ${
                      status === 'approved'
                        ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
                        : 'bg-red-600/20 text-red-300 hover:bg-red-600/30'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {isSelectedStatus ? `Current: ${statusLabel(status)}` : isSaving ? 'Updating...' : `Mark as ${statusLabel(status)}`}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={statusConfirm.open}
        title="Update application status"
        message={`Are you sure you want to change this financing application to ${statusLabel(statusConfirm.status)}?`}
        confirmText={`Yes, ${statusLabel(statusConfirm.status)}`}
        loadingText="Updating..."
        cancelText="Cancel"
        isDangerous={statusConfirm.status === 'rejected'}
        isDarkMode={true}
        isLoading={isSaving}
        onConfirm={confirmStatusUpdate}
        onCancel={() => setStatusConfirm({ open: false, status: null })}
      />
    </section>
  )
}
