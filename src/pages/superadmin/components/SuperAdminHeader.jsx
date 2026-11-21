import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'

export default function SuperAdminHeader({
  searchTerm,
  onSearchChange,
  sectionTitle,
  isDarkMode,
  onToggleTheme,
  onToggleNotifications,
  notificationCount,
  adminName,
  consoleLabel,
  onOpenProfile,
  avatarUrl,
  isSidebarOpen,
  onToggleSidebar,
}) {
  return (
    <header className="superadmin-topbar fixed right-0 top-0 z-40 flex h-16 w-[calc(100%-16rem)] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="superadmin-mobile-toggle superadmin-topbar-icon mr-3 shrink-0"
        aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isSidebarOpen}
      >
        <MenuRoundedIcon sx={{ fontSize: 22 }} />
      </button>
      <div className="superadmin-topbar-search relative mr-auto max-w-md flex-1">
        <SearchRoundedIcon sx={{ fontSize: 18 }} className="superadmin-topbar-search-icon absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={`Search ${sectionTitle.toLowerCase()}...`}
          className="superadmin-topbar-search-input w-full py-2 pl-10 pr-4 text-sm"
        />
      </div>

      <div className="superadmin-topbar-actions ml-3 flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleNotifications}
          className="superadmin-topbar-icon relative"
          aria-label="Notifications"
        >
          <NotificationsRoundedIcon sx={{ fontSize: 20 }} />
          {notificationCount > 0 && (
            <span className="superadmin-notification-count absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center px-1 text-[9px] font-bold">
              {Math.min(notificationCount, 9)}
            </span>
          )}
        </button>

        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="superadmin-topbar-icon"
          aria-label="Toggle dark/light mode"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? (
            <LightModeRoundedIcon sx={{ fontSize: 20 }} />
          ) : (
            <DarkModeRoundedIcon sx={{ fontSize: 20 }} />
          )}
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className="superadmin-profile-trigger flex items-center gap-2 pl-3 sm:pl-4"
        >
          <div className="hidden text-right sm:block">
            <p className="superadmin-profile-name">{adminName}</p>
            <p className="superadmin-profile-role">{consoleLabel}</p>
          </div>
          <div className="superadmin-profile-avatar flex h-9 w-9 items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={adminName} className="h-full w-full object-cover" />
            ) : (
              <PersonRoundedIcon sx={{ fontSize: 20 }} />
            )}
          </div>
        </button>
      </div>
    </header>
  )
}
