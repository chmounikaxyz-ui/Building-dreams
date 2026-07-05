"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { X, ChevronLeft, ChevronRight, Heart, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useApp } from "@/context/app-context"

export interface Story {
  id: string | number
  name: string
  avatar: string
  profession: string
  hasUnseenStory: boolean
  isOwn?: boolean
  image?: string
}

const storyContent: Record<string | number, { image: string; caption: string }[]> = {
  1: [
    { image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=1000&fit=crop", caption: "Foundation work in progress 💪" },
    { image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=1000&fit=crop", caption: "Brick laying — day 3 🧱" },
  ],
  2: [
    { image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=1000&fit=crop", caption: "Custom cabinet almost done 🪵" },
    { image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=1000&fit=crop", caption: "Teak wood finish ✨" },
  ],
  3: [
    { image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=1000&fit=crop", caption: "New interior design project 🏠" },
    { image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=1000&fit=crop", caption: "Modern minimalist vibes 🎨" },
  ],
  4: [
    { image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=1000&fit=crop", caption: "Site inspection today 🏗️" },
  ],
  5: [
    { image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&h=1000&fit=crop", caption: "Electrical work complete ⚡" },
  ],
  6: [
    { image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=1000&fit=crop", caption: "New design concept 🖌️" },
    { image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=1000&fit=crop", caption: "Client loved it! 🎉" },
  ],
}

const STORY_DURATION = 5000

interface StoryViewerProps {
  stories: Story[]
  initialStoryId: number | string | null
  isOpen: boolean
  onClose: () => void
  onStoryWatched: (storyId: number | string) => void
  extraContent?: Record<string | number, { image: string; caption: string }[]>
}

export function StoryViewer({ stories, initialStoryId, isOpen, onClose, onStoryWatched, extraContent = {} }: StoryViewerProps) {
  const viewable = stories.filter(s => !s.isOwn)
  const mergedContent = { ...storyContent, ...extraContent }
  const [userIdx, setUserIdx] = useState(0)
  const [slideIdx, setSlideIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [liked, setLiked] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replySent, setReplySent] = useState(false)
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [shareSearch, setShareSearch] = useState("")
  const [sharedTo, setSharedTo] = useState<(string | number)[]>([])
  const replyInputRef = useRef<HTMLInputElement>(null)
  const { setSelectedConversation, conversations, setConversations, setActiveTab } = useApp()

  let convCounter = 9000
  const sendReply = () => {
    if (!replyText.trim() || !currentUser) return
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const existing = conversations.find(c => c.name === currentUser.name)
    const msg = { id: Date.now(), text: replyText, isOwn: true, timestamp: timeStr, status: "sent" as const }
    if (existing) {
      setConversations(prev => prev.map(c =>
        c.id === existing.id ? { ...c, lastMessage: replyText, timestamp: "Just now", messages: [...c.messages, msg] } : c
      ))
      setSelectedConversation({ ...existing, messages: [...existing.messages, msg] })
    } else {
      const newConv = {
        id: ++convCounter,
        name: currentUser.name,
        profession: currentUser.profession,
        avatar: currentUser.avatar,
        lastMessage: replyText,
        timestamp: "Just now",
        unread: 0,
        isOnline: true,
        messages: [msg],
      }
      setConversations(prev => [newConv, ...prev])
      setSelectedConversation(newConv)
    }
    setReplyText("")
    setReplySent(true)
    setTimeout(() => { setReplySent(false); onClose() }, 1000)
  }
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentUser = viewable[userIdx]
  const slides = currentUser ? (mergedContent[currentUser.id] || [{ image: currentUser.avatar, caption: currentUser.name }]) : []

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
  }

  const goNext = useCallback(() => {
    setLiked(false)
    if (slideIdx < slides.length - 1) {
      setSlideIdx(s => s + 1)
      setProgress(0)
    } else {
      if (currentUser) onStoryWatched(currentUser.id)
      if (userIdx < viewable.length - 1) {
        const next = viewable[userIdx + 1]
        if (next) onStoryWatched(next.id)
        setUserIdx(i => i + 1)
        setSlideIdx(0)
        setProgress(0)
      } else {
        onClose()
      }
    }
  }, [slideIdx, slides.length, userIdx, viewable, currentUser, onStoryWatched, onClose])

  const goPrev = useCallback(() => {
    setLiked(false)
    if (slideIdx > 0) {
      setSlideIdx(s => s - 1)
      setProgress(0)
    } else if (userIdx > 0) {
      setUserIdx(i => i - 1)
      setSlideIdx(0)
      setProgress(0)
    }
  }, [slideIdx, userIdx])

  // Init
  useEffect(() => {
    if (!isOpen) return
    const idx = viewable.findIndex(s => s.id === initialStoryId)
    setUserIdx(idx >= 0 ? idx : 0)
    setSlideIdx(0)
    setProgress(0)
    setLiked(false)
    if (initialStoryId) onStoryWatched(initialStoryId)
  }, [isOpen, initialStoryId])

  // Timer — runs independently, calls goNext via ref to avoid stale closure
  const goNextRef = useRef(goNext)
  useEffect(() => { goNextRef.current = goNext }, [goNext])

  useEffect(() => {
    if (!isOpen || isPaused) return
    clearTimers()
    const start = Date.now()
    progressRef.current = setInterval(() => {
      setProgress(Math.min(((Date.now() - start) / STORY_DURATION) * 100, 100))
    }, 50)
    timerRef.current = setTimeout(() => goNextRef.current(), STORY_DURATION)
    return clearTimers
  }, [isOpen, userIdx, slideIdx, isPaused])

  // Keyboard
  const goPrevRef = useRef(goPrev)
  useEffect(() => { goPrevRef.current = goPrev }, [goPrev])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNextRef.current()
      if (e.key === "ArrowLeft") goPrevRef.current()
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  if (!isOpen || !currentUser) return null

  const slide = slides[slideIdx]

  return (
    // Full-screen overlay — covers everything including sidebar
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">

      {/* Left arrow */}
      <button
        onClick={goPrev}
        className={cn(
          "absolute left-4 z-30 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-all",
          userIdx === 0 && slideIdx === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      {/* Story card — portrait, centered */}
      <div className="relative w-full max-w-[390px] h-full max-h-[100dvh] overflow-hidden">

        {/* Image */}
        <img
          src={slide.image}
          alt={slide.caption}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
          {slides.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: i < slideIdx ? "100%" : i === slideIdx ? `${progress}%` : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* Header — z-30 so it's above tap zones */}
        <div className="absolute top-8 left-3 right-3 flex items-center gap-3 z-30">
          <Avatar className="w-9 h-9 border-2 border-white shrink-0">
            {currentUser.avatar ? (
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-xs">
              {currentUser.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-none">{currentUser.name}</p>
            <p className="text-white/70 text-xs mt-0.5">{currentUser.profession} · Just now</p>
          </div>
          {/* X — z-30, pointer-events-auto, stops propagation */}
          <button
            onPointerDown={e => e.stopPropagation()}
            onPointerUp={e => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); clearTimers(); onClose() }}
            className="p-2 rounded-full hover:bg-white/20 transition-colors pointer-events-auto"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tap zones — z-10, below header */}
        <div className="absolute inset-0 flex z-10">
          <div
            className="w-1/2 h-full cursor-pointer"
            onPointerDown={() => setIsPaused(true)}
            onPointerUp={() => { setIsPaused(false); goPrev() }}
          />
          <div
            className="w-1/2 h-full cursor-pointer"
            onPointerDown={() => setIsPaused(true)}
            onPointerUp={() => { setIsPaused(false); goNext() }}
          />
        </div>

        {/* Caption */}
        <div className="absolute bottom-20 left-4 right-4 z-20 pointer-events-none">
          <p className="text-white text-sm font-medium drop-shadow">{slide.caption}</p>
        </div>

        {/* Bottom actions */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 z-20">
          {replySent ? (
            <div className="flex-1 flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2.5 text-white text-sm font-medium">
              ✓ Reply sent!
            </div>
          ) : (
            <div className="flex-1 flex items-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-full overflow-hidden">
              <input
                ref={replyInputRef}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendReply() }}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                placeholder={`Reply to ${currentUser.name}...`}
                className="flex-1 bg-transparent px-4 py-2.5 text-white text-sm placeholder:text-white/50 outline-none"
              />
              {replyText.trim() && (
                <button onClick={sendReply} className="pr-3 text-white hover:text-white/80">
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => setLiked(l => !l)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <Heart className={cn("w-6 h-6 transition-all duration-200", liked ? "fill-red-500 text-red-500 scale-125" : "text-white")} />
          </button>
          <button
            onClick={() => { setShowShareSheet(true); setIsPaused(true); setSharedTo([]) }}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <Send className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Share sheet */}
        {showShareSheet && (
          <div className="absolute inset-0 z-40 flex items-end" onClick={() => { setShowShareSheet(false); setIsPaused(false) }}>
            <div className="w-full bg-card rounded-t-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-card-foreground text-sm">Share story</h3>
                <button onClick={() => { setShowShareSheet(false); setIsPaused(false) }} className="p-1 rounded-full hover:bg-secondary">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="px-4 py-2 border-b border-border">
                <input
                  placeholder="Search people..."
                  value={shareSearch}
                  onChange={e => setShareSearch(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-secondary text-sm text-card-foreground placeholder:text-muted-foreground outline-none"
                  autoFocus
                />
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-border">
                {conversations
                  .filter(c => c.name.toLowerCase().includes(shareSearch.toLowerCase()))
                  .map(conv => {
                    const sent = sharedTo.includes(conv.id)
                    return (
                      <div key={conv.id} className="flex items-center gap-3 px-4 py-3">
                        <Avatar className="w-9 h-9 shrink-0">
                          {conv.avatar ? (
                            <AvatarImage src={conv.avatar} alt={conv.name} />
                          ) : null}
                          <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-xs">
                            {conv.name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-card-foreground truncate">{conv.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{conv.profession}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (sent) return
                            const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            const textContent = `__POST__${slide.image}||${currentUser.name}||${currentUser.profession || "Worker"}||${slide.caption || "Story"}||0`
                            try {
                              const stored = localStorage.getItem("auth_user")
                              if (!stored) return
                              const user = JSON.parse(stored)
                              if (!user.id) return

                              const response = await fetch(`/api/messages/${conv.id}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ senderId: String(user.id), text: textContent })
                              })

                              if (response.ok) {
                                setConversations(prev => prev.map(c => {
                                  if (c.id !== conv.id) return c
                                  const msg = {
                                    id: Date.now(),
                                    text: textContent,
                                    isOwn: true,
                                    timestamp: timeStr,
                                    status: "sent" as const,
                                  }
                                  return { ...c, lastMessage: `📸 Shared ${currentUser.name}'s story`, timestamp: "Just now", messages: [...c.messages, msg] }
                                }))
                                setSharedTo(prev => [...prev, conv.id])
                              }
                            } catch (err) {
                              console.error("Failed to share story:", err)
                            }
                          }}
                          className={cn(
                            "text-xs font-semibold px-3 py-1.5 rounded-full transition-colors shrink-0",
                            sent ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
                          )}
                        >
                          {sent ? "Sent" : "Send"}
                        </button>
                      </div>
                    )
                  })}
              </div>
              <div className="px-4 py-3 border-t border-border">
                <button
                  onClick={() => { setShowShareSheet(false); setIsPaused(false) }}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                >
                  {sharedTo.length > 0 ? `Done · Sent to ${sharedTo.length}` : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right arrow */}
      <button
        onClick={goNext}
        className="absolute right-4 z-30 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-all"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}
