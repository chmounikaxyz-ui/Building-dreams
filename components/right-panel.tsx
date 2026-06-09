"use client"

import { useState } from "react"
import { Bell, Search, Star, MapPin, BadgeCheck, X, Check, BriefcaseBusiness, Clock, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { WorkerProfileModal } from "@/components/worker-profile-modal"
import { useApp } from "@/context/app-context"

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

const notifications = [
  { id: 1, text: "Ramesh Kumar accepted your booking request", time: "2 min ago", read: false, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
  { id: 2, text: "Priya Sharma liked your post", time: "15 min ago", read: false, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
  { id: 3, text: "New message from Suresh Patel", time: "1 hr ago", read: false, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face" },
  { id: 4, text: "Your project estimate is ready", time: "3 hr ago", read: true, avatar: null },
  { id: 5, text: "Amit Verma is available near you", time: "5 hr ago", read: true, avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face" },
]

const indianCities = [
  "Mumbai, Maharashtra", "Delhi, NCR", "Bangalore, Karnataka",
  "Hyderabad, Telangana", "Chennai, Tamil Nadu", "Pune, Maharashtra",
  "Ahmedabad, Gujarat", "Kolkata, West Bengal", "Jaipur, Rajasthan", "Surat, Gujarat",
]

export function RightPanel({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { setSelectedConversation, conversations, setConversations, followingIds, followingList, toggleFollow: contextToggleFollow } = useApp()
  const [searchQuery, setSearchQuery] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifList, setNotifList] = useState(notifications)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [location, setLocation] = useState("Mumbai, Maharashtra")
  const [locationSearch, setLocationSearch] = useState("")
  const [isDetecting, setIsDetecting] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<typeof allProfessionals[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const unreadCount = notifList.filter(n => !n.read).length

  const toggleFollow = (pro: typeof allProfessionals[0]) => {
    contextToggleFollow(pro.id, pro.name, pro.profession, pro.avatar)
  }

  const openProfile = (pro: typeof allProfessionals[0]) => {
    setSelectedWorker(pro)
    setIsModalOpen(true)
  }

  const handleMessage = async () => {
    if (!selectedWorker) return

    // Create or get conversation in DB
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored && selectedWorker.id) {
        const currentUser = JSON.parse(stored)
        if (currentUser.id) {
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id, otherUserId: String(selectedWorker.id) })
          })
        }
      }
    } catch (err) {
      console.error("Failed to create conversation in DB:", err)
    }

    // Find existing conversation or create new one
    const existing = conversations.find(c => c.name === selectedWorker.name)
    if (existing) {
      setSelectedConversation(existing)
    } else {
      // Create a new conversation
      const newConv = {
        id: newConvId(),
        name: selectedWorker.name,
        profession: selectedWorker.profession,
        avatar: selectedWorker.avatar,
        lastMessage: "Start a conversation",
        timestamp: "Just now",
        unread: 0,
        isOnline: true,
        messages: [],
      }
      setConversations(prev => [newConv, ...prev])
      setSelectedConversation(newConv)
    }
    setIsModalOpen(false)
    setActiveTab?.("messages")
  }

  const handleFollowingClick = (person: typeof initialFollowing[0]) => {
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

  const markAllRead = () => setNotifList(prev => prev.map(n => ({ ...n, read: true })))
  const markRead = (id: number) => setNotifList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const detectLocation = () => {
    setIsDetecting(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => { setTimeout(() => { setLocation("Current Location"); setIsDetecting(false); setShowLocationPicker(false) }, 1000) },
        () => { setIsDetecting(false); alert("Location access denied.") }
      )
    } else setIsDetecting(false)
  }

  const filteredCities = indianCities.filter(c => c.toLowerCase().includes(locationSearch.toLowerCase()))
  const filteredProfessionals = searchQuery.trim()
    ? allProfessionals.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.profession.toLowerCase().includes(searchQuery.toLowerCase()))
    : allProfessionals.slice(0, 3)

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
        <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(v => !v)}>
          <Bell className={cn("w-5 h-5", showNotifications && "text-primary")} />
          {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
        </Button>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm text-card-foreground">Notifications</h3>
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-border">
            {notifList.map(n => (
              <div key={n.id} onClick={() => markRead(n.id)} className={cn("flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors", !n.read && "bg-primary/5")}>
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

      {/* Location */}
      <div className="bg-secondary rounded-xl p-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium text-secondary-foreground truncate flex-1">{location}</span>
          <Button variant="link" size="sm" className="ml-auto text-primary p-0 h-auto shrink-0" onClick={() => setShowLocationPicker(v => !v)}>Change</Button>
        </div>
      </div>

      {/* Location Picker */}
      {showLocationPicker && (
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden -mt-4">
          <div className="p-3 border-b border-border">
            <Input placeholder="Search city..." value={locationSearch} onChange={e => setLocationSearch(e.target.value)} className="h-8 text-sm bg-secondary border-0" autoFocus />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button onClick={detectLocation} disabled={isDetecting} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors text-left border-b border-border">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-primary">{isDetecting ? "Detecting..." : "Use current location"}</span>
            </button>
            {filteredCities.map(city => (
              <button key={city} onClick={() => { setLocation(city); setShowLocationPicker(false); setLocationSearch("") }} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary transition-colors text-left">
                <span className="text-sm text-card-foreground">{city}</span>
                {location === city && <Check className="w-4 h-4 text-primary" />}
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
                  <span className="text-xs text-muted-foreground">{pro.location}</span>
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

