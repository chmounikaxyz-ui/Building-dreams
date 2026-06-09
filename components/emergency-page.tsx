"use client"

import { useState, useEffect } from "react"
import { Phone, MapPin, Clock, Star, AlertTriangle, Zap, Droplets, Wrench, Shield, CheckCircle, X, CalendarClock } from "lucide-react"
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
    id: "repair",
    label: "General Repair",
    icon: Wrench,
    description: "Door, window, wall damage"
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

const defaultEmergencyWorkers = [
  {
    id: "mock-1",
    name: "Rajesh Helper",
    service: "others",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 4.9,
    reviews: 234,
    lat: 19.0820,
    lon: 72.8820,
    defaultDistance: "0.8 km",
    defaultEta: "15 min",
    rate: "₹500",
    available: true,
    verified: true
  },
  {
    id: "mock-2",
    name: "Amit Electrician",
    service: "electrical",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    rating: 4.8,
    reviews: 189,
    lat: 19.0850,
    lon: 72.8850,
    defaultDistance: "1.2 km",
    defaultEta: "20 min",
    rate: "₹400",
    available: true,
    verified: true
  },
  {
    id: "mock-3",
    name: "Sunil Repairs",
    service: "repair",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    rating: 4.7,
    reviews: 156,
    lat: 19.0880,
    lon: 72.8880,
    defaultDistance: "1.5 km",
    defaultEta: "25 min",
    rate: "₹350",
    available: true,
    verified: true
  },
  {
    id: "mock-4",
    name: "Quick Lock Service",
    service: "security",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face",
    rating: 4.6,
    reviews: 98,
    lat: 19.0920,
    lon: 72.8920,
    defaultDistance: "2.1 km",
    defaultEta: "30 min",
    rate: "₹600",
    available: true,
    verified: true
  },
]

const getServiceFromProfession = (prof: string): string => {
  const p = prof.toLowerCase()
  if (p.includes("plumb")) return "others"
  if (p.includes("electr")) return "electrical"
  if (p.includes("repair")) return "repair"
  if (p.includes("security") || p.includes("lock")) return "security"
  if (p.includes("other")) return "others"
  return "repair"
}

