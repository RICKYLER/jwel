export const roleOptions = [
  'customer',
  'mechanics personnel',
  'inventory personnel',
  'cashier personnel',
  'front desk personnel',
  'admin',
  'superadmin',
]
export const serviceStatusOptions = ['Pending', 'In Progress', 'Completed', 'Cancelled']
export const financingStatusOptions = ['Submitted', 'Reviewing', 'Approved', 'Rejected']
export const technicianStatusOptions = ['Online', 'Busy', 'Offline']
export const inventoryStatusOptions = ['In Stock', 'Low Stock', 'Out of Stock']

export const fallbackTechnicians = [
  {
    id: 'fallback-marcus',
    name: 'Marcus Thorne',
    specialty: 'Master Specialist',
    activeJobs: 3,
    capacity: 4,
    status: 'Online',
  },
  {
    id: 'fallback-elena',
    name: 'Elena Vance',
    specialty: 'Engine Tuning',
    activeJobs: 2,
    capacity: 4,
    status: 'Online',
  },
  {
    id: 'fallback-jin',
    name: 'Jin Sakai',
    specialty: 'Systems Diagnostics',
    activeJobs: 4,
    capacity: 4,
    status: 'Busy',
  },
]

export const normalizeText = (value = '') => String(value).trim().toLowerCase()

export const formatCurrency = (value) => {
  const parsedValue = Number(value || 0)

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(parsedValue) ? parsedValue : 0)
}

export const formatDate = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null

  if (!date || Number.isNaN(date.getTime())) {
    return 'No timestamp'
  }

  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const getStatusTone = (status = '') => {
  const normalizedStatus = normalizeText(status)

  if (['completed', 'online', 'active', 'in stock', 'approved'].includes(normalizedStatus)) return 'emerald'
  if (['pending', 'busy', 'low stock', 'submitted', 'reviewing'].includes(normalizedStatus)) return 'amber'
  if (['in progress', 'out of stock', 'rejected'].includes(normalizedStatus)) return 'red'

  return 'slate'
}

export const getStatusClasses = (status = '') => {
  const tone = getStatusTone(status)

  if (tone === 'emerald') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  if (tone === 'amber') return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  if (tone === 'red') return 'text-[#ff8d8d] bg-[#e10100]/10 border-[#e10100]/20'

  return 'text-slate-300 bg-slate-500/10 border-slate-500/20'
}

export const buildChartBars = (items) => {
  if (!items.length) return [20, 30, 45, 55, 40, 60, 80]

  const buckets = [0, 0, 0, 0, 0, 0, 0]

  items.slice(0, 21).forEach((_, index) => {
    buckets[index % buckets.length] += 1
  })

  const maxBucket = Math.max(...buckets, 1)

  return buckets.map((bucket) => Math.max(14, Math.round((bucket / maxBucket) * 100)))
}
