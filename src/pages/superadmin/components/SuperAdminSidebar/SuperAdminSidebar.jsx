import './SuperAdminSidebar.css'
import bykelinkLogo from '../../../../assets/bykelinklogo.png'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'

import { useSidebarLogic } from './superAdminSidebarLogic'

export default function SuperAdminSidebar({
  sidebarItems,
  activeSection,
  onSectionChange,
  isSidebarOpen,
  onCloseSidebar,
  onNavigateHome,
  onSignOut,
  consoleLabel,
  userMenuAccess = [],
  isDarkMode = true,
}) {
  const {
    expandedItem,
    handleItemClick,
  } = useSidebarLogic(onSectionChange)

  // Map menu access IDs to sidebar item IDs
  const menuAccessMap = {
    'dashboard': 'dashboard',
    'user-management': 'user-management',
    'inventory': 'inventory-management',
    'services': 'service-management',
    'bookings': 'financing-applications',
    'messages': 'chats-management',
    'reports': 'analytics',
    'settings': 'profile',
  }

  // Filter sidebar items based on menu access if provided
  const visibleItems = userMenuAccess.length > 0
    ? sidebarItems.filter((item) => {
        const mappedId = menuAccessMap[item.id] || item.id
        const isAllowed = userMenuAccess.includes(mappedId) || userMenuAccess.includes(item.id)
        
        if (!isAllowed) return false
        
        // Filter subitems based on menu access
        if (item.subitems) {
          const hasVisibleSubitems = item.subitems.some((sub) =>
            userMenuAccess.includes(sub.id) || Object.values(menuAccessMap).includes(sub.id)
          )
          return hasVisibleSubitems || isAllowed
        }
        
        return true
      })
    : sidebarItems

  return (
    <>
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onCloseSidebar}
          className="superadmin-sidebar-overlay"
        />
      )}

      <aside
        className={`superadmin-sidebar ${
          isSidebarOpen ? 'is-open' : ''
        }`}
      >
        <div className="superadmin-header">
          <button
            type="button"
            onClick={onNavigateHome}
            className="superadmin-brand-block"
          >
            <img
              src={bykelinkLogo}
              alt="Bykelink Logo"
              className="superadmin-logo"
            />

            <span>
              <h1 className="superadmin-brand-title">
                BYKELINK
              </h1>

              <p className="superadmin-brand-subtitle">
                {consoleLabel} Console
              </p>
            </span>
          </button>

          <button
            type="button"
            onClick={onCloseSidebar}
            className="superadmin-sidebar-close"
            aria-label="Close menu"
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <nav className="superadmin-nav">
          {visibleItems.map((item) => {
            const Icon = item.icon

            const isActive = activeSection === item.id
            const isExpanded = expandedItem === item.id

            const hasSubitems =
              item.subitems &&
              item.subitems.length > 0

            const isSubitemActive =
              item.subitems?.some(
                (sub) =>
                  activeSection === sub.id
              )

            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() =>
                    handleItemClick(item)
                  }
                  className={`superadmin-nav-item ${
                    isActive ||
                    isSubitemActive
                      ? 'is-active'
                      : ''
                  }`}
                >
                  <Icon
                    sx={{ fontSize: 20 }}
                    className="superadmin-nav-icon"
                  />

                  <span>{item.label}</span>

                  <div className="superadmin-nav-right">
                    {item.badge && (
                      <span className="superadmin-badge">
                        {Math.min(
                          item.badge,
                          9
                        )}
                      </span>
                    )}

                    {hasSubitems && (
                      <ExpandMoreRoundedIcon
                        sx={{
                          fontSize: 18,
                          transform:
                            isExpanded
                              ? 'rotate(180deg)'
                              : 'rotate(0deg)',
                          transition:
                            'transform 0.3s',
                        }}
                      />
                    )}
                  </div>
                </button>

                {hasSubitems &&
                  isExpanded && (
                    <div className="superadmin-submenu">
                      {item.subitems.map(
                        (subitem) => (
                          <button
                            key={
                              subitem.id
                            }
                            type="button"
                            onClick={() =>
                              onSectionChange(
                                subitem.id
                              )
                            }
                            className={`superadmin-nav-subitem ${
                              activeSection ===
                              subitem.id
                                ? 'is-active'
                                : ''
                            }`}
                          >
                            {
                              subitem.label
                            }
                          </button>
                        )
                      )}
                    </div>
                  )}
              </div>
            )
          })}
        </nav>

        <div className="superadmin-footer">
          <button
            type="button"
            className="superadmin-sidebar-action"
          >
            <HelpOutlineRoundedIcon
              sx={{ fontSize: 18 }}
              className="superadmin-action-icon"
            />

            Support
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="superadmin-sidebar-action"
          >
            <LogoutRoundedIcon
              sx={{ fontSize: 20 }}
              className="superadmin-action-icon"
            />

            Logout
          </button>
        </div>
      </aside>
    </>
  )
}