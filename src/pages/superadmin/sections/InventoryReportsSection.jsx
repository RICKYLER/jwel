import { useState, useMemo } from 'react'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import './InventoryReportsSection.css'

const reportTabs = [
  { id: 'all', label: 'All Items' },
  { id: 'motorcycle-units', label: 'Motorcycle Units' },
  { id: 'spare-parts', label: 'Spare Parts' },
]

const normalizeText = (value = '') => String(value).trim().toLowerCase()

const getLogDate = (createdAt) => {
  if (typeof createdAt?.toDate === 'function') {
    return createdAt.toDate()
  }

  const date = createdAt instanceof Date
    ? createdAt
    : new Date(createdAt?.seconds ? createdAt.seconds * 1000 : createdAt)

  return Number.isNaN(date.getTime()) ? null : date
}

const getLogTimestamp = (createdAt) => {
  return getLogDate(createdAt)?.getTime() ?? 0
}

export default function InventoryReportsSection({
  inventoryLogs = [],
  formatDate,
  formatCurrency,
  isDarkMode = true,
}) {
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const reportsPerPage = 15

  const normalizedSearchTerm = normalizeText(searchTerm)
  const dateFilteredLogs = useMemo(() => {
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
    const toDate = dateTo ? new Date(`${dateTo}T00:00:00`) : null
    const isValidRange = (!fromDate || !Number.isNaN(fromDate.getTime()))
      && (!toDate || !Number.isNaN(toDate.getTime()))
      && (!fromDate || !toDate || fromDate <= toDate)

    if (!isValidRange) {
      return []
    }

    const toDateExclusive = toDate ? new Date(toDate) : null
    toDateExclusive?.setDate(toDateExclusive.getDate() + 1)

    return inventoryLogs.filter((log) => {
      if (!fromDate && !toDateExclusive) {
        return true
      }

      const logDate = getLogDate(log.createdAt)
      return logDate
        && (!fromDate || logDate >= fromDate)
        && (!toDateExclusive || logDate < toDateExclusive)
    })
  }, [inventoryLogs, dateFrom, dateTo])

  const filteredLogs = useMemo(() => {
    return [...dateFilteredLogs]
      .sort((a, b) => getLogTimestamp(b.createdAt) - getLogTimestamp(a.createdAt))
      .filter((log) => {
        const searchHaystack = normalizeText(
          `${log.itemName} ${log.itemModel} ${log.category} ${log.addedBy || ''}`
        )
        const searchMatch = !searchTerm || searchHaystack.includes(normalizedSearchTerm)

        let categoryMatch = true
        if (activeTab === 'motorcycle-units') {
          categoryMatch = log.category === 'Motorcycle Units'
        }
        if (activeTab === 'spare-parts') {
          categoryMatch = log.category === 'Spare Parts'
        }

        return searchMatch && categoryMatch
      })
  }, [activeTab, dateFilteredLogs, searchTerm, normalizedSearchTerm])


  // Handlers to reset currentPage when filters change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setCurrentPage(1)
  }
  const handleDateFromChange = (value) => {
    setDateFrom(value)
    setCurrentPage(1)
  }
  const handleDateToChange = (value) => {
    setDateTo(value)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(filteredLogs.length / reportsPerPage)
  const startIndex = (currentPage - 1) * reportsPerPage
  const endIndex = startIndex + reportsPerPage
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(startIndex, endIndex)
  }, [filteredLogs, startIndex, endIndex])

  const summaryStats = useMemo(() => {
    const stats = {
      total: dateFilteredLogs.length,
      thisWeek: 0,
      thisMonth: 0,
      totalValue: 0,
    }

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    dateFilteredLogs.forEach((log) => {
      const logDate = getLogDate(log.createdAt)
      if (logDate && logDate >= oneWeekAgo) stats.thisWeek++
      if (logDate && logDate >= oneMonthAgo) stats.thisMonth++
      stats.totalValue += Number(log.price || 0) * Number(log.stock || 1)
    })

    return stats
  }, [dateFilteredLogs])

  const handleExportExcel = () => {
    const exportData = filteredLogs.map((log) => ({
      'Item Name': log.itemName,
      'Model/Variant': log.itemModel,
      'Category': log.category,
      'Stock': log.stock,
      'Price': formatCurrency(log.price || 0),
      'Status': log.status,
      'Added By': log.addedBy,
      'Date Added': formatDate(log.createdAt?.seconds ? log.createdAt.seconds * 1000 : log.createdAt),
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Reports')

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
    ]

    XLSX.writeFile(workbook, `inventory-reports-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const _pageHeight = doc.internal.pageSize.getHeight()

    // Add title
    doc.setFontSize(16)
    doc.text('Inventory Reports', pageWidth / 2, 15, { align: 'center' })

    // Add date range info
    doc.setFontSize(10)
    const dateText = `Generated: ${formatDate(new Date())}`
    doc.text(dateText, pageWidth / 2, 22, { align: 'center' })

    if (dateFrom || dateTo) {
      const rangeText = `Date Range: ${dateFrom ? formatDate(dateFrom) : 'Start'} to ${dateTo ? formatDate(dateTo) : 'End'}`
      doc.text(rangeText, pageWidth / 2, 28, { align: 'center' })
    }

    // Prepare table data
    const tableData = filteredLogs.map((log) => [
      log.itemName,
      log.itemModel,
      log.category,
      log.stock,
      formatCurrency(log.price || 0),
      log.status,
      log.addedBy,
      formatDate(log.createdAt?.seconds ? log.createdAt.seconds * 1000 : log.createdAt),
    ])

    // Add table
    doc.autoTable({
      head: [['Item Name', 'Model', 'Category', 'Stock', 'Price', 'Status', 'Added By', 'Date']],
      body: tableData,
      startY: 35,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [225, 1, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      margin: { left: 10, right: 10 },
    })

    // Add summary
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text(`Total Items: ${filteredLogs.length}`, 15, finalY)
    doc.text(`Total Value: ${formatCurrency(summaryStats.totalValue)}`, 15, finalY + 6)

    doc.save(`inventory-reports-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <section className={`inventory-reports-shell space-y-6 ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="inventory-reports-header flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="inventory-reports-title">
            Inventory Reports
          </h2>
          <p className="inventory-reports-subtitle">Inventory additions, updates, and audit records</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inventory-reports-export-button inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
          >
            <DownloadRoundedIcon sx={{ fontSize: 16 }} />
            Export Excel
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="inventory-reports-export-button inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
          >
            <CloudDownloadRoundedIcon sx={{ fontSize: 16 }} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="inventory-reports-summary-grid grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="inventory-reports-summary-card p-4">
          <p className="inventory-reports-summary-label">Total Records</p>
          <h3 className="inventory-reports-summary-value">{summaryStats.total}</h3>
          <p className="inventory-reports-summary-note">In selected period</p>
        </article>

        <article className="inventory-reports-summary-card p-4">
          <p className="inventory-reports-summary-label">This Week</p>
          <h3 className="inventory-reports-summary-value">{summaryStats.thisWeek}</h3>
          <p className="inventory-reports-summary-note">New records</p>
        </article>

        <article className="inventory-reports-summary-card p-4">
          <p className="inventory-reports-summary-label">This Month</p>
          <h3 className="inventory-reports-summary-value">{summaryStats.thisMonth}</h3>
          <p className="inventory-reports-summary-note">New records</p>
        </article>

        <article className="inventory-reports-summary-card p-4">
          <p className="inventory-reports-summary-label">Total Value</p>
          <h3 className="inventory-reports-summary-value">{formatCurrency(summaryStats.totalValue)}</h3>
          <p className="inventory-reports-summary-note">Value in selected period</p>
        </article>
      </div>

      <div className="inventory-reports-board">
        <div className="mb-5 flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inventory-reports-tab-row flex flex-wrap gap-2">
              {reportTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`inventory-reports-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="inventory-reports-filter-bar flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2">
                <span className="inventory-reports-filter-label">From:</span>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  aria-label="From date"
                  className="inventory-reports-date-input px-3 py-2 text-xs"
                />
              </label>

              <label className="flex items-center gap-2">
                <span className="inventory-reports-filter-label">To:</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  aria-label="To date"
                  className="inventory-reports-date-input px-3 py-2 text-xs"
                />
              </label>

              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    handleDateFromChange('')
                    handleDateToChange('')
                  }}
                  className="inventory-reports-clear-button text-xs font-bold"
                >
                  Clear Dates
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="inventory-reports-table-wrap">
          <table className="inventory-reports-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Item Name</th>
                <th>Model / Variant</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Status</th>
                <th>Added By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      {log.imageUrl ? (
                        <img src={log.imageUrl} alt={log.itemName} className="inventory-reports-item-image" />
                      ) : (
                        <span className="inventory-reports-no-image">No image</span>
                      )}
                    </td>
                    <td className="inventory-reports-item-name">{log.itemName || '—'}</td>
                    <td>{log.itemModel || '—'}</td>
                    <td>{log.category || '—'}</td>
                    <td>{log.stock ?? '—'}</td>
                    <td>{formatCurrency(log.price || 0)}</td>
                    <td>
                      <span className={`inventory-reports-status ${
                        log.status === 'In Stock' ? 'is-in-stock' :
                          log.status === 'Low Stock' ? 'is-low-stock' :
                            log.status === 'Out of Stock' ? 'is-out-of-stock' : ''
                      }`}>
                        {log.status || '—'}
                      </span>
                    </td>
                    <td>{log.addedBy || '—'}</td>
                    <td>{formatDate(log.createdAt?.seconds ? log.createdAt.seconds * 1000 : log.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="inventory-reports-empty">
                    No inventory records match this filter. Try adjusting the date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="inventory-reports-pagination mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-[11px]">
          <span>Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} records</span>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="inventory-pagination-button disabled:opacity-50"
              >
                ‹ Prev
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`inventory-pagination-page ${currentPage === pageNum ? 'is-active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="inventory-pagination-button disabled:opacity-50"
              >
                Next ›
              </button>
            </div>
          )}
          
          <span>Live sync from inventoryLogs collection</span>
        </div>
      </div>
    </section>
  )
}
