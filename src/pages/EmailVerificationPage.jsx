import { useState, useEffect } from 'react'
import { applyActionCode, checkActionCode } from 'firebase/auth'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import MailRoundedIcon from '@mui/icons-material/MailRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { auth } from '../firebase'
import './ForgotPasswordPage.css'

export default function EmailVerificationPage({ onNavigateBack, verificationCode }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [message, setMessage] = useState(null)
  const [success, setSuccess] = useState(false)

  // Verify and apply the verification code when component mounts
  useEffect(() => {
    const verifyEmail = async () => {
      if (!verificationCode) {
        setMessage({ type: 'error', text: 'No verification code provided. Please try the verification link again.' })
        setLoading(false)
        return
      }

      try {
        console.log('[EMAIL VERIFY] Checking code:', verificationCode.substring(0, 20) + '...')
        
        // First, check the code to get the email
        const info = await checkActionCode(auth, verificationCode)
        console.log('[EMAIL VERIFY] Code verified for email:', info?.data?.email)
        
        if (info?.data?.email) {
          setEmail(info.data.email)
        }

        // Now apply the code to actually verify the email
        console.log('[EMAIL VERIFY] Applying verification code...')
        setVerifying(true)
        await applyActionCode(auth, verificationCode)
        console.log('[EMAIL VERIFY] Email verified successfully')
        
        setSuccess(true)
        setMessage({
          type: 'success',
          text: 'Email verified successfully!',
        })
      } catch (error) {
        console.error('[EMAIL VERIFY] Verification failed:', error?.code, error?.message)
        
        if (error?.code === 'auth/invalid-action-code' || error?.code === 'auth/expired-action-code') {
          setMessage({
            type: 'error',
            text: 'Your verification link has expired. Please request a new verification email.',
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

    verifyEmail()
  }, [verificationCode])

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
            Your email {email && <strong>{email}</strong>} has been verified. You can now access all features of your account.
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
