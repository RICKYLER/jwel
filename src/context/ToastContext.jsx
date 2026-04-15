import { createContext, useContext, useCallback, useState, useMemo } from 'react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(
    (message, type = 'info', duration = 3000) => {
      const id = Math.random().toString(36).substr(2, 9)

      setToasts((prev) => [...prev, { id, message, type, duration }])

      // Auto-remove toast after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }

      return id
    },
    []
  )

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

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

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
