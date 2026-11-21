import { useMemo } from 'react'
import './FinancingApplicationsSection.css'

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
    return 'financing-review-status--approved'
  }

  if (value === 'rejected') {
    return 'financing-review-status--rejected'
  }

  if (value === 'reviewing') {
    return 'financing-review-status--reviewing'
  }

  return 'financing-review-status--pending'
}

const getInitials = (name) => {
  if (!name) return 'NA'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'NA'
}

const formatMoney = (value, formatCurrency) => {
  if (typeof formatCurrency === 'function') return formatCurrency(value || 0)
  if (typeof value === 'number') return `₱${value.toLocaleString()}`
  return value || '—'
}

export default function FinancingApplicationsSection({
  applications = [],
  canEditOperations,
  handleCollectionUpdate,
  formatCurrency,
  onOpenApplication,
  isDarkMode = true,
}) {
  const counts = useMemo(() => applications.reduce((result, application) => {
    const status = String(application.status || 'submitted').toLowerCase()
    result[status] = (result[status] || 0) + 1
    return result
  }, {}), [applications])

  const handleOpen = async (application) => {
    if (!application?.id) return
    if (String(application.status || 'submitted').toLowerCase() === 'submitted' && canEditOperations) {
      await handleCollectionUpdate('financingApplications', application.id, { status: 'reviewing' })
      onOpenApplication?.({ ...application, status: 'reviewing' })
      return
    }
    onOpenApplication?.(application)
  }

  const summaryCards = [
    { key: 'submitted', label: 'PENDING REVIEW' },
    { key: 'reviewing', label: 'UNDER REVIEW' },
    { key: 'approved', label: 'QUALIFIED' },
    { key: 'rejected', label: 'NOT QUALIFIED' },
  ]

  return (
    <section className={`financing-review-section ${isDarkMode ? 'is-dark-mode' : ''}`}>
      <div className="financing-review-heading">
        <h2 className="financing-review-title">
          Financing Review &amp; Response
        </h2>
        <p className="financing-review-subtitle">
          Manage and process motorcycle credit applications with precision.
        </p>
      </div>

      <div className="financing-review-kpis">
        {summaryCards.map(({ key, label }) => {
          const isQualified = key === 'approved'
          const isPending = key === 'submitted'
          const isRejected = key === 'rejected'
          const isReviewing = key === 'reviewing'

          return (
            <div
              key={key}
              className="financing-review-kpi"
            >
              <div className="financing-review-kpi-label">
                <span>{label}</span>
              </div>

              <div className="financing-review-kpi-value-row">
                <span className="financing-review-kpi-value">{counts[key] || 0}</span>
                <span
                  className={`financing-review-kpi-marker ${
                    isRejected ? 'is-rejected' :
                    isQualified ? 'is-qualified' :
                    isReviewing ? 'is-reviewing' :
                    isPending ? 'is-pending' : ''
                  }`}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="financing-review-table-panel">
        <div className="financing-review-table-header">
          <h3 className="financing-review-table-title">Recent Applications</h3>

          <div className="financing-review-table-actions">
            <button
              type="button"
              className="financing-review-button"
            >
              Filter
            </button>
            <button
              type="button"
              className="financing-review-button"
            >
              Export
            </button>
          </div>
        </div>

        <div className="financing-review-table-scroll">
          <table className="financing-review-table">
            <thead>
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Selected Unit</th>
                <th className="px-4 py-3">Income & Amortization</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.length ? applications.map((application) => {
                const applicantName = application.applicant?.fullName || application.submittedBy?.fullName || application.submittedBy?.email || 'Unknown Applicant'
                const applicantEmail = application.applicant?.email || application.submittedBy?.email || 'No email'
                const reference = application.referenceId || application.referenceNumber || application.refNumber || application.id || 'N/A'
                const motorcycleName = application.motorcycle?.name || application.motorcycleName || 'Not specified'
                const motorcyclePrice = application.motorcycle?.price ?? application.price ?? 0
                const incomeRange = application.terms?.incomeRange || application.incomeRange || null
                const downPaymentAmount = application.terms?.downPaymentAmount ?? application.loanTerms?.downPayment ?? application.financing?.downPayment ?? null
                const downPaymentPercent = application.terms?.downPaymentPercent ?? application.loanTerms?.downPaymentPercent ?? application.financing?.downPaymentPercent ?? null
                const monthlyAmortization = application.terms?.monthlyAmortization ?? application.loanTerms?.monthlyAmortization ?? application.financing?.monthlyAmortization ?? null
                const paymentTerm = application.terms?.paymentTerm ?? application.loanTerms?.amortizationMonths ?? application.financing?.amortization ?? null
                const status = String(application.status || 'submitted').toLowerCase()
                const totalAmount = application.terms?.totalAmount ?? application.amount ?? motorcyclePrice

                return (
                  <tr
                    key={application.id}
                    className="financing-review-row"
                  >
                    <td className="px-4 py-4 align-middle">
                      <div className="financing-review-identity">
                        <div className="financing-review-avatar">
                          {getInitials(applicantName)}
                        </div>
                        <div className="financing-review-identity-copy">
                          <div className="financing-review-primary-text">{applicantName}</div>
                          <div className="financing-review-secondary-text">{applicantEmail}</div>
                          <div className="financing-review-secondary-text">REF-{reference}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="financing-review-identity">
                        <div className="financing-review-unit-mark">
                          {motorcycleName.slice(0, 2).toUpperCase() || 'MC'}
                        </div>
                        <div className="financing-review-identity-copy">
                          <div className="financing-review-primary-text">{motorcycleName}</div>
                          <div className="financing-review-secondary-text">{formatMoney(totalAmount, formatCurrency)}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="financing-review-financials">
                        <div className="financing-review-financial-row">
                          <span className="financing-review-financial-label">Monthly income: </span>
                          <span className="financing-review-financial-value">{incomeRange || '—'}</span>
                        </div>
                        <div className="financing-review-financial-row">
                          <span className="financing-review-financial-label">Downpayment: </span>
                          <span className="financing-review-financial-value">
                            {downPaymentPercent != null ? `${downPaymentPercent}%` : (downPaymentAmount != null ? formatMoney(downPaymentAmount, formatCurrency) : '—')}
                          </span>
                        </div>
                        <div className="financing-review-financial-row">
                          <span className="financing-review-financial-label">Amortization: </span>
                          <span className="financing-review-financial-value">
                            {monthlyAmortization != null ? formatMoney(monthlyAmortization, formatCurrency) : (paymentTerm ? `${paymentTerm} mo.` : '—')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="financing-review-status-actions">
                        <span className={`financing-review-status ${statusClasses(status)}`}>
                          {statusLabel(status)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpen(application)}
                          className="financing-review-view-button"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan="4" className="financing-review-empty">
                    No financing applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="financing-review-table-footer">
          Showing {applications.length} applications
        </div>
      </div>
    </section>
  )
}
