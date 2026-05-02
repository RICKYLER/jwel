import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'

export default function SuperAdminHeader({
  searchTerm,
  onSearchChange,
  sectionTitle,
  isDarkMode,
  onToggleTheme,
  onToggleSidebar,
  onToggleNotifications,
  notificationCount,
  adminName,
  consoleLabel,
  onOpenProfile,
  avatarUrl,
}) {
  return (
    <header className="superadmin-topbar fixed right-0 top-0 z-40 flex h-16 w-[calc(100%-16rem)] items-center justify-end px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="superadmin-mobile-toggle superadmin-topbar-icon mr-3 inline-flex rounded-full border border-white/10 bg-white/5 p-2"
        aria-label="Toggle menu"
      >
        <MenuRoundedIcon sx={{ fontSize: 20 }} />
      </button>

      <div className="relative mr-auto max-w-md flex-1">
        <SearchRoundedIcon sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={`Search ${sectionTitle.toLowerCase()}...`}
          className="superadmin-search-input w-full rounded-full border-none bg-[#353534] py-1.5 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-red-600"
        />
      </div>

      <div className="ml-3 flex items-center gap-3 sm:gap-4 lg:gap-6">
        <button
          type="button"
          onClick={onToggleNotifications}
          className="superadmin-topbar-icon relative transition"
          aria-label="Notifications"
        >
          <NotificationsRoundedIcon sx={{ fontSize: 20 }} />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">
              {Math.min(notificationCount, 9)}
            </span>
          )}
        </button>

        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="superadmin-topbar-icon transition duration-300 hover:bg-white/10"
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
          className="superadmin-profile-trigger flex items-center gap-3 border-l border-white/10 pl-3 sm:pl-4"
        >
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-white">{adminName}</p>
            <p className="text-[10px] text-white/40">{consoleLabel}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-red-600/20 bg-[#1f1f1f] overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={adminName} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <PersonRoundedIcon sx={{ fontSize: 20 }} className="text-red-300" />
            )}
          </div>
        </button>
      </div>
    </header>
  )
}
