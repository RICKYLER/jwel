import { useEffect, useMemo, useState, useRef } from 'react'
import { db } from '../../firebase'
import { collection, query, onSnapshot, orderBy, doc, getDoc, where } from 'firebase/firestore'
import './HeroSection.css'
import bykelinkLogo from '../../assets/bykelinklogo.png'
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
import HelpModal from '../LoginPage/HelpModal'
import { useState as useLocalState } from 'react'

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
  const [helpModalOpen, setHelpModalOpen] = useLocalState(false)
  const [helpModalType, setHelpModalType] = useLocalState(null) // 'privacy' | 'terms'

  const privacyContent = {
    title: 'Privacy Policy',
    sections: [
      { title: 'Data Collection', text: 'We collect information you provide directly, such as name, email, and phone number when creating your account. We also collect information about your interactions with BYKELINK services.' },
      { title: 'Data Usage', text: 'Your information is used to provide and improve our services, process transactions, send communications, and comply with legal obligations.' },
      { title: 'Data Security', text: 'We implement industry-standard security measures to protect your personal information.' },
      { title: 'Third-Party Sharing', text: 'We do not sell or share your personal data with third parties without your consent, except as required by law.' },
    ],
  }

  const termsContent = {
    title: 'Terms of Service',
    sections: [
      { title: 'User Agreement', text: 'By accessing and using BYKELINK, you agree to be bound by these Terms of Service.' },
      { title: 'Account Responsibility', text: 'You are responsible for maintaining the confidentiality of your account and password.' },
      { title: 'Prohibited Activities', text: 'You may not use BYKELINK for unlawful purposes, harassment, fraud, or any activity that violates applicable laws.' },
      { title: 'Limitation of Liability', text: 'BYKELINK is provided on an "as is" basis. We are not liable for indirect or consequential damages.' },
    ],
  }

  const modalContents = { privacy: privacyContent, terms: termsContent }
  const [isLoadingComplete, setIsLoadingComplete] = useState(false)
  const [financingApplications, setFinancingApplications] = useState(0)
  const [servicesCompleted, setServicesCompleted] = useState(0)
  const [serviceRating, setServiceRating] = useState(0)
  const [liveModels, setLiveModels] = useState([])
  const [liveSpareParts, setLiveSpareParts] = useState([])
  const [isModelsLoading, setIsModelsLoading] = useState(true)
  const [isSparePartsLoading, setIsSparePartsLoading] = useState(true)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [currentSparePartsPage, setCurrentSparePartsPage] = useState(0)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

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
        
        if (target === 4.9) {
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

    animateCounter(financingApplications, setFinancingApplications, 2000)
    animateCounter(servicesCompleted, setServicesCompleted, 2000)
    animateCounter(4.9, setServiceRating, 2000)
  }, [isLoadingComplete, financingApplications, servicesCompleted])

  // (Removed) Fetch popular categories — showroom was removed so categories not used

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

  // Fetch completed financing applications count from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'financingApplications'),
      where('status', '==', 'completed')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setFinancingApplications(snapshot.docs.length)
      },
      (error) => {
        console.error('Unable to load financing applications count', error)
        setFinancingApplications(0)
      },
    )

    return () => unsubscribe()
  }, [])

  // Fetch completed services count from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'services'),
      where('status', '==', 'completed')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setServicesCompleted(snapshot.docs.length)
      },
      (error) => {
        console.error('Unable to load services completed count', error)
        setServicesCompleted(0)
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

  // Initialize Google Map with custom marker
  useEffect(() => {
    if (!mapRef.current) return

    // Prevent multiple initializations
    if (mapInstanceRef.current) return

    // Fetch flagship location from Firestore
    const fetchFlagshipLocation = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'flagshipLocation')
        const settingsSnap = await getDoc(settingsRef)
        
        let coordinates = { lat: 7.3086, lng: 125.7399 } // Default fallback
        
        if (settingsSnap.exists()) {
          const data = settingsSnap.data()
          if (data.latitude && data.longitude) {
            coordinates = { lat: data.latitude, lng: data.longitude }
          }
        }
        
        initializeMap(coordinates)
      } catch (error) {
        console.error('Failed to fetch flagship location:', error)
        initializeMap({ lat: 7.3086, lng: 125.7399 })
      }
    }

    const scriptId = 'google-maps-script'
    const existingScript = document.getElementById(scriptId)

    const initializeMap = (coordinates) => {
      // Wait for Google Maps to be ready
      if (!window.google?.maps?.Map) {
        setTimeout(() => initializeMap(coordinates), 100)
        return
      }

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: coordinates,
        disableDefaultUI: false,
        mapTypeId: 'roadmap',
      })

      const marker = new window.google.maps.Marker({
        position: coordinates,
        map: map,
        title: 'Bykelink Flagship Location',
        icon: {
          url: bykelinkLogo,
          scaledSize: new window.google.maps.Size(50, 50),
          origin: new window.google.maps.Point(0, 0),
          anchor: new window.google.maps.Point(25, 50),
        },
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="color: #000; font-weight: bold; font-size: 14px; padding: 8px;">
          <p style="margin: 5px 0; font-size: 14px;">Bykelink Flagship Location</p>
          <p style="margin: 5px 0; font-size: 12px;">National Highway, Visayan Village, Tagum, Davao del Norte</p>
          <p style="margin: 5px 0; font-size: 12px;">Mon-Sat: 9AM - 6PM | Sun: 10AM - 3PM</p>
        </div>`,
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      mapInstanceRef.current = map
    }

    if (existingScript) {
      // Script already in DOM
      fetchFlagshipLocation()
      return
    }

    // Create and load the script
    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyB9lf6IlDnaaWJGOTogJyqheBOO_9q--JI&loading=async'
    script.async = true
    script.defer = true

    script.onload = () => {
      setTimeout(fetchFlagshipLocation, 200)
    }

    script.onerror = () => {
      console.error('Failed to load Google Maps')
      initializeFallbackMap()
    }

    document.head.appendChild(script)

    const initializeFallbackMap = () => {
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #1a1a2e; color: #fff; flex-direction: column;">
            <div style="font-size: 48px; margin-bottom: 16px;">📍</div>
            <p style="font-size: 18px; font-weight: bold; margin: 8px 0;">National Highway</p>
            <p style="font-size: 14px; margin: 4px 0;">Visayan Village, Tagum, Davao del Norte</p>
            <a href="https://maps.google.com/?q=7.3086,125.7399" target="_blank" rel="noopener noreferrer" style="margin-top: 16px; padding: 10px 20px; background: #dc2626; color: white; text-decoration: none; border-radius: 8px; cursor: pointer;">Open in Google Maps</a>
          </div>
        `
      }
    }

    return () => {
      // Cleanup on unmount
    }
  }, [])

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

          <div className="pointer-events-none absolute -left-20 top-14 h-56 w-56 rounded-full bg-red-600/20 blur-3xl sm:h-72 sm:w-72" />
          <div className="pointer-events-none absolute -right-16 bottom-16 h-56 w-56 rounded-full bg-red-500/10 blur-3xl sm:h-72 sm:w-72" />

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
                    className="button button--primary inline-flex items-center justify-center gap-3 px-8 py-3 text-sm font-extrabold uppercase tracking-[0.15em] font-['Epilogue']"
                  >
                    <StorefrontRoundedIcon className="icon-replace" sx={{ fontSize: 18 }} />
                    <span className="wipe">Explore Showroom</span>
                    <ArrowForwardRoundedIcon className="icon-replace" sx={{ fontSize: 16 }} />
                  </button>

                  <button
                    type="button"
                    onClick={onNavigateLogin}
                    className="button button--outline-light inline-flex items-center justify-center gap-3 px-8 py-3 text-sm font-extrabold uppercase tracking-[0.15em] font-['Epilogue']"
                  >
                    <CalendarMonthRoundedIcon className="icon-replace" sx={{ fontSize: 18 }} />
                    <span className="wipe">Book Appointment</span>
                    <ArrowForwardRoundedIcon className="icon-replace" sx={{ fontSize: 16 }} />
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
                        activeSlide === index ? 'w-8 bg-red-600' : 'w-2 bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

            <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3 lg:max-w-4xl">
              <div className="px-5 py-4 text-center">
                <div className="text-3xl font-black text-white font-['Epilogue']">{financingApplications}+</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-white">
                  Financing Applications
                </div>
              </div>
              <div className="px-5 py-4 text-center">
                <div className="text-3xl font-black text-white font-['Epilogue']">{servicesCompleted.toLocaleString()}+</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-white">
                  Services Completed
                </div>
              </div>
              <div className="px-5 py-4 text-center">
                <div className="text-3xl font-black text-white font-['Epilogue']">{serviceRating.toFixed(1)}/5</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-white">
                  Service Rating
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Showroom section removed */}

        <section className="bg-linear-to-b from-slate-900/80 to-slate-900/20 py-20 lg:py-24" data-reveal="up" data-reveal-delay="100">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" data-reveal="up" data-reveal-delay="140">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white font-['Epilogue'] sm:text-4xl">
                  Featured Models
                </h2>
                <div className="mt-4 h-1 w-20 bg-red-600" />
              </div>
              <button
                type="button"
                onClick={onNavigateShowroom}
                className="button button--ghost inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-white font-['Epilogue']"
              >
                <span className="link-underline">View All Models</span>
                <ArrowForwardRoundedIcon className="icon-replace" sx={{ fontSize: 18 }} />
              </button>
            </div>

            <div className="relative w-full overflow-x-hidden" data-reveal="up" data-reveal-delay="180">
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
                  <div className="flex transition-transform duration-700" style={{ transform: `translateX(calc(-${carouselIndex * 100}%))`, width: '100%' }}>
                    {liveModels.map((model, index) => (
                      <div key={model.id || model.name} style={{ flex: '0 0 100%', paddingRight: index === liveModels.length - 1 ? '0' : '1rem' }}>
                  <article
                    className="shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 cursor-pointer transition duration-300 hover:border-red-600 hover:shadow-2xl hover:shadow-red-900/20 h-full"
                    onClick={() => onNavigateShowroom()}
                  >
                    <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 overflow-hidden bg-linear-to-b from-slate-800 to-slate-900 flex items-center justify-center">
                      <img
                        src={model.imageUrl || model.mainImage || model.image || model.motorcycleImage || getPlaceholderImage(model.modelName || model.name, 400, 300)}
                        alt={model.modelName || model.name}
                        className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
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

                      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <div className="rounded-xl bg-slate-800 px-4 py-3 text-center">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-400">
                            Engine
                          </span>
                          <span className="block text-sm font-black text-white">{model.engineCC || model.engine || model.engineSize || model.displacement || model.cc || 'N/A'}</span>
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
                      </div>
                    ))}
                  </div>

                  {/* Carousel navigation buttons */}
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCarouselIndex((prev) => Math.max(0, prev - 1))}
                      className="button button--outline-light rounded-full p-2 text-white"
                      aria-label="Previous model"
                    >
                      <ArrowForwardRoundedIcon className="icon-replace" sx={{ fontSize: 20, transform: 'rotate(180deg)' }} />
                    </button>

                    {liveModels.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCarouselIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          carouselIndex === index ? 'w-6 bg-red-600' : 'w-2 bg-white/35'
                        }`}
                        aria-label={`Go to model ${index + 1}`}
                      />
                    ))}

                    <button
                      type="button"
                      onClick={() => setCarouselIndex((prev) => (prev + 1) % Math.max(1, liveModels.length))}
                      className="button button--outline-light rounded-full p-2 text-white"
                      aria-label="Next model"
                    >
                      <ArrowForwardRoundedIcon className="icon-replace" sx={{ fontSize: 20 }} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Spare Parts Section */}
        <section className="bg-slate-900/50 py-20 lg:py-24" data-reveal="up" data-reveal-delay="120">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" data-reveal="up" data-reveal-delay="160">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white font-['Epilogue'] sm:text-4xl">
                  Genuine Spare Parts
                </h2>
                <div className="mt-4 h-1 w-20 bg-red-600" />
              </div>
              <button
                type="button"
                onClick={onNavigateSpareParts}
                className="button button--ghost inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-white font-['Epilogue']"
              >
                <span className="link-underline">View All Parts</span>
                <ArrowForwardRoundedIcon className="icon-replace" sx={{ fontSize: 18 }} />
              </button>
            </div>

            {(() => {
              const itemsPerPage = 6
              const totalPages = Math.ceil(liveSpareParts.length / itemsPerPage)

              return (
                <>
                  <div className="relative w-full overflow-x-hidden" data-reveal="up" data-reveal-delay="200">
                    {isSparePartsLoading ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-900 p-10 text-center text-white/70">
                        Loading spare parts...
                      </div>
                    ) : liveSpareParts.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-900 p-10 text-center text-white/70">
                        No spare parts available right now.
                      </div>
                    ) : (
                      <div className="flex transition-transform duration-700" style={{ transform: `translateX(calc(-${currentSparePartsPage * 100}%))`, width: '100%' }}>
                        {Array.from({ length: totalPages }).map((_, pageIndex) => (
                          <div key={pageIndex} style={{ flex: '0 0 100%' }}>
                            <div className="grid gap-6 grid-cols-2 lg:grid-cols-3">
                              {liveSpareParts.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).map((part) => (
                                <div
                                  key={part.id}
                                  className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition duration-300 hover:border-red-600 hover:shadow-2xl hover:shadow-red-900/20 cursor-pointer h-full flex flex-col"
                                  onClick={() => onNavigateSpareParts()}
                                >
                                  <div className="relative h-40 overflow-hidden bg-linear-to-b from-slate-800 to-slate-900 flex items-center justify-center">
                                    <img
                                      src={part.imageUrl || part.mainImage || part.image || part.partImage || getPlaceholderImage(part.name || 'Spare Part', 300, 200)}
                                      alt={part.name}
                                      className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                                    />
                                  </div>

                                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                                    <h3 className="text-base font-black text-white font-['Epilogue'] truncate">
                                      {part.name}
                                    </h3>
                                    <p className="mt-1 text-xs text-neutral-400 line-clamp-2 flex-1">{part.description || 'Genuine spare part'}</p>
                                    
                                    <div className="mt-3 flex items-center justify-between">
                                      <span className="text-xs font-bold text-blue-400">{part.price || 'Contact'}</span>
                                      <span className="text-xs font-bold uppercase text-neutral-500">Stock: {part.stockQuantity || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentSparePartsPage((prev) => Math.max(0, prev - 1))}
                        disabled={currentSparePartsPage === 0}
                        className="button button--outline-light rounded-full p-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Previous page"
                      >
                        <ArrowForwardRoundedIcon className="icon-replace" sx={{ fontSize: 20, transform: 'rotate(180deg)' }} />
                      </button>

                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setCurrentSparePartsPage(index)}
                            className={`h-2 rounded-full transition-all ${
                              currentSparePartsPage === index ? 'w-6 bg-red-600' : 'w-2 bg-white/35'
                            }`}
                            aria-label={`Go to page ${index + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setCurrentSparePartsPage((prev) => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentSparePartsPage === totalPages - 1}
                        className="button button--outline-light rounded-full p-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Next page"
                      >
                        <ArrowForwardRoundedIcon className="icon-replace" sx={{ fontSize: 20 }} />
                      </button>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </section>

        <section id="service" className="py-20 lg:py-24" data-reveal="up" data-reveal-delay="120">
          <div className="mx-auto grid max-w-screen-2xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2 lg:gap-16 lg:px-8">
            <div className="relative" data-reveal="left">
              <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-red-600/20 blur-3xl" />
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
                Authorized <span className="text-red-600">Yamaha</span> Service
              </h2>
              <p className="mb-8 text-base text-neutral-300 sm:text-lg">
                Our master technicians use Yamaha-engineered diagnostics to keep your machine
                performing at its peak. From routine oil changes to major overhauls, trust the
                experts.
              </p>

              <ul className="mb-8 space-y-4">
                {serviceChecks.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white">
                    <CheckCircleRoundedIcon sx={{ fontSize: 20 }} className="text-red-600" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={onNavigateLogin}
                className="button button--primary inline-flex items-center gap-3 rounded-full px-7 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition duration-300 active:scale-95 font-['Epilogue']"
              >
                <span className="link-underline">Schedule Appointment</span>
                <CalendarMonthRoundedIcon className="icon-replace" sx={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
        </section>

        <section id="contact" className="bg-[#0e0e0e] py-20 lg:py-24" data-reveal="up" data-reveal-delay="140">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-4xl border border-white/10 bg-slate-900 shadow-2xl md:flex" data-reveal="up" data-reveal-delay="180">
              <div className="p-8 sm:p-10 lg:w-1/2 lg:p-14">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-white font-['Epilogue']">
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
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-white font-['Epilogue']">
                    Flagship Location
                  </h4>
                  <p className="text-lg font-bold leading-snug text-white sm:text-xl">
                    National Highway, Visayan Village, Tagum, 8100 Davao del Norte
                  </p>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-white font-['Epilogue']">
                      Opening Hours
                    </h4>
                    <p className="text-sm text-neutral-200">Mon - Sat: 9AM - 6PM</p>
                    <p className="text-sm text-neutral-200">Sun: 10AM - 3PM</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-white font-['Epilogue']">
                      Direct Contact
                    </h4>
                    <a href="tel:+63288889999" className="block text-sm text-white transition hover:text-red-300">
                      +63 (2) 8888 9999
                    </a>
                    <a href="mailto:sales@bykelink.com" className="block text-sm text-white transition hover:text-red-300">
                      sales@bykelink.com
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="tel:+63288889999"
                    className="button button--primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition duration-300"
                    aria-label="Call Bykelink"
                  >
                    <CallRoundedIcon className="icon-replace" sx={{ fontSize: 16 }} />
                    <span className="link-underline">Call Now</span>
                  </a>
                  <a
                    href="mailto:sales@bykelink.com"
                    className="button button--outline-light inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition duration-300"
                    aria-label="Email Bykelink"
                  >
                    <MailRoundedIcon className="icon-replace" sx={{ fontSize: 16 }} />
                    <span className="link-underline">Send Email</span>
                  </a>
                  <a
                    href="#about"
                    onClick={(event) => {
                      event.preventDefault()
                      onNavigateSection('about', 'About')
                    }}
                    className="button button--outline-light inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition duration-300"
                    aria-label="About Bykelink"
                  >
                    <InfoRoundedIcon className="icon-replace" sx={{ fontSize: 16 }} />
                    <span className="link-underline">Learn More</span>
                  </a>
                </div>
              </div>

              <div className="relative min-h-96 lg:w-1/2 overflow-hidden rounded-2xl">
                <div
                  ref={mapRef}
                  className="h-full w-full"
                  style={{ minHeight: '24rem' }}
                />
                <div className="absolute left-1 top-15 z-10 rounded-2xl border border-white/20 bg-linear-to-br from-white/10 to-white/5 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-black font-['Epilogue']">
                    Main Branch
                  </p>
                  <p className="mt-1 text-sm font-semibold text-black">Tagum, Davao del Norte</p>
                </div>
                <div className="absolute bottom-6 left-1 z-10 rounded-2xl border border-white/20 bg-linear-to-br from-white/10 to-white/5 px-4 py-3 text-right backdrop-blur-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-black font-['Epilogue']">
                    Showroom Hours
                  </p>
                  <p className="mt-1 text-sm text-black">Mon-Sat 9AM-6PM</p>
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
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-white font-['Epilogue']">
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
                      <StorefrontRoundedIcon sx={{ fontSize: 18 }} className="text-red-600" />
                      <span>Showroom assistance for scooters, underbones, and big bikes</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <CallRoundedIcon sx={{ fontSize: 18 }} className="text-red-600" />
                      <span>Fast inquiry handling for test rides, promos, and availability</span>
                    </div>
                  </div>
                </div>

                <aside className="rounded-3xl border border-white/10 bg-linear-to-b from-slate-800 to-slate-900 p-5">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-white font-['Epilogue']">
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
                      className="button button--primary mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white transition duration-300"
                    >
                      <span className="link-underline">Book a Service</span>
                      <CalendarMonthRoundedIcon className="icon-replace" sx={{ fontSize: 16 }} />
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
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="link-underline">Supersport</a></li>
              <li><a href="#" className="link-underline">Hyper Naked</a></li>
              <li><a href="#" className="link-underline">Sport Touring</a></li>
              <li><a href="#" className="link-underline">Off-Road</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-neutral-100">
              Dealer Info
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="link-underline">Dealer Careers</a></li>
              <li><a href="#" className="link-underline">Yamaha Racing</a></li>
              <li><a href="#" className="link-underline">Find a Store</a></li>
              <li><a href="#" className="link-underline">News & Events</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-neutral-100">
              Newsletter
            </h4>
            <p className="mb-4 text-sm text-slate-400">Stay tuned for the latest releases.</p>
            <p className="text-xs uppercase tracking-[0.22em] text-white">Yamaha Dealer Since 2026</p>
          </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-3 border-t border-white/10 px-6 py-6 text-center md:flex-row lg:px-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            © 2026 BYKELINK MOTOR INC. AUTHORIZED YAMAHA DEALER.
          </p>
          <div className="flex gap-6 text-xs uppercase tracking-[0.24em]">
            <a
              href="#"
              className="link-underline"
              onClick={(e) => { e.preventDefault(); setHelpModalType('privacy'); setHelpModalOpen(true); }}
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="link-underline"
              onClick={(e) => { e.preventDefault(); setHelpModalType('terms'); setHelpModalOpen(true); }}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
      
      <ChatBox currentUser={currentUser} />
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} content={modalContents[helpModalType]} />
      </div>
    </div>
  )
}

