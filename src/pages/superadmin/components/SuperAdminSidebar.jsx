import { useState } from 'react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'

export default function SuperAdminSidebar({
  sidebarItems,
  activeSection,
  onSectionChange,
  isSidebarOpen,
  onCloseSidebar,
  onNavigateHome,
  onSignOut,
  consoleLabel,
}) {
  const [expandedItem, setExpandedItem] = useState(null)

  const handleItemClick = (item) => {
    if (item.subitems && item.subitems.length > 0) {
      setExpandedItem(expandedItem === item.id ? null : item.id)
    } else {
      onSectionChange(item.id)
    }
  }

  return (
    <>
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onCloseSidebar}
          className="superadmin-sidebar-overlay lg:hidden"
        />
      )}

      <aside className={`superadmin-sidebar fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-white/5 py-8 shadow-[40px_0_60px_-15px_rgba(0,0,0,0.5)] ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="mb-10 flex items-start justify-between gap-3 px-4">
          <button type="button" onClick={onNavigateHome} className="superadmin-brand-block flex items-start gap-3 text-left">
            <span className="superadmin-brand-mark flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white">
              B
            </span>
            <span>
              <h1 className="superadmin-brand-title font-['Epilogue'] text-sm font-black uppercase tracking-[0.18em]">
                BYKELINK
              </h1>
              <p className="superadmin-brand-subtitle mt-1 text-[9px] uppercase tracking-[0.24em]">
                {consoleLabel} Console
              </p>
            </span>
          </button>

          <button
            type="button"
            onClick={onCloseSidebar}
            className="superadmin-sidebar-close inline-flex rounded-full border border-white/10 bg-white/5 p-2 lg:hidden"
            aria-label="Close menu"
          >
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 scrollbar-hide">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            const isExpanded = expandedItem === item.id
            const hasSubitems = item.subitems && item.subitems.length > 0
            const isSubitemActive = item.subitems?.some((sub) => activeSection === sub.id)

            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`superadmin-nav-item flex w-full items-center rounded-xl px-4 py-3 text-left font-['Epilogue'] text-[13px] font-bold transition-all duration-300 ${
                    isActive || isSubitemActive
                      ? 'is-active border-l-4 border-red-600 bg-linear-to-r from-red-600/10 to-transparent'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <Icon sx={{ fontSize: 20 }} className="mr-4" />
                  {item.label}
                  <div className="ml-auto flex items-center gap-2">
                    {item.badge && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-black text-white">
                        {Math.min(item.badge, 9)}
                      </span>
                    )}
                    {hasSubitems && (
                      <ExpandMoreRoundedIcon
                        sx={{ fontSize: 18, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
                      />
                    )}
                  </div>
                </button>

                {hasSubitems && isExpanded && (
                  <div className="mt-1 space-y-1 pl-4">
                    {item.subitems.map((subitem) => (
                      <button
                        key={subitem.id}
                        type="button"
                        onClick={() => {
                          onSectionChange(subitem.id)
                        }}
                        className={`superadmin-nav-subitem flex w-full items-center rounded-lg px-3 py-2.5 text-left font-['Epilogue'] text-xs font-bold transition-all duration-300 ${
                          activeSection === subitem.id
                            ? 'is-active border-l-2 border-red-600 bg-red-600/10 text-white'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {subitem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="mt-auto space-y-1 border-t border-white/5 px-2 pt-6">
          <button type="button" className="superadmin-sidebar-action flex w-full items-center rounded-xl px-4 py-3 font-['Epilogue'] text-[13px] font-bold transition-all duration-300">
            <HelpOutlineRoundedIcon sx={{ fontSize: 18 }} className="mr-3" />
            Support
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="superadmin-sidebar-action flex w-full items-center rounded-xl px-4 py-3 font-['Epilogue'] text-[13px] font-bold transition-all duration-300"
          >
            <LogoutRoundedIcon sx={{ fontSize: 20 }} className="mr-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
