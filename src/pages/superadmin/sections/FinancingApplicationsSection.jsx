import { useState } from 'react'
import './FinancingApplicationsSection.css'

export default function FinancingApplicationsSection({
  applications,
  canEditOperations,
  financingStatusOptions,
  handleCollectionUpdate,
  formatCurrency,
  formatDate,
  getStatusClasses,
  isDarkMode = true,
}) {
  const [selectedApplication, setSelectedApplication] = useState(null)

  return (
    <section className={`financing-applications-section rounded-xl p-6 ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-['Epilogue'] text-xl font-extrabold uppercase italic tracking-tighter">
            Financing Applications
          </h3>
          <p className="text-sm text-white/40">Realtime queue from financingApplications collection.</p>
        </div>
        <div className="rounded-full bg-white/5 px-4 py-2 text-xs font-bold text-white/70">
          {applications.length} synced applications
        </div>
      </div>

      <div className="grid gap-4">
        {applications.map((application) => {
          const normalizedStatus = application.status
            ? String(application.status).charAt(0).toUpperCase() + String(application.status).slice(1)
            : 'Submitted'

          return (
            <article
              key={application.id}
              className="financing-applications-card grid gap-4 rounded-2xl p-4 lg:grid-cols-[1.1fr_1fr_0.9fr] lg:items-center"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">{application.referenceId || application.id}</p>
                <h4 className="mt-2 text-lg font-bold text-white">{application.applicant?.fullName || 'Unknown Applicant'}</h4>
                <p className="text-sm text-white/60">{application.submittedBy?.email || 'No email'}</p>
                <p className="mt-1 text-xs text-white/40">
                  Submitted {formatDate(application.createdAt)}
                </p>
              </div>

              <div className="space-y-2 text-sm text-white/70">
                <p>
                  Unit: <span className="font-semibold text-white">{application.motorcycle?.name || 'N/A'}</span>
                </p>
                <p>
                  Unit Price: <span className="font-semibold text-white">{formatCurrency(application.motorcycle?.price || 0)}</span>
                </p>
                <p>
                  Monthly: <span className="font-semibold text-white">{formatCurrency(application.terms?.monthlyAmortization || 0)}</span>
                </p>
              </div>

              <div className="space-y-2">
                <select
                  value={normalizedStatus}
                  onChange={(event) =>
                    handleCollectionUpdate('financingApplications', application.id, {
                      status: String(event.target.value || 'Submitted').toLowerCase(),
                    })
                  }
                  disabled={!canEditOperations}
                  className="w-full rounded-xl border border-white/10 bg-[#101010] px-3 py-2 text-sm text-white outline-none disabled:opacity-70"
                >
                  {financingStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getStatusClasses(normalizedStatus)}`}>
                  {normalizedStatus}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedApplication(application)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:border-red-600/40 hover:bg-red-600/10"
                >
                  View Details
                </button>
              </div>
            </article>
          )
        })}

        {!applications.length && (
          <div className="rounded-2xl p-8 text-center text-white/50">
            No financing applications found yet.
          </div>
        )}
      </div>

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedApplication(null)}>
          <div
            className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">Application Details</p>
                <h4 className="mt-1 font-['Epilogue'] text-xl font-black uppercase tracking-tight text-white">
                  {selectedApplication.referenceId || selectedApplication.id}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:border-red-600 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Applicant</p>
                <p className="mt-2 text-base font-bold text-white">{selectedApplication.applicant?.fullName || 'N/A'}</p>
                <p className="mt-1 text-sm text-white/70">{selectedApplication.submittedBy?.email || 'N/A'}</p>
                <p className="mt-1 text-sm text-white/70">{selectedApplication.applicant?.contactNumber || 'No contact number'}</p>
                <p className="mt-2 text-xs text-white/60">{selectedApplication.applicant?.address || 'No address provided'}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Motorcycle</p>
                <p className="mt-2 text-base font-bold text-white">{selectedApplication.motorcycle?.name || 'N/A'}</p>
                <p className="mt-1 text-sm text-white/70">Price: {formatCurrency(selectedApplication.motorcycle?.price || 0)}</p>
                {selectedApplication.motorcycle?.imageUrl && (
                  <img
                    src={selectedApplication.motorcycle.imageUrl}
                    alt={selectedApplication.motorcycle?.name || 'Motorcycle'}
                    className="mt-3 h-24 w-full rounded-lg object-contain bg-[#0b1220]"
                  />
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Financing Terms</p>
                <p className="mt-2 text-sm text-white/80">Down Payment: {selectedApplication.terms?.downPaymentPercent || 0}%</p>
                <p className="text-sm text-white/80">Term: {selectedApplication.terms?.paymentTerm || 0} months</p>
                <p className="text-sm text-white/80">Income: {selectedApplication.terms?.incomeRange || 'N/A'}</p>
                <p className="text-sm text-white/80">Monthly: {formatCurrency(selectedApplication.terms?.monthlyAmortization || 0)}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Processing</p>
                <p className="mt-2 text-sm text-white/80">Submitted: {formatDate(selectedApplication.createdAt)}</p>
                <p className="text-sm text-white/80">Updated: {formatDate(selectedApplication.updatedAt)}</p>
                <p className="mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase text-white/90">
                  {String(selectedApplication.status || 'submitted')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
