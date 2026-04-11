import { useState } from 'react'
import GoogleIcon from '@mui/icons-material/Google'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import TwoWheelerRoundedIcon from '@mui/icons-material/TwoWheelerRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'

export default function LoginPage({
  onGoogleSignIn,
  onAuthFieldChange,
  onAuthSubmit,
  authForm,
  authLoading,
  googleLoading,
  authMode,
  onSelectAuthPersona,
  onToggleAuthMode,
  onNavigateBack,
  authMessage,
  onClearAuthMessage,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberSession, setRememberSession] = useState(false)
  const isSignup = authMode === 'signup'

  const handleSubmit = (e) => {
    e.preventDefault()
    onAuthSubmit(e)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-[#131313] text-[#e5e2e1]">
      {/* Left Section: High-Impact Visual */}
      <section className="hidden md:flex relative w-1/2 h-screen flex-col justify-between p-12">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#131313]/40 to-[#131313] z-10" />
        <div className="absolute inset-0 bg-neutral-950/20 z-10" />
        <img
          alt="Yamaha R1 Detail"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOYh1VE8GHnBGKvUvSZok4TgFf2UfOuQCaQZ1zDAYQLB-CkhLmw1mQ4zqEPTDQEUeQuoTFexJfBfonEo4ur4Hg8cBLp_o5Q5kCBDopOu9q1bSc3ZFFcwmdiqVz11uDgBIGg0xGPC2u-cL_cF9Md1LCiEpRfDeP6G4GS1k4R2zG6wcOb9rVXOVdNuu5KLvwh3YXr0SERtwaLZyAxXX3SMLIzgCWI_yCfGdz056mrFGBy7kXZmqVlY3XxcybIssMFPmGCwon5xXy0J8"
        />

        {/* Branding Overlay */}
        <div className="relative z-20">
          <div className="text-2xl font-black italic text-[#e5e2e1] tracking-tighter uppercase font-['Epilogue']">
            Bykelink
          </div>
        </div>

        <div className="relative z-20 space-y-4">
          <h1 className="text-7xl font-bold tracking-tighter font-['Epilogue'] uppercase leading-none">
            Ignite <br /> The <span className="text-[#e10100]">Pulse</span>
          </h1>
          <p className="text-neutral-400 font-['Manrope'] uppercase tracking-widest text-sm max-w-sm">
            Experience the raw precision of engineering and the thrill of the open road.
          </p>
        </div>

        {/* Red Ambient Glow */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-linear-to-t from-[#e10100]/20 to-transparent z-10 pointer-events-none" />
      </section>

      {/* Right Section: Login/Signup Form */}
      <section className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 relative bg-[#131313]">
        {/* Back Button */}
        {onNavigateBack && (
          <button
            type="button"
            onClick={onNavigateBack}
            className="absolute top-6 left-6 z-50 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors md:top-8 md:left-8"
            aria-label="Go back to home"
          >
            ← Back
          </button>
        )}

        {/* Mobile Logo */}
        <div className="md:hidden mb-12">
          <div className="text-3xl font-black italic text-[#e5e2e1] tracking-tighter uppercase font-['Epilogue']">
            Bykelink
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* Auth Message Display */}
          {authMessage && (
            <div
              className={`mb-6 rounded-xl p-4 text-sm font-['Manrope'] ${
                authMessage.type === 'error'
                  ? 'bg-red-900/20 border border-red-600/50 text-red-200'
                  : 'bg-emerald-900/20 border border-emerald-600/50 text-emerald-200'
              }`}
            >
              <p>{authMessage.text}</p>
              {onClearAuthMessage && (
                <button
                  type="button"
                  onClick={onClearAuthMessage}
                  className="mt-2 text-xs font-bold uppercase tracking-wide opacity-70 hover:opacity-100"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}

          {/* Header */}
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-4xl font-extrabold font-['Epilogue'] uppercase tracking-tighter mb-2">
              {isSignup ? 'Create Account' : 'Welcome back'}
            </h2>
            <p className="text-neutral-400 font-['Manrope'] text-sm uppercase tracking-widest">
              {isSignup ? 'Join the BYKELINK community' : 'Sign in to your garage dashboard'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Signup Fields */}
            {isSignup && (
              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400/60 px-4">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={authForm.fullName || ''}
                    onChange={onAuthFieldChange}
                    required
                    autoComplete="name"
                    placeholder="Juan Dela Cruz"
                    className="w-full bg-[#353534] border-none rounded-xl py-4 px-6 text-white placeholder:text-neutral-500/50 focus:ring-2 focus:ring-[#e10100]/50 transition-all outline-none font-['Manrope']"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400/60 px-4">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={authForm.phone || ''}
                    onChange={onAuthFieldChange}
                    autoComplete="tel"
                    placeholder="09xx xxx xxxx"
                    className="w-full bg-[#353534] border-none rounded-xl py-4 px-6 text-white placeholder:text-neutral-500/50 focus:ring-2 focus:ring-[#e10100]/50 transition-all outline-none font-['Manrope']"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400/60 px-4">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={authForm.email || ''}
                onChange={onAuthFieldChange}
                required
                autoComplete="email"
                placeholder="rider@bykelink.com"
                className="w-full bg-[#353534] border-none rounded-xl py-4 px-6 text-white placeholder:text-neutral-500/50 focus:ring-2 focus:ring-[#e10100]/50 transition-all outline-none font-['Manrope']"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-4">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400/60">
                  Password
                </label>
                {!isSignup && (
                  <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb4a8] hover:text-[#e10100] transition-colors">
                    Forgot Password?
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={authForm.password || ''}
                  onChange={onAuthFieldChange}
                  required
                  minLength={8}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder={isSignup ? '8+ characters with upper, lower, and number' : '••••••••'}
                  className="w-full bg-[#353534] border-none rounded-xl py-4 px-6 pr-12 text-white placeholder:text-neutral-500/50 focus:ring-2 focus:ring-[#e10100]/50 transition-all outline-none font-['Manrope']"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (Signup only) */}
            {isSignup && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400/60 px-4">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={authForm.confirmPassword || ''}
                    onChange={onAuthFieldChange}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    className="w-full bg-[#353534] border-none rounded-xl py-4 px-6 pr-12 text-white placeholder:text-neutral-500/50 focus:ring-2 focus:ring-[#e10100]/50 transition-all outline-none font-['Manrope']"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? (
                      <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                    ) : (
                      <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Password Security Checklist (Signup only) */}
            {isSignup && (
              <div className="rounded-xl border border-neutral-700/50 bg-[#1c1b1b] p-4 text-sm text-neutral-300 space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffb4a8]">
                  Password security checklist
                </p>
                <div className="grid gap-2 grid-cols-2 text-xs">
                  {[
                    {
                      label: 'At least 8 characters',
                      met: (authForm.password || '').length >= 8,
                    },
                    {
                      label: 'Upper and lowercase letters',
                      met:
                        /[a-z]/.test(authForm.password || '') &&
                        /[A-Z]/.test(authForm.password || ''),
                    },
                    {
                      label: 'At least one number',
                      met: /\d/.test(authForm.password || ''),
                    },
                    {
                      label: 'Passwords match',
                      met:
                        Boolean(authForm.confirmPassword) &&
                        authForm.password === authForm.confirmPassword,
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          item.met ? 'bg-emerald-400' : 'bg-neutral-600'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remember Session (Login only) */}
            {!isSignup && (
              <div className="flex items-center space-x-2 px-4">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="w-4 h-4 rounded border border-neutral-600 bg-[#353534] text-[#e10100] focus:ring-[#e10100] focus:ring-offset-[#131313] cursor-pointer"
                />
                <label htmlFor="remember" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 cursor-pointer">
                  Remember this session
                </label>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={authLoading || googleLoading}
                className="w-full bg-[#e10100] hover:bg-[#930100] disabled:opacity-70 text-white py-5 rounded-full font-['Epilogue'] font-bold uppercase tracking-widest text-sm shadow-lg shadow-[#e10100]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isSignup && <PersonAddAlt1RoundedIcon sx={{ fontSize: 18 }} />}
                {authLoading ? 'Please wait...' : (isSignup ? 'Create Secure Account' : 'Login')}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-8 border-t border-neutral-700/30">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <span className="h-px w-8 bg-neutral-700/30" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 whitespace-nowrap">
                Or continue with
              </span>
              <span className="h-px w-8 bg-neutral-700/30" />
            </div>

            {/* Social Login Button */}
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={googleLoading || authLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#1c1b1b] hover:bg-[#2a2a2a] disabled:opacity-50 py-3 rounded-xl transition-all border border-neutral-700/30"
            >
              <GoogleIcon sx={{ fontSize: 18 }} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {googleLoading ? 'Connecting...' : 'Continue with Google'}
              </span>
            </button>
          </div>

          {/* Toggle Between Login/Signup */}
          <div className="mt-8 text-center">
            <p className="text-sm font-['Manrope'] text-neutral-500">
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onToggleAuthMode('login')}
                    className="text-white font-bold hover:text-[#e10100] transition-colors"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onToggleAuthMode('signup')}
                    className="text-white font-bold hover:text-[#e10100] transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Decorative Motorcycle Icon */}
        <div className="absolute top-12 right-12 opacity-5 pointer-events-none hidden lg:block">
          <TwoWheelerRoundedIcon sx={{ fontSize: 200 }} className="text-white" />
        </div>
      </section>

      {/* Footer Links */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-12 md:translate-x-0 z-50">
        <div className="flex space-x-6">
          <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 hover:text-white transition-colors flex items-center gap-1">
            <HelpOutlineRoundedIcon sx={{ fontSize: 16 }} />
            Help
          </a>
          <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 hover:text-white transition-colors">
            Privacy
          </a>
          <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 hover:text-white transition-colors">
            Terms
          </a>
        </div>
      </footer>
    </div>
  )
}
