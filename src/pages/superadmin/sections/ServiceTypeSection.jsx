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
  const [showModal, setShowModal] = useState(false)
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
      setShowModal(false)
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
      setShowModal(false)
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
    setShowModal(true)
  }

  const handleCancel = () => {
    setFormData({ title: '', description: '', cost: '', iconUrl: '' })
    setIconFile(null)
    setIconPreview(null)
    setEditingId(null)
    setShowModal(false)
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

  const closeModal = () => {
    handleCancel()
  }

  // Pagination
  const totalPages = Math.ceil(services.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedServices = services.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  const averageCost = services.length > 0 ? (services.reduce((sum, s) => sum + s.cost, 0) / services.length).toFixed(2) : 0

  return (
    <>
      {/* Main Content */}
      <div className={`rounded-xl p-8 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={`text-3xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              SERVICE MANAGEMENT
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-gray-600'}`}>
              Configure and monitor professional maintenance operations.
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({ title: '', description: '', cost: '', iconUrl: '' })
              setIconFile(null)
              setIconPreview(null)
              setEditingId(null)
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition font-bold uppercase tracking-widest text-sm"
          >
            <AddRoundedIcon sx={{ fontSize: 20 }} />
            Add Service
          </button>
        </div>

        {/* Services Grid */}
        <div>
          {loading ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
              Loading services...
            </div>
          ) : services.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
              <p className="mb-4">No services found. Click "Add Service" to get started!</p>
            </div>
          ) : (
            <>
              {/* Services Grid */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {paginatedServices.map((service) => (
                  <div
                    key={service.id}
                    className={`rounded-lg border overflow-hidden ${
                      isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Icon section */}
                    <div className={`h-32 flex items-center justify-center ${isDarkMode ? 'bg-linear-to-br from-red-600/20 to-red-400/10' : 'bg-linear-to-br from-red-100 to-red-50'}`}>
                      {service.iconUrl ? (
                        <img
                          src={service.iconUrl}
                          alt={service.title}
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <CloudUploadRoundedIcon sx={{ fontSize: 48, color: '#dc2626', opacity: 0.5 }} />
                      )}
                    </div>

                    {/* Content section */}
                    <div className="p-4">
                      <h4 className={`font-bold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {service.title}
                      </h4>
                      <p className={`text-sm line-clamp-2 mb-4 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between mb-4 pt-4 border-t border-white/10">
                        <div>
                          <p className={`text-xs uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                            Est Cost
                          </p>
                          <p className="text-2xl font-black text-red-600">
                            ₱{service.cost}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditService(service)}
                            className={`p-2 rounded-lg transition ${
                              isDarkMode
                                ? 'hover:bg-blue-600/20 text-blue-400'
                                : 'hover:bg-blue-100 text-blue-600'
                            }`}
                            title="Edit"
                          >
                            <EditRoundedIcon sx={{ fontSize: 20 }} />
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
                            <DeleteRoundedIcon sx={{ fontSize: 20 }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className={`rounded-lg p-6 border grid grid-cols-3 gap-4 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
                <div className="text-center">
                  <p className={`text-xs font-bold uppercase mb-2 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                    Total Active
                  </p>
                  <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {services.length}
                  </p>
                </div>
                <div className="text-center">
                  <p className={`text-xs font-bold uppercase mb-2 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                    Avg Revenue
                  </p>
                  <p className="text-3xl font-black text-red-600">
                    ₱{averageCost}
                  </p>
                </div>
                <div className="text-center">
                  <p className={`text-xs font-bold uppercase mb-2 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                    Showing
                  </p>
                  <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, services.length)}
                  </p>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto ${
              isDarkMode ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'
            }`}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingId ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button
                onClick={closeModal}
                className={`p-2 rounded-lg transition ${
                  isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-900'
                }`}
              >
                <CloseRoundedIcon />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={editingId ? handleUpdateService : handleAddService} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-white/60' : 'text-gray-700'}`}>
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
                <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-white/60' : 'text-gray-700'}`}>
                  Description
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

              {/* Icon Upload */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-white/60' : 'text-gray-700'}`}>
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
                  className={`w-full px-4 py-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 transition ${
                    isDarkMode
                      ? 'border-white/10 hover:border-red-600 hover:bg-red-600/10 text-white/60 hover:text-red-600'
                      : 'border-gray-300 hover:border-red-600 hover:bg-red-50 text-gray-600 hover:text-red-600'
                  }`}
                >
                  <CloudUploadRoundedIcon />
                  <span className="font-bold">{iconFile ? 'Change Icon' : 'Upload Icon'}</span>
                </button>

                {/* Icon Preview */}
                {iconPreview && (
                  <div className={`mt-4 p-4 rounded-lg text-center ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <p className={`text-xs font-bold uppercase mb-2 ${isDarkMode ? 'text-white/50' : 'text-gray-600'}`}>
                      Preview
                    </p>
                    <img
                      src={iconPreview}
                      alt="Icon preview"
                      className="w-16 h-16 object-contain mx-auto"
                    />
                  </div>
                )}
              </div>

              {/* Cost */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${isDarkMode ? 'text-white/60' : 'text-gray-700'}`}>
                  Cost (PHP)
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
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                <button
                  type="submit"
                  disabled={uploading || !iconFile}
                  className={`bg-red-600 text-white px-4 py-2 rounded-lg transition font-bold text-sm uppercase tracking-widest disabled:opacity-50 ${
                    !uploading && iconFile ? 'hover:bg-red-700' : ''
                  }`}
                >
                  {uploading ? 'Uploading...' : editingId ? 'Update Service' : 'Add Service'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-widest transition ${
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
        </div>
      )}
    </>
  )
}
