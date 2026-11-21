import { useEffect, useState } from 'react'
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded'
import CircularProgress from '@mui/material/CircularProgress'
import { db } from '../../../firebase'
import { logSystemAuditEvent } from '../../../services/auditLogService'

const RETURN_CONDITIONS = [
  'Customer Return - Defective',
  'Damaged in Transit / Delivery',
  'Factory / Manufacturing Defect',
  'Store Handling / Floor Damage',
  'Customer Return - Wrong Item',
  'Customer Return - Warranty Claim',
  'Other',
]

const DISPOSITION_OPTIONS = [
  'Pending Inspection',
  'Returned to Supplier',
  'Sent for Repair',
  'Written Off / Scrapped',
  'Restocked to Inventory',
]

export default function ReturnDamagedModal({
  open,
  onClose,
  inventory = [],
  onSuccess,
  currentUser = null,
  currentAccessRole = '',
  isDarkMode = true,
}) {
  const [selectedItemId, setSelectedItemId] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [condition, setCondition] = useState(RETURN_CONDITIONS[0])
  const [disposition, setDisposition] = useState(DISPOSITION_OPTIONS[0])
  const [customerOrSource, setCustomerOrSource] = useState('')
  const [reason, setReason] = useState('')
  const [deductStock, setDeductStock] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!open) {
      setSelectedItemId('')
      setItemSearch('')
      setQuantity(1)
      setCondition(RETURN_CONDITIONS[0])
      setDisposition(DISPOSITION_OPTIONS[0])
      setCustomerOrSource('')
      setReason('')
      setDeductStock(true)
      setErrorMessage('')
      setIsSubmitting(false)
      return undefined
    }

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const selectedItem = inventory.find((item) => item.id === selectedItemId) || null

  const filteredInventory = inventory
    .filter((item) => {
      if (!itemSearch.trim()) return true
      const q = itemSearch.toLowerCase()
      return (
        String(item.name || '').toLowerCase().includes(q) ||
        String(item.sku || '').toLowerCase().includes(q) ||
        String(item.category || '').toLowerCase().includes(q)
      )
    })
    .slice(0, 15)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!selectedItemId || !selectedItem) {
      setErrorMessage('Please select a product from inventory.')
      return
    }

    const qtyNumber = Number(quantity)
    if (!Number.isFinite(qtyNumber) || qtyNumber <= 0) {
      setErrorMessage('Quantity must be greater than 0.')
      return
    }

    if (!reason.trim()) {
      setErrorMessage('Please provide a reason or damage description.')
      return
    }

    setIsSubmitting(true)

    try {
      const returnId = `RET-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      const timestamp = serverTimestamp()
      const actorEmail = String(currentUser?.email || '').trim().toLowerCase()
      const actorName = currentUser?.displayName || actorEmail.split('@')[0] || 'Staff User'

      const returnRecord = {
        returnId,
        itemId: selectedItem.id,
        itemName: selectedItem.name || 'Unnamed Item',
        itemSku: selectedItem.sku || '',
        itemCategory: selectedItem.category || '',
        quantity: qtyNumber,
        condition,
        disposition,
        customerOrSource: customerOrSource.trim() || 'Direct Store Return',
        reason: reason.trim(),
        deductedFromStock: Boolean(deductStock),
        reportedBy: {
          uid: currentUser?.uid || '',
          email: actorEmail,
          name: actorName,
          role: String(currentAccessRole || 'staff personnel').toLowerCase(),
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      await setDoc(doc(db, 'damagedReturns', returnId), returnRecord)

      // Optionally deduct stock from live inventory
      if (deductStock && selectedItem.id) {
        const currentStock = Number(selectedItem.stock ?? selectedItem.quantity ?? 0)
        const nextStock = Math.max(0, currentStock - qtyNumber)

        try {
          await updateDoc(doc(db, 'inventory', selectedItem.id), {
            stock: nextStock,
            quantity: nextStock,
            updatedAt: timestamp,
          })
        } catch (stockError) {
          console.warn('Could not auto-deduct stock from inventory:', stockError)
        }
      }

      await logSystemAuditEvent({
        module: 'Inventory',
        action: 'DAMAGED_RETURN_RECORDED',
        summary: `Recorded ${qtyNumber} returned/damaged units of "${selectedItem.name}" (${condition})`,
        targetType: 'damagedReturn',
        targetId: returnId,
        targetName: selectedItem.name,
        amount: null,
        currentUser,
        accessRole: currentAccessRole,
        metadata: {
          returnId,
          itemId: selectedItem.id,
          condition,
          disposition,
          quantity: qtyNumber,
          deductedFromStock: deductStock,
        },
      })

      onSuccess?.(`Recorded returned/damaged item ${returnId} successfully.`)
      onClose()
    } catch (error) {
      console.error('Failed to record damaged product:', error)
      setErrorMessage(error?.message || 'Unable to record returned product.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 99999,
        background: 'rgba(4, 4, 4, 0.8)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-xl rounded-2xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto ${
          isDarkMode
            ? 'bg-linear-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/15 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              isDarkMode ? 'bg-amber-950/60 text-amber-400' : 'bg-amber-100 text-amber-600'
            }`}>
              <ReportProblemRoundedIcon sx={{ fontSize: 22 }} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Inventory Operations</p>
              <h3 className="text-lg font-black">Record Returned / Damaged Product</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block space-y-1.5">
            <span className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
              Select Product / Spare Part *
            </span>
            <input
              type="search"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Search by product name, SKU, or category..."
              className={`w-full rounded-xl border px-3.5 py-2 text-sm outline-none transition-colors mb-2 ${
                isDarkMode
                  ? 'border-white/15 bg-black/40 text-white focus:border-amber-500'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-amber-600'
              }`}
            />
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors ${
                isDarkMode
                  ? 'border-white/15 bg-black/40 text-white focus:border-amber-500'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-amber-600'
              }`}
            >
              <option value="">-- Choose from inventory ({filteredInventory.length} matches) --</option>
              {filteredInventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.sku ? `(${item.sku})` : ''} — Stock: {item.stock ?? 0}
                </option>
              ))}
            </select>
          </label>

          {selectedItem && (
            <div className={`rounded-xl border p-3 text-xs flex items-center justify-between ${
              isDarkMode ? 'border-white/10 bg-white/4' : 'border-gray-200 bg-gray-50'
            }`}>
              <div>
                <span className="font-bold">{selectedItem.name}</span>
                <span className="block opacity-65">{selectedItem.category || 'General'} • SKU: {selectedItem.sku || 'N/A'}</span>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-black border border-white/10">
                Current Stock: {selectedItem.stock ?? 0}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                Quantity Returned / Damaged *
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))}
                required
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors ${
                  isDarkMode
                    ? 'border-white/15 bg-black/40 text-white focus:border-amber-500'
                    : 'border-gray-300 bg-white text-gray-900 focus:border-amber-600'
                }`}
              />
            </label>

            <label className="block space-y-1.5">
              <span className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                Condition / Return Category *
              </span>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors ${
                  isDarkMode
                    ? 'border-white/15 bg-black/40 text-white focus:border-amber-500'
                    : 'border-gray-300 bg-white text-gray-900 focus:border-amber-600'
                }`}
              >
                {RETURN_CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                Initial Disposition Status
              </span>
              <select
                value={disposition}
                onChange={(e) => setDisposition(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors ${
                  isDarkMode
                    ? 'border-white/15 bg-black/40 text-white focus:border-amber-500'
                    : 'border-gray-300 bg-white text-gray-900 focus:border-amber-600'
                }`}
              >
                {DISPOSITION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                Customer / Source Name
              </span>
              <input
                type="text"
                value={customerOrSource}
                onChange={(e) => setCustomerOrSource(e.target.value)}
                placeholder="Customer name or Supplier delivery"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors ${
                  isDarkMode
                    ? 'border-white/15 bg-black/40 text-white focus:border-amber-500'
                    : 'border-gray-300 bg-white text-gray-900 focus:border-amber-600'
                }`}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
              Damage Details / Reason for Return *
            </span>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="Describe the defect, damage, or customer complaint in detail..."
              className={`w-full rounded-xl border px-3.5 py-2 text-sm outline-none transition-colors resize-none ${
                isDarkMode
                  ? 'border-white/15 bg-black/40 text-white focus:border-amber-500'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-amber-600'
              }`}
            />
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={deductStock}
              onChange={(e) => setDeductStock(e.target.checked)}
              className="h-4 w-4 rounded accent-amber-500"
            />
            <span className={`text-xs font-semibold ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
              Automatically deduct {quantity} unit(s) from active sellable inventory stock
            </span>
          </label>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-400">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 ${
                isDarkMode ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2.5 text-sm font-black text-white transition-colors disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={16} color="inherit" />
                  Recording...
                </>
              ) : (
                'Save Return / Damaged Record'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
