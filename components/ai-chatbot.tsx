"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Message {
  id: number
  text: string
  isBot: boolean
  timestamp: Date
}

interface AIChatbotProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const suggestedQuestions = [
  "How much cement do I need for 100 sq ft?",
  "Best flooring for bathroom?",
  "How to check contractor credentials?",
  "Cost estimate for 2BHK construction?",
]

export function AIChatbot({ isOpen, setIsOpen }: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm Sara, your AI construction expert. Ask me anything about construction materials, costs, techniques, or finding the right professionals!",
      isBot: true,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [msgId, setMsgId] = useState(2)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: Message = {
      id: msgId,
      text: message,
      isBot: false,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMsgId(prev => prev + 1)
    setInput("")
    setIsTyping(true)

    try {
      const history = messages.map(m => ({ isBot: m.isBot, text: m.text }))
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      })
      const data = await res.json()
      const reply = data.response || data.error || "Sorry, I couldn't get a response. Please try again."
      setMessages(prev => [...prev, { id: Date.now(), text: reply, isBot: true, timestamp: new Date() }])
    } catch {
      setMessages(prev => [...prev, { id: Date.now(), text: "Connection error. Please check your internet and try again.", isBot: true, timestamp: new Date() }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = async () => {
    await sendMessage(input)
  }

  const handleQuickQuestion = (question: string) => {
    sendMessage(question)
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        size="icon"
      >
        <Bot className="w-6 h-6" />
      </Button>
    )
  }

  return (
    <div className={cn(
      "fixed z-50 flex flex-col overflow-hidden bg-card border border-border shadow-2xl transition-all duration-300",
      isMinimized 
        ? "bottom-6 right-6 lg:bottom-8 lg:right-8 w-72 max-h-[80vh] rounded-2xl"
        : "bottom-6 right-6 lg:bottom-8 lg:right-8 w-[calc(100%-2rem)] max-w-md max-h-[90vh] lg:w-96 lg:h-[600px] rounded-2xl"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Sara</h3>
            <p className="text-xs opacity-80">AI Construction Expert</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.isBot ? "justify-start" : "justify-end"
                )}
              >
                {message.isBot && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm",
                    message.isBot
                      ? "bg-secondary text-secondary-foreground rounded-tl-sm"
                      : "bg-primary text-primary-foreground rounded-tr-sm"
                  )}
                >
                  {message.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-secondary px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full hover:bg-secondary/80 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about construction..."
                className="flex-1 rounded-full bg-secondary border-0"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="rounded-full w-10 h-10"
                disabled={!input.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
