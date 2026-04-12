import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import ClearAllRoundedIcon from '@mui/icons-material/ClearAllRounded'
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded'
import './NotificationsDrawer.css'

export default function NotificationsDrawer({
  open,
  notifications,
  onClose,
  onNotificationClick,
  onDeleteNotification,
  onDeleteAllNotifications,
  onMarkAllAsRead,
}) {
  const handleDeleteClick = (e, notificationId) => {
    e.stopPropagation()
    onDeleteNotification?.(notificationId)
  }

  const hasNotifications = notifications.length > 0
  const hasUnreadNotifications = notifications.some((n) => !n.read)

  return (
    <>
      {open && <button type="button" className="notifications-overlay" onClick={onClose} aria-label="Close notifications overlay" />}
      <aside className={`notifications-drawer ${open ? 'open' : ''}`}>
        <div className="space-y-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Alerts</p>
              <h3 className="font-['Epilogue'] text-lg font-black uppercase text-white">Notifications</h3>
            </div>
            <button type="button" onClick={onClose} className="text-white/70 transition hover:text-white" aria-label="Close notifications drawer">
              <CloseRoundedIcon sx={{ fontSize: 20 }} />
            </button>
          </div>

          {hasNotifications && (
            <div className="flex gap-2">
              {hasUnreadNotifications && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="flex items-center gap-1.5 rounded-full bg-blue-600/20 px-3 py-1.5 text-[11px] font-bold uppercase text-blue-400 transition hover:bg-blue-600/30"
                  title="Mark all as read"
                >
                  <DoneAllRoundedIcon sx={{ fontSize: 14 }} />
                  All read
                </button>
              )}
              <button
                type="button"
                onClick={onDeleteAllNotifications}
                className="flex items-center gap-1.5 rounded-full bg-red-600/20 px-3 py-1.5 text-[11px] font-bold uppercase text-red-400 transition hover:bg-red-600/30"
                title="Delete all notifications"
              >
                <ClearAllRoundedIcon sx={{ fontSize: 14 }} />
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`notification-card group flex items-start gap-3 rounded-2xl p-4 text-left transition ${item.read ? 'opacity-75' : 'ring-1 ring-[#2563eb]/30'}`}
            >
              <button
                type="button"
                onClick={() => onNotificationClick?.(item)}
                className="flex-1 cursor-pointer text-left"
              >
                <div className="mb-2 flex items-center gap-2 text-cyan-300">
                  <NotificationsActiveRoundedIcon sx={{ fontSize: 16 }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em]">{item.type}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${item.read ? 'bg-white/10 text-white/60' : 'bg-[#2563eb]/20 text-cyan-300'}`}>
                    {item.read ? 'Read' : 'New'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-white/60">{item.description}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-white/40">{item.time}</p>
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteClick(e, item.id)}
                className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 text-red-400 opacity-0 transition hover:bg-red-600/20 group-hover:opacity-100"
                title="Delete notification"
                aria-label="Delete notification"
              >
                <DeleteRoundedIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          ))}

          {!notifications.length && (
            <div className="notification-card rounded-2xl p-4 text-sm text-white/60">
              No new notifications right now.
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
