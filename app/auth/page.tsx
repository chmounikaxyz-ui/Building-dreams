"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  HardHat, Eye, EyeOff, ArrowRight, Mail, Lock, User,
  Briefcase, Store, Compass, Wrench, Phone, Building2, CheckCircle, X, CreditCard, QrCode, MapPin, Banknote
} from "lucide-react"
import { getCurrentPosition, reverseGeocode } from "@/lib/location"

type Role = "explorer" | "worker" | "seller"

const roles: { id: Role; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  {
    id: "explorer",
    label: "Explorer",
    icon: <Compass className="w-6 h-6" />,
    desc: "Browse workers, hire professionals & buy materials",
    color: "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-950/40",
  },
  {
    id: "worker",
    label: "Worker",
    icon: <HardHat className="w-6 h-6" />,
    desc: "Offer your construction skills & get hired",
    color: "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-950/40",
  },
  {
    id: "seller",
    label: "Seller",
    icon: <Store className="w-6 h-6" />,
    desc: "List and sell construction materials",
    color: "border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-950/40",
  },
]

const workerSkills = [
  "Mason", "Carpenter", "Electrician", "Painter",
  "Civil Engineer", "Architect", "Steel Fabricator", "Tiler",
  "HVAC Technician", "Welder", "Interior Designer", "Labor",
  "Other",
]

const emergencySkills = ["Electrical", "Plumber", "Security", "Others"]

