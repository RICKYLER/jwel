import { useState, useRef, useEffect } from 'react'
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded'
import { db } from '../firebase'

export default function ChatBox({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hey there! 👋 Welcome to BYKELINK. How can we help you today?',
      timestamp: new Date(),
      sender: 'bot',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Lazy initialize conversation - only when user sends first message
  useEffect(() => {
    setIsInitializing(false)
  }, [])

  // Helper function to get or create conversation (called on first message)
  const getOrCreateConversation = async () => {
    if (conversationId) return conversationId

    try {
      const conversationsRef = collection(db, 'conversations')
      
      // For authenticated users, check for existing open conversation
      if (currentUser?.uid) {
        const q = query(
          conversationsRef,
          where('userId', '==', currentUser.uid),
          where('status', '==', 'open')
        )
        const querySnapshot = await getDocs(q)

        if (querySnapshot.docs.length > 0) {
          const existingConv = querySnapshot.docs[0]
          setConversationId(existingConv.id)
          return existingConv.id
        }

        // Create new conversation for authenticated user
        const newConvRef = await addDoc(conversationsRef, {
          userId: currentUser.uid,
          userEmail: currentUser.email || 'anonymous@bykelink.com',
          userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Guest',
          isGuest: false,
          status: 'open',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessageTime: serverTimestamp(),
          messageCount: 0,
          participants: [currentUser.uid],
        })
        setConversationId(newConvRef.id)
        return newConvRef.id
      } else {
        // For guests, check localStorage for existing guest conversation ID
        const storedGuestUserId = localStorage.getItem('bykelink_guest_user_id')

        if (storedGuestUserId) {
          const guestConversationQuery = query(
            conversationsRef,
            where('userId', '==', storedGuestUserId),
            where('isGuest', '==', true),
            where('status', '==', 'open')
          )
          const guestConversationSnapshot = await getDocs(guestConversationQuery)

          if (guestConversationSnapshot.docs.length > 0) {
            const existingGuestConversation = guestConversationSnapshot.docs[0]
            localStorage.setItem('bykelink_guest_conversation_id', existingGuestConversation.id)
            setConversationId(existingGuestConversation.id)
            return existingGuestConversation.id
          }
        }

        // Create new guest conversation
        const guestUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newConvRef = await addDoc(conversationsRef, {
          userId: guestUserId,
          userEmail: 'guest@bykelink.com',
          userName: 'Guest User',
          isGuest: true,
          status: 'open',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessageTime: serverTimestamp(),
          messageCount: 0,
          participants: [guestUserId],
        })
        
        localStorage.setItem('bykelink_guest_conversation_id', newConvRef.id)
        localStorage.setItem('bykelink_guest_user_id', guestUserId)
        
        setConversationId(newConvRef.id)
        return newConvRef.id
      }
    } catch (error) {
      console.error('Error getting or creating conversation:', error)
      return null
    }
  }

  // Listen for messages from admin/bot in real-time
  useEffect(() => {
    if (!conversationId || isInitializing) return

    const messagesRef = collection(db, `conversations/${conversationId}/messages`)
    const q = query(messagesRef, orderBy('timestamp', 'asc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date(),
        }))

        // Only update if we have messages from Firestore
        if (loadedMessages.length > 0) {
          setMessages(loadedMessages)
        }
      },
      (error) => {
        console.error('Error listening to messages:', error)
      }
    )

    return () => unsubscribe()
  }, [conversationId, isInitializing])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    
    // Lazily create or get conversation on first message
    let convId = conversationId
    if (!convId) {
      convId = await getOrCreateConversation()
      if (!convId) {
        console.error('Failed to create conversation')
        return
      }
    }

    // Add user message to local state
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue,
      timestamp: new Date(),
      sender: currentUser?.email || 'guest@bykelink.com',
    }

    setMessages((prev) => [...prev, userMessage])
    const messageText = inputValue
    setInputValue('')
    setIsLoading(true)

    try {
      // Save user message to Firestore (works for both authenticated and guest users)
      await addDoc(collection(db, `conversations/${convId}/messages`), {
        type: 'user',
        sender: 'user',
        senderId: currentUser?.uid || 'guest',
        text: messageText,
        senderName: currentUser?.displayName || 'Guest User',
        senderAvatar: currentUser?.photoURL || null,
        timestamp: serverTimestamp(),
        read: false,
      })

      await updateDoc(doc(db, 'conversations', convId), {
        updatedAt: serverTimestamp(),
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        senderName: currentUser?.displayName || 'Guest User',
        senderAvatar: currentUser?.photoURL || null,
        senderId: currentUser?.uid || 'guest',
        userEmail: currentUser?.email || 'guest@bykelink.com',
        userId: currentUser?.uid || localStorage.getItem('bykelink_guest_user_id') || 'guest',
        status: 'open',
      })
    } catch (error) {
      console.error('Error saving message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style>{`
        /* Chat button: fixed small circular glass button that won't expand
           This overrides any global .button padding/width collisions */
        .chat-button {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 140;
          width: 56px;
          height: 56px;
          padding: 0 !important;
          box-sizing: border-box !important;
          display: flex !important;
          align-items: center;
          justify-content: center;
          border-radius: 999px !important;
          background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(12px) saturate(140%);
          -webkit-backdrop-filter: blur(12px) saturate(140%);
          box-shadow: none !important;
          transition: transform 0.18s ease, background-color 0.18s ease;
        }

        .chat-window {
          position: fixed;
          right: 2rem;
          bottom: 6.5rem;
          z-index: 130;
          width: min(24rem, calc(100vw - 2rem));
          max-height: calc(100vh - 8rem);
          box-shadow: 0 24px 70px rgba(2, 6, 23, 0.58);
        }

        .chat-button:hover {
          transform: scale(1.06);
        }

        .chat-button .MuiSvgIcon-root,
        .chat-button .icon-replace {
          color: inherit;
          transition: color 0.18s ease;
        }

        /* Chat window positioning adjustments for small screens */
        @media (max-width: 768px) {
          .chat-button {
            bottom: 1rem;
            right: 1rem;
            width: 52px;
            height: 52px;
          }

          .chat-window {
            bottom: 5.5rem;
            right: 1rem;
            left: 1rem;
            width: auto !important;
            max-width: calc(100vw - 2rem) !important;
            max-height: calc(100vh - 8rem);
            z-index: 130;
          }
        }
      `}</style>

      {/* Chat Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="chat-button fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full button button--primary text-white transition duration-300 hover:scale-110"
        aria-label="Open chat"
      >
        {isOpen ? (
          <CloseRoundedIcon sx={{ fontSize: 24 }} className="icon-replace" />
        ) : (
          <ChatBubbleRoundedIcon sx={{ fontSize: 24 }} className="icon-replace" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window fixed bottom-24 right-8 z-40 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1c1b1b] shadow-2xl animate-in fade-in slide-in-from-bottom-2" style={{ height: '500px' }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-linear-to-r from-red-600/10 to-red-500/5 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full button button--primary">
                <ChatBubbleRoundedIcon sx={{ fontSize: 20 }} className="icon-replace text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-['Epilogue']">BYKELINK Chat</h3>
                <p className="text-xs text-neutral-400">We typically reply instantly</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-white transition hover:bg-white/10"
              aria-label="Close chat"
            >
              <CloseRoundedIcon sx={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1`}
              >
                <div
                  className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                    message.type === 'user'
                      ? 'bg-red-600 text-white rounded-br-none shadow-lg shadow-red-600/20'
                      : 'bg-white/10 text-neutral-100 rounded-bl-none border border-white/20'
                  }`}
                >
                  <p>{message.text}</p>
                  <span className={`text-xs mt-1 block ${message.type === 'user' ? 'text-red-200' : 'text-neutral-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 rounded-2xl bg-white/10 px-4 py-3 text-neutral-100 border border-white/20 rounded-bl-none">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-white/10 bg-[#131313] px-4 py-3"
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isInitializing ? 'Initializing chat...' : 'Type a message...'}
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-red-600/50 focus:bg-white/10 backdrop-blur-sm"
                disabled={isLoading || isInitializing}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim() || isInitializing}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white transition duration-300 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                aria-label="Send message"
              >
                <SendRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
