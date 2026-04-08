import { useMemo, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
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
}) {
  const [activeTab, setActiveTab] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [itemForm, setItemForm] = useState(defaultItemForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [formMessage, setFormMessage] = useState(null)

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab === 'all') {
        return true
      }

      const haystack = normalizeText(`${item.name} ${item.category} ${item.description}`)

      if (activeTab === 'motorcycle-parts') {
        return /motor|engine|wheel|brake|frame|unit/.test(haystack)
      }

      if (activeTab === 'spare-parts') {
        return /spare|part|kit|filter|belt|bearing|plug/.test(haystack)
      }

      if (activeTab === 'accessories') {
        return /access|helmet|guard|bag|cover|mount|seat/.test(haystack)
      }

      return true
    })
  }, [activeTab, items])

  const summaryCards = useMemo(() => {
    const totalUnits = items.reduce((sum, item) => sum + Number(item.stock ?? 0), 0)
    const criticalStock = items.filter((item) => Number(item.stock ?? 0) <= 5 || normalizeText(item.status).includes('low')).length
    const partsMovement = items.length
      ? (items.reduce((sum, item) => sum + Number(item.stock ?? 0), 0) / Math.max(items.length, 1) / 10).toFixed(1)
      : '0.0'
    const uniqueCategories = new Set(items.map((item) => normalizeText(item.category || 'uncategorized'))).size

    return [
      { label: 'Total Stock Units', value: totalUnits.toLocaleString(), detail: `${items.length} SKUs monitored` },
      { label: 'Critical Stock', value: String(criticalStock), detail: 'Low inventory alerts' },
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className="inventory-summary-card rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">{card.label}</p>
            <h3 className="mt-3 font-['Epilogue'] text-3xl font-black text-white">{card.value}</h3>
            <p className="mt-2 text-xs text-white/45">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="inventory-board rounded-[28px] p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

          <button type="button" className="inventory-filter-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
            <FilterListRoundedIcon sx={{ fontSize: 16 }} />
            Filter
          </button>
        </div>

        <div className="hidden grid-cols-[0.8fr_2fr_1.1fr_1.1fr_1fr_0.65fr] gap-3 border-b border-white/5 px-3 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/35 md:grid">
          <span>Item</span>
          <span>Name / Model</span>
          <span>Category</span>
          <span>Stock Level</span>
          <span>Unit Price</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="divide-y divide-white/5">
          {filteredItems.map((item, index) => {
            const stockValue = Number(item.stock ?? 0)
            const stockWidth = Math.max(8, Math.min(100, stockValue * 8))
            const itemCode = String(item.sku || item.id || `ITM-${index + 1}`).slice(0, 8).toUpperCase()

            return (
              <div key={item.id} className="grid gap-3 px-3 py-4 md:grid-cols-[0.8fr_2fr_1.1fr_1.1fr_1fr_0.65fr] md:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">{itemCode}</p>
                </div>

                <div>
                  <p className="text-sm font-bold text-white">{item.name || 'Inventory Item'}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{item.model || item.description || 'Yamaha precision stock'}</p>
                </div>

                <div>
                  <span className="inventory-category-pill inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
                    {item.category || 'General'}
                  </span>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-white/65">
                    <span>{stockValue} units</span>
                    <span className={stockValue <= 5 ? 'text-[#ff6a63]' : 'text-white/45'}>
                      {item.status || 'In Stock'}
                    </span>
                  </div>
                  <div className="inventory-stock-bar h-1.5 overflow-hidden rounded-full">
                    <div className="inventory-stock-fill h-full rounded-full" style={{ width: `${stockWidth}%` }} />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-white">{formatCurrency(item.price ?? 0)}</p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <select
                    value={item.status || 'In Stock'}
                    onChange={(event) => handleCollectionUpdate('inventory', item.id, { status: event.target.value })}
                    disabled={!canEditOperations}
                    className="inventory-status-select rounded-xl border border-white/10 px-2 py-1.5 text-[11px] text-white outline-none disabled:opacity-70"
                  >
                    {inventoryStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button type="button" className="inventory-action-button inline-flex h-9 w-9 items-center justify-center rounded-full" aria-label={`More actions for ${item.name || item.id}`}>
                    <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                  </button>
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

          <div className="inventory-modal-panel">
            <div className="inventory-modal-header">
              <div>
                <p className="inventory-modal-kicker">Live Inventory Entry</p>
                <h3 className="inventory-modal-title">Add Inventory Item</h3>
                <p className="inventory-modal-copy">Create a new stock record, upload an image, and publish it to the showroom in one step.</p>
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
                <div className="inventory-image-preview">
                  <img src={imagePreview} alt="Inventory preview" className="h-36 w-full rounded-2xl object-cover" />
                </div>
              )}

              {formMessage && (
                <div className={`inventory-form-message ${formMessage.type === 'error' ? 'is-error' : 'is-success'}`}>
                  {formMessage.text}
                </div>
              )}

              <div className="inventory-modal-actions">
                <button type="submit" disabled={isSavingItem} className="inventory-submit-button">
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
    </section>
  )
}
