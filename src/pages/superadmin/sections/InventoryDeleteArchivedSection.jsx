import { useState, useMemo } from 'react'
import { deleteDoc, doc } from 'firebase/firestore'
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded'
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ConfirmationModal from '../components/ConfirmationModal'
import { db } from '../../../firebase'
import './InventoryDeleteArchivedSection.css'

const normalizeText = (value = '') => String(value).trim().toLowerCase()

export default function InventoryDeleteArchivedSection({
  deletedItems = [],
  canDeletePermanently = false,
  handleCollectionUpdate,
  formatDate,
  formatCurrency,
  isDarkMode = true,
  currentUser = null,
  currentAccessRole = null,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, itemId: null, itemName: '' })
  const [isDeleting, setIsDeleting] = useState(false)

  // Debug: Check actual role
  const actualCanDelete = canDeletePermanently || (currentAccessRole && ['superadmin', 'admin'].includes(String(currentAccessRole).toLowerCase()))
  
  const normalizedSearchTerm = normalizeText(searchTerm)

  const filteredItems = useMemo(() => {
    return deletedItems.filter((item) => {
      const searchHaystack = normalizeText(
        `${item.name || ''} ${item.model || ''} ${item.category || ''}`
      )
      return !searchTerm || searchHaystack.includes(normalizedSearchTerm)
    })
  }, [deletedItems, searchTerm])

  const handlePermanentDelete = (itemId, itemName) => {
    if (!actualCanDelete) {
      return
    }
    setConfirmModal({ open: true, action: 'permanent-delete', itemId, itemName })
  }

  const handleConfirmDelete = async () => {
    const { itemId } = confirmModal
    setConfirmModal({ open: false, action: null, itemId: null, itemName: '' })

    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, 'deleteArchived', itemId))
      handleCollectionUpdate()
    } catch (error) {
      console.error('Error permanently deleting item:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="inventory-delete-archived-shell space-y-6">
      <div className="inventory-control-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="inventory-control-title font-['Epilogue'] text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            Inventory <span>Delete Archived</span>
          </h2>
          <p className="mt-2 text-sm text-white/45">Manage deleted inventory items. Superadmin can permanently delete.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className={`rounded-2xl p-4 border ${!isDarkMode ? 'bg-white border-gray-200' : 'bg-white/6 border-white/10'}`}>
        <div className="flex items-center gap-3">
          <SearchRoundedIcon className="text-white/40" sx={{ fontSize: 20 }} />
          <input
            type="text"
            placeholder="Search by item name, model or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 bg-transparent text-sm font-medium placeholder-white/30 outline-none ${!isDarkMode ? 'text-gray-900' : 'text-white'}`}
          />
        </div>
      </div>

      {/* Items List */}
      <div className={`rounded-2xl border overflow-hidden ${!isDarkMode ? 'bg-white border-gray-200' : 'bg-white/6 border-white/10'}`}>
        <div className="p-4">
          <h3 className={`text-sm font-black uppercase tracking-[0.18em] mb-4 ${!isDarkMode ? 'text-gray-600' : 'text-white/60'}`}>
            {filteredItems.length} Deleted Item{filteredItems.length !== 1 ? 's' : ''}
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    !isDarkMode ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-white/4 border-white/10 hover:bg-white/8'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${!isDarkMode ? 'text-gray-900' : 'text-white'}`}>
                          {item.name}
                        </p>
                        <p className={`text-xs truncate ${!isDarkMode ? 'text-gray-500' : 'text-white/50'}`}>
                          {item.model} • {item.category}
                        </p>
                        <p className={`text-[10px] font-bold mt-1 ${!isDarkMode ? 'text-gray-600' : 'text-white/40'}`}>
                          Deleted {item.deletedAt ? formatDate(item.deletedAt.seconds ? item.deletedAt.seconds * 1000 : item.deletedAt) : 'Recently'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    {actualCanDelete && (
                      <button
                        type="button"
                        onClick={() => handlePermanentDelete(item.id, item.name)}
                        disabled={isDeleting}
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors shrink-0 disabled:opacity-60 ${
                          !isDarkMode
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-red-400 hover:bg-red-950/30'
                        }`}
                        title="Permanently delete this item"
                      >
                        <DeleteForeverRoundedIcon sx={{ fontSize: 18 }} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={`text-center py-8 text-sm ${!isDarkMode ? 'text-gray-500' : 'text-white/50'}`}>
                {searchTerm
                  ? 'No deleted items match your search.'
                  : 'No deleted items yet. Items deleted by users are archived here.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Total Deleted', value: String(deletedItems.length) },
          { label: 'Showing', value: String(filteredItems.length) },
          { label: 'Superadmin Access', value: actualCanDelete ? 'Yes' : 'No' },
        ].map((stat, idx) => (
          <article
            key={idx}
            className={`rounded-2xl p-4 ${!isDarkMode ? 'bg-gray-50 border border-gray-200' : 'bg-white/4 border border-white/10'}`}
          >
            <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${!isDarkMode ? 'text-gray-600' : 'text-white/40'}`}>
              {stat.label}
            </p>
            <h3 className="mt-3 font-['Epilogue'] text-3xl font-black text-white">{stat.value}</h3>
          </article>
        ))}
      </div>

      <ConfirmationModal
        open={confirmModal.open}
        title="Permanently Delete Item"
        message={`Are you sure you want to permanently delete "${confirmModal.itemName}"? This action cannot be undone.`}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        isDangerous={true}
        isDarkMode={isDarkMode}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ open: false, action: null, itemId: null, itemName: '' })}
      />
    </section>
  )
}
