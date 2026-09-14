import { useState, useEffect } from 'react'

const STORAGE_KEY = 'one-layer-consent-accepted'

export default function ConsentModal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY)
    if (!accepted) {
      // Small delay so the page renders first, then the modal appears
      const t = setTimeout(() => setVisible(true), 400)
      return () => clearTimeout(t)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  const handleDecline = () => {
    // Redirect away from the site
    window.location.href = 'https://www.google.com'
  }

  if (!visible) return null

  return (
    <div className="consent-overlay">
      <div className="consent-modal">
        <div className="consent-modal-header">
          <h2>Please confirm</h2>
        </div>
        <div className="consent-modal-body">
          <p>
            Welcome to ONE LAYER. By entering, you accept our terms of use and
            privacy practice. We use your details only to fulfil your orders
            and improve your experience.
          </p>
          <p className="consent-note">
            You can withdraw consent at any time by clearing your browser data.
          </p>
        </div>
        <div className="consent-modal-actions">
          <button className="btn btn-outline consent-btn" onClick={handleDecline}>
            Decline
          </button>
          <button className="btn btn-primary consent-btn" onClick={handleAccept}>
            Accept & Enter
          </button>
        </div>
      </div>
    </div>
  )
}
