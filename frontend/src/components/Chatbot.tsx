"use client"

import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Bot, User, Minimize2, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import Link from 'next/link'
import api from '@/lib/api'

// We store our session ID in localStorage to keep conversation going
const CHAT_SESSION_KEY = 'malaika_ai_session_id'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  products?: any[]
  isTyping?: boolean
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize session and greeting
  useEffect(() => {
    let storedSession = ''
    if (typeof window !== 'undefined') {
      storedSession = localStorage.getItem(CHAT_SESSION_KEY) || ''
      if (!storedSession) {
        storedSession = crypto.randomUUID()
        localStorage.setItem(CHAT_SESSION_KEY, storedSession)
      }
      setSessionId(storedSession)
    }

    if (messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          role: 'ai',
          content: "Hi there! 👋 I'm Malaika, your AI shopping assistant. How can I help you find the perfect items for your little one today?"
        }
      ])
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !loading) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, loading])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Add a typing indicator
    const typingId = 'typing-' + Date.now()
    setMessages(prev => [...prev, { id: typingId, role: 'ai', content: '', isTyping: true }])

    try {
      const res = await api.post('/api/v1/ai/chat/', {
        message: userMessage.content,
        session_id: sessionId
      })

      const data = res.data

      setMessages(prev => 
        prev.map(msg => msg.id === typingId ? {
          id: Date.now().toString(),
          role: 'ai',
          content: data.response || "I'm sorry, I couldn't process that right now.",
          products: data.products
        } : msg)
      )

    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => 
        prev.map(msg => msg.id === typingId ? {
          id: Date.now().toString(),
          role: 'ai',
          content: "I'm having a little trouble connecting right now. Please try again in a moment!"
        } : msg)
      )
    } finally {
      setLoading(false)
    }
  }

  // If closed, return just the floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[var(--brand-secondary)] active:scale-95 md:bottom-8 md:right-8"
        aria-label="Open AI Assistant"
      >
        <Sparkles size={24} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col bg-white shadow-2xl sm:bottom-6 sm:right-6 sm:h-[600px] sm:max-h-[calc(100vh-48px)] sm:w-[380px] sm:rounded-2xl sm:border sm:border-gray-200">
      
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl bg-[var(--brand-primary)] px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-semibold leading-tight">Malaika Assistant</h3>
            <p className="text-xs text-brand-50 opacity-90">Powered by AI</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-soft)] p-4 text-sm">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`flex max-w-[85%] flex-col gap-2 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* Bubble */}
                <div 
                  className={`rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user' 
                      ? 'bg-[var(--brand-primary)] text-white rounded-br-sm' 
                      : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.isTyping ? (
                    <div className="flex items-center gap-1.5 py-1 px-1">
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <div className={msg.role === 'ai' ? 'prose prose-sm prose-p:my-1 prose-headings:my-2 prose-ul:my-1' : ''}>
                      {msg.role === 'ai' ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Product Cards Container */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-1 flex w-full max-w-sm flex-col gap-2">
                    {msg.products.map((product: any, idx: number) => (
                      <Link 
                        href={`/products/${product.slug || product.id}`} 
                        key={idx}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-2 text-left shadow-sm transition hover:border-[var(--brand-primary)]"
                        onClick={() => setIsOpen(false)} // Close chat when clicking a product
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-50">
                          {product.image ? (
                            <Image 
                              src={product.image.startsWith('http') ? product.image : `${process.env.NEXT_PUBLIC_API_URL}${product.image}`}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm font-semibold text-[var(--brand-primary)]">
                            KES {Number(product.price).toLocaleString()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 bg-white p-3">
        <form 
          onSubmit={handleSend}
          className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-1 pl-3 focus-within:border-[var(--brand-primary)] focus-within:ring-1 focus-within:ring-[var(--brand-primary)]"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="max-h-32 w-full resize-none border-0 bg-transparent py-2.5 text-sm focus:outline-none focus:ring-0"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="mb-1 mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white transition disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
        <div className="mt-2 text-center text-[10px] text-gray-400">
          AI generated responses may contain inaccuracies.
        </div>
      </div>
    </div>
  )
}
