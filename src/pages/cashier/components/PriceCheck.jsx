import { useEffect, useMemo, useRef, useState } from 'react'

export default function PriceCheck({ inventoryItems, onClose }) {
  const [searchTerm, setSearchTerm] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const matchingItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return []

    return inventoryItems
      .filter((item) => {
        const searchableText = [
          item.name,
          item.sku,
          item.barcode,
          item.itemCode,
          item.code,
          item.brand,
          item.category,
        ]
          .map((value) => String(value || '').toLowerCase())
          .join(' ')

        return searchableText.includes(normalizedSearch)
      })
      .slice(0, 6)
  }, [inventoryItems, searchTerm])

  return (
    <div className="cashier-price-check-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="cashier-price-check-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cashier-price-check-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="cashier-price-check-header">
          <div>
            <span className="cashier-barcode-kicker">F8 Quick Action</span>
            <h2 id="cashier-price-check-title">Price Check</h2>
            <p>Look up the current price and stock before adding an item to a sale.</p>
          </div>
          <button type="button" className="cashier-barcode-close" onClick={onClose} aria-label="Close price check">
            ×
          </button>
        </div>

        <div className="cashier-price-check-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search product, SKU, or barcode"
            aria-label="Search product, SKU, or barcode"
          />
        </div>

        <div className="cashier-price-check-results" aria-live="polite">
          {!searchTerm.trim() && <div className="cashier-price-check-empty">Start typing to check an item.</div>}
          {searchTerm.trim() && matchingItems.length === 0 && (
            <div className="cashier-price-check-empty">No matching inventory item found.</div>
          )}
          {matchingItems.map((item) => (
            <article className="cashier-price-check-result" key={item.id}>
              <div className="cashier-price-check-result-main">
                <strong>{item.name}</strong>
                <span>{item.brand} · {item.category}</span>
                <small>SKU: {item.sku}{item.barcode && ` · Barcode: ${item.barcode}`}</small>
              </div>
              <div className="cashier-price-check-result-value">
                <strong>₱ {Number(item.price || 0).toLocaleString('en-PH')}</strong>
                <span className={item.stock > 0 ? 'in-stock' : 'out-of-stock'}>
                  {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            </article>
          ))}
        </div>

        <button type="button" className="cashier-price-check-done" onClick={onClose}>Done</button>
      </section>
    </div>
  )
}