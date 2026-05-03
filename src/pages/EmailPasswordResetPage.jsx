import { useState, useEffect } from 'react'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { auth } from '../firebase'
import './ForgotPasswordPage.css'

export default function EmailPasswordResetPage({ onNavigateBack, resetCode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [success, setSuccess] = useState(false)

  // Verify the reset code when component mounts
  useEffect(() => {
    const verifyCode = async () => {
      if (!resetCode) {
        console.error('[EMAIL RESET] No reset code provided')
        setMessage({ type: 'error', text: 'No reset code provided. Please try the reset link again.' })
        setLoading(false)
        return
      }

      try {
        console.log('[EMAIL RESET] Verifying code:', resetCode.substring(0, 20) + '...')
        // Verify the code is valid and get the email
        const userEmail = await verifyPasswordResetCode(auth, resetCode)
        console.log('[EMAIL RESET] Code verified for email:', userEmail)
        setEmail(userEmail)
        setMessage(null)
      } catch (error) {
        console.error('[EMAIL RESET] Code verification failed:', error?.code, error?.message)
        setMessage({
          type: 'error',
          text: error?.code === 'auth/invalid-action-code' || error?.code === 'auth/expired-action-code'
            ? 'Your password reset link has expired or is invalid. Please request a new one.'
            : `Verification failed: ${error?.message || 'Unknown error'}`,
        })
      } finally {
        setLoading(false)
      }
    }

    verifyCode()
  }, [resetCode])

  const isStrongPassword = (pwd) => {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    if (!password.trim()) {
      setMessage({ type: 'error', text: 'Please enter your new password.' })
      return
    }

    if (!isStrongPassword(password)) {
      setMessage({
        type: 'error',
        text: 'Use a stronger password with at least 8 characters, uppercase, lowercase, and a number.',
      })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    setSubmitting(true)

    try {
      await confirmPasswordReset(auth, resetCode, password)
      setSuccess(true)
      setMessage({
        type: 'success',
        text: 'Password reset successfully!',
      })
    } catch (error) {
      console.error('Password reset failed:', error)
      setMessage({
        type: 'error',
        text: error?.code === 'auth/invalid-action-code' || error?.code === 'auth/expired-action-code'
          ? 'Your reset link has expired. Please request a new password reset.'
          : `Failed to reset password: ${error?.message || 'Unknown error'}`,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="forgot-password-shell">
        <div className="forgot-password-panel">
          <p>Verifying reset link...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="forgot-password-shell">
        <div className="forgot-password-panel">
          <div className="forgot-password-icon" style={{ color: '#10b981' }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 48 }} />
          </div>
          <p className="forgot-password-kicker" style={{ color: '#10b981' }}>Success</p>
          <h2 className="forgot-password-title">Password Reset Complete</h2>
          <p className="forgot-password-copy">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <button type="button" onClick={onNavigateBack} className="forgot-password-button">
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-password-shell">
      <button type="button" onClick={onNavigateBack} className="forgot-password-back-button" aria-label="Go back">
        <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
        <span>Back</span>
      </button>

      <div className="forgot-password-panel">
        <div className="forgot-password-icon">
          <LockResetRoundedIcon sx={{ fontSize: 48 }} />
        </div>

        <p className="forgot-password-kicker">Account Recovery</p>
        <h2 className="forgot-password-title">Reset Your Password</h2>
        <p className="forgot-password-copy">
          Enter a new password for <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <label className="forgot-password-field">
            <span>New Password</span>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                ) : (
                  <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                )}
              </button>
            </div>
          </label>

          <label className="forgot-password-field">
            <span>Confirm Password</span>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle-button"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                ) : (
                  <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                )}
              </button>
            </div>
          </label>

          <div className="password-requirements-note rounded-lg border border-white/10 bg-white/4 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60 mb-2">Password Requirements</p>
            <ul className="space-y-1.5 text-xs text-white/50">
              <li className={password.length >= 8 ? 'text-emerald-400' : ''}>✓ At least 8 characters</li>
              <li className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-emerald-400' : ''}>✓ Upper and lowercase letters</li>
              <li className={/\d/.test(password) ? 'text-emerald-400' : ''}>✓ At least one number</li>
              <li className={password && password === confirmPassword ? 'text-emerald-400' : ''}>✓ Passwords match</li>
            </ul>
          </div>

          {message && (
            <div className={`forgot-password-message ${message.type === 'error' ? 'is-error' : 'is-success'}`}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={submitting || loading} className="forgot-password-button">
            {submitting ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
