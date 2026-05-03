import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import WarningRoundedIcon from '@mui/icons-material/WarningRounded'
import CircularProgress from '@mui/material/CircularProgress'
import { useEffect } from 'react'

export default function ConfirmationModal({
  open,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = true,
  isDarkMode = true,
  isLoading = false,
}) {
  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      return () => {
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
      }
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 w-screen h-screen bg-black/50 backdrop-blur-sm" onClick={onCancel} style={{ zIndex: 99999 }} />
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 99999 }}>
        <div
          className={`rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl pointer-events-auto ${
            isDarkMode
              ? 'bg-linear-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
                isDangerous
                  ? isDarkMode
                    ? 'bg-red-950/40'
                    : 'bg-red-100'
                  : isDarkMode
                    ? 'bg-white/10'
                    : 'bg-white'
              }`}
            >
              <WarningRoundedIcon
                sx={{
                  fontSize: 24,
                  color: isDangerous ? '#ff7070' : '#ffffff',
                }}
              />
            </div>

            <div className="flex-1">
              <h3
                className={`text-lg font-black ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {title}
              </h3>
              <p
                className={`mt-2 text-sm leading-relaxed ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}
              >
                {message}
              </p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white/60'
                  : 'hover:bg-gray-100 text-gray-400'
              }`}
            >
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </button>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isDarkMode
                  ? 'bg-white/10 text-white hover:bg-white/15'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-colors ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              } ${
                isDangerous
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                  <span>Processing...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
