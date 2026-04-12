import { useState, useEffect, useMemo } from 'react'
import { signOut } from 'firebase/auth'
import { collection, onSnapshot, query } from 'firebase/firestore'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { auth, db } from '../../firebase'
import ChatBox from '../../components/ChatBox'

const formatPrice = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export default function CustomerShowroomPage({ currentUser, onSignOut }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [inventory, setInventory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState(new Set())
  const [hasPermissionError, setHasPermissionError] = useState(false)

  // Fetch inventory from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'inventory')),
      (snapshot) => {
        const items = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item) => item.showInShowroom !== false && item.publishedToShowroom !== false)
          .filter((item) => item.category !== 'Spare Parts' && item.itemType !== 'Spare Parts')

        setInventory(items)
        setIsLoading(false)
        setHasPermissionError(false)
      },
      (error) => {
        console.error('Unable to load inventory:', error)
        // If permission error, show a message but don't crash
        if (error.code === 'permission-denied') {
          setHasPermissionError(true)
        }
        setInventory([])
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const categories = useMemo(
    () => ['all', ...new Set(inventory.map((item) => item.category || 'General'))],
    [inventory],
  )

  const filteredAndSorted = useMemo(() => {
    let results = inventory

    // Category filter
    if (selectedCategory !== 'all') {
      results = results.filter((item) => item.category === selectedCategory)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (item) =>
          item.name?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query),
      )
    }

    // Sorting
    results.sort((a, b) => {
      if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0)
      if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0)
      return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
    })

    return results
  }, [inventory, selectedCategory, searchQuery, sortBy])

  const toggleFavorite = (itemId) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const handleLogout = async () => {
    await signOut(auth)
    onSignOut?.()
  }

  return (
    <div className="bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 font-body text-white overflow-x-hidden min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black tracking-tighter bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                BYKELINK
              </div>
              <p className="hidden sm:block text-xs font-bold text-slate-400 tracking-widest">
                YAMAHA DEALER
              </p>
            </div>

            {/* Nav Links - Desktop */}
            <nav className="hidden lg:flex items-center gap-8">
              <a className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">Showroom</a>
              <a className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">My Bookings</a>
              <a className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Service</a>
              <a className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Support</a>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-semibold text-white">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-slate-400">{currentUser?.email}</p>
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all rounded-lg"
              >
                Logout
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {isMenuOpen ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <nav className="lg:hidden mt-4 pt-4 border-t border-slate-700 space-y-3 pb-4">
              <a className="block text-sm font-semibold text-blue-400 hover:text-blue-300">Showroom</a>
              <a className="block text-sm font-semibold text-slate-300 hover:text-white">My Bookings</a>
              <a className="block text-sm font-semibold text-slate-300 hover:text-white">Service</a>
              <a className="block text-sm font-semibold text-slate-300 hover:text-white">Support</a>
            </nav>
          )}
        </div>
      </header>

      <main className="mt-24">
        {/* Hero Section */}
        <section className="relative h-96 overflow-hidden bg-linear-to-r from-blue-600 via-cyan-600 to-slate-800 flex items-center">
          <div className="absolute inset-0 opacity-20">
            <img
              alt="Yamaha Motorcycle"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2nZv-uRF6byfs4XjVo7NESuTqy2cCFaiht29N89gfu6EJgVCrhsD11KPhgc77XdLQScxGEmc8X0AtBPqSmH_9g5CRP9AWLnJ4JT3_FHvcUYx4SrVa2GLx1Jq6z61ki9sr-DU_bayakKhs7Q7MAWZu6CvSTSCy_A0x2Js7ZTije5_FEec2GdmYrV1NhoUI7PTUX5F2qrklhkQqfMzgF_9GtIppyvREWjbLv6hwhj_SxzDHUiyF-aT_52-fl6jp_xAd9eLb9tF0DIg"
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-blue-200 uppercase tracking-widest mb-2">Welcome Back</p>
              <h1 className="text-5xl sm:text-6xl font-black leading-tight mb-4">
                Explore Your Perfect <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-200 to-cyan-200">Ride</span>
              </h1>
              <p className="text-lg text-slate-200 max-w-xl">
                Premium Yamaha motorcycles tailored for your journey. Browse our complete inventory and find your next adventure.
              </p>
            </div>
          </div>
        </section>

        {/* Filters & Search */}
        <section className="bg-slate-800/50 border-b border-slate-700 py-6 sticky top-24 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full sm:flex-1 max-w-md">
                <SearchRoundedIcon className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search motorcycles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-semibold focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-semibold focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-300 font-semibold">Loading inventory...</p>
              </div>
            </div>
          ) : hasPermissionError ? (
            <div className="text-center py-16 bg-slate-800/50 rounded-lg border border-slate-700 p-8">
              <p className="text-xl text-slate-300 font-semibold mb-3">📚 Inventory Temporarily Unavailable</p>
              <p className="text-slate-400 mb-4">We're having trouble loading our current inventory from our database.</p>
              <p className="text-sm text-slate-500">Our team has been notified. Please try refreshing the page or contact support.</p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-slate-300 font-semibold mb-2">No motorcycles found</p>
              <p className="text-slate-400">Try adjusting your filters or search</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h2 className="text-4xl font-black mb-2">Our Inventory</h2>
                  <p className="text-slate-400 text-sm">
                    Showing {filteredAndSorted.length} motorcycle{filteredAndSorted.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSorted.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-linear-to-br from-slate-700 to-slate-800 rounded-xl overflow-hidden border border-slate-600 hover:border-blue-400 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20"
                  >
                    {/* Image Container */}
                    <div className="relative h-64 bg-slate-800 overflow-hidden">
                      <img
                        src={Array.isArray(item.gallery) && item.gallery[0] ? item.gallery[0] : item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className="p-2 bg-slate-900/80 backdrop-blur rounded-full hover:bg-blue-600 transition-colors"
                        >
                          {favorites.has(item.id) ? (
                            <FavoriteRoundedIcon className="text-red-400" />
                          ) : (
                            <FavoriteBorderRoundedIcon className="text-slate-300" />
                          )}
                        </button>
                      </div>

                      {/* Stock Badge */}
                      <div className="absolute top-4 left-4 z-10 bg-linear-to-r from-blue-600 to-cyan-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                        {item.stock ? `${item.stock} in stock` : 'Limited'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">
                        {item.category || 'Motorcycle'}
                      </p>
                      <h3 className="text-xl font-black mb-2 line-clamp-2">{item.name}</h3>
                      <p className="text-sm text-slate-300 mb-4 line-clamp-2 min-h-9">
                        {item.description ||
                          'Premium Yamaha motorcycle designed for performance and reliability.'}
                      </p>

                      {/* Price */}
                      <div className="mb-6 pb-6 border-b border-slate-600">
                        <p className="text-xs text-slate-400 mb-1">Starting at</p>
                        <p className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-400">
                          {formatPrice(item.price || 0)}
                        </p>
                      </div>

                      {/* Specs */}
                      {item.specs && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          {item.specs.slice(0, 2).map((spec, idx) => (
                            <div key={idx}>
                              <p className="text-xs text-slate-400 uppercase font-bold">{spec.label}</p>
                              <p className="text-sm font-semibold text-white">{spec.value}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 font-bold py-3 rounded-lg transition-all transform hover:scale-105 active:scale-95">
                          <ShoppingCartRoundedIcon sx={{ fontSize: 18 }} />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Chat Box */}
      <ChatBox currentUser={currentUser} />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-700 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                BYKELINK
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Premium Yamaha motorcycles tailored for Filipino riders. Experience excellence with precision engineering.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    Showroom
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    My Bookings
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    Service Centers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-4">Contact</h4>
              <p className="text-sm text-slate-400 mb-2">📍 123 Velocity Avenue, Hub City</p>
              <p className="text-sm text-slate-400 mb-2">📞 +63 2 8888 1234</p>
              <p className="text-sm text-slate-400">✉️ support@bykelink.com</p>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest">
              © 2024 BYKELINK YAMAHA. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-slate-400 hover:text-blue-400 transition-colors uppercase">
                Privacy
              </a>
              <a href="#" className="text-xs text-slate-400 hover:text-blue-400 transition-colors uppercase">
                Terms
              </a>
              <a href="#" className="text-xs text-slate-400 hover:text-blue-400 transition-colors uppercase">
                FAQ
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
