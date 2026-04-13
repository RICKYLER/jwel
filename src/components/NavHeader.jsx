import { useState } from 'react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import bykelinkLogo from '../assets/bykelinklogo.png'

export default function NavHeader({
  currentUser,
  customerName,
  activeNav,
  navLinks,
  onLogoClick,
  onNavigateClick,
  onUserMenuClick,
  onSignOut,
  onAuthClick,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleNavClick = (event, link) => {
    event.preventDefault()
    setIsMenuOpen(false)
    onNavigateClick(link)
  }

  const handleMenuClose = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="fixed top-0 z-50 w-full border-b border-slate-700/40 bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-red-900/10">
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
            const isActive = activeNav === link.label

            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(event) => handleNavClick(event, link)}
                className={`border-b-2 pb-1 text-sm font-bold uppercase tracking-tight font-['Epilogue'] transition-colors duration-300 ${
                  isActive
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-neutral-400 hover:text-neutral-100'
                }`}
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
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
              >
                {customerName}
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-full border border-red-400/40 bg-red-600/20 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-600 hover:text-white"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onAuthClick}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-black uppercase tracking-tight text-white font-['Epilogue'] transition duration-300 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 active:scale-95"
            >
              Get Started
              <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="inline-flex rounded-xl border border-white/10 bg-white/5 p-2 text-white md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <CloseRoundedIcon fontSize="small" /> : <MenuRoundedIcon fontSize="small" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-white/10 bg-neutral-950/95 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(event) => handleNavClick(event, link)}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold uppercase tracking-tight text-white"
              >
                {link.label}
              </a>
            ))}

            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  handleMenuClose()
                  onSignOut()
                }}
                className="rounded-xl border border-red-400/40 bg-red-600/20 px-4 py-3 text-sm font-black uppercase tracking-tight text-red-200 transition hover:bg-red-600 hover:text-white"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  handleMenuClose()
                  onAuthClick()
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black uppercase tracking-tight text-white transition duration-300 hover:bg-red-700"
              >
                Get Started
                <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
