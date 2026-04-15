import { useState, useMemo, useEffect } from 'react'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import './InventoryReportsSection.css'

const reportTabs = [
  { id: 'all', label: 'All Items' },
  { id: 'motorcycle-units', label: 'Motorcycle Units' },
  { id: 'spare-parts', label: 'Spare Parts' },
]

const normalizeText = (value = '') => String(value).trim().toLowerCase()

export default function InventoryReportsSection({
  inventoryLogs = [],
  formatDate,
  formatCurrency,
  currentUser,
  isDarkMode = true,
}) {
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const reportsPerPage = 15

  const normalizedSearchTerm = normalizeText(searchTerm)

  const filteredLogs = useMemo(() => {
    return inventoryLogs.filter((log) => {
      const searchHaystack = normalizeText(
        `${log.itemName} ${log.itemModel} ${log.category} ${log.addedBy || ''}`
      )
      const searchMatch = !searchTerm || searchHaystack.includes(normalizedSearchTerm)

      // Filter by tab
      let categoryMatch = true
      if (activeTab === 'motorcycle-units') {
        categoryMatch = log.category === 'Motorcycle Units'
      } else if (activeTab === 'spare-parts') {
        categoryMatch = log.category === 'Spare Parts'
      }

      // Filter by date range
      let dateMatch = true
      if (log.createdAt) {
        const logDate = new Date(log.createdAt.seconds ? log.createdAt.seconds * 1000 : log.createdAt)
        if (dateFrom) {
          const fromDate = new Date(dateFrom)
          dateMatch = dateMatch && logDate >= fromDate
        }
        if (dateTo) {
          const toDate = new Date(dateTo)
          toDate.setHours(23, 59, 59, 999)
          dateMatch = dateMatch && logDate <= toDate
        }
      }

      return searchMatch && categoryMatch && dateMatch
    })
  }, [activeTab, inventoryLogs, searchTerm, normalizedSearchTerm, dateFrom, dateTo])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm, dateFrom, dateTo])

  const totalPages = Math.ceil(filteredLogs.length / reportsPerPage)
  const startIndex = (currentPage - 1) * reportsPerPage
  const endIndex = startIndex + reportsPerPage
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(startIndex, endIndex)
  }, [filteredLogs, startIndex, endIndex])

  const summaryStats = useMemo(() => {
    const stats = {
      total: filteredLogs.length,
      thisWeek: 0,
      thisMonth: 0,
      totalValue: 0,
    }

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    filteredLogs.forEach((log) => {
      const logDate = new Date(log.createdAt?.seconds ? log.createdAt.seconds * 1000 : log.createdAt)
      if (logDate >= oneWeekAgo) stats.thisWeek++
      if (logDate >= oneMonthAgo) stats.thisMonth++
      stats.totalValue += Number(log.price || 0) * Number(log.stock || 1)
    })

    return stats
  }, [filteredLogs])

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
    const pageHeight = doc.internal.pageSize.getHeight()

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
    <section className="inventory-reports-shell space-y-6">
      <div className="inventory-reports-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="inventory-reports-title font-['Epilogue'] text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            Inventory <span>Reports</span>
          </h2>
          <p className="mt-2 text-sm text-white/45">Track all inventory additions, updates, and actions with detailed audit logs.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inventory-reports-export-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-white"
          >
            <DownloadRoundedIcon sx={{ fontSize: 16 }} />
            Export Excel
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="inventory-reports-export-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-white"
          >
            <CloudDownloadRoundedIcon sx={{ fontSize: 16 }} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="inventory-reports-summary-card rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">Total Items</p>
          <h3 className="mt-3 font-['Epilogue'] text-3xl font-black text-white">{filteredLogs.length}</h3>
          <p className="mt-2 text-xs text-white/45">In selected period</p>
        </article>

        <article className="inventory-reports-summary-card rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">This Week</p>
          <h3 className="mt-3 font-['Epilogue'] text-3xl font-black text-white">{summaryStats.thisWeek}</h3>
          <p className="mt-2 text-xs text-white/45">New additions</p>
        </article>

        <article className="inventory-reports-summary-card rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">This Month</p>
          <h3 className="mt-3 font-['Epilogue'] text-3xl font-black text-white">{summaryStats.thisMonth}</h3>
          <p className="mt-2 text-xs text-white/45">New additions</p>
        </article>

        <article className="inventory-reports-summary-card rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">Total Value</p>
          <h3 className="mt-3 font-['Epilogue'] text-2xl font-black text-white">{formatCurrency(summaryStats.totalValue)}</h3>
          <p className="mt-2 text-xs text-white/45">Inventory value</p>
        </article>
      </div>

      <div className="inventory-reports-board rounded-[28px] p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inventory-reports-tab-row flex flex-wrap gap-2">
              {reportTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inventory-reports-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">From:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="inventory-reports-date-input rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-xs text-white"
                />
              </label>

              <label className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">To:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="inventory-reports-date-input rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-xs text-white"
                />
              </label>

              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('')
                    setDateTo('')
                  }}
                  className="text-xs font-bold text-[#ff7070] hover:text-red-400 transition-colors"
                >
                  Clear Dates
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="hidden grid-cols-[0.6fr_1fr_1fr_1.2fr_0.8fr_1fr_1.2fr_1.5fr_0.8fr] gap-3 border-b border-white/5 px-3 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/35 md:grid">
          <span>Image</span>
          <span>Item Name</span>
          <span>Model/Variant</span>
          <span>Category</span>
          <span>Stock</span>
          <span>Price</span>
          <span>Status</span>
          <span>Added By</span>
          <span className="text-right">Date</span>
        </div>

        <div className="divide-y divide-white/5">
          {filteredLogs.length > 0 ? (
            paginatedLogs.map((log) => (
              <div key={log.id} className="grid gap-3 px-3 py-4 md:grid-cols-[0.6fr_1fr_1fr_1.2fr_0.8fr_1fr_1.2fr_1.5fr_0.8fr] md:items-center">
                <div className="flex items-center justify-center">
                  {log.imageUrl ? (
                    <img 
                      src={log.imageUrl} 
                      alt={log.itemName}
                      className={`rounded-lg w-12 h-12 object-cover border ${!isDarkMode ? 'border-gray-300' : 'border-white/10'}`}
                    />
                  ) : (
                    <div className={`rounded-lg w-12 h-12 flex items-center justify-center text-xs font-bold ${!isDarkMode ? 'bg-gray-300 text-gray-600' : 'bg-white/10 text-white/30'}`}>
                      No img
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-white">{log.itemName}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/50">{log.itemModel}</p>
                </div>

                <div>
                  <span className="inventory-reports-category-pill inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                    {log.category}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-bold text-white">{log.stock}</p>
                </div>

                <div>
                  <p className="text-sm font-bold text-white">{formatCurrency(log.price || 0)}</p>
                </div>

                <div>
                  <span className={`text-xs font-bold ${
                    log.status === 'In Stock' ? 'text-emerald-400' :
                    log.status === 'Low Stock' ? 'text-[#ff9500]' :
                    'text-[#ff3b30]'
                  }`}>
                    {log.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-white/70">{log.addedBy}</p>
                </div>

                <div className="relative">
                  <p className="text-xs text-white/50">{formatDate(log.createdAt?.seconds ? log.createdAt.seconds * 1000 : log.createdAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="inventory-reports-empty rounded-2xl px-4 py-10 text-center text-white/50">
              No inventory records match this filter. Try adjusting your search criteria or date range.
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-[11px] text-white/40">
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
