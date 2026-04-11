import { useState, useRef, useEffect } from 'react'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
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

  // Initialize or get existing conversation
  useEffect(() => {
    const initializeConversation = async () => {
      setIsInitializing(true)
      
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
            // Use existing conversation
            const existingConv = querySnapshot.docs[0]
            setConversationId(existingConv.id)
            setIsInitializing(false)
            return
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
            messageCount: 0,
          })
          setConversationId(newConvRef.id)
        } else {
          // For guests, create a new conversation each session
          const newConvRef = await addDoc(conversationsRef, {
            userId: `guest_${Date.now()}`,
            userEmail: 'guest@bykelink.com',
            userName: 'Guest User',
            isGuest: true,
            status: 'open',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            messageCount: 0,
          })
          setConversationId(newConvRef.id)
        }
      } catch (error) {
        console.error('Error initializing conversation:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeConversation()
  }, [currentUser?.uid, currentUser?.email, currentUser?.displayName])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    if (!conversationId || isInitializing) {
      console.warn('Conversation still initializing or not available')
      return
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
      await addDoc(collection(db, `conversations/${conversationId}/messages`), {
        type: 'user',
        text: messageText,
        sender: currentUser?.email || 'guest@bykelink.com',
        senderName: currentUser?.displayName || 'Guest User',
        timestamp: serverTimestamp(),
        read: false,
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }

    // Simulate bot response delay
    setTimeout(() => {
      const botResponses = [
        'Great question! I can help you with that.',
        'That sounds interesting. Let me connect you with our team.',
        'We have some great options for you!',
        'Thank you for reaching out. How can I assist you further?',
        'Feel free to ask me anything about our yamaha motorcycles.',
      ]

      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)]

      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: randomResponse,
        timestamp: new Date(),
        sender: 'bot',
      }

      setMessages((prev) => [...prev, botMessage])

      // Save bot response to Firestore
      addDoc(collection(db, `conversations/${conversationId}/messages`), {
        type: 'bot',
        text: randomResponse,
        sender: 'bot',
        senderName: 'BYKELINK Support',
        timestamp: serverTimestamp(),
        read: false,
      }).catch((error) => console.error('Error saving bot response:', error))

      setIsLoading(false)
    }, 1000)
  }

  return (
    <>
      {/* Chat Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition duration-300 hover:scale-110 hover:shadow-blue-600/50 md:bottom-8 md:right-8"
        aria-label="Open chat"
      >
        {isOpen ? (
          <CloseRoundedIcon sx={{ fontSize: 24 }} />
        ) : (
          <SmartToyRoundedIcon sx={{ fontSize: 24 }} />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1c1b1b] shadow-2xl md:bottom-24 md:right-8 animate-in fade-in slide-in-from-bottom-2" style={{ height: '500px' }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-linear-to-r from-blue-600/10 to-blue-500/5 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                <SmartToyRoundedIcon sx={{ fontSize: 20 }} className="text-white" />
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
                      ? 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-600/20'
                      : 'bg-white/10 text-neutral-100 rounded-bl-none border border-white/20'
                  }`}
                >
                  <p>{message.text}</p>
                  <span className={`text-xs mt-1 block ${message.type === 'user' ? 'text-blue-200' : 'text-neutral-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 rounded-2xl bg-white/10 px-4 py-3 text-neutral-100 border border-white/20 rounded-bl-none">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
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
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-blue-600/50 focus:bg-white/10 backdrop-blur-sm"
                disabled={isLoading || isInitializing}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim() || isInitializing}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition duration-300 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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