export default function AuthPage() {
  const router = useRouter()
  const { login, signup, loading } = useAuth()
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const [showPassword, setShowPassword] = useState(false)

  // Login fields
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Signup common
  const [role, setRole] = useState<Role>("explorer")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [detecting, setDetecting] = useState(false)

  const handleDetectLocation = async () => {
    setDetecting(true)
    setError("")
    try {
      const pos = await getCurrentPosition()
      const { latitude, longitude } = pos.coords
      setLat(latitude)
      setLon(longitude)
      const city = await reverseGeocode(latitude, longitude)
      setLocation(city)
    } catch (err: any) {
      setError("Failed to get location automatically. Please enter it manually.")
    } finally {
      setDetecting(false)
    }
  }

  // Worker-specific
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [experience, setExperience] = useState("")
  const [workerType, setWorkerType] = useState<"normal" | "emergency" | "">("")
  const [customSkill, setCustomSkill] = useState("")

  // Seller-specific
  const [businessName, setBusinessName] = useState("")
  const [expectedRates, setExpectedRates] = useState("")

  // UPI & Bank details (Worker / Seller only)
  const [upiId, setUpiId] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [bankIfsc, setBankIfsc] = useState("")

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? [] : [skill]
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      await login(loginEmail, loginPassword)
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Invalid email or password")
    }
  }

  // ── Validation helpers ──────────────────────────────────────────────
  const validatePhone = (p: string) => /^[6-9]\d{9}$/.test(p.replace(/[\s\-\+]/g, "").replace(/^91/, ""))
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)
  const validateUPI   = (u: string) => !u || /^[a-zA-Z0-9._\-]+@[a-zA-Z]{3,}$/.test(u)
  const validateIFSC  = (i: string) => !i || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(i)
  const validateBankAccount = (a: string) => !a || /^\d{9,18}$/.test(a)
  // ────────────────────────────────────────────────────────────────────

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // ── Frontend validation ──────────────────────────────────────────
    if (!validateEmail(email)) {
      setError("Please enter a valid email address (e.g. name@example.com)")
      return
    }
    const cleanPhone = phone.replace(/[\s\-\+]/g, "").replace(/^91/, "")
    if (!cleanPhone || !validatePhone(phone)) {
      setError("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }
    if (role === "worker") {
      if (!workerType) {
        setError("Please select whether you are a Normal Worker or an Emergency Worker")
        return
      }
      if (selectedSkills.length === 0) {
        setError("Please select at least one skill")
        return
      }
      if (selectedSkills.includes("Other") && !customSkill.trim()) {
        setError("Please enter your skill")
        return
      }
    }
    const needsPayment = role === "seller"
    if (needsPayment) {
      if (!upiId) {
        setError("Please enter your UPI ID")
        return
      }
      if (!validateUPI(upiId)) {
        setError("Invalid UPI ID format. It should look like: name@upi or name@okaxis")
        return
      }
    }
    // ────────────────────────────────────────────────────────────────

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          profession: role === "worker"
            ? (selectedSkills[0] === "Other" ? (customSkill.trim() || "Other") : selectedSkills[0])
            : role === "seller" ? "Materials Seller" : "Explorer",
          phone,
          location: location || undefined,
          lat: lat ?? undefined,
          lon: lon ?? undefined,
          upiId: needsPayment ? upiId : undefined,
          bankAccount: needsPayment ? bankAccount : undefined,
          bankIfsc: needsPayment ? bankIfsc : undefined,
          businessName: role === "seller" ? businessName : undefined,
          skills: role === "worker"
            ? (selectedSkills.includes("Other") ? [customSkill.trim() || "Other"] : selectedSkills)
            : undefined,
          experience: (role === "worker" || role === "seller") ? experience : undefined,
          expectedRates: role === "worker" ? expectedRates : undefined,
          workerType: role === "worker" ? workerType : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Signup failed")

      // Store user + token directly (same as auth context login does)
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("auth_user", JSON.stringify(data.user))
      window.dispatchEvent(new CustomEvent("auth-change", { detail: { userId: data.user.id } }))
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.")
    }
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[40%] h-full flex-col items-start justify-end p-12 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&h=1200&fit=crop"
          alt="Construction site"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="relative z-10 space-y-4 max-w-xs">
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/25 shadow-xl">
            <HardHat className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">Building<br />Dreams</h1>
          <p className="text-white/60 text-base">Your complete construction platform</p>
          <div className="space-y-2 pt-2">
            {["Find skilled workers near you", "Buy & sell materials", "Track your projects"].map(f => (
              <div key={f} className="flex items-center gap-2 text-white/80 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 h-full flex flex-col bg-background overflow-y-auto">
        {/* Mobile banner */}
        <div className="lg:hidden relative overflow-hidden h-40 shrink-0">
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop"
            alt="Construction site"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-5 flex items-center gap-3 z-10">
            <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center border border-white/25 backdrop-blur-md">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-tight">Building Dreams</p>
              <p className="text-white/60 text-xs">Your construction network</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-start justify-center p-6 lg:p-12">
          <div className="w-full max-w-lg space-y-6">

            {/* Heading */}
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                {activeTab === "login" ? "Welcome back 👋" : "Join us today"}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {activeTab === "login"
                  ? "Sign in to your account to continue"
                  : "Create your account — it's free"}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-secondary rounded-2xl p-1">
              {(["login", "signup"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setError("") }}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    activeTab === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
                <span className="shrink-0">⚠</span>
                <span className="flex-1">{error}</span>
                <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {activeTab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="pl-10 h-12 bg-secondary border-0 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-secondary border-0 rounded-xl text-sm"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold gap-2" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </Button>



                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setActiveTab("signup")} className="text-primary font-medium hover:underline">
                    Sign up
                  </button>
                </p>
              </form>
            )}

            {/* ── SIGNUP FORM ── */}
            {activeTab === "signup" && (
              <form onSubmit={handleSignup} className="space-y-5">

                {/* Step 1 — Role selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">I am a…</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roles.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 text-center transition-all",
                          role === r.id
                            ? r.color + " border-current"
                            : "border-border bg-secondary text-muted-foreground hover:border-border/80"
                        )}
                      >
                        {r.icon}
                        <span className="text-xs font-semibold">{r.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground px-1">
                    {roles.find(r => r.id === role)?.desc}
                  </p>
                </div>

                {/* Common fields */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Your full name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="pl-10 h-12 bg-secondary border-0 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-secondary border-0 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      minLength={6}
                      className="pl-10 pr-10 h-12 bg-secondary border-0 rounded-xl text-sm"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Phone Number <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="10-digit mobile (e.g. 9876543210)"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className={cn(
                        "pl-10 h-12 bg-secondary border-0 rounded-xl text-sm",
                        phone && !validatePhone(phone) && "ring-2 ring-destructive/50"
                      )}
                      required
                    />
                  </div>
                  {phone && !validatePhone(phone) && (
                    <p className="text-xs text-destructive">Enter a valid 10-digit Indian mobile number (starts with 6-9)</p>
                  )}
                  {phone && validatePhone(phone) && (
                    <p className="text-xs text-emerald-600">✓ Valid phone number</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g. Mumbai, Maharashtra"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="pl-10 pr-20 h-12 bg-secondary border-0 rounded-xl text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={detecting}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
                    >
                      {detecting ? "Detecting..." : "Detect"}
                    </button>
                  </div>
                </div>

                {/* ── WORKER fields ── */}
                {role === "worker" && (
                  <div className="space-y-4 p-4 bg-violet-50 dark:bg-violet-950/20 rounded-2xl border border-violet-200 dark:border-violet-800">
                    <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide flex items-center gap-1.5">
                      <HardHat className="w-3.5 h-3.5" /> Worker Details
                    </p>

                    {/* Worker Type selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Worker Type <span className="text-destructive">*</span></label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["normal", "emergency"] as const).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setWorkerType(type)
                              setSelectedSkills([])
                            }}
                            className={cn(
                              "py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all",
                              workerType === type
                                ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                                : "bg-background border-border text-foreground hover:border-violet-300"
                            )}
                          >
                            {type === "emergency" ? "Emergency Worker" : "Normal Worker"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {workerType && (
                      <>
                        {/* Skills */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Your Skills <span className="text-destructive">*</span></label>
                          <div className="flex flex-wrap gap-2">
                            {(workerType === "emergency" ? emergencySkills : workerSkills).map(skill => (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => toggleSkill(skill)}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                                  selectedSkills.includes(skill)
                                    ? "bg-violet-600 text-white border-violet-600"
                                    : "bg-secondary border-border text-secondary-foreground hover:border-violet-300"
                                )}
                              >
                                {skill}
                              </button>
                            ))}
                          </div>
                          {selectedSkills.length > 0 && (
                            <p className="text-xs text-violet-750">Selected: {selectedSkills.join(", ")}</p>
                          )}
                        </div>

                        {selectedSkills.includes("Other") && (
                          <div className="space-y-1.5 mt-2 animate-in fade-in duration-200">
                            <label className="text-sm font-medium text-foreground">Enter your skill <span className="text-destructive">*</span></label>
                            <Input
                              placeholder="e.g. Welder, Plasterer, etc."
                              value={customSkill}
                              onChange={e => setCustomSkill(e.target.value)}
                              className="h-10 bg-background border-0 rounded-xl text-sm"
                              required
                            />
                          </div>
                        )}

                        {/* Experience */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">Years of Experience</label>
                          <div className="relative">
                            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="e.g. 5 years"
                              value={experience}
                              onChange={e => setExperience(e.target.value)}
                              className="pl-10 h-11 bg-background border-0 rounded-xl text-sm"
                            />
                          </div>
                        </div>

                        {/* Expected Rates */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">Expected Rates</label>
                          <div className="relative">
                            <Banknote className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="e.g. ₹500/day or ₹60/hour"
                              value={expectedRates}
                              onChange={e => setExpectedRates(e.target.value)}
                              className="pl-10 h-11 bg-background border-0 rounded-xl text-sm"
                            />
                          </div>
                        </div>


                      </>
                    )}
                  </div>
                )}

                {/* ── SELLER fields ── */}
                {role === "seller" && (
                  <div className="space-y-4 p-4 bg-violet-50 dark:bg-violet-950/20 rounded-2xl border border-violet-200 dark:border-violet-800">
                    <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5" /> Seller Details
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Business / Shop Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="e.g. Sharma Cement Store"
                          value={businessName}
                          onChange={e => setBusinessName(e.target.value)}
                          className="pl-10 h-11 bg-background border-0 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Years of Experience</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="e.g. 5 years"
                          value={experience}
                          onChange={e => setExperience(e.target.value)}
                          className="pl-10 h-11 bg-background border-0 rounded-xl text-sm"
                        />
                      </div>
                    </div>



                    {/* UPI ID */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">UPI ID (VPA) <span className="text-destructive text-[10px] font-normal">* UPI ID is required</span></label>
                      <div className="relative">
                        <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="e.g. store@upi or store@okaxis"
                          value={upiId}
                          onChange={e => setUpiId(e.target.value)}
                          className={cn("pl-10 h-11 bg-background border-0 rounded-xl text-sm", upiId && !validateUPI(upiId) && "ring-2 ring-destructive/50")}
                        />
                      </div>
                      {upiId && !validateUPI(upiId) && <p className="text-xs text-destructive">Invalid format — use: name@upi or name@okaxis</p>}
                      {upiId && validateUPI(upiId) && <p className="text-xs text-emerald-600">✓ Valid UPI ID</p>}
                    </div>

                    <div className="flex items-start gap-2 bg-violet-100 dark:bg-violet-950/40 rounded-xl p-3">
                      <Wrench className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-violet-700 dark:text-violet-400">
                        As a seller you can list materials, manage inventory and receive orders from construction professionals.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── EXPLORER info ── */}
                {role === "explorer" && (
                  <div className="flex items-start gap-2 bg-violet-50 dark:bg-violet-950/20 rounded-xl p-3 border border-violet-200 dark:border-violet-800">
                    <Compass className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-violet-750 dark:text-violet-400">
                      As an explorer you can browse professionals, hire workers, order materials, and track your construction projects.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold gap-2"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : `Create ${roles.find(r => r.id === role)?.label} Account`}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By signing up you agree to our{" "}
                  <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>
                  {" "}and{" "}
                  <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
                </p>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setActiveTab("login")} className="text-primary font-medium hover:underline">
                    Sign in
                  </button>
                </p>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
