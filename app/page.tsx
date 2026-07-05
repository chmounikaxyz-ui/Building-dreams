"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MainFeed } from "@/components/main-feed"
import { RightPanel } from "@/components/right-panel"
import { AIChatbot } from "@/components/ai-chatbot"
import { MobileNav } from "@/components/mobile-nav"
import { ExplorePage } from "@/components/explore-page"
import { MessagesPage } from "@/components/messages-page"
import { MaterialsPage } from "@/components/materials-page"
import { EmergencyPage } from "@/components/emergency-page"
import { ToolsPage } from "@/components/tools-page"
import { ProfilePage } from "@/components/profile-page"
import { SettingsPage } from "@/components/settings-page"
import { SellerStorePage } from "@/components/seller-store-page"
import { WorkerJobsPage } from "@/components/worker-jobs-page"

export type UserRole = "explorer" | "worker" | "seller"

export default function Home() {
  const [activeTab, setActiveTab] = useState("home")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole>("explorer")

  useEffect(() => {
    const syncRole = () => {
      const authUser = localStorage.getItem("auth_user")
      const authToken = localStorage.getItem("auth_token")
      if (!authUser || !authToken) {
        router.push("/auth")
      } else {
        try {
          const parsed = JSON.parse(authUser)
          const role = (parsed.role as UserRole) || "explorer"
          setUserRole(role)
        } catch {}
        setIsLoading(false)
      }
    }

    syncRole()

    window.addEventListener("auth-change", syncRole)
    return () => window.removeEventListener("auth-change", syncRole)
  }, [router])

  useEffect(() => {
    let intervalId: any = null

    const updateLocation = () => {
      const stored = localStorage.getItem("auth_user")
      if (!stored) return
      try {
        const user = JSON.parse(stored)
        if (user.role !== "worker" || !user.id) return

        let isAvailable = true
        if (user.bio) {
          if (user.bio.trim().startsWith("{") && user.bio.trim().endsWith("}")) {
            const p = JSON.parse(user.bio)
            if (p.available !== undefined) {
              isAvailable = p.available
            }
          }
        }

        if (isAvailable && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              
              // Update local storage
              const currentStored = localStorage.getItem("auth_user")
              if (currentStored) {
                try {
                  const parsed = JSON.parse(currentStored)
                  parsed.lat = latitude
                  parsed.lon = longitude
                  localStorage.setItem("auth_user", JSON.stringify(parsed))
                } catch {}
              }

              // Update in database
              try {
                await fetch("/api/users", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: user.id,
                    lat: latitude,
                    lon: longitude
                  })
                })
              } catch (err) {
                console.error("Error updating location in DB:", err)
              }
            },
            (err) => {
              console.error("Error getting current position:", err)
            },
            { enableHighAccuracy: true }
          )
        }
      } catch (err) {
        console.error("Error in location tracker loop:", err)
      }
    }

    updateLocation()
    intervalId = setInterval(updateLocation, 5000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":      return <MainFeed setActiveTab={setActiveTab} />
      case "explore":   return <ExplorePage setActiveTab={setActiveTab} userRole={userRole} />
      case "messages":  return <MessagesPage />
      case "materials": return userRole === "seller" ? <SellerStorePage /> : <MaterialsPage setActiveTab={setActiveTab} />
      case "mystore":   return <SellerStorePage />
      case "myjobs":    return <WorkerJobsPage setActiveTab={setActiveTab} />
      case "emergency": return <EmergencyPage setActiveTab={setActiveTab} />
      case "tools":     return <ToolsPage />
      case "profile":   return <ProfilePage setActiveTab={setActiveTab} />
      case "settings":  return <SettingsPage setActiveTab={setActiveTab} />
      default:          return <MainFeed setActiveTab={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop */}
      <div className="hidden lg:flex h-screen">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
        <main className="flex-1 min-h-0 overflow-auto">{renderContent()}</main>
        {activeTab === "home" && <RightPanel setActiveTab={setActiveTab} />}
      </div>

      {/* Mobile */}
      <div className="lg:hidden flex flex-col h-screen">
        <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">BD</span>
              </div>
              <span className="font-bold text-lg text-foreground">Building Dreams</span>
            </div>
            {/* Role badge */}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              userRole === "worker" ? "bg-amber-100 text-amber-700" :
              userRole === "seller" ? "bg-emerald-100 text-emerald-700" :
              "bg-blue-100 text-blue-700"
            }`}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-auto pb-20">{renderContent()}</main>
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
      </div>

      {/* AI Chatbot — all roles */}
      {activeTab === "home" && (
        <AIChatbot isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
      )}
    </div>
  )
}
