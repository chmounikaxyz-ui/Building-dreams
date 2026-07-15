"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Trash2, MapPin, Calendar, Star, CheckCircle, MessageSquare, Building, UserCheck, Clock, ClipboardCheck, Send, ChevronRight, QrCode, CreditCard, Banknote, Heart, MessageCircle, Bookmark, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useApp } from "@/context/app-context"

export interface WorkerProfile {
  id: string | number
  name: string
  profession: string
  avatar: string
  coverImage: string
  verified: boolean
  location: string
  experience: string
  rating: number
  projectsCount: number
  bio: string
  skills: string[]
  gallery: string[]
  upiId?: string
  bankAccount?: string
  bankIfsc?: string
  workerType?: string
  rate?: string
  role?: string
  available?: boolean
  crewSize?: string | number
  crewComposition?: string
  groupName?: string
}

export type CategoryRatings = {
  functionality: number
  behavior: number
  communication: number
  speed: number
  responsiveness: number
}

export type HiredJob = {
  id: string | number
  workerId: string | number
  workerName: string
  workerProfession: string
  workerAvatar: string
  startDate: string
  endDate?: string
  status: "Active" | "Completed"
  ratings: CategoryRatings | null
  review: string | null
  hiddenFromExplorer?: boolean
  requestId?: number
}

interface WorkerProfileModalProps {
  worker: WorkerProfile | null
  isOpen: boolean
  onClose: () => void
  onMessage: (workerId: string | number) => void
  onHire?: (workerId: string | number) => void
  onDelete?: (workerId: string | number) => void
  hiredJobs?: HiredJob[]
  onMarkHired?: (job: Omit<HiredJob, "id">) => void
  onCompleteJob?: (jobId: string | number) => void
  onRateJob?: (jobId: string | number, ratings: CategoryRatings, review: string) => void
  initialPost?: any | null
}

const placeholderAvatar = "/placeholder-user.jpg"
const placeholderCover = "/placeholder.jpg"

