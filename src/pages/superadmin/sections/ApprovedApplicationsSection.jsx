import { useMemo, useState } from 'react'
import './ApprovedApplicationsSection.css'

export default function ApprovedApplicationsSection({
  applications,
  canEditOperations,
  handleCollectionUpdate,
  formatCurrency,
  formatDate,
  onOpenApplication,
  isDarkMode = true,
}) {
  const [completingApplicationId, setCompletingApplicationId] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  // Filter for approved and completed applications
  const approvedApplications = useMemo(() => {
    return applications.filter((app) => {
      const status = String(app?.status || '').toLowerCase().trim()
      return status === 'approved' || status === 'completed'
    })
  }, [applications])

  const toInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return 'NA'
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('')
  }

  const handleCompleteApplication = async (application) => {
    if (!application?.id || !canEditOperations) return

    setConfirmModal({
      open: true,
      title: 'Finalize Approved Application?',
      message: `Are you sure you want to finalize this application for ${application.applicant?.fullName || 'Applicant'}? This will mark it as "Completed" and the customer will see it as finished.`,
      confirmText: 'Yes, Finalize',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await submitCompleteApplication(application)
      },
    })
  }

  const submitCompleteApplication = async (application) => {
    try {
      setCompletingApplicationId(application.id)
      setConfirmModal(null)

      await handleCollectionUpdate('financingApplications', application.id, {
        status: 'completed',
        finalizedAt: new Date().toISOString(),
      })
    } finally {
      setCompletingApplicationId(null)
    }
  }

  const handleRowClick = (application) => {
    onOpenApplication?.(application)
  }

  return (
    <section className={`approved-applications-section rounded-xl p-6 ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="mb-7 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-['Epilogue'] text-3xl font-black uppercase tracking-tight text-[#15171b]">
            Approved Applications
          </h3>
          <p className="mt-1 text-sm text-[#6a6f77]">Finalize approved financing applications and complete the process.</p>
        </div>
      </div>

      <div className="aa-stat-grid">
        <article className="aa-stat-card">
          <p className="aa-stat-label">Total Approved</p>
          <p className="aa-stat-value">{approvedApplications.length}</p>
          <span className="aa-stat-bar" />
        </article>
      </div>

      <div className="aa-review-panel mt-8">
        <div className="aa-panel-header">
          <h4>Approved Applications Ready for Finalization</h4>
          <div className="aa-panel-actions">
            <button type="button">Filter</button>
            <button type="button">Export</button>
          </div>
        </div>

        <div className="aa-table-wrap">
          <table className="aa-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Selected Unit</th>
                <th>Income &amp; Amortization</th>
                <th>Approved Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {approvedApplications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <div className="aa-applicant-cell">
                      <span className="aa-avatar">{toInitials(application.applicant?.fullName)}</span>
                      <div>
                        <p className="aa-applicant-name">{application.applicant?.fullName || 'Unknown Applicant'}</p>
                        <p className="aa-applicant-meta">{application.submittedBy?.email || 'No email'} • {application.applicant?.contactNumber || 'No contact'}</p>
                        <p className="aa-applicant-meta">{application.referenceId || application.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="aa-unit-cell">
                      {application.motorcycle?.imageUrl ? (
                        <img src={application.motorcycle.imageUrl} alt={application.motorcycle?.name || 'Unit'} />
                      ) : (
                        <div className="aa-unit-placeholder">N/A</div>
                      )}
                      <div>
                        <p className="aa-unit-name">{application.motorcycle?.name || 'N/A'}</p>
                        <p className="aa-unit-sub">{formatCurrency(application.motorcycle?.price || 0)}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="aa-income-cell">
                      <p><span>Monthly Income</span><strong>{application.terms?.incomeRange || 'N/A'}</strong></p>
                      <p><span>Downpayment</span><strong>{application.terms?.downPaymentPercent || 0}%</strong></p>
                      <p className="amortization-line"><span>Amortization</span><strong>{formatCurrency(application.terms?.monthlyAmortization || 0)} / {application.terms?.paymentTerm || 0} mo.</strong></p>
                    </div>
                  </td>
                  <td>
                    <p className="aa-date">
                      {formatDate(application.updatedAt || application.createdAt) || 'N/A'}
                    </p>
                  </td>
                  <td>
                    <div className="aa-action-cell">
                      <button
                        type="button"
                        className="aa-btn-view"
                        onClick={() => handleRowClick(application)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className={`aa-btn-complete ${application.status?.toLowerCase() === 'completed' ? 'aa-btn-completed' : ''}`}
                        disabled={!canEditOperations || completingApplicationId === application.id || application.status?.toLowerCase() === 'completed'}
                        onClick={() => void handleCompleteApplication(application)}
                      >
                        {application.status?.toLowerCase() === 'completed' ? 'Finalized' : completingApplicationId === application.id ? 'Finalizing...' : 'Finalize'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!approvedApplications.length && (
            <div className="aa-empty-state">No approved applications awaiting finalization.</div>
          )}
        </div>

        <div className="aa-panel-footer">
          <p>Showing {approvedApplications.length} approved applications</p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal?.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: isDarkMode ? '#1f2937' : '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '18px',
              fontWeight: 700,
              color: isDarkMode ? '#ffffff' : '#1f2937',
            }}>
              {confirmModal.title}
            </h3>
            <p style={{
              margin: '0 0 20px 0',
              fontSize: '14px',
              color: isDarkMode ? '#d1d5db' : '#4b5563',
              lineHeight: '1.5',
            }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: '8px 16px',
                  background: isDarkMode ? '#374151' : '#e5e7eb',
                  color: isDarkMode ? '#d1d5db' : '#1f2937',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                style={{
                  padding: '8px 16px',
                  background: '#b80012',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
