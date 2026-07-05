"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Star, BadgeCheck, Sliders, UserCheck, Clock, ClipboardCheck, Calendar, Briefcase, ShoppingBag, Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { haversineKm, formatDistance } from "@/lib/location"
import { WorkerProfileModal, type HiredJob } from "@/components/worker-profile-modal"
import { useApp } from "@/context/app-context"

let convIdCounter = 3000
function newConvId() { return ++convIdCounter }

const categories = [
  { id: "all", label: "All" },
  { id: "mason", label: "Mason" },
  { id: "carpenter", label: "Carpenter" },
  { id: "electrician", label: "Electrician" },
  { id: "architect", label: "Architect" },
  { id: "engineer", label: "Engineer" },
  { id: "painter", label: "Painter" },
  { id: "labor", label: "Labor" },
  { id: "other", label: "Other" },
]

const placeholderAvatar = "/placeholder-user.jpg"
const placeholderCover = "/placeholders/cover-1.svg"

interface Professional {
  workerType: any
  id: string | number
  name: string
  profession: string
  avatar: string
  coverImage: string
  rating: number
  reviewsCount: number
  verified: boolean
  location: string
  lat: number
  lon: number
  distance: string   // computed dynamically, fallback static
  experience: string
  rate: string
  skills: string[]
  available: boolean
  bio: string
  upiId?: string
  bankAccount?: string
  bankIfsc?: string
}

