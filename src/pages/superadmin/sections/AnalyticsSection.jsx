import { useEffect, useState } from 'react'
import './AnalyticsSection.css'

export default function AnalyticsSection({
  users,
  authorizedAdmins,
  serviceRequests,
  inventory,
  technicians,
  roleOptions,
  normalizeText,
  transactionLogs = [],
  isDarkMode = true,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [fromDateFilter, setFromDateFilter] = useState(() => {
    const initialDate = new Date()
    return `${initialDate.getFullYear()}-${String(initialDate.getMonth() + 1).padStart(2, '0')}-${String(initialDate.getDate()).padStart(2, '0')}`
  })
  const [toDateFilter, setToDateFilter] = useState(() => {
    const initialDate = new Date()
    return `${initialDate.getFullYear()}-${String(initialDate.getMonth() + 1).padStart(2, '0')}-${String(initialDate.getDate()).padStart(2, '0')}`
  })
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  const getLogDate = (log) => {
    const rawValue = log?.createdAt || log?.timestamp

    if (rawValue && typeof rawValue.toDate === 'function') {
      return rawValue.toDate()
    }

    if (rawValue instanceof Date) {
      return rawValue
    }

    if (typeof rawValue === 'string') {
      const parsed = new Date(rawValue)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed
      }
    }

    if (typeof rawValue === 'number') {
      return new Date(rawValue)
    }

    return null
  }

  const today = new Date()
  const todayDateValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const fromDate = fromDateFilter ? new Date(`${fromDateFilter}T00:00:00`) : null
  const toDate = toDateFilter ? new Date(`${toDateFilter}T00:00:00`) : null
  const hasValidDateRange = (!fromDate || !Number.isNaN(fromDate.getTime()))
    && (!toDate || !Number.isNaN(toDate.getTime()))
    && (!fromDate || !toDate || fromDate <= toDate)
  const toDateExclusive = toDate && !Number.isNaN(toDate.getTime()) ? new Date(toDate) : null
  toDateExclusive?.setDate(toDateExclusive.getDate() + 1)

  const selectedDateTransactions = transactionLogs.filter((log) => {
    const createdAt = getLogDate(log)
    return hasValidDateRange
      && createdAt
      && (!fromDate || createdAt >= fromDate)
      && (!toDateExclusive || createdAt < toDateExclusive)
  })

  const totalSales = selectedDateTransactions.reduce((sum, log) => sum + Number(log.grandTotal || 0), 0)
  const cashSales = selectedDateTransactions
    .filter((log) => String(log.paymentMethodKey || log.paymentMethod || '').toLowerCase() === 'cash')
    .reduce((sum, log) => sum + Number(log.grandTotal || 0), 0)
  const onlineSales = selectedDateTransactions
    .filter((log) => {
      const method = String(log.paymentMethodKey || log.paymentMethod || '').toLowerCase()
      return ['gcash', 'card', 'bank', 'bank transfer'].includes(method)
    })
    .reduce((sum, log) => sum + Number(log.grandTotal || 0), 0)
  const transactionCount = selectedDateTransactions.length

  const sortedSales = [...selectedDateTransactions].sort((a, b) => {
    const aTime = getLogDate(a)?.getTime?.() ?? 0
    const bTime = getLogDate(b)?.getTime?.() ?? 0
    return bTime - aTime
  })

  const filteredSales = sortedSales.filter((log) => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const method = String(log.paymentMethodKey || log.paymentMethod || '').toLowerCase()
    const searchableText = `${log.transactionId || log.id} ${log.customer || ''} ${log.paymentMethod || ''}`.toLowerCase()

    const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch)
    const matchesPayment = paymentFilter === 'all' || method === paymentFilter

    return matchesSearch && matchesPayment
  })

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedSales = filteredSales.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, paymentFilter, fromDateFilter, toDateFilter])

  const formatLogDate = (log) => {
    const date = getLogDate(log)
    return date
      ? date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Date unavailable'
  }

  const formatReportDate = (dateValue) => {
    if (!dateValue) {
      return 'Any date'
    }

    return new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-PH', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <section className={`analytics-section ${!isDarkMode ? 'light-mode' : ''}`}>
      <header className="analytics-report-header">
        <div>
          <p className="analytics-eyebrow">Operations report</p>
          <h1>Sales Analytics</h1>
          <p className="analytics-report-subtitle">Sales totals and transaction activity for the selected date range</p>
        </div>
        <div className="analytics-report-date">
          <span>Reporting period</span>
          <strong>From: {formatReportDate(fromDateFilter)} To: {formatReportDate(toDateFilter)}</strong>
        </div>
      </header>

      <div className="analytics-kpi-grid">
        <article className="analytics-kpi-card analytics-kpi-card--primary">
          <span>Total sales</span>
          <strong>₱ {totalSales.toLocaleString('en-PH')}</strong>
          <small>For the selected date range</small>
        </article>
        <article className="analytics-kpi-card">
          <span>Cash sales</span>
          <strong>₱ {cashSales.toLocaleString('en-PH')}</strong>
          <small>For the selected date range</small>
        </article>
        <article className="analytics-kpi-card">
          <span>Online payments</span>
          <strong>₱ {onlineSales.toLocaleString('en-PH')}</strong>
          <small>GCash, card, and bank transfer in the selected range</small>
        </article>
        <article className="analytics-kpi-card">
          <span>Transactions</span>
          <strong>{transactionCount}</strong>
          <small>In the selected date range</small>
        </article>
      </div>

      <article className="analytics-table-panel">
        <div className="analytics-panel-heading">
          <div>
            <p className="analytics-eyebrow">Transaction register</p>
            <h2>Sales activity</h2>
          </div>
          <span className="analytics-record-count">{transactionCount} records</span>
        </div>

        <div className="analytics-filter-bar">
          <label className="analytics-search-field">
            <span>Search</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search transaction or customer"
            />
          </label>
          <label className="analytics-date-field">
            <span>From</span>
            <input
              type="date"
              value={fromDateFilter}
              max={toDateFilter || undefined}
              onChange={(event) => setFromDateFilter(event.target.value)}
              aria-label="From date"
            />
          </label>
          <label className="analytics-date-field">
            <span>To</span>
            <input
              type="date"
              value={toDateFilter}
              min={fromDateFilter || undefined}
              onChange={(event) => setToDateFilter(event.target.value)}
              aria-label="To date"
            />
          </label>
          <label className="analytics-select-field">
            <span>Payment method</span>
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
              <option value="all">All methods</option>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
              <option value="bank transfer">Bank Transfer (label)</option>
            </select>
          </label>
          {(searchTerm || paymentFilter !== 'all' || fromDateFilter !== todayDateValue || toDateFilter !== todayDateValue) && (
            <button
              type="button"
              className="analytics-filter-clear"
              onClick={() => {
                setSearchTerm('')
                setPaymentFilter('all')
                setFromDateFilter(todayDateValue)
                setToDateFilter(todayDateValue)
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {paginatedSales.length > 0 ? (
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Customer</th>
                  <th>Payment method</th>
                  <th>Date and time</th>
                  <th className="analytics-table-amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.map((log) => (
                  <tr key={log.id}>
                    <td><strong>{log.transactionId || log.id}</strong></td>
                    <td>{log.customer || 'Walk-in Customer'}</td>
                    <td><span className="analytics-payment-label">{log.paymentMethod || 'Cash'}</span></td>
                    <td>{formatLogDate(log)}</td>
                    <td className="analytics-table-amount"><strong>₱ {Number(log.grandTotal || 0).toLocaleString('en-PH')}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="analytics-empty-state">
            {selectedDateTransactions.length > 0
              ? 'No transactions match the selected filters.'
              : hasValidDateRange
                ? 'No sales recorded for this date range.'
                : 'The start date must be on or before the end date.'}
          </div>
        )}

        {filteredSales.length > 0 && (
          <div className="analytics-pagination">
            <span>
              Showing {(safeCurrentPage - 1) * pageSize + 1}-{Math.min(safeCurrentPage * pageSize, filteredSales.length)} of {filteredSales.length}
            </span>
            <div className="analytics-pagination-actions">
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </button>
              <strong>Page {safeCurrentPage} of {totalPages}</strong>
              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </article>
    </section>
  )
}
