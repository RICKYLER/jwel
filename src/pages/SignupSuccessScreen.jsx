import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import MailRoundedIcon from '@mui/icons-material/MailRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { CircularProgress } from '@mui/material'
import './ForgotPasswordPage.css'

export default function SignupSuccessScreen({ email, onContinue, onResendEmail, isResending }) {
  return (
    <div className="forgot-password-shell">
      <div className="forgot-password-panel">
        <div className="forgot-password-icon" style={{ color: '#10b981' }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 48 }} />
        </div>
        <p className="forgot-password-kicker" style={{ color: '#10b981' }}>Success</p>
        <h2 className="forgot-password-title">Account Created Successfully</h2>
        <p className="forgot-password-copy">
          Your BYKELINK account has been created. We've sent a verification email to <strong>{email}</strong>. 
          <br />
          <br />
          Please click the verification link in your email to verify your account before logging in. Check your spam folder if you don't see it!
        </p>

        <div className="password-requirements-note rounded-lg border border-white/10 bg-white/4 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60 mb-2">Next Steps</p>
          <ul className="space-y-1.5 text-xs text-white/50">
            <li>✓ Check your email inbox for the verification link</li>
            <li>✓ Click the link to verify your email address</li>
            <li>✓ Return here and sign in with your credentials</li>
          </ul>
        </div>

        <div className="space-y-2">
          <button 
            type="button" 
            onClick={onContinue} 
            disabled={isResending}
            className="forgot-password-button"
          >
            Back to Sign In
          </button>
          
          {onResendEmail && (
            <button 
              type="button" 
              onClick={onResendEmail}
              disabled={isResending}
              className="w-full bg-slate-700/50 hover:bg-slate-600/60 disabled:opacity-50 text-white py-3 rounded-full font-bold uppercase tracking-wider text-sm shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isResending ? (
                <>
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                  Resend Email
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
