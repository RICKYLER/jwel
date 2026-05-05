import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import MailRoundedIcon from '@mui/icons-material/MailRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { CircularProgress } from '@mui/material'
import './ForgotPasswordPage.css'

const Timeline = ({ currentStage, isVerifying, isVerified }) => {
  const stages = [
    { number: 1, label: 'Email Sent', icon: '✉️' },
    { number: 2, label: 'Click Link', icon: '🔗' },
    { number: 3, label: 'Verified', icon: '✓' },
  ]

  return (
    <div className="w-full px-4 mb-8">
      <div className="flex items-center justify-between relative">
        {/* Background line connector */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-white/10 rounded-full" style={{ zIndex: 0 }} />

        {/* Animated filled line */}
        {(isVerified || currentStage > 1) && (
          <div
            className={`absolute top-6 h-1 rounded-full transition-all duration-500 ${
              isVerified || currentStage > 1
                ? 'bg-linear-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/50'
                : 'bg-linear-to-r from-orange-500 to-orange-600'
            }`}
            style={{
              left: '16.67%',
              width: isVerified || currentStage > 2 ? '66.66%' : isVerified || currentStage > 1 ? '33.33%' : '0%',
              zIndex: 1,
            }}
          />
        )}

        {stages.map((stage) => (
          <div key={stage.number} className="flex flex-col items-center relative" style={{ zIndex: 2 }}>
            {/* Stage Circle */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 ${
                isVerified || currentStage > stage.number
                  ? 'bg-linear-to-br from-green-500 to-emerald-600 text-white scale-110 shadow-lg shadow-green-500/50'
                  : currentStage === stage.number && isVerifying
                  ? 'bg-linear-to-br from-blue-500 to-cyan-600 text-white animate-pulse scale-105'
                  : currentStage === stage.number
                  ? 'bg-linear-to-br from-orange-500 to-red-600 text-white scale-105 shadow-lg shadow-orange-500/50'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              {isVerified || currentStage > stage.number ? '✓' : stage.icon}
            </div>
            <p
              className={`text-xs font-semibold mt-2 transition-colors duration-300 ${
                isVerified || currentStage > stage.number
                  ? 'text-green-400'
                  : currentStage === stage.number
                  ? 'text-white'
                  : 'text-white/40'
              }`}
            >
              {stage.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SignupSuccessScreen({
  email,
  onContinue,
  onResendEmail,
  isResending,
  verificationStage = 1,
  isVerifying = false,
  isVerified = false,
}) {
  return (
    <div className="forgot-password-shell">
      <div className="forgot-password-panel">
        {/* Timeline */}
        <div className="relative mb-8">
          <Timeline currentStage={verificationStage} isVerifying={isVerifying} isVerified={isVerified} />
        </div>

        {/* Icon and Header */}
        <div
          className="forgot-password-icon transition-all duration-500"
          style={{
            color: isVerified ? '#10b981' : '#f97316',
          }}
        >
          {isVerified ? (
            <CheckCircleRoundedIcon sx={{ fontSize: 48 }} />
          ) : (
            <MailRoundedIcon sx={{ fontSize: 48 }} />
          )}
        </div>

        <p
          className="forgot-password-kicker transition-colors duration-300"
          style={{
            color: isVerified ? '#10b981' : '#f97316',
          }}
        >
          {isVerified ? 'Email Verified!' : 'Account Created'}
        </p>

        <h2 className="forgot-password-title">
          {isVerified
            ? '✓ Successfully Verified'
            : 'Verify Your Email Address'}
        </h2>

        <p className="forgot-password-copy">
          {isVerified ? (
            <>
              Your email has been verified successfully! Your BYKELINK account is now fully activated and ready to use.
              <br />
              <br />
              You can now sign in with your email and password to start exploring.
            </>
          ) : isVerifying ? (
            <>
              Verifying your email address...
              <br />
              <br />
              Please wait while we confirm your email.
            </>
          ) : (
            <>
              We've sent a verification email to <strong>{email}</strong>.
              <br />
              <br />
              Please click the verification link in your email to complete the verification process. Check your spam folder if you don't see it!
            </>
          )}
        </p>

        {!isVerified && (
          <div className="password-requirements-note rounded-lg border border-white/10 bg-white/4 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60 mb-2">
              {isVerifying ? 'Verifying...' : 'What to do:'}
            </p>
            {isVerifying ? (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <CircularProgress size={14} sx={{ color: 'currentColor' }} />
                <span>Processing your verification...</span>
              </div>
            ) : (
              <ul className="space-y-1.5 text-xs text-white/50">
                <li>✓ Check your email inbox for the verification link</li>
                <li>✓ Click the link in the email</li>
                <li>✓ Your account will be verified automatically</li>
              </ul>
            )}
          </div>
        )}

        <div className="space-y-2">
          <button
            type="button"
            onClick={onContinue}
            disabled={isResending || isVerifying}
            className="forgot-password-button"
          >
            {isVerified ? 'Go to Sign In' : 'Back to Sign In'}
          </button>

          {!isVerified && onResendEmail && (
            <button
              type="button"
              onClick={onResendEmail}
              disabled={isResending || isVerifying}
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
