import { CircularProgress } from '@mui/material'
import '../superadmin/components/PasswordChangeRequiredModal.css'

export default function SignupLoadingModal() {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-9999">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-8 max-w-sm mx-4 shadow-2xl">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <CircularProgress
              size={60}
              thickness={3}
              sx={{
                color: '#ef4444',
              }}
            />
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Creating Account</p>
            <h2 className="text-xl font-bold text-white">Securing Your Account</h2>
            <p className="text-sm text-slate-300">Setting up your BYKELINK account. Creating your profile...</p>
          </div>

          <div className="w-full space-y-1">
            <div className="h-1 bg-slate-700/40 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-red-500 to-red-400 rounded-full animate-pulse" style={{width: '100%', animation: 'pulse 1.5s ease-in-out infinite'}}></div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            This may take a few moments. Please don't close this window.
          </p>
        </div>
      </div>
    </div>
  )
}
