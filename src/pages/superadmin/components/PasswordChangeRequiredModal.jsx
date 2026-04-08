import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'
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
            <input
              type="password"
              name="password"
              value={passwordChangeForm.password}
              onChange={onFieldChange}
              placeholder="Enter a strong new password"
              disabled={isSubmitting}
            />
          </label>

          <label className="password-change-field">
            <span>Confirm Password</span>
            <input
              type="password"
              name="confirmPassword"
              value={passwordChangeForm.confirmPassword}
              onChange={onFieldChange}
              placeholder="Confirm your new password"
              disabled={isSubmitting}
            />
          </label>

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
