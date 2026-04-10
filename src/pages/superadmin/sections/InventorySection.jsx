import { useMemo, useState, useEffect } from 'react'
import { addDoc, collection, serverTimestamp, updateDoc, doc, deleteDoc, setDoc, getDocs } from 'firebase/firestore'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../../../firebase'
import ConfirmationModal from '../components/ConfirmationModal'
import './InventorySection.css'

const inventoryTabs = [
  { id: 'all', label: 'All' },
  { id: 'motorcycle-parts', label: 'Motorcycle Units' },
  { id: 'spare-parts', label: 'Spare Parts' },
  { id: 'archived', label: 'Deleted Items' },
]

const defaultItemForm = {
  name: '',
  model: '',
  category: 'Motorcycle Units',
  description: '',
  stock: '1',
  price: '',
  status: 'In Stock',
  badge: 'New Arrival',
  showInShowroom: true,
}

const normalizeText = (value = '') => String(value).trim().toLowerCase()

export default function InventorySection({
  items,
  canEditOperations,
  inventoryStatusOptions,
  handleCollectionUpdate,
  formatCurrency,
  categories = [],
  models = [],
  variants = [],
  currentUser = null,
  isDarkMode = true,
}) {
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false)
  const [isAddSparepartsModalOpen, setIsAddSparepartsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdateStocksModalOpen, setIsUpdateStocksModalOpen] = useState(false)
  const [isCriticalStockModalOpen, setIsCriticalStockModalOpen] = useState(false)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [itemForm, setItemForm] = useState(defaultItemForm)
  const [sparePartsForm, setSparePartsForm] = useState({ ...defaultItemForm, category: 'Spare Parts' })
  const [editingItem, setEditingItem] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [galleryFiles, setGalleryFiles] = useState([])
  const [galleryPreviews, setGalleryPreviews] = useState([])
  const [formMessage, setFormMessage] = useState(null)
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const [stockUpdates, setStockUpdates] = useState({})
  const [editFormData, setEditFormData] = useState({})
  const [selectedModel, setSelectedModel] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSparepartsModel, setSelectedSparepartsModel] = useState(null)
  const [selectedSparepartsCategory, setSelectedSparepartsCategory] = useState(null)
  const [editSelectedCategory, setEditSelectedCategory] = useState(null)
  const [editSelectedModel, setEditSelectedModel] = useState(null)
  const [editSelectedVariant, setEditSelectedVariant] = useState(null)
  const [editImageFile, setEditImageFile] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState('')
  const [editGalleryFiles, setEditGalleryFiles] = useState([])
  const [editGalleryPreviews, setEditGalleryPreviews] = useState([])
  const [stockSearchTerm, setStockSearchTerm] = useState('')
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, itemId: null })
  const [archivedItems, setArchivedItems] = useState([])
  const [stockNumberPadOpen, setStockNumberPadOpen] = useState(false)
  const [stockNumberPadValue, setStockNumberPadValue] = useState('')
  const [stockNumberPadItemId, setStockNumberPadItemId] = useState(null)

  // Load archived items for superadmin
  useEffect(() => {
    const loadArchivedItems = async () => {
      try {
        if (currentUser?.role === 'superadmin' || activeTab === 'archived') {
          const snapshot = await getDocs(collection(db, 'deleteArchived'))
          setArchivedItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        }
      } catch (error) {
        console.warn('Failed to load archived items', error)
      }
    }
    loadArchivedItems()
  }, [activeTab, currentUser])

  const getAutoStatus = (stock) => {
    const stockValue = Number(stock ?? 0)
    const maxStock = Math.max(...items.map((item) => Number(item.stock ?? 0)), 100)
    if (stockValue === 0) return 'Out of Stock'
    if (stockValue < maxStock * 0.2) return 'Low Stock'
    return 'In Stock'
  }

  const isCriticalStock = (stock) => {
    const stockValue = Number(stock ?? 0)
    const maxStock = Math.max(...items.map((item) => Number(item.stock ?? 0)), 100)
    return stockValue === 0 || stockValue < maxStock * 0.2
  }

  const filteredItems = useMemo(() => {
    // Show archived items when on archived tab
    if (activeTab === 'archived') {
      return archivedItems.filter((item) => {
        const searchHaystack = normalizeText(`${item.name} ${item.model} ${item.category} ${item.description} ${item.sku || ''}`)
        const searchMatch = !searchTerm || searchHaystack.includes(normalizeText(searchTerm))
        return searchMatch
      })
    }

    return items.filter((item) => {
      const searchHaystack = normalizeText(`${item.name} ${item.model} ${item.category} ${item.description} ${item.sku || ''}`)
      const searchMatch = !searchTerm || searchHaystack.includes(normalizeText(searchTerm))
      const statusMatch = statusFilter === 'all' || normalizeText(item.status) === normalizeText(statusFilter)

      if (!searchMatch || !statusMatch) {
        return false
      }

      if (activeTab === 'all') {
        return true
      }

      const categoryHaystack = normalizeText(`${item.name} ${item.category} ${item.description}`)

      if (activeTab === 'motorcycle-parts') {
        return /motor|engine|wheel|brake|frame|unit/.test(categoryHaystack)
      }

      if (activeTab === 'spare-parts') {
        return /spare|part|kit|filter|belt|bearing|plug/.test(categoryHaystack)
      }

      return true
    })
  }, [activeTab, items, archivedItems, searchTerm, statusFilter])

  const summaryCards = useMemo(() => {
    const totalUnits = items.reduce((sum, item) => sum + Number(item.stock ?? 0), 0)
    const maxStock = Math.max(...items.map((item) => Number(item.stock ?? 0)), 100)
    const criticalStock = items.filter((item) => {
      const stockValue = Number(item.stock ?? 0)
      return stockValue === 0 || stockValue < maxStock * 0.2
    }).length
    const partsMovement = items.length
      ? (items.reduce((sum, item) => sum + Number(item.stock ?? 0), 0) / Math.max(items.length, 1) / 10).toFixed(1)
      : '0.0'
    const uniqueCategories = new Set(items.map((item) => normalizeText(item.category || 'uncategorized'))).size

    return [
      { label: 'Total Stock Units', value: totalUnits.toLocaleString(), detail: `${items.length} SKUs monitored` },
      { label: 'Critical Stock', value: String(criticalStock), detail: 'Low inventory alerts', isCritical: true, onClick: () => setIsCriticalStockModalOpen(true) },
      { label: 'Parts Movement', value: partsMovement, detail: 'Avg stock velocity' },
      { label: 'Stock Groups', value: String(uniqueCategories), detail: 'Segments tracked' },
    ]
  }, [items])

  const handleFormChange = (event, formType = 'unit') => {
    const { name, value, type, checked } = event.target

    if (formType === 'unit') {
      setItemForm((current) => ({
        ...current,
        [name]: type === 'checkbox' ? checked : value,
      }))
    } else {
      setSparePartsForm((current) => ({
        ...current,
        [name]: type === 'checkbox' ? checked : value,
      }))
    }
    setFormMessage(null)
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : '')
    setFormMessage(null)
  }

  const handleGalleryImageChange = (event, index) => {
    const files = event.target.files
    if (!files || !files[0]) return

    const file = files[0]
    const newFiles = [...galleryFiles]
    const newPreviews = [...galleryPreviews]

    // Replace the image at the specific index
    newFiles[index] = file
    newPreviews[index] = URL.createObjectURL(file)

    setGalleryFiles(newFiles)
    setGalleryPreviews(newPreviews)
    setFormMessage(null)
  }

  const handleRemoveGalleryImageAtIndex = (index) => {
    const newFiles = [...galleryFiles]
    const newPreviews = [...galleryPreviews]

    if (newPreviews[index]) {
      URL.revokeObjectURL(newPreviews[index])
    }

    newFiles.splice(index, 1)
    newPreviews.splice(index, 1)

    setGalleryFiles(newFiles)
    setGalleryPreviews(newPreviews)
  }



  const handleOpenAddUnitModal = () => {
    setItemForm(defaultItemForm)
    setSelectedCategory(null)
    setSelectedModel(null)
    setSelectedVariant(null)
    setImageFile(null)
    setImagePreview('')
    setFormMessage(null)
    setIsAddUnitModalOpen(true)
  }

  const handleCloseAddUnitModal = () => {
    const hasUnsavedChanges = itemForm.name.trim() || itemForm.price || itemForm.stock !== '1' || imageFile
    if (hasUnsavedChanges) {
      setConfirmModal({ open: true, action: 'add-unit-cancel', itemId: 'unit' })
      return
    }
    setIsAddUnitModalOpen(false)
    setImageFile(null)
    setImagePreview('')
    setGalleryFiles([])
    setGalleryPreviews([])
    setFormMessage(null)
    setItemForm(defaultItemForm)
    setSelectedCategory(null)
    setSelectedModel(null)
    setSelectedVariant(null)
  }

  const handleOpenAddSparepartsModal = () => {
    setSparePartsForm({ ...defaultItemForm, category: 'Spare Parts' })
    setSelectedSparepartsCategory(null)
    setSelectedSparepartsModel(null)
    setImageFile(null)
    setImagePreview('')
    setFormMessage(null)
    setIsAddSparepartsModalOpen(true)
  }

  const handleCloseAddSparepartsModal = () => {
    const hasUnsavedChanges = sparePartsForm.name.trim() || sparePartsForm.price || sparePartsForm.stock !== '1' || imageFile
    if (hasUnsavedChanges) {
      setConfirmModal({ open: true, action: 'add-spare-parts-cancel', itemId: 'spare' })
      return
    }
    setIsAddSparepartsModalOpen(false)
    setImageFile(null)
    setImagePreview('')
    setGalleryFiles([])
    setGalleryPreviews([])
    setFormMessage(null)
    setSparePartsForm({ ...defaultItemForm, category: 'Spare Parts' })
    setSelectedSparepartsCategory(null)
    setSelectedSparepartsModel(null)
  }

  const handleCreateUnit = async (event) => {
    event.preventDefault()

    if (!canEditOperations) {
      setFormMessage({ type: 'error', text: 'Only staff-level access or higher can create inventory items.' })
      return
    }

    if (!itemForm.name.trim()) {
      setFormMessage({ type: 'error', text: 'Enter the unit name first.' })
      return
    }

    if (!selectedModel) {
      setFormMessage({ type: 'error', text: 'Please select a Model.' })
      return
    }

    if (!itemForm.price || Number(itemForm.price) < 0) {
      setFormMessage({ type: 'error', text: 'Enter a valid unit price.' })
      return
    }

    // Show confirmation dialog before proceeding
    setConfirmModal({ open: true, action: 'add-unit-confirm', itemId: 'unit' })
  }

  const handleProceedCreateUnit = async () => {
    setIsSavingItem(true)
    setFormMessage(null)

    try {
      let imageUrl = ''
      const galleryUrls = []

      if (imageFile) {
        const storageRef = ref(storage, `inventory/${Date.now()}-${imageFile.name}`)
        const uploadSnapshot = await uploadBytes(storageRef, imageFile)
        imageUrl = await getDownloadURL(uploadSnapshot.ref)
      }

      // Upload gallery images
      for (const galleryFile of galleryFiles) {
        const storageRef = ref(storage, `inventory/gallery/${Date.now()}-${Math.random()}-${galleryFile.name}`)
        const uploadSnapshot = await uploadBytes(storageRef, galleryFile)
        const galleryUrl = await getDownloadURL(uploadSnapshot.ref)
        galleryUrls.push(galleryUrl)
      }

      await addDoc(collection(db, 'inventory'), {
        name: itemForm.name.trim(),
        model: selectedModel.name,
        modelId: selectedModel.id,
        variant: selectedVariant?.name || '',
        variantId: selectedVariant?.id || '',
        category: 'Motorcycle Units',
        description: itemForm.description.trim(),
        stock: Number(itemForm.stock || 0),
        price: Number(itemForm.price || 0),
        status: itemForm.status,
        badge: itemForm.badge.trim() || 'New Arrival',
        imageUrl,
        gallery: imageUrl ? [imageUrl, ...galleryUrls] : galleryUrls,
        showInShowroom: Boolean(itemForm.showInShowroom),
        publishedToShowroom: Boolean(itemForm.showInShowroom),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Log the inventory addition
      try {
        await addDoc(collection(db, 'inventoryLogs'), {
          itemName: itemForm.name.trim(),
          itemModel: selectedModel.name,
          category: 'Motorcycle Units',
          stock: Number(itemForm.stock || 0),
          price: Number(itemForm.price || 0),
          status: itemForm.status,
          imageUrl: imageUrl || '',
          addedBy: currentUser?.displayName || currentUser?.email || 'Unknown',
          createdAt: serverTimestamp(),
        })
      } catch (logError) {
        console.warn('Unable to log inventory addition', logError)
      }

      setFormMessage({ type: 'success', text: 'Unit added successfully and synced to the showroom.' })
      window.setTimeout(() => {
        setIsAddUnitModalOpen(false)
        setImageFile(null)
        setImagePreview('')
        setGalleryFiles([])
        setGalleryPreviews([])
        setItemForm(defaultItemForm)
        setSelectedCategory(null)
        setSelectedModel(null)
        setSelectedVariant(null)
        handleCollectionUpdate()
      }, 1500)
    } catch (error) {
      console.error('Unable to create unit', error)
      setFormMessage({
        type: 'error',
        text: `Unable to add the unit. ${error.message}`,
      })
    } finally {
      setIsSavingItem(false)
    }
  }

  const handleCreateSpareParts = async (event) => {
    event.preventDefault()

    if (!canEditOperations) {
      setFormMessage({ type: 'error', text: 'Only staff-level access or higher can create inventory items.' })
      return
    }

    if (!sparePartsForm.name.trim()) {
      setFormMessage({ type: 'error', text: 'Enter the spare part name first.' })
      return
    }

    if (!selectedSparepartsModel) {
      setFormMessage({ type: 'error', text: 'Please select a Unit/Model.' })
      return
    }

    if (!sparePartsForm.price || Number(sparePartsForm.price) < 0) {
      setFormMessage({ type: 'error', text: 'Enter a valid spare part price.' })
      return
    }

    setIsSavingItem(true)
    setFormMessage(null)

    try {
      let imageUrl = ''

      if (imageFile) {
        const storageRef = ref(storage, `inventory/${Date.now()}-${imageFile.name}`)
        const uploadSnapshot = await uploadBytes(storageRef, imageFile)
        imageUrl = await getDownloadURL(uploadSnapshot.ref)
      }

      await addDoc(collection(db, 'inventory'), {
        name: sparePartsForm.name.trim(),
        model: selectedSparepartsModel.name,
        modelId: selectedSparepartsModel.id,
        category: 'Spare Parts',
        description: sparePartsForm.description.trim(),
        stock: Number(sparePartsForm.stock || 0),
        price: Number(sparePartsForm.price || 0),
        status: sparePartsForm.status,
        badge: sparePartsForm.badge.trim() || 'New Stock',
        imageUrl,
        gallery: imageUrl ? [imageUrl] : [],
        showInShowroom: Boolean(sparePartsForm.showInShowroom),
        publishedToShowroom: Boolean(sparePartsForm.showInShowroom),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Log the spare parts addition
      try {
        await addDoc(collection(db, 'inventoryLogs'), {
          itemName: sparePartsForm.name.trim(),
          itemModel: selectedSparepartsModel.name,
          category: 'Spare Parts',
          stock: Number(sparePartsForm.stock || 0),
          price: Number(sparePartsForm.price || 0),
          status: sparePartsForm.status,
          imageUrl: imageUrl || '',
          addedBy: currentUser?.displayName || currentUser?.email || 'Unknown',
          createdAt: serverTimestamp(),
        })
      } catch (logError) {
        console.warn('Unable to log inventory addition', logError)
      }

      setFormMessage({ type: 'success', text: 'Spare part added successfully and synced to the showroom.' })
      window.setTimeout(() => {
        handleCloseAddSparepartsModal()
      }, 600)
    } catch (error) {
      console.error('Unable to create spare part', error)
      setFormMessage({
        type: 'error',
        text: `Unable to add the spare part. ${error.message}`,
      })
    } finally {
      setIsSavingItem(false)
    }
  }

  const handleNumberPadConfirm = (itemId, currentStock) => {
    if (stockNumberPadValue === '') return
    const addedValue = Number(stockNumberPadValue)
    const newStock = currentStock + addedValue
    setStockUpdates({ ...stockUpdates, [itemId]: newStock })
    setStockNumberPadOpen(false)
    setStockNumberPadValue('')
    setStockNumberPadItemId(null)
  }

  const handleNumberPadAppend = (digit) => {
    setStockNumberPadValue(stockNumberPadValue + String(digit))
  }

  const handleNumberPadBackspace = () => {
    setStockNumberPadValue(stockNumberPadValue.slice(0, -1))
  }

  const handleConfirmDelete = async () => {
    const { itemId, item, action } = confirmModal

    // Handle add unit confirmation
    if (action === 'add-unit-confirm') {
      setConfirmModal({ open: false, action: null, itemId: null })
      await handleProceedCreateUnit()
      return
    }

    // Handle add unit cancel with unsaved changes
    if (action === 'add-unit-cancel') {
      setConfirmModal({ open: false, action: null, itemId: null })
      setIsAddUnitModalOpen(false)
      setImageFile(null)
      setImagePreview('')
      setGalleryFiles([])
      setGalleryPreviews([])
      setFormMessage(null)
      setItemForm(defaultItemForm)
      setSelectedCategory(null)
      setSelectedModel(null)
      setSelectedVariant(null)
      return
    }

    // Handle add spare parts cancel with unsaved changes
    if (action === 'add-spare-parts-cancel') {
      setConfirmModal({ open: false, action: null, itemId: null })
      setIsAddSparepartsModalOpen(false)
      setImageFile(null)
      setImagePreview('')
      setGalleryFiles([])
      setGalleryPreviews([])
      setFormMessage(null)
      setSparePartsForm({ ...defaultItemForm, category: 'Spare Parts' })
      setSelectedSparepartsCategory(null)
      setSelectedSparepartsModel(null)
      return
    }

    // Handle update stocks cancel with unsaved changes
    if (action === 'update-stocks-cancel') {
      setConfirmModal({ open: false, action: null, itemId: null })
      setIsUpdateStocksModalOpen(false)
      setStockUpdates({})
      setStockSearchTerm('')
      return
    }

    // Handle update stocks confirmation
    if (action === 'update-stocks') {
      setConfirmModal({ open: false, action: null, itemId: null })
      setIsSavingItem(true)
      try {
        for (const itemId of Object.keys(stockUpdates)) {
          if (stockUpdates[itemId]) {
            await updateDoc(doc(db, 'inventory', itemId), {
              stock: Number(stockUpdates[itemId]),
              updatedAt: serverTimestamp(),
            })
          }
        }
        setFormMessage({ type: 'success', text: 'Stock levels updated successfully!' })
        window.setTimeout(() => {
          setIsUpdateStocksModalOpen(false)
          setStockUpdates({})
          setStockSearchTerm('')
          handleCollectionUpdate()
        }, 1500)
      } catch (error) {
        console.error('Error updating stocks:', error)
        setFormMessage({ type: 'error', text: `Failed to update stocks. ${error.message}` })
      } finally {
        setIsSavingItem(false)
      }
      return
    }

    // Handle edit cancel
    if (action === 'edit-cancel') {
      setConfirmModal({ open: false, action: null, itemId: null })
      setIsEditModalOpen(false)
      setEditFormData({})
      setEditingItem(null)
      return
    }

    // Handle edit update
    if (action === 'edit-update') {
      setConfirmModal({ open: false, action: null, itemId: null })
      await handleUpdateItem()
      return
    }

    // Handle delete
    setConfirmModal({ open: false, action: null, itemId: null })

    try {
      const isSuperAdmin = currentUser?.role === 'superadmin'

      if (isSuperAdmin) {
        // Superadmin: permanently delete from inventory
        await deleteDoc(doc(db, 'inventory', itemId))
        setFormMessage({ type: 'success', text: 'Item permanently deleted.' })
      } else {
        // Regular user: move to deleteArchived collection
        const deletedItemData = {
          ...item,
          deletedAt: serverTimestamp(),
          deletedBy: currentUser?.displayName || currentUser?.email || 'Unknown',
        }
        
        await setDoc(doc(db, 'deleteArchived', itemId), deletedItemData)
        await deleteDoc(doc(db, 'inventory', itemId))
        setFormMessage({ type: 'success', text: 'Item moved to archive. Only superadmin can permanently delete.' })
      }

      handleCollectionUpdate()
    } catch (error) {
      console.error('Error deleting item:', error)
      setFormMessage({ type: 'error', text: `Failed to delete item. ${error.message}` })
    }
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return

    setIsSavingItem(true)
    try {
      const itemDocRef = doc(db, 'inventory', editingItem.id)
      let imageUrl = editingItem.imageUrl
      const galleryUrls = [...(editingItem.gallery || [])]

      // Upload new main image if provided
      if (editImageFile) {
        const storageRef = ref(storage, `inventory/${Date.now()}-${editImageFile.name}`)
        const uploadSnapshot = await uploadBytes(storageRef, editImageFile)
        imageUrl = await getDownloadURL(uploadSnapshot.ref)
      }

      // Upload new gallery images
      for (let i = 0; i < editGalleryFiles.length; i++) {
        if (editGalleryFiles[i]) {
          const storageRef = ref(storage, `inventory/gallery/${Date.now()}-${Math.random()}-${editGalleryFiles[i].name}`)
          const uploadSnapshot = await uploadBytes(storageRef, editGalleryFiles[i])
          const galleryUrl = await getDownloadURL(uploadSnapshot.ref)
          galleryUrls[i] = galleryUrl
        }
      }

      const updateData = {
        name: editFormData.name ?? editingItem.name,
        model: editFormData.model ?? editingItem.model,
        modelId: editFormData.modelId ?? editingItem.modelId,
        variant: editFormData.variant ?? editingItem.variant ?? '',
        variantId: editFormData.variantId ?? editingItem.variantId ?? '',
        stock: Number(editFormData.stock ?? editingItem.stock ?? 0),
        price: Number(editFormData.price ?? editingItem.price ?? 0),
        description: editFormData.description ?? editingItem.description ?? '',
        imageUrl,
        gallery: galleryUrls.filter(Boolean),
        updatedAt: serverTimestamp(),
      }

      await updateDoc(itemDocRef, updateData)
      setFormMessage({ type: 'success', text: 'Item updated successfully.' })
      setIsEditModalOpen(false)
      setEditFormData({})
      setEditingItem(null)
      setEditImageFile(null)
      setEditImagePreview('')
      setEditGalleryFiles([])
      setEditGalleryPreviews([])
      setEditSelectedModel(null)
      setEditSelectedVariant(null)
      handleCollectionUpdate()
    } catch (error) {
      console.error('Error updating item:', error)
      setFormMessage({ type: 'error', text: `Failed to update item. ${error.message}` })
    } finally {
      setIsSavingItem(false)
    }
  }

  return (
    <section className="inventory-control-shell space-y-6">
      <div className="inventory-control-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="inventory-control-title font-['Epilogue'] text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            Inventory <span>Control</span>
          </h2>
          <p className="mt-2 text-sm text-white/45">Manage fleet stock and precision parts.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setIsUpdateStocksModalOpen(true)}
            disabled={!canEditOperations}
            className="inventory-add-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
          >
            Update Stocks
          </button>
  
          <button
            type="button"
            onClick={handleOpenAddUnitModal}
            disabled={!canEditOperations}
            className="inventory-add-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
          >
            <AddRoundedIcon sx={{ fontSize: 18 }} />
            Add Unit
          </button>

          <button
            type="button"
            onClick={handleOpenAddSparepartsModal}
            disabled={!canEditOperations}
            className="inventory-add-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
          >
            <AddRoundedIcon sx={{ fontSize: 18 }} />
            Add Spare Parts
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article 
            key={card.label} 
            className={`inventory-summary-card rounded-2xl p-4 ${card.isCritical ? 'cursor-pointer hover:border-[#e10100]/50 transition-all' : ''}`}
            onClick={card.onClick}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">{card.label}</p>
            <h3 className="mt-3 font-['Epilogue'] text-3xl font-black text-white">{card.value}</h3>
            <p className="mt-2 text-xs text-white/45">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="inventory-board rounded-[28px] p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inventory-tab-row flex flex-wrap gap-2">
              {inventoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inventory-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <label className="inventory-search-box flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 flex-1">
              <SearchRoundedIcon sx={{ fontSize: 18 }} style={{ color: 'rgba(255,255,255,0.5)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, model, SKU..."
                className="flex-1 border-0 bg-transparent text-sm text-white placeholder-white/40 outline-none"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="inventory-filter-button inline-flex items-center rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] h-10 border border-white/10 bg-white/4"
            >
              <option value="all">All Status</option>
              {inventoryStatusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="hidden grid-cols-[0.8fr_0.8fr_1fr_2fr_1.1fr_1.1fr_1fr_0.8fr] gap-3 border-b border-white/5 px-3 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/35 md:grid">
          <span>Image</span>
          <span>Code</span>
          <span>Category</span>
          <span>Name / Model</span>
          <span>Stock Level</span>
          <span>Status</span>
          <span>Price</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="divide-y divide-white/5">
          {filteredItems.map((item, index) => {
            const stockValue = Number(item.stock ?? 0)
            const maxStock = Math.max(...items.map((item) => Number(item.stock ?? 0)), 100)
            const stockPercentage = (stockValue / maxStock) * 100
            const autoStatus = getAutoStatus(stockValue)
            const isCritical = isCriticalStock(stockValue)
            const stockWidth = Math.max(8, Math.min(100, stockPercentage))
            const itemCode = String(item.sku || item.id || `ITM-${index + 1}`).slice(0, 8).toUpperCase()

            return (
              <div key={item.id} className={`grid gap-3 px-3 py-4 md:grid-cols-[0.8fr_0.8fr_1fr_2fr_1.1fr_1.1fr_1fr_0.8fr] md:items-center relative ${
                isCritical ? 'bg-red-950/20 border-l-4 border-[#e10100]' : ''
              }`}>
                {stockValue === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded pointer-events-none">
                    <span className="text-lg font-black text-white uppercase tracking-widest">Out of Stock</span>
                  </div>
                )}
                
                <div className="h-20 w-20 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-white/30 text-xs text-center px-1 font-bold">No Image</div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">{itemCode}</p>
                </div>

                <div>
                  <span className="inventory-category-pill inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
                    {item.category || 'General'}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-bold text-white">{item.name || 'Inventory Item'}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{item.model || item.description || 'Precision stock'}</p>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-white/65">
                    <span>{stockValue} units</span>
                  </div>
                  <div className="inventory-stock-bar h-1.5 overflow-hidden rounded-full">
                    <div className={`inventory-stock-fill h-full rounded-full ${
                      stockValue === 0 ? 'bg-[#ff3b30]' : stockValue < maxStock * 0.2 ? 'bg-[#ff9500]' : 'bg-linear-to-r from-emerald-500 to-emerald-400'
                    }`} style={{ width: `${stockWidth}%` }} />
                  </div>
                </div>

                <div>
                  <span className={`text-xs font-bold ${stockValue === 0 ? 'text-[#ff3b30]' : stockValue < maxStock * 0.2 ? 'text-[#ff9500]' : 'text-emerald-400'}`}>
                    {autoStatus}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-bold text-white">{formatCurrency(item.price ?? 0)}</p>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActionMenuOpen(actionMenuOpen === item.id ? null : item.id)}
                    className="inventory-action-button inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    aria-label={`Actions for ${item.name || item.id}`}
                  >
                    <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                  </button>
                  
                  {actionMenuOpen === item.id && (
                    <div className="inventory-action-dropdown absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-lg z-10 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item)
                          setEditFormData({})
                          setEditImageFile(null)
                          setEditImagePreview('')
                          setEditGalleryFiles([])
                          setEditGalleryPreviews([])
                          const modelItem = models.find(m => m.id === item.modelId)
                          const variantItem = variants.find(v => v.id === item.variantId)
                          setEditSelectedModel(modelItem || null)
                          setEditSelectedVariant(variantItem || null)
                          setIsEditModalOpen(true)
                          setActionMenuOpen(null)
                        }}
                        className="inventory-action-item inline-flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                        aria-label={`Edit ${item.name || item.id}`}
                      >
                        <EditRoundedIcon sx={{ fontSize: 14 }} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmModal({ open: true, action: 'delete', itemId: item.id, itemName: item.name, item })
                          setActionMenuOpen(null)
                        }}
                        className="inventory-action-item inline-flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-[#ff6a63] hover:bg-red-950/30 transition-colors"
                        aria-label={`Delete ${item.name || item.id}`}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {!filteredItems.length && (
            <div className="inventory-empty rounded-2xl px-4 py-10 text-center text-white/50">
              No inventory items match this view yet.
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-white/40">
          <span>Showing {filteredItems.length} of {items.length} results</span>
          <span>Synced live from `inventory`</span>
        </div>
      </div>

      {isAddUnitModalOpen && (
        <div className="inventory-modal-overlay">
          <button type="button" className="inventory-modal-backdrop" onClick={handleCloseAddUnitModal} aria-label="Close add unit modal" />

          <div className={`inventory-modal-panel scrollable-modal-panel ${!isDarkMode ? 'light-mode' : ''}`}>
            <div className="inventory-modal-header sticky top-0 bg-inherit z-10 pb-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="inventory-modal-kicker">Live Inventory Entry</p>
                  <h3 className="inventory-modal-title">Add Unit</h3>
                  <p className={`inventory-modal-copy ${!isDarkMode ? 'light-mode-text' : ''}`}>Create a new motorcycle unit, upload an image, and publish it to the showroom in one step.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseAddUnitModal}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0 ml-3"
                >
                  <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateUnit} className="inventory-modal-form">
              <div className="inventory-modal-grid">
                <label className="inventory-field">
                  <span>Unit Name</span>
                  <input type="text" name="name" value={itemForm.name} onChange={(e) => handleFormChange(e, 'unit')} placeholder="Yamaha NMAX" />
                </label>

                <label className="inventory-field">
                  <span>Category</span>
                  <select 
                    value={selectedCategory?.id || ''} 
                    onChange={(e) => {
                      const category = categories.find(c => c.id === e.target.value)
                      setSelectedCategory(category || null)
                    }}
                    className="dropdown-select"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>

                <label className="inventory-field">
                  <span>Model</span>
                  <select 
                    value={selectedModel?.id || ''} 
                    onChange={(e) => {
                      const model = models.find(m => m.id === e.target.value)
                      setSelectedModel(model || null)
                    }}
                    className="dropdown-select"
                  >
                    <option value="">Select Model...</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </label>

                <label className="inventory-field">
                  <span>Variant (Optional)</span>
                  <select 
                    value={selectedVariant?.id || ''} 
                    onChange={(e) => {
                      const variant = variants.find(v => v.id === e.target.value)
                      setSelectedVariant(variant || null)
                    }}
                    className="dropdown-select"
                  >
                    <option value="">Select Variant...</option>
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>{variant.name}</option>
                    ))}
                  </select>
                </label>

                <label className="inventory-field">
                  <span>Status</span>
                  <select name="status" value={itemForm.status} onChange={(e) => handleFormChange(e, 'unit')} className="dropdown-select">
                    {inventoryStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className="inventory-field">
                  <span>Stock</span>
                  <input type="number" name="stock" min="0" value={itemForm.stock} onChange={(e) => handleFormChange(e, 'unit')} placeholder="10" />
                </label>

                <label className="inventory-field">
                  <span>Price</span>
                  <input 
                    type="number" 
                    name="price" 
                    value={itemForm.price} 
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                      handleFormChange({ target: { name: 'price', type: 'text', value: String(val) } }, 'unit')
                    }} 
                    placeholder="145000" 
                  />
                </label>
              </div>

              <label className="inventory-field">
                <span>Description</span>
                <textarea name="description" value={itemForm.description} onChange={(e) => handleFormChange(e, 'unit')} rows="3" placeholder="Add a short description for the showroom and inventory listing." />
              </label>

              <div className="inventory-modal-grid inventory-modal-grid--secondary">
                <label className="inventory-field">
                  <span>Badge</span>
                  <input type="text" name="badge" value={itemForm.badge} onChange={(e) => handleFormChange(e, 'unit')} placeholder="New Arrival" />
                </label>

                <label className="inventory-field inventory-checkbox-field">
                  <span>Showroom Visibility</span>
                  <label className="inventory-checkbox-row">
                    <input type="checkbox" name="showInShowroom" checked={itemForm.showInShowroom} onChange={(e) => handleFormChange(e, 'unit')} />
                    <span>Display this unit in the public showroom</span>
                  </label>
                </label>
              </div>

              <label className="inventory-upload-box">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <span className="inventory-upload-icon"><CloudUploadRoundedIcon sx={{ fontSize: 20 }} /></span>
                <span className="inventory-upload-title">Upload Unit Image</span>
                <span className="inventory-upload-copy">PNG, JPG, or WEBP — used in the showroom and inventory listing.</span>
              </label>

              {imagePreview && (
                <div className="inventory-image-preview max-w-full">
                  <img src={imagePreview} alt="Unit preview" className="max-h-48 w-auto rounded-2xl object-contain mx-auto" />
                </div>
              )}

              <div className="inventory-gallery-upload-section">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/62 mb-3">Sub Images (Gallery) - Up to 4 images</p>
                <div className="grid grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((index) => (
                    <label key={index} className="inventory-gallery-upload-box">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleGalleryImageChange(e, index)}
                        className="hidden"
                      />
                      {galleryPreviews[index] ? (
                        <div className="relative group h-full">
                          <img
                            src={galleryPreviews[index]}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full rounded-lg object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                handleRemoveGalleryImageAtIndex(index)
                              }}
                              className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
                              aria-label="Remove image"
                            >
                              <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                            </button>
                            <span className="text-white text-xs font-bold">Replace</span>
                          </div>
                        </div>
                      ) : (
                        <div className="inventory-gallery-upload-placeholder">
                          <CloudUploadRoundedIcon sx={{ fontSize: 24 }} className="text-white/40" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 text-center">Image {index + 1}</span>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {formMessage && (
                <div className={`inventory-form-message ${formMessage.type === 'error' ? 'is-error' : 'is-success'}`}>
                  {formMessage.text}
                </div>
              )}

              <div className="inventory-modal-actions">
                <button type="submit" disabled={isSavingItem} className="inventory-submit-button inline-flex items-center justify-center gap-2">
                  <SaveRoundedIcon sx={{ fontSize: 18 }} />
                  {isSavingItem ? 'Saving Unit...' : 'Save Unit'}
                </button>
                <button type="button" onClick={handleCloseAddUnitModal} className="inventory-cancel-button">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddSparepartsModalOpen && (
        <div className="inventory-modal-overlay">
          <button type="button" className="inventory-modal-backdrop" onClick={handleCloseAddSparepartsModal} aria-label="Close add spare parts modal" />

          <div className={`inventory-modal-panel scrollable-modal-panel ${!isDarkMode ? 'light-mode' : ''}`}>
            <div className="inventory-modal-header sticky top-0 bg-inherit z-10 pb-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="inventory-modal-kicker">Live Inventory Entry</p>
                  <h3 className="inventory-modal-title">Add Spare Parts</h3>
                  <p className={`inventory-modal-copy ${!isDarkMode ? 'light-mode-text' : ''}`}>Create a new spare part record, upload an image, and publish it to the showroom in one step.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseAddSparepartsModal}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0 ml-3"
                >
                  <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSpareParts} className="inventory-modal-form">
              <div className="inventory-modal-grid">
                <label className="inventory-field">
                  <span>Spare Part Name</span>
                  <input type="text" name="name" value={sparePartsForm.name} onChange={(e) => handleFormChange(e, 'spareparts')} placeholder="Engine Filter" />
                </label>

                <label className="inventory-field">
                  <span>Category</span>
                  <select 
                    value={selectedSparepartsCategory?.id || ''} 
                    onChange={(e) => {
                      const category = categories.find(c => c.id === e.target.value)
                      setSelectedSparepartsCategory(category || null)
                    }}
                    className="dropdown-select"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>

                <label className="inventory-field">
                  <span>Unit/Model</span>
                  <select 
                    value={selectedSparepartsModel?.id || ''} 
                    onChange={(e) => {
                      const model = models.find(m => m.id === e.target.value)
                      setSelectedSparepartsModel(model || null)
                    }}
                    className="dropdown-select"
                  >
                    <option value="">Select Unit/Model...</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </label>

                <label className="inventory-field">
                  <span>Status</span>
                  <select name="status" value={sparePartsForm.status} onChange={(e) => handleFormChange(e, 'spareparts')} className="dropdown-select">
                    {inventoryStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className="inventory-field">
                  <span>Stock</span>
                  <input type="number" name="stock" min="0" value={sparePartsForm.stock} onChange={(e) => handleFormChange(e, 'spareparts')} placeholder="10" />
                </label>

                <label className="inventory-field">
                  <span>Price</span>
                  <input 
                    type="number" 
                    name="price" 
                    value={sparePartsForm.price} 
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                      handleFormChange({ target: { name: 'price', type: 'text', value: String(val) } }, 'spareparts')
                    }} 
                    placeholder="25000" 
                  />
                </label>
              </div>

              <label className="inventory-field">
                <span>Description</span>
                <textarea name="description" value={sparePartsForm.description} onChange={(e) => handleFormChange(e, 'spareparts')} rows="3" placeholder="Add a short description for the showroom and inventory listing." />
              </label>

              <div className="inventory-modal-grid inventory-modal-grid--secondary">
                <label className="inventory-field">
                  <span>Badge</span>
                  <input type="text" name="badge" value={sparePartsForm.badge} onChange={(e) => handleFormChange(e, 'spareparts')} placeholder="New Stock" />
                </label>

                <label className="inventory-field inventory-checkbox-field">
                  <span>Showroom Visibility</span>
                  <label className="inventory-checkbox-row">
                    <input type="checkbox" name="showInShowroom" checked={sparePartsForm.showInShowroom} onChange={(e) => handleFormChange(e, 'spareparts')} />
                    <span>Display this spare part in the public showroom</span>
                  </label>
                </label>
              </div>

              <label className="inventory-upload-box">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <span className="inventory-upload-icon"><CloudUploadRoundedIcon sx={{ fontSize: 20 }} /></span>
                <span className="inventory-upload-title">Upload Spare Part Image</span>
                <span className="inventory-upload-copy">PNG, JPG, or WEBP — used in the showroom and inventory listing.</span>
              </label>

              {imagePreview && (
                <div className="inventory-image-preview max-w-full">
                  <img src={imagePreview} alt="Spare part preview" className="max-h-48 w-auto rounded-2xl object-contain mx-auto" />
                </div>
              )}

              {formMessage && (
                <div className={`inventory-form-message ${formMessage.type === 'error' ? 'is-error' : 'is-success'}`}>
                  {formMessage.text}
                </div>
              )}

              <div className="inventory-modal-actions">
                <button type="submit" disabled={isSavingItem} className="inventory-submit-button inline-flex items-center justify-center gap-2">
                  <SaveRoundedIcon sx={{ fontSize: 18 }} />
                  {isSavingItem ? 'Saving Spare Part...' : 'Save Spare Part'}
                </button>
                <button type="button" onClick={handleCloseAddSparepartsModal} className="inventory-cancel-button">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isCriticalStockModalOpen && (
        <div className="inventory-modal-overlay">
          <button type="button" className="inventory-modal-backdrop" onClick={() => setIsCriticalStockModalOpen(false)} />
          <div className={`inventory-modal-panel ${!isDarkMode ? 'light-mode' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="inventory-modal-title">Critical Stock Items</h3>
              <button
                type="button"
                onClick={() => setIsCriticalStockModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
            <p className={`inventory-modal-copy ${!isDarkMode ? 'light-mode-text' : ''}`}>Items with stock below 20% threshold or out of stock.</p>
            <div className="mt-5 space-y-3 max-h-96 overflow-y-auto">
              {items.filter((item) => isCriticalStock(Number(item.stock ?? 0))).map((item) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${!isDarkMode ? 'bg-gray-50 border-gray-200' : 'bg-white/4 border-white/10'}`}>
                  <div className={`h-16 w-16 rounded-lg overflow-hidden flex items-center justify-center shrink-0 ${!isDarkMode ? 'bg-gray-200' : 'bg-white/5'}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className={`text-xs text-center font-bold ${!isDarkMode ? 'text-gray-400' : 'text-white/30'}`}>No Image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${!isDarkMode ? 'text-gray-900' : 'text-white'}`}>{item.name}</p>
                    <p className={`text-xs ${!isDarkMode ? 'text-gray-500' : 'text-white/50'}`}>{Number(item.stock ?? 0)} units • {getAutoStatus(Number(item.stock ?? 0))}</p>
                  </div>
                  <span className={`text-xs font-black ${
                    Number(item.stock ?? 0) === 0 ? 'text-[#ff3b30]' : 'text-[#ff9500]'
                  }`}>
                    {getAutoStatus(Number(item.stock ?? 0))}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsCriticalStockModalOpen(false)}
              className={`inventory-cancel-button mt-5 w-full border rounded-full px-4 py-2 text-xs font-bold transition-colors ${!isDarkMode ? 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50' : 'border-white/10 text-white hover:bg-white/5'}`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isUpdateStocksModalOpen && (
        <div className="inventory-modal-overlay">
          <button type="button" className="inventory-modal-backdrop" onClick={() => {
            const hasChanges = Object.values(stockUpdates).some(val => val)
            if (hasChanges) {
              setConfirmModal({ open: true, action: 'update-stocks-cancel', itemId: 'stocks' })
            } else {
              setIsUpdateStocksModalOpen(false)
            }
          }} />
          <div className={`inventory-modal-panel update-stocks-modal ${!isDarkMode ? 'light-mode' : ''}`}>
            <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-inherit pb-3 border-b border-white/5">
              <h3 className="inventory-modal-title">Update Stock Levels</h3>
              <button
                type="button"
                onClick={() => {
                  const hasChanges = Object.values(stockUpdates).some(val => val)
                  if (hasChanges) {
                    setConfirmModal({ open: true, action: 'update-stocks-cancel', itemId: 'stocks' })
                  } else {
                    setIsUpdateStocksModalOpen(false)
                  }
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>

            <div className="update-stocks-container">
              {/* Left Panel - Items */}
              <div className="update-stocks-left flex flex-col">
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${!isDarkMode ? 'text-gray-600' : 'text-white/60'}`}>Adjust individual item quantities (increase only)</p>
                
                <div className={`update-stocks-search mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 ${!isDarkMode ? 'border-gray-300 bg-gray-50' : 'border-white/10 bg-white/4'}`}>
                  <SearchRoundedIcon sx={{ fontSize: 16 }} style={{ color: !isDarkMode ? '#666' : 'rgba(255,255,255,0.5)' }} />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={stockSearchTerm}
                    onChange={(e) => setStockSearchTerm(e.target.value)}
                    className={`flex-1 border-0 bg-transparent text-sm outline-none ${!isDarkMode ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-white/40'}`}
                  />
                </div>

                <div className="update-stocks-items space-y-2 max-h-64 overflow-y-auto">
                  {items.filter((item) => {
                    const searchNormalized = stockSearchTerm.toLowerCase().trim()
                    if (!searchNormalized) return true
                    const itemText = `${item.name} ${item.model} ${item.category}`.toLowerCase()
                    return itemText.includes(searchNormalized)
                  }).map((item) => (
                    <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${!isDarkMode ? 'bg-gray-50 border-gray-200' : 'bg-white/4 border-white/10'}`}>
                      <div className={`h-14 w-14 rounded-lg overflow-hidden shrink-0 ${!isDarkMode ? 'bg-gray-200' : 'bg-white/5'}`}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className={`h-full w-full flex items-center justify-center text-xs font-bold ${!isDarkMode ? 'bg-gray-300 text-gray-600' : 'text-white/30'}`}>No Image</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${!isDarkMode ? 'text-gray-900' : 'text-white'}`}>{item.name}</p>
                        <p className={`text-xs ${!isDarkMode ? 'text-gray-500' : 'text-white/50'}`}>{Number(item.stock ?? 0)} units</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStockNumberPadItemId(item.id)
                            setStockNumberPadValue('')
                            setStockNumberPadOpen(true)
                          }}
                          className={`w-16 px-2 py-1 text-sm rounded border text-center font-bold cursor-pointer transition-colors ${!isDarkMode ? 'border-gray-300 bg-white text-gray-900 hover:bg-gray-100' : 'border-white/10 bg-white/4 text-white hover:bg-white/8'}`}
                        >
                          {stockUpdates[item.id] ?? item.stock ?? 0}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel - Modified Summary */}
              <div className="update-stocks-right flex flex-col">
                <div className={`rounded-lg border p-4 flex-1 flex flex-col ${!isDarkMode ? 'bg-gray-50 border-gray-200' : 'bg-white/4 border-white/10'}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${!isDarkMode ? 'text-gray-600' : 'text-white/60'}`}>Changes Summary</p>
                  
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {items.map((item) => {
                      const newStock = stockUpdates[item.id] ?? item.stock ?? 0
                      const oldStock = item.stock ?? 0
                      const diff = Number(newStock) - Number(oldStock)
                      if (diff === 0) return null
                      return (
                        <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${!isDarkMode ? 'bg-white border-gray-200' : 'bg-white/4 border-white/10'}`}>
                          <div className="flex-1">
                            <p className={`text-xs font-bold uppercase ${!isDarkMode ? 'text-gray-600' : 'text-white/50'}`}>{item.name}</p>
                            <p className={`text-sm font-bold ${!isDarkMode ? 'text-gray-900' : 'text-white'}`}>{oldStock} → {newStock} units</p>
                          </div>
                          <span className={`text-sm font-black ml-2 ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-[#ff3b30]' : ''}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className={`mt-auto pt-3 border-t ${!isDarkMode ? 'border-gray-300' : 'border-white/10'}`}>
                    <p className={`text-xs font-bold uppercase ${!isDarkMode ? 'text-gray-600' : 'text-white/60'} mb-2`}>Ready to update</p>
                    <p className={`text-lg font-black ${!isDarkMode ? 'text-gray-900' : 'text-white'}`}>
                      {Object.values(stockUpdates).filter((val) => val).length} change(s)
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    className="inventory-submit-button flex-1 inline-flex items-center justify-center gap-2 py-2"
                    onClick={() => {
                      const hasChanges = Object.values(stockUpdates).some(val => val)
                      if (hasChanges) {
                        setConfirmModal({ open: true, action: 'update-stocks', itemId: 'stocks' })
                      }
                    }}
                  >
                    <SaveRoundedIcon sx={{ fontSize: 16 }} />
                    Confirm Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const hasChanges = Object.values(stockUpdates).some(val => val)
                      if (hasChanges) {
                        setConfirmModal({ open: true, action: 'update-stocks-cancel', itemId: 'stocks' })
                      } else {
                        setIsUpdateStocksModalOpen(false)
                      }
                    }}
                    className={`flex-1 border rounded-full px-4 py-2 text-xs font-bold transition-colors ${!isDarkMode ? 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50' : 'border-white/10 text-white hover:bg-white/5'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingItem && (
        <div className="inventory-modal-overlay">
          <button type="button" className="inventory-modal-backdrop" onClick={() => {
            const hasChanges = JSON.stringify(editFormData) !== '{}'
            if (hasChanges) {
              setConfirmModal({ open: true, action: 'edit-cancel', itemId: editingItem.id })
            } else {
              setIsEditModalOpen(false)
              setEditFormData({})
            }
          }} aria-label="Close edit modal" />

          <div className={`inventory-modal-panel scrollable-modal-panel ${!isDarkMode ? 'light-mode' : ''}`}>
            <div className="inventory-modal-header sticky top-0 bg-inherit z-10 pb-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="inventory-modal-kicker">Live Inventory Update</p>
                  <h3 className="inventory-modal-title">Edit Item</h3>
                  <p className={`inventory-modal-copy ${!isDarkMode ? 'light-mode-text' : ''}`}>Update item details. Stock and Status are locked and cannot be changed in edit mode.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const hasChanges = JSON.stringify(editFormData) !== '{}'
                    if (hasChanges) {
                      setConfirmModal({ open: true, action: 'edit-cancel', itemId: editingItem.id })
                    } else {
                      setIsEditModalOpen(false)
                      setEditFormData({})
                    }
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0 ml-3"
                >
                  <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </button>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setConfirmModal({ open: true, action: 'edit-update', itemId: editingItem.id }) }} className="inventory-modal-form">
              <div className="inventory-modal-grid">
                <label className="inventory-field">
                  <span>Item Name</span>
                  <input 
                    type="text" 
                    value={editFormData.name ?? editingItem?.name ?? ''} 
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} 
                    placeholder="Item name"
                  />
                </label>

                <label className="inventory-field">
                  <span>Category</span>
                  <select 
                    value={editSelectedCategory?.id || editingItem?.categoryId || ''}
                    onChange={(e) => {
                      const cat = categories.find(c => c.id === e.target.value)
                      setEditSelectedCategory(cat || null)
                      setEditFormData({ ...editFormData, categoryId: e.target.value })
                    }}
                    className="dropdown-select"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </label>

                <label className="inventory-field">
                  <span>Model</span>
                  <select 
                    value={editSelectedModel?.id || editingItem?.modelId || ''}
                    onChange={(e) => {
                      const model = models.find(m => m.id === e.target.value)
                      setEditSelectedModel(model || null)
                      setEditFormData({ ...editFormData, model: model?.name || '', modelId: e.target.value })
                    }}
                    className="dropdown-select"
                  >
                    <option value="">Select Model...</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </label>

                <label className="inventory-field">
                  <span>Variant (Optional)</span>
                  <select 
                    value={editSelectedVariant?.id || editingItem?.variantId || ''}
                    onChange={(e) => {
                      const variant = variants.find(v => v.id === e.target.value)
                      setEditSelectedVariant(variant || null)
                      setEditFormData({ ...editFormData, variant: variant?.name || '', variantId: e.target.value })
                    }}
                    className="dropdown-select"
                  >
                    <option value="">Select Variant...</option>
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>{variant.name}</option>
                    ))}
                  </select>
                </label>

                <label className="inventory-field">
                  <span>Status</span>
                  <input 
                    type="text"
                    value={editingItem?.status ?? ''}
                    disabled
                    className="dropdown-select opacity-60 cursor-not-allowed"
                  />
                </label>

                <label className="inventory-field">
                  <span>Stock</span>
                  <input 
                    type="number"
                    value={editingItem?.stock ?? 0}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                </label>

                <label className="inventory-field">
                  <span>Price</span>
                  <input 
                    type="number"
                    value={editFormData.price !== undefined ? editFormData.price : (editingItem?.price ?? '')}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                      setEditFormData({ ...editFormData, price: val })
                    }}
                    placeholder="0"
                  />
                </label>
              </div>

              <label className="inventory-field">
                <span>Description</span>
                <textarea 
                  value={editFormData.description ?? editingItem?.description ?? ''} 
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows="3" 
                  placeholder="Add item details."
                />
              </label>

              {editingItem.imageUrl || editImagePreview ? (
                <div className="inventory-image-preview max-w-full">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/62 mb-3">Main Image</p>
                  <div className="relative group inline-block">
                    <img src={editImagePreview || editingItem.imageUrl} alt={editingItem.name} className="max-h-48 w-auto rounded-2xl object-contain mx-auto" />
                    <label className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setEditImageFile(file)
                            setEditImagePreview(URL.createObjectURL(file))
                            setEditFormData({ ...editFormData, imageFile: file })
                          }
                        }}
                        className="hidden"
                      />
                      <span className="text-white text-sm font-bold">Replace Image</span>
                    </label>
                  </div>
                </div>
              ) : (
                <label className="inventory-upload-box">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setEditImageFile(file)
                        setEditImagePreview(URL.createObjectURL(file))
                        setEditFormData({ ...editFormData, imageFile: file })
                      }
                    }}
                    className="hidden" 
                  />
                  <span className="inventory-upload-icon"><CloudUploadRoundedIcon sx={{ fontSize: 20 }} /></span>
                  <span className="inventory-upload-title">Upload Main Image</span>
                  <span className="inventory-upload-copy">PNG, JPG, or WEBP</span>
                </label>
              )}

              {(editingItem.gallery && editingItem.gallery.length > 0) || editGalleryPreviews.length > 0 ? (
                <div className="inventory-gallery-section max-w-full">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/62 mb-3">Sub Images (Gallery) - Up to 4 images</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((index) => {
                      const galleryImage = editGalleryPreviews[index] || editingItem.gallery?.[index]
                      return (
                        <label key={index} className="relative group">
                          {galleryImage ? (
                            <>
                              <img 
                                src={galleryImage} 
                                alt={`Gallery ${index + 1}`}
                                className="w-full h-24 rounded-lg object-cover border border-white/10 cursor-pointer"
                              />
                              <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      const newFiles = [...editGalleryFiles]
                                      const newPreviews = [...editGalleryPreviews]
                                      newFiles[index] = file
                                      newPreviews[index] = URL.createObjectURL(file)
                                      setEditGalleryFiles(newFiles)
                                      setEditGalleryPreviews(newPreviews)
                                    }
                                  }}
                                  className="hidden"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    const newPreviews = [...editGalleryPreviews]
                                    const newFiles = [...editGalleryFiles]
                                    if (newPreviews[index]) {
                                      URL.revokeObjectURL(newPreviews[index])
                                    }
                                    newFiles[index] = undefined
                                    newPreviews[index] = undefined
                                    setEditGalleryFiles(newFiles.filter(Boolean))
                                    setEditGalleryPreviews(newPreviews.filter(Boolean))
                                  }}
                                  className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
                                >
                                  <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                                </button>
                                <span className="text-white text-xs font-bold">Replace</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-full h-24 rounded-lg border border-dashed border-white/10 flex items-center justify-center bg-white/4 cursor-pointer">
                                <CloudUploadRoundedIcon sx={{ fontSize: 24 }} className="text-white/40" />
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const newFiles = [...editGalleryFiles]
                                    const newPreviews = [...editGalleryPreviews]
                                    newFiles[index] = file
                                    newPreviews[index] = URL.createObjectURL(file)
                                    setEditGalleryFiles(newFiles)
                                    setEditGalleryPreviews(newPreviews)
                                  }
                                }}
                                className="hidden"
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity">Image {index + 1}</span>
                            </>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="inventory-gallery-upload-section">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/62 mb-3">Sub Images (Gallery) - Up to 4 images</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((index) => (
                      <label key={index} className="inventory-gallery-upload-box cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const newFiles = [...editGalleryFiles]
                              const newPreviews = [...editGalleryPreviews]
                              newFiles[index] = file
                              newPreviews[index] = URL.createObjectURL(file)
                              setEditGalleryFiles(newFiles)
                              setEditGalleryPreviews(newPreviews)
                            }
                          }}
                          className="hidden"
                        />
                        <div className="inventory-gallery-upload-placeholder">
                          <CloudUploadRoundedIcon sx={{ fontSize: 24 }} className="text-white/40" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 text-center">Image {index + 1}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formMessage && (
                <div className={`inventory-form-message ${formMessage.type === 'error' ? 'is-error' : 'is-success'}`}>
                  {formMessage.text}
                </div>
              )}

              <div className="inventory-modal-actions">
                <button 
                  type="submit" 
                  disabled={isSavingItem}
                  className="inventory-submit-button inline-flex items-center justify-center gap-2"
                >
                  <SaveRoundedIcon sx={{ fontSize: 18 }} />
                  {isSavingItem ? 'Updating...' : 'Update Item'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const hasChanges = JSON.stringify(editFormData) !== '{}'
                    if (hasChanges) {
                      setConfirmModal({ open: true, action: 'edit-cancel', itemId: editingItem.id })
                    } else {
                      setIsEditModalOpen(false)
                      setEditFormData({})
                    }
                  }}
                  className="inventory-cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Number Pad Modal */}
      {stockNumberPadOpen && (
        <div className="inventory-modal-overlay">
          <button type="button" className="inventory-modal-backdrop" onClick={() => {
            setStockNumberPadOpen(false)
            setStockNumberPadValue('')
            setStockNumberPadItemId(null)
          }} />
          <div className={`inventory-modal-panel ${!isDarkMode ? 'light-mode' : ''}`} style={{ maxWidth: '420px' }}>
            <div className="inventory-modal-header sticky top-0 bg-inherit z-10 pb-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="inventory-modal-title">Add Stock</h3>
                  <p className={`inventory-modal-copy ${!isDarkMode ? 'light-mode-text' : ''}`}>Enter quantity to add to current stock</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStockNumberPadOpen(false)
                    setStockNumberPadValue('')
                    setStockNumberPadItemId(null)
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0"
                >
                  <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Display Current and Input */}
              <div className={`rounded-lg border p-4 ${!isDarkMode ? 'bg-gray-50 border-gray-200' : 'bg-white/4 border-white/10'}`}>
                <div className="text-center">
                  <p className={`text-xs font-bold uppercase tracking-widest ${!isDarkMode ? 'text-gray-600' : 'text-white/60'} mb-2`}>Current Stock</p>
                  <p className={`text-2xl font-black ${!isDarkMode ? 'text-gray-900' : 'text-white'}`}>
                    {items.find(i => i.id === stockNumberPadItemId)?.stock ?? 0} units
                  </p>
                </div>
                <div className="my-4 flex items-center justify-center">
                  <div className={`text-center px-6 py-3 rounded-lg border-2 border-dashed ${!isDarkMode ? 'border-green-200 bg-green-50' : 'border-emerald-900/30 bg-emerald-950/20'}`}>
                    <p className={`text-xs font-bold uppercase ${!isDarkMode ? 'text-green-600' : 'text-emerald-400'} mb-1`}>Add</p>
                    <p className={`text-3xl font-black ${!isDarkMode ? 'text-green-900' : 'text-emerald-300'}`}>
                      {stockNumberPadValue || '0'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest ${!isDarkMode ? 'text-gray-600' : 'text-white/60'} mb-2 text-center`}>New Total</p>
                  <p className={`text-2xl font-black text-center ${!isDarkMode ? 'text-gray-900' : 'text-white'}`}>
                    {(items.find(i => i.id === stockNumberPadItemId)?.stock ?? 0) + Number(stockNumberPadValue || 0)} units
                  </p>
                </div>
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleNumberPadAppend(digit)}
                    className={`py-3 rounded-lg font-bold text-lg transition-colors ${
                      !isDarkMode
                        ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {digit}
                  </button>
                ))}
              </div>

              {/* Zero and Backspace */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleNumberPadAppend(0)}
                  className={`py-3 rounded-lg font-bold text-lg transition-colors ${
                    !isDarkMode
                      ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleNumberPadBackspace}
                  className={`py-3 rounded-lg font-bold text-lg transition-colors ${
                    !isDarkMode
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-red-950/30 text-red-400 hover:bg-red-950/50'
                  }`}
                >
                  ← Back
                </button>
              </div>

              {/* Clear and Confirm */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStockNumberPadValue('')
                  }}
                  className={`py-3 rounded-lg font-bold transition-colors ${
                    !isDarkMode
                      ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleNumberPadConfirm(stockNumberPadItemId, items.find(i => i.id === stockNumberPadItemId)?.stock ?? 0)}
                  className="inventory-submit-button py-3 rounded-lg font-bold transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        open={confirmModal.open}
        title={
          confirmModal.action === 'add-unit-confirm' ? 'Confirm Save Unit' :
          confirmModal.action === 'edit-update' ? 'Update Item' :
          confirmModal.action === 'edit-cancel' ? 'Discard Changes' :
          confirmModal.action === 'update-stocks' ? 'Confirm Stock Update' :
          confirmModal.action === 'update-stocks-cancel' ? 'Discard Stock Changes' :
          confirmModal.action === 'add-unit-cancel' ? 'Discard Draft' :
          confirmModal.action === 'add-spare-parts-cancel' ? 'Discard Draft' :
          'Delete Item'
        }
        message={
          confirmModal.action === 'add-unit-confirm' ? 'Are you sure you want to save this unit? It will be added to the inventory and published to the showroom.' :
          confirmModal.action === 'edit-update' ? 'Are you sure you want to update this item? This change will be saved to the database.' :
          confirmModal.action === 'edit-cancel' ? 'You have unsaved changes. Are you sure you want to discard them?' :
          confirmModal.action === 'update-stocks' ? 'Are you sure you want to update the stock levels? This will permanently change the inventory counts.' :
          confirmModal.action === 'update-stocks-cancel' ? 'You have unsaved stock changes. Are you sure you want to discard them?' :
          confirmModal.action === 'add-unit-cancel' ? 'You have unsaved changes. Are you sure you want to discard the draft?' :
          confirmModal.action === 'add-spare-parts-cancel' ? 'You have unsaved changes. Are you sure you want to discard the draft?' :
          `Are you sure you want to delete "${confirmModal.itemName}"? This action cannot be undone.`
        }
        confirmText={
          confirmModal.action === 'add-unit-confirm' ? 'Yes, Save Unit' :
          confirmModal.action === 'edit-update' ? 'Update' :
          confirmModal.action === 'edit-cancel' ? 'Discard' :
          confirmModal.action === 'update-stocks' ? 'Update Stocks' :
          confirmModal.action === 'update-stocks-cancel' ? 'Discard' :
          confirmModal.action === 'add-unit-cancel' ? 'Discard' :
          confirmModal.action === 'add-spare-parts-cancel' ? 'Discard' :
          'Delete'
        }
        cancelText="Cancel"
        isDangerous={['delete', 'edit-cancel', 'update-stocks-cancel', 'add-unit-cancel', 'add-spare-parts-cancel'].includes(confirmModal.action)}
        isDarkMode={isDarkMode}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ open: false, action: null, itemId: null })}
      />
    </section>
  )
}
