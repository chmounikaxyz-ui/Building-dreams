"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { 
  MapPin, Star, Calendar, Briefcase, Edit2, Share2, 
  Heart, MessageCircle, Bookmark, Grid3X3, BadgeCheck, Camera, Plus, X, Trash2, Image as ImageIcon, Tag,
  Phone, CreditCard, QrCode, Building2, Banknote, Store
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn, optimizeImage } from "@/lib/utils"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { AddStory } from "@/components/add-story"

// No default cover - user adds their own
const defaultCoverImage = ""

export function ProfilePage({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [activeTab, setLocalTab] = useState<"posts" | "saved">("posts")
  const { userStories, addUserStory, deleteUserStory, userStoryWatched, setUserStoryWatched, posts: feedPosts, addPost, deletePost, toggleSavePost, toggleLikePost, addComment, deleteComment, reloadPosts, userAvatar, setUserAvatar, followingList, userLocation, detectLocation } = useApp()
  const { user } = useAuth()
  const [followerCount, setFollowerCount] = useState(0)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [newCommentText, setNewCommentText] = useState("")

  // Get current user ID
  const getCurrentUserId = () => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) {
        const u = JSON.parse(stored)
        return u.id || null
      }
    } catch {}
    return null
  }

  // Build profile from real auth user
  const authName = user?.name || "User"
  const authEmail = user?.email || ""
  const authProfession = user?.profession || "Construction Professional"
  const authAvatarFromDB = user?.avatar || ""
  
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false)
  const [viewingStory, setViewingStory] = useState(false)
  const [viewingStoryIdx, setViewingStoryIdx] = useState(0)
  const [isAddPostOpen, setIsAddPostOpen] = useState(false)
  const [postImage, setPostImage] = useState<string>("")
  const [postDescription, setPostDescription] = useState("")
  const [postTagInput, setPostTagInput] = useState("")
  const [postTags, setPostTags] = useState<string[]>([])
  const [postLocation, setPostLocation] = useState("")
  const [selectedPost, setSelectedPost] = useState<any | null>(null)
  const [selectedPostIsOwn, setSelectedPostIsOwn] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  
  // Load cover and avatar per-user from localStorage
  const [coverImage, setCoverImage] = useState(() => {
    const userId = getCurrentUserId()
    if (userId) {
      try {
        return localStorage.getItem(`cover_${userId}`) || ""
      } catch {}
    }
    return ""
  })
  
  const [displayAvatar, setDisplayAvatar] = useState(() => {
    // Always load from DB first, fallback to localStorage
    return authAvatarFromDB
  })

  // Editable profile fields — seeded from real auth user
  const [profile, setProfile] = useState({
    name: authName,
    email: authEmail,
    profession: authProfession,
    bio: "",
    location: "Add your location",
    experience: "",
    expectedRates: "",
    storeName: "",
    phone: "",
    upiId: "",
    bankAccount: "",
    bankIfsc: "",
    workerType: "",
  })
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false)
  const [editDraft, setEditDraft] = useState(profile)

  // Re-initialize profile from localStorage on mount so refreshes reflect actual logged-in user
  useEffect(() => {
    const loadProfileData = () => {
      try {
        const stored = localStorage.getItem("auth_user")
        if (stored) {
          const u = JSON.parse(stored)
          const name = u.name || authName
          const profession = u.profession || authProfession
          
          let parsedBioText = u.bio || ""
          let parsedExperience = u.experience || ""
          let parsedExpectedRates = u.expectedRates || ""
          let parsedStoreName = u.storeName || ""
          let parsedWorkerType = ""
          
          if (u.bio) {
            try {
              if (u.bio.trim().startsWith("{") && u.bio.trim().endsWith("}")) {
                const p = JSON.parse(u.bio)
                parsedBioText = p.bio || ""
                parsedExperience = p.experience || ""
                parsedExpectedRates = p.expectedRates || ""
                parsedStoreName = p.storeName || ""
                parsedWorkerType = p.workerType || ""
              }
            } catch {}
          }
          if (u.role === "seller" && !parsedStoreName) {
            parsedStoreName = profession.startsWith("Seller · ") ? profession.replace("Seller · ", "") : ""
          }

          setProfile(prev => ({
            ...prev,
            name,
            email: u.email || authEmail,
            profession,
            bio: parsedBioText,
            location: u.location || "Add your location",
            experience: parsedExperience,
            expectedRates: parsedExpectedRates,
            storeName: parsedStoreName,
            phone: u.phone || "",
            upiId: u.upiId || "",
            bankAccount: u.bankAccount || "",
            bankIfsc: u.bankIfsc || "",
            workerType: parsedWorkerType,
          }))
          // Reload avatar for new user
          setDisplayAvatar(u.avatar || "")
          // Reload cover for new user
          const userId = u.id
          if (userId) {
            const savedCover = localStorage.getItem(`cover_${userId}`) || ""
            setCoverImage(savedCover)
          } else {
            setCoverImage("")
          }
        } else {
          // Logged out — clear everything
          setDisplayAvatar("")
          setCoverImage("")
        }
      } catch {}
    }

    loadProfileData()

    // Listen for login/logout events
    window.addEventListener("auth-change", loadProfileData)
    return () => window.removeEventListener("auth-change", loadProfileData)
  }, [])

  // Reload posts from DB on profile mount so isLiked/isSaved is accurate
  useEffect(() => {
    reloadPosts()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchFollowers = async () => {
      const uid = getCurrentUserId()
      if (!uid) return
      try {
        const res = await fetch(`/api/users/${uid}`)
        if (res.ok) {
          const data = await res.json()
          if (data && data.followers) {
            setFollowerCount(data.followers.length || 0)
          }
        }
      } catch (err) {
        console.error("Failed to fetch followers from DB:", err)
      }
    }
    fetchFollowers()
  }, [feedPosts])

  useEffect(() => {
    if (userLocation?.status === "success" && userLocation?.city) {
      setPostLocation(userLocation.city)
    }
  }, [userLocation])

  const currentUserId = getCurrentUserId()
  const savedPosts = feedPosts.filter(p => p.isSaved)
  // My posts = filter strictly by user ID match to prevent unrelated fallback name matches
  const myPosts = feedPosts.filter(p => {
    const pUserId = p.user?.id
    return pUserId && currentUserId && String(pUserId) === String(currentUserId)
  })

  const handleAddTag = () => {
    const tag = postTagInput.trim().replace(/^#/, "")
    if (tag && !postTags.includes(tag)) setPostTags(prev => [...prev, tag])
    setPostTagInput("")
  }

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const optimized = await optimizeImage(file, 1600, 1600, 0.95)
      setPostImage(optimized)
    } catch (err) { console.error(err) }
  }

  const handleCoverPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const newCover = await optimizeImage(file, 1600, 1600, 0.95)
      setCoverImage(newCover)
      
      // Save per-user in localStorage
      const userId = getCurrentUserId()
      if (userId) {
        try {
          localStorage.setItem(`cover_${userId}`, newCover)
        } catch (err) {
          console.error("Failed to save cover:", err)
        }

        // Also save to database bio JSON object!
        try {
          const stored = localStorage.getItem("auth_user")
          const storedUser = stored ? JSON.parse(stored) : {}
          
          let bioObj: any = {}
          if (storedUser.bio) {
            try {
              if (storedUser.bio.trim().startsWith("{") && storedUser.bio.trim().endsWith("}")) {
                bioObj = JSON.parse(storedUser.bio)
              } else {
                bioObj.bio = storedUser.bio
              }
            } catch {}
          }
          
          bioObj.coverImage = newCover
          const stringifiedBio = JSON.stringify(bioObj)
          
          storedUser.bio = stringifiedBio
          localStorage.setItem("auth_user", JSON.stringify(storedUser))
          
          // Trigger auth-change so other components reload details
          window.dispatchEvent(new Event("auth-change"))

          fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: storedUser.id,
              bio: stringifiedBio,
            })
          }).catch(console.error)
        } catch (err) {
          console.error("Failed to save cover to DB:", err)
        }
      }
    } catch (err) { console.error(err) }
  }

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const newAvatar = await optimizeImage(file, 800, 800, 0.95)
      setDisplayAvatar(newAvatar)
      setUserAvatar(newAvatar) // Also update context for other components
      
      // Update localStorage auth_user
      try {
        const stored = localStorage.getItem("auth_user")
        if (stored) {
          const user = JSON.parse(stored)
          user.avatar = newAvatar
          localStorage.setItem("auth_user", JSON.stringify(user))
          
          // Also update the database avatar endpoint
          if (user.id) {
            fetch("/api/users", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.id, avatar: newAvatar })
            }).then(() => {
              window.dispatchEvent(new CustomEvent("auth-change", { detail: { userId: user.id } }))
            }).catch(console.error)
          }
        }
      } catch (err) {
        console.error("Failed to save avatar:", err)
      }
    } catch (err) { console.error(err) }
  }

  const handleRemoveAvatar = async () => {
    setDisplayAvatar("")
    setUserAvatar("")
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) {
        const user = JSON.parse(stored)
        user.avatar = ""
        localStorage.setItem("auth_user", JSON.stringify(user))
        
        if (user.id) {
          await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, avatar: "" })
          })
          window.dispatchEvent(new CustomEvent("auth-change", { detail: { userId: user.id } }))
        }
      }
    } catch (err) {
      console.error("Failed to remove avatar:", err)
    }
  }

  const handleSubmitPost = async () => {
    if (!postImage && !postDescription.trim()) return
    const image = postImage || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=600&fit=crop"
    await addPost(image, postDescription, postTags, postLocation || "")
    setPostImage("")
    setPostDescription("")
    setPostTags([])
    setPostTagInput("")
    setPostLocation("")
    setIsAddPostOpen(false)
  }

  return (
    <>
    <div className="max-w-4xl mx-auto">
      <div className="relative h-48 lg:h-64 bg-muted">
        {coverImage ? (
          <>
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <Button 
              variant="secondary" 
              size="sm" 
              className="absolute top-4 right-4 rounded-full gap-2"
              onClick={() => coverInputRef.current?.click()}
            >
              <Camera className="w-4 h-4" />
              Edit Cover
            </Button>
          </>
        ) : (
          <button
            onClick={() => coverInputRef.current?.click()}
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 transition-colors cursor-pointer"
          >
            <div className="text-center text-slate-400">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Add cover photo</p>
            </div>
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 lg:px-6 -mt-16 relative">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          {/* Avatar — ring shows story exists, clicking opens story or add story */}
          <div className="relative">
            <button
              onClick={() => userStories.length > 0 ? setViewingStory(true) : setIsAddStoryOpen(true)}
              className={cn(
                "relative w-40 h-40 rounded-full p-[3px] block",
                userStories.length > 0 && !userStoryWatched
                  ? "bg-gradient-to-tr from-purple-600 via-violet-500 to-fuchsia-400"
                  : "bg-border"
              )}
            >
              <div className="w-full h-full rounded-full bg-background p-[2px] overflow-hidden">
                <Avatar className="w-full h-full">
                  {displayAvatar ? (
                    <AvatarImage src={displayAvatar} alt={profile.name} />
                  ) : null}
                  <AvatarFallback className="text-6xl font-bold bg-primary text-primary-foreground flex items-center justify-center w-full h-full">
                    {profile.name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-2 right-2 w-8 h-8 rounded-full shadow z-10"
              onClick={() => setIsAvatarMenuOpen(true)}
              title="Profile photo options"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>

          {/* Name and Actions */}
          <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                {user?.verified && (
                  <BadgeCheck className="w-6 h-6 text-primary fill-primary/20" />
                )}
              </div>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>
            <div className="flex gap-2">
              <Button className="rounded-xl gap-2" onClick={() => { setEditDraft(profile); setIsEditProfileOpen(true) }}>
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-6 pb-4 border-b border-border">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{myPosts.length}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{followerCount}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{followingList.length}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
        </div>

        {/* Bio and Details */}
        <div className="py-4 space-y-4 border-b border-border">
          <div>
            <p className="font-semibold text-foreground">{profile.profession}</p>
            <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-slate-400" />
              {profile.location}
            </div>
            {(user?.role === "worker" || user?.role === "seller") && profile.experience && (
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4 text-slate-400" />
                {profile.experience} experience
              </div>
            )}
            {user?.role === "seller" && profile.storeName && (
              <div className="flex items-center gap-1">
                <Store className="w-4 h-4 text-slate-400" />
                Store Name: {profile.storeName}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              Joined 2019
            </div>

          </div>

          {/* Skills and Certifications removed */}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setLocalTab("posts")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2",
              activeTab === "posts"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Grid3X3 className="w-4 h-4" />
            Posts
          </button>
          <button
            onClick={() => setLocalTab("saved")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2",
              activeTab === "saved"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Bookmark className="w-4 h-4" />
            Saved
          </button>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-3 gap-1 py-4">
          {activeTab === "posts" ? (
            <>
              {/* Add New Post */}
              <button
                onClick={() => setIsAddPostOpen(true)}
                className="aspect-square bg-secondary hover:bg-secondary/80 transition-colors flex flex-col items-center justify-center gap-2 rounded-lg"
              >
                <Plus className="w-8 h-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add Post</span>
              </button>
              {myPosts.map((post) => (
                <div key={post.id} onClick={() => { setSelectedPost(post); setSelectedPostIsOwn(true) }} className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg">
                  <img
                    src={'images' in post ? post.images[0] : (post as any).image}
                    alt="Post"
                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=400&fit=crop" }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-white text-sm">
                        <Heart className="w-4 h-4 fill-white" />
                        {post.likes}
                      </div>
                      <div className="flex items-center gap-1 text-white text-sm">
                        <MessageCircle className="w-4 h-4 fill-white" />
                        {post.comments}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : savedPosts.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-16 gap-3">
              <Bookmark className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No saved posts yet</p>
              <p className="text-xs text-muted-foreground">Tap the bookmark icon on any post to save it here</p>
            </div>
          ) : (
            savedPosts.map((post) => (
              <div key={post.id} onClick={() => { setSelectedPost(post); setSelectedPostIsOwn(false) }} className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg">
                <img
                  src={post.images[0]}
                  alt="Saved post"
                  onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=400&fit=crop" }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1 text-white text-sm">
                    <Heart className="w-4 h-4 fill-white" />
                    {post.likes}
                  </div>
                  <div className="flex items-center gap-1 text-white text-sm">
                    <MessageCircle className="w-4 h-4 fill-white" />
                    {post.comments}
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <Bookmark className="w-4 h-4 fill-white text-white drop-shadow" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Story */}
      <AddStory
        isOpen={isAddStoryOpen}
        onClose={() => setIsAddStoryOpen(false)}
        onStoryAdded={(image, caption) => {
          addUserStory({ image, caption })
          setIsAddStoryOpen(false)
        }}
      />

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPick} />
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
    </div>

    {typeof window !== "undefined" && createPortal(
      <>
      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setIsEditProfileOpen(false)}>
          <div className="bg-card rounded-2xl w-full max-w-md shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-card-foreground">Edit Profile</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="p-1 rounded-full hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <Input
                  value={editDraft.name}
                  onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                  className="bg-secondary border-0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input
                  value={editDraft.email}
                  onChange={e => setEditDraft(d => ({ ...d, email: e.target.value }))}
                  className="bg-secondary border-0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Profession</label>
                <Input
                  value={editDraft.profession}
                  onChange={e => setEditDraft(d => ({ ...d, profession: e.target.value }))}
                  className="bg-secondary border-0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Bio</label>
                <textarea
                  value={editDraft.bio}
                  onChange={e => setEditDraft(d => ({ ...d, bio: e.target.value }))}
                  rows={3}
                  className="w-full resize-none rounded-xl bg-secondary border-0 px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={editDraft.location}
                    onChange={e => setEditDraft(d => ({ ...d, location: e.target.value }))}
                    className="pl-8 bg-secondary border-0"
                  />
                </div>
              </div>

              {(user?.role === "worker" || user?.role === "seller") && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Experience</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={editDraft.experience}
                      onChange={e => setEditDraft(d => ({ ...d, experience: e.target.value }))}
                      className="pl-8 bg-secondary border-0"
                      placeholder="e.g. 15 years"
                    />
                  </div>
                </div>
              )}

              {user?.role === "seller" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Store / Shop Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={editDraft.storeName}
                      onChange={e => setEditDraft(d => ({ ...d, storeName: e.target.value }))}
                      className="pl-8 bg-secondary border-0"
                      placeholder="e.g. Sharma Cement Store"
                    />
                  </div>
                </div>
              )}

              {user?.role === "worker" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Expected Rates</label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={editDraft.expectedRates}
                      onChange={e => setEditDraft(d => ({ ...d, expectedRates: e.target.value }))}
                      className="pl-8 bg-secondary border-0"
                      placeholder="e.g. ₹500/day or ₹1000/ton"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={editDraft.phone}
                    onChange={e => setEditDraft(d => ({ ...d, phone: e.target.value }))}
                    className={cn("pl-8 bg-secondary border-0", editDraft.phone && !/^[6-9]\d{9}$/.test(editDraft.phone.replace(/[\s\-\+]/g, "").replace(/^91/, "")) && "ring-2 ring-destructive/40")}
                    placeholder="10-digit mobile (e.g. 9876543210)"
                  />
                </div>
                {editDraft.phone && !/^[6-9]\d{9}$/.test(editDraft.phone.replace(/[\s\-\+]/g, "").replace(/^91/, "")) && (
                  <p className="text-[10px] text-destructive">Enter a valid 10-digit number starting with 6-9</p>
                )}
              </div>
              {user?.role === "seller" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">UPI ID (VPA)</label>
                  <div className="relative">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={editDraft.upiId}
                      onChange={e => setEditDraft(d => ({ ...d, upiId: e.target.value }))}
                      className={cn("pl-8 bg-secondary border-0", editDraft.upiId && !/^[a-zA-Z0-9._\-]+@[a-zA-Z]{3,}$/.test(editDraft.upiId) && "ring-2 ring-destructive/40")}
                      placeholder="e.g. name@upi or name@okaxis"
                    />
                  </div>
                  {editDraft.upiId && !/^[a-zA-Z0-9._\-]+@[a-zA-Z]{3,}$/.test(editDraft.upiId) && (
                    <p className="text-[10px] text-destructive">Invalid — use: name@upi or name@okaxis</p>
                  )}
                  {editDraft.upiId && /^[a-zA-Z0-9._\-]+@[a-zA-Z]{3,}$/.test(editDraft.upiId) && (
                    <p className="text-[10px] text-emerald-600">✓ Valid UPI ID</p>
                  )}
                </div>
              )}
            </div>

            <div className="px-4 pb-4 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsEditProfileOpen(false)}>Cancel</Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={() => {
                  const updated = { ...editDraft }
                  
                  // For seller, update profession to contain store name
                  let resolvedProfession = updated.profession
                  if (user?.role === "seller") {
                    resolvedProfession = updated.storeName ? `Seller · ${updated.storeName}` : "Seller"
                    updated.profession = resolvedProfession
                  }

                  // Preserve existing cover image if it was uploaded
                  let parsedCover = ""
                  try {
                    const stored = localStorage.getItem("auth_user")
                    const storedUser = stored ? JSON.parse(stored) : {}
                    if (storedUser.bio) {
                      const oldBio = JSON.parse(storedUser.bio)
                      parsedCover = oldBio.coverImage || ""
                    }
                  } catch {}

                  const bioObj = {
                    bio: updated.bio,
                    experience: updated.experience,
                    expectedRates: updated.expectedRates,
                    storeName: user?.role === "seller" ? updated.storeName : undefined,
                    workerType: user?.role === "worker" ? updated.workerType : undefined,
                    coverImage: parsedCover || undefined,
                  }
                  const stringifiedBio = JSON.stringify(bioObj)

                  setProfile(updated)
                  try {
                    const stored = localStorage.getItem("auth_user")
                    const storedUser = stored ? JSON.parse(stored) : {}
                    const mergedUser = {
                      ...storedUser,
                      name: updated.name,
                      email: updated.email,
                      profession: resolvedProfession,
                      location: updated.location,
                      bio: stringifiedBio,
                      experience: updated.experience,
                      expectedRates: updated.expectedRates,
                      storeName: user?.role === "seller" ? updated.storeName : undefined,
                      workerType: user?.role === "worker" ? updated.workerType : undefined,
                      phone: updated.phone,
                      upiId: updated.upiId,
                      bankAccount: updated.bankAccount,
                      bankIfsc: updated.bankIfsc,
                    }
                    localStorage.setItem("auth_user", JSON.stringify(mergedUser))
                    
                    // Trigger auth-change so other components reload details
                    window.dispatchEvent(new Event("auth-change"))
                    
                    // Database Sync
                    if (storedUser.id) {
                      fetch("/api/users", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId: storedUser.id,
                          name: updated.name,
                          email: updated.email,
                          profession: resolvedProfession,
                          location: updated.location,
                          bio: stringifiedBio,
                          phone: updated.phone,
                          upiId: updated.upiId,
                          bankAccount: updated.bankAccount,
                          bankIfsc: updated.bankIfsc,
                        })
                      }).catch(console.error)
                    }
                  } catch {}
                  setIsEditProfileOpen(false)
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Post Modal */}
      {isAddPostOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setIsAddPostOpen(false)}>
          <div className="bg-card rounded-2xl w-full max-w-md shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-card-foreground">Create Post</h3>
              <button onClick={() => setIsAddPostOpen(false)} className="p-1 rounded-full hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Image picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-full rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors overflow-hidden",
                  postImage ? "border-solid border-primary/30" : "h-48 flex flex-col items-center justify-center gap-2"
                )}
              >
                {postImage ? (
                  <div className="relative">
                    <img src={postImage} alt="Preview" className="w-full max-h-64 object-cover" />
                    <button
                      onClick={e => { e.stopPropagation(); setPostImage("") }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Tap to add a photo</p>
                    <p className="text-xs text-muted-foreground/60">JPG, PNG, WEBP</p>
                  </>
                )}
              </div>

              {/* Description */}
              <textarea
                placeholder="Write a caption..."
                value={postDescription}
                onChange={e => setPostDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl bg-secondary border-0 px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Add tag (e.g. masonry)"
                      value={postTagInput}
                      onChange={e => setPostTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddTag() } }}
                      className="pl-8 h-9 text-sm bg-secondary border-0"
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={handleAddTag} className="h-9 px-3">Add</Button>
                </div>
                {postTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {postTags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
                        #{tag}
                        <button onClick={() => setPostTags(prev => prev.filter(t => t !== tag))}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Add location (e.g. Mumbai, Maharashtra)"
                  value={postLocation}
                  onChange={e => setPostLocation(e.target.value)}
                  className="pl-8 pr-16 h-9 text-sm bg-secondary border-0 flex-1"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await detectLocation()
                  }}
                  className="absolute right-3 text-xs font-semibold text-primary hover:underline"
                >
                  {userLocation?.status === "detecting" ? "Detecting..." : "Detect"}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 pb-4 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsAddPostOpen(false)}>Cancel</Button>
              <Button
                className="flex-1 rounded-xl"
                disabled={!postImage && !postDescription.trim()}
                onClick={handleSubmitPost}
              >
                Share Post
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  {((selectedPostIsOwn ? displayAvatar : selectedPost.user?.avatar) || "") ? (
                    <AvatarImage src={selectedPostIsOwn ? displayAvatar : (selectedPost.user?.avatar ?? displayAvatar)} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-sm">
                    {(selectedPostIsOwn ? profile.name : (selectedPost.user?.name ?? profile.name))[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-card-foreground">
                    {selectedPostIsOwn ? profile.name : (selectedPost.user?.name ?? profile.name)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPostIsOwn ? profile.profession : (selectedPost.user?.profession ?? profile.profession)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Delete icon — only for own feed posts (have 'images' array) */}
                {selectedPostIsOwn && 'images' in selectedPost && (
                  <button
                    onClick={() => { deletePost(selectedPost.id); setSelectedPost(null) }}
                    className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                    title="Delete post"
                  >
                    <Trash2 className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                  </button>
                )}
                <button onClick={() => setSelectedPost(null)} className="p-2 rounded-full hover:bg-secondary transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
            {/* Scrollable Content wrapper */}
            <div className="flex-1 overflow-y-auto">
              {/* Image */}
            <div className="aspect-square bg-muted overflow-hidden shrink-0">
              <img
                src={'images' in selectedPost ? selectedPost.images[0] : selectedPost.image}
                alt="Post"
                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=600&fit=crop" }}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Actions & Info */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    toggleLikePost(selectedPost.id)
                    setSelectedPost((prev: any) => prev ? {
                      ...prev,
                      isLiked: !prev.isLiked,
                      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1
                    } : null)
                  }}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Heart className={cn("w-5 h-5", selectedPost.isLiked && "fill-primary text-primary")} />
                  <span className="text-sm font-medium">{selectedPost.likes} likes</span>
                </button>

                <button 
                  onClick={() => setShowCommentInput(v => !v)}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{selectedPost.comments} comments</span>
                </button>

                <button 
                  onClick={() => {
                    toggleSavePost(selectedPost.id)
                    setSelectedPost((prev: any) => prev ? {
                      ...prev,
                      isSaved: !prev.isSaved
                    } : null)
                  }}
                  className="ml-auto flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                  title={selectedPost.isSaved ? "Unsave post" : "Save post"}
                >
                  <Bookmark className={cn("w-5 h-5", selectedPost.isSaved && "fill-primary text-primary")} />
                </button>
              </div>

              {showCommentInput && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Input
                    placeholder="Add a comment..."
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && newCommentText.trim()) {
                        addComment(selectedPost.id, newCommentText.trim())
                        setSelectedPost((prev: any) => prev ? {
                          ...prev,
                          comments: prev.comments + 1,
                          commentsList: [...(prev.commentsList || []), {
                            id: Date.now(),
                            userName: "You",
                            userAvatar: "",
                            text: newCommentText.trim(),
                            createdAt: new Date().toISOString()
                          }]
                        } : null)
                        setNewCommentText("")
                        setShowCommentInput(false)
                      }
                    }}
                    className="h-8 text-sm bg-muted border-0 flex-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (newCommentText.trim()) {
                        addComment(selectedPost.id, newCommentText.trim())
                        setSelectedPost((prev: any) => prev ? {
                          ...prev,
                          comments: prev.comments + 1,
                          commentsList: [...(prev.commentsList || []), {
                            id: Date.now(),
                            userName: "You",
                            userAvatar: "",
                            text: newCommentText.trim(),
                            createdAt: new Date().toISOString()
                          }]
                        } : null)
                        setNewCommentText("")
                        setShowCommentInput(false)
                      }
                    }}
                    className="h-8 px-3"
                  >
                    Post
                  </Button>
                </div>
              )}

              {'description' in selectedPost && selectedPost.description && (
                <p className="text-sm text-card-foreground font-medium">{selectedPost.description}</p>
              )}
              {'tags' in selectedPost && selectedPost.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPost.tags.map((tag: string) => (
                    <span key={tag} className="text-xs text-primary font-medium">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Comments List */}
              {selectedPost.commentsList && selectedPost.commentsList.length > 0 && (
                <div className="pt-3 border-t border-border space-y-2 max-h-48 overflow-y-auto">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Comments</p>
                  {selectedPost.commentsList.map((c: any) => (
                    <div key={c.id} className="flex items-start gap-2.5 text-xs text-left">
                      <Avatar className="w-6 h-6 shrink-0">
                        {c.userAvatar ? <AvatarImage src={c.userAvatar} /> : null}
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-[10px]">
                          {c.userName?.[0]?.toUpperCase() || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted p-2 rounded-xl flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-card-foreground">{c.userName}</p>
                          <p className="text-muted-foreground mt-0.5 break-words">{c.text}</p>
                        </div>
                        {(String(c.userName).toLowerCase() === "you" || String(c.userName).toLowerCase() === String(profile.name).toLowerCase()) && (
                          <button
                            onClick={() => {
                              deleteComment(selectedPost.id, c.id)
                              setSelectedPost((prev: any) => prev ? {
                                ...prev,
                                comments: Math.max(0, prev.comments - 1),
                                              commentsList: (prev.commentsList || []).filter((item: any) => item.id !== c.id)
                              } : null)
                            }}
                            className="text-muted-foreground hover:text-red-500 p-0.5 transition-colors shrink-0"
                            title="Delete Comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* View own story fullscreen */}
      {viewingStory && userStories.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setViewingStory(false)}>
          <div className="relative w-full max-w-[390px] h-full max-h-[100dvh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <img src={userStories[viewingStoryIdx].image} alt="Your story" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />
            {/* Header */}
            <div className="absolute top-8 left-3 right-3 flex items-center gap-3 z-10">
              <Avatar className="w-9 h-9 border-2 border-white shrink-0">
                {displayAvatar ? (
                  <AvatarImage src={displayAvatar} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-sm">
                  {profile.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">Your Story</p>
                <p className="text-white/60 text-xs">Just now</p>
              </div>
              <button onClick={() => setViewingStory(false)} className="p-2 rounded-full hover:bg-white/20">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            {/* Caption */}
            {userStories[viewingStoryIdx].caption && (
              <div className="absolute bottom-20 left-4 right-4 z-10 pointer-events-none">
                <p className="text-white text-sm font-medium drop-shadow">{userStories[viewingStoryIdx].caption}</p>
              </div>
            )}
            {/* Add another story */}
            <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-3">
              <button
                onClick={() => { setViewingStory(false); setIsAddStoryOpen(true) }}
                className="flex-1 flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full py-3 text-white text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add to Story
              </button>
              <button
                onClick={() => { deleteUserStory(viewingStoryIdx); setViewingStory(false) }}
                className="px-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full py-3 text-white text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </>, document.body
    )}
      {isAvatarMenuOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsAvatarMenuOpen(false)}>
          <div 
            className="bg-card border border-border p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-card-foreground">Profile Picture</h3>
              <p className="text-xs text-muted-foreground">Choose an action for your profile photo</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                className="w-full rounded-xl h-11 text-xs font-semibold gap-2"
                onClick={() => {
                  setIsAvatarMenuOpen(false)
                  avatarInputRef.current?.click()
                }}
              >
                <Camera className="w-4 h-4" />
                Upload New Photo
              </Button>
              
              {displayAvatar && (
                <Button 
                  variant="destructive"
                  className="w-full rounded-xl h-11 text-xs font-semibold gap-2 bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => {
                    setIsAvatarMenuOpen(false)
                    handleRemoveAvatar()
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Current Photo
                </Button>
              )}
              
              <Button 
                variant="ghost"
                className="w-full rounded-xl h-11 text-xs font-semibold"
                onClick={() => setIsAvatarMenuOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
