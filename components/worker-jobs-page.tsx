"use client"

import { useState, useEffect } from "react"
import {
  Briefcase, Plus, CheckCircle, Clock, MapPin, Phone, Calendar,
  Star, X, ChevronDown, ChevronUp, HardHat, MessageCircle,
  UserCheck, Bell, ClipboardCheck, History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useApp } from "@/context/app-context"

interface LoggedJob {
  id: number
  title: string
  employer: string
  location: string
  phone: string
  startDate: string
  endDate?: string
  dailyRate: string
  description: string
  status: "Active" | "Completed"
  rating: number | null
  review: string | null
}

const emptyJob: Omit<LoggedJob, "id" | "status" | "rating" | "review"> = {
  title: "", employer: "", location: "", phone: "",
  startDate: "", endDate: "", dailyRate: "", description: "",
}

type JobsTab = "requests" | "current" | "completed" | "log"

export function WorkerJobsPage({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { hireRequests, updateHireRequest, conversations, setConversations, setSelectedConversation } = useApp()
  const [tab, setTab] = useState<JobsTab>("requests")
  const [loggedJobs, setLoggedJobs] = useState<LoggedJob[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyJob)
  const [formSaved, setFormSaved] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [ratingDraft, setRatingDraft] = useState<{ [id: number]: { rating: number; review: string } }>({})

  // Get this worker's name from localStorage
  const workerName = (() => {
    try { return JSON.parse(localStorage.getItem("auth_user") || "{}").name || "" } catch { return "" }
  })()

  const [available, setAvailable] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) {
        const user = JSON.parse(stored)
        if (user.bio) {
          if (user.bio.trim().startsWith("{") && user.bio.trim().endsWith("}")) {
            const p = JSON.parse(user.bio)
            if (p.available !== undefined) {
              setAvailable(p.available)
            }
          }
        }
      }
    } catch {}
  }, [])

  const toggleAvailability = async (newVal: boolean) => {
    setAvailable(newVal)
    try {
      const stored = localStorage.getItem("auth_user")
      if (!stored) return
      const user = JSON.parse(stored)
      if (!user.id) return

      let bioJSON: any = { bio: "", experience: "", workerType: "normal", coverImage: "", expectedRates: "" }
      if (user.bio) {
        try {
          if (user.bio.trim().startsWith("{") && user.bio.trim().endsWith("}")) {
            bioJSON = JSON.parse(user.bio)
          } else {
            bioJSON.bio = user.bio
          }
        } catch {}
      }

      bioJSON.available = newVal
      const newBioString = JSON.stringify(bioJSON)

      user.bio = newBioString
      localStorage.setItem("auth_user", JSON.stringify(user))

      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, bio: newBioString })
      })
    } catch (err) {
      console.error("Failed to update availability status:", err)
    }
  }

  const handleMessageExplorer = async (explorerName: string) => {
    let explorerUserId: string | null = null
    let explorerAvatar = ""
    let explorerProfession = "Explorer"
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const users = await res.json()
        const found = users.find((u: any) => u.name === explorerName)
        if (found) {
          explorerUserId = String(found.id)
          explorerAvatar = found.avatar || ""
          explorerProfession = found.profession || "Explorer"
        }
      }
    } catch (err) {
      console.error("Failed to fetch explorer user:", err)
    }

    try {
      const stored = localStorage.getItem("auth_user")
      if (stored && explorerUserId) {
        const currentUser = JSON.parse(stored)
        if (currentUser.id) {
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id, otherUserId: explorerUserId })
          })
        }
      }
    } catch (err) {
      console.error("Failed to create conversation in DB:", err)
    }

    const existing = conversations.find(c => c.name === explorerName)
    if (existing) {
      setSelectedConversation(existing)
    } else {
      const newConv = {
        id: Date.now(),
        name: explorerName,
        profession: explorerProfession,
        avatar: explorerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(explorerName)}`,
        lastMessage: "Start a conversation",
        timestamp: "Just now",
        unread: 0,
        isOnline: true,
        messages: [],
      }
      setConversations(prev => [newConv, ...prev])
      setSelectedConversation(newConv)
    }
    setActiveTab?.("messages")
  }

  // Filter hire requests directed to this worker only (exact name match)
  const myRequests = workerName
    ? hireRequests.filter(r => r.workerName === workerName)
    : []
  const pendingRequests = myRequests.filter(r => r.status === "Pending")
  const acceptedRequests = myRequests.filter(r => r.status === "Accepted")
  const currentJobs = loggedJobs.filter(j => j.status === "Active")
  const completedJobs = loggedJobs.filter(j => j.status === "Completed")

  const handleAddJob = () => {
    if (!form.title.trim() || !form.employer.trim() || !form.startDate) return
    setLoggedJobs(prev => [{ ...form, id: Date.now(), status: "Active", rating: null, review: null }, ...prev])
    setFormSaved(true)
    setTimeout(() => { setFormSaved(false); setShowForm(false); setForm(emptyJob) }, 1500)
  }

  const markComplete = (id: number) => {
    setLoggedJobs(prev => prev.map(j =>
      j.id === id ? { ...j, status: "Completed" as const, endDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) } : j
    ))
  }

  const submitRating = (id: number) => {
    const d = ratingDraft[id]
    if (!d?.rating) return
    setLoggedJobs(prev => prev.map(j => j.id === id ? { ...j, rating: d.rating, review: d.review } : j))
  }

  const tabConfig: { id: JobsTab; label: string; icon: React.ReactNode; count?: number; alert?: boolean }[] = [
    { id: "requests",  label: "Requests",  icon: <Bell className="w-4 h-4" />,          count: pendingRequests.length, alert: pendingRequests.length > 0 },
    { id: "current",   label: "Current",   icon: <UserCheck className="w-4 h-4" />,      count: currentJobs.length + acceptedRequests.length },
    { id: "completed", label: "Completed", icon: <ClipboardCheck className="w-4 h-4" />, count: completedJobs.length },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-amber-600" /> My Jobs
          </h1>
          <p className="text-muted-foreground text-sm">
            {pendingRequests.length} new request{pendingRequests.length !== 1 ? "s" : ""} · {currentJobs.length + acceptedRequests.length} active
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="flex bg-secondary p-1 rounded-xl gap-1 shrink-0 border border-border self-start sm:self-auto">
          <button
            onClick={() => toggleAvailability(true)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
              available
                ? "bg-green-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", available ? "bg-white animate-pulse" : "bg-green-500")} />
            Available
          </button>
          <button
            onClick={() => toggleAvailability(false)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
              !available
                ? "bg-slate-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", !available ? "bg-white" : "bg-slate-400")} />
            Busy
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary rounded-2xl p-1 gap-1">
        {tabConfig.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-xs font-semibold transition-all relative",
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {t.icon}
            <span>{t.label}</span>
            {t.count !== undefined && t.count > 0 && (
              <span className={cn("absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center",
                t.alert ? "bg-red-500 text-white" : "bg-amber-500 text-white")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── REQUESTS TAB ── */}
      {tab === "requests" && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <EmptyState icon={<Bell className="w-10 h-10 text-amber-300" />}
              title="No hire requests yet"
              desc="When explorers want to hire you, their requests will appear here" />
          ) : pendingRequests.map(req => (
            <div key={req.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img src={req.explorerAvatar || "/placeholder-user.jpg"}
                  alt={req.explorerName} className="w-12 h-12 rounded-full object-cover shrink-0"
                  onError={e => { e.currentTarget.src = "/placeholder-user.jpg" }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-card-foreground">{req.explorerName}</p>
                  <p className="text-xs text-muted-foreground">{req.date}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium shrink-0">Pending</span>
              </div>
              <div className="bg-secondary rounded-xl p-3 space-y-1.5 text-sm">
                <p className="font-semibold text-card-foreground">{req.jobTitle}</p>
                {req.location && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{req.location}</div>}
                {req.startDate && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="w-3.5 h-3.5" />Start: {req.startDate}</div>}
                {req.dailyRate && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="font-medium text-card-foreground">₹{req.dailyRate}/day</span></div>}
                {req.explorerPhone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3.5 h-3.5" />{req.explorerPhone}</div>}
                {req.message && <p className="text-xs text-muted-foreground italic">"{req.message}"</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                  onClick={() => updateHireRequest(req.id, "Accepted")}>
                  <CheckCircle className="w-3.5 h-3.5" /> Accept
                </Button>
                <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs gap-1.5 border-red-200 text-red-500 hover:bg-red-50"
                  onClick={() => updateHireRequest(req.id, "Rejected")}>
                  <X className="w-3.5 h-3.5" /> Decline
                </Button>
                {setActiveTab && (
                  <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 px-3"
                    onClick={() => handleMessageExplorer(req.explorerName)}>
                    <MessageCircle className="w-3.5 h-3.5" /> Message
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CURRENT JOBS TAB ── */}
      {tab === "current" && (
        <div className="space-y-3">
          {/* Accepted hire requests showing as current jobs */}
          {acceptedRequests.length > 0 && acceptedRequests.map(req => (
            <div key={req.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img src={req.explorerAvatar || "/placeholder-user.jpg"}
                  alt={req.explorerName} className="w-12 h-12 rounded-full object-cover shrink-0"
                  onError={e => { e.currentTarget.src = "/placeholder-user.jpg" }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-card-foreground">{req.explorerName}</p>
                  <p className="text-xs text-muted-foreground">{req.date}</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium shrink-0">Hired</span>
              </div>
              <div className="bg-secondary rounded-xl p-3 space-y-1.5 text-sm">
                <p className="font-semibold text-card-foreground">{req.jobTitle}</p>
                {req.location && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{req.location}</div>}
                {req.startDate && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="w-3.5 h-3.5" />Start: {req.startDate}</div>}
                {req.dailyRate && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="font-medium text-card-foreground">₹{req.dailyRate}/day</span></div>}
                {req.explorerPhone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3.5 h-3.5" />{req.explorerPhone}</div>}
                {req.message && <p className="text-xs text-muted-foreground italic">"{req.message}"</p>}
              </div>
              <div className="flex justify-end gap-2">
                {setActiveTab && (
                  <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 px-3"
                    onClick={() => handleMessageExplorer(req.explorerName)}>
                    <MessageCircle className="w-3.5 h-3.5" /> Message
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Manually logged active jobs */}
          {currentJobs.length > 0 && currentJobs.map(job => (
            <LoggedJobCard key={job.id} job={job}
              expanded={expandedId === job.id}
              onToggle={() => setExpandedId(expandedId === job.id ? null : job.id)}
              onComplete={() => markComplete(job.id)}
              setActiveTab={setActiveTab} />
          ))}

          {acceptedRequests.length === 0 && currentJobs.length === 0 && (
            <EmptyState icon={<UserCheck className="w-10 h-10 text-blue-300" />}
              title="No active jobs" desc="Accept a hire request or log a job to see it here" />
          )}
        </div>
      )}

      {/* ── COMPLETED JOBS TAB ── */}
      {tab === "completed" && (
        <div className="space-y-3">
          {/* Completed hire requests */}
          {myRequests.filter(r => r.status === "Completed" || r.status === "Rejected").map(req => (
            <div key={req.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img src={req.explorerAvatar || "/placeholder-user.jpg"}
                  alt={req.explorerName} className="w-12 h-12 rounded-full object-cover shrink-0"
                  onError={e => { e.currentTarget.src = "/placeholder-user.jpg" }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-card-foreground">{req.explorerName}</p>
                  <p className="text-xs text-muted-foreground">{req.date}</p>
                </div>
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium shrink-0",
                  req.status === "Completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>
                  {req.status}
                </span>
              </div>
              <div className="bg-secondary rounded-xl p-3 space-y-1.5 text-sm">
                <p className="font-semibold text-card-foreground">{req.jobTitle}</p>
                {req.location && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{req.location}</div>}
                {req.startDate && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="w-3.5 h-3.5" />Start: {req.startDate}</div>}
                {req.dailyRate && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="font-medium text-card-foreground">₹{req.dailyRate}/day</span></div>}
                {req.explorerPhone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3.5 h-3.5" />{req.explorerPhone}</div>}
                {req.message && <p className="text-xs text-muted-foreground italic">"{req.message}"</p>}
              </div>
              <div className="flex justify-end gap-2">
                {setActiveTab && (
                  <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 px-3"
                    onClick={() => handleMessageExplorer(req.explorerName)}>
                    <MessageCircle className="w-3.5 h-3.5" /> Message
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Manually logged completed jobs */}
          {completedJobs.map(job => (
            <div key={job.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-card-foreground">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.employer}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium shrink-0">Done</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {job.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</div>}
                <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{job.startDate}{job.endDate ? ` → ${job.endDate}` : ""}</div>
                {job.dailyRate && <span className="font-medium text-card-foreground">₹{job.dailyRate}/day</span>}
              </div>
              {/* Self-rating */}
              {!job.rating ? (
                <div className="space-y-2 pt-1 border-t border-border">
                  <p className="text-xs text-muted-foreground">Rate your own performance:</p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setRatingDraft(prev => ({ ...prev, [job.id]: { rating: s, review: prev[job.id]?.review ?? "" } }))}
                        className="hover:scale-110 transition-transform">
                        <Star className={cn("w-5 h-5", s <= (ratingDraft[job.id]?.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                      </button>
                    ))}
                  </div>
                  {(ratingDraft[job.id]?.rating ?? 0) > 0 && (
                    <div className="flex gap-2">
                      <input type="text" value={ratingDraft[job.id]?.review ?? ""}
                        onChange={e => setRatingDraft(prev => ({ ...prev, [job.id]: { rating: prev[job.id]?.rating ?? 0, review: e.target.value } }))}
                        placeholder="Note about this job..."
                        className="flex-1 h-8 px-3 rounded-xl bg-secondary border-0 text-xs text-card-foreground placeholder:text-muted-foreground focus:outline-none" />
                      <button onClick={() => submitRating(job.id)} className="text-xs font-semibold text-amber-600 hover:underline shrink-0">Save</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 pt-1 border-t border-border">
                  {[1,2,3,4,5].map(s => <Star key={s} className={cn("w-4 h-4", s <= job.rating! ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />)}
                  {job.review && <p className="text-xs text-muted-foreground ml-1 italic">"{job.review}"</p>}
                </div>
              )}
            </div>
          ))}

          {myRequests.filter(r => r.status === "Completed" || r.status === "Rejected").length === 0 && completedJobs.length === 0 && (
            <EmptyState icon={<History className="w-10 h-10 text-muted-foreground/30" />}
              title="No completed jobs yet" desc="Completed jobs will appear here" />
          )}
        </div>
      )}


    </div>
  )
}

function LoggedJobCard({ job, expanded, onToggle, onComplete, setActiveTab }: {
  job: { id: number; title: string; employer: string; location: string; phone: string; startDate: string; dailyRate: string; description: string }
  expanded: boolean; onToggle: () => void; onComplete: () => void; setActiveTab?: (t: string) => void
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-card-foreground">{job.title}</p>
          <p className="text-xs text-muted-foreground">{job.employer}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">Active</span>
          <button onClick={onToggle} className="p-1 rounded-full hover:bg-secondary">
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {job.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</div>}
        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />Since {job.startDate}</div>
        {job.dailyRate && <span className="font-medium text-card-foreground">₹{job.dailyRate}/day</span>}
      </div>
      {expanded && (
        <div className="space-y-1 pt-1 border-t border-border">
          {job.description && <p className="text-sm text-muted-foreground">{job.description}</p>}
          {job.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3.5 h-3.5" />{job.phone}</div>}
        </div>
      )}
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5" onClick={onComplete}>
          <CheckCircle className="w-3.5 h-3.5" /> Mark Complete
        </Button>
        {setActiveTab && (
          <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5" onClick={() => setActiveTab("messages")}>
            <MessageCircle className="w-3.5 h-3.5" /> Message
          </Button>
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">{icon}</div>
      <p className="font-semibold text-lg text-card-foreground">{title}</p>
      <p className="text-sm text-center">{desc}</p>
    </div>
  )
}
