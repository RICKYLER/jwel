/**
 * Theme utility functions for consistent dark/light mode styling across SuperAdmin sections
 * Usage: Import and call these functions to get conditional Tailwind class names
 */

export const themeClasses = {
  // Text color classes - Updated to use design system colors
  textPrimary: (isDarkMode) => isDarkMode ? 'text-white' : 'text-[#2E2E30]',
  textSecondary: (isDarkMode) => isDarkMode ? 'text-white/70' : 'text-[#555555]',
  textTertiary: (isDarkMode) => isDarkMode ? 'text-white/40' : 'text-[#808080]',
  textMuted: (isDarkMode) => isDarkMode ? 'text-white/50' : 'text-[#999999]',

  // Background classes
  bgPrimary: (isDarkMode) => isDarkMode ? 'bg-[#1c1b1b]' : 'bg-white',
  bgSecondary: (isDarkMode) => isDarkMode ? 'bg-[#161616]' : 'bg-gray-50',
  bgTertiary: (isDarkMode) => isDarkMode ? 'bg-white/5' : 'bg-gray-100',
  bgHover: (isDarkMode) => isDarkMode ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200',
  bgStatCard: (isDarkMode) => isDarkMode ? 'bg-gradient-to-b from-[rgba(93,20,20,0.88)] via-[rgba(36,28,29,0.96)] to-[#1d1d1f]' : 'bg-gradient-to-b from-[rgba(93,20,20,0.88)] via-[rgba(36,28,29,0.96)] to-[#1d1d1f]',

  // Border classes
  border: (isDarkMode) => isDarkMode ? 'border-white/10' : 'border-gray-300',
  borderLight: (isDarkMode) => isDarkMode ? 'border-white/5' : 'border-gray-200',

  // Input classes
  input: (isDarkMode) => isDarkMode 
    ? 'border-white/10 bg-[#101010] text-white placeholder-neutral-500' 
    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400',

  // Button classes
  buttonPrimary: (isDarkMode) => isDarkMode
    ? 'bg-red-600 text-white hover:bg-red-700'
    : 'bg-red-600 text-white hover:bg-red-700',

  buttonSecondary: (isDarkMode) => isDarkMode
    ? 'bg-white/10 text-white/70 hover:bg-white/20'
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300',

  // Outline classes - Enhanced visibility
  outlineLight: (isDarkMode) => isDarkMode ? 'outline-1 outline-white/20' : 'outline-1 outline-[#2E2E30]/30',
  outlineStandard: (isDarkMode) => isDarkMode ? 'outline-2 outline-white/40' : 'outline-2 outline-[#2E2E30]/50',
  outlineHeavy: (isDarkMode) => isDarkMode ? 'outline-2 outline-white/60' : 'outline-2 outline-[#2E2E30]/70',
  outlineBrand: (isDarkMode) => isDarkMode ? 'outline-2 outline-[#C51D34]' : 'outline-2 outline-[#C51D34]',
}

// Helper function to build consistent theme-aware class strings
export const getThemeClass = (color, intensity, isDarkMode) => {
  if (color === 'text') {
    if (intensity === 'primary') return themeClasses.textPrimary(isDarkMode)
    if (intensity === 'secondary') return themeClasses.textSecondary(isDarkMode)
    if (intensity === 'tertiary') return themeClasses.textTertiary(isDarkMode)
    if (intensity === 'muted') return themeClasses.textMuted(isDarkMode)
  }
  if (color === 'bg') {
    if (intensity === 'primary') return themeClasses.bgPrimary(isDarkMode)
    if (intensity === 'secondary') return themeClasses.bgSecondary(isDarkMode)
    if (intensity === 'tertiary') return themeClasses.bgTertiary(isDarkMode)
  }
  if (color === 'border') {
    return intensity === 'light' ? themeClasses.borderLight(isDarkMode) : themeClasses.border(isDarkMode)
  }
  return ''
}
