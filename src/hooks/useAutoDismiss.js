import { useEffect } from 'react'

export default function useAutoDismiss(message, onClear, delay = 3000) {
  useEffect(() => {
    if (message && onClear) {
      const timer = setTimeout(() => {
        onClear()
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [message, onClear, delay])
}