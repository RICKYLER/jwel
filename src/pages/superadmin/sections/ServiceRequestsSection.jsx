import './ServiceRequestsSection.css'

export default function ServiceRequestsSection({
  requests,
  canEditOperations,
  serviceStatusOptions,
  handleCollectionUpdate,
  formatCurrency,
  formatDate,
  getStatusClasses,
  isDarkMode = true,
}) {
  // Helper to get conditional text colors
  const getTextClass = (intensity) => {
    if (isDarkMode) {
      return intensity === 'main' ? 'text-white' : intensity === 'secondary' ? 'text-white/70' : 'text-white/40'
    }
    return intensity === 'main' ? 'text-gray-900' : intensity === 'secondary' ? 'text-gray-600' : 'text-gray-500'
  }

  const getBgClass = () => isDarkMode ? 'bg-white/5' : 'bg-gray-100'
  const getBorderClass = () => isDarkMode ? 'border-white/10' : 'border-gray-300'
  const getSelectBgClass = () => isDarkMode ? 'bg-[#101010]' : 'bg-white'
  
  return (
    <section className={`service-requests-section rounded-xl p-6 ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className={`font-['Epilogue'] text-xl font-extrabold uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Service Requests
          </h3>
          <p className={`text-sm ${getTextClass('tertiary')}`}>Realtime booking queue from `serviceBookings`.</p>
        </div>
        <div className={`rounded-full ${getBgClass()} px-4 py-2 text-xs font-bold ${getTextClass('secondary')}`}>
          {requests.length} synced requests
        </div>
      </div>

      <div className="service-requests-list grid gap-4">
        {requests.map((request) => (
          <div key={request.id} className={`service-request-card grid gap-4 rounded-2xl p-4 lg:grid-cols-[1.2fr_1fr_0.8fr] lg:items-center`}>
            <div>
              <p className={`text-xs uppercase tracking-[0.24em] ${getTextClass('tertiary')}`}>{request.bookingId || request.id}</p>
              <h4 className={`mt-2 text-lg font-bold ${getTextClass('main')}`}>{request.customerName || request.customer || 'Walk-in Client'}</h4>
              <p className={`text-sm ${getTextClass('secondary')}`}>
                {request.model || 'Yamaha Unit'} • {request.service || 'General Service'}
              </p>
              <p className={`mt-1 text-xs ${getTextClass('tertiary')}`}>Updated {formatDate(request.updatedAt || request.createdAt)}</p>
            </div>
            <div className={`space-y-2 text-sm ${getTextClass('secondary')}`}>
              <p>Package: <span className={`font-semibold ${getTextClass('main')}`}>{request.package || 'Standard'}</span></p>
              <p>Est. Hours: <span className={`font-semibold ${getTextClass('main')}`}>{request.estimatedHours ?? 4}</span></p>
              <p>Cost: <span className={`font-semibold ${getTextClass('main')}`}>{formatCurrency(request.cost ?? 0)}</span></p>
            </div>
            <div className="space-y-2">
              <select
                value={request.status || 'Pending'}
                onChange={(event) => handleCollectionUpdate('serviceBookings', request.id, { status: event.target.value })}
                disabled={!canEditOperations}
                className={`w-full rounded-xl border ${getBorderClass()} ${getSelectBgClass()} px-3 py-2 text-sm ${getTextClass('main')} outline-none disabled:opacity-70`}
              >
                {serviceStatusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getStatusClasses(request.status)}`}>
                {request.status || 'Pending'}
              </span>
            </div>
          </div>
        ))}

        {!requests.length && (
          <div className={`service-request-empty rounded-2xl p-8 text-center ${getTextClass('secondary')}`}>
            No Firebase service requests found yet.
          </div>
        )}
      </div>
    </section>
  )
}
