import { useEffect, useMemo, useState } from 'react'
import { collection, limit, onSnapshot, query } from 'firebase/firestore'
import CallRoundedIcon from '@mui/icons-material/CallRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import MailRoundedIcon from '@mui/icons-material/MailRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded'
import bykelinkLogo from '../../assets/bykelinklogo.png'
import { db } from '../../firebase'

const showroomLinks = [
  { label: 'Home', href: '/#home', id: 'home' },
  { label: 'Showroom', href: '/showroom', id: 'showroom', active: true },
  { label: 'Service', href: '/service', id: 'service' },
  { label: 'About', href: '/#about', id: 'about' },
  { label: 'Contact', href: '/#contact', id: 'contact' },
]

const formatPrice = (value) => {
  const amount = Number(value || 0)

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

const parseColorOptions = (value) => {
  if (Array.isArray(value) && value.length) {
    return value.map((item) => ({
      name: item.name || item,
      swatch: item.swatch || 'bg-neutral-700',
    }))
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name) => ({ name, swatch: 'bg-neutral-700' }))
  }

  return [
    { name: 'Signature Black', swatch: 'bg-neutral-900' },
    { name: 'Velocity Red', swatch: 'bg-red-700' },
    { name: 'Metallic Gray', swatch: 'bg-zinc-500' },
  ]
}

const mapInventoryToShowroomModel = (item) => {
  const gallery = Array.isArray(item.gallery) && item.gallery.filter(Boolean).length
    ? item.gallery.filter(Boolean)
    : item.imageUrl
      ? [item.imageUrl]
      : [bykelinkLogo]

  return {
    id: item.id,
    name: String(item.name || 'Inventory Item').toUpperCase(),
    label: item.name || 'Inventory Item',
    badge: item.badge || item.category || 'Showroom Ready',
    description:
      item.description ||
      'Live inventory data from Bykelink. This item is available directly from the current showroom stock feed.',
    price: `SRP ${formatPrice(item.price ?? 0)}`,
    accent: item.status || 'Available Now',
    cardPrice: formatPrice(item.price ?? 0),
    gallery,
    colors: parseColorOptions(item.colors),
    specs: [
      { label: 'Category', value: item.category || 'General' },
      { label: 'Stock', value: `${item.stock ?? 0} units` },
      { label: 'Status', value: item.status || 'In Stock' },
      { label: 'SKU', value: String(item.sku || item.id || 'INV-ITEM').slice(0, 10).toUpperCase() },
    ],
  }
}

