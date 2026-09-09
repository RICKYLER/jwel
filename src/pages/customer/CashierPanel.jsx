import { useMemo, useState } from 'react'
import './CashierPanel.css'

export default function CashierPanel({
  currentUser,
  onNavigateBack,
  onNavigateToService,
  onNavigateToServiceBookings,
  onNavigateToMessages,
  onNavigateToProfile,
  onNavigateToFinancingStatus,
  onSignOut,
}) {
  const [selectedTab, setSelectedTab] = useState('payments')
  const [search, setSearch] = useState('')

  const payments = useMemo(
    () => [
      {
        id: 'INV-2048',
        customer: 'John Ramos',
        service: 'Chain Servicing',
        amount: 680.0,
        status: 'Pending',
        createdAt: '2026-09-09 09:20 AM',
      },
      {
        id: 'INV-2049',
        customer: 'Maria Santos',
        service: 'Change Oil',
        amount: 350.0,
        status: 'Paid',
        createdAt: '2026-09-09 10:05 AM',
      },
      {
        id: 'INV-2050',
        customer: 'Alex Tan',
        service: 'General Inspection',
        amount: 1250.0,
        status: 'Pending',
        createdAt: '2026-09-09 11:40 AM',
      },
    ],
    [],
  )

  const filteredPayments = payments.filter((payment) => {
    const combined = `${payment.customer} ${payment.service} ${payment.id} ${payment.status}`.toLowerCase()
    return combined.includes(search.toLowerCase())
  })

  return (
    <div className="cashier-panel-page">
      <section className="cashier-panel-shell">
        <aside className="cashier-panel-sidebar">
          <div className="cashier-brand">
            <span className="cashier-brand-mark">BK</span>
            <span>
              <span className="cashier-brand-title">Cashier</span>
              <span className="cashier-brand-subtitle">Dashboard</span>
            </span>
          </div>

          <div className="cashier-menu">
            <button className={selectedTab === 'payments' ? 'active' : ''} onClick={() => setSelectedTab('payments')}>
              Payments
            </button>
            <button className={selectedTab === 'collections' ? 'active' : ''} onClick={() => setSelectedTab('collections')}>
              Collections
            </button>
            <button className={selectedTab === 'receipts' ? 'active' : ''} onClick={() => setSelectedTab('receipts')}>
              Receipts
            </button>
          </div>

          <div className="cashier-user-card">
            <span className="cashier-user-avatar">
              {currentUser?.displayName?.[0] || 'C'}
            </span>
            <div>
              <span className="cashier-user-name">{currentUser?.displayName || 'Cashier User'}</span>
              <span className="cashier-user-role">Cashier Personnel</span>
            </div>
          </div>

          <button className="cashier-logout" onClick={onSignOut}>
            Sign Out
          </button>
        </aside>

        <main className="cashier-panel-main">
          <section className="cashier-panel-top">
            <div>
              <span className="cashier-kicker">Cashier Panel</span>
              <h1>Transaction Center</h1>
            </div>
            <div className="cashier-top-actions">
              <button className="cashier-secondary" onClick={onNavigateToService}>Services</button>
              <button className="cashier-primary" onClick={onNavigateToServiceBookings}>My Service Bookings</button>
            </div>
          </section>

          <section className="cashier-card-grid">
            <article className="cashier-metric-card">
              <span className="cashier-metric-label">Today’s Sales</span>
              <span className="cashier-metric-value">₱7,480.00</span>
              <span className="cashier-metric-note">+12.6% vs yesterday</span>
            </article>
            <article className="cashier-metric-card">
              <span className="cashier-metric-label">Collections</span>
              <span className="cashier-metric-value">₱3,920.00</span>
              <span className="cashier-metric-note">5 invoices due</span>
            </article>
            <article className="cashier-metric-card">
              <span className="cashier-metric-label">Pending</span>
              <span className="cashier-metric-value">02</span>
              <span className="cashier-metric-note">Awaiting settlement</span>
            </article>
          </section>

          <section className="cashier-table-panel">
            <section className="cashier-table-header">
              <div>
                <span className="cashier-table-title">Payment Records</span>
              </div>
              <div className="cashier-table-tools">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customer or service"
                  className="cashier-search"
                />
                <button className="cashier-primary small">+ New Receipt</button>
              </div>
            </section>

            <div className="cashier-table-wrap">
              <table className="cashier-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="cashier-invoice">{payment.id}</td>
                      <td>{payment.customer}</td>
                      <td>{payment.service}</td>
                      <td className="cashier-amount">₱{payment.amount.toFixed(2)}</td>
                      <td>
                        <span className={`cashier-status ${payment.status.toLowerCase()}`}>{payment.status}</span>
                      </td>
                      <td>{payment.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPayments.length === 0 && (
                <div className="cashier-empty-state">No records found</div>
              )}
            </div>
          </section>
        </main>
      </section>
    </div>
  )
}
