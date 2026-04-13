import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import WarningRoundedIcon from '@mui/icons-material/WarningRounded'

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
}) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl ${
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
              className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold transition-colors ${
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
              className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold transition-colors ${
                isDangerous
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
