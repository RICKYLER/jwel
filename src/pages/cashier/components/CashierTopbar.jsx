import { useEffect, useRef, useState } from 'react'
import bykelinkLogo from '../../../assets/bykelinklogo.png'
import ConfirmationModal from '../../superadmin/components/ConfirmationModal'

export default function CashierTopbar({
  currentUser,
  branchName,
  cashierName,
  dateLabel,
  timeLabel,
  shiftStatus,
  onNavigateToProfile,
  onSignOut,
  onToggleSidebar,
  isSidebarOpen,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const menuRef = useRef(null)
  const now = new Date()

  const displayName = cashierName || currentUser?.displayName || currentUser?.fullName || currentUser?.email?.split('@')[0] || 'Cashier'
  const resolvedBranchName =
    branchName ||
    currentUser?.branchLocation ||
    currentUser?.branch ||
    currentUser?.location ||
    currentUser?.storeLocation ||
    currentUser?.profile?.location ||
    'Bykelink HQ'

  const resolvedDate = dateLabel || new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(now)
  const resolvedTime = timeLabel || new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(now)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogoutClick = () => {
    setMenuOpen(false)
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    setShowLogoutConfirm(false)
    if (onSignOut) onSignOut()
  }

  return (
    <>
    <header className="cashier-topbar">
      <div className="cashier-topbar-brand">
        <div className="cashier-topbar-logo-wrap">
          <img
            src={bykelinkLogo}
            alt="Bykelink logo"
            className="cashier-topbar-logo-image"
          />

          <div className="cashier-topbar-brand-copy">
            <span className="cashier-topbar-title">BYEKLINK MOTOR INC.</span>
            <span className="cashier-topbar-subtitle">TAGUM CITY</span>
          </div>
        </div>
      </div>

      <div className="cashier-topbar-meta">
        <div className="cashier-topbar-block">
          <span className="cashier-topbar-label">Branch Location</span>
          <strong>{resolvedBranchName}</strong>
        </div>

        <div className="cashier-topbar-block">
          <span className="cashier-topbar-label">Cashier:</span>
          <strong>{displayName}</strong>
          <span className="cashier-topbar-subtext">Register #01</span>
        </div>

        <div className="cashier-topbar-block compact">
          <span className="cashier-topbar-label">{resolvedDate}</span>
          <strong>{resolvedTime}</strong>
        </div>

        <div className="cashier-topbar-user-controls" ref={menuRef}>
          <button
            type="button"
            className="cashier-user-menu-button"
            aria-label="Open user menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="cashier-user-avatar">{displayName?.charAt(0)?.toUpperCase() || 'C'}</span>
            <span className="cashier-user-name">{displayName}</span>
            <span className="cashier-user-caret">▾</span>
          </button>

          {menuOpen && (
            <div className="cashier-user-menu" role="menu" aria-label="User menu">
              <button type="button" className="cashier-user-menu-item danger" onClick={handleLogoutClick}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    <ConfirmationModal
      open={showLogoutConfirm}
      title="Log out"
      message="Are you sure you want to log out? You will need to sign in again to access the cashier dashboard."
      confirmText="Log out"
      cancelText="Cancel"
      isDangerous
      isDarkMode
      onConfirm={confirmLogout}
      onCancel={() => setShowLogoutConfirm(false)}
    />
    </>
  )
}
