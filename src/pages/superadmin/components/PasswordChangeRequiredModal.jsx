import { useState } from 'react'
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import './PasswordChangeRequiredModal.css'

export default function PasswordChangeRequiredModal({
  open,
  currentUser,
  passwordChangeForm,
  onFieldChange,
  onSubmit,
  isSubmitting,
  message,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  if (!open) {
    return null
  }

  return (
    <div className="password-change-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="password-change-modal-title">
      <div className="password-change-modal-panel">
        <div className="password-change-modal-icon">
          <LockResetRoundedIcon sx={{ fontSize: 28 }} />
        </div>

        <p className="password-change-modal-kicker">First Login Required</p>
        <h2 id="password-change-modal-title" className="password-change-modal-title">
          Change Your Temporary Password
        </h2>
        <p className="password-change-modal-copy">
          Secure access is active for <strong>{currentUser?.email || 'this account'}</strong>. Update your password before continuing.
        </p>

        <form onSubmit={onSubmit} className="password-change-modal-form">
          <label className="password-change-field">
            <span>New Password</span>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={passwordChangeForm.password}
                onChange={onFieldChange}
                placeholder="Enter a strong new password"
                disabled={isSubmitting}
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

          <label className="password-change-field">
            <span>Confirm Password</span>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={passwordChangeForm.confirmPassword}
                onChange={onFieldChange}
                placeholder="Confirm your new password"
                disabled={isSubmitting}
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
              <li className={passwordChangeForm.password.length >= 8 ? 'text-emerald-400' : ''}>✓ At least 8 characters</li>
              <li className={/[A-Z]/.test(passwordChangeForm.password) && /[a-z]/.test(passwordChangeForm.password) ? 'text-emerald-400' : ''}>✓ Upper and lowercase letters</li>
              <li className={/\d/.test(passwordChangeForm.password) ? 'text-emerald-400' : ''}>✓ At least one number</li>
              <li className={passwordChangeForm.password && passwordChangeForm.password === passwordChangeForm.confirmPassword ? 'text-emerald-400' : ''}>✓ Passwords match</li>
            </ul>
          </div>

          {message && (
            <div className={`password-change-message ${message.type === 'error' ? 'is-error' : 'is-success'}`}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="password-change-submit">
            {isSubmitting ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
