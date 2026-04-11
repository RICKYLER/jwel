import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, getDocs, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, limit, where } from 'firebase/firestore'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import CircleRoundedIcon from '@mui/icons-material/CircleRounded'
import { db } from '../../../firebase'
import './ChatsManagementSection.css'

export default function ChatsManagementSection({
  searchTerm = '',
  onUnreadCountChange,
  focusRequest,
  onConversationRead,
}) {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [responseText, setResponseText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('active')
  const [conversationLastMessages, setConversationLastMessages] = useState({})
  const unsubscribersRef = useRef(new Map())

  // Load all conversations
  useEffect(() => {
    const conversationsRef = collection(db, 'conversations')
    const q = query(conversationsRef, orderBy('updatedAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conversationsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setConversations(conversationsList)
        setSelectedConversation((current) => (
          current ? conversationsList.find((conversation) => conversation.id === current.id) ?? null : null
        ))
        
        // Set up real-time listeners for last message of each conversation
        conversationsList.forEach((conv) => {
          // Unsubscribe from previous listener if exists
          if (unsubscribersRef.current.has(conv.id)) {
            unsubscribersRef.current.get(conv.id)()
          }

          const messagesRef = collection(db, `conversations/${conv.id}/messages`)
          const msgQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1))
          
          // Use real-time listener instead of one-time fetch
          const msgUnsubscribe = onSnapshot(
            msgQuery,
            (msgSnapshot) => {
              if (msgSnapshot.docs.length > 0) {
                const lastMsg = msgSnapshot.docs[0].data()
                setConversationLastMessages((prev) => ({
                  ...prev,
                  [conv.id]: lastMsg,
                }))
              }
            },
            (error) => console.warn(`Error loading messages for conv ${conv.id}`, error)
          )
          
          unsubscribersRef.current.set(conv.id, msgUnsubscribe)
        })
        
        setError(null)
        setIsLoading(false)
      },
      (error) => {
        console.error('Error loading conversations:', error)
        setError(error.message || 'Unable to load conversations. Please check your permissions.')
        setIsLoading(false)
      }
    )

    return () => {
      unsubscribe()
      unsubscribersRef.current.forEach((unsub) => unsub())
      unsubscribersRef.current.clear()
    }
  }, [])

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return

    const messagesRef = collection(db, `conversations/${selectedConversation.id}/messages`)
    const q = query(messagesRef, orderBy('timestamp', 'asc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date(),
        }))
        setMessages(messagesList)
        
        // Trigger unread count update in parent when messages change
        if (onUnreadCountChange) {
          onUnreadCountChange()
        }
      },
      (error) => {
        console.error('Error loading messages:', error)
      }
    )

    return () => unsubscribe()
  }, [selectedConversation, onUnreadCountChange])

  const activeConversationCount = useMemo(
    () => conversations.filter((conv) => conv.status !== 'archived' && conv.status !== 'deleted').length,
    [conversations],
  )

  const archivedConversationCount = useMemo(
    () => conversations.filter((conv) => conv.status === 'archived').length,
    [conversations],
  )

  // Filter conversations based on search and active/archived mode
  const filteredConversations = useMemo(() => {
    const baseConversations = conversations.filter((conv) => {
      if (viewMode === 'archived') {
        return conv.status === 'archived'
      }

      return conv.status !== 'archived' && conv.status !== 'deleted'
    })

    if (!searchTerm.trim()) return baseConversations

    const searchLower = searchTerm.toLowerCase()
    return baseConversations.filter(
      (conv) =>
        conv.userName?.toLowerCase().includes(searchLower) ||
        conv.userEmail?.toLowerCase().includes(searchLower)
    )
  }, [conversations, searchTerm, viewMode])

  const handleSendResponse = async () => {
    if (!responseText.trim() || !selectedConversation) return

    setIsSending(true)
    try {
      // Add admin response to messages
      await addDoc(collection(db, `conversations/${selectedConversation.id}/messages`), {
        type: 'admin',
        text: responseText,
        sender: 'admin',
        senderName: 'BYKELINK Admin',
        timestamp: serverTimestamp(),
        read: true,
      })

      // Update conversation updatedAt timestamp
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        updatedAt: serverTimestamp(),
        status: 'responded',
      })

      setResponseText('')
    } catch (error) {
      console.error('Error sending response:', error)
    } finally {
      setIsSending(false)
    }
  }

  // Mark unread messages as read when admin views a conversation
  const markMessagesAsRead = async (conversationId) => {
    try {
      const messagesRef = collection(db, `conversations/${conversationId}/messages`)
      const unreadQuery = query(messagesRef, where('read', '==', false), where('type', '==', 'user'))
      const unreadSnap = await getDocs(unreadQuery)

      for (const msgDoc of unreadSnap.docs) {
        await updateDoc(msgDoc.ref, { read: true })
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      markMessagesAsRead(selectedConversation.id)
      onConversationRead?.(selectedConversation.id)
    }
  }, [onConversationRead, selectedConversation])

  useEffect(() => {
    if (!focusRequest?.conversationId || !conversations.length) {
      return
    }

    const targetConversation = conversations.find((conversation) => conversation.id === focusRequest.conversationId)
    if (!targetConversation) {
      return
    }

    setViewMode(targetConversation.status === 'archived' ? 'archived' : 'active')
    setSelectedConversation(targetConversation)
  }, [conversations, focusRequest])

  const handleConversationStatusChange = async (conversationId, status) => {
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        status,
        updatedAt: serverTimestamp(),
      })

      setSelectedConversation((current) => (
        current?.id === conversationId
          ? { ...current, status }
          : current
      ))

      if (status === 'archived') {
        setViewMode('archived')
      }

      if (status === 'open') {
        setViewMode('active')
      }

      if (status === 'deleted' && selectedConversation?.id === conversationId) {
        setSelectedConversation(null)
        setMessages([])
        setViewMode('active')
      }
    } catch (error) {
      console.error(`Error updating conversation status to ${status}:`, error)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`

    return date.toLocaleDateString()
  }

  const formatTime = (date) => {
    if (!date) return ''
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <div className="chats-management-container">
      {/* Conversations List */}
      <div className="conversations-sidebar">
        <div className="sidebar-header">
          <h3 className="text-lg font-bold text-white">{viewMode === 'archived' ? 'Archived Messages' : 'Active Chats'}</h3>
          <p className="mt-1 text-xs text-neutral-400">{filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode('active')}
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] transition ${viewMode === 'active' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              Active Chats ({activeConversationCount})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('archived')}
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] transition ${viewMode === 'archived' ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              Archived Messages ({archivedConversationCount})
            </button>
          </div>
        </div>

        <div className="conversations-list">
          {error ? (
            <div className="pt-8 text-center text-red-400">
              <p className="text-sm font-semibold mb-2">Permission Error</p>
              <p className="text-xs text-neutral-400 px-4">{error}</p>
              <p className="text-xs text-neutral-500 mt-4 px-4">Please ensure Firestore rules are configured correctly for conversations collection.</p>
            </div>
          ) : isLoading ? (
            <div className="pt-8 text-center text-neutral-400">
              <p className="text-sm">Loading conversations...</p>
            </div>
          ) : filteredConversations.length ? (
            filteredConversations.map((conv) => {
              const lastMessage = conversationLastMessages[conv.id] || { text: 'No messages yet' }
              const isSelected = selectedConversation?.id === conv.id

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`conversation-item ${isSelected ? 'active' : ''}`}
                >
                  <div className="conversation-header">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">{conv.userName}</h4>
                      <CircleRoundedIcon
                        sx={{ fontSize: 8 }}
                        className={conv.status === 'archived' ? 'text-amber-400' : conv.status === 'open' ? 'text-emerald-500' : 'text-neutral-600'}
                      />
                    </div>
                    <span className="text-xs text-neutral-500">{formatDate(conv.updatedAt?.toDate?.(new Date()))}</span>
                  </div>
                  <p className="text-sm text-neutral-400 truncate">{lastMessage?.text || 'No messages yet'}</p>
                </button>
              )
            })
          ) : (
            <div className="pt-8 text-center text-neutral-500">
              <p className="text-sm">{viewMode === 'archived' ? 'No archived conversations yet' : 'No conversations yet'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat View */}
      <div className="chat-view">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedConversation.userName}</h3>
                <p className="text-xs text-neutral-400">{selectedConversation.userEmail}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedConversation.status === 'archived' ? (
                  <button
                    type="button"
                    onClick={() => handleConversationStatusChange(selectedConversation.id, 'open')}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConversationStatusChange(selectedConversation.id, 'archived')}
                    className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black transition hover:bg-amber-400"
                  >
                    Archive
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleConversationStatusChange(selectedConversation.id, 'deleted')}
                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedConversation(null)}
                  className="rounded-lg p-2 text-white transition hover:bg-white/10 md:hidden"
                >
                  <CloseRoundedIcon sx={{ fontSize: 24 }} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.length ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message-bubble ${message.type === 'user' ? 'user-message' : 'admin-message'}`}
                  >
                    <div className="message-content">
                      <div className="text-xs font-semibold text-neutral-300 mb-1">{message.senderName}</div>
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <div className="text-xs mt-2 opacity-75">{formatTime(message.timestamp)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-neutral-500 pt-8">
                  <SmartToyRoundedIcon sx={{ fontSize: 40 }} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No messages in this conversation</p>
                </div>
              )}
            </div>

            {/* Response Input */}
            <div className="response-input">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder={selectedConversation.status === 'archived' ? 'Restore this conversation to reply...' : 'Type your response...'}
                rows="3"
                disabled={selectedConversation.status === 'archived'}
                className="flex-1 resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-neutral-500 focus:border-blue-600/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                onClick={handleSendResponse}
                disabled={isSending || !responseText.trim() || selectedConversation.status === 'archived'}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                <SendRoundedIcon sx={{ fontSize: 18 }} />
                {isSending ? 'Sending...' : 'Send Response'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-neutral-500 flex items-center justify-center h-full">
            <div>
              <SmartToyRoundedIcon sx={{ fontSize: 60 }} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold">Select a conversation to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
