import { useState, useEffect } from 'react'
import { functions } from '../firebase'
import { httpsCallable } from 'firebase/functions'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import MailRoundedIcon from '@mui/icons-material/MailRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import './ForgotPasswordPage.css'
import { getAuth } from 'firebase/auth'

export default function EmailVerificationPage({ onNavigateBack, verificationCode, email }) {
  const [verifyEmail, setVerifyEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [message, setMessage] = useState(null)
  const [success, setSuccess] = useState(false)
  const [hasAttempted, setHasAttempted] = useState(false)

  // Verify email code when component mounts
  useEffect(() => {
    const performVerification = async () => {
      // Prevent duplicate verification attempts
      if (hasAttempted) {
        return
      }

      if (!verificationCode || !email) {
        setMessage({ 
          type: 'error', 
          text: 'No verification code or email provided. Please try the verification link again.' 
        })
        setLoading(false)
        setHasAttempted(true)
        return
      }

      setHasAttempted(true)

      try {
        console.log('[EMAIL VERIFY] Starting verification for:', email)
        
        // Call the verifyEmailCode Cloud Function
        const verifyEmailCodeFn = httpsCallable(functions, 'verifyEmailCode')
        setVerifying(true)
        
        const result = await verifyEmailCodeFn({
          email: email,
          code: verificationCode,
        })
        
        console.log('[EMAIL VERIFY] Verification successful:', result.data)
        
        setVerifyEmail(email)
        setSuccess(true)
        setMessage({
          type: 'success',
          text: 'Email verified successfully!',
        })

        // ✅ Refresh Firebase Auth user so emailVerified flag updates
        const auth = getAuth()
        if (auth.currentUser) {
          await auth.currentUser.reload()
          console.log('[EMAIL VERIFY] Reloaded user. emailVerified =', auth.currentUser.emailVerified)
        }
        
        // Set flag for customer dashboard to show verification success modal
        console.log('[EMAIL VERIFY] Setting email_verified_success flag in sessionStorage')
        window.sessionStorage.setItem('email_verified_success', 'true')
        console.log('[EMAIL VERIFY] Flag set. Current value:', window.sessionStorage.getItem('email_verified_success'))
      } catch (error) {
        console.error('[EMAIL VERIFY] Verification failed:', error?.code, error?.message)
        
        if (error?.code === 'functions/invalid-argument') {
          if (error?.message?.includes('expired')) {
            setMessage({
              type: 'error',
              text: 'Your verification link has expired. Please request a new verification email.',
            })
          } else if (error?.message?.includes('Invalid')) {
            setMessage({
              type: 'error',
              text: 'Invalid verification code. Please check your link and try again.',
            })
          } else {
            setMessage({
              type: 'error',
              text: error?.message || 'Verification failed.',
            })
          }
        } else if (error?.code === 'functions/not-found') {
          setMessage({
            type: 'error',
            text: 'No verification record found. Please request a new verification email.',
          })
        } else {
          setMessage({
            type: 'error',
            text: `Verification failed: ${error?.message || 'Unknown error'}`,
          })
        }
      } finally {
        setLoading(false)
        setVerifying(false)
      }
    }

    performVerification()
  }, [verificationCode, email, hasAttempted])

  if (loading) {
    return (
      <div className="forgot-password-shell">
        <div className="forgot-password-panel">
          <p>Verifying your email...</p>
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
          <h2 className="forgot-password-title">Email Verified Successfully</h2>
          <p className="forgot-password-copy">
            Your email {verifyEmail && <strong>{verifyEmail}</strong>} has been verified. You can now access all features of your account.
          </p>
          <button type="button" onClick={onNavigateBack} className="forgot-password-button">
            Back to Login
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
          <MailRoundedIcon sx={{ fontSize: 48 }} />
        </div>

        <p className="forgot-password-kicker">Email Verification</p>
        <h2 className="forgot-password-title">Verifying Your Email</h2>
        <p className="forgot-password-copy">
          Please wait while we verify your email address...
        </p>

        {message && (
          <div className={`forgot-password-message ${message.type === 'error' ? 'is-error' : 'is-success'}`}>
            {message.text}
          </div>
        )}

        {verifying && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Processing verification...</p>
          </div>
        )}
      </div>
    </div>
  )
}
