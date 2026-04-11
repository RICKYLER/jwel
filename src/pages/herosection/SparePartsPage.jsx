import { useEffect, useMemo, useState } from 'react'
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore'
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
import ChatBox from '../../components/ChatBox'

const sparePartsLinks = [
  { label: 'Home', href: '/', id: 'home' },
  { label: 'Showroom', href: '/showroom', id: 'showroom' },
  { label: 'Spare Parts', href: '/spare-parts', id: 'spare-parts', active: true },
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
    { name: 'Standard', swatch: 'bg-neutral-900' },
    { name: 'OEM Specification', swatch: 'bg-blue-700' },
  ]
}

const mapInventoryToSparePartModel = (item) => {
  const gallery = Array.isArray(item.gallery) && item.gallery.filter(Boolean).length
    ? item.gallery.filter(Boolean)
    : item.imageUrl
      ? [item.imageUrl]
      : [bykelinkLogo]

  return {
    id: item.id,
    name: String(item.name || 'Spare Part').toUpperCase(),
    label: item.name || 'Spare Part',
    category: item.category || 'Spare Parts',
    model: item.model || 'General',
    variant: item.variant || 'Standard',
    badge: item.badge || item.category || 'Spare Parts',
    description:
      item.description ||
      'Live inventory data from Bykelink. This spare part is available directly from our current stock feed.',
    price: `${formatPrice(item.price ?? 0)}`,
    accent: item.status || 'Available Now',
    cardPrice: formatPrice(item.price ?? 0),
    gallery,
    colors: parseColorOptions(item.colors),
    specs: [
      { label: 'Category', value: item.category || 'Spare Parts' },
      { label: 'Stock', value: `${item.stock ?? 0} units` },
      { label: 'Status', value: item.status || 'In Stock' },
      { label: 'SKU', value: String(item.sku || item.id || 'INV-ITEM').slice(0, 10).toUpperCase() },
    ],
  }
}

