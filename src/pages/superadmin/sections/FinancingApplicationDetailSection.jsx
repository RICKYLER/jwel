import { useMemo, useState, useEffect, useRef } from 'react'
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from '../../../firebase'
import './FinancingApplicationDetailSection.css'

export default function FinancingApplicationDetailSection({
  application,
  canEditOperations,
  handleCollectionUpdate,
  formatCurrency,
  formatDate,
  onBack,
}) {
  const [replyMessage, setReplyMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [conversationMessages, setConversationMessages] = useState([])
  const [liveApplication, setLiveApplication] = useState(application)
  const unsubscribeRef = useRef(null)
  const applicationUnsubscribeRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Use live application data if available, fallback to passed-in application
  const currentApplication = liveApplication || application
  const normalizedStatus = String(currentApplication?.status || 'submitted').toLowerCase()

  const downPaymentAmount = Number(currentApplication?.terms?.downPaymentAmount || 0)
  const remainingBalance = Number(currentApplication?.terms?.remainingBalance || 0)
  const monthlyAmortization = Number(currentApplication?.terms?.monthlyAmortization || 0)

  const profileRiskRatio = useMemo(() => {
    const downPaymentPercent = Number(currentApplication?.terms?.downPaymentPercent || 0)
    return `${Math.max(5, Math.min(85, Math.round(28 - downPaymentPercent / 2)))}.4%`
  }, [currentApplication?.terms?.downPaymentPercent])

  // Real-time listener for the application document itself
  useEffect(() => {
    if (!application?.id) return

    // Clean up previous subscription
    if (applicationUnsubscribeRef.current) {
      applicationUnsubscribeRef.current()
    }

    try {
      const appDocRef = doc(db, 'financingApplications', application.id)
      
      applicationUnsubscribeRef.current = onSnapshot(appDocRef, (snapshot) => {
        if (snapshot.exists()) {
          setLiveApplication({
            id: snapshot.id,
            ...snapshot.data(),
          })
        }
      }, (err) => {
        console.error('Error listening to application changes:', err)
      })
    } catch (err) {
      console.error('Error setting up application listener:', err)
    }

    // Cleanup on unmount or when application ID changes
    return () => {
      if (applicationUnsubscribeRef.current) {
        applicationUnsubscribeRef.current()
      }
    }
  }, [application?.id])

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
    if (!message.trim() || !currentApplication?.id || isSaving) return

    const user = auth.currentUser
    if (!user) return

    try {
      setIsSaving(true)
      const messagesRef = collection(db, 'financingApplications', currentApplication.id, 'messages')
      
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
        message: `Are you sure you want to qualify this application for ${currentApplication.applicant?.fullName || 'Applicant'}? This will approve their financing request and move them to the next stage. They will receive a notification of their approval.`,
        confirmText: 'Yes, Approve Application',
        cancelText: 'Cancel',
      })
      return
    }

    if (!currentApplication?.id || !canEditOperations) return

    try {
      setIsSaving(true)
      
      // Update status in Firestore
      await handleCollectionUpdate('financingApplications', currentApplication.id, {
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
    if (!currentApplication?.id || !canEditOperations) return

    try {
      setIsSaving(true)
      
      // Call Cloud Function to approve application
      const approveApplication = httpsCallable(functions, 'approveFinancingApplication')
      await approveApplication({
        applicationId: currentApplication.id,
        reviewNote: replyMessage.trim(),
      })

      // Also send as a message if there's text
      if (replyMessage.trim()) {
        await handleSendMessage(replyMessage)
      }

      // Keep detail panel open - user can see the application is approved
      // setTimeout(() => {
      //   onBack?.()
      // }, 500)
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentApplication?.id) {
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
          <p className="fa-detail-sub">Reference: {currentApplication.referenceId || currentApplication.id}</p>
        </div>
        <button type="button" className="fa-detail-back" onClick={onBack}>
          Return to List View
        </button>
      </div>

      <div className="fa-detail-grid">
        <div>
          <article className="fa-detail-card">
            <h4>Primary Applicant</h4>
            <p className="fa-person-name">{currentApplication.applicant?.fullName || 'Unknown Applicant'}</p>
            <p className="fa-person-meta">
              {currentApplication.applicant?.address || 'No address provided'}
              <br />
              {currentApplication.applicant?.contactNumber || 'No contact number'}
              <br />
              {currentApplication.submittedBy?.email || 'No email'}
            </p>
          </article>

          <article className="fa-detail-card fa-identity-card">
            <h4>ID Verification</h4>
            <div className="fa-image-container">
              <img
                className="fa-id-image"
                src={application.applicant?.identityFileUrl || application.applicant?.identityDocumentUrl || application.applicant?.idImageUrl || application.applicant?.idPhotoUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="220"%3E%3Crect fill="%23333" width="400" height="220"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="%23999"%3EID VERIFICATION%3C/text%3E%3C/svg%3E'}
                alt="ID Verification"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="220"%3E%3Crect fill="%23333" width="400" height="220"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="%23999"%3ENO IMAGE%3C/text%3E%3C/svg%3E'
                }}
              />
            </div>
            <p className="fa-kv"><strong>File:</strong> {currentApplication.applicant?.identityFileName || 'No uploaded file name'}</p>
          </article>

          <article className="fa-detail-card fa-identity-card">
            <h4>Selected Motorcycle Unit</h4>
            <div className="fa-image-container">
              <img
                className="fa-id-image"
                src={currentApplication.motorcycle?.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="220"%3E%3Crect fill="%23333" width="400" height="220"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="%23999"%3ENO IMAGE%3C/text%3E%3C/svg%3E'}
                alt="Selected Unit"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="220"%3E%3Crect fill="%23333" width="400" height="220"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="%23999"%3ENO IMAGE%3C/text%3E%3C/svg%3E'
                }}
              />
            </div>
            <p className="fa-kv"><strong>Unit:</strong> {currentApplication.motorcycle?.name || 'No unit selected'}</p>
            <p className="fa-kv"><strong>Price:</strong> {formatCurrency(currentApplication.motorcycle?.price || 0)}</p>
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
              <strong>{formatCurrency(currentApplication.motorcycle?.price || 0)}</strong>
            </div>
            <div className="fa-breakdown-row negative">
              <span>Applied Downpayment ({currentApplication.terms?.downPaymentPercent || 0}%)</span>
              <strong>-{formatCurrency(downPaymentAmount)}</strong>
            </div>
            <div className="fa-breakdown-row">
              <span>Remaining Balance</span>
              <strong>{formatCurrency(remainingBalance)}</strong>
            </div>

            <div className="fa-amort-box">
              <p>Monthly Amortization</p>
              <strong>{formatCurrency(monthlyAmortization)}</strong>
              <span>{currentApplication.terms?.paymentTerm || 0} months</span>
            </div>
          </article>

          <div className="fa-action-row">
            {(normalizedStatus === 'submitted' || normalizedStatus === 'pending' || normalizedStatus === 'reviewing' || normalizedStatus === 'under-review') && (
              <>
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
              </>
            )}
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
              {(normalizedStatus === 'approved' || normalizedStatus === 'reviewing' || normalizedStatus === 'under-review') && (
                <div className="fa-audit-item">
                  <span className="fa-dot" />
                  <div>
                    <strong>Status update {normalizedStatus === 'approved' ? 'approved' : 'under review'}</strong>
                    <br />
                    {formatDate(currentApplication.updatedAt || currentApplication.createdAt)}
                  </div>
                </div>
              )}
              {(normalizedStatus === 'completed') && (
                <div className="fa-audit-item">
                  <span className="fa-dot" />
                  <div>
                    <strong>Status update completed</strong>
                    <br />
                    {formatDate(currentApplication.updatedAt || currentApplication.createdAt)}
                  </div>
                </div>
              )}
              {currentApplication.applicant?.identityFileName && (
                <div className="fa-audit-item">
                  <span className="fa-dot" />
                  <div>
                    <strong>ID document uploaded</strong>
                    <br />
                    {currentApplication.applicant?.identityFileName}
                  </div>
                </div>
              )}
              <div className="fa-audit-item">
                <span className="fa-dot" />
                <div>
                  <strong>Application submitted</strong>
                  <br />
                  {formatDate(currentApplication.createdAt)}
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
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          background: 'linear-gradient(180deg, rgba(22, 22, 23, 0.98) 0%, #121212 100%)',
          padding: '24px',
          borderRadius: '12px',
          maxWidth: '400px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            fontWeight: 700,
            color: '#ffffff',
          }}>
            {confirmModal.title}
          </h3>
          <p style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.5',
          }}>
            {confirmModal.message}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setConfirmModal(null)}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
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
                background: 'linear-gradient(135deg, rgba(225, 1, 0, 0.2) 0%, rgba(225, 1, 0, 0.1) 100%)',
                color: '#ffffff',
                border: '1px solid rgba(225, 1, 0, 0.3)',
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