export function WorkerProfileModal({
  worker: propWorker, isOpen, onClose, onMessage, onHire, onDelete,
  hiredJobs = [], onMarkHired, onCompleteJob, onRateJob,
  initialPost = null
}: WorkerProfileModalProps) {
  const [localWorker, setLocalWorker] = useState<WorkerProfile | null>(null)
  const [hideDeclinedMessage, setHideDeclinedMessage] = useState(false)
  const [showUnavailableMessage, setShowUnavailableMessage] = useState(false)

  useEffect(() => {
    setLocalWorker(null)
    setHideDeclinedMessage(false)
    setShowUnavailableMessage(false)
  }, [propWorker])

  const worker = localWorker || propWorker

  const { addHireRequest, hireRequests, updateHireRequest, posts, deletePost, toggleLikePost, addComment, deleteComment, toggleSavePost } = useApp()
  const [showHireForm, setShowHireForm] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [jobLocation, setJobLocation] = useState("")
  const [dailyRate, setDailyRate] = useState("")
  const [hireMessage, setHireMessage] = useState("")
  const [requestSent, setRequestSent] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [selectedPost, setSelectedPost] = useState<any | null>(null)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [newCommentText, setNewCommentText] = useState("")

  useEffect(() => {
    if (isOpen && initialPost) {
      setSelectedPost(initialPost)
    } else if (!isOpen) {
      setSelectedPost(null)
    }
  }, [isOpen, initialPost])

  const isExplorer = worker ? String(worker.profession).toLowerCase() === "explorer" : false

  useEffect(() => {
    if (!isOpen) {
      setLocalWorker(null)
      setShowHireForm(false)
      setStartDate("")
      setJobLocation("")
      setHideDeclinedMessage(false)
      setShowUnavailableMessage(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && propWorker?.id) {
      const fetchLatestDetails = async () => {
        try {
          const res = await fetch(`/api/users/${propWorker.id}`)
          if (res.ok) {
            const foundUser = await res.json()
            let parsedBioText = foundUser.bio || ""
            let parsedExperience = "Experienced"
            let parsedCoverImage = ""
            let parsedAvailable = true
            let parsedWorkerType = "normal"
            let parsedCrewSize = ""
            let parsedCrewComposition = ""
            let parsedGroupName = ""
            let parsedExpectedRates = ""
            if (foundUser.bio) {
              try {
                if (foundUser.bio.trim().startsWith("{") && foundUser.bio.trim().endsWith("}")) {
                  const p = JSON.parse(foundUser.bio)
                  parsedBioText = p.bio || ""
                  parsedExperience = p.experience || "Experienced"
                  parsedCoverImage = p.coverImage || ""
                  parsedWorkerType = p.workerType || "normal"
                  parsedCrewSize = p.crewSize || ""
                  parsedCrewComposition = p.crewComposition || ""
                  parsedGroupName = p.groupName || ""
                  parsedExpectedRates = p.expectedRates || ""
                  if (p.available !== undefined) {
                    parsedAvailable = p.available
                  }
                }
              } catch {}
            }
            
            setLocalWorker({
              id: foundUser.id,
              name: foundUser.name,
              profession: foundUser.profession || (foundUser.role === "worker" ? "Worker" : "Explorer"),
              avatar: foundUser.avatar || "",
              coverImage: parsedCoverImage,
              verified: foundUser.verified || false,
              location: foundUser.location || "Mumbai, India",
              experience: parsedExperience,
              rating: foundUser.rating || 0,
              projectsCount: 0,
              bio: parsedBioText || "No bio provided.",
              skills: foundUser.profession ? [foundUser.profession] : [],
              gallery: [],
              role: foundUser.role,
              available: parsedAvailable,
              workerType: parsedWorkerType,
              crewSize: parsedCrewSize,
              crewComposition: parsedCrewComposition,
              groupName: parsedGroupName,
              rate: parsedExpectedRates,
            })
          }
        } catch (err) {
          console.error("Failed to load user profile on modal mount:", err)
        }
      }
      fetchLatestDetails()
    }
  }, [isOpen, propWorker?.id])

  // Filter posts belonging to this worker
  const workerPosts = posts.filter(p => 
    worker && (
      String(p.user?.id) === String(worker.id) || 
      String(p.user?.name).toLowerCase() === String(worker.name).toLowerCase()
    )
  )

  const emptyRatings: CategoryRatings = { functionality: 0, behavior: 0, communication: 0, speed: 0, responsiveness: 0 }
  const [ratingDraft, setRatingDraft] = useState<Record<string | number, { ratings: CategoryRatings; review: string }>>({})

  const ratingCategories: { key: keyof CategoryRatings; label: string }[] = [
    { key: "functionality", label: "Functionality" },
    { key: "behavior",      label: "Behavior" },
    { key: "communication", label: "Communication" },
    { key: "speed",         label: "Speed" },
    { key: "responsiveness",label: "Responsiveness" },
  ]

  const avgRating = (r: CategoryRatings) => {
    const vals = Object.values(r)
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  }

  const [localHiredJobs, setLocalHiredJobs] = useState<HiredJob[]>([])
  
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem("hired_jobs")
        if (stored) {
          setLocalHiredJobs(JSON.parse(stored))
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [isOpen])

  if (!isOpen || !worker) return null

  // Get explorer info
  const explorerInfo = (() => { try { return JSON.parse(localStorage.getItem("auth_user") || "{}") } catch { return {} } })()

  const isOwnProfile = worker && explorerInfo?.id ? (
    String(worker.id) === String(explorerInfo.id)
  ) : false

  const showMessageButton = !isOwnProfile

  const isOwnPost = (post: any) => {
    return String(post.user?.id) === String(explorerInfo.id)
  }

  // Check existing request status for this worker from this explorer (ignoring completed requests so they can hire again)
  const existingRequest = hireRequests.find(
    r => r.workerName === worker.name && r.explorerName === explorerInfo.name && r.status !== "Completed"
  )


  const effectiveHiredJobs = hiredJobs && hiredJobs.length > 0 ? hiredJobs : localHiredJobs

  const activeJob = effectiveHiredJobs.find(j => (String(j.workerId) === String(worker.id) || j.workerName === worker.name) && j.status === "Active")
  const isHired = !!activeJob || existingRequest?.status === "Accepted"
  const pastJobs = effectiveHiredJobs.filter(j => (String(j.workerId) === String(worker.id) || j.workerName === worker.name) && j.status === "Completed")
  const unratedJobs = pastJobs.filter(j => !j.ratings)

  const isSeller = worker?.role === "seller" || String(worker?.profession || "").toLowerCase().includes("seller")

  const allSellerProducts = (() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("global_seller_products") || "[]") } catch { return [] }
    }
    return []
  })()

  const savedReviews = (() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("global_product_reviews") || "[]") } catch { return [] }
    }
    return []
  })()

  const sellerProductsList = allSellerProducts.filter((p: any) => 
    (worker?.id && String(p.sellerId) === String(worker.id)) || 
    (worker?.name && p.sellerName === worker.name)
  )
  const sellerProductIds = sellerProductsList.map((p: any) => p.id)
  const sellerReviews = savedReviews.filter((r: any) => sellerProductIds.includes(r.productId))

  const ratedJobs = pastJobs.filter(j => j.ratings)
  const reviewsCount = isSeller
    ? (sellerReviews.length > 0 ? sellerReviews.length : (worker.rating > 0 ? 1 : 0))
    : Math.max(ratedJobs.length, worker.projectsCount || 0) || (worker.rating > 0 ? 1 : 0)
  
  const rating = isSeller
    ? (sellerReviews.length > 0 
        ? Math.round((sellerReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / sellerReviews.length) * 10) / 10
        : (worker.rating || 0))
    : (ratedJobs.length > 0 
        ? Math.round((ratedJobs.reduce((sum, job) => {
            const r = job.ratings!
            return sum + (r.functionality + r.behavior + r.communication + r.speed + r.responsiveness) / 5
          }, 0) / ratedJobs.length) * 10) / 10
        : (worker.rating || 0))

  const handleClosePost = () => {
    setSelectedPost(null)
    if (initialPost) {
      onClose()
    }
  }

  const handlePostUserClick = async () => {
    if (!selectedPost || !selectedPost.user) return
    
    const postUserId = selectedPost.user.id
    
    setSelectedPost(null)
    
    if (worker && String(worker.id) === String(postUserId)) {
      return
    }
    
    try {
      const res = await fetch(`/api/users/${postUserId}`)
      if (res.ok) {
        const foundUser = await res.json()
        let parsedBioText = foundUser.bio || ""
        let parsedExperience = "Experienced"
        let parsedCoverImage = ""
        let parsedAvailable = true
        let parsedWorkerType = "normal"
        let parsedCrewSize = ""
        let parsedCrewComposition = ""
        let parsedGroupName = ""
        let parsedExpectedRates = ""
        if (foundUser.bio) {
          try {
            if (foundUser.bio.trim().startsWith("{") && foundUser.bio.trim().endsWith("}")) {
              const p = JSON.parse(foundUser.bio)
              parsedBioText = p.bio || ""
              parsedExperience = p.experience || "Experienced"
              parsedCoverImage = p.coverImage || ""
              parsedWorkerType = p.workerType || "normal"
              parsedCrewSize = p.crewSize || ""
              parsedCrewComposition = p.crewComposition || ""
              parsedGroupName = p.groupName || ""
              parsedExpectedRates = p.expectedRates || ""
              if (p.available !== undefined) {
                parsedAvailable = p.available
              }
            }
          } catch {}
        }
        
        setLocalWorker({
          id: foundUser.id,
          name: foundUser.name,
          profession: foundUser.profession || (foundUser.role === "worker" ? "Worker" : "Explorer"),
          avatar: foundUser.avatar || "",
          coverImage: parsedCoverImage,
          verified: foundUser.verified || false,
          location: foundUser.location || "Mumbai, India",
          experience: parsedExperience,
          rating: foundUser.rating || 0,
          projectsCount: 0,
          bio: parsedBioText || "No bio provided.",
          skills: foundUser.profession ? [foundUser.profession] : [],
          gallery: [],
          role: foundUser.role,
          available: parsedAvailable,
          workerType: parsedWorkerType,
          crewSize: parsedCrewSize,
          crewComposition: parsedCrewComposition,
          groupName: parsedGroupName,
          rate: parsedExpectedRates,
        })
      }
    } catch (err) {
      console.error("Failed to load user profile on click:", err)
    }
  }

  const handleSendRequest = () => {
    if (!startDate || submittingRequest) return
    setSubmittingRequest(true)
    addHireRequest({
      workerId: String(worker.id),
      explorerId: String(explorerInfo.id),
      workerName: worker.name,
      workerAvatar: worker.avatar,
      workerProfession: worker.profession,
      explorerName: explorerInfo.name || "Explorer",
      explorerAvatar: explorerInfo.avatar || "",
      explorerPhone: explorerInfo.phone || "",
      jobTitle: "",
      location: jobLocation.trim(),
      startDate,
      dailyRate: "",
      message: "",
    })
    setRequestSent(true)
    setTimeout(() => {
      setRequestSent(false)
      setShowHireForm(false)
      setSubmittingRequest(false)
      setJobLocation(""); setStartDate("")
    }, 2000)
  }

  // When worker accepts, explorer can then mark as hired
  const handleConfirmHire = () => {
    if (!startDate) return
    const jobData = {
      workerId: worker.id,
      workerName: worker.name,
      workerProfession: worker.profession,
      workerAvatar: worker.avatar,
      startDate,
      status: "Active" as const,
      ratings: null,
      review: null,
    }
    if (onMarkHired) {
      onMarkHired(jobData)
    } else {
      const newJob = { ...jobData, id: Date.now() }
      const updated = [newJob, ...localHiredJobs]
      setLocalHiredJobs(updated)
      localStorage.setItem("hired_jobs", JSON.stringify(updated))
    }
  }

  return (
    <>
    {(!initialPost || !selectedPost) && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative z-10 w-full mx-4 bg-card rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto", isExplorer ? "max-w-2xl" : "max-w-4xl")}>
        <div className={cn("flex flex-col", !isExplorer && "lg:flex-row")}>
          {/* Left Section */}
          <div className="flex-1">
            <div className="relative h-48 lg:h-56 bg-gradient-to-br from-violet-100 to-slate-100 dark:from-violet-950/20 dark:to-slate-900/20">
              {worker.coverImage ? (
                <>
                  <img src={worker.coverImage} alt="Cover"
                    className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </>
              ) : (
                <div className="w-full h-full" />
              )}
              {/* Close & Delete Buttons */}
              <div className="absolute top-4 right-4 z-20 flex gap-2 bg-black/30 backdrop-blur-md px-2.5 py-1.5 rounded-full">
                {onDelete && (
                  <button onClick={() => { onDelete(worker.id); onClose() }}
                    className="p-1 rounded-full hover:bg-red-500/20 transition-colors group"
                    title="Delete Profile">
                    <Trash2 className="w-4 h-4 text-white group-hover:text-red-400 transition-colors" />
                  </button>
                )}
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors" title="Close">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-12 mb-4">
                <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
                  {worker.avatar ? (
                    <AvatarImage src={worker.avatar} alt={worker.name} />
                  ) : null}
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full">
                    {worker.name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {worker.verified && (
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 mb-2">
                    <CheckCircle className="w-3 h-3 mr-1" />VERIFIED PRO
                  </Badge>
                )}
                {worker.workerType === "crew" && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">
                    <Users className="w-3 h-3 mr-1" />CREW
                  </Badge>
                )}
                {activeJob && (
                  <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 mb-2">
                    <UserCheck className="w-3 h-3 mr-1" />HIRED
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-bold text-card-foreground tracking-tight mb-1">{worker.name.toUpperCase()}</h2>
              {worker.workerType === "crew" && worker.groupName && (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-3">
                  <Users className="w-4 h-4" />
                  <span>{worker.groupName}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  <span className="uppercase tracking-wide">
                    {worker.workerType === "crew" ? "Group Leader / Contractor" : worker.profession}
                  </span>
                </div>
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /><span className="uppercase tracking-wide">{worker.location}</span></div>
                {!isExplorer && worker.experience && (
                  <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span className="uppercase tracking-wide">{worker.experience}</span></div>
                )}
              </div>

              {worker.workerType === "crew" && (
                <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-4 shadow-sm text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-card-foreground">Crew & Team Configuration</h4>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Led by {worker.name}</p>
                      </div>
                    </div>
                    {worker.crewSize && (
                      <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-bold">
                        {worker.crewSize} Members
                      </span>
                    )}
                  </div>

                  {worker.crewComposition && (
                    <div className="space-y-2 text-left">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Crew Skills Breakdown</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {worker.crewComposition.split(",").map((member: string, i: number) => {
                          const cleanMember = member.trim();
                          if (!cleanMember) return null;
                          
                          let icon = "👷";
                          const lower = cleanMember.toLowerCase();
                          if (lower.includes("paint")) icon = "🎨";
                          else if (lower.includes("plumb")) icon = "🔧";
                          else if (lower.includes("electr") || lower.includes("wire")) icon = "⚡";
                          else if (lower.includes("carpenter") || lower.includes("wood")) icon = "🪚";
                          else if (lower.includes("mason") || lower.includes("brick")) icon = "🧱";
                          else if (lower.includes("tile") || lower.includes("marble")) icon = "📐";
                          else if (lower.includes("helper") || lower.includes("labor")) icon = "🤝";
                          
                          return (
                            <div key={i} className="flex items-center gap-2.5 bg-secondary/40 px-3.5 py-2 rounded-xl text-xs font-semibold text-card-foreground border border-border/40 justify-start">
                              <span className="text-base shrink-0">{icon}</span>
                              <span className="truncate">{cleanMember}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isExplorer && worker.bio && (
                <div className="bg-muted/30 border border-border rounded-2xl p-4 mb-4">
                  <p className="text-sm text-muted-foreground italic leading-relaxed">&quot;{worker.bio}&quot;</p>
                </div>
              )}

              {isExplorer && showMessageButton && (
                <Button variant="outline" className="w-full h-11 text-sm font-semibold mb-6 animate-in fade-in duration-200" onClick={() => onMessage(worker.id)}>
                  <MessageSquare className="w-4 h-4 mr-2" /> MESSAGE
                </Button>
              )}

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground tracking-widest mb-3">{isExplorer ? "POSTS" : "PROJECT GALLERY"}</h3>
                {workerPosts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {workerPosts.map((post) => (
                      <div key={post.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={post.images?.[0] || (post as any).image} 
                          alt={post.description || "Project Post"}
                          onError={(e) => { e.currentTarget.src = placeholderCover }}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => setSelectedPost(post)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No posts available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Section */}
          {!isExplorer && (
            <div className="lg:w-72 bg-muted/30 p-6 flex flex-col gap-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-xl p-4 text-center border border-border flex flex-col justify-center items-center">
                  {reviewsCount > 0 ? (
                    <>
                      <div className="text-3xl font-bold text-card-foreground">{rating.toFixed(1)}</div>
                      <div className="flex items-center justify-center gap-0.5 my-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                        ))}
                      </div>
                      <div className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1">
                        Rating ({reviewsCount})
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-semibold text-muted-foreground leading-snug">No reviews yet</div>
                      <div className="text-[10px] text-muted-foreground tracking-widest uppercase mt-3">Rating</div>
                    </>
                  )}
                </div>
                <div className="bg-card rounded-xl p-4 text-center border border-border flex flex-col justify-center items-center h-full">
                  <div className={cn("font-bold text-card-foreground truncate max-w-full uppercase", String(worker.experience).length > 3 ? "text-sm" : "text-2xl")}>
                    {worker.experience}
                  </div>
                  <div className="text-[10px] text-muted-foreground tracking-widest uppercase mt-2">Experience</div>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-sm text-muted-foreground italic leading-relaxed">&quot;{worker.bio}&quot;</p>
              </div>

              {/* Hire / Request Section */}
              {!isExplorer && !isOwnProfile && explorerInfo.role === "explorer" && (
                <>
                  {showUnavailableMessage && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-xs font-semibold text-center animate-in fade-in slide-in-from-top-1 duration-200 mb-2">
                      Unavailable currently
                    </div>
                  )}

                  {/* Case 1: Active job running → show CURRENTLY HIRED + Mark Complete */}
                  {activeJob && (
                    <div className="space-y-2">
                      <div className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm tracking-wide gap-2 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <UserCheck className="w-5 h-5 shrink-0" />
                        CURRENTLY HIRED
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Started on {activeJob.startDate}</span>
                        </div>
                        <Button size="sm" className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 font-semibold shadow-md shadow-blue-500/10"
                          onClick={() => {
                            if (onCompleteJob) {
                              onCompleteJob(activeJob.id)
                            } else {
                              const updated = localHiredJobs.map(j =>
                                j.id === activeJob.id
                                  ? { ...j, status: "Completed" as const, endDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) }
                                  : j
                              )
                              setLocalHiredJobs(updated)
                              localStorage.setItem("hired_jobs", JSON.stringify(updated))
                            }
                            // Note: hireRequest status stays as "Accepted" — Hire Requests tab
                            // only tracks accept/reject, not job completion.
                          }}>
                          <ClipboardCheck className="w-4 h-4" />
                          Mark Job as Complete
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Case 2: Request accepted but no active job (completed or not yet logged) → simple badge only */}
                  {!activeJob && existingRequest?.status === "Accepted" && (
                    <div className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm tracking-wide gap-2 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <UserCheck className="w-5 h-5 shrink-0" />
                      HIRED
                    </div>
                  )}

                  {/* Show Hire Form if showHireForm is true */}
                  {showHireForm ? (
                    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Send Hire Request</p>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Start Date *</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-secondary border-0 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Site Location</label>
                        <Input value={jobLocation} onChange={e => setJobLocation(e.target.value)}
                          placeholder="e.g. Andheri West, Mumbai" className="h-9 bg-secondary border-0 text-sm" />
                      </div>
                      <p className="text-xs text-muted-foreground">For more details, discuss through messages.</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="flex-1 rounded-lg text-xs" onClick={() => setShowHireForm(false)}>Cancel</Button>
                        <Button size="sm" className="flex-1 rounded-lg text-xs gap-1.5"
                          disabled={!startDate || submittingRequest} onClick={handleSendRequest}>
                          <Send className="w-3.5 h-3.5" /> {submittingRequest ? "Sending..." : "Send Request"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Request already sent — pending */}
                      {!activeJob && existingRequest?.status === "Pending" && (
                        <div className="space-y-2">
                          <div className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wide gap-2 flex items-center justify-center shadow-lg shadow-primary/20">
                            <Clock className="w-5 h-5 animate-pulse shrink-0" />
                            REQUEST PENDING
                          </div>
                        </div>
                      )}

                      {/* Request rejected — show rejection notice + allow re-request */}
                      {!activeJob && existingRequest?.status === "Rejected" && (
                        <div className="flex flex-col gap-2">
                          {!hideDeclinedMessage && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                              <button
                                onClick={() => setHideDeclinedMessage(true)}
                                className="hover:opacity-75 transition-opacity shrink-0"
                                type="button"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </button>
                              <p className="text-xs text-red-600">Request declined. You can send a new one.</p>
                            </div>
                          )}
                          <Button className="w-full h-12 text-base font-semibold tracking-wide gap-2"
                            onClick={() => {
                              if (worker.available === false) {
                                setShowUnavailableMessage(true)
                                setTimeout(() => setShowUnavailableMessage(false), 3000)
                              } else {
                                setShowHireForm(true)
                              }
                            }}>
                            <Send className="w-4 h-4" />
                            REQUEST TO HIRE
                          </Button>
                        </div>
                      )}

                      {/* No request yet — show Request to Hire button */}
                      {!activeJob && !existingRequest && (
                        <div className="space-y-2">
                          {requestSent ? (
                            <div className="flex flex-col items-center gap-2 py-4">
                              <CheckCircle className="w-10 h-10 text-primary" />
                              <p className="text-sm font-semibold text-card-foreground">Request Sent!</p>
                              <p className="text-xs text-muted-foreground text-center">
                                {worker.name.split(" ")[0]} will be notified and can accept or decline.
                              </p>
                            </div>
                          ) : (
                            <Button className="w-full h-12 text-base font-semibold tracking-wide gap-2"
                              onClick={() => {
                                if (worker.available === false) {
                                  setShowUnavailableMessage(true)
                                  setTimeout(() => setShowUnavailableMessage(false), 3000)
                                } else {
                                  setShowHireForm(true)
                                }
                              }}>
                              <Send className="w-4 h-4" />
                              REQUEST TO HIRE
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Message Button */}
              {showMessageButton && (
                <Button variant="outline" className="w-full h-12 text-base font-semibold tracking-wide"
                  onClick={() => onMessage(worker.id)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  MESSAGE
                </Button>
              )}

              {/* Past Jobs / History */}
              {unratedJobs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Job History</p>
                  {unratedJobs.map(job => (
                    <div key={job.id} className="bg-card border border-border rounded-xl p-3 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-muted-foreground">{job.startDate}{job.endDate ? ` → ${job.endDate}` : ""}</p>
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">Done</span>
                      </div>

                      {job.ratings ? (
                        /* Submitted ratings display */
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-card-foreground">Your Ratings</p>
                            <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map(s => {
                                const avg = Math.round(Object.values(job.ratings!).reduce((a,b)=>a+b,0)/5)
                                return <Star key={s} className={cn("w-3 h-3", s <= avg ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25")} />
                              })}
                              <span className="text-xs font-bold text-amber-500 ml-1">{avgRating(job.ratings)}/5 avg</span>
                            </div>
                          </div>
                          {job.review && <p className="text-xs text-muted-foreground italic pt-1">"{job.review}"</p>}
                        </div>
                      ) : (
                        /* Rating form */
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-card-foreground">Rate this worker:</p>
                          {ratingCategories.map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
                              <div className="flex items-center gap-0.5">
                                {[1,2,3,4,5].map(s => {
                                  const current = ratingDraft[job.id]?.ratings?.[key] ?? 0
                                  return (
                                    <button key={s}
                                      onClick={() => setRatingDraft(prev => ({
                                        ...prev,
                                        [job.id]: {
                                          ratings: { ...(prev[job.id]?.ratings ?? emptyRatings), [key]: s },
                                          review: prev[job.id]?.review ?? ""
                                        }
                                      }))}
                                      className="hover:scale-125 transition-transform">
                                      <Star className={cn("w-4 h-4", s <= current ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25")} />
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                          {ratingCategories.every(({ key }) => (ratingDraft[job.id]?.ratings?.[key] ?? 0) > 0) && (
                            <div className="pt-2">
                              <button
                                onClick={() => {
                                  const d = ratingDraft[job.id]
                                  if (d?.ratings) {
                                    if (onRateJob) {
                                      onRateJob(job.id, d.ratings, "")
                                    }
                                    const updated = localHiredJobs.map(j => j.id === job.id ? { ...j, ratings: d.ratings, review: "" } : j)
                                    setLocalHiredJobs(updated)
                                    localStorage.setItem("hired_jobs", JSON.stringify(updated))

                                    // Recalculate average rating for this worker
                                    const allCompletedForWorker = updated.filter(j => (String(j.workerId) === String(worker.id) || j.workerName === worker.name) && j.status === "Completed" && j.ratings)
                                    if (allCompletedForWorker.length > 0) {
                                      const totalSum = allCompletedForWorker.reduce((sum, j) => {
                                        const r = j.ratings!
                                        return sum + (r.functionality + r.behavior + r.communication + r.speed + r.responsiveness) / 5
                                      }, 0)
                                      const newAvg = Math.round((totalSum / allCompletedForWorker.length) * 10) / 10
                                      fetch(`/api/users/${worker.id}`)
                                        .then(res => res.json())
                                        .then(dbUser => {
                                          let bioJSON: any = { bio: "", experience: "", workerType: "normal", coverImage: "", expectedRates: "", available: true, reviewsCount: 0 }
                                          if (dbUser.bio) {
                                            try {
                                              if (dbUser.bio.trim().startsWith("{") && dbUser.bio.trim().endsWith("}")) {
                                                bioJSON = JSON.parse(dbUser.bio)
                                              } else {
                                                bioJSON.bio = dbUser.bio
                                              }
                                            } catch {}
                                          }
                                          bioJSON.reviewsCount = allCompletedForWorker.length
                                          const newBioString = JSON.stringify(bioJSON)

                                          fetch("/api/users", {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ userId: worker.id, rating: newAvg, bio: newBioString })
                                          }).catch(err => console.error("Error updating worker rating/bio in DB:", err))
                                        }).catch(err => {
                                          fetch("/api/users", {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ userId: worker.id, rating: newAvg })
                                          }).catch(err => console.error("Error updating worker rating in DB:", err))
                                        })
                                    }
                                  }
                                }}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Submit Rating
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    )}

    {selectedPost && typeof window !== "undefined" && createPortal(
      <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" onClick={handleClosePost}>
        <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <button
              onClick={handlePostUserClick}
              className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
            >
              <Avatar className="w-9 h-9">
                {selectedPost.user?.avatar ? (
                  <AvatarImage src={selectedPost.user.avatar} alt={selectedPost.user.name} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold flex items-center justify-center w-full h-full text-sm">
                  {selectedPost.user?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-card-foreground">
                  {selectedPost.user?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedPost.user?.profession || "User"}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1.5">
              {isOwnPost(selectedPost) && (
                <button
                  onClick={() => { deletePost(selectedPost.id); handleClosePost() }}
                  className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                  title="Delete post"
                >
                  <Trash2 className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                </button>
              )}
              <button onClick={handleClosePost} className="p-2 rounded-full hover:bg-secondary transition-colors">
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

            {selectedPost.description && (
              <p className="text-sm text-card-foreground font-medium">{selectedPost.description}</p>
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
                      {(String(c.userName).toLowerCase() === "you" || String(c.userName).toLowerCase() === String(explorerInfo.name).toLowerCase()) && (
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
      </div>,
      document.body
    )}
    </>
  )
}

// Sample worker data for testing
export const sampleWorkers: WorkerProfile[] = []
