import { useEffect, useMemo, useState } from 'react'
import { db } from '../../firebase'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import BuildRoundedIcon from '@mui/icons-material/BuildRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import CallRoundedIcon from '@mui/icons-material/CallRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import GoogleIcon from '@mui/icons-material/Google'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import MailRoundedIcon from '@mui/icons-material/MailRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import GlobalLoadingScreen from '../../components/GlobalLoadingScreen'
import ChatBox from '../../components/ChatBox'
import NavHeader from '../../components/NavHeader'

const navLinks = [
  { label: 'Home', href: '/#home', id: 'home', icon: HomeRoundedIcon },
  { label: 'Showroom', href: '/showroom', id: 'showroom', icon: StorefrontRoundedIcon },
  { label: 'Spare Parts', href: '/spare-parts', id: 'spare-parts', icon: StorefrontRoundedIcon },
  { label: 'About', href: '/#about', id: 'about', icon: InfoRoundedIcon },
  { label: 'Contact', href: '/#contact', id: 'contact', icon: CallRoundedIcon },
]

const heroImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDUXTztadQnPhgfPr6AAAzKnk9R4V-FusbLlr-opEiMM2xiC_7NLm_ZSIW_UcKiwm6RndIZIOm8EvIQo3MSSU7XXB8jJO1HU34CJBGDxZWAW5uFAysL1sO8KxAombPTzwYBmDpEgsYU-PVLjn_Hg_JgEsQU9AUT0YEq5s5USKEICdy8Fo8Yh-iPQJC7Pi7qtV_ql9hTM3INKbyaoW6FlR6g-15KQgJF4lQxehfuY50rPySLu-21iL0vE4gMmMEcOAywT87CYWch9X4',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAWPZ6eH2GpP5vf76ITwW-sqFmRkBQUaOylfPb0O6fhAZtPX7QAVnv1nv0Z5R3DGX5sGy2o1PTzK9pMt_bBVNfXCRqiLmLhosIqxqPThr3cvo8ibfGY8mQ3uGl9JxWOVqS47S6VqypBiyFG85q6j7S4nDX_Qf4yHPIqJsamPOdABLRFx73XfqdjHSG51ty1ZIyplF3qNd9N30nVel8tE_nXn4C4LCjY-8SnDQ2c4UKPluczqIj1KgvPL4cCnafqEYAYAZAHfyUcydo',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDPFwSe3L1EylQOxfwf4RgFBX4jhEy6Zejrh6uBRJ6RUj8pU5edtKrH4DZAajTvMKBVz6Q-vuGkjG69ISsvjUl2Lp9nIAAjyeDtXSKZVCgVI15pHAzij007ZZ_yLmMQXKwuf7jk-1NBwrRHz6uWsZsVFfd8dPg4tKPpbwGE9ED0FNyvXvHZV6OZiCX5UuLqtGAjm4Uhsq-NSE3aliZcOziTYCe05OSiI6EyuX3lrHxBIppOz5qvWGef9teH8PsfdVzC6o4KImTXNj4',
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
  onSelectSlide,
  onOpenAuthSection,
  onNavigateShowroom,
  onNavigateSpareParts,
  onNavigateLogin,
  onNavigateSection,
  onSignOut,
}) {
  const [isLoadingComplete, setIsLoadingComplete] = useState(false)
  const [unitsReady, setUnitsReady] = useState(0)
  const [happyRiders, setHappyRiders] = useState(0)
  const [serviceRating, setServiceRating] = useState(0)
  const [liveCategories, setLiveCategories] = useState([])
  const [liveModels, setLiveModels] = useState([])
  const [liveSpareParts, setLiveSpareParts] = useState([])
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)
  const [isModelsLoading, setIsModelsLoading] = useState(true)
  const [isSparePartsLoading, setIsSparePartsLoading] = useState(true)
  const [carouselIndex, setCarouselIndex] = useState(0)

  // Generate SVG placeholder image
  const getPlaceholderImage = (text, width = 400, height = 300) => {
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#666" text-anchor="middle" dominant-baseline="middle">
        ${text}
      </text>
    </svg>`
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  const currentHeroImage = useMemo(
    () => heroImages[activeSlide % heroImages.length],
    [activeSlide],
  )

  useEffect(() => {
    const revealElements = document.querySelectorAll('[data-reveal]')
    if (revealElements.length === 0) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealElements.forEach((node) => {
        node.style.transitionDelay = '0ms'
        node.classList.add('reveal-visible')
      })
      return
    }

    revealElements.forEach((node) => {
      const delay = Number(node.dataset.revealDelay || 0)
      node.style.transitionDelay = `${delay}ms`
    })

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible')
            revealObserver.unobserve(entry.target)
          }
        })
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.2 },
    )

    revealElements.forEach((node) => revealObserver.observe(node))

    return () => revealObserver.disconnect()
  }, [isLoadingComplete])

  // Animate counters when page loading completes
  useEffect(() => {
    if (!isLoadingComplete) return

    const animateCounter = (target, setter, duration = 2000) => {
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        if (target === 1200) {
          setter(Math.floor(progress * target))
        } else if (target === 4.9) {
          setter(Math.round(progress * target * 10) / 10)
        } else {
          setter(Math.floor(progress * target))
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      animate()
    }

    animateCounter(40, setUnitsReady)
    animateCounter(1200, setHappyRiders)
    animateCounter(4.9, setServiceRating)
  }, [isLoadingComplete])

  // Fetch popular categories with highest stock items
  useEffect(() => {
    const q = query(
      collection(db, 'inventory'),
      orderBy('stockQuantity', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const inventoryItems = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const categoryMap = new Map()
        inventoryItems.forEach((item) => {
          const categoryName = item.category || item.name || 'Unknown'
          if (!categoryMap.has(categoryName) || (item.stockQuantity || 0) > (categoryMap.get(categoryName).stockQuantity || 0)) {
            categoryMap.set(categoryName, item)
          }
        })

        const categoriesWithHighestStock = Array.from(categoryMap.values()).slice(0, 6)
        setLiveCategories(categoriesWithHighestStock)
        setIsCategoriesLoading(false)
      },
      (error) => {
        console.error('Unable to load hero categories', error)
        setLiveCategories([])
        setIsCategoriesLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  // Fetch featured models (motorcycle units only) from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'inventory'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((item) => {
            const isMotoUnit = item.category === 'Motorcycle Units' || item.itemType === 'Motorcycle Units' || item.type === 'Motorcycle'
            const hasName = item.modelName || item.name
            return isMotoUnit && hasName
          })
          .slice(0, 10)
        setLiveModels(data)
        setIsModelsLoading(false)
      },
      (error) => {
        console.error('Unable to load hero featured models', error)
        setLiveModels([])
        setIsModelsLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  // Fetch spare parts from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'inventory'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((item) => item.category === 'Spare Parts')
        setLiveSpareParts(data.slice(0, 8))
        setIsSparePartsLoading(false)
      },
      (error) => {
        console.error('Unable to load hero spare parts', error)
        setLiveSpareParts([])
        setIsSparePartsLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    if (liveModels.length === 0) return

    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % Math.max(1, liveModels.length))
    }, 5000)

    return () => clearInterval(interval)
  }, [liveModels.length])

  const handleNavClick = (link) => {
    if (link.id === 'showroom') {
      onNavigateShowroom()
      return
    }

    if (link.id === 'spare-parts') {
      onNavigateSpareParts()
      return
    }

    onNavigateSection(link.id, link.label)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-[#e5e2e1] font-['Manrope']">
      <style>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
          will-change: opacity, transform;
        }

        [data-reveal="left"] {
          transform: translateX(-24px);
        }

        [data-reveal="right"] {
          transform: translateX(24px);
        }

        [data-reveal].reveal-visible {
          opacity: 1;
          transform: translate(0, 0);
        }

        @media (prefers-reduced-motion: reduce) {
          [data-reveal] {
            transition: none;
          }
        }
      `}</style>

      {isPageLoading && (
        <GlobalLoadingScreen
          role="Yamaha Experience"
          delay={200}
          onComplete={() => setIsLoadingComplete(true)}
        />
      )}

      <div className={`transition-opacity duration-500 ${isPageLoading && !isLoadingComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <NavHeader
          currentUser={currentUser}
          customerName={customerName}
          activeNav={activeNav}
          navLinks={navLinks}
          onLogoClick={() => onNavigateSection('home', 'Home')}
          onNavigateClick={handleNavClick}
          onUserMenuClick={() => onOpenAuthSection('login')}
          onSignOut={onSignOut}
          onAuthClick={onNavigateLogin}
        />

      <main>
        <section id="home" className="relative overflow-x-hidden pt-28 pb-14 sm:pt-32 lg:pt-28 lg:pb-20" data-reveal-delay="40">
          <div className="absolute inset-0">
            <img
              src={currentHeroImage}
              alt="Yamaha superbike hero"
              className="h-full w-full object-cover opacity-60 grayscale brightness-50"
            />
            <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/75 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-transparent to-blue-500/10" />
          </div>

          <div className="pointer-events-none absolute -left-20 top-14 h-56 w-56 rounded-full bg-blue-600/20 blur-3xl sm:h-72 sm:w-72" />
          <div className="pointer-events-none absolute -right-16 bottom-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl sm:h-72 sm:w-72" />

          <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-start gap-6 xl:gap-10">
              <div className="max-w-4xl" data-reveal="left">
                <span className="mb-6 block text-xs font-extrabold uppercase tracking-[0.35em] text-red-600 font-['Epilogue']">
                  Authorized Yamaha Excellence
                </span>
                <h1 className="mb-6 text-5xl leading-[1.1] font-black tracking-tight text-white font-['Epilogue'] sm:text-6xl lg:text-7xl xl:text-8xl">
                  Ride the Future<br />
                  of <span className="text-red-600">Yamaha</span><br />
                  Excellence
                </h1>
                <p className="mb-10 max-w-2xl text-sm font-medium text-neutral-300 sm:text-base lg:text-lg">
                  Experience the raw power and precision engineering of Japan's finest motorcycles. From urban commuting to racetrack dominance, we bring the Yamaha philosophy to your garage.
                </p>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={onNavigateShowroom}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-8 py-3 text-sm font-extrabold uppercase tracking-[0.15em] text-white shadow-lg shadow-blue-600/30 transition duration-300 hover:scale-[1.02] active:scale-95 font-['Epilogue']"
                  >
                    Explore Showroom
                    <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateLogin}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/50 bg-transparent px-8 py-3 text-sm font-extrabold uppercase tracking-[0.15em] text-white transition duration-300 hover:border-white hover:bg-white/10 font-['Epilogue']"
                  >
                    Book Appointment
                  </button>
                </div>

                <div className="mt-8 flex items-center gap-2">
                  {heroImages.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => onSelectSlide(index)}
                      aria-label={`Show hero ${index + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        activeSlide === index ? 'w-8 bg-blue-600' : 'w-2 bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

            <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3 lg:max-w-4xl">
              <div className="px-5 py-4 text-center">
                <div className="text-3xl font-black text-white font-['Epilogue']">{unitsReady}+</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300">
                  Units Ready
                </div>
              </div>
              <div className="px-5 py-4 text-center">
                <div className="text-3xl font-black text-white font-['Epilogue']">{happyRiders.toLocaleString()}+</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300">
                  Happy Riders
                </div>
              </div>
              <div className="px-5 py-4 text-center">
                <div className="text-3xl font-black text-white font-['Epilogue']">{serviceRating.toFixed(1)}/5</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300">
                  Service Rating
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        <section id="showroom" className="mx-auto max-w-screen-2xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24" data-reveal="up" data-reveal-delay="80">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" data-reveal="up" data-reveal-delay="120">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-300 font-['Epilogue']">
                Curated For Riders
              </p>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white font-['Epilogue'] sm:text-4xl">
                Popular Categories
              </h2>
            </div>
            <button
              type="button"
              onClick={onNavigateShowroom}
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-cyan-300 font-['Epilogue']"
            >
              Browse Showroom <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
            </button>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md sm:p-6" data-reveal="up" data-reveal-delay="160">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:auto-rows-[290px]">
            {isCategoriesLoading ? (
              <div className="md:col-span-3 rounded-2xl border border-white/10 bg-slate-900 p-8 text-center text-white/70">
                Loading live categories...
              </div>
            ) : liveCategories.length === 0 ? (
              <div className="md:col-span-3 rounded-2xl border border-white/10 bg-slate-900 p-8 text-center text-white/70">
                No live categories available right now.
              </div>
            ) : liveCategories.map((category, index) => (
              <article
                key={category.id || category.title || category.name}
                className={`group relative overflow-hidden rounded-2xl cursor-pointer ${
                  category.featured || index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                }`}
                onClick={() => onNavigateShowroom()}
              >
                <img
                  src={category.imageUrl || category.image || category.mainImage || category.categoryImage || getPlaceholderImage(category.category || category.name || category.title, 500, 400)}
                  alt={category.category || category.name || category.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-2xl font-black uppercase text-white font-['Epilogue'] sm:text-3xl">
                    {category.category || category.name || category.title}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#bee9ff] sm:text-sm">
                    {category.name || category.description || category.subtitle || 'Premium Selection'}
                  </p>
                </div>
              </article>
            ))}
            </div>
          </div>
        </section>

        <section className="bg-linear-to-b from-slate-900/80 to-slate-900/20 py-20 lg:py-24" data-reveal="up" data-reveal-delay="100">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" data-reveal="up" data-reveal-delay="140">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white font-['Epilogue'] sm:text-4xl">
                  Featured Models
                </h2>
                <div className="mt-4 h-1 w-20 bg-blue-600" />
              </div>
              <button
                type="button"
                onClick={onNavigateShowroom}
                className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-cyan-300 font-['Epilogue']"
              >
                View All Models <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>

            <div className="relative overflow-hidden -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" data-reveal="up" data-reveal-delay="180">
              {isModelsLoading ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900 p-10 text-center text-white/70">
                  Loading featured models...
                </div>
              ) : liveModels.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900 p-10 text-center text-white/70">
                  No live featured models available right now.
                </div>
              ) : (
                <>
                  <div className="flex gap-8 transition-transform duration-700"
                    style={{
                      transform: `translateX(calc(-${carouselIndex * 100}% - ${carouselIndex * 2}rem))`,
                    }}
                  >
                    {liveModels.map((model) => (
                  <article
                    key={model.id || model.name}
                    className="w-full md:w-1/2 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 cursor-pointer transition duration-300 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-900/20"
                    onClick={() => onNavigateShowroom()}
                  >
                    <div className="relative h-80 overflow-hidden">
                      <img
                        src={model.imageUrl || model.mainImage || model.image || model.motorcycleImage || getPlaceholderImage(model.modelName || model.name, 400, 300)}
                        alt={model.modelName || model.name}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                      <div className="absolute right-4 top-4 rounded-full bg-blue-500 px-3 py-1 text-[10px] font-black uppercase tracking-tight text-white font-['Epilogue']">
                        {model.series || 'Premium'}
                      </div>
                    </div>

                    <div className="p-6 sm:p-8">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-2xl font-black text-white font-['Epilogue'] sm:text-3xl">
                            {model.modelName || model.name}
                          </h3>
                          <p className="text-sm text-neutral-300">{model.variant || model.description || 'Premium motorcycle'}</p>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-800 px-4 py-3 text-center">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-400">
                            Engine
                          </span>
                          <span className="block text-sm font-black text-white">{model.engineCC || model.engine || 'N/A'}</span>
                        </div>
                        <div className="rounded-xl bg-slate-800 px-4 py-3 text-center">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-400">
                            Stock
                          </span>
                          <span className="block text-sm font-black text-white">{model.stockQuantity || model.stock || 0}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                    ))}
                  </div>

                  {/* Carousel navigation buttons */}
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCarouselIndex((prev) => Math.max(0, prev - 1))}
                      className="rounded-full border border-white/20 p-2 text-white transition duration-300 hover:border-blue-600 hover:text-blue-600"
                      aria-label="Previous model"
                    >
                      <ArrowForwardRoundedIcon sx={{ fontSize: 20, transform: 'rotate(180deg)' }} />
                    </button>

                    {liveModels.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCarouselIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          carouselIndex === index ? 'w-6 bg-blue-600' : 'w-2 bg-white/35'
                        }`}
                        aria-label={`Go to model ${index + 1}`}
                      />
                    ))}

                    <button
                      type="button"
                      onClick={() => setCarouselIndex((prev) => (prev + 1) % Math.max(1, liveModels.length))}
                      className="rounded-full border border-white/20 p-2 text-white transition duration-300 hover:border-blue-600 hover:text-blue-600"
                      aria-label="Next model"
                    >
                      <ArrowForwardRoundedIcon sx={{ fontSize: 20 }} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Spare Parts Section */}
        {!isSparePartsLoading && liveSpareParts.length > 0 && (
          <section className="bg-slate-900/50 py-20 lg:py-24" data-reveal="up" data-reveal-delay="120">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
              <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" data-reveal="up" data-reveal-delay="160">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white font-['Epilogue'] sm:text-4xl">
                    Genuine Spare Parts
                  </h2>
                  <div className="mt-4 h-1 w-20 bg-blue-600" />
                </div>
                <button
                  type="button"
                  onClick={onNavigateSpareParts}
                  className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-cyan-300 font-['Epilogue']"
                >
                  View All Parts <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" data-reveal="up" data-reveal-delay="200">
                {liveSpareParts.map((part) => (
                  <div
                    key={part.id}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition duration-300 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-900/20 cursor-pointer"
                    onClick={() => onNavigateSpareParts()}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={part.imageUrl || part.mainImage || part.image || part.partImage || getPlaceholderImage(part.name || 'Spare Part', 300, 200)}
                        alt={part.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-4 sm:p-5">
                      <h3 className="text-lg font-black text-white font-['Epilogue'] truncate">
                        {part.name}
                      </h3>
                      <p className="mt-2 text-xs text-neutral-400 line-clamp-2">{part.description || 'Genuine spare part'}</p>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-bold text-blue-400">{part.price || 'Contact'}</span>
                        <span className="text-xs font-bold uppercase text-neutral-500">Stock: {part.stockQuantity || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="service" className="py-20 lg:py-24" data-reveal="up" data-reveal-delay="120">
          <div className="mx-auto grid max-w-screen-2xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2 lg:gap-16 lg:px-8">
            <div className="relative" data-reveal="left">
              <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-blue-600/20 blur-3xl" />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAa3ZvD7ILXRdhgV7PpGMefVAXZR4s-CLQgLElKYhGBkp1js5RJuBc0oUH7vdWNROe_OMuK6rtgXOXjA8YlKd3bq2h4FjDZgytxHU7bJyU_5YyHGjW4gGsK72grMkCIvccEoJCNn9NlQ1Y8LJCV4m4pQscsSr8e7EnYURTnS4KNBrIz8BKZuAUdgehAhfkq-qkPbU_3aLR9cm0GFMiuGiOUTyDAb6dRhqk0gvfIaERiiC0PbPZOVa5vxFvJ3Uv1mUmiDaMh-h65GG0"
                alt="Motorcycle workshop"
                className="relative z-10 rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-5 right-0 z-20 rounded-2xl border border-white/10 bg-slate-900 p-4 sm:-right-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-white">
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
                Authorized <span className="text-[#2563eb]">Yamaha</span> Service
              </h2>
              <p className="mb-8 text-base text-neutral-300 sm:text-lg">
                Our master technicians use Yamaha-engineered diagnostics to keep your machine
                performing at its peak. From routine oil changes to major overhauls, trust the
                experts.
              </p>

              <ul className="mb-8 space-y-4">
                {serviceChecks.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white">
                    <CheckCircleRoundedIcon sx={{ fontSize: 20 }} className="text-[#2563eb]" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={onNavigateLogin}
                className="inline-flex items-center gap-3 rounded-full bg-linear-to-r from-blue-600 to-cyan-600 px-7 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition duration-300 hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95 font-['Epilogue']"
              >
                Schedule Appointment
                <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
        </section>

        <section id="contact" className="bg-[#0e0e0e] py-20 lg:py-24" data-reveal="up" data-reveal-delay="140">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-4xl border border-white/10 bg-slate-900 shadow-2xl md:flex" data-reveal="up" data-reveal-delay="180">
              <div className="p-8 sm:p-10 lg:w-1/2 lg:p-14">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-cyan-300 font-['Epilogue']">
                  Dealer Experience Center
                </p>
                <h2 className="mb-5 text-3xl font-black uppercase text-white font-['Epilogue'] sm:text-4xl">
                  Visit Our Showroom
                </h2>
                <p className="mb-8 max-w-xl text-sm text-slate-300 sm:text-base">
                  Drop by our flagship branch for test-ride assistance, inventory walk-through,
                  and financing guidance from our showroom team.
                </p>

                <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-300 font-['Epilogue']">
                    Flagship Location
                  </h4>
                  <p className="text-lg font-bold leading-snug text-white sm:text-xl">
                    National Highway, Visayan Village, Tagum, 8100 Davao del Norte
                  </p>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-300 font-['Epilogue']">
                      Opening Hours
                    </h4>
                    <p className="text-sm text-neutral-200">Mon - Sat: 9AM - 6PM</p>
                    <p className="text-sm text-neutral-200">Sun: 10AM - 3PM</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-300 font-['Epilogue']">
                      Direct Contact
                    </h4>
                    <a href="tel:+63288889999" className="block text-sm text-white transition hover:text-cyan-300">
                      +63 (2) 8888 9999
                    </a>
                    <a href="mailto:sales@bykelink.com" className="block text-sm text-white transition hover:text-cyan-300">
                      sales@bykelink.com
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="tel:+63288889999"
                    className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-blue-600 to-cyan-600 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition duration-300 hover:from-blue-700 hover:to-cyan-700"
                    aria-label="Call Bykelink"
                  >
                    <CallRoundedIcon sx={{ fontSize: 16 }} />
                    Call Now
                  </a>
                  <a
                    href="mailto:sales@bykelink.com"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition duration-300 hover:border-blue-600 hover:text-blue-300"
                    aria-label="Email Bykelink"
                  >
                    <MailRoundedIcon sx={{ fontSize: 16 }} />
                    Send Email
                  </a>
                  <a
                    href="#about"
                    onClick={(event) => {
                      event.preventDefault()
                      onNavigateSection('about', 'About')
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition duration-300 hover:border-blue-600 hover:text-blue-300"
                    aria-label="About Bykelink"
                  >
                    <InfoRoundedIcon sx={{ fontSize: 16 }} />
                    Learn More
                  </a>
                </div>
              </div>

              <div className="relative min-h-96 lg:w-1/2">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQjl57CRTn4SiBdfFwQt3IAIy_Dku3o8FU06jTL7JIYQHZUUsIAu39pUcr3R3-eAemhy9qRXsI0HplUOF9TdhIFm0B2D_6wIKqnf21D_6utwsBBHq2hTua6D2F_NlwFEW2VllBmcSnhn6i9J_ocvHXC8LWsuy5YZxSTqcXq-671UPoJwK6rzT5wVU6sXrtPqnji5PSBACOa-6NtyaWQMYbHYGdxhCL-VEZU9vRr6VcJP7ia762oGGcjck0stn0aS-EzDLoD-JKurM"
                  alt="Showroom map"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/55 via-transparent to-blue-500/10" />
                <div className="absolute left-6 top-6 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-md">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300 font-['Epilogue']">
                    Main Branch
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">Tagum, Davao del Norte</p>
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/30">
                    <LocationOnRoundedIcon sx={{ fontSize: 30 }} />
                  </div>
                </div>
                <div className="absolute bottom-6 right-6 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-right backdrop-blur-md">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300 font-['Epilogue']">
                    Showroom Hours
                  </p>
                  <p className="mt-1 text-sm text-white">Mon-Sat 9AM-6PM</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="pt-20 pb-24 lg:pt-24 lg:pb-28" data-reveal="up" data-reveal-delay="160">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-4xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl sm:p-8 lg:p-10" data-reveal="up" data-reveal-delay="200">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-cyan-300 font-['Epilogue']">
                    Authorized Dealer
                  </p>
                  <h2 className="mb-4 text-3xl font-black uppercase text-white font-['Epilogue'] sm:text-4xl lg:text-5xl">
                    Built for riders who expect premium service.
                  </h2>
                  <p className="mb-6 max-w-3xl text-neutral-300 sm:text-lg">
                    BYKELINK delivers showroom guidance, after-sales support, financing help, and
                    a modern digital experience in one place.
                  </p>

                  <div className="space-y-3 text-sm text-neutral-200 sm:text-base">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <VerifiedRoundedIcon sx={{ fontSize: 18 }} className="text-green-500" />
                      <span>Official Yamaha-backed service and genuine parts</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <StorefrontRoundedIcon sx={{ fontSize: 18 }} className="text-blue-500" />
                      <span>Showroom assistance for scooters, underbones, and big bikes</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <CallRoundedIcon sx={{ fontSize: 18 }} className="text-cyan-500" />
                      <span>Fast inquiry handling for test rides, promos, and availability</span>
                    </div>
                  </div>
                </div>

                <aside className="rounded-3xl border border-white/10 bg-linear-to-b from-slate-800 to-slate-900 p-5">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-cyan-300 font-['Epilogue']">
                    Brand Promise
                  </p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-3xl font-black text-white font-['Epilogue']">20+</p>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Years in Service</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-white font-['Epilogue']">100%</p>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Genuine Parts</p>
                    </div>
                    <button
                      type="button"
                      onClick={onNavigateLogin}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white transition duration-300 hover:from-blue-700 hover:to-cyan-700"
                    >
                      Book a Service
                      <CalendarMonthRoundedIcon sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-neutral-950" data-reveal="up" data-reveal-delay="100">
        <div className="mx-auto max-w-screen-2xl px-6 py-14 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between" data-reveal="up" data-reveal-delay="160">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300 font-['Epilogue']">Stay Connected</p>
              <p className="mt-2 text-sm text-slate-300">Get updates on new models, promos, and service advisories.</p>
            </div>
            <div className="flex w-full max-w-md gap-2">
              <input
                type="email"
                placeholder="Your Email"
                className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-[#2563eb]"
              />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-[#2563eb] px-4 text-white transition hover:bg-blue-600"
                aria-label="Send newsletter email"
              >
                <SendRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-4" data-reveal="up" data-reveal-delay="210">
          <div className="space-y-4">
            <div className="text-2xl font-black text-neutral-100 font-['Epilogue']">BYKELINK</div>
            <p className="text-sm leading-relaxed text-slate-400">
              The premier destination for Yamaha enthusiasts. We deliver not just motorcycles,
              but a legacy of racing spirit and technical perfection.
            </p>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-neutral-100">
              Models
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="transition hover:text-white">Supersport</a></li>
              <li><a href="#" className="transition hover:text-white">Hyper Naked</a></li>
              <li><a href="#" className="transition hover:text-white">Sport Touring</a></li>
              <li><a href="#" className="transition hover:text-white">Off-Road</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-neutral-100">
              Dealer Info
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="transition hover:text-white">Dealer Careers</a></li>
              <li><a href="#" className="transition hover:text-white">Yamaha Racing</a></li>
              <li><a href="#" className="transition hover:text-white">Find a Store</a></li>
              <li><a href="#" className="transition hover:text-white">News & Events</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-neutral-100">
              Newsletter
            </h4>
            <p className="mb-4 text-sm text-slate-400">Stay tuned for the latest releases.</p>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Yamaha Dealer Since 2026</p>
          </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-3 border-t border-white/10 px-6 py-6 text-center md:flex-row lg:px-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            © 2026 BYKELINK MOTOR INC. AUTHORIZED YAMAHA DEALER.
          </p>
          <div className="flex gap-6 text-xs uppercase tracking-[0.24em] text-slate-400">
            <a href="#" className="transition hover:text-white">Privacy Policy</a>
            <a href="#" className="transition hover:text-white">Terms of Service</a>
          </div>
        </div>
      </footer>
      
      <ChatBox currentUser={currentUser} />
      </div>
    </div>
  )
}

