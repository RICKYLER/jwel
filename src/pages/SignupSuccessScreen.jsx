import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import MailRoundedIcon from '@mui/icons-material/MailRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { CircularProgress } from '@mui/material'
import React from 'react'
import './ForgotPasswordPage.css'

const Timeline = ({ currentStage, isVerifying, isVerified }) => {
  const stages = [
    { number: 1, label: 'Email Sent', icon: '✉️' },
    { number: 2, label: 'Click Link', icon: '🔗' },
    { number: 3, label: 'Verified', icon: '✓' },
  ]

  return (
    <div className="w-full px-2 mb-12">
      <style>{`
        @keyframes slideInRight {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: var(--progress-width);
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .progress-line {
          animation: slideInRight 0.8s ease-out forwards;
        }
        
        .stage-circle {
          animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .stage-circle.active {
          animation: bounce 1.5s infinite;
        }
        
        .stage-circle.verifying {
          animation: glow 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="flex items-center justify-between relative">
        {/* Background line connector */}
        <div className="absolute top-6 left-0 right-0 h-1.5 bg-white/5 rounded-full" style={{ zIndex: 0 }} />

        {/* Animated filled line */}
        {(isVerified || currentStage > 1) && (
          <div
            className={`absolute top-6 h-1.5 rounded-full progress-line ${
              isVerified || currentStage > 1
                ? 'bg-linear-to-r from-green-400 via-emerald-500 to-emerald-600 shadow-lg shadow-green-500/60'
                : 'bg-linear-to-r from-orange-400 to-orange-600'
            }`}
            style={{
              left: '16.67%',
              '--progress-width': isVerified || currentStage > 2 ? '66.66%' : isVerified || currentStage > 1 ? '33.33%' : '0%',
              zIndex: 1,
            }}
          />
        )}

        {stages.map((stage) => {
          const isCompleted = isVerified || currentStage > stage.number
          const isActive = currentStage === stage.number
          const isVerifyingStage = isActive && isVerifying

          return (
            <div key={stage.number} className="flex flex-col items-center relative" style={{ zIndex: 2 }}>
              {/* Stage Circle */}
              <div
                className={`stage-circle w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 ${
                  isCompleted
                    ? 'bg-linear-to-br from-green-400 to-emerald-600 text-white'
                    : isVerifyingStage
                    ? 'bg-linear-to-br from-blue-400 to-cyan-600 text-white verifying'
                    : isActive
                    ? 'bg-linear-to-br from-orange-400 to-red-600 text-white active'
                    : 'bg-white/8 text-white/40'
                } ${isCompleted ? 'shadow-lg shadow-green-500/60' : isVerifyingStage ? 'shadow-lg shadow-blue-500/50' : isActive ? 'shadow-lg shadow-orange-500/60' : ''}`}
              >
                {isCompleted ? '✓' : stage.icon}
              </div>
              <p
                className={`text-xs font-bold mt-3 transition-all duration-300 tracking-wide ${
                  isCompleted
                    ? 'text-green-300 scale-105'
                    : isActive
                    ? 'text-white scale-105'
                    : 'text-white/50'
                }`}
              >
                {stage.label}
              </p>
            </div>
          )
        })}
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
  signupLoadingStage = null,
  onLoadingComplete = null,
}) {
  // Auto-complete loading stage after animation
  React.useEffect(() => {
    if (signupLoadingStage === 'loading') {
      const timer = setTimeout(() => {
        onLoadingComplete?.()
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [signupLoadingStage, onLoadingComplete])

  // Show loading screen
  if (signupLoadingStage === 'loading') {
    return (
      <div className="forgot-password-shell">
        <style>{`
          @keyframes loadingFade {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
          }
          
          @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
          }
          
          .loading-dots::after {
            animation: dots 1.5s infinite;
          }
        `}</style>
        
        <div className="enhanced-panel rounded-2xl p-8 md:p-10 shadow-2xl text-center">
          <div className="mb-8 animate-spin">
            <div className="w-16 h-16 rounded-full border-4 border-blue-500/30 border-t-blue-500 mx-auto"></div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Email Sent Successfully!</h2>
          
          <p className="text-white/70 mb-8 text-lg">
            We've sent a verification email to your inbox
          </p>
          
          <div className="space-y-4 mb-8">
            <p className="text-white/60">📧 Check your inbox for the verification email</p>
            <p className="text-white/60">🔗 Click the verification link</p>
            <p className="text-white/60">✓ Your account will be verified automatically</p>
          </div>
          
          <button
            type="button"
            onClick={() => window.open('https://gmail.com', '_blank')}
            className="w-full bg-linear-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-3 md:py-4 rounded-xl font-bold uppercase tracking-wider text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 mb-4"
          >
            📧 Check Email (Open Gmail)
          </button>
          
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/50 text-sm">This window will update once your email is verified</p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="forgot-password-shell">
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes iconSpin {
          0% { transform: scale(0.8) rotate(-10deg); }
          50% { transform: scale(1.05) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        
        .enhanced-panel {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          animation: fadeInUp 0.8s ease-out;
        }
        
        .enhanced-icon {
          animation: iconSpin 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .enhanced-title {
          animation: fadeInDown 0.6s ease-out 0.1s both;
          background: linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .enhanced-copy {
          animation: fadeInDown 0.6s ease-out 0.2s both;
        }
        
        .button-container {
          animation: fadeInUp 0.6s ease-out 0.4s both;
        }
        
        .progress-badge {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(34, 197, 94, 0.2) 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
      `}</style>

      <div className="enhanced-panel rounded-2xl p-8 md:p-10 shadow-2xl">
        {/* Timeline */}
        <div className="relative mb-10">
          <Timeline currentStage={verificationStage} isVerifying={isVerifying} isVerified={isVerified} />
        </div>

        {/* Icon and Header */}
        <div
          className="forgot-password-icon enhanced-icon transition-all duration-500 mb-6"
          style={{
            color: isVerified ? '#10b981' : '#f97316',
          }}
        >
          {isVerified ? (
            <CheckCircleRoundedIcon sx={{ fontSize: 56 }} />
          ) : (
            <MailRoundedIcon sx={{ fontSize: 56 }} />
          )}
        </div>

        <div className="text-center mb-2">
          <p
            className="font-semibold text-sm uppercase tracking-widest transition-colors duration-300 mb-3"
            style={{
              color: isVerified ? '#10b981' : '#f97316',
            }}
          >
            {isVerified ? '✓ Email Verified!' : '📧 Account Created'}
          </p>

          <h2 className="enhanced-title forgot-password-title text-3xl md:text-4xl font-bold mb-6">
            {isVerified
              ? '✓ Successfully Verified'
              : 'Verify Your Email Address'}
          </h2>
        </div>

        <p className="enhanced-copy forgot-password-copy text-center text-white/80 mb-8 leading-relaxed">
          {isVerified ? (
            <>
              Your email has been verified successfully! Your BYKELINK account is now fully activated and ready to use.
              <br />
              <br />
              You can now sign in with your email and password to start exploring our services.
            </>
          ) : isVerifying ? (
            <>
              Verifying your email address...
              <br />
              <br />
              Please wait while we confirm your email. This should only take a moment.
            </>
          ) : (
            <>
              We've sent a verification email to <strong className="text-white">{email}</strong>.
              <br />
              <br />
              Please click the verification link in your email to complete the verification process. Check your spam folder if you don't see it!
            </>
          )}
        </p>

        {!isVerified && (
          <div className="progress-badge rounded-xl p-4 mb-8 border">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-300 mb-3">
              {isVerifying ? '⏳ Verifying...' : '📋 What to do:'}
            </p>
            {isVerifying ? (
              <div className="flex items-center gap-3 text-sm text-white/70">
                <CircularProgress size={18} sx={{ color: 'currentColor' }} />
                <span>Processing your verification. Please wait...</span>
              </div>
            ) : (
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold mt-0.5">✓</span>
                  <span>Check your email inbox for the verification link</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold mt-0.5">✓</span>
                  <span>Click the link in the email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold mt-0.5">✓</span>
                  <span>Your account will be verified automatically</span>
                </li>
              </ul>
            )}
          </div>
        )}

        <div className="button-container space-y-3">
          <button
            type="button"
            onClick={onContinue}
            disabled={isResending || isVerifying}
            className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 md:py-4 rounded-xl font-bold uppercase tracking-wider text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            {isVerified ? 'Go to Sign In' : 'Back to Sign In'}
          </button>

          {!isVerified && onResendEmail && (
            <button
              type="button"
              onClick={onResendEmail}
              disabled={isResending || isVerifying}
              className="w-full bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 text-white py-3 md:py-4 rounded-xl font-bold uppercase tracking-wider text-sm md:text-base shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isResending ? (
                <>
                  <CircularProgress size={18} sx={{ color: 'white' }} />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <RefreshRoundedIcon sx={{ fontSize: 20 }} />
                  <span>Resend Email</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
