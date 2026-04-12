import EngineeringRoundedIcon from '@mui/icons-material/EngineeringRounded'
import './DashboardSection.css'

export default function DashboardSection({
  chartBars,
  technicians,
  serviceRequests,
  setActiveSection,
  getStatusClasses,
}) {
  return (
    <div className="dashboard-section space-y-12">
      <div className="dashboard-section-grid">
        <section className="dashboard-chart-card rounded-xl p-8 lg:col-span-2">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-['Epilogue'] text-xl font-extrabold uppercase italic tracking-tighter">
              Service Momentum
              <span className="ml-2 font-['Manrope'] text-sm font-normal text-white/40">
                Firebase-derived workload
              </span>
            </h3>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
              Live Data
            </div>
          </div>

          <div className="dashboard-chart-bars relative flex h-64 items-end justify-between gap-2">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-0 w-full border-t border-white/5" />
              ))}
            </div>

            {chartBars.map((bar, index) => (
              <div
                key={`${bar}-${index}`}
                className={`flex-1 rounded-t transition-all duration-300 hover:bg-[#2563eb]/40 ${
                  index === chartBars.length - 1 ? 'bg-[#2563eb]' : 'bg-white/8'
                }`}
                style={{ height: `${bar}%` }}
              />
            ))}
          </div>

          <div className="mt-6 flex justify-between px-1 text-[10px] font-bold uppercase text-white/30">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Today</span>
          </div>
        </section>

        <aside className="dashboard-crew-card rounded-xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-['Epilogue'] text-lg font-extrabold uppercase italic tracking-tighter">
              Crew Status
            </h3>
            <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-500">
              LIVE
            </span>
          </div>

          <div className="space-y-6">
            {technicians.slice(0, 4).map((member) => (
              <div key={member.id} className="flex items-center gap-4">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-cyan-300">
                  <EngineeringRoundedIcon sx={{ fontSize: 22 }} />
                  <span
                    className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#1c1b1b] ${
                      String(member.status || '').toLowerCase() === 'online' ? 'bg-emerald-500' : 'bg-cyan-500'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{member.name || 'Technician'}</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">
                    {member.specialty || 'General Service'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#2563eb]">
                    {member.activeJobs ?? 0} / {member.capacity ?? 4}
                  </p>
                  <p className="text-[10px] text-white/40">Load</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <section className="dashboard-dispatch-card overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/2 px-8 py-6">
          <h3 className="font-['Epilogue'] text-xl font-extrabold uppercase italic tracking-tighter">
            Recent Dispatch
          </h3>
          <button
            type="button"
            onClick={() => setActiveSection('service-requests')}
            className="text-xs font-bold text-[#2563eb] hover:underline"
          >
            View All Operations
          </button>
        </div>

        <div className="dispatch-table-shell overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black/20 text-left">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Booking ID</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Customer</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Machine Model</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Service Type</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {serviceRequests.slice(0, 6).map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-white/3">
                  <td className="px-8 py-5 text-sm font-bold text-white">{row.bookingId || row.id}</td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-medium text-white">{row.customerName || row.customer || 'Customer'}</div>
                    <div className="text-[10px] text-white/40">{row.tier || 'Standard Tier'}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-bold italic text-white">{row.model || 'Yamaha Unit'}</div>
                    <div className="text-[10px] uppercase text-white/40">{row.package || 'Standard'}</div>
                  </td>
                  <td className="px-8 py-5 text-xs text-white/70">{row.service || 'General Service'}</td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getStatusClasses(row.status)}`}>
                      {row.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}

              {!serviceRequests.length && (
                <tr>
                  <td colSpan={5} className="px-8 py-8 text-center text-sm text-white/50">
                    No service bookings yet. Use <span className="font-bold text-white">New Entry</span> to add one to Firebase.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
