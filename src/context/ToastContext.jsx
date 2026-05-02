import { createContext, useCallback, useState, useMemo } from 'react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => {
      const found = prev.find((t) => t.id === id)
      if (!found) return prev

      // If already marked closing, remove immediately
      if (found.closing) return prev.filter((t) => t.id !== id)

      // Otherwise mark as closing, then remove after exit animation
      setTimeout(() => {
        setToasts((curr) => curr.filter((t) => t.id !== id))
      }, 300)

      return prev.map((t) => (t.id === id ? { ...t, closing: true } : t))
    })
  }, [])

  const addToast = useCallback(
    (message, type = 'info', duration = 3000) => {
      const id = Math.random().toString(36).substr(2, 9)

      setToasts((prev) => [...prev, { id, message, type, duration, closing: false }])

      // Mark as closing then remove so the UI can animate exit
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, closing: true } : t)))
        }, duration)

        // Remove after exit animation (300ms)
        setTimeout(() => {
          removeToast(id)
        }, duration + 300)
      }

      return id
    },
    [removeToast]
  )

  const success = useCallback(
    (message, duration = 3000) => addToast(message, 'success', duration),
    [addToast]
  )

  const error = useCallback(
    (message, duration = 4000) => addToast(message, 'error', duration),
    [addToast]
  )

  const info = useCallback(
    (message, duration = 3000) => addToast(message, 'info', duration),
    [addToast]
  )

  const warning = useCallback(
    (message, duration = 3500) => addToast(message, 'warning', duration),
    [addToast]
  )

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      success,
      error,
      info,
      warning,
    }),
    [toasts, addToast, removeToast, success, error, info, warning]
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export default ToastContext
