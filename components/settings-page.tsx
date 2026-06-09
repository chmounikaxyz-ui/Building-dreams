"use client"

import { useState, useEffect } from "react"
import { 
  Bell, Lock, Moon, HelpCircle, LogOut, 
  ChevronRight, MapPin, Eye, EyeOff, Sun
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { useLang, type Language } from "@/context/language-context"
import { useRouter } from "next/navigation"
import { useApp } from "@/context/app-context"

const settingsSections = [
  { id: "notifications", labelKey: "notifications", descKey: "notificationsDesc", icon: Bell },
  { id: "privacy", labelKey: "privacy", descKey: "privacyDesc", icon: Lock },
  { id: "location", labelKey: "location", descKey: "locationDesc", icon: MapPin },
  { id: "appearance", labelKey: "appearance", descKey: "appearanceDesc", icon: Moon },
]

function LocationSection() {
  const { userLocation, detectLocation } = useApp()

  const displayCity =
    userLocation?.status === "success" ? userLocation.city :
    userLocation?.status === "detecting" ? "Detecting..." :
    userLocation?.status === "denied" ? "Access denied" :
    "Not yet detected"

  return (
    <div className="p-4 space-y-4">
      <div className="bg-secondary rounded-xl p-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium text-secondary-foreground">Current Location</p>
            <p className="text-sm text-muted-foreground">{displayCity}</p>
            {userLocation?.status === "success" && (
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {userLocation.lat.toFixed(4)}°, {userLocation.lon.toFixed(4)}°
              </p>
            )}
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full rounded-xl gap-2"
        disabled={userLocation?.status === "detecting"}
        onClick={detectLocation}
      >
        <MapPin className="w-4 h-4" />
        {userLocation?.status === "detecting" ? "Detecting..." : "Update Location"}
      </Button>

      {userLocation?.status === "success" && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          <span className="text-green-500">✓</span> Location updated & saved successfully!
        </div>
      )}
      {userLocation?.status === "denied" && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <span>⚠</span> Location access denied. Please enable it in your browser settings.
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Your location is used to show nearby workers and calculate real distances
      </p>
    </div>
  )
}

export function SettingsPage({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [savedAccount, setSavedAccount] = useState(false)
  const [savedPassword, setSavedPassword] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLang()
  const { user } = useApp() as any
  const router = useRouter()

  // Seed account form from real auth user
  const storedUser = typeof window !== "undefined" ? (() => { try { return JSON.parse(localStorage.getItem("auth_user") || "{}") } catch { return {} } })() : {}

  // Fix profession format if needed (remove duplicate name from "Seller · name")
  useEffect(() => {
    const fixProfession = async () => {
      if (storedUser.profession && storedUser.role === "seller") {
        const parts = storedUser.profession.split(" · ")
        if (parts.length === 2 && parts[0] === "Seller") {
          const businessName = parts[1]
          // If business name is same as user name (case insensitive), just use "Seller"
          if (businessName.toLowerCase() === storedUser.name?.toLowerCase()) {
            const newProfession = "Seller"
            try {
              // Update in database
              await fetch("/api/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: storedUser.id, profession: newProfession })
              })
              // Update localStorage
              storedUser.profession = newProfession
              localStorage.setItem("auth_user", JSON.stringify(storedUser))
              // Force refresh
              window.location.reload()
            } catch (err) {
              console.error("Failed to fix profession:", err)
            }
          }
        }
      }
    }
    fixProfession()
  }, [])

  const [accountForm, setAccountForm] = useState({
    name: storedUser.name || "",
    email: storedUser.email || "",
    phone: "",
    bio: "",
  })

  const [notifications, setNotifications] = useState({
    messages: true,
    bookings: true,
    promotions: false,
    updates: true,
    sound: true,
    vibration: true,
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showLocation: true,
    showPhone: false,
    showEmail: true,
  })

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    window.dispatchEvent(new CustomEvent("auth-change", { detail: { userId: null } }))
    setShowLogoutConfirm(false)
    router.push("/auth")
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t.settingsTitle}</h1>
        <p className="text-muted-foreground">{t.manageAccount}</p>
      </div>

      {/* Profile Quick View */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={storedUser.avatar} />
          <AvatarFallback>{(storedUser.name || "U")[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-card-foreground">{accountForm.name}</h3>
          <p className="text-sm text-muted-foreground">{storedUser.profession || "Construction Professional"}</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={() => setActiveTab?.("profile")}>
          {t.viewProfile}
        </Button>
      </div>

      {/* Settings List or Section Detail */}
      {!activeSection ? (
        <div className="space-y-2">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                <section.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-card-foreground">{t[section.labelKey as keyof typeof t]}</p>
                <p className="text-sm text-muted-foreground">{t[section.descKey as keyof typeof t]}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-card border border-destructive/20 rounded-xl p-4 flex items-center gap-4 hover:bg-destructive/5 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
              <LogOut className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-destructive">{t.logout}</p>
              <p className="text-sm text-muted-foreground">{t.logoutDesc}</p>
            </div>
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Section Header */}
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)}>
              {t.back}
            </Button>
            <h2 className="font-semibold text-card-foreground">
              {t[settingsSections.find(s => s.id === activeSection)?.labelKey as keyof typeof t]}
            </h2>
          </div>

          {/* Account Settings */}
          {activeSection === "account" && (
            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={accountForm.name} onChange={e => setAccountForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={accountForm.email} onChange={e => setAccountForm(f => ({ ...f, email: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={accountForm.phone} onChange={e => setAccountForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={accountForm.bio}
                  onChange={e => setAccountForm(f => ({ ...f, bio: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Button
                className="w-full rounded-xl"
                onClick={() => { setSavedAccount(true); setTimeout(() => setSavedAccount(false), 2000) }}
              >
                {savedAccount ? t.saved : t.saveChanges}
              </Button>
            </div>
          )}

          {/* Notifications Settings */}
          {activeSection === "notifications" && (
            <div className="p-4 space-y-1">
              {[
                { key: "messages", label: "Messages", desc: "New messages from clients and workers" },
                { key: "bookings", label: "Bookings", desc: "Booking confirmations and reminders" },
                { key: "promotions", label: "Promotions", desc: "Special offers and discounts" },
                { key: "updates", label: "App Updates", desc: "New features and improvements" },
                { key: "sound", label: "Sound", desc: "Play notification sounds" },
                { key: "vibration", label: "Vibration", desc: "Vibrate on notifications" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-card-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.key]: checked }))}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Privacy Settings */}
          {activeSection === "privacy" && (
            <div className="p-4 space-y-6">
              <div>
                <Label>Profile Visibility</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["public", "followers", "private"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setPrivacy(prev => ({ ...prev, profileVisibility: option }))}
                      className={cn(
                        "p-3 rounded-xl border-2 text-center capitalize text-sm font-medium transition-all",
                        privacy.profileVisibility === option ? "border-primary bg-primary/5 text-primary" : "border-border text-card-foreground"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { key: "showLocation", label: "Show Location", desc: "Display your location on profile" },
                { key: "showPhone", label: "Show Phone", desc: "Display phone number publicly" },
                { key: "showEmail", label: "Show Email", desc: "Display email publicly" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-card-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={privacy[item.key as keyof typeof privacy] as boolean}
                    onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, [item.key]: checked }))}
                  />
                </div>
              ))}

              <div className="pt-2 space-y-4">
                <h3 className="font-semibold text-card-foreground">Change Password</h3>
                <div>
                  <Label htmlFor="current">Current Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="current"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="h-14 text-base pr-12"
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="new">New Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="new"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="h-14 text-base pr-12"
                    />
                    <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full h-12 rounded-xl text-base font-semibold"
                  disabled={!currentPassword || !newPassword}
                  onClick={() => { setSavedPassword(true); setCurrentPassword(""); setNewPassword(""); setTimeout(() => setSavedPassword(false), 2000) }}
                >
                  {savedPassword ? "✓ Password Updated!" : "Update Password"}
                </Button>
              </div>
            </div>
          )}

          {/* Location Settings */}
          {activeSection === "location" && (
            <LocationSection />
          )}

          {/* Appearance Settings */}
          {activeSection === "appearance" && (
            <div className="p-4 space-y-6">
              <div>
                <Label>{t.theme}</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { id: "light", label: "Light", icon: Sun },
                    { id: "dark", label: "Dark", icon: Moon },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as "light" | "dark" | "system")}
                      className={cn(
                        "p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 text-sm font-medium transition-all",
                        theme === t.id ? "border-primary bg-primary/5 text-primary" : "border-border text-card-foreground"
                      )}
                    >
                      <t.icon className="w-5 h-5" />
                      {t.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Current theme: <span className="font-medium capitalize">{theme}</span></p>
              </div>

              <div>
                <Label>{t.language}</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { id: "english", label: "English" },
                    { id: "hindi", label: "हिंदी" },
                    { id: "telugu", label: "తెలుగు" },
                    { id: "tamil", label: "தமிழ்" },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setLanguage(lang.id as Language)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-center text-sm font-medium transition-all",
                        language === lang.id ? "border-primary bg-primary/5 text-primary" : "border-border text-card-foreground"
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Help & Support */}
          {activeSection === "help" && (
            <div className="p-4 space-y-1">
              {[
                { label: "FAQs", desc: "Frequently asked questions" },
                { label: "Contact Support", desc: "Get help from our team" },
                { label: "Report a Problem", desc: "Let us know about issues" },
                { label: "Terms of Service", desc: "Read our terms" },
                { label: "Privacy Policy", desc: "How we handle your data" },
                { label: "About", desc: "App version 1.0.0" },
              ].map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors border-b border-border last:border-0"
                >
                  <div className="text-left">
                    <p className="font-medium text-card-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">Building Dreams v1.0.0</p>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                <LogOut className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-card-foreground">Log Out?</h3>
              <p className="text-sm text-muted-foreground">Are you sure you want to sign out of your account?</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-xl" onClick={handleLogout}>
                Log Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


