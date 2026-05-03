import { useState } from 'react'
import MailRoundedIcon from '@mui/icons-material/MailRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { sendPasswordResetEmail } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { auth, functions } from '../firebase'
import './ForgotPasswordPage.css'

export default function ForgotPasswordPage({ onNavigateBack, onNavigateConfirmation }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [emailExists, setEmailExists] = useState(null) // null = unknown, true/false = known
  const [isGoogleOnly, setIsGoogleOnly] = useState(false) // Track if account is Google-only

  // Check if email exists using Cloud Function
  const checkEmailWithCloudFunction = async (emailLower) => {
    try {
      const checkEmailExists = httpsCallable(functions, 'checkEmailExists')
      const result = await checkEmailExists({ email: emailLower })
      console.log('[ForgotPassword] Cloud Function result:', result.data)
      return result.data
    } catch (err) {
      console.error('[ForgotPassword] Cloud Function error:', err?.code, err?.message)
      throw err
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setMessage(null)
    setLoading(true)
    // If we've already checked and email is not registered, abort early
    if (emailExists === false) {
      // emailExists false already sets an inline message earlier
      setLoading(false)
      return
    }
    try {
      const emailLower = String(email || '').trim().toLowerCase()
      
      // Use Cloud Function to check email
      const result = await checkEmailWithCloudFunction(emailLower)
      console.log('[ForgotPassword] Submit - Cloud Function result:', result)
      
      // If not found in either source
      if (!result.found) {
        setEmailExists(false)
        setMessage({ type: 'error', text: 'No account found for that email.' })
        return
      }
      
      setEmailExists(true)

      // If only Google Sign-In (no password method)
      if (result.authMethods?.includes('google.com') && !result.authMethods?.includes('password')) {
        setMessage({
          type: 'info',
          text: 'This account uses Google Sign-In. Please sign in with Google instead.',
        })
        return
      }

      // If email found in users collection or has password auth, try to send reset email
      if (result.collection === 'users' || result.authMethods?.includes('password')) {
        try {
          await sendPasswordResetEmail(auth, emailLower)
          setMessage({ type: 'success', text: 'Password reset link sent! Check your inbox and spam folder.' })
          // Navigate to confirmation page
          if (onNavigateConfirmation) {
            // Navigate immediately to the confirmation page so the app can update state
            // (previously delayed by 500ms which could cause navigation to be missed)
            console.log('[ForgotPassword] Navigating to confirmation for:', emailLower)
            onNavigateConfirmation(emailLower)
          }
          setEmail('')
          return
        } catch (err) {
          console.error('[ForgotPassword] Error sending reset email:', err?.message)
          setMessage({ type: 'error', text: 'Failed to send reset email. Please try again.' })
          return
        }
      }

      // For admin/superadmin/personnel accounts without password auth
      if (result.collection && result.collection !== 'auth' && result.collection !== 'users') {
        setMessage({
          type: 'info',
          text: 'Please contact your administrator to reset your password.',
        })
        return
      }

      setMessage({ type: 'info', text: 'This account uses a different sign-in method.' })
    } catch (err) {
      console.error('[ForgotPassword] Submit error:', err?.code, err?.message)
      setMessage({ type: 'error', text: err?.message || 'Unable to process request.' })
    } finally {
      setLoading(false)
    }
  }

  // Validate email existence on blur (or when user finishes typing)
  const checkEmailRegistered = async (value) => {
    const e = String(value || '').trim().toLowerCase()
    console.log('[ForgotPassword] Checking email:', e)
    if (!e) return null
    try {
      // Use Cloud Function to check email
      const result = await checkEmailWithCloudFunction(e)
      console.log('[ForgotPassword] Email check result:', result)
      
      // If found in either Firebase Auth or Firestore, mark as exists
      if (result.found) {
        setEmailExists(true)
        console.log('[ForgotPassword] Email found!')
        // Show info if it's a Google-only account
        const isGoogleOnlyAccount = result.authMethods?.includes('google.com') && !result.authMethods?.includes('password')
        if (isGoogleOnlyAccount) {
          setIsGoogleOnly(true)
          setMessage({ type: 'info', text: 'This account uses Google Sign-In. Please sign in with Google instead.' })
        } else {
          setIsGoogleOnly(false)
          setMessage(null)
        }
        return true
      }
      
      // Not found anywhere
      setEmailExists(false)
      setIsGoogleOnly(false)
      setMessage({ type: 'error', text: 'No account found for that email.' })
      return false
    } catch (err) {
      console.error('[ForgotPassword] Error checking email:', err?.code, err?.message)
      setIsGoogleOnly(false)
      setMessage({ type: 'error', text: err?.message || 'Unable to check email.' })
      return null
    }
  }

  const handleEmailBlur = async () => {
    if (!email) return
    await checkEmailRegistered(email)
  }

  return (
    <main className="forgot-password-container">
      {/* Left Side: Dramatic Hero Section */}
      <section className="forgot-password-hero">
        <img
          alt="Dramatic motorcycle"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqyVXCwJbaMubH9PkEo5qQYsDVnqbQUO48RDJZ7FWY9-H5fjImdo7Ahe3vfp1H2zO9GU7sudLgAzycA5vGSNsfAjKaHtxJog2IBsUxabmCqoqghRRy6vjTuf7N-O7KCprQZ9iM9pDkYMAiK_FyYveUTChxyy2c_Frq4mb6XrzDS-hzVD2UI1H2EuaIe0SvJzsDW1vQ7p86BxzvSOEvz_WFq0S1_MuQnobNygUuH9FnT2VjvjUAKV8CnKjz1AO2FVgN2kViZsxkwLY_"
        />
        <div className="forgot-password-hero-overlay" />
        <div className="forgot-password-hero-overlay-right" />
        <div className="forgot-password-hero-content">
          <h2 className="forgot-password-hero-title">RIDE SECURE</h2>
          <p className="forgot-password-hero-subtitle">YOUR BIKE, YOUR DATA, YOUR ACCESS.</p>
        </div>
        {/* Brand Logo Top Left Overlay */}
        <div className="forgot-password-brand">BykeLink</div>
      </section>

      {/* Right Side: Transactional Content */}
      <section className="forgot-password-form-container">
        {/* Top Navigation */}
        <div className="forgot-password-back-btn">
          <button onClick={onNavigateBack}>
            <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
            <span>BACK TO LOGIN</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="forgot-password-content">
          <div className="forgot-password-header">
            <h1>FORGOT PASSWORD?</h1>
            <p>ENTER YOUR EMAIL TO RECEIVE A RESET LINK.</p>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`forgot-password-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="forgot-password-form-group">
              <label className="forgot-password-form-label">EMAIL ADDRESS</label>
              <div className="forgot-password-input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailExists(null); setIsGoogleOnly(false) }}
                  required
                  placeholder="rider@bykelink.com"
                  className="forgot-password-input"
                  onBlur={handleEmailBlur}
                />
                <div className="forgot-password-input-icon">
                  <MailRoundedIcon sx={{ fontSize: 20 }} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading || !email || emailExists === false || isGoogleOnly} className="forgot-password-submit-btn">
              {loading ? 'SENDING…' : 'SEND RESET LINK'}
            </button>
          </form>

          <div className="forgot-password-divider">
            <div className="forgot-password-divider-line" />
            <span className="forgot-password-divider-text">SECURE AUTHENTICATION</span>
            <div className="forgot-password-divider-line" />
          </div>
        </div>

        {/* Footer Links */}
        <footer className="forgot-password-footer">
          <a href="#">HELP</a>
          <a href="#">PRIVACY</a>
          <a href="#">TERMS</a>
        </footer>
      </section>
    </main>
  )
}
