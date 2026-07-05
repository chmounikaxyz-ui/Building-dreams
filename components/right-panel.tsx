"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, Search, Star, MapPin, BadgeCheck, X, Check, BriefcaseBusiness, Clock, MessageCircle, Trash2 } from "lucide-react"
import { haversineKm, formatDistance } from "@/lib/location"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { WorkerProfileModal } from "@/components/worker-profile-modal"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"

let convIdCounter = 1000

function newConvId() { return ++convIdCounter }

const allProfessionals = [
  { id: 101, name: "Amit Verma", profession: "Electrician", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face", rating: 4.8, verified: true, location: "2.3 km away", experience: "8 Years Exp", bio: "Expert electrician for residential and commercial projects.", skills: ["Wiring", "Panel Work", "Lighting"], coverImage: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&h=400&fit=crop", projectsCount: 89, upiId: "amitverma@upi", bankAccount: "98765432101", bankIfsc: "HDFC0001234" },
  { id: 102, name: "Raj Malhotra", profession: "Plumber", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face", rating: 4.6, verified: true, location: "3.1 km away", experience: "10 Years Exp", bio: "Reliable plumber for all types of plumbing needs.", skills: ["Pipe Fitting", "Leak Repair", "Drainage"], coverImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=400&fit=crop", projectsCount: 112, upiId: "rajplumber@upi", bankAccount: "76543210987", bankIfsc: "ICIC0005678" },
  { id: 103, name: "Meera Joshi", profession: "Architect", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", rating: 4.9, verified: true, location: "5.4 km away", experience: "12 Years Exp", bio: "Creative architect specializing in modern residential design.", skills: ["Design", "3D Modeling", "Planning"], coverImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=400&fit=crop", projectsCount: 67, upiId: "meerajoshi@upi", bankAccount: "43210987654", bankIfsc: "PUNB0006789" },
  { id: 104, name: "Vikram Nair", profession: "Civil Engineer", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", rating: 4.7, verified: true, location: "4.2 km away", experience: "15 Years Exp", bio: "Structural engineer with expertise in large-scale projects.", skills: ["Structural Design", "Site Management", "QC"], coverImage: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=400&fit=crop", projectsCount: 203, upiId: "vikramnair@upi", bankAccount: "54321098765", bankIfsc: "CNRB0002345" },
  { id: 105, name: "Sunita Rao", profession: "Interior Designer", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", rating: 4.8, verified: false, location: "6.1 km away", experience: "7 Years Exp", bio: "Transforming spaces with elegant and functional designs.", skills: ["Space Planning", "Color Theory", "Furniture"], coverImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=400&fit=crop", projectsCount: 54, upiId: "sunitarao@upi", bankAccount: "65432109876", bankIfsc: "BARB0BOMBAI" },
  { id: 106, name: "Deepak Sharma", profession: "Mason", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", rating: 4.5, verified: true, location: "1.8 km away", experience: "20 Years Exp", bio: "Master mason with expertise in brick and stone work.", skills: ["Brick Work", "Stone Masonry", "Plastering"], coverImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=400&fit=crop", projectsCount: 178, upiId: "deepakmason@upi", bankAccount: "87654321098", bankIfsc: "SBIN0007890" },
]

