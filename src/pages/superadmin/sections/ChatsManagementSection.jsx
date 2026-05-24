import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { collection, getDocs, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, limit, where } from 'firebase/firestore'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import CircleRoundedIcon from '@mui/icons-material/CircleRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import CheckboxOutlinedIcon from '@mui/icons-material/CheckboxOutlined'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded'
import EmojiEmotionsRoundedIcon from '@mui/icons-material/EmojiEmotionsRounded'
import { db } from '../../../firebase'
import ConfirmationModal from '../components/ConfirmationModal'
import './ChatsManagementSection.css'

export default function ChatsManagementSection({
  searchTerm = '',
  onUnreadCountChange,
  focusRequest,
  onConversationRead,
  isDarkMode = true,
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
  const [selectedConversationIds, setSelectedConversationIds] = useState(new Set())
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false)
  const unsubscribersRef = useRef(new Map())
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  // Load all conversations
  useEffect(() => {
    const conversationsRef = collection(db, 'conversations')
    const q = query(conversationsRef, orderBy('updatedAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
       const conversationsList = snapshot.docs.map((doc) => {
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    // normalize for UI
    displayName: data.senderName || "Unknown User",
    otherUserAvatar: data.senderAvatar || data.otherUserAvatar || null,
    userEmail: data.userEmail || "",
  }
})
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const unsubs = unsubscribersRef.current
      unsubs.forEach((unsub) => unsub())
      unsubs.clear()
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

  // Scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom()
    }, 100)
    return () => clearTimeout(timer)
  }, [messages])

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
        conv.displayName?.toLowerCase().includes(searchLower) ||
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
    setSelectedConversationIds(new Set())
    setIsBulkDeleteMode(false)
  }, [conversations, focusRequest])

  const handleConversationStatusChange = useCallback(async (conversationId, status) => {
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
  }, [selectedConversation])

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

  const toggleSelectAll = useCallback(() => {
    if (selectedConversationIds.size === filteredConversations.length) {
      setSelectedConversationIds(new Set())
    } else {
      setSelectedConversationIds(new Set(filteredConversations.map((conv) => conv.id)))
    }
  }, [filteredConversations, selectedConversationIds.size])

  const switchViewMode = useCallback((mode) => {
    setViewMode(mode)
    setSelectedConversationIds(new Set())
    setIsBulkDeleteMode(false)
  }, [])

  const handleDeleteChatClick = useCallback((conversationId, e) => {
    e.stopPropagation()
    setDeleteConfirmation({
      type: 'single',
      conversationId,
      title: 'Delete Conversation',
      message: 'Are you sure you want to delete this conversation? This action cannot be undone.',
    })
  }, [])

  const handleBulkDeleteClick = useCallback(() => {
    setDeleteConfirmation({
      type: 'bulk',
      conversationIds: Array.from(selectedConversationIds),
      title: 'Delete Selected Conversations',
      message: `Are you sure you want to delete ${selectedConversationIds.size} conversation${selectedConversationIds.size !== 1 ? 's' : ''}? This action cannot be undone.`,
    })
  }, [selectedConversationIds])

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmation) return

    try {
      if (deleteConfirmation.type === 'single' && deleteConfirmation.conversationId) {
        await handleConversationStatusChange(deleteConfirmation.conversationId, 'deleted')
      } else if (deleteConfirmation.type === 'bulk' && deleteConfirmation.conversationIds?.length) {
        for (const conversationId of deleteConfirmation.conversationIds) {
          await updateDoc(doc(db, 'conversations', conversationId), {
            status: 'deleted',
            updatedAt: serverTimestamp(),
          })
        }
        setSelectedConversationIds(new Set())
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }

    setDeleteConfirmation(null)
    setIsBulkDeleteMode(false)
  }, [deleteConfirmation, handleConversationStatusChange])

  return (
    <div className={`chats-management-container ${!isDarkMode ? 'light-mode' : ''}`}>
      {/* Conversations List */}
      <div className="conversations-sidebar">
        <div className="sidebar-header">
          <h3 className="text-lg font-bold text-white">{viewMode === 'archived' ? 'Archived Messages' : 'Active Chats'}</h3>
          <p className="mt-1 text-xs text-neutral-400">{filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => switchViewMode('active')}
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] transition ${viewMode === 'active' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              Active Chats ({activeConversationCount})
            </button>
            <button
              type="button"
              onClick={() => switchViewMode('archived')}
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] transition ${viewMode === 'archived' ? 'bg-gray-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              Archived Messages ({archivedConversationCount})
            </button>
          </div>

          {viewMode === 'active' && filteredConversations.length > 0 && isBulkDeleteMode && (
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-white/60 transition hover:text-white"
                title={selectedConversationIds.size === filteredConversations.length ? 'Deselect all' : 'Select all'}
              >
                {selectedConversationIds.size === filteredConversations.length ? (
                  <CheckboxOutlinedIcon sx={{ fontSize: 20 }} />
                ) : (
                  <CheckBoxOutlineBlankIcon sx={{ fontSize: 20 }} />
                )}
              </button>
              <span className="text-xs text-white/50">
                {selectedConversationIds.size > 0 ? `${selectedConversationIds.size} selected` : 'Select all conversations'}
              </span>
            </div>
          )}

          {viewMode === 'active' && filteredConversations.length > 0 && selectedConversationIds.size > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkDeleteClick}
                className="flex items-center gap-2 rounded-lg bg-red-600/20 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-600/30"
              >
                <DeleteSweepRoundedIcon sx={{ fontSize: 16 }} />
                Delete ({selectedConversationIds.size})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedConversationIds(new Set())
                  setIsBulkDeleteMode(false)
                }}
                className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          )}

          {viewMode === 'active' && filteredConversations.length > 0 && !isBulkDeleteMode && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setIsBulkDeleteMode(true)
                  setSelectedConversationIds(new Set())
                }}
                className="w-full rounded-lg bg-red-600/20 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-600/30"
              >
                Select for Bulk Delete
              </button>
            </div>
          )}
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
              const lastMessage = conversationLastMessages[conv.id] || {}
              const isSelected = selectedConversation?.id === conv.id
              const isChecked = selectedConversationIds.has(conv.id)

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (!isBulkDeleteMode) {
                      setSelectedConversation(conv)
                    } else {
                      // Toggle selection in bulk delete mode
                      const newSet = new Set(selectedConversationIds)
                      if (newSet.has(conv.id)) {
                        newSet.delete(conv.id)
                      } else {
                        newSet.add(conv.id)
                      }
                      setSelectedConversationIds(newSet)
                    }
                  }}
                  className={`w-full border-b px-4 py-3 transition text-left cursor-pointer ${
                    isBulkDeleteMode
                      ? isChecked
                        ? 'bg-red-600/20 border-red-600/50'
                        : 'hover:bg-red-600/10 border-slate-800'
                      : isSelected
                        ? 'bg-slate-800 border-slate-700'
                        : 'hover:bg-slate-800/50 border-slate-800'
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start gap-3">
                    {isBulkDeleteMode && (
                      <div className="mt-1">
                        {isChecked ? (
                          <CheckboxOutlinedIcon sx={{ fontSize: 20 }} className="text-red-600" />
                        ) : (
                          <CheckBoxOutlineBlankIcon sx={{ fontSize: 20 }} className="text-white/40" />
                        )}
                      </div>
                    )}
                    
                    <div className="shrink-0">
                      {conv.otherUserAvatar ? (
                        <img
                          src={conv.otherUserAvatar}
                          alt={conv.displayName}
                          className="w-12 h-12 rounded-full object-cover border border-red-600"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold bg-slate-700">
                          {(conv.displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        isBulkDeleteMode
                          ? isChecked
                            ? 'text-white'
                            : 'text-slate-400'
                          : isSelected
                            ? 'text-white'
                            : 'text-white'
                      }`}>
                        {conv.displayName || 'Unknown User'}
                      </p>
                      <p className={`text-xs truncate mt-1 ${
                        isBulkDeleteMode
                          ? isChecked
                            ? 'text-slate-300'
                            : 'text-slate-500'
                          : isSelected
                            ? 'text-slate-300'
                            : 'text-slate-400'
                      }`}>
                        {lastMessage?.text || 'No messages yet'}
                      </p>
                      <p className="text-xs mt-1 text-slate-500">
                        {formatDate(conv.updatedAt?.toDate?.() || new Date())}
                      </p>
                    </div>
                    
                    {!isBulkDeleteMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteChatClick(conv.id, e)
                        }}
                        className="shrink-0 rounded-lg bg-red-600/10 p-1.5 text-red-400 transition hover:bg-red-600/20"
                        title="Delete conversation"
                      >
                        <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                      </button>
                    )}
                  </div>
                </div>
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
                <h3 className="text-lg font-bold text-white">{selectedConversation.senderName}</h3>
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
                    className="rounded-lg bg-gray-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-gray-600"
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
                messages.map((message, index) => {
                  const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId
                  const isAdminMessage = message.sender === 'admin' || message.type === 'admin'

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-2 mb-4 ${isAdminMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isAdminMessage && (
                        <div className="shrink-0">
                          {showAvatar ? (
                            message.senderAvatar ? (
                              <img
                                src={message.senderAvatar}
                                alt={message.senderName}
                                className="w-8 h-8 rounded-full object-cover border border-red-600"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-slate-700">
                                {message.senderName?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )
                          ) : (
                            <div className="w-8" />
                          )}
                        </div>
                      )}
                      
                      <div className={`max-w-xs ${isAdminMessage ? 'flex-row-reverse' : ''}`}>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isAdminMessage
                              ? 'bg-red-600 text-white rounded-br-none'
                              : 'bg-slate-800 text-white rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                        </div>
                        <p className={`text-xs mt-1 text-slate-500 ${isAdminMessage ? 'text-right' : 'text-left'}`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center text-neutral-500 pt-8">
                  <SmartToyRoundedIcon sx={{ fontSize: 40 }} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No messages in this conversation</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Response Input */}
            <div className="response-input">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder={selectedConversation.status === 'archived' ? 'Restore this conversation to reply...' : 'Type your response...'}
                rows="2"
                disabled={selectedConversation.status === 'archived'}
                className="resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-neutral-500 focus:border-red-600/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                className="p-2 text-white/60 hover:text-red-600 transition"
                title="Emoji"
              >
                <EmojiEmotionsRoundedIcon sx={{ fontSize: 20 }} />
              </button>
              <button
                onClick={handleSendResponse}
                disabled={isSending || !responseText.trim() || selectedConversation.status === 'archived'}
                className="p-2 text-white/60 hover:text-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={isSending ? 'Sending...' : 'Send'}
              >
                <SendRoundedIcon sx={{ fontSize: 20 }} />
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

      <ConfirmationModal
        open={!!deleteConfirmation}
        title={deleteConfirmation?.title || ''}
        message={deleteConfirmation?.message || ''}
        confirmText={deleteConfirmation?.type === 'bulk' ? 'Delete All' : 'Delete'}
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation(null)}
        isDangerous={true}
        isDarkMode={isDarkMode}
      />
    </div>
  )
}
