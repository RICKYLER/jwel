import EngineeringRoundedIcon from '@mui/icons-material/EngineeringRounded'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './DashboardSection.css'

export default function DashboardSection({
  chartBars,
  technicians,
  serviceRequests,
  setActiveSection,
  getStatusClasses,
  isDarkMode = true,
}) {
  // Transform chartBars into data format for recharts
  const chartData = chartBars.map((value, index) => ({
    name: `Week ${index + 1}`,
    value: Math.round(value),
  }))

  const chartColors = {
    axisStroke: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
    gridStroke: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    tooltipBg: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
    tooltipBorder: isDarkMode ? 'rgba(197, 29, 52, 0.5)' : 'rgba(197, 29, 52, 0.3)',
    tooltipText: isDarkMode ? '#fff' : '#000',
    cursorStroke: isDarkMode ? 'rgba(197, 29, 52, 0.5)' : 'rgba(197, 29, 52, 0.3)',
    textColor: isDarkMode ? '#fff' : '#1f2937',
  }

  return (
    <div className={`dashboard-section space-y-12 ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="dashboard-section-grid">
        <section className={`dashboard-chart-card rounded-xl p-8 lg:col-span-2 ${!isDarkMode ? 'light-mode' : ''}`}>
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className={`font-['Epilogue'] text-xl font-extrabold uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Service Momentum
              <span className={`ml-2 font-['Manrope'] text-sm font-normal ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                Firebase-derived workload
              </span>
            </h3>
            <div className={`rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-emerald-600/30 bg-emerald-50 text-emerald-700'}`}>
              Live Data
            </div>
          </div>

          <div className="dashboard-chart-bars relative h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C51D34" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#C51D34" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke={chartColors.axisStroke}
                  style={{ fontSize: '12px', fill: chartColors.axisStroke }}
                />
                <YAxis 
                  stroke={chartColors.axisStroke}
                  style={{ fontSize: '12px', fill: chartColors.axisStroke }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    borderRadius: '8px',
                    color: chartColors.tooltipText,
                  }}
                  cursor={{ stroke: chartColors.cursorStroke, strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#C51D34"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <aside className={`dashboard-crew-card rounded-xl p-6 ${!isDarkMode ? 'light-mode' : ''}`}>
          <div className="mb-6 flex items-center justify-between">
            <h3 className={`font-['Epilogue'] text-lg font-extrabold uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Crew Status
            </h3>
            <span className={`rounded border px-2 py-1 text-[10px] font-black ${isDarkMode ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'border-emerald-600/30 bg-emerald-50 text-emerald-700'}`}>
              LIVE
            </span>
          </div>

          <div className="space-y-6">
            {technicians
              .filter((member) => (member.role || member.personnelRole || '').toLowerCase().includes('mechanic'))
              .slice(0, 4)
              .map((member) => (
                <div key={member.id} className="flex items-center gap-4">
                  <div className={`relative flex h-12 w-12 items-center justify-center rounded-lg border text-[#C51D34] ${isDarkMode ? 'border-[#C51D34]/30 bg-[#C51D34]/10' : 'border-[#C51D34]/20 bg-[#C51D34]/5'}`}>
                    <EngineeringRoundedIcon sx={{ fontSize: 22 }} />
                    <span
                      className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 ${isDarkMode ? 'border-[#1c1b1b]' : 'border-white'} ${
                        String(member.status || '').toLowerCase() === 'online' ? 'bg-emerald-500' : 'bg-gray-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{member.name || 'Mechanics Personnel'}</p>
                    <p className={`text-[10px] uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                      {member.specialty || 'General Service'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#C51D34]">
                      {member.activeJobs ?? 0} / {member.capacity ?? 4}
                    </p>
                    <p className={`text-[10px] ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Load</p>
                  </div>
                </div>
              ))}
          </div>
        </aside>
      </div>

      <section className={`dashboard-dispatch-card overflow-hidden rounded-xl ${!isDarkMode ? 'light-mode' : ''}`}>
        <div className={`flex items-center justify-between border-b px-8 py-6 ${isDarkMode ? 'border-white/5 bg-white/2' : 'border-gray-200 bg-gray-50'}`}>
          <h3 className={`font-['Epilogue'] text-xl font-extrabold uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Dispatch
          </h3>
          <button
            type="button"
            onClick={() => setActiveSection('service-requests')}
            className="text-xs font-bold text-[#C51D34] hover:underline"
          >
            View All Operations
          </button>
        </div>

        <div className="dispatch-table-shell overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? 'bg-black/20 text-left' : 'bg-gray-100 text-left'}>
                <th className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-600'}`}>Booking ID</th>
                <th className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-600'}`}>Customer</th>
                <th className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-600'}`}>Machine Model</th>
                <th className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-600'}`}>Service Type</th>
                <th className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-600'}`}>Status</th>
              </tr>
            </thead>
            <tbody className={isDarkMode ? 'divide-y divide-white/5' : 'divide-y divide-gray-200'}>
              {serviceRequests.slice(0, 6).map((row) => (
                <tr key={row.id} className={isDarkMode ? 'transition-colors hover:bg-white/3' : 'transition-colors hover:bg-gray-50'}>
                  <td className={`px-8 py-5 text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{row.bookingId || row.id}</td>
                  <td className="px-8 py-5">
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{row.customerName || row.customer || 'Customer'}</div>
                    <div className={`text-[10px] ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>{row.tier || 'Standard Tier'}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`text-sm font-bold italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{row.model || 'Yamaha Unit'}</div>
                    <div className={`text-[10px] uppercase ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>{row.package || 'Standard'}</div>
                  </td>
                  <td className={`px-8 py-5 text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>{row.service || 'General Service'}</td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getStatusClasses(row.status)}`}>
                      {row.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}

              {!serviceRequests.length && (
                <tr>
                  <td colSpan={5} className={`px-8 py-8 text-center text-sm ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                    No service bookings yet. Use <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>New Entry</span> to add one to Firebase.
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
