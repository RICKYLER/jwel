import useToast from '../context/useToast'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import WarningRoundedIcon from '@mui/icons-material/WarningRounded'

export default function ToastNotification() {
  const { toasts, removeToast } = useToast()

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />
      case 'error':
        return <ErrorRoundedIcon sx={{ fontSize: 20 }} />
      case 'warning':
        return <WarningRoundedIcon sx={{ fontSize: 20 }} />
      case 'info':
      default:
        return <InfoRoundedIcon sx={{ fontSize: 20 }} />
    }
  }

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-950/90',
          border: 'border-green-800',
          icon: 'text-green-400',
          text: 'text-green-100',
          progress: 'bg-green-600',
        }
      case 'error':
        return {
          bg: 'bg-red-950/90',
          border: 'border-red-800',
          icon: 'text-red-400',
          text: 'text-red-100',
          progress: 'bg-red-600',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-950/90',
          border: 'border-yellow-800',
          icon: 'text-yellow-400',
          text: 'text-yellow-100',
          progress: 'bg-yellow-600',
        }
      case 'info':
      default:
        return {
          bg: 'bg-blue-950/90',
          border: 'border-blue-800',
          icon: 'text-blue-400',
          text: 'text-blue-100',
          progress: 'bg-blue-600',
        }
    }
  }

  return (
    <div className="fixed top-6 right-6 z-9999 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => {
        const styles = getStyles(toast.type)

        return (
          <div
            key={toast.id}
            className={`${styles.bg} ${styles.border} border rounded-lg shadow-2xl backdrop-blur-md pointer-events-auto min-w-80 max-w-md overflow-hidden ${toast.closing ? 'animate-slideOut' : 'animate-slideIn'}`}
          >
            {/* Progress bar */}
            {toast.duration > 0 && (
              <div
                className={`${styles.progress} h-1 w-full`}
                style={{
                  animation: `progress ${toast.duration}ms linear`,
                }}
              />
            )}

            <div className="flex items-start gap-3 p-4">
              {/* Icon */}
              <div className={`${styles.icon} shrink-0 mt-0.5`}>{getIcon(toast.type)}</div>

              {/* Message */}
              <div className="flex-1">
                <p className={`${styles.text} text-sm font-medium leading-relaxed`}>
                  {toast.message}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => removeToast(toast.id)}
                className={`shrink-0 p-1 rounded hover:bg-white/10 transition-colors ${styles.text}`}
                aria-label="Close notification"
              >
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>

            <style>{`
              @keyframes slideIn {
                from {
                  transform: translateX(400px);
                  opacity: 0;
                }
                to {
                  transform: translateX(0);
                  opacity: 1;
                }
              }

              @keyframes slideOut {
                from {
                  transform: translateX(0);
                  opacity: 1;
                }
                to {
                  transform: translateX(400px);
                  opacity: 0;
                }
              }

              @keyframes progress {
                from {
                  width: 100%;
                }
                to {
                  width: 0%;
                }
              }

              .animate-slideIn {
                animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
              }

              .animate-slideOut {
                animation: slideOut 0.28s ease-in;
              }
            `}</style>
          </div>
        )
      })}
    </div>
  )
}
