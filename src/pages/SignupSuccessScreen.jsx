import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import MailRoundedIcon from '@mui/icons-material/MailRounded'
import './ForgotPasswordPage.css'

export default function SignupSuccessScreen({ email, onContinue }) {
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

        <button type="button" onClick={onContinue} className="forgot-password-button">
          Back to Sign In
        </button>
      </div>
    </div>
  )
}
