import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, limit } from 'firebase/firestore'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import CircleRoundedIcon from '@mui/icons-material/CircleRounded'
import { db } from '../../../firebase'
import './ChatsManagementSection.css'

export default function ChatsManagementSection({ searchTerm = '' }) {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [responseText, setResponseText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)
  const [conversationLastMessages, setConversationLastMessages] = useState({})

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
        
        // Fetch last message for each conversation
        conversationsList.forEach((conv) => {
          const messagesRef = collection(db, `conversations/${conv.id}/messages`)
          const msgQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1))
          getDocs(msgQuery).then((snapshot) => {
            if (snapshot.docs.length > 0) {
              const lastMsg = snapshot.docs[0].data()
              setConversationLastMessages((prev) => ({
                ...prev,
                [conv.id]: lastMsg,
              }))
            }
          })
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

    return () => unsubscribe()
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
      },
      (error) => {
        console.error('Error loading messages:', error)
      }
    )

    return () => unsubscribe()
  }, [selectedConversation])

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations

    const searchLower = searchTerm.toLowerCase()
    return conversations.filter(
      (conv) =>
        conv.userName?.toLowerCase().includes(searchLower) ||
        conv.userEmail?.toLowerCase().includes(searchLower)
    )
  }, [conversations, searchTerm])

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
          <h3 className="text-lg font-bold text-white">Active Chats</h3>
          <p className="text-xs text-neutral-400 mt-1">{filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}</p>
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
                        className={conv.status === 'open' ? 'text-emerald-500' : 'text-neutral-600'}
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
              <p className="text-sm">No conversations yet</p>
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
              <button
                type="button"
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg text-white transition"
              >
                <CloseRoundedIcon sx={{ fontSize: 24 }} />
              </button>
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
                placeholder="Type your response..."
                rows="3"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-neutral-500 resize-none focus:border-blue-600/50 focus:outline-none"
              />
              <button
                onClick={handleSendResponse}
                disabled={isSending || !responseText.trim()}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
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
