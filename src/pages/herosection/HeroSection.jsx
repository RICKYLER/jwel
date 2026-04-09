import { useEffect, useMemo, useState } from 'react'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import BuildRoundedIcon from '@mui/icons-material/BuildRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import CallRoundedIcon from '@mui/icons-material/CallRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import GoogleIcon from '@mui/icons-material/Google'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import MailRoundedIcon from '@mui/icons-material/MailRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import bykelinkLogo from '../../assets/bykelinklogo.png'

const navLinks = [
  { label: 'Home', href: '/#home', id: 'home', icon: HomeRoundedIcon },
  { label: 'Showroom', href: '/showroom', id: 'showroom', icon: StorefrontRoundedIcon },
  { label: 'Service', href: '/service', id: 'service', icon: BuildRoundedIcon },
  { label: 'About', href: '/#about', id: 'about', icon: InfoRoundedIcon },
  { label: 'Contact', href: '/#contact', id: 'contact', icon: CallRoundedIcon },
]

const heroImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDUXTztadQnPhgfPr6AAAzKnk9R4V-FusbLlr-opEiMM2xiC_7NLm_ZSIW_UcKiwm6RndIZIOm8EvIQo3MSSU7XXB8jJO1HU34CJBGDxZWAW5uFAysL1sO8KxAombPTzwYBmDpEgsYU-PVLjn_Hg_JgEsQU9AUT0YEq5s5USKEICdy8Fo8Yh-iPQJC7Pi7qtV_ql9hTM3INKbyaoW6FlR6g-15KQgJF4lQxehfuY50rPySLu-21iL0vE4gMmMEcOAywT87CYWch9X4',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAWPZ6eH2GpP5vf76ITwW-sqFmRkBQUaOylfPb0O6fhAZtPX7QAVnv1nv0Z5R3DGX5sGy2o1PTzK9pMt_bBVNfXCRqiLmLhosIqxqPThr3cvo8ibfGY8mQ3uGl9JxWOVqS47S6VqypBiyFG85q6j7S4nDX_Qf4yHPIqJsamPOdABLRFx73XfqdjHSG51ty1ZIyplF3qNd9N30nVel8tE_nXn4C4LCjY-8SnDQ2c4UKPluczqIj1KgvPL4cCnafqEYAYAZAHfyUcydo',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDPFwSe3L1EylQOxfwf4RgFBX4jhEy6Zejrh6uBRJ6RUj8pU5edtKrH4DZAajTvMKBVz6Q-vuGkjG69ISsvjUl2Lp9nIAAjyeDtXSKZVCgVI15pHAzij007ZZ_yLmMQXKwuf7jk-1NBwrRHz6uWsZsVFfd8dPg4tKPpbwGE9ED0FNyvXvHZV6OZiCX5UuLqtGAjm4Uhsq-NSE3aliZcOziTYCe05OSiI6EyuX3lrHxBIppOz5qvWGef9teH8PsfdVzC6o4KImTXNj4',
]

const categories = [
  {
    title: 'Scooters',
    subtitle: 'The City Conquerors',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAWPZ6eH2GpP5vf76ITwW-sqFmRkBQUaOylfPb0O6fhAZtPX7QAVnv1nv0Z5R3DGX5sGy2o1PTzK9pMt_bBVNfXCRqiLmLhosIqxqPThr3cvo8ibfGY8mQ3uGl9JxWOVqS47S6VqypBiyFG85q6j7S4nDX_Qf4yHPIqJsamPOdABLRFx73XfqdjHSG51ty1ZIyplF3qNd9N30nVel8tE_nXn4C4LCjY-8SnDQ2c4UKPluczqIj1KgvPL4cCnafqEYAYAZAHfyUcydo',
    large: true,
  },
  {
    title: 'Underbone',
    subtitle: 'Pure Performance',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBDsEVbis-WqVJG_HnFZJ3yMM46Yb80aYgSiuYGAN71h_W4w2ESrhhseg6CQwAduBh5zM8LBQ7TjUH0U9pOb1j552UbgX7kVWh_Gv0ZTUCmMyY8V9aFkfRGuT0UuHc7nesX2z_ehlLXnSzI3eytCL6Tacmhk993kwDR1l453Mu1Ijqrlr7z0-8c6pAcUepNFOEJttFm0JTrOg0eFq166S2tuxiWwQTstazLC2M4k03weWxw-LDAl5kWLW__mUP4D56fGgyDuIK82jg',
  },
  {
    title: 'Big Bikes',
    subtitle: 'Unleash the Beast',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAkBp_k4jLY8y4m3RKoF5e8NrmHj-tZsfF-b7E0We6X6tqiFIP0XefpdoOol_t8F9QgLNEdNeG8iwIcQZKdRdUcX5SSJc9jV7NDqaPxrdKYnboJjLmYhD_HALsDXrwtNnwLukncf0Hu0PffMdZP-RDAUK4TUSBpsCg2JGkZpQ0DNcTphK1kVywHyqHPjU_Xv0CbzrTaw-qJ2Rz6Gf4nQ48VRFwJtX7gr5wgDwKM2d86D6yXE_tIAkxz5Jb1HZ3UAOK8ca10v2CJnw0',
  },
]