export function ExplorePage({ setActiveTab, userRole = "explorer" }: { setActiveTab?: (tab: string) => void; userRole?: string }) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filterAvailable, setFilterAvailable] = useState(false)
  const [filterMinRating, setFilterMinRating] = useState(0)
  const [filterVerified, setFilterVerified] = useState(false)
  const [filterMaxKm, setFilterMaxKm] = useState<number>(0) // 0 = no limit
  const [manualLocationInput, setManualLocationInput] = useState("")
  const [searchingLocation, setSearchingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [exploreLocation, setExploreLocation] = useState<any>(null)

  const [professionals, setProfessionals] = useState<Professional[]>([])

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await fetch("/api/users")
        if (res.ok) {
          const data = await res.json()
          const workers = data.filter((u: any) => u.role === "worker")
          const normalWorkers = workers.map((w: any) => {
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
                  if (p.expectedRates?.trim()) {
                    parsedExpectedRates = p.expectedRates
                  }
                  if (p.available !== undefined) {
                    parsedAvailable = p.available
                  }
                  if (p.reviewsCount !== undefined) {
                    parsedReviewsCount = Number(p.reviewsCount)
                  }
                }
              } catch { }
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
              distance: "—",
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

          setProfessionals(normalWorkers)
        }
      } catch (err) {
        console.error("Failed to fetch professionals:", err)
      }
    }
    fetchWorkers()
  }, [])

  const { setSelectedConversation, setConversations, conversations, userLocation, detectLocation, setUserLocation, hireRequests, setHireRequests, updateHireRequest } = useApp()

  const handleManualLocationSearch = async () => {
    if (!manualLocationInput.trim()) return
    setSearchingLocation(true)
    setLocationError(null)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualLocationInput)}&format=json&limit=1`)
      if (res.ok) {
        const data = await res.json()
        if (data && data[0]) {
          const lat = parseFloat(data[0].lat)
          const lon = parseFloat(data[0].lon)
          const displayName = data[0].display_name.split(",")[0] + ", " + (data[0].display_name.split(",")[1] || "").trim()
          
          setExploreLocation({
            lat,
            lon,
            city: displayName,
            status: "success"
          })
          setManualLocationInput("")
        } else {
          setLocationError("Location not found. Please try a different city or area.")
        }
      } else {
        setLocationError("Error searching location. Please try again.")
      }
    } catch (err) {
      console.error("Manual location search error:", err)
      setLocationError("Connection error. Please check your internet.")
    } finally {
      setSearchingLocation(false)
    }
  }

  // Get explorer info for hire requests
  const explorerInfo = (() => {
    try { return JSON.parse(localStorage.getItem("auth_user") || "{}") } catch { return {} }
  })()

  // Hired jobs state
  const [hiredJobs, setHiredJobs] = useState<HiredJob[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("hired_jobs") || "[]")
      } catch {
        return []
      }
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem("hired_jobs", JSON.stringify(hiredJobs))
  }, [hiredJobs])

  // Automatically log accepted requests as active jobs in hiredJobs
  useEffect(() => {
    if (professionals.length === 0) return
    const myAcceptedRequests = hireRequests.filter(
      r => r.explorerName === explorerInfo.name && r.status === "Accepted" && r.location !== "Emergency"
    )

    let updated = false
    const nextHiredJobs = [...hiredJobs]

    myAcceptedRequests.forEach(req => {
      const pro = professionals.find(p => p.name === req.workerName)
      const workerId = pro ? pro.id : req.id
      const workerName = pro ? pro.name : req.workerName
      const workerProfession = pro ? pro.profession : req.workerProfession
      const workerAvatar = pro ? pro.avatar : req.workerAvatar

      const alreadyLogged = nextHiredJobs.some(
        j => j.requestId === req.id || (j.workerName === req.workerName && j.startDate === req.startDate)
      )

      if (!alreadyLogged) {
        nextHiredJobs.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000),
          workerId,
          workerName,
          workerProfession,
          workerAvatar: workerAvatar || "",
          startDate: req.startDate,
          status: "Active",
          ratings: null,
          review: null,
          requestId: req.id
        })
        updated = true
      }
    })

    if (updated) {
      setHiredJobs(nextHiredJobs)
    }
  }, [hireRequests, hiredJobs, professionals, explorerInfo.name])

  // Compute real distances and dynamic ratings when user location is available
  const professionalsWithDistance = professionals.map(pro => {
    const ratedJobs = hiredJobs.filter(j => (String(j.workerId) === String(pro.id) || j.workerName === pro.name) && j.status === "Completed" && j.ratings)
    const reviewsCount = ratedJobs.length
    const rating = reviewsCount > 0
      ? Math.round((ratedJobs.reduce((sum, job) => {
        const r = job.ratings!
        return sum + (r.functionality + r.behavior + r.communication + r.speed + r.responsiveness) / 5
      }, 0) / reviewsCount) * 10) / 10
      : (pro.rating || 0)

    let distance = "—"
    let _km = Infinity
    const activeLoc = exploreLocation || userLocation
    if (activeLoc?.status === "success" || (activeLoc?.lat && activeLoc?.lon)) {
      const km = haversineKm(activeLoc.lat, activeLoc.lon, pro.lat, pro.lon)
      distance = formatDistance(km)
      _km = km
    }

    return {
      ...pro,
      rating: reviewsCount > 0 ? rating : (pro.rating || 0),
      reviewsCount: Math.max(reviewsCount, pro.reviewsCount || 0) || (pro.rating > 0 ? 1 : 0),
      distance: distance,
      _km
    }
  }).sort((a, b) => a._km - b._km) // sort by distance when GPS available
  const [showJobsPanel, setShowJobsPanel] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<"orders" | "pre-orders">("orders")
  const [clearConfirm, setClearConfirm] = useState(false)

  const handleMarkHired = (job: Omit<HiredJob, "id">) => {
    // Called after worker accepts and explorer confirms — log locally
    setHiredJobs(prev => [{ ...job, id: Date.now() }, ...prev])
  }

  const handleCompleteJob = (jobId: string | number) => {
    setHiredJobs(prev => prev.map(j =>
      j.id === jobId
        ? { ...j, status: "Completed" as const, endDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) }
        : j
    ))
    // Note: hire request status stays as "Accepted" — Hire Requests tab only tracks accept/reject
  }

  const handleRateJob = (jobId: string | number, ratings: import("@/components/worker-profile-modal").CategoryRatings, review: string) => {
    setHiredJobs(prev => prev.map(j => j.id === jobId ? { ...j, ratings, review } : j))
  }

  const activeJobs = hiredJobs.filter(j => {
    if (j.requestId) {
      const req = hireRequests.find(r => r.id === j.requestId)
      if (req && req.location === "Emergency") return false
    }
    return j.status === "Active"
  })
  
  const completedJobs = hiredJobs.filter(j => {
    if (j.requestId) {
      const req = hireRequests.find(r => r.id === j.requestId)
      if (req && req.location === "Emergency") return false
    }
    return j.status === "Completed" && !j.hiddenFromExplorer
  })

  const hasClearableItems = activeSubTab === "orders"
    ? completedJobs.length > 0
    : hireRequests.some(r => r.explorerName === explorerInfo.name && !r.hiddenFromExplorer && r.location !== "Emergency" && (r.status === "Accepted" || r.status === "Rejected"))

  // Category → profession keyword map
  const categoryMap: Record<string, string> = {
    mason: "mason",
    carpenter: "carpenter",
    electrician: "electrician",
    architect: "architect",
    engineer: "engineer",
    painter: "painter",
    labor: "labor",
    other: "other",
  }

  const filteredProfessionals = professionalsWithDistance.filter(pro => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q ||
      pro.name.toLowerCase().includes(q) ||
      pro.profession.toLowerCase().includes(q) ||
      pro.location.toLowerCase().includes(q) ||
      pro.skills.some(s => s.toLowerCase().includes(q))

    const mainProfessions = ["mason", "carpenter", "electrician", "architect", "engineer", "painter", "labor"]
    const matchesCategory = activeCategory === "all" ||
      (activeCategory === "other"
        ? !mainProfessions.some(p => pro.profession.toLowerCase().includes(p))
        : pro.profession.toLowerCase().includes(categoryMap[activeCategory] ?? activeCategory))

    const matchesAvailable = !filterAvailable || pro.available
    const matchesRating = pro.rating >= filterMinRating
    const matchesVerified = !filterVerified || pro.verified
    const matchesDistance = filterMaxKm === 0 || pro._km <= filterMaxKm

    return matchesSearch && matchesCategory && matchesAvailable && matchesRating && matchesVerified && matchesDistance
  })

  const openProfile = (pro: Professional) => {
    setSelectedProfessional(pro)
    setIsModalOpen(true)
  }

  const closeProfile = () => {
    setIsModalOpen(false)
    setSelectedProfessional(null)
  }

  const handleMessage = async (workerId: string | number) => {
    const worker = professionals.find(p => p.id === workerId) || selectedProfessional
    if (!worker) { closeProfile(); setActiveTab?.("messages"); return }

    // Create or get conversation in DB
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored && worker.id) {
        const currentUser = JSON.parse(stored)
        if (currentUser.id) {
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id, otherUserId: String(worker.id) })
          })
        }
      }
    } catch (err) {
      console.error("Failed to create conversation in DB:", err)
    }

    const existing = conversations.find(c => c.name === worker.name)
    if (existing) {
      setSelectedConversation(existing)
    } else {
      const newConv = {
        id: newConvId(),
        name: worker.name,
        profession: worker.profession,
        avatar: worker.avatar,
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

  const handleHire = (workerId: string | number) => {
    closeProfile()
  }

  // Convert professional to modal format
  const workerForModal = selectedProfessional ? {
    id: selectedProfessional.id,
    name: selectedProfessional.name,
    profession: selectedProfessional.profession,
    avatar: selectedProfessional.avatar,
    coverImage: selectedProfessional.coverImage,
    verified: selectedProfessional.verified,
    location: selectedProfessional.location,
    experience: selectedProfessional.experience,
    rating: selectedProfessional.rating,
    projectsCount: selectedProfessional.reviewsCount,
    bio: selectedProfessional.bio,
    skills: selectedProfessional.skills,
    upiId: selectedProfessional.upiId,
    bankAccount: selectedProfessional.bankAccount,
    bankIfsc: selectedProfessional.bankIfsc,
    rate: selectedProfessional.rate,
    workerType: selectedProfessional.workerType,
    available: selectedProfessional.available,
    gallery: [
      selectedProfessional.coverImage,
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=300&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=300&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=300&fit=crop",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=300&h=300&fit=crop",
    ].filter(Boolean)
  } : null

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Explore Professionals</h1>
            <p className="text-muted-foreground">Find skilled workers for your construction needs</p>
          </div>
          <Button
            variant="outline"
            className="relative rounded-xl gap-2"
            onClick={() => setShowJobsPanel(true)}
          >
            <ClipboardCheck className="w-5 h-5" />
            <span className="hidden sm:inline">My Activity</span>
            {activeJobs.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {activeJobs.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, skill, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-secondary border-0"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          className="h-12 px-4 rounded-xl gap-2"
          onClick={() => setShowFilters(v => !v)}
        >
          <Sliders className="w-4 h-4" />
          Filters
          {(filterAvailable || filterMinRating > 0 || filterMaxKm > 0) && (
            <span className="w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm text-card-foreground">Search & Filter Preferences</h3>
            </div>
            <button
              onClick={() => { setFilterAvailable(false); setFilterVerified(false); setFilterMinRating(0); setFilterMaxKm(0) }}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Preferences */}
            <div className="space-y-4">
              {/* Availability & Rating */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Status & Ratings</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterAvailable(v => !v)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200",
                      filterAvailable 
                        ? "bg-primary/10 text-primary border-primary shadow-sm" 
                        : "bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full", filterAvailable ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/60")} />
                    Available Now
                  </button>

                  {[4, 4.5, 4.8].map(r => (
                    <button
                      key={r}
                      onClick={() => setFilterMinRating(filterMinRating === r ? 0 : r)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200",
                        filterMinRating === r 
                          ? "bg-primary/10 text-primary border-primary shadow-sm" 
                          : "bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      )}
                    >
                      <Star className={cn("w-3 h-3", filterMinRating === r ? "text-primary fill-primary" : "text-muted-foreground")} />
                      {r}+ Rating
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance Radius */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Distance Radius</label>
                  <span className="text-xs font-bold text-primary">
                    {filterMaxKm === 0 ? "Any distance" : `Within ${filterMaxKm} km`}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[2, 5, 10, 20, 50].map(km => (
                    <button
                      key={km}
                      onClick={() => setFilterMaxKm(filterMaxKm === km ? 0 : km)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200",
                        filterMaxKm === km 
                          ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                          : "bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      )}
                    >
                      {km} km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Location search */}
            <div className="space-y-4 md:border-l md:border-border/60 md:pl-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Location Search</label>
                  <span className="text-xs font-bold text-card-foreground">
                    {exploreLocation?.city ? (
                      <span className="text-primary font-bold">Exploring: {exploreLocation.city}</span>
                    ) : userLocation?.city ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Home: {userLocation.city}</span>
                    ) : (
                      "No active location"
                    )}
                  </span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search city or area (e.g. Mumbai)"
                      value={manualLocationInput}
                      onChange={(e) => {
                        setManualLocationInput(e.target.value)
                        if (locationError) setLocationError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleManualLocationSearch()
                        }
                      }}
                      className="pl-9 h-11 text-xs rounded-xl bg-secondary/30 border-border focus-visible:ring-primary font-medium"
                    />
                  </div>
                  <Button
                    onClick={handleManualLocationSearch}
                    disabled={searchingLocation}
                    className="h-11 px-4 rounded-xl text-xs font-bold shadow-md shadow-primary/10"
                  >
                    {searchingLocation ? "..." : "Set"}
                  </Button>
                </div>

                <div className="flex justify-between items-center pt-1">
                  {exploreLocation ? (
                    <button 
                      onClick={() => {
                        setExploreLocation(null)
                        setLocationError(null)
                      }}
                      className="text-[10px] text-primary hover:text-primary/80 font-bold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset to Home Location
                    </button>
                  ) : userLocation?.city ? (
                    <button 
                      onClick={() => {
                        detectLocation()
                        setLocationError(null)
                      }}
                      className="text-[10px] text-primary hover:text-primary/80 font-bold flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" /> Detect via GPS
                    </button>
                  ) : null}
                </div>

                {locationError && (
                  <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                    ⚠️ {locationError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => {
          const getCategoryCount = (catId: string) => {
            if (catId === "all") return professionals.length
            const mapping: Record<string, string> = {
              mason: "mason",
              carpenter: "carpenter",
              electrician: "electrician",
              architect: "architect",
              engineer: "engineer",
              painter: "painter",
              labor: "labor",
              other: "other",
            }
            if (catId === "other") {
              const mainProfessions = ["mason", "carpenter", "electrician", "architect", "engineer", "painter", "labor"]
              return professionals.filter(pro => !mainProfessions.some(p => pro.profession.toLowerCase().includes(p))).length
            }
            return professionals.filter(pro => pro.profession.toLowerCase().includes(mapping[catId] ?? catId)).length
          }
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {cat.label}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                activeCategory === cat.id
                  ? "bg-primary-foreground/20"
                  : "bg-muted"
              )}>
                {getCategoryCount(cat.id)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfessionals.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 gap-3">
            <Search className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No professionals found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            <button onClick={() => { setSearchQuery(""); setActiveCategory("all"); setFilterAvailable(false); setFilterVerified(false); setFilterMinRating(0) }} className="text-sm text-primary hover:underline">Clear all filters</button>
          </div>
        ) : filteredProfessionals.map((pro) => (
          <div
            key={pro.id}
            className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
            onClick={() => openProfile(pro)}
          >
            {/* Cover Image */}
            <div className="relative h-32 bg-gradient-to-br from-violet-100 to-slate-100 dark:from-violet-950/20 dark:to-slate-900/20 overflow-hidden">
              {pro.coverImage ? (
                <>
                  <img
                    src={pro.coverImage}
                    alt={`${pro.name}'s work`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </>
              ) : (
                <div className="w-full h-full" />
              )}
              {pro.available ? (
                <span className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Available
                </span>
              ) : (
                <span className="absolute top-3 right-3 bg-muted-foreground text-white text-xs px-2 py-1 rounded-full">
                  Busy
                </span>
              )}
            </div>

            {/* Profile Info */}
            <div className="p-4 -mt-8 relative">
              <Avatar className="w-16 h-16 border-4 border-card">
                {pro.avatar ? (
                  <AvatarImage
                    src={pro.avatar}
                    alt={pro.name}
                  />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-base">
                  {pro.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="mt-2 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-card-foreground">{pro.name}</h3>
                      {pro.verified && (
                        <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{pro.profession}</p>
                  </div>
                  <div className="text-right">
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {pro.reviewsCount > 0 ? (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                      <span className="font-medium text-card-foreground">{pro.rating.toFixed(1)}</span>
                      <span>({pro.reviewsCount})</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No reviews yet</span>
                  )}
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{pro.experience}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {pro.distance && pro.distance !== "—"
                      ? `${pro.distance} away`
                      : pro.location}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Worker Profile Modal */}
      <WorkerProfileModal
        worker={workerForModal}
        isOpen={isModalOpen}
        onClose={closeProfile}
        onMessage={handleMessage}
        onHire={userRole === "explorer" ? handleHire : undefined}
        hiredJobs={userRole === "explorer" ? hiredJobs : []}
        onMarkHired={userRole === "explorer" ? handleMarkHired : undefined}
        onCompleteJob={userRole === "explorer" ? handleCompleteJob : undefined}
        onRateJob={userRole === "explorer" ? handleRateJob : undefined}
      />

      {/* My Jobs Panel */}
      {showJobsPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowJobsPanel(false)} />
          <div className="relative w-full max-w-md bg-card h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-card-foreground">My Activity</h2>
                {hasClearableItems && (
                  <button
                    onClick={() => setClearConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition-all"
                    title={activeSubTab === "orders" ? "Clear Active Jobs" : "Clear Hire Requests"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <button onClick={() => setShowJobsPanel(false)} className="p-1 rounded-full hover:bg-secondary">
                <span className="text-muted-foreground text-xl leading-none">×</span>
              </button>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-border bg-card">
              <button
                onClick={() => setActiveSubTab("orders")}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors",
                  activeSubTab === "orders"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Active Jobs</span>
                {hiredJobs.filter(j => {
                  if (j.requestId) {
                    const req = hireRequests.find(r => r.id === j.requestId)
                    if (req && req.location === "Emergency") return false
                  }
                  return !j.hiddenFromExplorer
                }).length > 0 && (
                  <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-bold ml-1">
                    {hiredJobs.filter(j => {
                      if (j.requestId) {
                        const req = hireRequests.find(r => r.id === j.requestId)
                        if (req && req.location === "Emergency") return false
                      }
                      return !j.hiddenFromExplorer
                    }).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveSubTab("pre-orders")}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors",
                  activeSubTab === "pre-orders"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Calendar className="w-4 h-4" />
                <span>Hire Requests</span>
                {hireRequests.filter(r => r.explorerName === explorerInfo.name && r.status !== "Completed" && !r.hiddenFromExplorer && r.location !== "Emergency").length > 0 && (
                  <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-bold ml-1">
                    {hireRequests.filter(r => r.explorerName === explorerInfo.name && r.status !== "Completed" && !r.hiddenFromExplorer && r.location !== "Emergency").length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeSubTab === "orders" ? (
                <div className="space-y-6">
                  {activeJobs.length === 0 && completedJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 opacity-40 text-muted-foreground stroke-[1.5]" />
                      </div>
                      <p className="text-base font-semibold text-card-foreground">No active jobs yet</p>
                      <p className="text-xs text-center px-4 max-w-xs leading-relaxed text-muted-foreground">Your active jobs will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Active Jobs */}
                      {activeJobs.map(job => {
                        const pro = professionalsWithDistance.find(p => String(p.id) === String(job.workerId) || p.name === job.workerName)
                        return (
                          <div key={job.id} className="bg-secondary rounded-2xl p-4 space-y-3 mb-3">
                            <button
                              className="w-full flex items-center gap-3 text-left"
                              onClick={() => {
                                if (pro) { setSelectedProfessional(pro); setIsModalOpen(true) }
                                setShowJobsPanel(false)
                              }}
                            >
                              <img src={pro?.avatar || job.workerAvatar || "/placeholder-user.jpg"} alt={job.workerName}
                                className="w-10 h-10 rounded-full object-cover shrink-0"
                                onError={(e) => { e.currentTarget.src = "/placeholder-user.jpg" }} />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-card-foreground truncate">{job.workerName}</p>
                                <p className="text-xs text-muted-foreground">{job.workerProfession}</p>
                              </div>
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full shrink-0">Active</span>
                            </button>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" /><span>Started {job.startDate}</span>
                            </div>
                            <Button
                              size="sm"
                              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs"
                              onClick={() => handleCompleteJob(job.id)}
                            >
                              <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
                              Mark as Complete
                            </Button>
                          </div>
                        )
                      })}

                      {/* Completed Jobs */}
                      {completedJobs.map(job => {
                        const pro = professionalsWithDistance.find(p => String(p.id) === String(job.workerId) || p.name === job.workerName)
                        return (
                          <button
                            key={job.id}
                            className="w-full text-left bg-secondary rounded-2xl p-4 space-y-3 mb-3 hover:bg-secondary/70 transition-colors active:scale-[0.98] block border border-transparent"
                            onClick={() => {
                              if (pro) { setSelectedProfessional(pro); setIsModalOpen(true) }
                              setShowJobsPanel(false)
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <img src={pro?.avatar || job.workerAvatar || "/placeholder-user.jpg"} alt={job.workerName}
                                className="w-10 h-10 rounded-full object-cover shrink-0"
                                onError={(e) => { e.currentTarget.src = "/placeholder-user.jpg" }} />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-card-foreground truncate">{job.workerName}</p>
                                <p className="text-xs text-muted-foreground">{job.workerProfession}</p>
                              </div>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">Done</span>
                            </div>
                            <div className="space-y-0.5 text-xs text-muted-foreground">
                              <p>{job.startDate}{job.endDate ? ` → ${job.endDate}` : ""}</p>
                            </div>
                            {job.ratings ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map(s => {
                                    const avg = Math.round(Object.values(job.ratings!).reduce((a, b) => a + b, 0) / 5)
                                    return <Star key={s} className={`w-4 h-4 ${s <= avg ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                                  })}
                                  <span className="text-xs text-muted-foreground ml-1">
                                    {(Object.values(job.ratings).reduce((a, b) => a + b, 0) / 5).toFixed(1)}/5 avg
                                  </span>
                                </div>
                                {job.review && <p className="text-xs text-muted-foreground italic">"{job.review}"</p>}
                              </div>
                            ) : (
                              <p className="text-xs text-primary font-medium">Tap to open profile & rate →</p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const myReqs = hireRequests.filter(r => r.explorerName === explorerInfo.name && r.status !== "Completed" && !r.hiddenFromExplorer && r.location !== "Emergency")
                    return myReqs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                          <Calendar className="w-8 h-8 opacity-40 text-muted-foreground stroke-[1.5]" />
                        </div>
                        <p className="text-base font-semibold text-card-foreground">No hire requests yet</p>
                        <p className="text-xs text-center px-4 max-w-xs leading-relaxed text-muted-foreground">Your sent hire requests will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myReqs.map(req => {
                          const pro = professionalsWithDistance.find(p => p.name === req.workerName)
                          const statusColor = {
                            Pending: "bg-amber-100 text-amber-700",
                            Accepted: "bg-emerald-100 text-emerald-700",
                            Rejected: "bg-red-100 text-red-600",
                            Completed: "bg-green-100 text-green-700",
                          }[req.status]
                          return (
                            <div key={req.id} className="bg-secondary rounded-2xl p-4 space-y-3 mb-3 text-left">
                              <div className="flex items-center gap-3">
                                <img src={pro?.avatar || req.workerAvatar || "/placeholder-user.jpg"} alt={req.workerName}
                                  className="w-9 h-9 rounded-full object-cover shrink-0"
                                  onError={e => { e.currentTarget.src = "/placeholder-user.jpg" }} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-xs text-card-foreground truncate">{req.workerName}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">{req.workerProfession}</p>
                                </div>
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>{req.status}</span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                {req.startDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {req.startDate}
                                  </span>
                                )}
                                {req.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {req.location}
                                  </span>
                                )}
                              </div>
                              {req.status === "Accepted" && (
                                <button
                                  className="w-full text-xs text-primary font-semibold hover:underline text-left mt-1"
                                  onClick={() => {
                                    if (pro) { setSelectedProfessional(pro); setIsModalOpen(true) }
                                    setShowJobsPanel(false)
                                  }}
                                >
                                  Open profile to manage →
                                </button>
                              )}
                              {req.status === "Pending" && (
                                <button
                                  className="text-xs text-red-500 hover:underline font-semibold mt-1.5 block"
                                  onClick={() => {
                                    setHireRequests(prev => prev.filter(r => r.id !== req.id))
                                  }}
                                >
                                  Cancel Request
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {clearConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-border">
            <h3 className="font-bold text-card-foreground">Clear {activeSubTab === "orders" ? "Jobs" : "Requests"} History?</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to clear your {activeSubTab === "orders" ? "jobs" : "hire requests"} history? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setClearConfirm(false)}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white" onClick={() => {
                if (activeSubTab === "orders") {
                  setHiredJobs(prev => prev.map(j => j.status === "Completed" ? { ...j, hiddenFromExplorer: true } : j))
                } else {
                  setHireRequests(prev => prev.map(r =>
                    r.explorerName === explorerInfo.name && (r.status === "Accepted" || r.status === "Rejected")
                      ? { ...r, hiddenFromExplorer: true }
                      : r
                  ))
                }
                setClearConfirm(false)
              }}>Clear</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
