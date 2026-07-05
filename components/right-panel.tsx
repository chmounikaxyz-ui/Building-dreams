"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Search, Star, MapPin, BadgeCheck, X, Check, BriefcaseBusiness, Clock, MessageCircle } from "lucide-react"
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

  const currentUserId = user?.id || ""
  const currentUserName = user?.name || ""

  // Local storage notifications read state
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem(`read_notifications_${currentUserId}`) || "[]")
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (currentUserId) {
      try {
        const stored = localStorage.getItem(`read_notifications_${currentUserId}`)
        setReadNotifIds(stored ? JSON.parse(stored) : [])
      } catch {
        setReadNotifIds([])
      }
    }
  }, [currentUserId])

  const saveReadNotifIds = (next: string[]) => {
    setReadNotifIds(next)
    if (currentUserId) {
      try {
        localStorage.setItem(`read_notifications_${currentUserId}`, JSON.stringify(next))
      } catch {}
    }
  }

  // Dismissed (cleared) notifications — hidden permanently until new ID
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem(`dismissed_notifications_${currentUserId}`) || "[]")
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (currentUserId) {
      try {
        const stored = localStorage.getItem(`dismissed_notifications_${currentUserId}`)
        setDismissedNotifIds(stored ? JSON.parse(stored) : [])
      } catch {
        setDismissedNotifIds([])
      }
    }
  }, [currentUserId])

  const saveDismissedNotifIds = (next: string[]) => {
    setDismissedNotifIds(next)
    if (currentUserId) {
      try {
        localStorage.setItem(`dismissed_notifications_${currentUserId}`, JSON.stringify(next))
      } catch {}
    }
  }

  // Derive notifications dynamically from real database updates
  const messageNotifs = conversations
    .filter(c => c.unread > 0)
    .map(c => ({
      id: `msg_${c.id}_${c.unread}`,
      text: `New message from ${c.name}: "${c.lastMessage}"`,
      time: c.timestamp || "Just now",
      avatar: c.avatar
    }))

  const workerNotifs = hireRequests
    .filter(r => r.workerName === currentUserName && r.status === "Pending")
    .map(r => ({
      id: `hire_pending_${r.id}`,
      text: `${r.explorerName} requested to hire you for "${r.jobTitle}"`,
      time: r.date || "Just now",
      avatar: r.explorerAvatar
    }))

  const explorerNotifs = hireRequests
    .filter(r => r.explorerName === currentUserName && (r.status === "Accepted" || r.status === "Rejected"))
    .map(r => ({
      id: `hire_status_${r.id}_${r.status}`,
      text: `${r.workerName} ${r.status.toLowerCase()} your hire request`,
      time: r.date || "Just now",
      avatar: r.workerAvatar
    }))

  const sellerNotifs = [
    ...sellerOrders.filter(o => o.status === "Pending").map(o => ({
      id: `order_${o.id}`,
      text: `New order from ${o.buyerName} for ${o.productName}`,
      time: o.date || "Just now",
      avatar: ""
    })),
    ...sellerPreOrders.filter(p => p.status === "Pending").map(p => ({
      id: `preorder_${p.id}`,
      text: `New pre-order from ${p.buyerName} for ${p.productName}`,
      time: p.date || "Just now",
      avatar: ""
    }))
  ]

  // Add default mock items at the bottom if needed, but filter them with static string IDs
  const mockNotifs = [
    { id: "mock_1", text: "Ramesh Kumar accepted your booking request", time: "2 min ago", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
    { id: "mock_2", text: "Priya Sharma liked your post", time: "15 min ago", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
    { id: "mock_3", text: "New message from Suresh Patel", time: "1 hr ago", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" }
  ]

  const rawNotifs = [
    ...messageNotifs,
    ...workerNotifs,
    ...explorerNotifs,
    ...sellerNotifs,
    ...mockNotifs
  ].filter(n => !dismissedNotifIds.includes(n.id))

  const notifList = rawNotifs.map(n => ({
    ...n,
    read: readNotifIds.includes(n.id)
  }))

  const unreadCount = notifList.filter(n => !n.read).length

  const clearAllNotifs = () => {
    const allIds = rawNotifs.map(n => String(n.id))
    saveDismissedNotifIds([...new Set([...dismissedNotifIds, ...allIds])])
    // Also mark as read
    saveReadNotifIds([...new Set([...readNotifIds, ...allIds])])
    setShowNotifications(false)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
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
    const allIds = notifList.map(n => String(n.id))
    saveReadNotifIds([...new Set([...readNotifIds, ...allIds])])
  }
  const markRead = (id: string | number) => {
    const strId = String(id)
    if (!readNotifIds.includes(strId)) {
      saveReadNotifIds([...readNotifIds, strId])
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
        <div className="relative flex shrink-0" ref={notifRef}>
          <button 
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative" 
            onClick={() => setShowNotifications(v => !v)}
          >
            <Bell className={cn("w-5 h-5", showNotifications && "text-primary")} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
          </button>
          
          {/* Notifications Panel */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-72 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-30">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                <h3 className="font-semibold text-sm text-card-foreground">Notifications</h3>
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border bg-card">
                {notifList.map(n => (
                  <div key={n.id} onClick={() => markRead(n.id)} className={cn("flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors bg-card", !n.read && "bg-primary/5")}>
                    {n.avatar ? <Avatar className="w-8 h-8 shrink-0"><AvatarImage src={n.avatar} /><AvatarFallback>N</AvatarFallback></Avatar> : <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><BriefcaseBusiness className="w-4 h-4 text-primary" /></div>}
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs leading-snug", !n.read ? "text-card-foreground font-medium" : "text-muted-foreground")}>{n.text}</p>
                      <div className="flex items-center gap-1 mt-1"><Clock className="w-3 h-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">{n.time}</span></div>
                    </div>
                    {!n.read && <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />}
                  </div>
                ))}
              </div>
            </div>
          )}
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
    </aside>
  )
}

