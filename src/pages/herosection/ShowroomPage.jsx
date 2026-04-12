import { useEffect, useMemo, useState } from 'react'
import { collection, limit, onSnapshot, query } from 'firebase/firestore'
import CallRoundedIcon from '@mui/icons-material/CallRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import MailRoundedIcon from '@mui/icons-material/MailRounded'
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import bykelinkLogo from '../../assets/bykelinklogo.png'
import { db } from '../../firebase'
import ChatBox from '../../components/ChatBox'
import NavHeader from '../../components/NavHeader'

const showroomLinks = [
  { label: 'Home', href: '/', id: 'home' },
  { label: 'Showroom', href: '/showroom', id: 'showroom', active: true },
  { label: 'Spare Parts', href: '/spare-parts', id: 'spare-parts' },
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
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((item) => ({
          name: item.name || item,
          swatch: item.swatch || 'bg-neutral-700',
        }))
      }
    } catch (e) {
      // Not JSON, try comma-separated
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((name) => ({ name, swatch: 'bg-neutral-700' }))
    }
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
    category: item.category || 'Showroom Ready',
    model: item.itemModel || item.name || 'General',
    badge: item.badge || item.category || 'Showroom Ready',
    description:
      item.description ||
      'Live inventory data from Bykelink. This item is available directly from the current showroom stock feed.',
    price: `SRP ${formatPrice(item.price ?? 0)}`,
    accent: item.status || 'Available Now',
    cardPrice: formatPrice(item.price ?? 0),
    gallery,
    colorVariants: Array.isArray(item.colorVariants) ? item.colorVariants : parseColorOptions(item.colors),
    specs: [
      { label: 'Category', value: item.category || 'General' },
      { label: 'Stock', value: `${item.stock ?? 0} units` },
      { label: 'Status', value: item.status || 'In Stock' },
      { label: 'SKU', value: String(item.sku || item.id || 'INV-ITEM').slice(0, 10).toUpperCase() },
    ],
  }
}

