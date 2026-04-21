import { useState, useEffect, useRef } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

const ITEMS_PER_PAGE = 8

export default function ServiceTypeSection({ isDarkMode }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [iconFile, setIconFile] = useState(null)
  const [iconPreview, setIconPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cost: '',
    iconUrl: '',
  })

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesRef = collection(db, 'services')
        const snapshot = await getDocs(servicesRef)
        const servicesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setServices(servicesData)
      } catch (error) {
        console.error('Error fetching services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  const handleAddService = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.description || !formData.cost) {
      alert('Please fill all fields')
      return
    }

    if (!iconFile) {
      alert('Please upload a service icon')
      return
    }

    setUploading(true)
    try {
      // Upload icon to Firebase Storage
      const iconRef = ref(storage, `service-icons/${Date.now()}_${iconFile.name}`)
      await uploadBytes(iconRef, iconFile)
      const iconUrl = await getDownloadURL(iconRef)

      const servicesRef = collection(db, 'services')
      const newService = await addDoc(servicesRef, {
        title: formData.title,
        description: formData.description,
        cost: parseFloat(formData.cost),
        iconUrl: iconUrl,
        createdAt: new Date(),
      })

      setServices([
        ...services,
        {
          id: newService.id,
          title: formData.title,
          description: formData.description,
          cost: parseFloat(formData.cost),
          iconUrl: iconUrl,
        },
      ])

      setFormData({ title: '', description: '', cost: '', iconUrl: '' })
      setIconFile(null)
      setIconPreview(null)
    } catch (error) {
      console.error('Error adding service:', error)
      alert('Error adding service')
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateService = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.description || !formData.cost) {
      alert('Please fill all fields')
      return
    }

    setUploading(true)
    try {
      let iconUrl = formData.iconUrl

      // Upload new icon if selected
      if (iconFile) {
        const iconRef = ref(storage, `service-icons/${Date.now()}_${iconFile.name}`)
        await uploadBytes(iconRef, iconFile)
        iconUrl = await getDownloadURL(iconRef)
      }

      const serviceRef = doc(db, 'services', editingId)
      await updateDoc(serviceRef, {
        title: formData.title,
        description: formData.description,
        cost: parseFloat(formData.cost),
        iconUrl: iconUrl,
        updatedAt: new Date(),
      })

      setServices(
        services.map((s) =>
          s.id === editingId
            ? {
                id: editingId,
                title: formData.title,
                description: formData.description,
                cost: parseFloat(formData.cost),
                iconUrl: iconUrl,
              }
            : s,
        ),
      )

      setFormData({ title: '', description: '', cost: '', iconUrl: '' })
      setIconFile(null)
      setIconPreview(null)
      setEditingId(null)
    } catch (error) {
      console.error('Error updating service:', error)
      alert('Error updating service')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteService = async (id) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteDoc(doc(db, 'services', id))
        setServices(services.filter((s) => s.id !== id))
        setCurrentPage(1)
      } catch (error) {
        console.error('Error deleting service:', error)
        alert('Error deleting service')
      }
    }
  }

  const handleEditService = (service) => {
    setFormData({
      title: service.title,
      description: service.description,
      cost: service.cost,
      iconUrl: service.iconUrl || '',
    })
    setIconPreview(service.iconUrl)
    setEditingId(service.id)
  }

  const handleCancel = () => {
    setFormData({ title: '', description: '', cost: '', iconUrl: '' })
    setIconFile(null)
    setIconPreview(null)
    setEditingId(null)
  }

  const handleIconChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setIconFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIconPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Pagination
  const totalPages = Math.ceil(services.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedServices = services.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  const averageCost = services.length > 0 ? (services.reduce((sum, s) => sum + s.cost, 0) / services.length).toFixed(2) : 0

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h2 className={`text-4xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          SERVICE MANAGEMENT
        </h2>
        <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-gray-600'}`}>
          Configure and monitor professional maintenance operations.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Register Operation Form */}
        <div className={`lg:col-span-1 rounded-xl border p-8 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
          <div className="mb-6">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 ${isDarkMode ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
              Register Operation
            </div>
            <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Service Details
            </h3>
          </div>

          <form onSubmit={editingId ? handleUpdateService : handleAddService} className="space-y-5">
            {/* Service Icon */}
            <div>
              <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                Service Icon
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full px-4 py-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 transition text-sm font-bold ${
                  isDarkMode
                    ? 'border-white/10 hover:border-red-600 hover:bg-red-600/10 text-white/60 hover:text-red-400'
                    : 'border-gray-300 hover:border-red-600 hover:bg-red-50 text-gray-600 hover:text-red-600'
                }`}
              >
                <CloudUploadRoundedIcon sx={{ fontSize: 18 }} />
                {iconFile ? 'Change Icon' : 'Upload Icon'}
              </button>

              {iconPreview && (
                <div className={`mt-3 p-3 rounded-lg text-center ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
                  <img src={iconPreview} alt="Icon preview" className="w-12 h-12 object-contain mx-auto" />
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                Service Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Change Oil"
                className={`w-full px-4 py-2 rounded-lg border text-sm ${
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-white placeholder-white/40'
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                Detailed Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Professional oil and filter replacement..."
                rows="3"
                className={`w-full px-4 py-2 rounded-lg border text-sm resize-none ${
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-white placeholder-white/40'
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              />
            </div>

            {/* Cost */}
            <div>
              <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                Service Cost ($)
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>₱</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm ${
                    isDarkMode
                      ? 'border-white/10 bg-white/5 text-white placeholder-white/40'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={uploading || !iconFile}
                className={`flex-1 bg-red-600 text-white px-4 py-2 rounded-lg transition font-bold text-sm uppercase tracking-widest disabled:opacity-50 ${
                  !uploading && iconFile ? 'hover:bg-red-700' : ''
                }`}
              >
                {uploading ? 'Uploading...' : editingId ? 'Update Service' : 'Add Service'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-widest transition ${
                  isDarkMode
                    ? 'border border-white/10 text-white hover:bg-white/5'
                    : 'border border-gray-300 text-gray-900 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: Live Inventory */}
        <div className="lg:col-span-2">
          {/* Header with Sort */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'bg-cyan-600/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}>
                Live Inventory
              </div>
              <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Active Services
              </h3>
            </div>
            <button className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full transition ${
              isDarkMode
                ? 'text-red-400 hover:bg-red-600/10'
                : 'text-red-600 hover:bg-red-100'
            }`}>
              Sort by Newest
            </button>
          </div>

          {loading ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
              Loading services...
            </div>
          ) : services.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
              <p>No services found. Add one from the form.</p>
            </div>
          ) : (
            <>
              {/* Services List - Vertical */}
              <div className="space-y-3 mb-8">
                {paginatedServices.map((service) => (
                  <div
                    key={service.id}
                    className={`rounded-lg border p-4 flex items-center gap-4 group transition ${
                      isDarkMode ? 'border-white/10 bg-white/5 hover:border-red-600/50 hover:bg-white/8' : 'border-gray-200 bg-white hover:border-red-400 hover:bg-gray-50'
                    }`}
                  >
                    {/* Icon section - Left */}
                    <div className={`shrink-0 w-16 h-16 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-linear-to-br from-red-600/20 to-red-400/10' : 'bg-linear-to-br from-red-100 to-red-50'}`}>
                      {service.iconUrl ? (
                        <img
                          src={service.iconUrl}
                          alt={service.title}
                          className="w-full h-full object-contain object-center group-hover:scale-110 transition"
                        />
                      ) : (
                        <CloudUploadRoundedIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                      )}
                    </div>

                    {/* Content section - Middle */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-black text-sm uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {service.title}
                      </h4>
                      <p className={`text-xs mt-1 line-clamp-2 ${isDarkMode ? 'text-white/50' : 'text-gray-600'}`}>
                        {service.description}
                      </p>
                    </div>

                    {/* Price - Center Right */}
                    <div className="shrink-0 text-right mr-2">
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                        Price
                      </p>
                      <p className="text-xl font-black text-red-600">
                        ₱{service.cost.toFixed(2)}
                      </p>
                    </div>

                    {/* Actions - Right */}
                    <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleEditService(service)}
                        className={`p-2 rounded-lg transition ${
                          isDarkMode
                            ? 'hover:bg-blue-600/20 text-blue-400'
                            : 'hover:bg-blue-100 text-blue-600'
                        }`}
                        title="Edit"
                      >
                        <EditRoundedIcon sx={{ fontSize: 16 }} />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className={`p-2 rounded-lg transition ${
                          isDarkMode
                            ? 'hover:bg-red-600/20 text-red-400'
                            : 'hover:bg-red-100 text-red-600'
                        }`}
                        title="Delete"
                      >
                        <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className={`rounded-lg p-6 border mb-8 grid grid-cols-2 gap-4 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                <div className={`px-4 py-3 rounded-lg border-l-4 border-red-600 ${isDarkMode ? 'bg-white/5' : 'bg-red-50'}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/50' : 'text-gray-600'}`}>
                    Total Active Services
                  </p>
                  <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {services.length}
                  </p>
                </div>
                <div className={`px-4 py-3 rounded-lg border-l-4 border-red-600 ${isDarkMode ? 'bg-white/5' : 'bg-red-50'}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/50' : 'text-gray-600'}`}>
                    Avg. Revenue
                  </p>
                  <p className="text-3xl font-black text-red-600">
                    ₱{averageCost}
                  </p>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition ${
                        currentPage === page
                          ? 'bg-red-600 text-white'
                          : isDarkMode
                            ? 'border border-white/10 text-white hover:bg-white/5'
                            : 'border border-gray-300 text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