export default function SparePartsPage({ onNavigateHome, onNavigateSection, onNavigateService, onNavigateShowroom, onOpenSignup, currentUser }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [inventoryModels, setInventoryModels] = useState([])
  const [isInventoryLoading, setIsInventoryLoading] = useState(true)
  const [selectedModelId, setSelectedModelId] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterModel, setFilterModel] = useState('all')
  const [filterVariant, setFilterVariant] = useState('all')

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'inventory')),
      (snapshot) => {
        const nextItems = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item) => item.category === 'Spare Parts' && item.showInShowroom !== false && item.publishedToShowroom !== false)
          .map(mapInventoryToSparePartModel)

        setInventoryModels(nextItems)
        setSelectedModelId((current) => current || nextItems[0]?.id || '')
        setIsInventoryLoading(false)
      },
      (error) => {
        console.error('Unable to load spare parts inventory', error)
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

    if (link.id === 'showroom') {
      onNavigateShowroom?.()
      return
    }

    onNavigateSection?.(link.id, link.label)
  }

  const goToLoginPage = () => {
    window.location.href = '/login'
  }

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleModelSelect = (modelId) => {
    setSelectedModelId(modelId)
    setActiveImage(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredModels = useMemo(
    () => {
      let results = inventoryModels

      // Search filter
      if (searchQuery !== '') {
        results = results.filter(
          (item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      }

      // Category filter
      if (filterCategory !== 'all') {
        results = results.filter((item) => item.category === filterCategory)
      }

      // Model filter
      if (filterModel !== 'all') {
        results = results.filter((item) => item.model === filterModel)
      }

      // Variant filter
      if (filterVariant !== 'all') {
        results = results.filter((item) => item.variant === filterVariant)
      }

      return results
    },
    [inventoryModels, searchQuery, filterCategory, filterModel, filterVariant],
  )

  const categories = useMemo(
    () => ['all', ...new Set(inventoryModels.map((item) => item.category).filter(Boolean))],
    [inventoryModels],
  )

  const models = useMemo(
    () => ['all', ...new Set(inventoryModels.map((item) => item.model).filter(Boolean))],
    [inventoryModels],
  )

  const variants = useMemo(
    () => {
      const allVariants = new Set()
      inventoryModels.forEach((item) => {
        if (item.variant) allVariants.add(item.variant)
      })
      return ['all', ...Array.from(allVariants)]
    },
    [inventoryModels],
  )

  const itemsPerPage = 9
  const totalPages = Math.ceil(Math.max(1, filteredModels.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedModels = filteredModels.slice(startIndex, startIndex + itemsPerPage)

  const primaryImage = selectedModel?.gallery?.[activeImage] || selectedModel?.gallery?.[0] || bykelinkLogo

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-['Manrope']">
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl shadow-2xl shadow-blue-900/10">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button type="button" onClick={onNavigateHome} className="flex items-center gap-3 text-left">
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
            {sparePartsLinks.map((link) => {
              const isActive = link.active

              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(event) => handleNavLinkClick(event, link)}
                  className={`border-b-2 pb-1 text-sm font-bold uppercase tracking-tight font-['Epilogue'] transition-colors duration-300 ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-neutral-400 hover:text-neutral-100'
                  }`}
                >
                  {link.label}
                </a>
              )
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={goToLoginPage}
              className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-black uppercase tracking-tight text-white font-['Epilogue'] transition duration-300 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95"
            >
              Get Started
            </button>
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
              {sparePartsLinks.map((link) => (
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
                  goToLoginPage()
                }}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black uppercase tracking-tight text-white"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-screen-2xl px-4 pb-12 pt-24 md:px-8">
        <nav className="mb-8 flex items-center gap-2 text-sm text-[#b7b5b4]">
          <button type="button" onClick={onNavigateHome} className="transition-colors hover:text-blue-400">
            Home
          </button>
          <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
          <span className="text-blue-400">Spare Parts</span>
          <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
          <span className="text-white">{selectedModel?.label || 'Live Inventory'}</span>
        </nav>

        {isInventoryLoading ? (
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] px-6 py-16 text-center text-white/70">
            Loading spare parts inventory...
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
                      className="rounded-full bg-neutral-950/60 p-3 text-white transition-colors hover:bg-blue-600"
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
                          ? 'border-blue-600'
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
                  <div className="mb-4 inline-block rounded-full border border-blue-600/20 bg-blue-600/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-blue-400">
                    {selectedModel.badge}
                  </div>
                  <h1 className="text-4xl font-black leading-tight tracking-tighter text-white font-['Epilogue'] sm:text-5xl md:text-6xl">
                    {selectedModel.name}
                  </h1>
                  <p className="mt-4 max-w-md text-lg text-[#b7b5b4]">{selectedModel.description}</p>
                </header>

                <div>
                  <div className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-[#b7b5b4]">
                    Price
                  </div>
                  <div className="text-4xl font-black text-blue-400 font-['Epilogue']">{selectedModel.price}</div>
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

                <button
                  type="button"
                  onClick={goToLoginPage}
                  className="w-full rounded-full bg-blue-600 py-4 text-lg font-bold text-white shadow-xl shadow-blue-900/20 transition-transform active:scale-95 hover:bg-blue-700"
                >
                  Check More Items
                </button>
              </div>
            </div>

            <section className="mt-20 sm:mt-24">
              <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <h2 className="mb-2 text-3xl font-black tracking-tighter text-white font-['Epilogue'] sm:text-4xl">
                    MORE SPARE PARTS
                  </h2>
                  <p className="text-[#b7b5b4]">Published directly from your inventory records.</p>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Search parts..."
                    className="w-full sm:w-64 rounded-xl border-2 border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#b7b5b4]">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#b7b5b4]">Model</label>
                  <select
                    value={filterModel}
                    onChange={(e) => {
                      setFilterModel(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30"
                  >
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model === 'all' ? 'All Models' : model}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#b7b5b4]">Variant</label>
                  <select
                    value={filterVariant}
                    onChange={(e) => {
                      setFilterVariant(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30"
                  >
                    {variants.map((variant) => (
                      <option key={variant} value={variant}>
                        {variant === 'all' ? 'All Variants' : variant}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:gap-8">
              {paginatedModels.length ? (
                paginatedModels.map((model) => (
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
                          <div className="text-xs font-black uppercase tracking-[0.24em] text-blue-400">
                              {model.accent}
                            </div>
                          </div>
                          <div className="text-lg font-black text-white font-['Epilogue']">{model.cardPrice}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleModelSelect(model.id)}
                          className="w-full rounded-xl border border-neutral-700 py-3 text-sm font-bold uppercase tracking-[0.24em] text-white transition-all group-hover:border-blue-600 group-hover:text-blue-400"
                        >
                          View Item
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-[#1c1b1b] px-6 py-10 text-sm text-white/60 md:col-span-2 lg:col-span-3">
                    {searchQuery ? 'No spare parts found matching your search.' : 'Add more spare parts and enable showroom visibility to display them here.'}
                  </div>
                )}
              </div>

              {filteredModels.length > 0 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-700 text-white transition-all hover:border-blue-600 hover:bg-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeftRoundedIcon sx={{ fontSize: 20 }} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handlePageChange(page)}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold transition-all ${
                        currentPage === page
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-neutral-700 text-white hover:border-blue-600 hover:bg-blue-600/10'
                      }`}
                      aria-label={`Page ${page}`}
                      aria-current={currentPage === page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-700 text-white transition-all hover:border-blue-600 hover:bg-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRightRoundedIcon sx={{ fontSize: 20 }} />
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] px-6 py-16 text-center text-white/70">
            No spare parts are published yet. Add a spare part item in the admin panel and enable showroom visibility.
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
                <button type="button" onClick={() => onNavigateSection?.('showroom', 'Showroom')} className="hover:text-blue-600">
                  Showroom
                </button>
              </li>
              <li>
                <button type="button" onClick={onNavigateHome} className="hover:text-blue-600">
                  Promos
                </button>
              </li>
              <li>
                <button type="button" onClick={onNavigateService} className="hover:text-blue-600">
                  Service Center
                </button>
              </li>
              <li>
                <button type="button" onClick={onNavigateService} className="hover:text-blue-600">
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
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition-all hover:border-blue-600 hover:text-blue-600"
                aria-label="Call us"
              >
                <CallRoundedIcon sx={{ fontSize: 18 }} />
              </a>
              <a
                href="mailto:sales@bykelink.com"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition-all hover:border-blue-600 hover:text-blue-600"
                aria-label="Email us"
              >
                <MailRoundedIcon sx={{ fontSize: 18 }} />
              </a>
              <button
                type="button"
                onClick={() => onNavigateSection?.('contact', 'Contact')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition-all hover:border-blue-600 hover:text-blue-600"
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

      <ChatBox currentUser={currentUser} />
    </div>
  )
}
