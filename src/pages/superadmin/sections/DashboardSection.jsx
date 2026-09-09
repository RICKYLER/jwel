import EngineeringRoundedIcon from '@mui/icons-material/EngineeringRounded'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'
import './DashboardSection.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
)

export default function DashboardSection({
  chartBars,
  technicians,
  serviceRequests,
  setActiveSection,
  getStatusClasses,
  isDarkMode = true,
}) {
  const mechanicSeries = technicians
    .filter((member) => (member.role || member.personnelRole || '').toLowerCase().includes('mechanic'))
    .slice(0, 4)

  const mechanicLookup = new Map(mechanicSeries.map((member) => [member.email || member.id || member.name, member]))

  const timelineData = serviceRequests
    .slice(0, 40)
    .map((request) => {
      const mechanicKey = request.assignedTechnician || request.assignedMechanic || request.assignedTo || ''
      const mechanic = mechanicLookup.get(mechanicKey) || mechanicLookup.get(request.assignedTechnician?.toLowerCase?.() || '')
      const requestDate = request.createdAt?.toDate ? request.createdAt.toDate() : new Date(request.createdAt || Date.now())

      return {
        x: requestDate,
        y: request.status?.toLowerCase() === 'completed' ? 3 : request.status?.toLowerCase() === 'in progress' ? 2 : 1,
        mechanic: mechanic?.name || 'Unassigned',
        status: request.status || 'Pending',
      }
    })
    .filter((point) => point.x instanceof Date && !Number.isNaN(point.x.getTime()))

  const perMechanicData = mechanicSeries.map((mechanic, idx) => {
    const mechanicName = mechanic.name || 'Mechanics Personnel'
    const color = ['#C51D34', '#22c55e', '#38bdf8', '#fbbf24'][idx % 4]
    const points = timelineData
      .filter((row) => row.mechanic === mechanicName)
      .map((row) => ({ x: row.x, y: row.y }))

    return {
      label: mechanicName,
      data: points,
      borderColor: color,
      backgroundColor: color + 'AA',
      borderWidth: 2,
      fill: false,
      tension: 0.25,
      showLine: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      type: 'line',
    }
  })

  const chartData = {
    datasets: [
      ...perMechanicData,
      {
        label: 'Service Activity',
        data: timelineData.map((row) => ({ x: row.x, y: row.y })),
        type: 'bar',
        backgroundColor: isDarkMode ? 'rgba(197,29,52,0.18)' : 'rgba(197,29,52,0.10)',
        borderColor: '#C51D34',
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 12,
        order: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? '#fff' : '#111827',
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label(context) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${value}`
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'MMM d, yyyy',
        },
        grid: {
          color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
        },
        ticks: {
          color: isDarkMode ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)',
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 5,
        grid: {
          color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
        },
        ticks: {
          color: isDarkMode ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)',
          stepSize: 1,
        },
      },
    },
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
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
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
