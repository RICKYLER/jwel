import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import './NewUserModal.css'

export default function NewUserModal({
  open,
  onClose,
  inviteForm,
  setInviteForm,
  onSubmit,
  availableRoles = [],
  canManageAccess,
  isSubmitting,
}) {
  const roleLabels = {
    admin: 'Admin',
    'mechanics personnel': 'Mechanics Personnel',
    'inventory personnel': 'Inventory Personnel',
    'cashier personnel': 'Cashier Personnel',
    'front desk personnel': 'Front Desk Personnel',
  }
  if (!open) {
    return null
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    setInviteForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  return (
    <div className="new-user-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="new-user-modal-title">
      <button type="button" className="new-user-modal-backdrop" onClick={onClose} aria-label="Close new user modal" />

      <div className="new-user-modal-panel">
        <button type="button" onClick={onClose} className="new-user-modal-close" aria-label="Close modal">
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </button>

        <div className="new-user-modal-header">
          <p className="new-user-modal-kicker">Secure Operator Setup</p>
          <h2 id="new-user-modal-title" className="new-user-modal-title">
            New Operator Entry
          </h2>
          <p className="new-user-modal-copy">
            Initialize a new system entity. Ensure all credentials meet the Apex Velocity security protocols.
          </p>
        </div>

        <form onSubmit={onSubmit} className="new-user-modal-form">
          <div className="new-user-modal-grid">
            <label className="new-user-field">
              <span>Full Name</span>
              <input
                type="text"
                name="fullName"
                value={inviteForm.fullName}
                onChange={handleFieldChange}
                placeholder="e.g. Marcus Vance"
                disabled={!canManageAccess || isSubmitting}
              />
            </label>

            <label className="new-user-field">
              <span>Email Address</span>
              <input
                type="email"
                name="email"
                value={inviteForm.email}
                onChange={handleFieldChange}
                placeholder="operator@bykelink.com"
                disabled={!canManageAccess || isSubmitting}
              />
            </label>

            <label className="new-user-field">
              <span>Role</span>
              <select
                name="role"
                value={inviteForm.role}
                onChange={handleFieldChange}
                disabled={!canManageAccess || isSubmitting}
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role] || role}
                  </option>
                ))}
              </select>
            </label>

            <div className="new-user-field">
              <span>Initial Status</span>
              <div className="new-user-status-toggle" role="group" aria-label="Initial status">
                {['active', 'inactive'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setInviteForm((current) => ({
                        ...current,
                        status,
                      }))
                    }
                    disabled={!canManageAccess || isSubmitting}
                    className={inviteForm.status === status ? 'is-active' : ''}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="new-user-field new-user-password-field">
            <span>Default Password</span>
            <div className="new-user-password-row">
              <input
                type="text"
                name="temporaryPassword"
                value={inviteForm.temporaryPassword || 'Password123'}
                readOnly
                disabled={isSubmitting}
              />
            </div>
          </label>

          <p className="new-user-modal-note">
            New operators must verify their email first, then sign in with <strong>Password123</strong> and change it immediately.
          </p>

          <div className="new-user-modal-actions">
            <button
              type="submit"
              disabled={!canManageAccess || isSubmitting}
              className="new-user-submit"
            >
              {isSubmitting ? 'Registering...' : 'Register New Operator'}
            </button>
            <button type="button" onClick={onClose} className="new-user-cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
