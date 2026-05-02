import { useState } from 'react'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from 'firebase/auth'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import ConfirmationModal from './ConfirmationModal'
import { auth } from '../../../firebase'

export default function ChangePasswordModal({
  open,
  onClose,
  currentUser,
  onSuccess,
  onError,
  isDarkMode = true,
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)

  const passwordRequirements = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
  }

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean)
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0

  const handleChangePassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setPasswordError('')

    // Validation
    if (!currentPassword) {
      setPasswordError('Current password is required')
      return
    }

    if (!newPassword) {
      setPasswordError('New password is required')
      return
    }

    if (!allRequirementsMet) {
      setPasswordError('Password does not meet all requirements')
      return
    }

    if (!passwordsMatch) {
      setPasswordError('New passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password')
      return
    }

    setIsSubmitting(true)
    try {
      // Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
      await reauthenticateWithCredential(currentUser, credential)

      // Update password
      await updatePassword(currentUser, newPassword)

      // Success: clear fields
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Force sign-out so the user must re-authenticate with the new password
      try {
        await signOut(auth)
      } catch (signOutErr) {
        console.error('Error signing out after password change:', signOutErr)
      }

      onSuccess?.('Password updated successfully! Please sign in again with your new password.')
      // Redirect to login page
      try {
        window.location.href = '/login'
      } catch {
        // fallback: just close modal
        onClose()
      }
    } catch (error) {
      console.error('Password update error:', error)
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect')
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('Password is too weak. Please use a stronger password.')
      } else {
        setPasswordError(`Error: ${error.message}`)
      }
      onError?.(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onRequestUpdate = () => {
    // open confirmation modal before actually updating
    setIsConfirmOpen(true)
  }

  if (!open) return null

  const RequirementItem = ({ met, label }) => (
    <div className={`flex items-center gap-2 text-xs ${met ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : (isDarkMode ? 'text-white/40' : 'text-gray-500')}`}>
      {met ? (
        <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />
      ) : (
        <CancelRoundedIcon sx={{ fontSize: 16 }} />
      )}
      <span>{label}</span>
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 w-screen h-screen bg-black/50 backdrop-blur-sm" onClick={() => {
        // attempt close via outside click
        const hasUnsaved = currentPassword || newPassword || confirmPassword
        if (hasUnsaved) {
          setIsDiscardConfirmOpen(true)
        } else {
          onClose()
        }
      }} style={{ zIndex: 99999 }} />
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 99999 }}>
        <div
          className={`rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl pointer-events-auto ${
            isDarkMode
              ? 'bg-linear-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
                isDarkMode ? 'bg-blue-950/40' : 'bg-blue-100'
              }`}
            >
              <VpnKeyRoundedIcon
                sx={{
                  fontSize: 24,
                  color: isDarkMode ? '#60a5fa' : '#2563eb',
                }}
              />
            </div>

            <div className="flex-1">
              <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Change Password
              </h3>
              <p className={`mt-1 text-xs leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                Update your password to keep your account secure
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const hasUnsaved = currentPassword || newPassword || confirmPassword
                if (hasUnsaved) setIsDiscardConfirmOpen(true)
                else onClose()
              }}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white/60'
                  : 'hover:bg-gray-100 text-gray-400'
              }`}
            >
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </button>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* Current Password */}
            <label className={`block text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
              <span className="text-xs font-bold uppercase tracking-wider mb-2 block">Current Password</span>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    setPasswordError('')
                  }}
                  placeholder="Enter current password"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-1 ${
                    isDarkMode
                      ? 'border-white/10 bg-[#1a1a1a] text-white placeholder-white/30 focus:border-blue-600 focus:ring-blue-600/30'
                      : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-blue-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/60"
                  aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrent ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                </button>
              </div>
            </label>

            {/* New Password */}
            <label className={`block text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
              <span className="text-xs font-bold uppercase tracking-wider mb-2 block">New Password</span>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setPasswordError('')
                  }}
                  placeholder="Enter new password"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-1 ${
                    isDarkMode
                      ? 'border-white/10 bg-[#1a1a1a] text-white placeholder-white/30 focus:border-blue-600 focus:ring-blue-600/30'
                      : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-blue-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/60"
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                >
                  {showNew ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                </button>
              </div>
            </label>

            {/* Password Requirements */}
            {newPassword && (
              <div
                className={`rounded-lg border p-3 space-y-2 ${
                  isDarkMode ? 'border-white/10 bg-white/2' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                  Password Requirements
                </p>
                <RequirementItem met={passwordRequirements.minLength} label="At least 8 characters" />
                <RequirementItem met={passwordRequirements.hasUppercase} label="1+ uppercase letter (A-Z)" />
                <RequirementItem met={passwordRequirements.hasLowercase} label="1+ lowercase letter (a-z)" />
                <RequirementItem met={passwordRequirements.hasNumber} label="1+ number (0-9)" />
                <RequirementItem met={passwordRequirements.hasSpecial} label="1+ special character (!@#$%^&*)" />
              </div>
            )}

            {/* Confirm Password */}
            <label className={`block text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
              <span className="text-xs font-bold uppercase tracking-wider mb-2 block">Confirm New Password</span>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordError('')
                  }}
                  placeholder="Confirm new password"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-1 ${
                    isDarkMode
                      ? 'border-white/10 bg-[#1a1a1a] text-white placeholder-white/30 focus:border-blue-600 focus:ring-blue-600/30'
                      : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-blue-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/60"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                </button>
              </div>
            </label>

            {/* Error Message */}
            {passwordError && (
              <div
                className={`rounded-lg border p-3 text-xs font-medium ${
                  isDarkMode
                    ? 'border-red-600/30 bg-red-600/10 text-red-400'
                    : 'border-red-300 bg-red-50 text-red-700'
                }`}
              >
                {passwordError}
              </div>
            )}

            {/* Password Match Indicator */}
            {newPassword && confirmPassword && !passwordsMatch && (
              <div
                className={`rounded-lg border p-3 text-xs font-medium ${
                  isDarkMode
                    ? 'border-yellow-600/30 bg-yellow-600/10 text-yellow-400'
                    : 'border-yellow-300 bg-yellow-50 text-yellow-700'
                }`}
              >
                Passwords do not match
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  const hasUnsaved = currentPassword || newPassword || confirmPassword
                  if (hasUnsaved) setIsDiscardConfirmOpen(true)
                  else onClose()
                }}
                className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold transition-colors ${
                  isDarkMode
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onRequestUpdate}
                disabled={isSubmitting || !currentPassword || !allRequirementsMet || !passwordsMatch}
                className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 ${
                  isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600'
                }`}
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ConfirmationModal
        open={isConfirmOpen}
        title="Confirm Password Change"
        message="You are about to change your account password. After changing, you may be required to sign in again. Do you want to continue?"
        confirmText="Change Password"
        cancelText="Cancel"
        onConfirm={async () => {
          setIsConfirmOpen(false)
          await handleChangePassword()
        }}
        onCancel={() => setIsConfirmOpen(false)}
        isDangerous={false}
        isDarkMode={isDarkMode}
      />
      <ConfirmationModal
        open={isDiscardConfirmOpen}
        title="Discard Changes?"
        message="You have unsaved changes. Discard and close without saving?"
        confirmText="Discard"
        cancelText="Keep Editing"
        onConfirm={() => {
          setIsDiscardConfirmOpen(false)
          // clear inputs and close
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          setShowCurrent(false)
          setShowNew(false)
          setShowConfirm(false)
          onClose()
        }}
        onCancel={() => setIsDiscardConfirmOpen(false)}
        isDangerous={true}
        isDarkMode={isDarkMode}
      />
    </>
  )
}
