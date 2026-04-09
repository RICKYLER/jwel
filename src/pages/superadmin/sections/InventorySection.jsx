import { useMemo, useState } from 'react'
import { addDoc, collection, serverTimestamp, updateDoc, doc } from 'firebase/firestore'
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
import './InventorySection.css'

const inventoryTabs = [
  { id: 'all', label: 'All' },
  { id: 'motorcycle-parts', label: 'Motorcycle Parts' },
  { id: 'spare-parts', label: 'Spare Parts' },
  { id: 'accessories', label: 'Accessories' },
]

const defaultItemForm = {
  name: '',
  model: '',
  category: 'Motorcycle Parts',
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
  isDarkMode = true,
}) {
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdateStocksModalOpen, setIsUpdateStocksModalOpen] = useState(false)
  const [isCriticalStockModalOpen, setIsCriticalStockModalOpen] = useState(false)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [itemForm, setItemForm] = useState(defaultItemForm)
  const [editingItem, setEditingItem] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [formMessage, setFormMessage] = useState(null)
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const [stockUpdates, setStockUpdates] = useState({})
  const [editFormData, setEditFormData] = useState({})

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

      if (activeTab === 'accessories') {
        return /access|helmet|guard|bag|cover|mount|seat/.test(categoryHaystack)
      }

      return true
    })
  }, [activeTab, items, searchTerm, statusFilter])

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

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target

    setItemForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setFormMessage(null)
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : '')
    setFormMessage(null)
  }

  const handleOpenAddModal = () => {
    setItemForm(defaultItemForm)
    setImageFile(null)
    setImagePreview('')
    setFormMessage(null)
    setIsAddModalOpen(true)
  }

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
    setImageFile(null)
    setImagePreview('')
    setFormMessage(null)
    setItemForm(defaultItemForm)
  }

  const handleCreateItem = async (event) => {
    event.preventDefault()

    if (!canEditOperations) {
      setFormMessage({ type: 'error', text: 'Only staff-level access or higher can create inventory items.' })
      return
    }

    if (!itemForm.name.trim()) {
      setFormMessage({ type: 'error', text: 'Enter the inventory item name first.' })
      return
    }

    if (!itemForm.price || Number(itemForm.price) < 0) {
      setFormMessage({ type: 'error', text: 'Enter a valid item price.' })
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
        name: itemForm.name.trim(),
        model: itemForm.model.trim(),
        category: itemForm.category.trim(),
        description: itemForm.description.trim(),
        stock: Number(itemForm.stock || 0),
        price: Number(itemForm.price || 0),
        status: itemForm.status,
        badge: itemForm.badge.trim() || 'New Arrival',
        imageUrl,
        gallery: imageUrl ? [imageUrl] : [],
        showInShowroom: Boolean(itemForm.showInShowroom),
        publishedToShowroom: Boolean(itemForm.showInShowroom),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setFormMessage({ type: 'success', text: 'Inventory item added successfully and synced to the showroom.' })
      window.setTimeout(() => {
        handleCloseAddModal()
      }, 600)
    } catch (error) {
      console.error('Unable to create inventory item', error)
      setFormMessage({
        type: 'error',
        text: `Unable to add the inventory item. ${error.message}`,
      })
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
            onClick={handleOpenAddModal}
            disabled={!canEditOperations}
            className="inventory-add-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
          >
            <AddRoundedIcon sx={{ fontSize: 18 }} />
            Add Item
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

      {isAddModalOpen && (
        <div className="inventory-modal-overlay">
          <button type="button" className="inventory-modal-backdrop" onClick={handleCloseAddModal} aria-label="Close add inventory modal" />

          <div className={`inventory-modal-panel scrollable-modal-panel ${!isDarkMode ? 'light-mode' : ''}`}>
            <div className="inventory-modal-header sticky top-0 bg-inherit z-10 pb-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="inventory-modal-kicker">Live Inventory Entry</p>
                  <h3 className="inventory-modal-title">Add Inventory Item</h3>
                  <p className={`inventory-modal-copy ${!isDarkMode ? 'light-mode-text' : ''}`}>Create a new stock record, upload an image, and publish it to the showroom in one step.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0 ml-3"
                >
                  <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateItem} className="inventory-modal-form">
              <div className="inventory-modal-grid">
                <label className="inventory-field">
                  <span>Item Name</span>
                  <input type="text" name="name" value={itemForm.name} onChange={handleFormChange} placeholder="Yamaha NMAX" />
                </label>

                <label className="inventory-field">
                  <span>Model / Variant</span>
                  <input type="text" name="model" value={itemForm.model} onChange={handleFormChange} placeholder="155 ABS" />
                </label>

                <label className="inventory-field">
                  <span>Category</span>
                  <select name="category" value={itemForm.category} onChange={handleFormChange}>
                    <option value="Motorcycle Parts">Motorcycle Parts</option>
                    <option value="Motorcycle Units">Motorcycle Units</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </label>

                <label className="inventory-field">
                  <span>Status</span>
                  <select name="status" value={itemForm.status} onChange={handleFormChange}>
                    {inventoryStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className="inventory-field">
                  <span>Stock</span>
                  <input type="number" name="stock" min="0" value={itemForm.stock} onChange={handleFormChange} placeholder="10" />
                </label>

                <label className="inventory-field">
                  <span>Price</span>
                  <input type="number" name="price" min="0" value={itemForm.price} onChange={handleFormChange} placeholder="145000" />
                </label>
              </div>

              <label className="inventory-field">
                <span>Description</span>
                <textarea name="description" value={itemForm.description} onChange={handleFormChange} rows="3" placeholder="Add a short description for the showroom and inventory listing." />
              </label>

              <div className="inventory-modal-grid inventory-modal-grid--secondary">
                <label className="inventory-field">
                  <span>Badge</span>
                  <input type="text" name="badge" value={itemForm.badge} onChange={handleFormChange} placeholder="New Arrival" />
                </label>

                <label className="inventory-field inventory-checkbox-field">
                  <span>Showroom Visibility</span>
                  <label className="inventory-checkbox-row">
                    <input type="checkbox" name="showInShowroom" checked={itemForm.showInShowroom} onChange={handleFormChange} />
                    <span>Display this item in the public showroom</span>
                  </label>
                </label>
              </div>

              <label className="inventory-upload-box">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <span className="inventory-upload-icon"><CloudUploadRoundedIcon sx={{ fontSize: 20 }} /></span>
                <span className="inventory-upload-title">Upload Item Image</span>
                <span className="inventory-upload-copy">PNG, JPG, or WEBP — used in the showroom and inventory listing.</span>
              </label>

              {imagePreview && (
                <div className="inventory-image-preview max-w-full">
                  <img src={imagePreview} alt="Inventory preview" className="max-h-48 w-auto rounded-2xl object-contain mx-auto" />
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
                  {isSavingItem ? 'Saving Item...' : 'Save Inventory Item'}
                </button>
                <button type="button" onClick={handleCloseAddModal} className="inventory-cancel-button">
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
          <button type="button" className="inventory-modal-backdrop" onClick={() => setIsUpdateStocksModalOpen(false)} />
          <div className={`inventory-modal-panel update-stocks-modal ${!isDarkMode ? 'light-mode' : ''}`}>
            <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-inherit pb-3 border-b border-white/5">
              <h3 className="inventory-modal-title">Update Stock Levels</h3>
              <button
                type="button"
                onClick={() => setIsUpdateStocksModalOpen(false)}
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
                    className={`flex-1 border-0 bg-transparent text-sm outline-none ${!isDarkMode ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-white/40'}`}
                  />
                </div>

                <div className="update-stocks-items space-y-2 max-h-64 overflow-y-auto">
                  {items.slice(0, 3).map((item) => (
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
                        <input
                          type="number"
                          min={item.stock ?? 0}
                          value={stockUpdates[item.id] ?? item.stock ?? 0}
                          onChange={(e) => {
                            const newVal = Math.max(Number(item.stock ?? 0), Number(e.target.value))
                            setStockUpdates({ ...stockUpdates, [item.id]: newVal })
                          }}
                          className={`w-16 px-2 py-1 text-sm rounded border text-center font-bold ${!isDarkMode ? 'border-gray-300 bg-white text-gray-900' : 'border-white/10 bg-white/4 text-white'}`}
                        />
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
                    {items.slice(0, 3).map((item) => {
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
                    onClick={() => setIsUpdateStocksModalOpen(false)}
                  >
                    <SaveRoundedIcon sx={{ fontSize: 16 }} />
                    Confirm Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUpdateStocksModalOpen(false)}
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
          <button type="button" className="inventory-modal-backdrop" onClick={() => { setIsEditModalOpen(false); setEditFormData({}); }} />
          <div className={`inventory-modal-panel edit-item-modal ${!isDarkMode ? 'light-mode' : ''}`}>
            <div className="flex items-start gap-4 overflow-y-auto max-h-[calc(100vh-2rem)]">
              {/* Left - Image Panel */}
              <div className="edit-modal-image-panel">
                <div className={`rounded-lg overflow-hidden border mb-3 ${!isDarkMode ? 'bg-gray-100 border-gray-300' : 'bg-white/5 border-white/10'}`}>
                  {editingItem.imageUrl ? (
                    <img src={editingItem.imageUrl} alt={editingItem.name} className="w-40 h-40 object-cover" />
                  ) : (
                    <div className={`w-40 h-40 flex items-center justify-center text-xs font-bold ${!isDarkMode ? 'bg-gray-200 text-gray-600' : 'bg-white/5 text-white/30'}`}>
                      No Image
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className={`text-xs font-bold uppercase tracking-widest w-full py-2 rounded-lg border transition-colors ${!isDarkMode ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'border-white/10 text-white/70 hover:bg-white/5'}`}
                >
                  Change Photo
                </button>
              </div>

              {/* Right - Form Panel */}
              <div className="edit-modal-form-panel flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-inherit pb-3 border-b border-white/5">
                  <h3 className="inventory-modal-title">Edit Item Details</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setEditFormData({})
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0"
                  >
                    <CloseRoundedIcon sx={{ fontSize: 18 }} />
                  </button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  <div>
                    <label className="inventory-field">
                      <span>Item Name</span>
                      <input type="text" value={editFormData.name ?? editingItem?.name ?? ''} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} placeholder="Item name" className={`w-full px-3 py-2 rounded-lg border text-sm ${!isDarkMode ? 'bg-white border-gray-300 text-gray-900' : 'bg-white/4 border-white/10 text-white'}`} />
                    </label>
                  </div>

                  <div>
                    <label className="inventory-field">
                      <span>Model / Variant</span>
                      <input type="text" value={editFormData.model ?? editingItem?.model ?? ''} onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })} placeholder="Model" className={`w-full px-3 py-2 rounded-lg border text-sm ${!isDarkMode ? 'bg-white border-gray-300 text-gray-900' : 'bg-white/4 border-white/10 text-white'}`} />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="inventory-field">
                        <span>Stock</span>
                        <input type="number" value={editFormData.stock ?? editingItem?.stock ?? 0} onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })} placeholder="0" className={`w-full px-3 py-2 rounded-lg border text-sm ${!isDarkMode ? 'bg-white border-gray-300 text-gray-900' : 'bg-white/4 border-white/10 text-white'}`} />
                      </label>
                    </div>
                    <div>
                      <label className="inventory-field">
                        <span>Unit Price</span>
                        <input type="number" value={editFormData.price ?? editingItem?.price ?? 0} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} placeholder="0" className={`w-full px-3 py-2 rounded-lg border text-sm ${!isDarkMode ? 'bg-white border-gray-300 text-gray-900' : 'bg-white/4 border-white/10 text-white'}`} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 sticky bottom-0 bg-inherit pt-2 border-t border-white/5">
                  <button
                    type="button"
                    className="inventory-submit-button flex-1 py-2 text-xs font-bold inline-flex items-center justify-center gap-2"
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setEditFormData({})
                    }}
                  >
                    <SaveRoundedIcon sx={{ fontSize: 16 }} />
                    Update Item
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setEditFormData({})
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-full border transition-colors ${!isDarkMode ? 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50' : 'border-white/10 bg-white/4 text-white hover:bg-white/5'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}    </section>
  )
}
