import { useState } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'
import './PasswordResetConfirmationPage.css'

export default function PasswordResetConfirmationPage({ email, onNavigateBack,  }) {
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState(null)

  const handleResendEmail = async () => {
    if (!email) return
    
    setIsResending(true)
    setResendMessage(null)
    
    try {
      const emailLower = String(email || '').trim().toLowerCase()
      await sendPasswordResetEmail(auth, emailLower)
      setResendMessage({ type: 'success', text: 'Reset link resent! Check your inbox.' })
      console.log('[PasswordResetConfirmation] Reset email resent to:', emailLower)
    } catch (err) {
      console.error('[PasswordResetConfirmation] Resend error:', err?.code, err?.message)
      setResendMessage({ type: 'error', text: 'Failed to resend. Please try again.' })
    } finally {
      setIsResending(false)
    }
  }

  const handleContactSupport = () => {
    // Placeholder for contact support functionality
    console.log('[PasswordResetConfirmation] Contact support clicked')
    // Could navigate to contact form or open support chat
  }

  return (
    <main className="password-reset-confirmation-container">
      {/* Left Side: Dramatic Hero Section */}
      <section className="password-reset-confirmation-hero">
        <img
          alt="Moody motorcycle photography"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBC-8OYJaalSk9LjInUHU-pM9iUfKwtwzklz3sdFFfTv1WiSWAsYNSrOvXvV_toP9Nqe2Xk-k9-daTftTGnQTeQj6WF-fYvwEn9OM9aDYDRVQYwO7Q8p2BxdW8MV4No5FRCtLM-CJ-B6YhYJg3YUdyKBOPbtDRBASYnWTV82HcCoy6-CZrEL61NIHCZshxYdYZX4S2w6B4OOXKSDn7I564bHWLPpBaf_TKFk8FqGhhphDIJ6JjFL2f6kv8tn4SwrZ6ojRn3KJDLyojc"
          className="password-reset-confirmation-hero-image"
        />
        <div className="password-reset-confirmation-hero-overlay" />
        <div className="password-reset-confirmation-hero-overlay-right" />
        
        <div className="password-reset-confirmation-hero-content">
          <div className="password-reset-confirmation-hero-label">
            <div className="password-reset-confirmation-hero-label-bar" />
            <span>SYSTEM STATUS</span>
          </div>
          <h1 className="password-reset-confirmation-hero-title">LINK SENT</h1>
          <p className="password-reset-confirmation-hero-subtitle">
            Security protocols engaged. Access credentials have been dispatched to your registered communication channel.
          </p>
        </div>

        {/* Brand Watermark */}
        <div className="password-reset-confirmation-brand">VELOCITY</div>
      </section>

      {/* Right Side: Content Canvas */}
      <section className="password-reset-confirmation-content-section">
        <div className="password-reset-confirmation-content-wrapper">
         
          {/* Main Content */}
          <div className="password-reset-confirmation-main">
            {/* Success Indicator */}
            <div className="password-reset-confirmation-success-indicator">
              <MarkEmailReadRoundedIcon sx={{ fontSize: 32 }} />
            </div>

            {/* Heading */}
            <div className="password-reset-confirmation-heading">
              <h2>CHECK YOUR EMAIL</h2>
            </div>

            {/* Email Info Box */}
            <div className="password-reset-confirmation-info-box">
              <p>
                We've sent a password reset link to <span className="password-reset-confirmation-email-highlight">{email}</span>. 
                Please check your inbox and follow the instructions to reset your password.
              </p>
            </div>

            {/* Resend Message */}
            {resendMessage && (
              <div className={`password-reset-confirmation-resend-message ${resendMessage.type}`}>
                {resendMessage.text}
              </div>
            )}

            {/* Action Buttons */}
            <div className="password-reset-confirmation-actions">
              <button 
                onClick={onNavigateBack} 
                className="password-reset-confirmation-primary-btn"
                disabled={isResending}
              >
                <span>BACK TO LOGIN</span>
                <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
              </button>

              <div className="password-reset-confirmation-helpful-tip">
                <div className="password-reset-confirmation-tip-icon">
                  <InfoRoundedIcon sx={{ fontSize: 20 }} />
                </div>
                <div className="password-reset-confirmation-tip-content">
                  <p className="password-reset-confirmation-tip-label">Helpful Tip</p>
                  <p className="password-reset-confirmation-tip-text">
                    Can't find the email? Please check your <span className="password-reset-confirmation-tip-highlight">spam folder</span> or wait a few minutes before trying again.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="password-reset-confirmation-footer">
              <button 
                onClick={handleResendEmail} 
                disabled={isResending}
                className="password-reset-confirmation-footer-link"
              >
                {isResending ? 'RESENDING…' : 'RESEND LINK'}
              </button>
              <button 
                onClick={handleContactSupport}
                className="password-reset-confirmation-footer-link"
              >
                CONTACT SUPPORT
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Grainy Texture Overlay */}
      <div className="password-reset-confirmation-noise-overlay" />
    </main>
  )
}
