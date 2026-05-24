import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useEffect, useMemo, useState, useRef } from 'react'
import ConfirmationModal from './ConfirmationModal'
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
  isDarkMode = true,
}) {
  const [initialInviteForm, setInitialInviteForm] = useState(null)
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false)
  const hasInitializedRef = useRef(false)

  const roleLabels = {
    admin: 'Admin',
    'mechanics personnel': 'Mechanics Personnel',
    'staff personnel': 'Staff Personnel',
  }

  const menuAccessOptions = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'user-management', label: 'User Management' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'services', label: 'Services' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'messages', label: 'Messages' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' },
  ]

  // Capture initial form state when modal opens to enable dirty-change detection
  useEffect(() => {
    if (!open) {
      hasInitializedRef.current = false
      return
    }

    // Only initialize once when modal opens to avoid cascading renders
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      // Defer state update to avoid cascading renders
      const timer = setTimeout(() => {
        setInitialInviteForm({
          fullName: inviteForm.fullName || '',
          email: inviteForm.email || '',
          role: inviteForm.role || '',
          status: inviteForm.status || '',
          temporaryPassword: inviteForm.temporaryPassword || '',
          menuAccess: inviteForm.menuAccess || [],
        })
        setShowUnsavedChangesModal(false)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open, inviteForm])

  const isDirty = useMemo(() => {
    if (!initialInviteForm) {
      return false
    }

    return (
      (inviteForm.fullName || '') !== initialInviteForm.fullName ||
      (inviteForm.email || '') !== initialInviteForm.email ||
      (inviteForm.role || '') !== initialInviteForm.role ||
      (inviteForm.status || '') !== initialInviteForm.status ||
      (inviteForm.temporaryPassword || '') !== initialInviteForm.temporaryPassword ||
      JSON.stringify(inviteForm.menuAccess || []) !== JSON.stringify(initialInviteForm.menuAccess || [])
    )
  }, [initialInviteForm, inviteForm.email, inviteForm.fullName, inviteForm.role, inviteForm.status, inviteForm.temporaryPassword, inviteForm.menuAccess])

  const handleRequestClose = () => {
    if (isSubmitting) {
      return
    }

    if (isDirty) {
      setShowUnsavedChangesModal(true)
      return
    }

    onClose()
  }

  const handleConfirmDiscardChanges = () => {
    setShowUnsavedChangesModal(false)
    onClose()
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

  const handleMenuAccessChange = (menuId) => {
    setInviteForm((current) => {
      const currentAccess = current.menuAccess || []
      const isChecked = currentAccess.includes(menuId)

      return {
        ...current,
        menuAccess: isChecked
          ? currentAccess.filter((id) => id !== menuId)
          : [...currentAccess, menuId],
      }
    })
  }

  return (
    <>
      <div className="new-user-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="new-user-modal-title">
        <div className="new-user-modal-backdrop" onClick={handleRequestClose} aria-hidden="true" />

        <div className="new-user-modal-panel">
          <button type="button" onClick={handleRequestClose} className="new-user-modal-close" aria-label="Close modal">
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

            <div className="new-user-menu-access">
              <span className="new-user-menu-access-label">Menu Access Permissions</span>
              <div className="new-user-menu-access-grid">
                {menuAccessOptions.map((option) => (
                  <label key={option.id} className="new-user-menu-checkbox">
                    <input
                      type="checkbox"
                      checked={(inviteForm.menuAccess || []).includes(option.id)}
                      onChange={() => handleMenuAccessChange(option.id)}
                      disabled={!canManageAccess || isSubmitting}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

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
              <button type="button" onClick={handleRequestClose} className="new-user-cancel">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationModal
        open={showUnsavedChangesModal}
        title="Discard unsaved changes?"
        message="You have unsaved operator details. Click Discard Changes to close this modal without saving, or Continue Editing to keep your current input."
        confirmText="Discard Changes"
        cancelText="Continue Editing"
        onConfirm={handleConfirmDiscardChanges}
        onCancel={() => setShowUnsavedChangesModal(false)}
        isDangerous={false}
        isDarkMode={isDarkMode}
      />
    </>
  )
}
