import { useMemo } from 'react'
import './FinancingApplicationsSection.css'

export default function FinancingApplicationsSection({
  applications,
  canEditOperations,
  handleCollectionUpdate,
  formatCurrency,
  onOpenApplication,
  isDarkMode = true,
}) {
  const normalizeStatus = (status = '') => {
    const normalized = String(status || '').trim().toLowerCase()
    if (normalized === 'reviewing') return 'under-review'
    if (normalized === 'approved') return 'qualified'
    if (normalized === 'rejected') return 'not-qualified'
    return 'pending-review'
  }

  const statusBuckets = useMemo(() => {
    return applications.reduce(
      (acc, application) => {
        const key = normalizeStatus(application.status)
        acc[key] += 1
        return acc
      },
      {
        'pending-review': 0,
        'under-review': 0,
        qualified: 0,
        'not-qualified': 0,
      },
    )
  }, [applications])

  const visibleApplications = useMemo(() => applications.slice(0, 8), [applications])

  const toInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return 'NA'
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('')
  }

  const statusChipClass = (status = '') => {
    const key = normalizeStatus(status)
    if (key === 'qualified') return 'chip-qualified'
    if (key === 'under-review') return 'chip-under-review'
    if (key === 'not-qualified') return 'chip-not-qualified'
    return 'chip-pending-review'
  }

  const displayStatus = (status = '') => {
    const key = normalizeStatus(status)
    if (key === 'qualified') return 'Qualified'
    if (key === 'under-review') return 'Under Review'
    if (key === 'not-qualified') return 'Not Qualified'
    return 'Pending Review'
  }

  const handleRowClick = async (application) => {
    if (!application?.id) return

    const currentStatus = normalizeStatus(application.status)

    if (currentStatus === 'pending-review' && canEditOperations) {
      const shouldProceed =
        typeof window === 'undefined'
          ? true
          : window.confirm('Click this application proceed to under review?')

      if (!shouldProceed) return

      await handleCollectionUpdate('financingApplications', application.id, {
        status: 'reviewing',
      })

      onOpenApplication?.({
        ...application,
        status: 'reviewing',
      })
      return
    }

    onOpenApplication?.(application)
  }

  return (
    <section className={`financing-applications-section rounded-xl p-6 ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="mb-7 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-['Epilogue'] text-3xl font-black uppercase tracking-tight text-[#15171b]">
            Financing Review &amp; Response
          </h3>
          <p className="mt-1 text-sm text-[#6a6f77]">Manage and process motorcycle credit applications with precision.</p>
        </div>
      </div>

      <div className="fa-stat-grid">
        <article className="fa-stat-card">
          <p className="fa-stat-label">Pending Review</p>
          <p className="fa-stat-value">{statusBuckets['pending-review']}</p>
          <span className="fa-stat-bar bar-pending" />
        </article>
        <article className="fa-stat-card">
          <p className="fa-stat-label">Under Review</p>
          <p className="fa-stat-value">{statusBuckets['under-review']}</p>
          <span className="fa-stat-bar bar-review" />
        </article>
        <article className="fa-stat-card">
          <p className="fa-stat-label">Qualified</p>
          <p className="fa-stat-value">{statusBuckets.qualified}</p>
          <span className="fa-stat-bar bar-qualified" />
        </article>
        <article className="fa-stat-card">
          <p className="fa-stat-label">Not Qualified</p>
          <p className="fa-stat-value">{statusBuckets['not-qualified']}</p>
          <span className="fa-stat-bar bar-rejected" />
        </article>
      </div>

      <div className="fa-review-panel mt-8">
        <div className="fa-panel-header">
          <h4>Recent Applications</h4>
          <div className="fa-panel-actions">
            <button type="button">Filter</button>
            <button type="button">Export</button>
          </div>
        </div>

        <div className="fa-table-wrap">
          <table className="fa-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Selected Unit</th>
                <th>Income &amp; Amortization</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleApplications.map((application) => (
                <tr key={application.id} onClick={() => void handleRowClick(application)}>
                  <td>
                    <div className="fa-applicant-cell">
                      <span className="fa-avatar">{toInitials(application.applicant?.fullName)}</span>
                      <div>
                        <p className="fa-applicant-name">{application.applicant?.fullName || 'Unknown Applicant'}</p>
                        <p className="fa-applicant-meta">{application.submittedBy?.email || 'No email'} • {application.applicant?.contactNumber || 'No contact'}</p>
                        <p className="fa-applicant-meta">{application.referenceId || application.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="fa-unit-cell">
                      {application.motorcycle?.imageUrl ? (
                        <img src={application.motorcycle.imageUrl} alt={application.motorcycle?.name || 'Unit'} />
                      ) : (
                        <div className="fa-unit-placeholder">N/A</div>
                      )}
                      <div>
                        <p className="fa-unit-name">{application.motorcycle?.name || 'N/A'}</p>
                        <p className="fa-unit-sub">{formatCurrency(application.motorcycle?.price || 0)}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="fa-income-cell">
                      <p><span>Monthly Income</span><strong>{application.terms?.incomeRange || 'N/A'}</strong></p>
                      <p><span>Downpayment</span><strong>{application.terms?.downPaymentPercent || 0}%</strong></p>
                      <p className="amortization-line"><span>Amortization</span><strong>{formatCurrency(application.terms?.monthlyAmortization || 0)} / {application.terms?.paymentTerm || 0} mo.</strong></p>
                    </div>
                  </td>
                  <td>
                    <span className={`fa-status-chip ${statusChipClass(application.status)}`}>
                      {displayStatus(application.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!visibleApplications.length && (
            <div className="fa-empty-state">No financing applications found yet.</div>
          )}
        </div>

        <div className="fa-panel-footer">
          <p>Showing {visibleApplications.length} of {applications.length} applications</p>
          <button
            type="button"
            onClick={() => visibleApplications[0] && void handleRowClick(visibleApplications[0])}
            disabled={!visibleApplications.length}
          >
            + New Manual Review
          </button>
        </div>
      </div>
    </section>
  )
}
