import { createContext, useState, useContext, useEffect } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    const savedTheme =
      window.localStorage.getItem('bykelink-theme') ||
      window.localStorage.getItem('bykelink-superadmin-theme')

    if (savedTheme) {
      return savedTheme !== 'light'
    }

    // Keep the storefront in its intended dark visual design by default,
    // even when the browser/system is configured for a light theme.
    return true
  })

  // Persist theme to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const theme = isDarkMode ? 'dark' : 'light'
    window.localStorage.setItem('bykelink-theme', theme)
    window.localStorage.setItem('bykelink-superadmin-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode((current) => !current)
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
