import { useState, useEffect } from 'react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import bykelinkLogo from '../assets/bykelinklogo.png'

export default function NavHeader({
  currentUser,
  customerName,
  navLinks,
  onLogoClick,
  onNavigateClick,
  onUserMenuClick,
  onSignOut,
  onAuthClick,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const handleNavClick = (event, link) => {
    event.preventDefault()
    setIsMenuOpen(false)
    onNavigateClick(link)
  }

  const handleMenuClose = () => {
    setIsMenuOpen(false)
  }

  return (
    <>
      <style>{`
        :root { --nav-underline-color-start: #ff5540; --nav-underline-color-end: #ffffff; }

        .mobile-menu-backdrop {
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .mobile-menu-backdrop.is-open {
          opacity: 1;
          visibility: visible;
        }

        .mobile-menu-panel {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateX(-100%);
        }

        .mobile-menu-panel.is-open {
          transform: translateX(0);
        }

        /* Desktop nav link hover underline (matches ForgotPasswordPage style) */
        .nav-link {
          position: relative;
          transition: color 0.2s ease, transform 0.12s ease;
          padding-bottom: 2px;
        }

        .nav-link::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--nav-underline-color-start), var(--nav-underline-color-start));
          transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 2px;
        }

        .nav-link:hover {
          color: #ff5540 !important; /* match Get Started hover */
          transform: translateY(-3px);
          text-shadow: 0 1px 0 rgba(0,0,0,0.2);
        }

        .nav-link:hover::before {
          width: 100%;
        }

        /* subtle glow on hover to match other header hover effects */
        .nav-link:hover::after {
          content: '';
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: -6px;
          width: 60%;
          height: 6px;
          background: rgba(255,85,64,0.08);
          border-radius: 6px;
          transition: opacity 0.25s ease;
        }

        /* User buttons in header */
        .nav-user-button {
          transition: transform 0.12s ease, box-shadow 0.18s ease, background-color 0.12s ease;
        }

        .nav-user-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(2,6,23,0.4);
        }

        .nav-user-button.primary:hover {
          box-shadow: 0 12px 24px rgba(239,68,68,0.18);
        }

        /* Get Started button: liquid glass background; hover only changes text/icon color */
        .get-started-btn {
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
          backdrop-filter: blur(10px) saturate(130%);
          -webkit-backdrop-filter: blur(10px) saturate(130%);
          border: 1px solid rgba(255,255,255,0.18);
          color: #ffffff;
          padding-left: 1.25rem;
          padding-right: 1.25rem;
          transition: color 0.18s ease;
        }

        .get-started-btn:hover {
          color: #ff5540 !important;
          /* keep background, border and layout unchanged - only color (and icons inheriting it) should change */
        }

        /* Wipe animation for Get Started button text */
        .get-started-btn .wipe {
          display: inline-block;
          background: linear-gradient(90deg, #ff5540 0%, #ff5540 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
          background-size: 0% 100%;
          background-position: left center;
          background-repeat: no-repeat;
          transition: background-size 0.36s cubic-bezier(0.22, 1, 0.36, 1), -webkit-text-fill-color 0s ease 0s;
        }

        .get-started-btn:hover .wipe {
          background-size: 100% 100%;
          -webkit-text-fill-color: transparent;
          color: transparent;
          transition-delay: 0s, 0.12s;
        }

        .get-started-btn .icon-replace {
          transition: color 0.26s ease 0.12s;
          color: inherit;
        }

        .get-started-btn:hover .icon-replace {
          color: #ff5540;
        }

        .get-started-btn .icon-replace {
          transition: color 0.18s ease, transform 0.12s ease;
          color: inherit;
        }

        /* Glassmorphism header */
        .nav-header {
          background: linear-gradient(180deg, rgba(15,23,42,0.55), rgba(8,12,22,0.40));
          backdrop-filter: blur(10px) saturate(130%);
          -webkit-backdrop-filter: blur(10px) saturate(130%);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 8px 30px rgba(2,6,23,0.45);
        }

        /* Make mobile panel feel glassy too */
        .mobile-menu-panel {
          background: linear-gradient(180deg, rgba(15,23,42,0.7), rgba(8,12,22,0.5));
          backdrop-filter: blur(12px) saturate(130%);
          -webkit-backdrop-filter: blur(12px) saturate(130%);
          border-right: 1px solid rgba(255,255,255,0.04);
          box-shadow: 0 10px 40px rgba(2,6,23,0.5);
        }

        /* Mobile menu item styles to match desktop behavior */
        .mobile-nav-link {
          display: block;
          position: relative;
          padding-left: 1rem;
          padding-right: 1rem;
          transition: color 0.18s ease, transform 0.12s ease, background-color 0.12s ease;
          border-radius: 0.5rem;
        }

        .mobile-nav-link::before {
          content: '';
          position: absolute;
          left: 1rem;
          bottom: 8px;
          width: 0;
          height: 2px;
          background: #ff5540;
          transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 2px;
        }

        .mobile-nav-link:hover {
          color: #ff5540 !important;
          transform: translateY(-3px);
          background: rgba(255,85,64,0.03);
        }

        .mobile-nav-link:hover::before {
          width: calc(100% - 2rem);
        }

        /* Mobile user/action buttons (full-width) */
        .mobile-get-started-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.9);
          color: #ffffff;
          transition: color 0.18s ease, border-color 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease;
        }

        .mobile-get-started-btn:hover {
          color: #ff5540 !important;
          border-color: rgba(255,85,64,0.95) !important;
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(255,85,64,0.08);
        }
      `}</style>

      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm mobile-menu-backdrop md:hidden ${isMenuOpen ? 'is-open' : ''}`}
        onClick={handleMenuClose}
        style={{
          opacity: isMenuOpen ? 1 : 0,
          visibility: isMenuOpen ? 'visible' : 'hidden',
          pointerEvents: isMenuOpen ? 'auto' : 'none',
        }}
      />

      <header className="fixed top-0 z-50 w-full border-b border-slate-700/40 nav-header">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            type="button"
            onClick={onLogoClick}
            className="flex items-center gap-3 text-left"
          >
            <img src={bykelinkLogo} alt="Bykelink logo" className="h-10 w-10 rounded-xl bg-white/95 p-1.5" />
            <div>
              <div className="text-lg font-black uppercase tracking-tight text-neutral-100 font-['Epilogue'] sm:text-2xl">
                BYKELINK
              </div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-neutral-400 sm:text-[11px]">
                Yamaha Dealer
              </div>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => {
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(event) => handleNavClick(event, link)}
                  className={`border-b-2 pb-1 text-sm font-bold uppercase tracking-tight font-['Epilogue'] transition-colors duration-300 border-transparent text-neutral-400 nav-link`}
                >
                  {link.label}
                </a>
              )
            })}
          </nav>

          {/* Desktop User Section */}
          <div className="hidden items-center gap-3 md:flex">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={onUserMenuClick}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white nav-user-button"
                >
                  {customerName}
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-full border border-red-400/40 bg-red-600/20 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-600 hover:text-white nav-user-button"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onAuthClick}
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-black uppercase tracking-tight text-white font-['Epilogue'] transition duration-300 nav-user-button get-started-btn"
              >
                <span className="wipe">Get Started</span>
                <ArrowForwardRoundedIcon sx={{ fontSize: 18, color: 'inherit' }} className="icon-replace" />
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex rounded-lg border border-white/10 bg-white/5 p-2 text-white md:hidden hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <CloseRoundedIcon fontSize="small" /> : <MenuRoundedIcon fontSize="small" />}
          </button>
        </div>

        {/* Mobile Menu Slide Panel */}
        <div
          className={`mobile-menu-panel fixed top-16 left-0 h-[calc(100vh-64px)] w-80 max-w-[calc(100vw-24px)] bg-slate-950/98 backdrop-blur-xl border-r border-white/10 shadow-2xl md:hidden overflow-y-auto z-50 ${isMenuOpen ? 'is-open' : ''}`}
        >
          <div className="flex flex-col gap-3 p-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(event) => handleNavClick(event, link)}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold uppercase tracking-tight text-white transition-all duration-200 mobile-nav-link"
              >
                {link.label}
              </a>
            ))}

            <div className="border-t border-white/10 pt-3 mt-3">
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleMenuClose()
                      onUserMenuClick()
                    }}
                    className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-bold uppercase tracking-tight text-white transition-all duration-200 mobile-nav-link mb-2"
                  >
                    {customerName}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleMenuClose()
                      onSignOut()
                    }}
                      className="w-full rounded-xl border border-red-400/40 bg-red-600/20 px-4 py-3 text-sm font-black uppercase tracking-tight text-red-200 transition nav-user-button"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleMenuClose()
                    onAuthClick()
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-tight text-white transition duration-300 nav-user-button get-started-btn"
                >
                  <span className="wipe">Get Started</span>
                  <ArrowForwardRoundedIcon sx={{ fontSize: 18, color: 'inherit' }} className="icon-replace" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