export default function ShowroomPage({ onNavigateHome, onNavigateSection, onNavigateService, onNavigateSpareParts, onOpenSignup, currentUser }) {
  const [inventoryModels, setInventoryModels] = useState([])
  const [isInventoryLoading, setIsInventoryLoading] = useState(true)
  const [selectedModelId, setSelectedModelId] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [activeColor, setActiveColor] = useState(0)
  const [isImageExpandOpen, setIsImageExpandOpen] = useState(false)
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
          .filter((item) => item.showInShowroom !== false && item.publishedToShowroom !== false)
          .filter((item) => item.category !== 'Spare Parts' && item.itemType !== 'Spare Parts')
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
        results = results.filter((item) => 
          item.colorVariants?.some((cv) => cv.color?.name === filterVariant)
        )
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
        item.colorVariants?.forEach((cv) => {
          if (cv.color?.name) allVariants.add(cv.color.name)
        })
      })
      return ['all', ...Array.from(allVariants)]
    },
    [inventoryModels],
  )

  const itemsPerPage = 6
  const totalPages = Math.ceil(Math.max(1, filteredModels.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedModels = filteredModels.slice(startIndex, startIndex + itemsPerPage)

  const handleNavLinkClick = (link) => {
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

    if (link.id === 'spare-parts') {
      onNavigateSpareParts?.()
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

  const handleFinancingChange = (event) => {
    const { name, value } = event.target

    setFinancingForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const goToLoginPage = () => {
    window.location.href = '/login'
  }

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const primaryImage = selectedModel?.gallery?.[activeImage] || selectedModel?.gallery?.[0] || bykelinkLogo

  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-['Manrope']">
      <NavHeader
        currentUser={false}
        customerName=""
        activeNav="Showroom"
        navLinks={showroomLinks}
        onLogoClick={onNavigateHome}
        onNavigateClick={handleNavLinkClick}
        onUserMenuClick={() => {}}
        onSignOut={() => {}}
        onAuthClick={goToLoginPage}
      />

      <main className="pt-24">
        <section className="relative flex min-h-96 items-center overflow-hidden bg-linear-to-r from-blue-600 via-cyan-600 to-slate-800">
          <div className="absolute inset-0 opacity-20">
            <img
              alt={selectedModel?.label || 'Showroom highlight'}
              className="h-full w-full object-cover"
              src={primaryImage}
            />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-blue-100">Live Showroom</p>
              <h1 className="mb-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Explore Your Next <span className="bg-linear-to-r from-blue-100 to-cyan-100 bg-clip-text text-transparent">Yamaha Ride</span>
              </h1>
              <p className="max-w-2xl text-base text-slate-100 sm:text-lg">
                Browse real inventory, compare available variants, and review showroom-ready units with the same premium buying experience as our customer portal.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-screen-2xl px-4 pb-12 pt-8 md:px-8">
          <nav className="mb-8 flex items-center gap-2 text-sm text-slate-400">
            <button type="button" onClick={onNavigateHome} className="transition-colors hover:text-cyan-300">
              Home
            </button>
            <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
            <span className="text-cyan-300">Showroom</span>
            <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
            <span className="text-white">{selectedModel?.label || 'Live Inventory'}</span>
          </nav>

        {isInventoryLoading ? (
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 px-6 py-16 text-center text-white/70">
            Loading live showroom inventory...
          </div>
        ) : selectedModel ? (
          <>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="space-y-6 lg:col-span-7">
                <div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-blue-950/20">
                  <img
                    src={primaryImage}
                    alt={selectedModel.label}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-5 right-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsImageExpandOpen(true)}
                      className="rounded-full bg-slate-950/70 p-3 text-white transition-colors hover:bg-blue-600"
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
                          ? 'border-blue-500'
                          : 'border-transparent bg-slate-800 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={image} alt={`${selectedModel.label} view ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-8 lg:col-span-5">
                <header className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-blue-950/10 sm:p-8">
                  <div className="mb-4 inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
                    {selectedModel.badge}
                  </div>
                  <h1 className="text-4xl font-black leading-tight tracking-tighter text-white font-['Epilogue'] sm:text-5xl md:text-6xl">
                    {selectedModel.name}
                  </h1>
                  <p className="mt-4 max-w-md text-lg text-slate-300">{selectedModel.description}</p>
                </header>

                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-blue-950/10 sm:p-8">
                  <div className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-slate-400">
                    Starting Price
                  </div>
                  <div className="text-4xl font-black text-transparent bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text font-['Epilogue']">{selectedModel.price}</div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-blue-950/10 sm:p-8">
                  <div className="text-sm font-bold uppercase tracking-[0.24em] text-slate-400">
                    Available Colors & Stock
                  </div>
                  <div className="mt-4">{(() => {
                    const colorVariants = selectedModel.colorVariants || []
                    if (colorVariants.length === 0) return null
                    
                    return (
                      <div className="flex flex-wrap gap-6">
                        {colorVariants.map((variant, index) => (
                          <button
                            key={variant.color?.name || index}
                            type="button"
                            onClick={() => setActiveColor(index)}
                            className="flex flex-col items-center gap-2 transition-all"
                          >
                            <div className={`h-10 w-10 rounded-full border-4 transition-all ${
                              activeColor === index
                                ? 'border-blue-600 ring-2 ring-blue-600/50'
                                : 'border-slate-600'
                            } ${variant.color?.swatch || 'bg-neutral-700'}`} />
                            <div className="text-center">
                              <p className="text-sm font-bold text-white">{variant.color?.name}</p>
                              <p className="text-xs text-slate-400">
                                {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  })()}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedModel.specs.map((spec) => (
                    <div key={spec.label} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-blue-950/10">
                      <div className="mb-1 text-xs font-medium uppercase tracking-tighter text-slate-400">
                        {spec.label}
                      </div>
                      <div className="text-lg font-bold text-white font-['Epilogue']">{spec.value}</div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goToLoginPage}
                  className="w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-blue-600/30 transition-transform hover:from-blue-700 hover:to-cyan-700 active:scale-95"
                >
                  Apply for Financing
                </button>
              </div>
            </div>

            <section className="mt-20 sm:mt-24">
              <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <h2 className="mb-2 text-3xl font-black tracking-tighter text-white font-['Epilogue'] sm:text-4xl">
                    LIVE SHOWROOM ITEMS
                  </h2>
                  <p className="text-[#b7b5b4]">Published directly from your inventory records.</p>
                </div>
                <div className="relative w-full sm:w-auto">
                  <SearchRoundedIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Search motorcycles..."
                    className="w-full sm:w-72 rounded-xl border border-slate-600 bg-slate-800 px-10 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                  />
                </div>
              </div>

              <div className="mb-8 rounded-3xl border border-slate-700/60 bg-slate-800/50 p-4 shadow-lg backdrop-blur-sm sm:p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Model</label>
                  <select
                    value={filterModel}
                    onChange={(e) => {
                      setFilterModel(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                  >
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model === 'all' ? 'All Models' : model}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Variant</label>
                  <select
                    value={filterVariant}
                    onChange={(e) => {
                      setFilterVariant(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                  >
                    {variants.map((variant) => (
                      <option key={variant} value={variant}>
                        {variant === 'all' ? 'All Variants' : variant}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:gap-8">
                {paginatedModels.length ? (
                  paginatedModels.map((model) => (
                    <article
                      key={model.id}
                      className="group overflow-hidden rounded-3xl border border-slate-600 bg-linear-to-br from-slate-700 to-slate-800 transition-all duration-300 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20"
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
                            <div className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">
                              {model.accent}
                            </div>
                          </div>
                          <div className="text-lg font-black text-white font-['Epilogue']">{model.cardPrice}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleModelSelect(model.id)}
                            className="w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 py-3 text-sm font-bold uppercase tracking-[0.24em] text-white transition-all hover:from-blue-700 hover:to-cyan-700"
                        >
                          View Item
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 px-6 py-10 text-sm text-white/60 md:col-span-2 lg:col-span-3">
                    {searchQuery ? 'No bikes found matching your search.' : 'Add more inventory items and enable showroom visibility to display them here.'}
                  </div>
                )}
              </div>

              {filteredModels.length > 0 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-600 text-white transition-all hover:border-blue-600 hover:bg-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          : 'border-slate-600 text-white hover:border-blue-600 hover:bg-blue-600/10'
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
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-600 text-white transition-all hover:border-blue-600 hover:bg-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRightRoundedIcon sx={{ fontSize: 20 }} />
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 px-6 py-16 text-center text-white/70">
            No live showroom items are published yet. Add an inventory item in the admin panel and enable showroom visibility.
          </div>
        )}
        </div>
      </main>

      <footer className="mt-24 w-full border-t border-slate-700/40 bg-slate-950">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-4 lg:px-8 lg:py-16">
          <div className="space-y-4">
            <div className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-xl font-black text-transparent">BYKELINK</div>
            <p className="text-sm leading-relaxed tracking-wide text-slate-400">
              The premier destination for Yamaha excellence in the Philippines. Precision,
              performance, and passion since inception.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-white">Navigation</h4>
            <ul className="space-y-2 text-sm tracking-wide text-slate-400">
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
                <button type="button" onClick={onNavigateService} className="hover:text-blue-500">
                  Service Center
                </button>
              </li>
              <li>
                <button type="button" onClick={onNavigateService} className="hover:text-blue-500">
                  Spare Parts
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-white">Support</h4>
            <ul className="space-y-2 text-sm tracking-wide text-slate-400">
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
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-all hover:border-blue-600 hover:text-blue-600"
              >
                <CallRoundedIcon sx={{ fontSize: 18 }} />
              </a>
              <a
                href="mailto:sales@bykelink.com"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-all hover:border-blue-600 hover:text-blue-600"
                aria-label="Email us"
              >
                <MailRoundedIcon sx={{ fontSize: 18 }} />
              </a>
              <button
                type="button"
                onClick={() => onNavigateSection?.('contact', 'Contact')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-all hover:border-blue-600 hover:text-blue-600"
                aria-label="Visit location"
              >
                <LocationOnRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-4 border-t border-slate-700/20 px-6 py-6 md:flex-row lg:px-8">
          <div className="text-sm uppercase tracking-wide text-slate-400">
            © 2024 BYKELINK MOTOR INC. AUTHORIZED YAMAHA DEALER.
          </div>
          <div className="flex gap-6">
            <span className="text-xs font-bold tracking-[0.2em] text-neutral-700">REVVING YOUR HEART</span>
          </div>
        </div>
      </footer>

      {isImageExpandOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-screen max-w-4xl w-full">
            <img
              src={primaryImage}
              alt={selectedModel?.label}
              className="max-h-screen w-full rounded-2xl object-contain"
            />
            <button
              type="button"
              onClick={() => setIsImageExpandOpen(false)}
              className="absolute top-4 right-4 rounded-full bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
              aria-label="Close image"
            >
              <CloseRoundedIcon sx={{ fontSize: 24 }} />
            </button>
          </div>
        </div>
      )}

      <ChatBox currentUser={currentUser} />
    </div>
  )
}
