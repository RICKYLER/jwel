import { useEffect, useState } from 'react'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

const Confetti = ({ particles = 50 }) => {
  const generateConfetti = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1',
      '#FFA07A', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E2', '#F8B88B',
    ]

    return Array.from({ length: particles }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.2,
      duration: 2 + Math.random() * 1,
      size: 4 + Math.random() * 8,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      isCircle: Math.random() > 0.5,
    }))
  }

  const [confetti] = useState(() => generateConfetti())

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .confetti-piece {
          position: absolute;
          animation: confetti-fall linear forwards;
          pointer-events: none;
        }
      `}</style>
      
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: piece.isCircle ? '50%' : '0%',
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}

export default function EmailVerifiedModal({ onClose, autoCloseDuration = 30000 }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, autoCloseDuration)

    return () => clearTimeout(timer)
  }, [autoCloseDuration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible) return null

  return (
    <>
      {/* Confetti Background */}
      <Confetti particles={60} />

      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
        {/* Modal Card */}
        <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl max-w-sm w-full relative z-50 border border-emerald-500/30 animate-in fade-in zoom-in duration-300">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
            aria-label="Close modal"
          >
            <CloseRoundedIcon sx={{ fontSize: 24 }} />
          </button>

          {/* Icon with Animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <style>{`
                @keyframes bounce-pulse {
                  0% { transform: scale(0.8); opacity: 0; }
                  50% { transform: scale(1.1); }
                  100% { transform: scale(1); opacity: 1; }
                }
                
                .email-verified-icon {
                  animation: bounce-pulse 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
              `}</style>
              <div className="email-verified-icon w-24 h-24 rounded-full bg-linear-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <CheckCircleRoundedIcon sx={{ fontSize: 56, color: 'white' }} />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center mb-2">Email Verified!</h2>

          {/* Description */}
          <p className="text-slate-300 text-center text-sm mb-6">
            Your email has been successfully verified. Your account is now fully activated and ready to use.
          </p>

          {/* Action Button */}
          <button
            onClick={handleClose}
            className="w-full bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Continue
          </button>

          {/* Auto-close Timer */}
          <p className="text-xs text-slate-500 text-center mt-4">This modal will close automatically</p>
        </div>
      </div>
    </>
  )
}
