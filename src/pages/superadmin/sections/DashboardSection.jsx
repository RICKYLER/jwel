import EngineeringRoundedIcon from '@mui/icons-material/EngineeringRounded'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'
import './DashboardSection.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
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
  const timelineData = serviceRequests
    .slice(0, 40)
    .map((request) => {
      const mechanicKey = request.assignedTechnician || request.assignedMechanic || request.assignedTo || ''
      const requestDate = request.createdAt?.toDate ? request.createdAt.toDate() : new Date(request.createdAt || Date.now())

      return {
        x: requestDate,
        y: request.status?.toLowerCase() === 'completed' ? 3 : request.status?.toLowerCase() === 'in progress' ? 2 : 1,
        mechanic: mechanicKey || 'Unassigned',
        status: request.status || 'Pending',
      }
    })
    .filter((point) => point.x instanceof Date && !Number.isNaN(point.x.getTime()))

  const activityByDay = timelineData.reduce((days, row) => {
    const day = new Date(row.x)
    day.setHours(0, 0, 0, 0)
    const key = day.getTime()
    const current = days.get(key) || { date: day, total: 0, completed: 0 }
    current.total += 1
    if (String(row.status).toLowerCase() === 'completed') current.completed += 1
    days.set(key, current)
    return days
  }, new Map())

  const dailyActivity = Array.from(activityByDay.values()).sort((firstDay, secondDay) => firstDay.date - secondDay.date)
  const chartLabels = dailyActivity.map((day) => new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(day.date))
  const dailyServices = dailyActivity.map((day) => day.total)
  const completedServices = dailyActivity.map((day) => day.completed)
  const activityTrend = dailyActivity.map((day, index) => dailyActivity.slice(0, index + 1).reduce((total, currentDay) => total + currentDay.total, 0))
  const dailyMax = Math.max(...dailyServices, 0)
  const trendMax = Math.max(...activityTrend, 0)

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Total Services',
        data: dailyServices,
        type: 'bar',
        backgroundColor: 'rgba(164,60,71,0.72)',
        borderColor: '#a43c47',
        yAxisID: 'daily',
        borderWidth: 1,
        borderRadius: 0,
        barPercentage: 0.82,
        categoryPercentage: 0.72,
        order: 3,
      },
      {
        label: 'Completed',
        data: completedServices,
        type: 'bar',
        backgroundColor: isDarkMode ? 'rgba(174,184,197,0.72)' : 'rgba(104,116,133,0.55)',
        borderColor: isDarkMode ? '#aeb8c5' : '#687485',
        yAxisID: 'daily',
        borderWidth: 1,
        borderRadius: 0,
        barPercentage: 0.82,
        categoryPercentage: 0.72,
        order: 2,
      },
      {
        label: 'Activity Trend',
        data: activityTrend,
        type: 'line',
        borderColor: '#C51D34',
        backgroundColor: 'rgba(164,60,71,0.08)',
        yAxisID: 'cumulative',
        borderWidth: 3,
        fill: false,
        tension: 0,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#C51D34',
        pointBorderColor: isDarkMode ? '#1d1d1f' : '#ffffff',
        pointBorderWidth: 2,
        order: 1,
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
        position: 'top',
        align: 'center',
        labels: {
          color: isDarkMode ? '#fff' : '#111827',
          usePointStyle: true,
          boxWidth: 10,
          padding: 20,
          font: {
            size: 12,
            weight: '600',
          },
        },
      },
      tooltip: {
        displayColors: true,
        callbacks: {
          title(context) {
            return context[0]?.label || ''
          },
          label(context) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${value} service${value === 1 ? '' : 's'}`
          },
        },
      },
    },
    scales: {
      x: {
        type: 'category',
        grid: {
          color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
        },
        ticks: {
          color: isDarkMode ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)',
          autoSkip: true,
          maxTicksLimit: 10,
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        display: false,
      },
      daily: {
        beginAtZero: true,
        suggestedMax: Math.max(5, dailyMax + 2),
        title: {
          display: true,
          text: 'Daily services',
          color: isDarkMode ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.58)',
          font: { size: 11, weight: '600' },
        },
        grid: {
          color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
        },
        ticks: {
          color: isDarkMode ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)',
          stepSize: 1,
          precision: 0,
        },
      },
      cumulative: {
        position: 'right',
        beginAtZero: true,
        suggestedMax: Math.max(5, trendMax + 2),
        title: {
          display: true,
          text: 'Cumulative total',
          color: isDarkMode ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.58)',
          font: { size: 11, weight: '600' },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: isDarkMode ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)',
          precision: 0,
        },
      },
    },
  }

  return (
    <div className={`dashboard-section ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="dashboard-section-grid">
        <section className={`dashboard-chart-card lg:col-span-2 ${!isDarkMode ? 'light-mode' : ''}`}>
          <div className="dashboard-card-heading">
            <h3 className="dashboard-panel-title">
              Service Momentum
              <span className="dashboard-panel-subtitle">
                Live workload
              </span>
            </h3>
            <div className="dashboard-live-status">
              Live Data
            </div>
          </div>

          <div className="dashboard-chart-bars">
            <div className="dashboard-chart-canvas">
              <Chart type="bar" data={chartData} options={chartOptions} />
            </div>
          </div>
        </section>

        <aside className={`dashboard-crew-card ${!isDarkMode ? 'light-mode' : ''}`}>
          <div className="dashboard-card-heading">
            <h3 className="dashboard-panel-title">
              Crew Status
            </h3>
            <span className="dashboard-live-status">
              LIVE
            </span>
          </div>

          <div className="dashboard-crew-list">
            {technicians
              .filter((member) => (member.role || member.personnelRole || '').toLowerCase().includes('mechanic'))
              .slice(0, 4)
              .map((member) => (
                <div key={member.id} className="dashboard-crew-member">
                  <div className="dashboard-crew-avatar">
                    <EngineeringRoundedIcon sx={{ fontSize: 22 }} />
                    <span
                      className={`dashboard-crew-presence ${
                        String(member.status || '').toLowerCase() === 'online' ? 'is-online' : ''
                      }`}
                    />
                  </div>
                  <div className="dashboard-crew-details">
                    <p className="dashboard-crew-name">{member.name || 'Mechanics Personnel'}</p>
                    <p className="dashboard-crew-specialty">
                      {member.specialty || 'General Service'}
                    </p>
                  </div>
                  <div className="dashboard-crew-load">
                    <p>
                      {member.activeJobs ?? 0} / {member.capacity ?? 4}
                    </p>
                    <span>Load</span>
                  </div>
                </div>
              ))}
          </div>
        </aside>
      </div>

      <section className={`dashboard-dispatch-card ${!isDarkMode ? 'light-mode' : ''}`}>
        <div className="dashboard-dispatch-heading">
          <h3 className="dashboard-panel-title">
            Recent Dispatch
          </h3>
          <button
            type="button"
            onClick={() => setActiveSection('service-requests')}
            className="dashboard-view-all"
          >
            View All Operations
          </button>
        </div>

        <div className="dispatch-table-shell overflow-x-auto">
          <table className="dashboard-table">
            <thead>
              <tr className={isDarkMode ? 'bg-black/20 text-left' : 'bg-gray-100 text-left'}>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Machine Model</th>
                <th>Service Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {serviceRequests.slice(0, 6).map((row) => (
                <tr key={row.id}>
                  <td className="dashboard-dispatch-id">{row.bookingId || row.id}</td>
                  <td>
                    <div className="dashboard-dispatch-primary">{row.customerName || row.customer || 'Customer'}</div>
                    <div className="dashboard-dispatch-secondary">{row.tier || 'Standard Tier'}</div>
                  </td>
                  <td>
                    <div className="dashboard-dispatch-primary">{row.model || 'Yamaha Unit'}</div>
                    <div className="dashboard-dispatch-secondary">{row.package || 'Standard'}</div>
                  </td>
                  <td>{row.service || 'General Service'}</td>
                  <td>
                    <span className={`dashboard-status-pill ${getStatusClasses(row.status)}`}>
                      {row.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}

              {!serviceRequests.length && (
                <tr>
                  <td colSpan={5} className="dashboard-empty">
                    No service bookings yet. Use <strong>New Entry</strong> to add one to the system.
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