export default function ShowroomPage({ onNavigateHome, onNavigateSection, onNavigateService, onOpenSignup }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [inventoryModels, setInventoryModels] = useState([])
  const [isInventoryLoading, setIsInventoryLoading] = useState(true)
  const [selectedModelId, setSelectedModelId] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [activeColor, setActiveColor] = useState(0)
  const [bookingForm, setBookingForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'inventory'), limit(40)),
      (snapshot) => {
        const nextItems = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item) => item.showInShowroom !== false && item.publishedToShowroom !== false)
          .map(mapInventoryToShowroomModel)

        setInventoryModels(nextItems)
        setSelectedModelId((current) => current || nextItems[0]?.id || '')
        setIsInventoryLoading(false)
      },
      (error) => {
        console.error('Unable to load showroom inventory', error)
        setInventoryModels([])
        setIsInventoryLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const selectedModel = useMemo(
    () => inventoryModels.find((item) => item.id === selectedModelId) ?? inventoryModels[0] ?? null,
    [inventoryModels, selectedModelId],
  )

  const similarModels = useMemo(
    () => inventoryModels.filter((item) => item.id !== selectedModel?.id).slice(0, 3),
    [inventoryModels, selectedModel?.id],
  )

  const handleNavLinkClick = (event, link) => {
    event.preventDefault()
    setIsMenuOpen(false)

    if (link.active) {
      return
    }

    if (link.id === 'home') {
      onNavigateHome()
      return
    }

    if (link.id === 'service') {
      onNavigateService?.()
      return
    }

    onNavigateSection?.(link.id, link.label)
  }

  const handleModelSelect = (modelId) => {
    setSelectedModelId(modelId)
    setActiveImage(0)
    setActiveColor(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBookingChange = (event) => {
    const { name, value } = event.target

    setBookingForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleBookingSubmit = (event) => {
    event.preventDefault()
    onOpenSignup?.()
  }

  const primaryImage = selectedModel?.gallery?.[activeImage] || selectedModel?.gallery?.[0] || bykelinkLogo

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-['Manrope']">
      <nav className="fixed top-0 z-50 w-full bg-neutral-950/80 shadow-2xl shadow-red-900/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button type="button" onClick={onNavigateHome} className="flex items-center gap-3 text-left">
            <img src={bykelinkLogo} alt="Bykelink logo" className="h-10 w-10 rounded-lg bg-white p-1.5" />
            <div className="text-2xl font-black italic uppercase tracking-tighter text-neutral-100 font-['Epilogue']">
              BYKELINK
            </div>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            {showroomLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(event) => handleNavLinkClick(event, link)}
                className={`border-b-2 pb-1 font-['Epilogue'] text-sm uppercase tracking-tighter transition-colors duration-300 ${
                  link.active
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent font-medium text-neutral-400 hover:text-neutral-100'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSignup}
              className="hidden rounded-full bg-[#e10100] px-5 py-2 text-sm font-bold text-white transition-transform active:scale-95 md:block"
            >
              Inquire
            </button>
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white md:hidden"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <CloseRoundedIcon fontSize="small" /> : <MenuRoundedIcon fontSize="small" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-white/10 bg-neutral-950/95 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {showroomLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(event) => handleNavLinkClick(event, link)}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold uppercase tracking-tight text-white"
                >
                  {link.label}
                </a>
              ))}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false)
                  onOpenSignup?.()
                }}
                className="rounded-xl bg-[#e10100] px-4 py-3 text-sm font-black uppercase tracking-tight text-white"
              >
                Inquire
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-screen-2xl px-4 pb-12 pt-24 md:px-8">
        <nav className="mb-8 flex items-center gap-2 text-sm text-[#b7b5b4]">
          <button type="button" onClick={onNavigateHome} className="transition-colors hover:text-[#ffb4a8]">
            Home
          </button>
          <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
          <span className="text-[#ffb4a8]">Showroom</span>
          <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
          <span className="text-white">{selectedModel?.label || 'Live Inventory'}</span>
        </nav>

        {isInventoryLoading ? (
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] px-6 py-16 text-center text-white/70">
            Loading live showroom inventory...
          </div>
        ) : selectedModel ? (
          <>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="space-y-6 lg:col-span-7">
                <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-[#201f1f]">
                  <img
                    src={primaryImage}
                    alt={selectedModel.label}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-5 right-5 flex gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-neutral-950/60 p-3 text-white transition-colors hover:bg-[#e10100]"
                      aria-label="Expand image"
                    >
                      <OpenInFullRoundedIcon sx={{ fontSize: 20 }} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 sm:gap-4">
                  {selectedModel.gallery.map((image, index) => (
                    <button
                      key={`${selectedModel.id}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                        activeImage === index
                          ? 'border-[#e10100]'
                          : 'border-transparent bg-[#2a2a2a] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={image} alt={`${selectedModel.label} view ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-8 lg:col-span-5">
                <header>
                  <div className="mb-4 inline-block rounded-full border border-[#e10100]/20 bg-[#e10100]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-[#ffb4a8]">
                    {selectedModel.badge}
                  </div>
                  <h1 className="text-4xl font-black leading-tight tracking-tighter text-white font-['Epilogue'] sm:text-5xl md:text-6xl">
                    {selectedModel.name}
                  </h1>
                  <p className="mt-4 max-w-md text-lg text-[#b7b5b4]">{selectedModel.description}</p>
                </header>

                <div>
                  <div className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-[#b7b5b4]">
                    Starting Price
                  </div>
                  <div className="text-4xl font-black text-[#e10100] font-['Epilogue']">{selectedModel.price}</div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm font-bold uppercase tracking-[0.24em] text-[#b7b5b4]">
                    Available Colors
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedModel.colors.map((color, index) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setActiveColor(index)}
                        className={`h-10 w-10 rounded-full border-2 transition-all ${color.swatch} ${
                          activeColor === index
                            ? 'border-[#e10100] ring-4 ring-[#e10100]/10'
                            : 'border-transparent hover:border-[#ab8985]'
                        }`}
                        aria-label={color.name}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[#c8c6c5]">Selected: {selectedModel.colors[activeColor]?.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedModel.specs.map((spec) => (
                    <div key={spec.label} className="rounded-2xl bg-[#1c1b1b] p-4">
                      <div className="mb-1 text-xs font-medium uppercase tracking-tighter text-[#b7b5b4]">
                        {spec.label}
                      </div>
                      <div className="text-lg font-bold text-white font-['Epilogue']">{spec.value}</div>
                    </div>
                  ))}
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-[#2a2a2a] p-6 sm:p-8">
                  <div className="relative z-10">
                    <h3 className="mb-6 text-2xl font-bold text-white font-['Epilogue']">Reserve This Item</h3>
                    <form onSubmit={handleBookingSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <input
                          type="text"
                          name="firstName"
                          value={bookingForm.firstName}
                          onChange={handleBookingChange}
                          placeholder="First Name"
                          className="w-full rounded-xl border-none bg-[#353534] p-3 text-white placeholder:text-neutral-500 outline-none ring-0 focus:ring-2 focus:ring-[#e10100]"
                        />
                        <input
                          type="text"
                          name="lastName"
                          value={bookingForm.lastName}
                          onChange={handleBookingChange}
                          placeholder="Last Name"
                          className="w-full rounded-xl border-none bg-[#353534] p-3 text-white placeholder:text-neutral-500 outline-none ring-0 focus:ring-2 focus:ring-[#e10100]"
                        />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={bookingForm.email}
                        onChange={handleBookingChange}
                        placeholder="Email Address"
                        className="w-full rounded-xl border-none bg-[#353534] p-3 text-white placeholder:text-neutral-500 outline-none ring-0 focus:ring-2 focus:ring-[#e10100]"
                      />
                      <button
                        type="submit"
                        className="w-full rounded-full bg-[#e10100] py-4 text-lg font-bold text-white shadow-xl shadow-red-900/20 transition-transform active:scale-95"
                      >
                        Inquire Now
                      </button>
                    </form>
                  </div>
                  <div className="pointer-events-none absolute -bottom-12 -right-10 text-[140px] font-black text-white/5 font-['Epilogue']">
                    B
                  </div>
                </div>
              </div>
            </div>

            <section className="mt-20 sm:mt-24">
              <div className="mb-10 flex items-end justify-between gap-4">
                <div>
                  <h2 className="mb-2 text-3xl font-black tracking-tighter text-white font-['Epilogue'] sm:text-4xl">
                    LIVE SHOWROOM ITEMS
                  </h2>
                  <p className="text-[#b7b5b4]">Published directly from your inventory records.</p>
                </div>
                <div className="hidden gap-2 sm:flex">
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-[#5b403d] transition-colors hover:bg-[#2a2a2a]"
                    aria-label="Previous models"
                  >
                    <ChevronLeftRoundedIcon />
                  </button>
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-[#5b403d] transition-colors hover:bg-[#2a2a2a]"
                    aria-label="Next models"
                  >
                    <ChevronRightRoundedIcon />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:gap-8">
                {similarModels.length ? (
                  similarModels.map((model) => (
                    <article
                      key={model.id}
                      className="group overflow-hidden rounded-3xl bg-[#1c1b1b] transition-colors duration-500 hover:bg-[#2a2a2a]"
                    >
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={model.gallery[0]}
                          alt={model.label}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-5 sm:p-6">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <h3 className="mb-1 text-xl font-bold text-white font-['Epilogue']">{model.label}</h3>
                            <div className="text-xs font-black uppercase tracking-[0.24em] text-[#e10100]">
                              {model.accent}
                            </div>
                          </div>
                          <div className="text-lg font-black text-white font-['Epilogue']">{model.cardPrice}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleModelSelect(model.id)}
                          className="w-full rounded-xl border border-[#5b403d] py-3 text-sm font-bold uppercase tracking-[0.24em] text-white transition-all group-hover:border-[#e10100] group-hover:text-[#ffb4a8]"
                        >
                          View Item
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-[#1c1b1b] px-6 py-10 text-sm text-white/60 md:col-span-3">
                    Add more inventory items and enable showroom visibility to display them here.
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] px-6 py-16 text-center text-white/70">
            No live showroom items are published yet. Add an inventory item in the admin panel and enable showroom visibility.
          </div>
        )}
      </main>

      <footer className="w-full border-t border-neutral-800/30 bg-neutral-950">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-4 lg:px-8 lg:py-16">
          <div className="space-y-4">
            <div className="text-xl font-bold text-neutral-100">BYKELINK</div>
            <p className="text-sm leading-relaxed tracking-wide text-neutral-500">
              The premier destination for Yamaha excellence in the Philippines. Precision,
              performance, and passion since inception.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-white">Navigation</h4>
            <ul className="space-y-2 text-sm tracking-wide text-neutral-500">
              <li>
                <button type="button" onClick={() => onNavigateSection?.('showroom', 'Showroom')} className="hover:text-red-500">
                  Showroom
                </button>
              </li>
              <li>
                <button type="button" onClick={onNavigateHome} className="hover:text-red-500">
                  Promos
                </button>
              </li>
              <li>
                <button type="button" onClick={onNavigateService} className="hover:text-red-500">
                  Service Center
                </button>
              </li>
              <li>
                <button type="button" onClick={onNavigateService} className="hover:text-red-500">
                  Spare Parts
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-white">Support</h4>
            <ul className="space-y-2 text-sm tracking-wide text-neutral-500">
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Dealer Careers</li>
              <li>Yamaha Racing</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-white">Connect</h4>
            <div className="flex gap-3">
              <a
                href="tel:+63288889999"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition-all hover:border-red-500 hover:text-red-500"
                aria-label="Call us"
              >
                <CallRoundedIcon sx={{ fontSize: 18 }} />
              </a>
              <a
                href="mailto:sales@bykelink.com"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition-all hover:border-red-500 hover:text-red-500"
                aria-label="Email us"
              >
                <MailRoundedIcon sx={{ fontSize: 18 }} />
              </a>
              <button
                type="button"
                onClick={() => onNavigateSection?.('contact', 'Contact')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition-all hover:border-red-500 hover:text-red-500"
                aria-label="Visit location"
              >
                <LocationOnRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-4 border-t border-neutral-800/20 px-6 py-6 md:flex-row lg:px-8">
          <div className="text-sm uppercase tracking-wide text-neutral-500">
            © 2024 BYKELINK MOTOR INC. AUTHORIZED YAMAHA DEALER.
          </div>
          <div className="flex gap-6">
            <span className="text-xs font-bold tracking-[0.2em] text-neutral-700">REVVING YOUR HEART</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
