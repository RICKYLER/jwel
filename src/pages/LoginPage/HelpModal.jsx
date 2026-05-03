import { useState, useEffect } from 'react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import './HelpModal.css'

export default function HelpModal({ isOpen, onClose, content }) {
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!isOpen) return null

  if (isSmallScreen) {
    // Mobile: Slide drawer from bottom
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700/50 rounded-t-2xl z-50 md:hidden max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 flex justify-between items-center p-4 border-b border-slate-700/30 bg-slate-900">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide">{content?.title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <CloseRoundedIcon sx={{ fontSize: 24 }} className="text-slate-400" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {content?.sections?.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="font-bold text-red-400 uppercase tracking-wider text-sm">{section.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{section.text}</p>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  // Desktop: Modal
  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-40 hidden md:block"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700/50 rounded-2xl z-50 hidden md:block max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-700/30 bg-slate-900">
          <h2 className="text-2xl font-bold text-white uppercase tracking-wide">{content?.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <CloseRoundedIcon sx={{ fontSize: 28 }} className="text-slate-400" />
          </button>
        </div>
        <div className="p-8 space-y-6">
          {content?.sections?.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="font-bold text-red-400 uppercase tracking-wider text-lg">{section.title}</h3>
              <p className="text-slate-300 text-base leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
