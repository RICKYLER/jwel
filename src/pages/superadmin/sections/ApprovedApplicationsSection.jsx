import './ApprovedApplicationsSection.css'

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

const formatApprovedDate = (value) => {
  if (!value) return '—'

  const date = typeof value.toDate === 'function'
    ? value.toDate()
    : value instanceof Date
      ? value
      : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ApprovedApplicationsSection({
  applications = [],
  canEditOperations,
  handleFinancingStatusUpdate,
  formatCurrency,
  onOpenApplication,
  isDarkMode = true,
}) {
  const approvedApplications = applications.filter((application) => String(application.status || '').toLowerCase() === 'approved')

  const finalize = async (application) => {
    if (!canEditOperations || !application?.id) return
    if (typeof window !== 'undefined' && !window.confirm('Finalize this approved application?')) return
    await handleFinancingStatusUpdate(application.id, 'completed')
  }

  return (
    <section className={`approved-applications-section ${isDarkMode ? 'is-dark-mode' : ''}`}>
      <div className="approved-applications-heading">
        <h2 className="approved-applications-title">
          Approved Applications
        </h2>
        <p className="approved-applications-subtitle">
          Finalize approved financing applications and complete the process.
        </p>
      </div>

      <div className="approved-applications-kpi">
        <div className="approved-applications-kpi-label">
          <span>Total Approved</span>
        </div>
        <div className="approved-applications-kpi-value-row">
          <span className="approved-applications-kpi-value">{approvedApplications.length}</span>
        </div>
      </div>

      <div className="approved-applications-table-panel">
        <div className="approved-applications-table-header">
          <h3 className="approved-applications-table-title">
            Approved Applications Ready for Finalization
          </h3>

          <div className="approved-applications-table-actions">
            <button
              type="button"
              className="approved-applications-button"
            >
              Filter
            </button>
            <button
              type="button"
              className="approved-applications-button"
            >
              Export
            </button>
          </div>
        </div>

        <div className="approved-applications-table-scroll">
          <table className="approved-applications-table">
            <thead>
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Selected Unit</th>
                <th className="px-4 py-3">Income & Amortization</th>
                <th className="px-4 py-3">Approved Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {approvedApplications.length ? approvedApplications.map((application) => {
                const applicantName = application.applicant?.fullName || application.submittedBy?.fullName || application.submittedBy?.email || 'Unknown Applicant'
                const applicantEmail = application.applicant?.email || application.submittedBy?.email || 'No email'
                const reference = application.referenceId || application.referenceNumber || application.refNumber || application.id || 'N/A'
                const motorcycleName = application.motorcycle?.name || application.motorcycleName || 'Not specified'
                const totalAmount = application.terms?.totalAmount ?? application.amount ?? application.motorcycle?.price ?? 0
                const incomeRange = application.terms?.incomeRange || application.incomeRange || null
                const downPaymentAmount = application.terms?.downPaymentAmount ?? application.loanTerms?.downPayment ?? application.financing?.downPayment ?? null
                const downPaymentPercent = application.terms?.downPaymentPercent ?? application.loanTerms?.downPaymentPercent ?? application.financing?.downPaymentPercent ?? null
                const monthlyAmortization = application.terms?.monthlyAmortization ?? application.loanTerms?.monthlyAmortization ?? application.financing?.monthlyAmortization ?? null
                const paymentTerm = application.terms?.paymentTerm ?? application.loanTerms?.amortizationMonths ?? application.financing?.amortization ?? null
                const approvedDate = application.approvedAt || application.updatedAt || application.finalizedAt || application.createdAt
                const isCompleted = String(application.status || '').toLowerCase() === 'completed'

                return (
                  <tr
                    key={application.id}
                    className="approved-applications-row"
                  >
                    <td className="px-4 py-4 align-middle">
                      <div className="approved-applications-identity">
                        <div className="approved-applications-avatar">
                          {getInitials(applicantName)}
                        </div>
                        <div className="approved-applications-identity-copy">
                          <div className="approved-applications-primary-text">{applicantName}</div>
                          <div className="approved-applications-secondary-text">{applicantEmail}</div>
                          <div className="approved-applications-secondary-text">REF-{reference}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="approved-applications-identity">
                        <div className="approved-applications-unit-mark">
                          {motorcycleName.slice(0, 2).toUpperCase() || 'MC'}
                        </div>
                        <div className="approved-applications-identity-copy">
                          <div className="approved-applications-primary-text">{motorcycleName}</div>
                          <div className="approved-applications-secondary-text">{formatMoney(totalAmount, formatCurrency)}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="approved-applications-financials">
                        <div className="approved-applications-financial-row">
                          <span className="approved-applications-financial-label">Monthly income: </span>
                          <span className="approved-applications-financial-value">{incomeRange || '—'}</span>
                        </div>
                        <div className="approved-applications-financial-row">
                          <span className="approved-applications-financial-label">Downpayment: </span>
                          <span className="approved-applications-financial-value">
                            {downPaymentPercent != null ? `${downPaymentPercent}%` : (downPaymentAmount != null ? formatMoney(downPaymentAmount, formatCurrency) : '—')}
                          </span>
                        </div>
                        <div className="approved-applications-financial-row">
                          <span className="approved-applications-financial-label">Amortization: </span>
                          <span className="approved-applications-financial-value">
                            {monthlyAmortization != null ? formatMoney(monthlyAmortization, formatCurrency) : (paymentTerm ? `${paymentTerm} mo.` : '—')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="approved-applications-date">
                        {formatApprovedDate(approvedDate)}
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <div className="approved-applications-row-actions">
                        <button
                          type="button"
                          onClick={() => onOpenApplication?.(application)}
                          className="approved-applications-button"
                        >
                          View
                        </button>

                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => finalize(application)}
                            disabled={!canEditOperations}
                            className="approved-applications-finalize-button"
                          >
                            Finalize
                          </button>
                        )}

                        <span className="approved-applications-status">
                          {isCompleted ? 'Finalized' : 'Approved'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan="5" className="approved-applications-empty">
                    No approved applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="approved-applications-table-footer">
          Showing {approvedApplications.length} approved application{approvedApplications.length === 1 ? '' : 's'}
        </div>
      </div>
    </section>
  )
}
