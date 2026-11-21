import { useEffect, useState } from 'react'
import './GlobalLoadingScreen.css'

export default function GlobalLoadingScreen({ role = 'Dashboard', delay = 500, onComplete = null, autoComplete = true }) {
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  // Show loading screen after delay
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    return () => clearTimeout(delayTimer)
  }, [delay])

  // Simulate progress and force completion
  useEffect(() => {
    if (!isVisible) return

    document.documentElement.classList.add('kinetic-scroll-lock')
    document.body.classList.add('kinetic-scroll-lock')

    let currentProgress = 0
    let completionTimer
    let hideTimer
    
    // Gradual progress increase for first 3 seconds
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval)
          return prev
        }
        const increment = Math.random() * 15
        return Math.min(prev + increment, 85)
      })
    }, 300)

    // Force completion to 100% after 3.5 seconds
    if (autoComplete) {
      completionTimer = setTimeout(() => {
        setIsCompleting(true)
        setProgress(100)

        hideTimer = setTimeout(() => {
          onComplete?.()
        }, 800)
      }, 3500)
    }

    return () => {
      clearInterval(progressInterval)
      clearTimeout(completionTimer)
      clearTimeout(hideTimer)
      document.documentElement.classList.remove('kinetic-scroll-lock')
      document.body.classList.remove('kinetic-scroll-lock')
    }
  }, [isVisible, onComplete, autoComplete])

  if (!isVisible) {
    return null
  }

  return (
    <div className={`kinetic-loading-screen ${isCompleting ? 'is-completing' : ''}`}>
      {/* Background Layer with Red Glow */}
      <div className="kinetic-background-layer">
        <div className="kinetic-glow-pulse" />
        <div className="kinetic-gradient-overlay" />
      </div>

      {/* Main Content Canvas */}
      <main className="kinetic-main-content">
        {/* Top Branding Shell */}
        <header className="kinetic-header">
          <h1 className="kinetic-brand-title">
            <span className="kinetic-brand-highlight">BYKELINK</span>
            <span className="kinetic-brand-separator">|</span>
            <span>SHOWROOM</span>
          </h1>
          <p className="kinetic-brand-tagline">Premium Yamaha Experience</p>
        </header>

        {/* Central Loading Cluster */}
        <div className="kinetic-loading-cluster">
          {/* Custom Instrument Cluster Spinner */}
          <div className="kinetic-spinner-container">
            {/* Outer Ring */}
            <div className="kinetic-outer-ring" />
            <div className="kinetic-spinner-edge" />

            {/* Speedometer Ticks */}
            <svg
              className="kinetic-speedometer-ticks"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="1" />
            </svg>

            {/* Animated Needle (Instrument Cluster) */}
            <div className="kinetic-needle" />

            {/* Central Motorcycle Icon */}
            <div className="kinetic-center-icon">
              <div className="kinetic-motorcycle-icon">🏍️</div>
              <div className="kinetic-icon-glow" />
            </div>

            {/* Speed Lines Overlay */}
            <div className="kinetic-speed-lines">
              <div className="kinetic-speed-line" style={{ animationDelay: '0.2s' }} />
              <div className="kinetic-speed-line" style={{ animationDelay: '0.5s' }} />
              <div className="kinetic-speed-line" style={{ animationDelay: '0.8s' }} />
            </div>
          </div>

          {/* Precision Progress Info */}
          <div className="kinetic-glass-panel">
            <div className="kinetic-panel-header">
              <div className="kinetic-panel-title-section">
                <p className="kinetic-status-label">Showroom Status</p>
                <h2 className="kinetic-panel-title">
                  {isCompleting ? 'SHOWROOM READY' : 'PREPARING YOUR SHOWROOM...'}
                </h2>
              </div>
              <span className="kinetic-progress-number">
                {Math.round(progress)}<span className="kinetic-progress-unit">%</span>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="kinetic-progress-bar-wrapper">
              <div
                className="kinetic-progress-bar-fill"
                style={{ width: `${progress}%` }}
              >
                <div className="kinetic-progress-shimmer" />
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="kinetic-metadata-grid">
              <div className="kinetic-metadata-item">
                <div className="kinetic-metadata-dot" />
                <p>Loading Inventory</p>
              </div>
              <div className="kinetic-metadata-item">
                <div className="kinetic-metadata-dot" style={{ animationDelay: '0.3s' }} />
                <p>Applying Filters</p>
              </div>
              <div className="kinetic-metadata-item">
                <div className="kinetic-metadata-dot" style={{ animationDelay: '0.6s' }} />
                <p>Syncing Recommendations</p>
              </div>
              <div className="kinetic-metadata-item">
                <div className="kinetic-metadata-dot" style={{ animationDelay: '0.9s' }} />
                <p>Securing Session</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Tech Info */}
        <footer className="kinetic-footer">
          <div className="kinetic-footer-item">
            <span className="kinetic-footer-label">Session ID</span>
            <span className="kinetic-footer-value">BK-{Math.floor(Math.random() * 9000 + 1000)}-SHOWROOM</span>
          </div>
          <div className="kinetic-footer-item">
            <span className="kinetic-footer-label">Response Time</span>
            <span className="kinetic-footer-value">{Math.floor(Math.random() * 20 + 10)}ms / CLOUD-SYNC</span>
          </div>
        </footer>
      </main>
    </div>
  )
}

