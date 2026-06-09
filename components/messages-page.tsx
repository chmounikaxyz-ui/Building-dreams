"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Phone, MoreVertical, Send, Paperclip, Image, Smile, Check, CheckCheck, Heart, PhoneOff, Trash2, UserX, MicOff, Volume2, Mic, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, optimizeImage } from "@/lib/utils"
import { useApp } from "@/context/app-context"
import { WorkerProfileModal } from "@/components/worker-profile-modal"

type CallState = "idle" | "ringing" | "connected"

const EMOJI_LIST = [
  "😀","😂","😍","🥰","😎","🤔","👍","👏","🙏","❤️",
  "🔥","✅","💪","🏗️","🧱","🔨","⚒️","🪚","🔧","🪛",
  "📐","📏","🏠","🏢","💰","📅","⭐","🎉","👋","😊",
]

type DbConversation = {
  id: string
  userId: string
  otherUserId: string
  otherUserName: string
  otherUserAvatar: string
  otherUserProfession: string
  lastMessage: string | null
  lastMessageTime: string | null
  unreadCount: number
}

type DbMessage = {
  id: string
  conversationId: string
  senderId: string
  text: string
  status: "sent" | "delivered" | "read"
  createdAt: string
  sender: { id: string; name: string; avatar: string; profession: string }
}

