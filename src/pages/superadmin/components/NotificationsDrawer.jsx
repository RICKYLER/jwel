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
      <aside className={`notifications-drawer ${open ? 'open' : ''}`} aria-label="Notifications">
        <div className="notifications-drawer-header">
          <div className="notifications-drawer-title-row">
            <div>
              <p className="notifications-drawer-eyebrow">Alerts</p>
              <h3 className="notifications-drawer-title">Notifications</h3>
            </div>
            <button type="button" onClick={onClose} className="notifications-drawer-close" aria-label="Close notifications drawer">
              <CloseRoundedIcon sx={{ fontSize: 20 }} />
            </button>
          </div>

          {hasNotifications && (
            <div className="notifications-drawer-actions">
              {hasUnreadNotifications && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="notifications-action-button"
                  title="Mark all as read"
                >
                  <DoneAllRoundedIcon sx={{ fontSize: 14 }} />
                  All read
                </button>
              )}
              <button
                type="button"
                onClick={onDeleteAllNotifications}
                className="notifications-action-button"
                title="Delete all notifications"
              >
                <ClearAllRoundedIcon sx={{ fontSize: 14 }} />
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="notifications-list">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`notification-card ${item.read ? 'is-read' : 'is-unread'}`}
            >
              <button
                type="button"
                onClick={() => onNotificationClick?.(item)}
                className="notification-card-content"
              >
                <div className="notification-card-heading">
                  <NotificationsActiveRoundedIcon sx={{ fontSize: 16 }} />
                  <span className="notification-type">{item.type}</span>
                  <span className={`notification-read-state ${item.read ? 'is-read' : 'is-new'}`}>
                    {item.read ? 'Read' : 'New'}
                  </span>
                </div>
                <p className="notification-title">{item.title}</p>
                <p className="notification-description">{item.description}</p>
                <p className="notification-time">{item.time}</p>
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteClick(e, item.id)}
                className="notification-delete-button"
                title="Delete notification"
                aria-label="Delete notification"
              >
                <DeleteRoundedIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          ))}

          {!notifications.length && (
            <div className="notification-empty-state">
              No new notifications right now.
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