const featuredModels = [
  {
    name: 'Yamaha Mio Gravis',
    description: 'Urban agility redefined for the modern explorer.',
    price: '₱3,450',
    note: 'Starting Monthly',
    badge: 'Popular Choice',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuChfhwlpZbQzmJ-un4mRYtVKtEsNlPsK31Ty6GMuScM0k2vCZZrpha1z8G23TCaAghinEwGIe_IMuYEX5sUrcyMWB1gV7Y9rwTVbI12OvjbrwAElv5y3JeT6pLHSUDqS-utHYtyl5c7dayehcb9TdhdIK98kXqNj4b_Z2KOoaot9MCKrPM0DPzjWDiaI6QGgHEpc8UkkW-9eyww1AHSEkY7cgcfXWD65ZeHSOYX4OTb9bmMM3MMLk6rnhXFe-S23OKCQF0VomO82cQ',
    specs: [
      { label: 'Engine', value: '125cc Blue Core' },
      { label: 'Weight', value: '100kg' },
    ],
  },
  {
    name: 'Yamaha NMAX',
    description: 'The King of the road in style and comfort.',
    price: '₱5,200',
    note: 'Starting Monthly',
    badge: 'Premium Grade',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDPFwSe3L1EylQOxfwf4RgFBX4jhEy6Zejrh6uBRJ6RUj8pU5edtKrH4DZAajTvMKBVz6Q-vuGkjG69ISsvjUl2Lp9nIAAjyeDtXSKZVCgVI15pHAzij007ZZ_yLmMQXKwuf7jk-1NBwrRHz6uWsZsVFfd8dPg4tKPpbwGE9ED0FNyvXvHZV6OZiCX5UuLqtGAjm4Uhsq-NSE3aliZcOziTYCe05OSiI6EyuX3lrHxBIppOz5qvWGef9teH8PsfdVzC6o4KImTXNj4',
    specs: [
      { label: 'Engine', value: '155cc VVA' },
      { label: 'Brakes', value: 'Dual Channel ABS' },
    ],
  },
]

const serviceChecks = [
  'Quick Diagnostic Scans',
  'Genuine Yamaha Lube & Parts',
  'Express Lane Service Available',
]

