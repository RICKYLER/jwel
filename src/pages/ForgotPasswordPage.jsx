import { useState } from 'react'
import MailRoundedIcon from '@mui/icons-material/MailRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { sendPasswordResetEmail } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { auth, functions } from '../firebase'
import './ForgotPasswordPage.css'

export default function ForgotPasswordPage({ onNavigateBack, onNavigateConfirmation, onGoogleSignIn }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [emailExists, setEmailExists] = useState(null) // null = unknown, true/false = known
  const [emailChecked, setEmailChecked] = useState(false) // Track if email has been validated
  const [isGoogleOnly, setIsGoogleOnly] = useState(false) // Track if account is Google-only
  const [hasDualAuth, setHasDualAuth] = useState(false) // Track if account has both Google and password
  const [isAuthorizedNeedsAdmin, setIsAuthorizedNeedsAdmin] = useState(false) // Track if authorized account needs admin help

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
        setIsGoogleOnly(false)
        setIsAuthorizedNeedsAdmin(false)
        setMessage({ type: 'error', text: 'No account found for that email.' })
        return
      }
      
      setEmailExists(true)

      // Check if account has both Google and password methods
      const hasGoogle = result.authMethods?.includes('google.com')
      const hasPassword = result.authMethods?.includes('password')
      
      console.log('[ForgotPassword] Auth methods detected:', { authMethods: result.authMethods, hasGoogle, hasPassword })

      // Set email as checked for button text update
      setEmailChecked(true)

      // If has BOTH Google and password, show both options
      if (hasGoogle && hasPassword) {
        console.log('[ForgotPassword] Dual-auth detected, showing both buttons')
        setIsGoogleOnly(false)
        setHasDualAuth(true)
        setIsAuthorizedNeedsAdmin(false)
        setMessage({
          type: 'info',
          text: 'This account has multiple authentication methods. Choose one below.',
        })
        return
      }

      // If only Google Sign-In (no password method)
      if (hasGoogle && !hasPassword) {
        console.log('[ForgotPassword] Google-only account detected')
        setIsGoogleOnly(true)
        setHasDualAuth(false)
        setIsAuthorizedNeedsAdmin(false)
        setMessage({
          type: 'info',
          text: 'This account uses Google Sign-In. Please sign in with Google instead.',
        })
        return
      }

      // If email found in users collection or has password auth, try to send reset email
      if (result.collection === 'users' || hasPassword) {
        setIsGoogleOnly(false)
        setHasDualAuth(false)
        setIsAuthorizedNeedsAdmin(false)
        try {
          // Send password reset email with custom action code settings
          // This tells Firebase to redirect to our app instead of showing Firebase's default UI
          const actionCodeSettings = {
            url: window.location.origin,
            handleCodeInApp: true,
          }
          await sendPasswordResetEmail(auth, emailLower, actionCodeSettings)
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
        console.log('[ForgotPassword] Authorized account detected that needs admin help')
        setIsGoogleOnly(false)
        setHasDualAuth(false)
        setIsAuthorizedNeedsAdmin(true)
        setMessage({
          type: 'info',
          text: 'Please contact your administrator to reset your password.',
        })
        return
      }

      setIsGoogleOnly(false)
      setHasDualAuth(false)
      setIsAuthorizedNeedsAdmin(false)
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
        
        const hasGoogle = result.authMethods?.includes('google.com')
        const hasPassword = result.authMethods?.includes('password')
        console.log('[ForgotPassword] Auth methods on blur:', { authMethods: result.authMethods, hasGoogle, hasPassword })
        
        // If has BOTH Google and password
        if (hasGoogle && hasPassword) {
          console.log('[ForgotPassword] Dual-auth detected on blur')
          setIsGoogleOnly(false)
          setHasDualAuth(true)
          setMessage({ type: 'info', text: 'This account has multiple authentication methods. Choose one below.' })
        }
        // If Google-only
        else if (hasGoogle && !hasPassword) {
          setIsGoogleOnly(true)
          setHasDualAuth(false)
          setIsAuthorizedNeedsAdmin(false)
          setMessage({ type: 'info', text: 'This account uses Google Sign-In. Please sign in with Google instead.' })
        }
        // Otherwise show no message
        else {
          setIsGoogleOnly(false)
          setHasDualAuth(false)
          setIsAuthorizedNeedsAdmin(false)
          setMessage(null)
        }
        return true
      }
      
      // Not found anywhere
      setEmailExists(false)
      setIsGoogleOnly(false)
      setHasDualAuth(false)
      setIsAuthorizedNeedsAdmin(false)
      setMessage({ type: 'error', text: 'No account found for that email.' })
      return false
    } catch (err) {
      console.error('[ForgotPassword] Error checking email:', err?.code, err?.message)
      setIsGoogleOnly(false)
      setHasDualAuth(false)
      setIsAuthorizedNeedsAdmin(false)
      setMessage({ type: 'error', text: err?.message || 'Unable to check email.' })
      return null
    }
  }

  const handleEmailBlur = async () => {
    if (!email) return
    await checkEmailRegistered(email)
    setEmailChecked(true)
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
                  onChange={(e) => { setEmail(e.target.value); setEmailExists(null); setEmailChecked(false); setIsGoogleOnly(false); setHasDualAuth(false); setIsAuthorizedNeedsAdmin(false) }}
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

            {!emailChecked ? (
              <button 
                type="submit" 
                disabled={loading || !email} 
                className="forgot-password-submit-btn"
              >
                {loading ? 'SUBMITTING…' : 'SUBMIT'}
              </button>
            ) : isAuthorizedNeedsAdmin ? (
              <button 
                type="button"
                onClick={async () => {
                  console.log('[ForgotPassword] Contact administrator clicked for:', email)
                  try {
                    setLoading(true)
                    const contactAdministrator = httpsCallable(functions, 'contactAdministrator')
                    const response = await contactAdministrator({
                      email: String(email || '').trim().toLowerCase(),
                      fullName: email, // Use email as fallback for fullName
                    })
                    
                    console.log('[ForgotPassword] Admin contact request submitted:', response.data)
                    
                    // Navigate to confirmation page for authorized account support
                    if (onNavigateConfirmation) {
                      onNavigateConfirmation(email, 'authorized')
                    }
                  } catch (error) {
                    console.error('[ForgotPassword] Error contacting administrator:', error)
                    setMessage({
                      type: 'error',
                      text: `Failed to submit request: ${error.message}`,
                    })
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="forgot-password-submit-btn forgot-password-admin-btn"
              >
                {loading ? 'SUBMITTING…' : 'CONTACT ADMINISTRATOR'}
              </button>
            ) : hasDualAuth ? (
              <div className="forgot-password-button-group">
                <button 
                  type="submit" 
                  disabled={loading || !email || emailExists === false} 
                  className="forgot-password-submit-btn forgot-password-password-btn"
                >
                  {loading ? 'SENDING…' : 'SEND RESET LINK'}
                </button>
                <button 
                  type="button" 
                  onClick={() => onGoogleSignIn?.('customer')}
                  className="forgot-password-submit-btn forgot-password-google-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  SIGN IN WITH GOOGLE
                </button>
              </div>
            ) : isGoogleOnly ? (
              <button 
                type="button" 
                onClick={() => onGoogleSignIn?.('customer')}
                className="forgot-password-submit-btn forgot-password-google-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                SIGN IN WITH GOOGLE
              </button>
            ) : (
              <button type="submit" disabled={loading || !email || emailExists === false} className="forgot-password-submit-btn">
                {loading ? 'SENDING…' : 'SEND RESET LINK'}
              </button>
            )}
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
