import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import './NotificationsDrawer.css'

export default function NotificationsDrawer({ open, notifications, onClose }) {
  return (
    <>
      {open && <button type="button" className="notifications-overlay" onClick={onClose} aria-label="Close notifications overlay" />}
      <aside className={`notifications-drawer ${open ? 'open' : ''}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#ffb4a8]">Alerts</p>
            <h3 className="font-['Epilogue'] text-lg font-black uppercase text-white">Notifications</h3>
          </div>
          <button type="button" onClick={onClose} className="text-white/70 transition hover:text-white" aria-label="Close notifications drawer">
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          {notifications.map((item) => (
            <article key={item.id} className="notification-card rounded-2xl p-4">
              <div className="mb-2 flex items-center gap-2 text-[#ffb4a8]">
                <NotificationsActiveRoundedIcon sx={{ fontSize: 16 }} />
                <span className="text-[10px] font-black uppercase tracking-[0.22em]">{item.type}</span>
              </div>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-white/60">{item.description}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-white/40">{item.time}</p>
            </article>
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