export default function HeroSection({
  isPageLoading,
  activeNav,
  activeSlide,
  currentUser,
  customerName,
  authMode,
  accessProfile,
  authLoading,
  googleLoading,
  authMessage,
  authForm,
  onSelectSlide,
  onOpenAuthPanel,
  onOpenAuthSection,
  onGoogleSignIn,
  onAuthFieldChange,
  onAuthSubmit,
  onNavigateShowroom,
  onNavigateService,
  onNavigateSection,
  onOpenDashboard,
  onSignOut,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [authPasswordVisible, setAuthPasswordVisible] = useState(false)
  const [authConfirmPasswordVisible, setAuthConfirmPasswordVisible] = useState(false)

  const currentHeroImage = useMemo(
    () => heroImages[activeSlide % heroImages.length],
    [activeSlide],
  )

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const accessLabel = accessProfile?.label || 'Customer'
  const dashboardLabel = accessProfile?.label ? `${accessProfile.label} Console` : 'Dashboard'

  const handleNavClick = (event, link) => {
    event.preventDefault()
    setIsMenuOpen(false)

    if (link.id === 'showroom') {
      onNavigateShowroom()
      return
    }

    if (link.id === 'service') {
      onNavigateService()
      return
    }

    onNavigateSection(link.id, link.label)
  }

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-['Manrope']">
      <div
        className={`pointer-events-none fixed inset-0 z-100 flex items-center justify-center bg-[#131313] transition-all duration-500 ${
          isPageLoading ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex flex-col items-center gap-4 rounded-[28px] border border-white/10 bg-white/5 px-8 py-7 text-center shadow-[0_20px_80px_rgba(225,1,0,0.18)] backdrop-blur-xl">
          <img src={bykelinkLogo} alt="Bykelink Motor" className="h-14 w-14 object-contain" />
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#ffb4a8]">BYKELINK</p>
          <p className="text-sm text-zinc-300">Loading the Yamaha experience...</p>
        </div>
      </div>

      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl shadow-2xl shadow-red-900/10">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => onNavigateSection('home', 'Home')}
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

          <div className="hidden items-center gap-3 md:flex">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuthSection('login')}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
                >
                  {customerName}
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-[#e10100] hover:text-white"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuthSection('signup')}
                  className="text-sm font-bold uppercase tracking-tight text-neutral-100 font-['Epilogue']"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateSection('contact', 'Contact')}
                  className="rounded-full bg-[#e10100] px-5 py-2 text-sm font-black uppercase tracking-tight text-white font-['Epilogue'] transition hover:shadow-lg hover:shadow-red-600/20"
                >
                  Inquire
                </button>
              </>
            )}
          </div>

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

              {!currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false)
                    onOpenAuthSection('signup')
                  }}
                  className="rounded-xl bg-[#e10100] px-4 py-3 text-sm font-black uppercase tracking-tight text-white"
                >
                  Sign Up
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false)
                    onSignOut()
                  }}
                  className="rounded-xl bg-white px-4 py-3 text-sm font-black uppercase tracking-tight text-black"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        <section id="home" className="relative flex min-h-screen items-center overflow-hidden pt-20">
          <div className="absolute inset-0">
            <img
              src={currentHeroImage}
              alt="Yamaha superbike hero"
              className="h-full w-full object-cover opacity-60 grayscale brightness-50"
            />
            <div className="absolute inset-0 bg-linear-to-r from-[#131313] via-[#131313]/70 to-transparent" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl" data-reveal="left">
              <span className="mb-4 block text-sm font-extrabold uppercase tracking-[0.35em] text-[#e10100] font-['Epilogue']">
                Authorized Yamaha Excellence
              </span>
              <h1 className="mb-6 text-5xl leading-none font-black tracking-tight text-white font-['Epilogue'] sm:text-6xl lg:text-8xl">
                Ride the Future of <span className="italic text-[#e10100]">Yamaha</span>{' '}
                Excellence
              </h1>
              <p className="mb-8 max-w-2xl text-base font-medium text-neutral-300 sm:text-lg">
                Experience the raw power and precision engineering of Japan's finest
                motorcycles. From urban commuting to racetrack dominance, we bring the Yamaha
                philosophy to your garage.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={onNavigateShowroom}
                  className="rounded-full bg-[linear-gradient(135deg,#e10100_0%,#930100_100%)] px-8 py-4 text-sm font-extrabold uppercase tracking-[0.18em] text-white shadow-xl shadow-red-900/20 transition hover:scale-[1.02] font-['Epilogue']"
                >
                  Explore Showroom
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuthSection('signup')}
                  className="rounded-full border border-white/10 bg-white/10 px-8 py-4 text-sm font-extrabold uppercase tracking-[0.18em] text-white backdrop-blur-md transition hover:bg-white/15 font-['Epilogue']"
                >
                  Book a Test Ride
                </button>
              </div>

              <div className="mt-8 flex items-center gap-3">
                {heroImages.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => onSelectSlide(index)}
                    aria-label={`Show hero ${index + 1}`}
                    className={`h-2.5 rounded-full transition-all ${
                      activeSlide === index ? 'w-10 bg-[#e10100]' : 'w-2.5 bg-white/35'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-10 right-4 hidden gap-10 text-right xl:flex xl:right-8">
            <div>
              <div className="text-5xl font-black text-white font-['Epilogue']">40+</div>
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#ffb4a8]">
                Units Ready
              </div>
            </div>
            <div>
              <div className="text-5xl font-black text-white font-['Epilogue']">1.2k+</div>
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#ffb4a8]">
                Happy Riders
              </div>
            </div>
            <div>
              <div className="text-5xl font-black text-white font-['Epilogue']">4.9/5</div>
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#ffb4a8]">
                Service Rating
              </div>
            </div>
          </div>
        </section>

        <section id="showroom" className="mx-auto max-w-screen-2xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <h2 className="mb-10 text-3xl font-black uppercase tracking-tight text-white font-['Epilogue'] sm:text-4xl">
            Popular Categories
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:auto-rows-[290px]">
            {categories.map((category) => (
              <article
                key={category.title}
                className={`group relative overflow-hidden rounded-2xl ${
                  category.large ? 'md:col-span-2 md:row-span-2' : ''
                }`}
              >
                <img
                  src={category.image}
                  alt={category.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-2xl font-black uppercase text-white font-['Epilogue'] sm:text-3xl">
                    {category.title}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#bee9ff] sm:text-sm">
                    {category.subtitle}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#1c1b1b] py-20 lg:py-24">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white font-['Epilogue'] sm:text-4xl">
                  Featured Models
                </h2>
                <div className="mt-4 h-1 w-20 bg-[#e10100]" />
              </div>
              <button
                type="button"
                onClick={onNavigateShowroom}
                className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-[#ffb4a8] font-['Epilogue']"
              >
                View All Models <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {featuredModels.map((model) => (
                <article
                  key={model.name}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#2a2a2a]"
                >
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={model.image}
                      alt={model.name}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />
                    <div className="absolute right-4 top-4 rounded-full bg-[#e10100] px-3 py-1 text-[10px] font-black uppercase tracking-tight text-white font-['Epilogue']">
                      {model.badge}
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-white font-['Epilogue'] sm:text-3xl">
                          {model.name}
                        </h3>
                        <p className="text-sm text-neutral-300">{model.description}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-2xl font-black text-[#ffb4a8] font-['Epilogue']">
                          {model.price}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-neutral-400">
                          {model.note}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {model.specs.map((spec) => (
                        <div key={spec.label} className="rounded-xl bg-[#353534] px-4 py-3 text-center">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-400">
                            {spec.label}
                          </span>
                          <span className="block text-sm font-black text-white">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="service" className="py-20 lg:py-24">
          <div className="mx-auto grid max-w-screen-2xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2 lg:gap-16 lg:px-8">
            <div className="relative" data-reveal="left">
              <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-[#e10100]/20 blur-3xl" />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAa3ZvD7ILXRdhgV7PpGMefVAXZR4s-CLQgLElKYhGBkp1js5RJuBc0oUH7vdWNROe_OMuK6rtgXOXjA8YlKd3bq2h4FjDZgytxHU7bJyU_5YyHGjW4gGsK72grMkCIvccEoJCNn9NlQ1Y8LJCV4m4pQscsSr8e7EnYURTnS4KNBrIz8BKZuAUdgehAhfkq-qkPbU_3aLR9cm0GFMiuGiOUTyDAb6dRhqk0gvfIaERiiC0PbPZOVa5vxFvJ3Uv1mUmiDaMh-h65GG0"
                alt="Motorcycle workshop"
                className="relative z-10 rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-5 right-0 z-20 rounded-2xl border border-white/10 bg-[#2a2a2a] p-4 sm:-right-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e10100] text-white">
                    <VerifiedRoundedIcon sx={{ fontSize: 20 }} />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase text-white font-['Epilogue']">
                      Genuine Parts
                    </p>
                    <p className="text-xs text-neutral-400">100% Yamaha Guaranteed</p>
                  </div>
                </div>
              </div>
            </div>

            <div data-reveal="right">
              <h2 className="mb-5 text-4xl font-black uppercase leading-tight text-white font-['Epilogue'] sm:text-5xl">
                Authorized <span className="text-[#e10100]">Yamaha</span> Service
              </h2>
              <p className="mb-8 text-base text-neutral-300 sm:text-lg">
                Our master technicians use Yamaha-engineered diagnostics to keep your machine
                performing at its peak. From routine oil changes to major overhauls, trust the
                experts.
              </p>

              <ul className="mb-8 space-y-4">
                {serviceChecks.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white">
                    <CheckCircleRoundedIcon sx={{ fontSize: 20 }} className="text-[#e10100]" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={onNavigateService}
                className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:bg-[#e10100] hover:text-white font-['Epilogue']"
              >
                Schedule Appointment
                <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
        </section>

        <section id="contact" className="bg-[#0e0e0e] py-20 lg:py-24">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[28px] bg-[#1c1b1b] shadow-2xl md:flex">
              <div className="p-8 sm:p-10 lg:w-1/2 lg:p-14">
                <h2 className="mb-8 text-3xl font-black uppercase text-white font-['Epilogue'] sm:text-4xl">
                  Visit Our Showroom
                </h2>

                <div className="space-y-8">
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#ffb4a8] font-['Epilogue']">
                      Flagship Location
                    </h4>
                    <p className="text-lg font-bold text-white sm:text-xl">
                      123 Moto Avenue, Central District, Metro City 4002
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#ffb4a8] font-['Epilogue']">
                        Opening Hours
                      </h4>
                      <p className="text-sm text-neutral-300">Mon - Sat: 9AM - 6PM</p>
                      <p className="text-sm text-neutral-300">Sun: 10AM - 3PM</p>
                    </div>
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#ffb4a8] font-['Epilogue']">
                        Direct Contact
                      </h4>
                      <p className="text-sm text-neutral-300">+63 (2) 8888 9999</p>
                      <p className="text-sm text-neutral-300">sales@bykelink.com</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href="tel:+63288889999"
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 transition hover:border-[#e10100]"
                      aria-label="Call Bykelink"
                    >
                      <CallRoundedIcon sx={{ fontSize: 20 }} className="text-white" />
                    </a>
                    <a
                      href="mailto:sales@bykelink.com"
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 transition hover:border-[#e10100]"
                      aria-label="Email Bykelink"
                    >
                      <MailRoundedIcon sx={{ fontSize: 20 }} className="text-white" />
                    </a>
                    <a
                      href="#about"
                      onClick={(event) => {
                        event.preventDefault()
                        onNavigateSection('about', 'About')
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 transition hover:border-[#e10100]"
                      aria-label="About Bykelink"
                    >
                      <InfoRoundedIcon sx={{ fontSize: 20 }} className="text-white" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="relative min-h-90 lg:w-1/2">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQjl57CRTn4SiBdfFwQt3IAIy_Dku3o8FU06jTL7JIYQHZUUsIAu39pUcr3R3-eAemhy9qRXsI0HplUOF9TdhIFm0B2D_6wIKqnf21D_6utwsBBHq2hTua6D2F_NlwFEW2VllBmcSnhn6i9J_ocvHXC8LWsuy5YZxSTqcXq-671UPoJwK6rzT5wVU6sXrtPqnji5PSBACOa-6NtyaWQMYbHYGdxhCL-VEZU9vRr6VcJP7ia762oGGcjck0stn0aS-EzDLoD-JKurM"
                  alt="Showroom map"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[#e10100]/10 mix-blend-multiply" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-[#e10100] text-white shadow-lg shadow-red-900/30">
                    <LocationOnRoundedIcon sx={{ fontSize: 30 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-20 lg:py-24">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div id="signup" className="relative -top-24" />
            <div id="login" className="relative -top-24" />

            <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
              <div className="rounded-[28px] border border-white/10 bg-[#1c1b1b] p-6 sm:p-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-[#ffb4a8] font-['Epilogue']">
                  Authorized Dealer
                </p>
                <h2 className="mb-4 text-3xl font-black uppercase text-white font-['Epilogue'] sm:text-4xl">
                  Built for riders who expect premium service.
                </h2>
                <p className="mb-6 text-neutral-300">
                  BYKELINK delivers showroom guidance, after-sales support, financing help, and
                  a modern digital experience in one place.
                </p>

                <div className="space-y-3 text-sm text-neutral-200">
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                    <VerifiedRoundedIcon sx={{ fontSize: 18 }} className="text-[#e10100]" />
                    <span>Official Yamaha-backed service and genuine parts</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                    <StorefrontRoundedIcon sx={{ fontSize: 18 }} className="text-[#e10100]" />
                    <span>Showroom assistance for scooters, underbones, and big bikes</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                    <CallRoundedIcon sx={{ fontSize: 18 }} className="text-[#e10100]" />
                    <span>Fast inquiry handling for test rides, promos, and availability</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#1c1b1b] p-6 sm:p-8">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200">
                      <CheckCircleRoundedIcon sx={{ fontSize: 14 }} />
                      Secure Account Setup
                    </div>
                    <h3 className="mt-3 text-2xl font-black text-white font-['Epilogue']">
                      {currentUser
                        ? `Welcome back, ${customerName}`
                        : authMode === 'signup'
                          ? 'Create your secure account'
                          : 'Log in to your account'}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-400">
                      Use Google or email/password to continue. New password accounts now require stronger credentials and email verification before first login.
                    </p>
                  </div>

                  {!currentUser && (
                    <div className="inline-flex rounded-full border border-white/10 bg-[#131313] p-1">
                      <button
                        type="button"
                        onClick={() => onOpenAuthPanel('login', 'customer')}
                        className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] ${
                          authMode === 'login' ? 'bg-white text-black' : 'text-neutral-400'
                        }`}
                      >
                        Login
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAuthPanel('signup', 'customer')}
                        className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] ${
                          authMode === 'signup' ? 'bg-[#e10100] text-white' : 'text-neutral-400'
                        }`}
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>

                {authMessage && (
                  <div
                    className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                      authMessage.type === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-red-500/30 bg-red-500/10 text-red-200'
                    }`}
                  >
                    {authMessage.text}
                  </div>
                )}

                {currentUser ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">
                            Signed in as
                          </p>
                          <p className="mt-2 text-xl font-bold text-white">{customerName}</p>
                          <p className="text-sm text-neutral-300">{currentUser.email}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">
                            Access role
                          </p>
                          <p className="mt-2 inline-flex rounded-full bg-[#e10100]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#ffb4a8]">
                            {accessLabel}
                          </p>
                          <p className="mt-2 text-sm text-neutral-400">
                            Verified via{' '}
                            {accessProfile?.source === 'authorized-admin-collection'
                              ? 'authorizedAdmin collection'
                              : accessProfile?.source === 'cloud-function'
                                ? 'Cloud Functions'
                                : 'local fallback'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {accessProfile?.dashboardPath && (
                        <button
                          type="button"
                          onClick={onOpenDashboard}
                          className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#e10100_0%,#930100_100%)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white font-['Epilogue']"
                        >
                          <VerifiedRoundedIcon sx={{ fontSize: 18 }} />
                          Open {dashboardLabel}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onSignOut}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:bg-[#e10100] hover:text-white font-['Epilogue']"
                      >
                        <LoginRoundedIcon sx={{ fontSize: 18 }} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={onGoogleSignIn}
                      disabled={googleLoading || authLoading}
                      className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#131313] px-5 py-3 text-sm font-bold text-white transition hover:border-[#e10100]/40 hover:bg-white/5 disabled:opacity-70"
                    >
                      <GoogleIcon sx={{ fontSize: 18 }} />
                      {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
                    </button>

                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-neutral-500">
                      <span className="h-px flex-1 bg-white/10" />
                      or use email and password
                      <span className="h-px flex-1 bg-white/10" />
                    </div>

                    <form onSubmit={onAuthSubmit} className="space-y-4">
                      {authMode === 'signup' && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block text-sm text-neutral-200">
                            <span className="mb-2 block">Full name</span>
                            <input
                              type="text"
                              name="fullName"
                              value={authForm.fullName}
                              onChange={onAuthFieldChange}
                              required
                              autoComplete="name"
                              placeholder="Juan Dela Cruz"
                              className="w-full rounded-2xl border border-white/10 bg-[#131313] px-4 py-3 text-white outline-none transition focus:border-[#e10100]"
                            />
                          </label>
                          <label className="block text-sm text-neutral-200">
                            <span className="mb-2 block">Phone number</span>
                            <input
                              type="tel"
                              name="phone"
                              value={authForm.phone}
                              onChange={onAuthFieldChange}
                              autoComplete="tel"
                              placeholder="09xx xxx xxxx"
                              className="w-full rounded-2xl border border-white/10 bg-[#131313] px-4 py-3 text-white outline-none transition focus:border-[#e10100]"
                            />
                          </label>
                        </div>
                      )}

                      <label className="block text-sm text-neutral-200">
                        <span className="mb-2 block">Email address</span>
                        <input
                          type="email"
                          name="email"
                          value={authForm.email}
                          onChange={onAuthFieldChange}
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          className="w-full rounded-2xl border border-white/10 bg-[#131313] px-4 py-3 text-white outline-none transition focus:border-[#e10100]"
                        />
                      </label>

                      <label className="block text-sm text-neutral-200">
                        <span className="mb-2 block">Password</span>
                        <div className="hero-password-input-wrapper">
                          <input
                            type={authPasswordVisible ? 'text' : 'password'}
                            name="password"
                            value={authForm.password}
                            onChange={onAuthFieldChange}
                            required
                            minLength={8}
                            autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                            placeholder="8+ characters with upper, lower, and number"
                            className="w-full rounded-2xl border border-white/10 bg-[#131313] px-4 py-3 text-white outline-none transition focus:border-[#e10100]"
                          />
                          <button
                            type="button"
                            onClick={() => setAuthPasswordVisible(!authPasswordVisible)}
                            className="hero-password-toggle"
                            aria-label={authPasswordVisible ? 'Hide password' : 'Show password'}
                          >
                            {authPasswordVisible ? '○' : '●'}
                          </button>
                        </div>
                      </label>

                      {authMode === 'signup' && (
                        <>
                          <label className="block text-sm text-neutral-200">
                            <span className="mb-2 block">Confirm password</span>
                            <div className="hero-password-input-wrapper">
                              <input
                                type={authConfirmPasswordVisible ? 'text' : 'password'}
                                name="confirmPassword"
                                value={authForm.confirmPassword || ''}
                                onChange={onAuthFieldChange}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                placeholder="Re-enter your password"
                                className="w-full rounded-2xl border border-white/10 bg-[#131313] px-4 py-3 text-white outline-none transition focus:border-[#e10100]"
                              />
                              <button
                                type="button"
                                onClick={() => setAuthConfirmPasswordVisible(!authConfirmPasswordVisible)}
                                className="hero-password-toggle"
                                aria-label={authConfirmPasswordVisible ? 'Hide password' : 'Show password'}
                              >
                                {authConfirmPasswordVisible ? '○' : '●'}
                              </button>
                            </div>
                          </label>

                          <div className="rounded-2xl border border-white/10 bg-[#131313] p-4 text-sm text-neutral-300">
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffb4a8]">
                              Password security checklist
                            </p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
                                    className={`h-2.5 w-2.5 rounded-full ${
                                      item.met ? 'bg-emerald-400' : 'bg-neutral-600'
                                    }`}
                                  />
                                  <span>{item.label}</span>
                                </div>
                              ))}
                            </div>
                            <p className="mt-3 text-xs text-neutral-500">
                              We’ll send a verification email before your first password login is allowed.
                            </p>
                          </div>
                        </>
                      )}

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#e10100_0%,#930100_100%)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white disabled:opacity-70 font-['Epilogue']"
                      >
                        <PersonAddAlt1RoundedIcon sx={{ fontSize: 18 }} />
                        {authLoading
                          ? 'Please wait...'
                          : authMode === 'signup'
                            ? 'Create Secure Account'
                            : 'Login Now'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-neutral-950">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-4 lg:px-8">
          <div className="space-y-4">
            <div className="text-xl font-bold text-neutral-100 font-['Manrope']">BYKELINK</div>
            <p className="text-sm leading-relaxed text-neutral-500">
              The premier destination for Yamaha enthusiasts. We deliver not just motorcycles,
              but a legacy of racing spirit and technical perfection.
            </p>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-neutral-100">
              Models
            </h4>
            <ul className="space-y-3 text-sm text-neutral-500">
              <li>Supersport</li>
              <li>Hyper Naked</li>
              <li>Sport Touring</li>
              <li>Off-Road</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-neutral-100">
              Dealer Info
            </h4>
            <ul className="space-y-3 text-sm text-neutral-500">
              <li>Dealer Careers</li>
              <li>Yamaha Racing</li>
              <li>Find a Store</li>
              <li>News & Events</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-neutral-100">
              Newsletter
            </h4>
            <p className="mb-4 text-sm text-neutral-500">Stay tuned for the latest releases.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your Email"
                className="flex-1 rounded-xl border border-white/10 bg-[#1c1b1b] px-3 py-2 text-sm text-white outline-none focus:border-[#e10100]"
              />
              <button
                type="button"
                className="rounded-xl bg-[#e10100] px-3 text-white"
                aria-label="Send newsletter email"
              >
                <SendRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-3 border-t border-white/10 px-6 py-6 text-center md:flex-row lg:px-8">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
            © 2024 BYKELINK MOTOR INC. AUTHORIZED YAMAHA DEALER.
          </p>
          <div className="flex gap-6 text-xs uppercase tracking-[0.24em] text-neutral-500">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

