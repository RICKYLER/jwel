import { useMemo, useState, useEffect, useRef } from 'react'
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore'
import { auth, db } from '../../../firebase'
import './FinancingApplicationDetailSection.css'

export default function FinancingApplicationDetailSection({
  application,
  canEditOperations,
  handleCollectionUpdate,
  formatCurrency,
  formatDate,
  onBack,
  isDarkMode = false,
}) {
  const [replyMessage, setReplyMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [conversationMessages, setConversationMessages] = useState([])
  const unsubscribeRef = useRef(null)
  const messagesEndRef = useRef(null)

  const normalizedStatus = String(application?.status || 'submitted').toLowerCase()

  const downPaymentAmount = Number(application?.terms?.downPaymentAmount || 0)
  const remainingBalance = Number(application?.terms?.remainingBalance || 0)
  const monthlyAmortization = Number(application?.terms?.monthlyAmortization || 0)

  const profileRiskRatio = useMemo(() => {
    const downPaymentPercent = Number(application?.terms?.downPaymentPercent || 0)
    return `${Math.max(5, Math.min(85, Math.round(28 - downPaymentPercent / 2)))}.4%`
  }, [application?.terms?.downPaymentPercent])

  // Real-time listener for conversation messages
  useEffect(() => {
    if (!application?.id) return

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    try {
      const messagesRef = collection(db, 'financingApplications', application.id, 'messages')
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'))
      
      unsubscribeRef.current = onSnapshot(messagesQuery, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date(),
        }))
        setConversationMessages(msgs)
        // Auto-scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 0)
      })
    } catch (err) {
      console.error('Error setting up message listener:', err)
    }

    // Cleanup on unmount or when application ID changes
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [application?.id])

  const handleSendMessage = async (message) => {
    if (!message.trim() || !application?.id || isSaving) return

    const user = auth.currentUser
    if (!user) return

    try {
      setIsSaving(true)
      const messagesRef = collection(db, 'financingApplications', application.id, 'messages')
      
      await addDoc(messagesRef, {
        senderType: 'admin',
        senderName: user.displayName || 'Admin',
        senderId: user.uid,
        message: message.trim(),
        timestamp: serverTimestamp(),
        isRead: false,
      })
      
      setReplyMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusAction = async (nextStatus) => {
    // For "approved" status, request permission first
    if (nextStatus === 'approved') {
      setConfirmModal({
        open: true,
        type: 'qualify',
        title: 'Qualify Application?',
        message: `Are you sure you want to qualify this application for ${application.applicant?.fullName || 'Applicant'}? This will approve their financing request and move them to the next stage. They will receive a notification of their approval.`,
        confirmText: 'Yes, Approve Application',
        cancelText: 'Cancel',
      })
      return
    }

    if (!application?.id || !canEditOperations) return

    try {
      setIsSaving(true)
      
      // Update status in Firestore
      await handleCollectionUpdate('financingApplications', application.id, {
        status: nextStatus,
        reviewNote: replyMessage.trim(),
      })
      
      // Also send as a message if there's text
      if (replyMessage.trim()) {
        await handleSendMessage(replyMessage)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmQualification = async () => {
    setConfirmModal(null)
    if (!application?.id || !canEditOperations) return

    try {
      setIsSaving(true)
      
      // Update status to approved
      await handleCollectionUpdate('financingApplications', application.id, {
        status: 'approved',
        reviewNote: replyMessage.trim(),
      })
      
      // Also send as a message if there's text
      if (replyMessage.trim()) {
        await handleSendMessage(replyMessage)
      }

      // Close the detail panel and return to list
      setTimeout(() => {
        onBack?.()
      }, 500)
    } finally {
      setIsSaving(false)
    }
  }

  if (!application?.id) {
    return (
      <section className="fa-detail-shell rounded-xl p-6">
        <div className="fa-detail-top">
          <div>
            <h3 className="fa-detail-title">Financing Inquiry Response Detail</h3>
            <p className="fa-detail-sub">Select an application from the list to review.</p>
          </div>
          <button type="button" className="fa-detail-back" onClick={onBack}>
            Back to Applications
          </button>
        </div>
      </section>
    )
  }

  return (
    <>
    <section className="fa-detail-shell rounded-xl p-6">
      <div className="fa-detail-top">
        <div>
          <h3 className="fa-detail-title">Financing Inquiry Response Detail</h3>
          <p className="fa-detail-sub">Reference: {application.referenceId || application.id}</p>
        </div>
        <button type="button" className="fa-detail-back" onClick={onBack}>
          Return to List View
        </button>
      </div>

      <div className="fa-detail-grid">
        <div>
          <article className="fa-detail-card">
            <h4>Primary Applicant</h4>
            <p className="fa-person-name">{application.applicant?.fullName || 'Unknown Applicant'}</p>
            <p className="fa-person-meta">
              {application.applicant?.address || 'No address provided'}
              <br />
              {application.applicant?.contactNumber || 'No contact number'}
              <br />
              {application.submittedBy?.email || 'No email'}
            </p>
          </article>

          <article className="fa-detail-card fa-identity-card">
            <h4>ID Verification</h4>
            <img
              className="fa-id-image"
              src={application.motorcycle?.imageUrl || 'https://via.placeholder.com/400x220?text=ID+VERIFICATION'}
              alt="Verification"
            />
            <p className="fa-kv"><strong>File:</strong> {application.applicant?.identityFileName || 'No uploaded file name'}</p>
          </article>
        </div>

        <div>
          <article className="fa-detail-card">
            <h4>Financial Profile</h4>
            <div className="fa-net-worth">
              <div className="fa-net-box">
                <p>Monthly Net Income</p>
                <strong>{application.terms?.incomeRange || 'N/A'}</strong>
              </div>
              <div className="fa-net-box">
                <p>Debt Ratio</p>
                <strong className="percent">{profileRiskRatio}</strong>
              </div>
            </div>
            <div className="fa-profile-history">
              <h5>Employment History</h5>
              Stable applicant profile and active credit request in {normalizedStatus.replace('-', ' ')} state.
            </div>
          </article>

          <article className="fa-detail-card fa-identity-card">
            <h4>Financing Breakdown</h4>
            <div className="fa-breakdown-row">
              <span>Vehicle SRP</span>
              <strong>{formatCurrency(application.motorcycle?.price || 0)}</strong>
            </div>
            <div className="fa-breakdown-row negative">
              <span>Applied Downpayment ({application.terms?.downPaymentPercent || 0}%)</span>
              <strong>-{formatCurrency(downPaymentAmount)}</strong>
            </div>
            <div className="fa-breakdown-row">
              <span>Remaining Balance</span>
              <strong>{formatCurrency(remainingBalance)}</strong>
            </div>

            <div className="fa-amort-box">
              <p>Monthly Amortization</p>
              <strong>{formatCurrency(monthlyAmortization)}</strong>
              <span>{application.terms?.paymentTerm || 0} months</span>
            </div>
          </article>

          <div className="fa-action-row">
            <button
              type="button"
              className="qualify"
              disabled={!canEditOperations || isSaving}
              onClick={() => void handleStatusAction('approved')}
            >
              Qualify Application
            </button>
            <button
              type="button"
              className="disqualify"
              disabled={!canEditOperations || isSaving}
              onClick={() => void handleStatusAction('rejected')}
            >
              Disqualify
            </button>
          </div>
        </div>

        <div>
          <article className="fa-response-box">
            <h4>Direct Response - Live Chat</h4>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px', marginBottom: 0 }}>
              Real-time conversation with {application.applicant?.fullName || 'Applicant'}
            </p>
          </article>

          <article className="fa-response-input" style={{ display: 'flex', flexDirection: 'column', minHeight: '350px' }}>
            {/* Message Display Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              marginBottom: '16px',
              background: '#f5f5f5',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              border: '1px solid #e0e0e0',
            }}>
              {conversationMessages.length === 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#999',
                  fontSize: '12px',
                  fontWeight: '500',
                  textAlign: 'center',
                }}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                conversationMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: msg.senderType === 'admin' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '75%',
                        background: msg.senderType === 'admin' ? '#b80012' : '#e0e0e0',
                        color: msg.senderType === 'admin' ? '#fff' : '#333',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        wordWrap: 'break-word',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>
                        {msg.senderName || (msg.senderType === 'admin' ? 'You' : 'Applicant')}
                      </p>
                      <p style={{ margin: 0, lineHeight: 1.4 }}>{msg.message}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '10px', opacity: 0.6 }}>
                        {msg.timestamp?.toLocaleTimeString?.('en-PH', { hour: '2-digit', minute: '2-digit' }) || ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Area */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <textarea
                value={replyMessage}
                onChange={(event) => setReplyMessage(event.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(replyMessage)
                  }
                }}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  background: '#fff',
                  color: '#333',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  maxHeight: '80px',
                  transition: 'border-color 0.2s',
                }}
              />
              <button
                type="button"
                onClick={() => handleSendMessage(replyMessage)}
                disabled={isSaving || !canEditOperations || !replyMessage.trim()}
                style={{
                  padding: '10px 14px',
                  background: '#b80012',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: isSaving || !canEditOperations || !replyMessage.trim() ? 'not-allowed' : 'pointer',
                  opacity: isSaving || !canEditOperations || !replyMessage.trim() ? 0.6 : 1,
                  transition: 'all 0.2s',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isSaving ? '...' : 'Send'}
              </button>
            </div>
          </article>

          <article className="fa-detail-card fa-identity-card">
            <h4>Application Audit</h4>
            <div className="fa-audit-list">
              <div className="fa-audit-item">
                <span className="fa-dot" />
                <div>
                  <strong>Status update under review</strong>
                  <br />
                  {formatDate(application.updatedAt || application.createdAt)}
                </div>
              </div>
              <div className="fa-audit-item">
                <span className="fa-dot" />
                <div>
                  <strong>Additional document uploaded</strong>
                  <br />
                  {application.applicant?.identityFileName || 'No file attached'}
                </div>
              </div>
              <div className="fa-audit-item">
                <span className="fa-dot" />
                <div>
                  <strong>Initial submission received</strong>
                  <br />
                  {formatDate(application.createdAt)}
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    {/* Confirmation Modal */}
    {confirmModal?.open && (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          background: isDarkMode ? '#1f2937' : '#ffffff',
          padding: '24px',
          borderRadius: '12px',
          maxWidth: '400px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            fontWeight: 700,
            color: isDarkMode ? '#ffffff' : '#1f2937',
          }}>
            {confirmModal.title}
          </h3>
          <p style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: isDarkMode ? '#d1d5db' : '#4b5563',
            lineHeight: '1.5',
          }}>
            {confirmModal.message}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setConfirmModal(null)}
              style={{
                padding: '8px 16px',
                background: isDarkMode ? '#374151' : '#e5e7eb',
                color: isDarkMode ? '#d1d5db' : '#1f2937',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {confirmModal.cancelText || 'Cancel'}
            </button>
            <button
              onClick={handleConfirmQualification}
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                background: '#b80012',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.5 : 1,
              }}
            >
              {isSaving ? 'Processing...' : (confirmModal.confirmText || 'Confirm')}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
