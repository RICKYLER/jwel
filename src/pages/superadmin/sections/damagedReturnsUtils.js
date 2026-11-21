/**
 * Damaged and Returned Products Utility Functions
 * Handles status validation, lifecycle transitions, restock rules, and loss valuation.
 */

export const VALID_DISPOSITIONS = [
  'pending_inspection',
  'returned_to_supplier',
  'written_off',
  'repaired_restocked',
  'disposed',
]

export const VALID_RETURN_CONDITIONS = [
  'defective_box',
  'scratched_dented',
  'factory_defect',
  'damaged_transit',
  'customer_return',
]

/**
 * Validates the intake payload for a damaged/returned product incident.
 */
export function validateDamagedReturnPayload(payload = {}) {
  const errors = []

  if (!payload.itemName || String(payload.itemName).trim() === '') {
    errors.push('Item name is required.')
  }

  const quantity = Number(payload.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.push('Quantity must be a positive integer greater than zero.')
  }

  if (payload.condition && !VALID_RETURN_CONDITIONS.includes(payload.condition)) {
    errors.push(`Invalid return condition: ${payload.condition}`)
  }

  if (payload.dispositionStatus && !VALID_DISPOSITIONS.includes(payload.dispositionStatus)) {
    errors.push(`Invalid disposition status: ${payload.dispositionStatus}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Determines whether inventory stock should be restored based on disposition transition.
 * Only triggers if the new disposition is 'repaired_restocked', the item was originally deducted,
 * and it has not already been restored.
 */
export function shouldRestoreStockOnDispositionChange({
  previousDisposition,
  newDisposition,
  deductedFromStock,
  alreadyRestocked = false,
}) {
  if (alreadyRestocked) return false
  if (!deductedFromStock) return false
  if (previousDisposition === 'repaired_restocked') return false
  return newDisposition === 'repaired_restocked'
}

/**
 * Computes new inventory stock quantity after restocking a repaired returned item.
 */
export function calculateRestoredStock(currentStock, quantityToRestore) {
  const base = Math.max(0, Number(currentStock || 0))
  const add = Math.max(0, Number(quantityToRestore || 0))
  return base + add
}

/**
 * Computes financial loss value for damaged or scrapped inventory.
 */
export function calculateDamagedFinancialLoss(records = []) {
  return records
    .filter((r) => r.dispositionStatus === 'written_off' || r.dispositionStatus === 'disposed')
    .reduce((sum, r) => {
      const qty = Number(r.quantity || 0)
      const cost = Number(r.unitCost || r.unitPrice || r.price || 0)
      return sum + qty * cost
    }, 0)
}
