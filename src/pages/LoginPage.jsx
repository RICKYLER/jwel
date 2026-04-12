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
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Left Section: High-Impact Visual */}
      <section className="hidden md:flex relative w-1/2 h-screen flex-col justify-between p-12 border-r border-slate-700/40">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-slate-900/45 to-slate-900 z-10" />
        <div className="absolute inset-0 bg-slate-950/30 z-10" />
        <img
          alt="Yamaha R1 Detail"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOYh1VE8GHnBGKvUvSZok4TgFf2UfOuQCaQZ1zDAYQLB-CkhLmw1mQ4zqEPTDQEUeQuoTFexJfBfonEo4ur4Hg8cBLp_o5Q5kCBDopOu9q1bSc3ZFFcwmdiqVz11uDgBIGg0xGPC2u-cL_cF9Md1LCiEpRfDeP6G4GS1k4R2zG6wcOb9rVXOVdNuu5KLvwh3YXr0SERtwaLZyAxXX3SMLIzgCWI_yCfGdz056mrFGBy7kXZmqVlY3XxcybIssMFPmGCwon5xXy0J8"
        />

        {/* Branding Overlay */}
        <div className="relative z-20">
          <div className="text-2xl font-black italic tracking-tighter uppercase font-['Epilogue'] bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Bykelink
          </div>
        </div>

        <div className="relative z-20 space-y-4">
          <h1 className="text-7xl font-bold tracking-tighter font-['Epilogue'] uppercase leading-none text-white">
            Ignite <br /> The <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-300 to-cyan-300">Pulse</span>
          </h1>
          <p className="text-slate-300 font-['Manrope'] uppercase tracking-widest text-sm max-w-sm">
            Experience the raw precision of engineering and the thrill of the open road.
          </p>
        </div>

        {/* Red Ambient Glow */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-linear-to-t from-cyan-500/20 to-transparent z-10 pointer-events-none" />
      </section>

      {/* Right Section: Login/Signup Form */}
      <section className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 relative bg-slate-900/70 backdrop-blur-sm">
        {/* Back Button */}
        {onNavigateBack && (
          <button
            type="button"
            onClick={onNavigateBack}
            className="absolute top-6 left-6 z-50 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-blue-300 transition-colors md:top-8 md:left-8"
            aria-label="Go back to home"
          >
            ← Back
          </button>
        )}

        {/* Mobile Logo */}
        <div className="md:hidden mb-12">
          <div className="text-3xl font-black italic tracking-tighter uppercase font-['Epilogue'] bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
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
                  : 'bg-emerald-900/20 border border-emerald-500/50 text-emerald-200'
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
            <p className="text-slate-400 font-['Manrope'] text-sm uppercase tracking-widest">
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
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-4 px-6 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 transition-all outline-none font-['Manrope']"
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
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-4 px-6 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 transition-all outline-none font-['Manrope']"
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
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-4 px-6 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 transition-all outline-none font-['Manrope']"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-4">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400/60">
                  Password
                </label>
                {!isSignup && (
                  <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300 hover:text-cyan-200 transition-colors">
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
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-4 px-6 pr-12 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 transition-all outline-none font-['Manrope']"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors"
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
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-4 px-6 pr-12 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 transition-all outline-none font-['Manrope']"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors"
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
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/80 p-4 text-sm text-slate-300 space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
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
                          item.met ? 'bg-emerald-400' : 'bg-slate-600'
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
                  className="w-4 h-4 rounded border border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
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
                className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-70 text-white py-5 rounded-full font-['Epilogue'] font-bold uppercase tracking-widest text-sm shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isSignup && <PersonAddAlt1RoundedIcon sx={{ fontSize: 18 }} />}
                {authLoading ? 'Please wait...' : (isSignup ? 'Create Secure Account' : 'Login')}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-8 border-t border-slate-700/50">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <span className="h-px w-8 bg-slate-700/50" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap">
                Or continue with
              </span>
              <span className="h-px w-8 bg-slate-700/50" />
            </div>

            {/* Social Login Button */}
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={googleLoading || authLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-800/70 hover:bg-slate-700/80 disabled:opacity-50 py-3 rounded-xl transition-all border border-slate-700/60"
            >
              <GoogleIcon sx={{ fontSize: 18 }} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {googleLoading ? 'Connecting...' : 'Continue with Google'}
              </span>
            </button>
          </div>

          {/* Toggle Between Login/Signup */}
          <div className="mt-8 text-center">
            <p className="text-sm font-['Manrope'] text-slate-400">
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onToggleAuthMode('login')}
                    className="text-white font-bold hover:text-cyan-300 transition-colors"
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
                    className="text-white font-bold hover:text-cyan-300 transition-colors"
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

        {/* Footer Links */}
        <footer className="mt-10 w-full max-w-md border-t border-slate-700/50 pt-6">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2">
            <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-blue-300 transition-colors flex items-center gap-1">
              <HelpOutlineRoundedIcon sx={{ fontSize: 16 }} />
              Help
            </a>
            <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-blue-300 transition-colors">
              Privacy
            </a>
            <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-blue-300 transition-colors">
              Terms
            </a>
          </div>
        </footer>
      </section>
    </div>
  )
}