const initialFollowing = [
  { id: 201, name: "Ramesh Kumar", profession: "Mason", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", isOnline: true },
  { id: 202, name: "Suresh Patel", profession: "Carpenter", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face", isOnline: true },
  { id: 203, name: "Gauresh Singh", profession: "Engineer", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", isOnline: false },
]



const indianCities = [
  "Mumbai, Maharashtra", "Delhi, NCR", "Bangalore, Karnataka",
  "Hyderabad, Telangana", "Chennai, Tamil Nadu", "Pune, Maharashtra",
  "Ahmedabad, Gujarat", "Kolkata, West Bengal", "Jaipur, Rajasthan", "Surat, Gujarat",
]

export function RightPanel({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { 
    setSelectedConversation, 
    conversations, 
    setConversations, 
    followingIds, 
    followingList, 
    toggleFollow: contextToggleFollow, 
    userLocation, 
    detectLocation: contextDetectLocation, 
    setUserLocation,
    hireRequests,
    sellerOrders,
    sellerPreOrders
  } = useApp()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [locationSearch, setLocationSearch] = useState("")
  const [isDetecting, setIsDetecting] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [dbWorkers, setDbWorkers] = useState<any[]>([])
  const notifRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)
  const [notifPos, setNotifPos] = useState<{ top: number; right: number } | null>(null)

  const currentUserId = user?.id || ""
  const currentUserName = user?.name || ""

  const [dbNotifications, setDbNotifications] = useState<any[]>([])

  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) {
      console.log("[Notifications Debug] currentUserId is empty");
      return
    }
    try {
      console.log(`[Notifications Debug] Fetching notifications for userId: ${currentUserId}`);
      const res = await fetch(`/api/notifications?userId=${currentUserId}`)
      console.log(`[Notifications Debug] Response status: ${res.status}`);
      if (res.ok) {
        const data = await res.json()
        console.log("[Notifications Debug] Received notifications:", data);
        setDbNotifications(data)
      } else {
        console.error("[Notifications Debug] API error:", await res.text());
      }
    } catch (err) {
      console.error("[Notifications Debug] Fetch failed:", err)
    }
  }, [currentUserId])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 5000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const notifList = dbNotifications.map(n => {
    let timeStr = "Just now"
    if (n.createdAt) {
      try {
        const diff = Date.now() - new Date(n.createdAt).getTime()
        const mins = Math.floor(diff / 60000)
        const hrs = Math.floor(mins / 60)
        const days = Math.floor(hrs / 24)
        if (mins < 1) timeStr = "Just now"
        else if (mins < 60) timeStr = `${mins} min ago`
        else if (hrs < 24) timeStr = `${hrs} hr ago`
        else timeStr = `${days} days ago`
      } catch {}
    }
    return {
      id: n.id,
      text: n.text,
      time: timeStr,
      avatar: n.sender?.avatar || "",
      read: n.read,
      type: n.type,
      postId: n.postId,
      conversationId: n.conversationId
    }
  })

  const unreadCount = notifList.filter(n => !n.read).length

  const clearAllNotifs = async () => {
    setDbNotifications([])
    setShowNotifications(false)
    try {
      await fetch(`/api/notifications?userId=${currentUserId}`, {
        method: "DELETE"
      })
    } catch (err) {
      console.error("Failed to clear all notifications:", err)
    }
  }

  const dismissNotif = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDbNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE"
      })
    } catch (err) {
      console.error("Failed to delete notification:", err)
    }
  }

  const openNotifications = useCallback(() => {
    if (!showNotifications && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect()
      setNotifPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
      
      if (currentUserId && notifList.some(n => !n.read)) {
        setDbNotifications(prev => prev.map(n => ({ ...n, read: true })))
        fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId })
        }).catch(err => console.error("Failed to mark all as read:", err))
      }
    }
    setShowNotifications(v => !v)
  }, [showNotifications, currentUserId, notifList])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        notifRef.current && !notifRef.current.contains(e.target as Node) &&
        bellRef.current && !bellRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch("/api/users")
        if (res.ok) {
          const data = await res.json()
          const workers = data.filter((u: any) => u.role === "worker")
          const parsed = workers.map((w: any) => {
            let parsedBioText = w.bio || ""
            let parsedExperience = ""
            let parsedExpectedRates = ""
            let parsedWorkerType = "normal"
            let parsedCoverImage = ""
            let parsedAvailable = true
            let parsedReviewsCount = 0

            if (w.bio) {
              try {
                if (w.bio.trim().startsWith("{") && w.bio.trim().endsWith("}")) {
                  const p = JSON.parse(w.bio)
                  parsedBioText = p.bio || ""
                  parsedExperience = p.experience || ""
                  parsedWorkerType = p.workerType || "normal"
                  parsedCoverImage = p.coverImage || ""
                  if (p.expectedRates?.trim()) parsedExpectedRates = p.expectedRates
                  if (p.available !== undefined) parsedAvailable = p.available
                  if (p.reviewsCount !== undefined) parsedReviewsCount = Number(p.reviewsCount)
                }
              } catch {}
            }

            return {
              id: w.id,
              name: w.name,
              profession: w.profession || "Worker",
              avatar: w.avatar || "",
              coverImage: parsedCoverImage,
              rating: w.rating || 0,
              reviewsCount: parsedReviewsCount || (w.rating > 0 ? 1 : 0),
              verified: w.verified || false,
              location: w.location || "Mumbai, India",
              lat: w.lat || 19.0760,
              lon: w.lon || 72.8777,
              experience: parsedExperience || "Experienced",
              rate: parsedExpectedRates,
              skills: w.profession ? [w.profession] : ["Masonry"],
              available: parsedAvailable,
              bio: parsedBioText || "No bio provided.",
              upiId: w.upiId || "",
              bankAccount: w.bankAccount || "",
              bankIfsc: w.bankIfsc || "",
              workerType: parsedWorkerType,
            }
          }).filter((p: any) => p.workerType !== "emergency")
          setDbWorkers(parsed)
        }
      } catch (err) {
        console.error("Failed to fetch professionals in RightPanel:", err)
      }
    }
    fetchWorkers()
  }, [])

  const workersWithDistance = dbWorkers.map(pro => {
    let distance = pro.location
    let _km = Infinity
    if (userLocation?.status === "success" && pro.lat && pro.lon) {
      const km = haversineKm(userLocation.lat, userLocation.lon, pro.lat, pro.lon)
      const distStr = formatDistance(km)
      distance = distStr ? `${distStr} away` : ""
      _km = km
    }
    return { ...pro, distance, _km }
  })

  const activeWorkers = dbWorkers.length > 0 ? workersWithDistance : allProfessionals.map(p => ({ ...p, _km: Infinity }))

  const toggleFollow = (pro: any) => {
    contextToggleFollow(pro.id, pro.name, pro.profession, pro.avatar)
  }

  const openProfile = (pro: any) => {
    setSelectedWorker(pro)
    setIsModalOpen(true)
  }

  const handleMessage = async () => {
    if (!selectedWorker) return
    setIsModalOpen(false)
    localStorage.setItem("active_chat_other_user_id", String(selectedWorker.id))
    setActiveTab?.("messages")
  }

  const handleFollowingClick = (person: { id: string | number; name: string; profession: string; avatar: string; isOnline: boolean }) => {
    const conv = conversations.find(c => c.name === person.name)
    if (conv) {
      setSelectedConversation(conv)
    } else {
      const newConv = {
        id: newConvId(),
        name: person.name,
        profession: person.profession,
        avatar: person.avatar,
        lastMessage: "Start a conversation",
        timestamp: "Just now",
        unread: 0,
        isOnline: person.isOnline,
        messages: [],
      }
      setConversations(prev => [newConv, ...prev])
      setSelectedConversation(newConv)
    }
    setActiveTab?.("messages")
  }

  const markAllRead = () => {
    setDbNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (currentUserId) {
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId })
      }).catch(err => console.error("Failed to mark all as read:", err))
    }
  }

  const markRead = async (id: string | number) => {
    setDbNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }

  const detectLocation = async () => {
    setIsDetecting(true)
    setLocationError(null)
    try {
      await contextDetectLocation()
      setShowLocationPicker(false)
    } catch (err) {
      setLocationError("Location access denied or failed.")
    } finally {
      setIsDetecting(false)
    }
  }

  const handleCitySelect = async (city: string) => {
    setShowLocationPicker(false)
    setLocationSearch("")
    setLocationError(null)
    
    const cityCoords: Record<string, { lat: number; lon: number }> = {
      "Mumbai, Maharashtra": { lat: 19.0760, lon: 72.8777 },
      "Delhi, NCR": { lat: 28.7041, lon: 77.1025 },
      "Bangalore, Karnataka": { lat: 12.9716, lon: 77.5946 },
      "Hyderabad, Telangana": { lat: 17.3850, lon: 78.4867 },
      "Chennai, Tamil Nadu": { lat: 13.0827, lon: 80.2707 },
      "Pune, Maharashtra": { lat: 18.5204, lon: 73.8567 },
      "Ahmedabad, Gujarat": { lat: 23.0225, lon: 72.5714 },
      "Kolkata, West Bengal": { lat: 22.5726, lon: 88.3639 },
      "Jaipur, Rajasthan": { lat: 26.9124, lon: 75.7873 },
      "Surat, Gujarat": { lat: 21.1702, lon: 72.8311 }
    }
    
    const coords = cityCoords[city]
    if (coords) {
      setUserLocation({
        lat: coords.lat,
        lon: coords.lon,
        city,
        status: "success"
      })
    } else {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`)
        if (res.ok) {
          const data = await res.json()
          if (data && data[0]) {
            setUserLocation({
              lat: parseFloat(data[0].lat),
              lon: parseFloat(data[0].lon),
              city: data[0].display_name.split(",")[0] + ", " + (data[0].display_name.split(",")[1] || "").trim(),
              status: "success"
            })
          } else {
            setLocationError("Location coordinates not found.")
          }
        } else {
          setLocationError("Error searching location coordinates.")
        }
      } catch (err) {
        console.error(err)
        setLocationError("Network connection error.")
      }
    }
  }

  const filteredCities = indianCities.filter(c => c.toLowerCase().includes(locationSearch.toLowerCase()))
  const filteredProfessionals = searchQuery.trim()
    ? activeWorkers.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.profession.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeWorkers.slice(0, 3)

  const workerForModal = selectedWorker ? {
    id: selectedWorker.id,
    name: selectedWorker.name,
    profession: selectedWorker.profession,
    avatar: selectedWorker.avatar,
    coverImage: selectedWorker.coverImage,
    verified: selectedWorker.verified,
    location: selectedWorker.location,
    experience: selectedWorker.experience,
    rating: selectedWorker.rating,
    projectsCount: selectedWorker.projectsCount,
    bio: selectedWorker.bio,
    skills: selectedWorker.skills,
    upiId: selectedWorker.upiId,
    bankAccount: selectedWorker.bankAccount,
    bankIfsc: selectedWorker.bankIfsc,
    rate: (selectedWorker as any).rate || (selectedWorker as any).expectedRates,
    gallery: [selectedWorker.coverImage, "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=300&fit=crop", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop"],
  } : null

  return (
    <aside className="w-80 bg-card border-l border-border p-4 space-y-6 overflow-y-auto h-full relative">

      {/* Search and Notifications */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search professionals..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-secondary border-0 rounded-xl" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
        </div>
        <div className="relative flex shrink-0">
          <button 
            ref={bellRef}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative" 
            onClick={openNotifications}
          >
            <Bell className={cn("w-5 h-5", showNotifications && "text-primary")} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Location */}
      <div className="bg-secondary rounded-xl p-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium text-secondary-foreground truncate flex-1">{userLocation?.city || "Mumbai, Maharashtra"}</span>
          <Button variant="link" size="sm" className="ml-auto text-primary p-0 h-auto shrink-0" onClick={() => setShowLocationPicker(v => !v)}>Change</Button>
        </div>
      </div>

      {/* Location Picker */}
      {showLocationPicker && (
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden -mt-4">
          <div className="p-3 border-b border-border">
            <Input placeholder="Search city..." value={locationSearch} onChange={e => {
              setLocationSearch(e.target.value)
              if (locationError) setLocationError(null)
            }} className="h-8 text-sm bg-secondary border-0" autoFocus />
          </div>
          {locationError && (
            <div className="text-[10px] text-red-500 font-medium px-4 py-2 bg-red-50 dark:bg-red-950/20 border-b border-border">
              ⚠️ {locationError}
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            <button onClick={() => {
              detectLocation()
              setLocationError(null)
            }} disabled={isDetecting} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors text-left border-b border-border">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-primary">{isDetecting ? "Detecting..." : "Use current location"}</span>
            </button>
            {filteredCities.map(city => (
              <button key={city} onClick={() => handleCitySelect(city)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary transition-colors text-left">
                <span className="text-sm text-card-foreground">{city}</span>
                {(userLocation?.city || "Mumbai, Maharashtra") === city && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested for you */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{searchQuery ? `Results for "${searchQuery}"` : "Suggested for you"}</h3>
          {!searchQuery && <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={() => setActiveTab?.("explore")}>See all</Button>}
        </div>
        {filteredProfessionals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No professionals found</p>
        ) : (
          <div className="space-y-3">
            {filteredProfessionals.map(pro => (
              <div key={pro.id} className="flex items-center gap-3">
                {/* Avatar — opens profile */}
                <button onClick={() => openProfile(pro)}>
                  <Avatar className="w-10 h-10 hover:opacity-80 transition-opacity">
                    {pro.avatar ? (
                      <AvatarImage src={pro.avatar} alt={pro.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-sm">
                      {pro.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
                {/* Name — opens profile */}
                <button className="flex-1 min-w-0 text-left" onClick={() => openProfile(pro)}>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm text-card-foreground truncate hover:underline">{pro.name}</span>
                    {pro.verified && <BadgeCheck className="w-3.5 h-3.5 text-primary fill-primary/20 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{pro.profession}</span><span>•</span>
                    <div className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-primary text-primary" /><span>{pro.rating}</span></div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {pro.distance && pro.distance !== "0 m away" && pro.distance !== "0m away" && pro.distance !== "away"
                      ? pro.distance
                      : pro.location}
                  </span>
                </button>
                <Button size="sm" variant={followingIds.includes(pro.id) ? "secondary" : "outline"} className="rounded-full h-8 text-xs shrink-0" onClick={() => toggleFollow(pro)}>
                  {followingIds.includes(pro.id) ? "Following" : "Follow"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Following */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Following</h3>
          <span className="text-xs text-muted-foreground">{followingList.length} workers</span>
        </div>
        <div className="space-y-2">
          {followingList.map(person => (
            <div key={person.id} onClick={() => handleFollowingClick(person)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary transition-colors cursor-pointer group">
              <div className="relative shrink-0">
                <Avatar className="w-10 h-10">
                  {person.avatar ? (
                    <AvatarImage src={person.avatar} alt={person.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-sm">
                    {person.name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {person.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-card-foreground truncate">{person.name}</p>
                <p className="text-xs text-muted-foreground">{person.profession}</p>
              </div>
              <MessageCircle className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Worker Profile Modal */}
      <WorkerProfileModal
        worker={workerForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMessage={handleMessage}
        onHire={() => setIsModalOpen(false)}
      />

      {/* Notifications Panel — rendered outside aside to avoid overflow clipping */}
      {showNotifications && notifPos && (
        <div
          ref={notifRef}
          style={{ position: "fixed", top: notifPos.top, right: notifPos.right, zIndex: 9999 }}
          className="w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-card-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifList.length > 0 && (
                <button
                  onClick={clearAllNotifs}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear all</span>
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
                <p className="text-xs text-muted-foreground/60 mt-1">No new notifications</p>
              </div>
            ) : (
              notifList.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors group",
                    !n.read && "bg-primary/5"
                  )}
                >
                  {n.avatar
                    ? <Avatar className="w-8 h-8 shrink-0"><AvatarImage src={n.avatar} /><AvatarFallback>N</AvatarFallback></Avatar>
                    : <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><BriefcaseBusiness className="w-4 h-4 text-primary" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs leading-snug", !n.read ? "text-card-foreground font-medium" : "text-muted-foreground")}>
                      {n.text}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{n.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && <span className="w-2 h-2 bg-primary rounded-full mt-1" />}
                    <button
                      onClick={(e) => dismissNotif(n.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-secondary ml-1"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

