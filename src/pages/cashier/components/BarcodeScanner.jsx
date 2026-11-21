import { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({ inventoryItems, onAddItem, onClose }) {
  const [barcode, setBarcode] = useState('')
  const [message, setMessage] = useState('')
  const [cameraStatus, setCameraStatus] = useState('starting')
  const inputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const animationFrameRef = useRef(null)

  const playDetectionSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return

      const audioContext = new AudioContextClass()
      const oscillator = audioContext.createOscillator()
      const gain = audioContext.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(1175, audioContext.currentTime + 0.08)
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18)

      oscillator.connect(gain)
      gain.connect(audioContext.destination)
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.2)
      oscillator.addEventListener('ended', () => audioContext.close())
    } catch {
      // Detection should still succeed when audio is unavailable.
    }
  }

  const findAndAddItem = (value) => {
    const normalizedBarcode = String(value || '').trim().toLowerCase()
    if (!normalizedBarcode) {
      setMessage('Enter a barcode or SKU.')
      return false
    }

    const matchedItem = inventoryItems.find((item) =>
      [item.sku, item.barcode, item.itemCode, item.code].some(
        (itemCode) => String(itemCode || '').trim().toLowerCase() === normalizedBarcode,
      ),
    )

    if (!matchedItem) {
      setMessage('No inventory item matches that barcode or SKU.')
      return false
    }

    onAddItem(matchedItem)
    setBarcode('')
    setMessage(`${matchedItem.name} added to the transaction.`)
    return true
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    let isMounted = true

    const stopCamera = () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }

      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    const scanFrame = async (detector) => {
      if (!isMounted || !videoRef.current || videoRef.current.readyState < 2) {
        return
      }

      try {
        const detectedCodes = await detector.detect(videoRef.current)
        const detectedValue = detectedCodes[0]?.rawValue

        if (detectedValue) {
          playDetectionSound()
          findAndAddItem(detectedValue)
          stopCamera()
          setCameraStatus('detected')
          return
        }
      } catch {
        setCameraStatus('error')
        setMessage('The camera could not read this barcode. You can type it below.')
        return
      }

      animationFrameRef.current = window.requestAnimationFrame(() => scanFrame(detector))
    }

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('unsupported')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        if ('BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector()
          setCameraStatus('active')
          scanFrame(detector)
        } else {
          setCameraStatus('camera-only')
          setMessage('Camera preview is ready. Type the barcode below to add the item.')
        }
      } catch (error) {
        setCameraStatus('blocked')
        setMessage(error?.name === 'NotAllowedError'
          ? 'Camera access was denied. You can type the barcode below.'
          : 'Camera scanning is unavailable. You can type the barcode below.')
      }
    }

    startCamera()

    return () => {
      isMounted = false
      stopCamera()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (event) => {
    event.preventDefault()
    findAndAddItem(barcode)
    inputRef.current?.focus()
  }

  return (
    <div className="cashier-barcode-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="cashier-barcode-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cashier-barcode-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="cashier-barcode-header">
          <div>
            <span className="cashier-barcode-kicker">F2 Quick Action</span>
            <h2 id="cashier-barcode-title">Scan Barcode</h2>
            <p className="cashier-barcode-subtitle">Point the camera at a product barcode to add it to the sale.</p>
          </div>
          <button type="button" className="cashier-barcode-close" onClick={onClose} aria-label="Close barcode scanner">
            ×
          </button>
        </div>

        <div className={`cashier-camera-frame ${cameraStatus}`}>
          <video ref={videoRef} className="cashier-camera-video" muted playsInline />
          <div className="cashier-camera-guide" aria-hidden="true" />
          {(cameraStatus === 'active' || cameraStatus === 'camera-only') && (
            <div className="cashier-camera-scan-line" aria-hidden="true" />
          )}
          <span className={`cashier-camera-status ${cameraStatus}`}>
            {cameraStatus === 'active'
              ? 'Camera scanning'
              : cameraStatus === 'camera-only'
                ? 'Camera ready'
                : 'Manual entry available'}
          </span>
          <span className="cashier-camera-hint">Align the barcode inside the frame</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cashier-manual-entry">
            <div className="cashier-manual-entry-heading">
              <div>
                <label className="cashier-barcode-label" htmlFor="cashier-barcode-input">
                  Manual entry
                </label>
                <span className="cashier-manual-entry-help">Use this if the camera cannot read the barcode.</span>
              </div>
              <span className="cashier-optional-badge">Optional</span>
            </div>
            <div className="cashier-barcode-input-wrap">
              <span className="cashier-barcode-input-icon" aria-hidden="true">⌕</span>
              <input
                ref={inputRef}
                id="cashier-barcode-input"
                className="cashier-barcode-input"
                type="text"
                value={barcode}
                onChange={(event) => {
                  setBarcode(event.target.value)
                  setMessage('')
                }}
                placeholder="Type barcode or SKU"
                autoComplete="off"
              />
            </div>
          </div>
          <p className={`cashier-barcode-message ${message.includes('added') ? 'success' : ''}`} aria-live="polite">
            {message || 'Press Enter after scanning to add the item.'}
          </p>
          <div className="cashier-barcode-actions">
            <button type="button" className="cashier-barcode-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="cashier-barcode-submit">Add Item</button>
          </div>
        </form>
      </section>
    </div>
  )
}