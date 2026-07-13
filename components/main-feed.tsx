"use client"

import { useState, useRef, useEffect } from "react"
import { Heart, MessageCircle, Bookmark, MapPin, Star, BadgeCheck, Share2, Plus, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useApp } from "@/context/app-context"
import { WorkerProfileModal, sampleWorkers } from "@/components/worker-profile-modal"
import { StoryViewer, Story } from "@/components/story-viewer"
import { AddStory } from "@/components/add-story"

// No pre-seeded stories - only user's own story
const storiesData: Story[] = [
  { id: 0, name: "Your Story", avatar: "", profession: "", hasUnseenStory: false, isOwn: true },
]

let convIdCounter = 2000
function newConvId() { return ++convIdCounter }

function formatTimestamp(timestamp: string) {
  const parsed = Date.parse(timestamp)
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  return timestamp
}

function getRelativeTimeString(timestamp: string) {
  const parsed = Date.parse(timestamp)
  if (Number.isNaN(parsed)) return timestamp

  const now = Date.now()
  const diffMs = now - parsed

  if (diffMs < 60000) {
    return "Just now"
  }

  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) {
    return `${diffMins}m ago`
  }

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) {
    return "Yesterday"
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return new Date(parsed).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

function OwnStoryViewer({ stories, onClose, onAddMore, onDelete, userAvatar }: {
  stories: { image: string; caption: string }[]
  onClose: () => void
  onAddMore: () => void
  onDelete: (i: number) => void
  userAvatar: string
}) {
  const [idx, setIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const DURATION = 5000

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
  }

  const goNext = useRef(() => { })
  goNext.current = () => {
    if (idx < stories.length - 1) {
      setIdx(i => i + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  const goPrev = () => {
    if (idx > 0) {
      setIdx(i => i - 1)
      setProgress(0)
    }
  }

  useEffect(() => {
    setProgress(0)
    clearTimers()
    const start = Date.now()
    progressRef.current = setInterval(() => {
      setProgress(Math.min(((Date.now() - start) / DURATION) * 100, 100))
    }, 50)
    timerRef.current = setTimeout(() => goNext.current(), DURATION)
    return clearTimers
  }, [idx])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext.current()
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [idx, onClose])

  const current = stories[idx]
  if (!current) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">

      {/* Left arrow — outside card, same as StoryViewer */}
      {idx > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-4 z-30 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      <div className="relative w-full max-w-[390px] h-full max-h-[100dvh] overflow-hidden">
        <img src={current.image} alt="Your story" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{ width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-3 right-3 flex items-center gap-3 z-20">
          <Avatar className="w-9 h-9 border-2 border-white shrink-0">
            <AvatarImage src={userAvatar} />
            <AvatarFallback>Me</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">Your Story</p>
            <p className="text-white/60 text-xs">{idx + 1} / {stories.length}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 z-30">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tap zones */}
        <div className="absolute inset-0 flex z-10">
          <div className="w-1/2 h-full cursor-pointer" onClick={goPrev} />
          <div className="w-1/2 h-full cursor-pointer" onClick={() => goNext.current()} />
        </div>

        {/* Caption */}
        {current.caption && (
          <div className="absolute bottom-24 left-4 right-4 z-20 pointer-events-none">
            <p className="text-white text-sm font-medium drop-shadow">{current.caption}</p>
          </div>
        )}

        {/* Bottom actions */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-3 z-20">
          <button onClick={onAddMore} className="flex-1 flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full py-3 text-white text-sm font-medium">
            <Plus className="w-4 h-4" />
            Add to Story
          </button>
          <button
            onClick={() => {
              onDelete(idx)
              if (stories.length <= 1) { onClose(); return }
              if (idx >= stories.length - 1) setIdx(i => i - 1)
              setProgress(0)
            }}
            className="px-5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full py-3 text-white text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Right arrow — outside card */}
      {idx < stories.length - 1 && (
        <button
          onClick={() => goNext.current()}
          className="absolute right-4 z-30 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-all"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  )
}

export function MainFeed({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { posts, toggleLikePost, toggleSavePost, addComment, userStories, addUserStory, deleteUserStory, userStoryWatched, setUserStoryWatched, setSelectedConversation, setConversations, conversations, followingIds, toggleFollow, userAvatar } = useApp()
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showPostOnOpen, setShowPostOnOpen] = useState(false)
  const [localAvatar, setLocalAvatar] = useState("")

  // Sync local avatar when context avatar changes
  useEffect(() => {
    setLocalAvatar(userAvatar)
  }, [userAvatar])

  // Also sync from localStorage on mount, when storage changes, and on auth-change (login/logout)
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const stored = localStorage.getItem("auth_user")
        if (stored) {
          const user = JSON.parse(stored)
          setLocalAvatar(user.avatar || "")
        } else {
          // Logged out — clear avatar
          setLocalAvatar("")
        }
      } catch { }
    }

    syncFromStorage()

    // Listen for auth-change events (login/logout/switch accounts)
    window.addEventListener("auth-change", syncFromStorage)
    // Also listen for storage events (cross-tab sync)
    window.addEventListener('storage', syncFromStorage)
    return () => {
      window.removeEventListener("auth-change", syncFromStorage)
      window.removeEventListener('storage', syncFromStorage)
    }
  }, [])

  // Get current user name and avatar for story display - reactive to changes
  const getCurrentUserData = () => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) {
        const user = JSON.parse(stored)
        return {
          name: user.name || "Your Story",
          avatar: user.avatar || ""
        }
      }
    } catch { }
    return { name: "Your Story", avatar: "" }
  }

  const userData = getCurrentUserData()

  // Build user story with dynamic avatar - prioritize local state, then context, then localStorage
  const userStoryData: Story = {
    id: 0,
    name: userData.name,
    avatar: localAvatar || userAvatar || userData.avatar,
    profession: "",
    hasUnseenStory: false,
    isOwn: true
  }

  const [commentTexts, setCommentTexts] = useState<{ [postId: string | number]: string }>({})
  const [openCommentPostId, setOpenCommentPostId] = useState<string | number | null>(null)
  const [selectedStoryId, setSelectedStoryId] = useState<string | number | null>(null)
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false)
  const [watchedStoryIds, setWatchedStoryIds] = useState<(string | number)[]>([])
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false)
  const [sharePostId, setSharePostId] = useState<string | number | null>(null)
  const [shareSearch, setShareSearch] = useState("")
  const [sharedTo, setSharedTo] = useState<(string | number)[]>([])
  const [dynamicStory, setDynamicStory] = useState<Story | null>(null)

  const sortedStories = [
    userStoryData,
    ...storiesData.slice(1).filter(s => !watchedStoryIds.includes(s.id)),
    ...storiesData.slice(1).filter(s => watchedStoryIds.includes(s.id)),
  ]

  const handlePostStoryClick = (post: typeof posts[0]) => {
    const existing = storiesData.find(s => s.id === post.id)
    if (existing) {
      setDynamicStory(null)
      setSelectedStoryId(post.id)
    } else {
      setDynamicStory({
        id: post.id,
        name: post.user.name,
        avatar: post.user.avatar,
        profession: post.user.profession,
        hasUnseenStory: true,
      })
      setSelectedStoryId(post.id)
    }
    setIsStoryViewerOpen(true)
  }

  const handleStoryWatched = (storyId: string | number) => {
    setWatchedStoryIds(prev => prev.includes(storyId) ? prev : [...prev, storyId])
  }

  const openProfile = (postId: string | number, showPost: boolean = false) => {
    setShowPostOnOpen(showPost)
    setSelectedWorkerId(postId)
    setIsModalOpen(true)
  }

  const closeProfile = () => {
    setIsModalOpen(false)
    setSelectedWorkerId(null)
    setShowPostOnOpen(false)
  }

  const handleMessage = async (workerId: number | string) => {
    // Try sampleWorkers first, then fall back to post data
    const sampleWorker = sampleWorkers.find(w => w.id === workerId)
    const post = posts.find(p => p.id === workerId)
    const name = sampleWorker?.name ?? post?.user.name
    const profession = sampleWorker?.profession ?? post?.user.profession ?? ""
    const avatar = sampleWorker?.avatar ?? post?.user.avatar ?? ""
    const targetUserId = sampleWorker?.id ?? post?.user.id

    if (!name) { closeProfile(); setActiveTab?.("messages"); return }

    // Create or get conversation in DB
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored && targetUserId) {
        const currentUser = JSON.parse(stored)
        if (currentUser.id) {
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id, otherUserId: String(targetUserId) })
          })
        }
      }
    } catch (err) {
      console.error("Failed to create conversation in DB:", err)
    }

    const existing = conversations.find(c => c.name === name)
    if (existing) {
      setSelectedConversation(existing)
    } else {
      const newConv = {
        id: newConvId(),
        name,
        profession,
        avatar,
        lastMessage: "Start a conversation",
        timestamp: "Just now",
        unread: 0,
        isOnline: true,
        messages: [],
      }
      setConversations(prev => [newConv, ...prev])
      setSelectedConversation(newConv)
    }
    closeProfile()
    setActiveTab?.("messages")
  }

  const handleShareToConversation = async (convId: string | number, post: typeof posts[0]) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const textContent = `__POST__${post.images[0]}||${post.user.name}||${post.user.profession}||${post.description}||${post.likes}`
    try {
      const stored = localStorage.getItem("auth_user")
      if (!stored) return
      const user = JSON.parse(stored)
      if (!user.id) return

      const response = await fetch(`/api/messages/${convId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: String(user.id), text: textContent })
      })

      if (response.ok) {
        setSharedTo(prev => [...prev, convId])
        setConversations(prev =>
          prev.map(conv => {
            if (conv.id !== convId) return conv
            const msg = {
              id: Date.now(),
              text: textContent,
              isOwn: true,
              timestamp: timeStr,
              status: "sent" as const,
            }
            return { ...conv, lastMessage: `📸 Shared ${post.user.name}'s post`, timestamp: "Just now", messages: [...conv.messages, msg] }
          })
        )
      }
    } catch (err) {
      console.error("Failed to share post:", err)
    }
  }

  const handleComment = (postId: string | number) => {
    const text = commentTexts[postId] || ""
    if (text.trim()) {
      addComment(postId, text)
      setCommentTexts(prev => ({ ...prev, [postId]: "" }))
      setOpenCommentPostId(null)
    }
  }

  const toggleCommentBox = (postId: string | number) => {
    setOpenCommentPostId(prev => prev === postId ? null : postId)
  }

  const getSelectedWorker = () => {
    if (!selectedWorkerId) return null
    const found = sampleWorkers.find(w => w.id === selectedWorkerId)
    if (found) return found
    const post = posts.find(p => p.id === selectedWorkerId)
    if (!post) return null

    let parsedBioText = post.user.bio || ""
    let parsedExperience = "Experienced Professional"
    let parsedExpectedRates = ""
    let parsedWorkerType = "normal"
    let parsedCoverImage = ""
    let parsedCrewSize = ""
    let parsedCrewComposition = ""
    let parsedGroupName = ""

    if (post.user.bio) {
      try {
        if (post.user.bio.trim().startsWith("{") && post.user.bio.trim().endsWith("}")) {
          const p = JSON.parse(post.user.bio)
          parsedBioText = p.bio || ""
          parsedExperience = p.experience || "Experienced Professional"
          parsedExpectedRates = p.expectedRates || ""
          parsedWorkerType = p.workerType || "normal"
          parsedCoverImage = p.coverImage || ""
          parsedCrewSize = p.crewSize || ""
          parsedCrewComposition = p.crewComposition || ""
          parsedGroupName = p.groupName || ""
        }
      } catch { }
    }

    return {
      id: post.id,
      name: post.user.name,
      profession: post.user.profession,
      avatar: post.user.avatar,
      coverImage: parsedCoverImage,
      rating: post.user.rating,
      projectsCount: post.likes,
      bio: parsedBioText || post.description,
      skills: post.tags.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)),
      gallery: [
        parsedCoverImage,
        post.images[0],
      ].filter(Boolean),
      verified: post.user.verified,
      location: post.user.location,
      experience: parsedExperience,
      upiId: post.user.upiId || "",
      bankAccount: post.user.bankAccount || "",
      bankIfsc: post.user.bankIfsc || "",
      workerType: parsedWorkerType,
      crewSize: parsedCrewSize,
      crewComposition: parsedCrewComposition,
      groupName: parsedGroupName,
    }
  }
  const selectedWorker = getSelectedWorker()

  const extraStoryContent = dynamicStory
    ? { [dynamicStory.id]: [{ image: posts.find(p => p.id === dynamicStory.id)?.images[0] ?? dynamicStory.avatar, caption: `${dynamicStory.name}'s post` }] }
    : {}

  return (
    <div className="min-h-full max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Stories Section */}
      <div className="bg-card rounded-2xl border border-border p-3">
        <div className="flex gap-3.5 overflow-x-auto pb-1 scrollbar-hide">
          {sortedStories.map((story) => (
            <button
              key={story.id}
              onClick={() => {
                if (story.isOwn) {
                  if (userStories.length > 0) {
                    setSelectedStoryId(-1)
                    setIsStoryViewerOpen(true)
                  } else {
                    setIsAddStoryOpen(true)
                  }
                } else {
                  setSelectedStoryId(story.id)
                  setIsStoryViewerOpen(true)
                }
              }}
              className="flex flex-col items-center gap-1 min-w-[70px]"
            >
              <div className={cn(
                "relative w-16 h-16 rounded-full p-[3px]",
                story.isOwn
                  ? userStories.length > 0 && !userStoryWatched
                    ? "bg-gradient-to-tr from-purple-600 via-violet-500 to-fuchsia-400"
                    : "bg-border"
                  : story.hasUnseenStory && !watchedStoryIds.includes(story.id)
                    ? "bg-gradient-to-tr from-purple-600 via-violet-500 to-fuchsia-400"
                    : "bg-border"
              )}>
                <div className="w-full h-full rounded-full bg-card p-[2px]">
                  <Avatar className="w-full h-full">
                    {story.avatar ? (
                      <AvatarImage src={story.avatar} alt={story.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-xs">
                      {story.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {story.isOwn && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-card">
                    <Plus className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-card-foreground truncate w-full text-center">
                {story.isOwn ? "Add Story" : story.name}
              </span>
              {!story.isOwn && (
                <span className="text-[10px] text-muted-foreground truncate w-full text-center -mt-1">
                  {story.profession}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {posts.map((post) => {
        const isOwnPost = post.user.name === userData.name;
        const hasActiveStory = isOwnPost
          ? (userStories.length > 0 && !userStoryWatched)
          : (storiesData.some(s => s.name === post.user.name && s.hasUnseenStory) && !watchedStoryIds.includes(post.id));

        return (
          <article key={post.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Post Header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                {/* Avatar — opens story viewer if active, else profile */}
                <button
                  onClick={() => {
                    if (hasActiveStory) {
                      if (isOwnPost) {
                        setSelectedStoryId(-1)
                        setIsStoryViewerOpen(true)
                      } else {
                        handlePostStoryClick(post)
                      }
                    } else {
                      openProfile(post.id)
                    }
                  }}
                  className={cn(
                    "relative w-11 h-11 rounded-full p-[2px] shrink-0",
                    hasActiveStory
                      ? "bg-gradient-to-tr from-purple-600 via-violet-500 to-fuchsia-400"
                      : "bg-border"
                  )}
                >
                  <div className="w-full h-full rounded-full bg-card p-[1px] overflow-hidden">
                    <Avatar className="w-full h-full">
                      {post.user.avatar ? (
                        <AvatarImage src={post.user.avatar} alt={post.user.name} />
                      ) : null}
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-sm">
                        {post.user.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </button>

                {/* Name — opens full profile modal */}
                <button className="text-left" onClick={() => openProfile(post.id)}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-card-foreground hover:underline">{post.user.name}</span>
                    {post.user.verified && (
                      <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{post.user.profession}</span>
                  </div>
                </button>
              </div>
              {(() => {
                try {
                  const me = JSON.parse(localStorage.getItem("auth_user") || "{}")
                  return post.user.name !== me.name
                } catch { return true }
              })() && (
                  <Button
                    size="sm"
                    variant={followingIds.includes(post.user.id) ? "secondary" : "outline"}
                    className="rounded-full h-8 px-4 ml-2"
                    onClick={() => toggleFollow(post.user.id, post.user.name, post.user.profession, post.user.avatar)}
                  >
                    {followingIds.includes(post.user.id) ? "Following" : "Follow"}
                  </Button>
                )}
            </div>

            {/* Post Image */}
            <div className="relative aspect-square bg-muted">
              <img
                src={post.images[0]}
                alt={post.description}
                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=600&fit=crop" }}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-full">
                <MapPin className="w-3 h-3" />
                <span>{post.user.location}</span>
              </div>
            </div>

            {/* Post Actions */}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="w-9 h-9" onClick={() => toggleLikePost(post.id)}>
                    <Heart className={cn("w-5 h-5 transition-all", post.isLiked && "fill-primary text-primary scale-110")} />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-9 h-9" onClick={() => toggleCommentBox(post.id)}>
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-9 h-9" onClick={() => { setSharePostId(post.id); setSharedTo([]); setShareSearch("") }}>
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="w-9 h-9" onClick={() => toggleSavePost(post.id)}>
                  <Bookmark className={cn("w-5 h-5 transition-all", post.isSaved && "fill-primary text-primary")} />
                </Button>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-sm text-card-foreground">{post.likes.toLocaleString()} likes</p>
                <p className="text-sm text-card-foreground">
                  <span className="font-semibold">{post.user.name}</span>{" "}{post.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-xs text-primary font-medium">#{tag}</span>
                  ))}
                </div>
                <button
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => openProfile(post.id, true)}
                >
                  View all {post.comments} comments
                </button>
                <p className="text-xs text-muted-foreground">{getRelativeTimeString(post.timestamp)}</p>
              </div>

              {openCommentPostId === post.id && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Avatar className="w-7 h-7">
                    {userAvatar ? (
                      <AvatarImage src={userAvatar} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-[10px]">
                      {userData.name?.[0]?.toUpperCase() || "M"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={commentTexts[post.id] || ""}
                      onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") handleComment(post.id) }}
                      className="h-8 text-sm bg-muted border-0"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleComment(post.id)} disabled={!(commentTexts[post.id] || "").trim()} className="h-8 px-3">
                      Post
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </article>
        )
      })}

      {/* Worker Profile Modal */}
      <WorkerProfileModal
        worker={selectedWorker}
        isOpen={isModalOpen}
        onClose={closeProfile}
        onMessage={handleMessage}
        initialPost={showPostOnOpen ? posts.find(p => p.id === selectedWorkerId) : null}
      />

      {/* Story Viewer */}
      <StoryViewer
        stories={dynamicStory ? [...storiesData, dynamicStory] : storiesData}
        initialStoryId={selectedStoryId ?? 1}
        isOpen={isStoryViewerOpen && selectedStoryId !== null && selectedStoryId !== -1}
        onClose={() => { setIsStoryViewerOpen(false); setSelectedStoryId(null); setDynamicStory(null) }}
        onStoryWatched={handleStoryWatched}
        extraContent={extraStoryContent}
      />

      {/* Add Story */}
      <AddStory
        isOpen={isAddStoryOpen}
        onClose={() => setIsAddStoryOpen(false)}
        onStoryAdded={(image, caption) => {
          addUserStory({ image, caption })
          setIsAddStoryOpen(false)
        }}
      />

      {/* Own story viewer */}
      {isStoryViewerOpen && selectedStoryId === -1 && userStories.length > 0 && (
        <OwnStoryViewer
          stories={userStories}
          userAvatar={userAvatar}
          onClose={() => { setUserStoryWatched(true); setIsStoryViewerOpen(false); setSelectedStoryId(null) }}
          onAddMore={() => { setUserStoryWatched(true); setIsStoryViewerOpen(false); setSelectedStoryId(null); setIsAddStoryOpen(true) }}
          onDelete={(i) => deleteUserStory(i)}
        />
      )}

      {/* Share Post Modal */}
      {sharePostId !== null && (() => {
        const post = posts.find(p => p.id === sharePostId)
        if (!post) return null
        const filtered = conversations.filter(c => c.name.toLowerCase().includes(shareSearch.toLowerCase()))
        return (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setSharePostId(null)}>
            <div className="bg-card rounded-2xl w-full max-w-sm shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-card-foreground">Share to</h3>
                <button onClick={() => setSharePostId(null)} className="p-1 rounded-full hover:bg-secondary">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="px-4 py-2 border-b border-border">
                <Input
                  placeholder="Search people..."
                  value={shareSearch}
                  onChange={e => setShareSearch(e.target.value)}
                  className="h-8 text-sm bg-secondary border-0"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-border">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No conversations found</p>
                ) : filtered.map(conv => {
                  const sent = sharedTo.includes(conv.id)
                  return (
                    <div key={conv.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        {conv.avatar ? (
                          <AvatarImage src={conv.avatar} alt={conv.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-sm">
                          {conv.name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-card-foreground truncate">{conv.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{conv.profession}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={sent ? "secondary" : "default"}
                        className="rounded-full h-8 text-xs shrink-0"
                        onClick={() => { if (!sent) handleShareToConversation(conv.id, post) }}
                      >
                        {sent ? "Sent" : "Send"}
                      </Button>
                    </div>
                  )
                })}
              </div>
              <div className="px-4 py-3 border-t border-border">
                <Button className="w-full rounded-xl" onClick={() => { setSharePostId(null); if (sharedTo.length > 0) setActiveTab?.("messages") }}>
                  {sharedTo.length > 0 ? `Done · Sent to ${sharedTo.length}` : "Cancel"}
                </Button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
