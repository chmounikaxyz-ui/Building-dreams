"use client"

import { useState, useEffect } from "react"
import { Phone, MapPin, Clock, Star, AlertTriangle, Zap, Droplets, Wrench, Shield, CheckCircle, X, CalendarClock, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useApp } from "@/context/app-context"
import { haversineKm, formatDistance } from "@/lib/location"

const emergencyServices = [
  {
    id: "electrical",
    label: "Electrical",
    icon: Zap,
    description: "Power outages, short circuits"
  },
  {
    id: "plumbing",
    label: "Plumber",
    icon: Droplets,
    description: "Leaking pipes, blockages, water issues"
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Lock repair, CCTV issues"
  },
  {
    id: "others",
    label: "Others",
    icon: AlertTriangle,
    description: "Other emergency assistance"
  },
]

const defaultEmergencyWorkers: any[] = []

const getServiceFromProfession = (prof: string): string => {
  const p = prof.toLowerCase()
  if (p.includes("plumb")) return "plumbing"
  if (p.includes("electr")) return "electrical"
  if (p.includes("repair")) return "others"
  if (p.includes("security") || p.includes("lock")) return "security"
  if (p.includes("other")) return "others"
  return "others"
}

export function EmergencyPage({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { userLocation, detectLocation, hireRequests, setHireRequests, updateHireRequest, addHireRequest } = useApp()
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [bookingWorker, setBookingWorker] = useState<any | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [dbWorkers, setDbWorkers] = useState<any[]>([])
  const [workerRatings, setWorkerRatings] = useState<Record<string, { given: number; count: number }>>({})

  // Track booking state per worker (persisted)
  const explorerInfo = (() => { try { return JSON.parse(localStorage.getItem("auth_user") || "{}") } catch { return {} } })()
  const [activeBookings, setActiveBookings] = useState<Record<string, "booked" | "completed">>(() => {
    try { return JSON.parse(localStorage.getItem(`emergency_bookings_${explorerInfo.id}`) || "{}") } catch { return {} }
  })
  const [pendingRating, setPendingRating] = useState<{ workerId: string; workerName: string } | null>(null)
  const [ratingStars, setRatingStars] = useState(0)
  const [hoverStar, setHoverStar] = useState(0)

  const saveActiveBookings = (next: Record<string, "booked" | "completed">) => {
    setActiveBookings(next)
    try { localStorage.setItem(`emergency_bookings_${explorerInfo.id}`, JSON.stringify(next)) } catch {}
  }

  // Auto-detect location on mount for distance calculations
  useEffect(() => {
    if (!userLocation || userLocation.status === "idle") {
      detectLocation()
    }
  }, [userLocation, detectLocation])

  // Fetch registered workers from database
  useEffect(() => {
    const fetchDbWorkers = async () => {
      try {
        const res = await fetch("/api/users")
        if (res.ok) {
          const data = await res.json()
          const workers = data.filter((u: any) => {
            if (u.role !== "worker") return false
            const prof = (u.profession || "").toLowerCase()
            return prof.includes("plumb") || prof.includes("electr") || prof.includes("repair") || prof.includes("security") || prof.includes("lock") || prof.includes("other")
          })
          
          const parsed = workers.map((w: any) => {
            let parsedExpectedRates = "₹400"
            let parsedAvailable = true
            let parsedReviews = 0
            
            if (w.bio) {
              try {
                if (w.bio.trim().startsWith("{") && w.bio.trim().endsWith("}")) {
                  const p = JSON.parse(w.bio)
                  if (p.expectedRates?.trim()) parsedExpectedRates = p.expectedRates
                  if (p.available !== undefined) parsedAvailable = p.available
                  if (p.reviewsCount !== undefined) parsedReviews = Number(p.reviewsCount)
                }
              } catch {}
            }
            
            return {
              id: w.id,
              name: w.name,
              service: getServiceFromProfession(w.profession || ""),
              avatar: w.avatar || "",
              rating: w.rating || 0,
              reviews: parsedReviews,
              lat: w.lat || 19.0760,
              lon: w.lon || 72.8777,
              rate: parsedExpectedRates.startsWith("₹") ? parsedExpectedRates : `₹${parsedExpectedRates}`,
              available: parsedAvailable,
              verified: w.verified || false
            }
          })
          setDbWorkers(parsed)
        }
      } catch (err) {
        console.error("Failed to fetch emergency workers:", err)
      }
    }
    fetchDbWorkers()
    const intervalId = setInterval(fetchDbWorkers, 4000)
    return () => clearInterval(intervalId)
  }, [])

  // Combine DB workers and fallback mock workers
  const allWorkers: any[] = [...dbWorkers]
  defaultEmergencyWorkers.forEach(mock => {
    if (!allWorkers.some(w => w.name.toLowerCase() === mock.name.toLowerCase())) {
      allWorkers.push(mock)
    }
  })

  // Calculate distance & ETA dynamically
  const workersWithDistance = allWorkers.map(worker => {
    let distance = worker.defaultDistance || "—"
    let eta = worker.defaultEta || "—"
    let _km = Infinity

    if (userLocation?.status === "success" && worker.lat && worker.lon) {
      const km = haversineKm(userLocation.lat, userLocation.lon, worker.lat, worker.lon)
      distance = formatDistance(km)
      _km = km
      const etaMins = Math.max(5, Math.round(km * 12))
      eta = `${etaMins} min`
    }

    // Calculate average rating based on all ratings given by explorers in hireRequests
    const workerReqs = hireRequests.filter(r => r.workerName === worker.name && typeof r.rating === "number")
    const finalReviews = workerReqs.length > 0 ? workerReqs.length : worker.reviews
    let finalRating = worker.rating
    if (workerReqs.length > 0) {
      const sum = workerReqs.reduce((acc, r) => acc + (r.rating || 0), 0)
      finalRating = Math.round((sum / workerReqs.length) * 10) / 10
    }

    return { ...worker, distance, eta, _km, reviews: finalReviews, rating: finalRating }
  })

  // Filter based on selected category
  const filteredWorkers = selectedService
    ? workersWithDistance.filter(w => w.service === selectedService)
    : workersWithDistance

  // Sort available workers first, then sort by distance
  const sortedWorkers = [...filteredWorkers].sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1
    return a._km - b._km
  })

  const handleEmergencyRequest = (worker: any) => {
    setBookingWorker(worker)
    setConfirmed(false)
  }

  const handleMessageWorker = (workerId: string) => {
    localStorage.setItem("active_chat_other_user_id", workerId)
    setActiveTab?.("messages")
  }

  const handleConfirmBooking = () => {
    if (!bookingWorker) return
    setConfirmed(true)
    setTimeout(() => {
      // Add as hire request so worker's My Jobs page receives it
      addHireRequest({
        workerId: String(bookingWorker.id),
        explorerId: String(explorerInfo.id),
        workerName: bookingWorker.name,
        workerProfession: emergencyServices.find(s => s.id === bookingWorker.service)?.label || "Emergency",
        workerAvatar: bookingWorker.avatar || "",
        explorerName: explorerInfo.name || "Explorer",
        explorerAvatar: explorerInfo.avatar || "",
        explorerPhone: explorerInfo.phone || "",
        jobTitle: "Emergency Job",
        location: "Emergency",
        startDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        dailyRate: "",
        message: "",
      })
      setBookingWorker(null)
      setConfirmed(false)
    }, 1500)
  }

  const handleMarkCompleted = (workerId: string, workerName: string) => {
    // Find the active request and mark it completed
    const req = [...hireRequests]
      .reverse()
      .find(r => r.workerName === workerName && r.explorerName === explorerInfo.name && r.location === "Emergency" && r.status === "Accepted")
    if (req) {
      updateHireRequest(req.id, "Completed")
    }

    // Prompt for rating
    setPendingRating({ workerId, workerName })
    setRatingStars(0)
    setHoverStar(0)
  }

  const handleSubmitRating = () => {
    if (!pendingRating || ratingStars === 0) return

    // Find the most recent completed but unrated request for this worker
    const targetReq = [...hireRequests]
      .reverse()
      .find(r => r.workerName === pendingRating.workerName && r.explorerName === explorerInfo.name && r.location === "Emergency" && r.status === "Completed" && !r.rating)

    const updatedHireRequests = hireRequests.map(r => {
      if (targetReq && r.id === targetReq.id) {
        return { ...r, rating: ratingStars }
      }
      return r
    })

    // Save to context
    setHireRequests(updatedHireRequests)

    // Calculate average rating of all ratings given by explorers
    const workerRatingsList = updatedHireRequests
      .filter(r => r.workerName === pendingRating.workerName && typeof r.rating === "number")
      .map(r => r.rating as number)

    let newAvg = ratingStars
    if (workerRatingsList.length > 0) {
      const sum = workerRatingsList.reduce((a, b) => a + b, 0)
      newAvg = Math.round((sum / workerRatingsList.length) * 10) / 10
    }

    // Update database
    fetch(`/api/users/${pendingRating.workerId}`)
      .then(res => res.json())
      .then(dbUser => {
        let bioJSON: any = { bio: "", experience: "", workerType: "emergency", coverImage: "", expectedRates: "", available: true, reviewsCount: 0 }
        if (dbUser.bio) {
          try {
            if (dbUser.bio.trim().startsWith("{") && dbUser.bio.trim().endsWith("}")) {
              bioJSON = JSON.parse(dbUser.bio)
            } else {
              bioJSON.bio = dbUser.bio
            }
          } catch {}
        }
        bioJSON.reviewsCount = workerRatingsList.length
        const newBioString = JSON.stringify(bioJSON)

        fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: pendingRating.workerId, rating: newAvg, bio: newBioString })
        })
          .then(res => {
            if (res.ok) {
              setDbWorkers(prev => prev.map(w => w.id === pendingRating.workerId ? { ...w, rating: newAvg, reviews: workerRatingsList.length } : w))
            }
          })
          .catch(err => console.error("Error updating worker rating/bio in DB:", err))
      })
      .catch(err => {
        fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: pendingRating.workerId, rating: newAvg })
        })
          .then(res => {
            if (res.ok) {
              setDbWorkers(prev => prev.map(w => w.id === pendingRating.workerId ? { ...w, rating: newAvg } : w))
            }
          })
          .catch(err => console.error("Error updating worker rating in DB:", err))
      })

    setPendingRating(null)
    setRatingStars(0)
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">


      {/* Service Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-xl text-slate-950 dark:text-white">Choose service</h2>
            <p className="text-sm text-slate-500">Select a category to filter available technicians.</p>
          </div>
          <span className="text-sm text-slate-500">
            {sortedWorkers.filter(w => w.available).length} technicians online
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {emergencyServices.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
              className={cn(
                "group flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200",
                selectedService === service.id
                  ? "border-slate-900 bg-slate-900 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                selectedService === service.id ? "bg-white border-white" : "bg-white border-slate-900"
              )}>
                <service.icon className="w-3.5 h-3.5 text-slate-900" />
              </div>
              <div>
                <h3 className={cn("text-sm font-semibold", selectedService === service.id ? "text-white" : "text-slate-950")}>{service.label}</h3>
                <p className={cn("mt-0.5 text-xs leading-normal", selectedService === service.id ? "text-slate-300" : "text-slate-500")}>{service.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Available Workers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Available team</p>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Technicians nearby</h2>
          </div>
          <span className="text-sm text-slate-500">
            {sortedWorkers.filter(w => w.available).length} available
          </span>
        </div>

        <div className="space-y-3">
          {sortedWorkers.map((worker) => {
            const req = hireRequests.filter(r => r.workerName === worker.name && r.explorerName === explorerInfo.name && r.location === "Emergency")
              .sort((a, b) => b.id - a.id)[0]
            const bookingState = (req && !(req.status === "Completed" && req.rating)) ? req.status : null

            return (
              <div key={worker.id} className="group flex items-center gap-4 rounded-2xl border border-slate-200/75 bg-white px-5 py-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-card dark:border-border">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <Avatar className="w-14 h-14 ring-2 ring-white shadow-sm">
                    <AvatarImage src={worker.avatar} alt={worker.name} />
                    <AvatarFallback>{worker.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className={cn("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white", worker.available ? "bg-emerald-500" : "bg-slate-400")} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-950 dark:text-card-foreground truncate">{worker.name}</h3>
                    {worker.available ? (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-emerald-700">Available</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-slate-600">Busy</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{emergencyServices.find((item) => item.id === worker.service)?.label ?? "Service"}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {worker.reviews > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {worker.rating} <span className="text-slate-400">({worker.reviews})</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No reviews yet</span>
                    )}
                    {worker.distance && worker.distance !== "0 m" && worker.distance !== "0m" && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" />{worker.distance}</span>
                      </>
                    )}
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" />{worker.eta}</span>
                  </div>
                  {bookingState === "Pending" && (
                    <p className="text-xs text-primary font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-pulse" /> Pending worker acceptance…
                    </p>
                  )}
                  {bookingState === "Accepted" && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> On the way…
                    </p>
                  )}
                  {bookingState === "Rejected" && (
                    <p className="text-xs text-red-500 font-medium">
                      Request declined. You can book again.
                    </p>
                  )}
                </div>

                {/* Price + Actions */}
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-base font-bold text-slate-950 dark:text-card-foreground">{worker.rate}</p>
                    <p className="text-[0.6rem] uppercase tracking-widest text-slate-400">visit charge</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full border-slate-200 hover:bg-slate-50 hover:text-primary text-slate-500"
                      onClick={() => handleMessageWorker(worker.id)}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    {bookingState === "Pending" ? (
                      <Button size="sm" className="h-9 px-4 rounded-full bg-primary text-white font-medium pointer-events-none shadow-sm">
                        Requested
                      </Button>
                    ) : bookingState === "Accepted" ? (
                      <Button size="sm" className="h-9 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleMarkCompleted(worker.id, worker.name)}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Mark Complete
                      </Button>
                    ) : bookingState === "Completed" ? (
                      req.rating ? (
                        <span className="text-xs font-semibold text-slate-400 px-2">✓ Done</span>
                      ) : (
                        <Button size="sm" className="h-9 px-4 rounded-full bg-primary hover:bg-primary/90 text-white"
                          onClick={() => {
                            setPendingRating({ workerId: worker.id, workerName: worker.name })
                            setRatingStars(0)
                            setHoverStar(0)
                          }}>
                          Rate Service
                        </Button>
                      )
                    ) : (
                      <Button size="sm" className="h-9 px-4 rounded-full"
                        onClick={() => handleEmergencyRequest(worker)}
                        disabled={!worker.available}>
                        {worker.available ? "Book Now" : "Busy"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {bookingWorker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {confirmed ? (
              <div className="flex flex-col items-center justify-center p-10 gap-3">
                <Clock className="w-14 h-14 text-primary animate-pulse" />
                <h3 className="text-lg font-bold text-slate-900">Request Sent!</h3>
                <p className="text-sm text-slate-500 text-center">Waiting for {bookingWorker.name} to accept your emergency request.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">Confirm Booking</h3>
                  <button onClick={() => setBookingWorker(null)} className="p-1 rounded-full hover:bg-slate-100">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={bookingWorker.avatar} />
                      <AvatarFallback>{bookingWorker.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 text-sm">{bookingWorker.name}</p>
                      <p className="text-xs text-slate-500">{emergencyServices.find(s => s.id === bookingWorker.service)?.label}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {bookingWorker.rating}
                        {bookingWorker.distance && bookingWorker.distance !== "0 m" && bookingWorker.distance !== "0m" && bookingWorker.distance !== "0 m away" && bookingWorker.distance !== "0m away" && (
                          <> · {bookingWorker.distance} away</>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{bookingWorker.rate}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">visit charge</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-violet-50 border border-violet-100 dark:bg-violet-950/20 dark:border-violet-900/30 rounded-xl px-3 py-2">
                    <CalendarClock className="w-4 h-4 text-primary shrink-0" />
                    <span>Estimated arrival: <span className="font-semibold text-primary">{bookingWorker.eta}</span></span>
                  </div>
                  <Button className="w-full rounded-xl" onClick={handleConfirmBooking}>
                    Confirm &amp; Book
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rating Modal after completion */}
      {pendingRating && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-center">Rate {pendingRating.workerName}</h3>
            <p className="text-sm text-slate-500 text-center">How was the service?</p>
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(s => (
                <button key={s}
                  onMouseEnter={() => setHoverStar(s)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => setRatingStars(s)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={cn("w-8 h-8", (hoverStar || ratingStars) >= s ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200")} />
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setPendingRating(null)}>Skip</Button>
              <Button className="flex-1 rounded-xl" disabled={ratingStars === 0} onClick={handleSubmitRating}>Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