export function EmergencyPage() {
  const { userLocation, detectLocation, hireRequests, setHireRequests, updateHireRequest } = useApp()
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

    // Apply any ratings given by this explorer
    const myRating = workerRatings[worker.id]
    const finalReviews = myRating ? (worker.reviews + 1) : worker.reviews
    const finalRating = myRating
      ? Math.round(((worker.rating * worker.reviews + myRating.given) / finalReviews) * 10) / 10
      : worker.rating

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

  const handleConfirmBooking = () => {
    if (!bookingWorker) return
    setConfirmed(true)
    setTimeout(() => {
      // Persist booking
      const next = { ...activeBookings, [bookingWorker.id]: "booked" as const }
      saveActiveBookings(next)
      // Add as hire request so worker's My Jobs page receives it
      const newRequest = {
        id: Date.now(),
        workerName: bookingWorker.name,
        workerProfession: emergencyServices.find(s => s.id === bookingWorker.service)?.label || "Emergency",
        workerAvatar: bookingWorker.avatar || "",
        explorerName: explorerInfo.name || "Explorer",
        startDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        location: "Emergency",
        status: "Accepted" as const,
        hiddenFromExplorer: false,
      }
      setHireRequests((prev: any[]) => [newRequest, ...prev])
      setBookingWorker(null)
      setConfirmed(false)
    }, 1500)
  }

  const handleMarkCompleted = (workerId: string, workerName: string) => {
    const next = { ...activeBookings, [workerId]: "completed" as const }
    saveActiveBookings(next)
    // Prompt for rating
    setPendingRating({ workerId, workerName })
    setRatingStars(0)
    setHoverStar(0)
  }

  const handleSubmitRating = () => {
    if (!pendingRating || ratingStars === 0) return
    setWorkerRatings(prev => ({ ...prev, [pendingRating.workerId]: { given: ratingStars, count: 1 } }))
    setPendingRating(null)
    setRatingStars(0)
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Emergency Header */}
      <div className="rounded-3xl border border-purple-400/20 p-6 text-white" style={{background: 'oklch(0.55 0.25 290)', boxShadow: '0 20px 80px -40px rgba(109,40,217,0.4)'}}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Emergency response</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Rapid repair teams ready now</h1>
            <p className="max-w-2xl mt-2 text-sm leading-6 text-slate-300">
              Trusted contractors for urgent plumbing, electrical, security, and repair needs. Get a verified technician dispatched within minutes.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-purple-200">Average response</p>
            <p className="mt-2 text-xl font-semibold text-white">20 min</p>
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-purple-200">Trusted network</p>
            <p className="mt-2 text-xl font-semibold text-white">150+ technicians</p>
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-purple-200">Coverage</p>
            <p className="mt-2 text-xl font-semibold text-white">24/7 support</p>
          </div>
        </div>
      </div>

      {/* Service Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-xl text-slate-950 dark:text-white">Choose service</h2>
            <p className="text-sm text-slate-500">Select a category to filter available technicians.</p>
          </div>
          <span className="text-sm text-slate-500">{sortedWorkers.length} technicians online</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {emergencyServices.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
              className={cn(
                "group flex items-start gap-4 rounded-3xl border p-5 text-left transition-all duration-200",
                selectedService === service.id
                  ? "border-slate-900 bg-slate-900 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className={cn("mt-1 flex h-10 w-10 items-center justify-center rounded-xl border-2",
                selectedService === service.id ? "bg-white border-white" : "bg-white border-slate-900"
              )}>
                <service.icon className="w-4 h-4 text-slate-900" />
              </div>
              <div>
                <h3 className={cn("text-base font-semibold", selectedService === service.id ? "text-white" : "text-slate-950")}>{service.label}</h3>
                <p className={cn("mt-1 text-sm leading-6", selectedService === service.id ? "text-slate-300" : "text-slate-500")}>{service.description}</p>
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
          <span className="text-sm text-slate-500">{sortedWorkers.length} nearby</span>
        </div>

        <div className="space-y-3">
          {sortedWorkers.map((worker) => {
            const bookingState = activeBookings[worker.id]
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
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" />{worker.distance}</span>
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" />{worker.eta}</span>
                  </div>
                  {bookingState === "booked" && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> On the way…
                    </p>
                  )}
                  {bookingState === "completed" && workerRatings[worker.id] && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> You rated {workerRatings[worker.id].given}/5
                    </p>
                  )}
                </div>

                {/* Price + Actions */}
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-base font-bold text-slate-950 dark:text-card-foreground">{worker.rate}</p>
                    <p className="text-[0.6rem] uppercase tracking-widest text-slate-400">visit charge</p>
                  </div>
                  {bookingState === "booked" ? (
                    <Button size="sm" className="h-9 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleMarkCompleted(worker.id, worker.name)}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Mark Complete
                    </Button>
                  ) : bookingState === "completed" ? (
                    <span className="text-xs font-semibold text-slate-400 px-2">✓ Done</span>
                  ) : (
                    <Button size="sm" className="h-9 px-4 rounded-full"
                      onClick={() => handleEmergencyRequest(worker)}
                      disabled={!worker.available}>
                      {worker.available ? "Book Now" : "Busy"}
                    </Button>
                  )}
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
                <CheckCircle className="w-14 h-14 text-emerald-500" />
                <h3 className="text-lg font-bold text-slate-900">Booking Confirmed!</h3>
                <p className="text-sm text-slate-500 text-center">{bookingWorker.name} is on the way. ETA: {bookingWorker.eta}</p>
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
                        {bookingWorker.rating} · {bookingWorker.distance} away
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{bookingWorker.rate}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">visit charge</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <CalendarClock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Estimated arrival: <span className="font-semibold text-amber-700">{bookingWorker.eta}</span></span>
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

