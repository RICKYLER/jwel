// Helper functions for conditional class names
// Use these to keep class logic organized and reusable

export const getConversationButtonClasses = (isSelected) => {
  return isSelected 
    ? 'w-full border-b px-4 py-3 transition text-left bg-slate-800 border-slate-700'
    : 'w-full border-b px-4 py-3 transition text-left hover:bg-slate-800/50 border-slate-800'
}

export const getMessageBubbleClasses = (isCurrentUser, isDarkMode) => {
  if (isCurrentUser) {
    return 'rounded-lg px-4 py-2 bg-red-600 text-white rounded-br-none'
  }
  return isDarkMode 
    ? 'rounded-lg px-4 py-2 bg-slate-800 text-white rounded-bl-none'
    : 'rounded-lg px-4 py-2 bg-slate-200 text-slate-900 rounded-bl-none'
}

export const getInputContainerClasses = (isDarkMode) => {
  return isDarkMode
    ? 'flex items-end gap-2 rounded-lg border border-slate-700 px-4 py-3 bg-slate-800'
    : 'flex items-end gap-2 rounded-lg border border-slate-300 px-4 py-3 bg-slate-50'
}

export const getInputButtonClasses = (isDarkMode) => {
  return isDarkMode
    ? 'shrink-0 transition text-slate-400 hover:text-red-600'
    : 'shrink-0 transition text-slate-600 hover:text-red-600'
}

export const getInputFieldClasses = (isDarkMode) => {
  return isDarkMode
    ? 'flex-1 bg-transparent text-sm outline-none text-white placeholder-slate-500'
    : 'flex-1 bg-transparent text-sm outline-none text-slate-900 placeholder-slate-400'
}
