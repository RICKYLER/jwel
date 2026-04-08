import './ServiceRequestsSection.css'

export default function ServiceRequestsSection({
  requests,
  canEditOperations,
  serviceStatusOptions,
  handleCollectionUpdate,
  formatCurrency,
  formatDate,
  getStatusClasses,
}) {
  return (
    <section className="service-requests-section rounded-xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-['Epilogue'] text-xl font-extrabold uppercase italic tracking-tighter">
            Service Requests
          </h3>
          <p className="text-sm text-white/40">Realtime booking queue from `serviceBookings`.</p>
        </div>
        <div className="rounded-full bg-white/5 px-4 py-2 text-xs font-bold text-white/70">
          {requests.length} synced requests
        </div>
      </div>

      <div className="service-requests-list grid gap-4">
        {requests.map((request) => (
          <div key={request.id} className="service-request-card grid gap-4 rounded-2xl p-4 lg:grid-cols-[1.2fr_1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">{request.bookingId || request.id}</p>
              <h4 className="mt-2 text-lg font-bold text-white">{request.customerName || request.customer || 'Walk-in Client'}</h4>
              <p className="text-sm text-white/60">
                {request.model || 'Yamaha Unit'} • {request.service || 'General Service'}
              </p>
              <p className="mt-1 text-xs text-white/40">Updated {formatDate(request.updatedAt || request.createdAt)}</p>
            </div>
            <div className="space-y-2 text-sm text-white/70">
              <p>Package: <span className="font-semibold text-white">{request.package || 'Standard'}</span></p>
              <p>Est. Hours: <span className="font-semibold text-white">{request.estimatedHours ?? 4}</span></p>
              <p>Cost: <span className="font-semibold text-white">{formatCurrency(request.cost ?? 0)}</span></p>
            </div>
            <div className="space-y-2">
              <select
                value={request.status || 'Pending'}
                onChange={(event) => handleCollectionUpdate('serviceBookings', request.id, { status: event.target.value })}
                disabled={!canEditOperations}
                className="w-full rounded-xl border border-white/10 bg-[#101010] px-3 py-2 text-sm text-white outline-none disabled:opacity-70"
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
          <div className="service-request-empty rounded-2xl p-8 text-center text-white/50">
            No Firebase service requests found yet.
          </div>
        )}
      </div>
    </section>
  )
}