const triggerBase64Download = (dataUrl: string, fileName: string) => {
  try {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || "application/octet-stream"
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    const blob = new Blob([u8arr], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error("Blob download failed, falling back to data URL:", err)
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

export function MessagesPage() {
  const [messageInput, setMessageInput] = useState("")
  const [showChatList, setShowChatList] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [callState, setCallState] = useState<CallState>("idle")
  const { posts } = useApp()
  const [selectedWorkerForModal, setSelectedWorkerForModal] = useState<any | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [initialPostForModal, setInitialPostForModal] = useState<any | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaker, setIsSpeaker] = useState(false)
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Blocked users (persisted per current user)
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(`blocked_users_${JSON.parse(localStorage.getItem("auth_user") || "{}").id}`) || "[]") } catch { return [] }
  })

  // Whether the OTHER person has blocked us
  const [isBlockedByOther, setIsBlockedByOther] = useState(false)

  // Current user from localStorage
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("auth_user") || "{}") } catch { return {} }
  })()
  const currentUserId: string = currentUser.id || ""

  // DB-backed state
  const [dbConversations, setDbConversations] = useState<DbConversation[]>([])
  const [selectedDbConv, setSelectedDbConv] = useState<DbConversation | null>(null)
  const [dbMessages, setDbMessages] = useState<DbMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [pollingRef] = useState({ interval: null as ReturnType<typeof setInterval> | null })

  // isBlocked must be after selectedDbConv
  const isBlocked = selectedDbConv ? blockedUsers.includes(selectedDbConv.otherUserId) : false

  // ── Load conversations ────────────────────────────────────────────────────

  const loadConversations = async () => {
    if (!currentUserId) return
    try {
      const res = await fetch(`/api/messages?userId=${currentUserId}`)
      if (!res.ok) {
        setLoadingConversations(false)
        return
      }
      const data = await res.json()
      
      // If no conversations, stop loading immediately
      if (data.length === 0) {
        setDbConversations([])
        setLoadingConversations(false)
        return
      }
      
      // Enrich conversations with user details
      const enriched = await Promise.all(data.map(async (conv: any) => {
        try {
          const userRes = await fetch(`/api/users/${conv.otherUserId}`)
          if (!userRes.ok) {
            return {
              id: conv.id,
              userId: conv.userId,
              otherUserId: conv.otherUserId,
              otherUserName: "Unknown User",
              otherUserAvatar: "",
              otherUserProfession: "User",
              lastMessage: conv.lastMessage,
              lastMessageTime: conv.lastMessageTime,
              unreadCount: 0,
            }
          }
          const otherUser = await userRes.json()
          const msgRes = await fetch(`/api/messages/${conv.id}`)
          const msgs: any[] = msgRes.ok ? await msgRes.json() : []

          // Check cleared timestamp
          const clearedTimeStr = localStorage.getItem(`cleared_${currentUserId}_${conv.id}`)
          const clearedTime = clearedTimeStr ? new Date(clearedTimeStr) : null

          // Filter unread messages that are newer than clearedTime
          const unreadCount = msgs.filter((m: any) => {
            if (m.senderId === currentUserId) return false
            if (m.status === "read") return false
            if (clearedTime && new Date(m.createdAt) <= clearedTime) return false
            return true
          }).length

          // Check if lastMessage is older than clearedTime
          let lastMessage = conv.lastMessage
          let lastMessageTime = conv.lastMessageTime
          if (clearedTime && lastMessageTime) {
            if (new Date(lastMessageTime) <= clearedTime) {
              lastMessage = null
              lastMessageTime = null
            }
          }

          // Check if deleted
          const deletedTimeStr = localStorage.getItem(`deleted_${currentUserId}_${conv.id}`)
          if (deletedTimeStr) {
            const deletedTime = new Date(deletedTimeStr)
            const lastMsgTime = conv.lastMessageTime ? new Date(conv.lastMessageTime) : null
            if (!lastMsgTime || lastMsgTime <= deletedTime) {
              return null // Hide deleted conversations with no new messages
            }
          }

          return {
            id: conv.id,
            userId: conv.userId,
            otherUserId: conv.otherUserId,
            otherUserName: otherUser.name || "Unknown",
            otherUserAvatar: otherUser.avatar || "",
            otherUserProfession: otherUser.profession || "User",
            lastMessage,
            lastMessageTime,
            unreadCount,
          }
        } catch (err) {
          console.error(`Error enriching conversation ${conv.id}:`, err)
          return null
        }
      }))
      setDbConversations(enriched.filter(Boolean) as DbConversation[])
      setLoadingConversations(false)
    } catch (err) {
      console.error("Load conversations error:", err)
      setLoadingConversations(false)
    }
  }

  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 5000) // Reduced polling frequency
    pollingRef.interval = interval
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId])

  // ── Load messages ─────────────────────────────────────────────────────────

  const loadMessages = async (convId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/messages/${convId}`)
      if (res.ok) {
        const msgs = await res.json()
        const clearedTimeStr = localStorage.getItem(`cleared_${currentUserId}_${convId}`)
        if (clearedTimeStr) {
          const clearedTime = new Date(clearedTimeStr)
          setDbMessages(msgs.filter((m: any) => new Date(m.createdAt) > clearedTime))
        } else {
          setDbMessages(msgs)
        }
      }
    } finally {
      setLoadingMessages(false)
    }
  }

  const selectConversation = async (conv: DbConversation) => {
    setSelectedDbConv(conv)
    setShowChatList(false)
    setIsBlockedByOther(false)
    await loadMessages(conv.id)
    await fetch(`/api/messages/${conv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserId })
    })
    setDbConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    await loadMessages(conv.id)
    // Check if the other user has blocked us by reading their bio from DB
    try {
      const res = await fetch(`/api/users/${conv.otherUserId}`)
      if (res.ok) {
        const otherUser = await res.json()
        if (otherUser.bio) {
          try {
            const bioObj = JSON.parse(otherUser.bio)
            const theirBlockedList: string[] = bioObj.blockedUsers || []
            setIsBlockedByOther(theirBlockedList.includes(currentUserId))
          } catch {}
        }
      }
    } catch {}
  }

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [dbMessages])

  // Poll messages for selected conversation
  useEffect(() => {
    if (!selectedDbConv) return
    const interval = setInterval(() => loadMessages(selectedDbConv.id), 3000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDbConv?.id])

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSendDbMessage = async () => {
    if (!messageInput.trim() || !selectedDbConv) return
    const text = messageInput.trim()
    setMessageInput("")
    try {
      localStorage.removeItem(`deleted_${currentUserId}_${selectedDbConv.id}`)
      localStorage.removeItem(`cleared_${currentUserId}_${selectedDbConv.id}`)
      await fetch(`/api/messages/${selectedDbConv.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: currentUserId, text })
      })
      await loadMessages(selectedDbConv.id)
      await loadConversations()
    } catch (err) {
      console.error("Send message error:", err)
    }
  }

  // ── UI helpers ────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmojiPicker(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (callState === "ringing") {
      ringTimerRef.current = setTimeout(() => { setCallState("connected"); setCallDuration(0) }, 3000)
    }
    return () => { if (ringTimerRef.current) clearTimeout(ringTimerRef.current) }
  }, [callState])

  useEffect(() => {
    if (callState === "connected") {
      callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000)
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current) }
  }, [callState])

  const endCall = () => {
    setCallState("idle"); setCallDuration(0); setIsMuted(false); setIsSpeaker(false)
    if (ringTimerRef.current) clearTimeout(ringTimerRef.current)
  }

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendDbMessage() }
  }

  const handleEmojiClick = (emoji: string) => {
    setMessageInput(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  // Image send — local only (no DB storage for binary, keeps as in-memory display)
  const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedDbConv) return
    try {
      const optimized = await optimizeImage(file, 1600, 1600, 0.95)
      localStorage.removeItem(`deleted_${currentUserId}_${selectedDbConv.id}`)
      localStorage.removeItem(`cleared_${currentUserId}_${selectedDbConv.id}`)
      // Send as text message with image marker
      await fetch(`/api/messages/${selectedDbConv.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: currentUserId, text: `__IMG__${optimized}||${file.name}` })
      })
      await loadMessages(selectedDbConv.id)
      await loadConversations()
    } catch (err) {
      console.error("Image send error:", err)
    }
    e.target.value = ""
  }

  const handleFileSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedDbConv) return
    const ext = file.name.split('.').pop()?.toUpperCase() || "FILE"
    const sizeKB = (file.size / 1024).toFixed(0)
    const sizeLabel = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeKB} KB`
    // Read as base64 so the receiver can open/download it
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      try {
        localStorage.removeItem(`deleted_${currentUserId}_${selectedDbConv.id}`)
        localStorage.removeItem(`cleared_${currentUserId}_${selectedDbConv.id}`)
        await fetch(`/api/messages/${selectedDbConv.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderId: currentUserId, text: `__FILE__${file.name}||${ext}||${sizeLabel}||${dataUrl}` })
        })
        await loadMessages(selectedDbConv.id)
        await loadConversations()
      } catch (err) {
        console.error("File send error:", err)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleClearChat = async () => {
    setShowMenu(false)
    if (!selectedDbConv) return
    try {
      const now = new Date().toISOString()
      localStorage.setItem(`cleared_${currentUserId}_${selectedDbConv.id}`, now)
      setDbMessages([])
      // Also update conversations list to show cleared last message visually
      setDbConversations(prev =>
        prev.map(c =>
          c.id === selectedDbConv.id
            ? { ...c, lastMessage: null, lastMessageTime: null }
            : c
        )
      )
    } catch (err) {
      console.error("Clear chat error:", err)
    }
  }

  const handleDeleteConversation = async () => {
    if (!selectedDbConv) return
    const convId = selectedDbConv.id
    setSelectedDbConv(null)
    setShowChatList(true)
    setShowMenu(false)
    try {
      const now = new Date().toISOString()
      localStorage.setItem(`deleted_${currentUserId}_${convId}`, now)
      localStorage.setItem(`cleared_${currentUserId}_${convId}`, now)
      setDbConversations(prev => prev.filter(c => c.id !== convId))
    } catch (err) {
      console.error("Delete conversation error:", err)
    }
  }

  const handleBlockUser = async () => {
    if (!selectedDbConv) return
    setBlockedUsers(prev => {
      const uid = currentUserId
      const next = prev.includes(selectedDbConv.otherUserId)
        ? prev.filter(id => id !== selectedDbConv.otherUserId)
        : [...prev, selectedDbConv.otherUserId]
      try { localStorage.setItem(`blocked_users_${uid}`, JSON.stringify(next)) } catch {}
      // Persist to DB bio so the blocked user can detect it
      try {
        const stored = localStorage.getItem("auth_user")
        if (stored) {
          const me = JSON.parse(stored)
          fetch(`/api/users/${me.id}`).then(r => r.json()).then(userData => {
            let bioObj: any = {}
            try { bioObj = userData.bio ? JSON.parse(userData.bio) : {} } catch {}
            bioObj.blockedUsers = next
            fetch("/api/users", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: me.id, bio: JSON.stringify(bioObj) })
            })
          })
        }
      } catch {}
      return next
    })
    setShowMenu(false)
  }

  const handleProfileModalMessage = async (workerId: string | number) => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) {
        const currentUser = JSON.parse(stored)
        if (currentUser.id) {
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id, otherUserId: String(workerId) })
          })
          if (res.ok) {
            const convData = await res.json()
            if (convData && convData.id) {
              localStorage.removeItem(`deleted_${currentUser.id}_${convData.id}`)
              localStorage.removeItem(`cleared_${currentUser.id}_${convData.id}`)
            }
            await loadConversations()
            const found = dbConversations.find(c => c.otherUserId === String(workerId))
            if (found) {
              selectConversation(found)
            } else {
              // try again
              const updatedRes = await fetch(`/api/messages?userId=${currentUser.id}`)
              if (updatedRes.ok) {
                const list = await updatedRes.json()
                const f = list.find((c: any) => c.otherUserId === String(workerId))
                if (f) {
                  localStorage.removeItem(`deleted_${currentUser.id}_${f.id}`)
                  localStorage.removeItem(`cleared_${currentUser.id}_${f.id}`)
                  // enrich minimally
                  const userRes = await fetch(`/api/users/${workerId}`)
                  const otherUser = userRes.ok ? await userRes.json() : {}
                  selectConversation({
                    id: f.id,
                    userId: f.userId,
                    otherUserId: f.otherUserId,
                    otherUserName: otherUser.name || "User",
                    otherUserAvatar: otherUser.avatar || "",
                    otherUserProfession: otherUser.profession || "User",
                    lastMessage: f.lastMessage,
                    lastMessageTime: f.lastMessageTime,
                    unreadCount: 0
                  })
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error switching conversation from modal:", err)
    }
    setIsProfileModalOpen(false)
  }

  const handleOpenConvProfile = async () => {
    if (!selectedDbConv) return
    try {
      const res = await fetch(`/api/users/${selectedDbConv.otherUserId}`)
      if (res.ok) {
        const foundUser = await res.json()
        let parsedBioText = foundUser.bio || ""
        let parsedExperience = "Experienced"
        let parsedCoverImage = ""
        if (foundUser.bio) {
          try {
            if (foundUser.bio.trim().startsWith("{") && foundUser.bio.trim().endsWith("}")) {
              const p = JSON.parse(foundUser.bio)
              parsedBioText = p.bio || ""
              parsedExperience = p.experience || "Experienced"
              parsedCoverImage = p.coverImage || ""
            }
          } catch {}
        }
        setSelectedWorkerForModal({
          id: foundUser.id,
          name: foundUser.name,
          profession: foundUser.profession || (foundUser.role === "worker" ? "Worker" : "Explorer"),
          avatar: foundUser.avatar || "",
          coverImage: parsedCoverImage,
          verified: foundUser.verified || false,
          location: foundUser.location || "Mumbai, India",
          experience: parsedExperience,
          rating: 0,
          projectsCount: 0,
          bio: parsedBioText || "No bio provided.",
          skills: foundUser.profession ? [foundUser.profession] : [],
          gallery: []
        })
        setInitialPostForModal(null)
        setIsProfileModalOpen(true)
      }
    } catch (err) {
      console.error("Failed to load user profile from chat header:", err)
    }
  }

  const handleSharedPostClick = async (image: string, userName: string) => {
    const matchingPost = posts.find(p => p.images?.[0] === image || (p as any).image === image)
    try {
      const res = await fetch(`/api/users?name=${encodeURIComponent(userName)}`)
      if (res.ok) {
        const users = await res.json()
        const foundUser = users.find((u: any) => u.name.toLowerCase() === userName.toLowerCase())
        if (foundUser) {
          let parsedBioText = foundUser.bio || ""
          let parsedExperience = "Experienced"
          if (foundUser.bio) {
            try {
              if (foundUser.bio.trim().startsWith("{") && foundUser.bio.trim().endsWith("}")) {
                const p = JSON.parse(foundUser.bio)
                parsedBioText = p.bio || ""
                parsedExperience = p.experience || "Experienced"
              }
            } catch {}
          }
          
          setSelectedWorkerForModal({
            id: foundUser.id,
            name: foundUser.name,
            profession: foundUser.profession || (foundUser.role === "worker" ? "Worker" : "Explorer"),
            avatar: foundUser.avatar || "",
            coverImage: "",
            verified: foundUser.verified || false,
            location: foundUser.location || "Mumbai, India",
            experience: parsedExperience,
            rating: foundUser.rating || 4.5,
            projectsCount: 12,
            bio: parsedBioText || "No bio provided.",
            skills: foundUser.profession ? [foundUser.profession] : [],
            gallery: []
          })
          setInitialPostForModal(matchingPost || null)
          setIsProfileModalOpen(true)
        }
      }
    } catch (err) {
      console.error("Failed to load user profile for shared post:", err)
    }
  }

  // Synchronous render-time filter — always re-reads localStorage so stale async closures can't cause reappearance
  const filteredDbConversations = dbConversations.filter(c => {
    // Search filter (with null safety)
    const name = (c.otherUserName || "").toLowerCase()
    const profession = (c.otherUserProfession || "").toLowerCase()
    const q = searchQuery.toLowerCase()
    if (q && !name.includes(q) && !profession.includes(q)) return false
    // Only apply user-specific filters when we have a valid userId
    if (currentUserId) {
      // Hide deleted conversations (unless a newer message arrived after deletion)
      const deletedTimeStr = localStorage.getItem(`deleted_${currentUserId}_${c.id}`)
      if (deletedTimeStr) {
        const deletedTime = new Date(deletedTimeStr)
        const lastMsgTime = c.lastMessageTime ? new Date(c.lastMessageTime) : null
        if (!lastMsgTime || lastMsgTime <= deletedTime) return false
      }
    }
    return true
  })

  // Synchronous render-time cleared-messages filter — never lets stale polling show hidden messages
  const visibleMessages = (() => {
    if (!selectedDbConv) return dbMessages
    const clearedTimeStr = localStorage.getItem(`cleared_${currentUserId}_${selectedDbConv.id}`)
    if (!clearedTimeStr) return dbMessages
    const clearedTime = new Date(clearedTimeStr)
    return dbMessages.filter(m => new Date(m.createdAt) > clearedTime)
  })()

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch { return "" }
  }

  return (
    <div className="h-full flex">
      {/* Hidden inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSend} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSend} />

      {/* Chat List */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col",
        selectedDbConv && !showChatList ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search conversations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-secondary border-0 rounded-xl" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            // Loading skeleton
            <div className="space-y-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full flex items-center gap-3 p-4 border-b border-border/50 animate-pulse">
                  <div className="w-12 h-12 bg-secondary rounded-full shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 bg-secondary rounded w-32" />
                    <div className="h-3 bg-secondary rounded w-24" />
                    <div className="h-3 bg-secondary rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : dbConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Search className="w-8 h-8 opacity-30" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs text-center px-6">Start a conversation by contacting a seller or worker</p>
            </div>
          ) : filteredDbConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Search className="w-8 h-8 opacity-30" /><p className="text-sm">No conversations found</p>
            </div>
          ) : filteredDbConversations.map((conv) => (
            <button key={conv.id} onClick={() => selectConversation(conv)}
              className={cn("w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors border-b border-border/50", selectedDbConv?.id === conv.id && "bg-secondary")}>
              <div className="relative">
                <Avatar className="w-12 h-12">
                  {conv.otherUserAvatar ? (
                    <AvatarImage src={conv.otherUserAvatar} alt={conv.otherUserName} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-base">
                    {conv.otherUserName?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {conv.unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary border-2 border-card rounded-full" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className={cn("font-semibold truncate", conv.unreadCount > 0 ? "text-foreground" : "text-card-foreground")}>{conv.otherUserName}</span>
                    {blockedUsers.includes(conv.otherUserId) && (
                      <span className="text-[10px] bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded font-medium shrink-0 flex items-center gap-0.5">
                        <UserX className="w-2.5 h-2.5" /> Blocked
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-1">
                    {conv.lastMessageTime ? formatTime(conv.lastMessageTime) : ""}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.otherUserProfession}</p>
                 <p className={cn("text-sm truncate", conv.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>
                  {conv.lastMessage?.startsWith("__IMG__") ? "📷 Photo" : conv.lastMessage?.startsWith("__POST__") ? "📸 Shared a post" : conv.lastMessage?.startsWith("__FILE__") ? "📄 " + (conv.lastMessage.replace("__FILE__", "").split("||")[0] || "File") : conv.lastMessage ?? ""}
                </p>
              </div>
              {conv.unreadCount > 0 && <span className="w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center shrink-0">{conv.unreadCount}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedDbConv && (
        <div className={cn("flex-1 flex flex-col bg-background", showChatList ? "hidden md:flex" : "flex")}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowChatList(true)}>←</Button>
              <button
                className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                onClick={handleOpenConvProfile}
                title="View profile"
              >
                <Avatar className="w-10 h-10">
                  {selectedDbConv.otherUserAvatar ? (
                    <AvatarImage src={selectedDbConv.otherUserAvatar} alt={selectedDbConv.otherUserName} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-sm">
                    {selectedDbConv.otherUserName?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-card-foreground hover:underline">{selectedDbConv.otherUserName}</h3>
                  <p className="text-xs text-muted-foreground">{selectedDbConv.otherUserProfession}</p>
                </div>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCallState("ringing")}><Phone className="w-5 h-5" /></Button>
              <div className="relative" ref={menuRef}>
                <Button variant="ghost" size="icon" onClick={() => setShowMenu(v => !v)}><MoreVertical className="w-5 h-5" /></Button>
                {showMenu && (
                  <div className="absolute right-0 top-11 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-20">
                    <button onClick={handleClearChat} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-card-foreground hover:bg-secondary transition-colors">
                      <Trash2 className="w-4 h-4 text-muted-foreground shrink-0" />Clear chat
                    </button>
                    <div className="h-px bg-border mx-3" />
                    <button onClick={handleBlockUser} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary transition-colors" style={{color: isBlocked ? '#16a34a' : '#f97316'}}>
                      <UserX className="w-4 h-4 shrink-0" />{isBlocked ? "Unblock User" : "Block User"}
                    </button>
                    <div className="h-px bg-border mx-3" />
                    <button onClick={handleDeleteConversation} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-secondary transition-colors">
                      <Trash2 className="w-4 h-4 shrink-0" />Delete chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
            {loadingMessages && visibleMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground"><p>Loading messages...</p></div>
            ) : visibleMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground"><p>No messages yet. Start the conversation!</p></div>
            ) : visibleMessages.map((msg) => {
              const isOwn = msg.senderId === currentUserId
              return (
                <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                  {msg.text.startsWith("__IMG__") ? (() => {
                    const rest = msg.text.replace("__IMG__", "")
                    const sepIdx = rest.lastIndexOf("||")
                    const dataUrl = sepIdx !== -1 ? rest.substring(0, sepIdx) : rest
                    const fileName = sepIdx !== -1 ? rest.substring(sepIdx + 2) : "Photo"
                    const handleDownloadImg = () => {
                      triggerBase64Download(dataUrl, fileName)
                    }
                    return (
                      <div className={cn("w-64 rounded-2xl overflow-hidden border", isOwn ? "border-primary/30 rounded-tr-sm" : "border-border rounded-tl-sm")}>
                        <div className="relative w-full h-48 overflow-hidden group">
                          <img src={dataUrl} alt="Shared" className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=400&fit=crop" }} />
                          {/* Download overlay button */}
                          <button
                            onClick={handleDownloadImg}
                            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <div className={cn("px-3 py-1.5", isOwn ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground")}>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs opacity-70">{formatTime(msg.createdAt)}</span>
                            {isOwn && (msg.status === "read" ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />)}
                          </div>
                        </div>
                      </div>
                    )
                  })() : msg.text.startsWith("__FILE__") ? (() => {
                    const parts = msg.text.replace("__FILE__", "").split("||")
                    const [fileName, ext, size] = parts
                    const dataUrl = parts[3] || null
                    const handleOpenFile = () => {
                      if (!dataUrl) return
                      triggerBase64Download(dataUrl, fileName)
                    }
                    return (
                      <div
                        className={cn("max-w-[75%] px-4 py-2.5 rounded-2xl relative", isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border text-card-foreground rounded-tl-sm")}
                      >
                        <div className="flex items-center gap-3 py-1">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold", isOwn ? "bg-white/20 text-white" : "bg-primary/10 text-primary")}>
                            {ext}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{fileName}</p>
                            <p className={cn("text-xs", isOwn ? "text-primary-foreground/60" : "text-muted-foreground")}>{size}</p>
                          </div>
                          {dataUrl ? (
                            <button
                              onClick={() => handleOpenFile()}
                              title="Download file"
                              className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors", isOwn ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 hover:bg-primary/20")}
                            >
                              <Download className={cn("w-4 h-4", isOwn ? "text-white" : "text-primary")} />
                            </button>
                          ) : (
                            <Paperclip className={cn("w-4 h-4 shrink-0", isOwn ? "text-primary-foreground/60" : "text-muted-foreground")} />
                          )}
                        </div>
                        <div className={cn("flex items-center justify-end gap-1 mt-1", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          <span className="text-xs">{formatTime(msg.createdAt)}</span>
                          {isOwn && (msg.status === "read" ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />)}
                        </div>
                      </div>
                    )
                  })() : msg.text.startsWith("__POST__") ? (() => {
                    const rest = msg.text.replace("__POST__", "")
                    const [image, userName, profession, description, likes] = rest.split("||")
                    return (
                      <div 
                        onClick={() => handleSharedPostClick(image, userName)}
                        className={cn("w-64 rounded-2xl overflow-hidden border cursor-pointer hover:shadow-md transition-shadow", isOwn ? "bg-primary text-primary-foreground border-primary/30 rounded-tr-sm" : "bg-card text-card-foreground border-border rounded-tl-sm")}
                      >
                        <div className={cn("p-3 border-b flex items-center gap-2", isOwn ? "border-white/10 bg-white/10" : "border-border bg-secondary/30")}>
                          <div className="flex-1 min-w-0 text-left">
                            <p className={cn("text-xs font-semibold truncate", isOwn ? "text-primary-foreground" : "text-foreground")}>{userName}</p>
                            <p className={cn("text-[10px] truncate", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>{profession}</p>
                          </div>
                        </div>
                        <div className="relative w-full h-40 overflow-hidden">
                          <img src={image} alt={description} className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=400&fit=crop" }} />
                        </div>
                        <div className={cn("p-3 space-y-1 text-left", isOwn ? "bg-primary" : "bg-card")}>
                          <p className={cn("text-xs line-clamp-2", isOwn ? "text-primary-foreground" : "text-foreground")}>{description}</p>
                          <div className={cn("flex items-center justify-between text-[10px] pt-1 border-t", isOwn ? "text-primary-foreground/70 border-white/10" : "text-muted-foreground border-border/50")}>
                            <span>❤️ {likes || 0} likes</span>
                            <div className="flex items-center gap-1">
                              <span>{formatTime(msg.createdAt)}</span>
                              {isOwn && (msg.status === "read" ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })() : (
                    <div className={cn("max-w-[75%] px-4 py-2.5 rounded-2xl relative", isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border text-card-foreground rounded-tl-sm")}>
                      <p className="text-sm break-words">{msg.text}</p>
                      <div className={cn("flex items-center justify-end gap-1 mt-1", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        <span className="text-xs">{formatTime(msg.createdAt)}</span>
                        {isOwn && (msg.status === "read" ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-card sticky bottom-0">
            {isBlockedByOther ? (
              <div className="flex items-center justify-center py-4 px-6 gap-2 text-sm text-muted-foreground">
                <UserX className="w-4 h-4 text-red-400" />
                <span>You cannot send messages to this user.</span>
              </div>
            ) : isBlocked ? (
              <div className="flex items-center justify-center py-4 px-6 gap-2 text-sm text-muted-foreground">
                <UserX className="w-4 h-4 text-orange-400" />
                <span>You have blocked this user. <button onClick={handleBlockUser} className="text-primary font-medium hover:underline">Unblock</button> to send messages.</span>
              </div>
            ) : (
            <>
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div ref={emojiRef} className="border-b border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Emojis</span>
                  <button onClick={() => setShowEmojiPicker(false)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} onClick={() => handleEmojiClick(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-secondary rounded-lg transition-colors">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 p-4">
              <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => imageInputRef.current?.click()}>
                <Image className="w-5 h-5" />
              </Button>
              <Input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyPress={handleKeyPress}
                placeholder="Type a message..." className="flex-1 bg-secondary border-0 rounded-full" />
              <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => setShowEmojiPicker(v => !v)}>
                <Smile className={cn("w-5 h-5", showEmojiPicker && "text-primary")} />
              </Button>
              <Button size="icon" className="rounded-full flex-shrink-0" onClick={handleSendDbMessage} disabled={!messageInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            </>
            )}
          </div>
        </div>
      )}

      {/* No conversation selected — desktop placeholder */}
      {!selectedDbConv && (
        <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground flex-col gap-2">
          <Search className="w-10 h-10 opacity-20" />
          <p className="text-sm">Select a conversation to start messaging</p>
        </div>
      )}

      {/* Call Screen */}
      {callState !== "idle" && selectedDbConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
          {callState === "ringing" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[1, 2, 3].map(i => (
                <div key={i} className="absolute rounded-full border border-white/10 animate-ping"
                  style={{ width: `${i * 120 + 80}px`, height: `${i * 120 + 80}px`, animationDelay: `${i * 0.4}s`, animationDuration: "2s" }} />
              ))}
            </div>
          )}
          <div className="flex flex-col items-center gap-8 px-8 w-full max-w-sm">
            <div className={cn("w-32 h-32 rounded-full p-1", callState === "connected" ? "bg-gradient-to-tr from-green-400 to-emerald-500" : "bg-gradient-to-tr from-primary to-violet-400")}>
              <Avatar className="w-full h-full border-4 border-[#1a1a2e]">
                {selectedDbConv.otherUserAvatar ? (
                  <AvatarImage src={selectedDbConv.otherUserAvatar} alt={selectedDbConv.otherUserName} />
                ) : null}
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full">{selectedDbConv.otherUserName?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-white">{selectedDbConv.otherUserName}</h2>
              <p className="text-white/50 text-sm">{selectedDbConv.otherUserProfession}</p>
              {callState === "ringing"
                ? <p className="text-white/70 text-sm animate-pulse mt-2">Calling...</p>
                : <p className="text-green-400 font-mono text-lg mt-2">{formatDuration(callDuration)}</p>}
            </div>
            {callState === "connected" ? (
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <button onClick={() => setIsMuted(v => !v)} className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-colors", isMuted ? "bg-white text-gray-900" : "bg-white/10 text-white hover:bg-white/20")}>
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <span className="text-white/50 text-xs">{isMuted ? "Unmute" : "Mute"}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button onClick={endCall} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg shadow-red-500/40">
                    <PhoneOff className="w-7 h-7 text-white" />
                  </button>
                  <span className="text-white/50 text-xs">End</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button onClick={() => setIsSpeaker(v => !v)} className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-colors", isSpeaker ? "bg-white text-gray-900" : "bg-white/10 text-white hover:bg-white/20")}>
                    <Volume2 className="w-6 h-6" />
                  </button>
                  <span className="text-white/50 text-xs">{isSpeaker ? "Speaker" : "Earpiece"}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button onClick={endCall} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg shadow-red-500/40">
                  <PhoneOff className="w-7 h-7 text-white" />
                </button>
                <span className="text-white/50 text-xs">Cancel</span>
              </div>
            )}
          </div>
        </div>
      )}

      {isProfileModalOpen && (
        <WorkerProfileModal
          worker={selectedWorkerForModal}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onMessage={handleProfileModalMessage}
          initialPost={initialPostForModal}
        />
      )}
    </div>
  )
}
