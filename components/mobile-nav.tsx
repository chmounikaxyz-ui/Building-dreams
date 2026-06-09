"use client"

import React from "react"
import { Home, Compass, MessageCircle, AlertTriangle, User, Package, Store, Users, Wrench, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLang } from "@/context/language-context"
import type { UserRole } from "@/app/page"

interface MobileNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  userRole?: UserRole
}

function getNavItems(role: UserRole, t: any) {
  if (role === "worker") {
    return [
      { id: "home",     label: "Feed",    icon: Home },
      { id: "messages", label: "Chat",    icon: MessageCircle },
      { id: "myjobs",   label: "My Jobs", icon: Briefcase },
      { id: "profile",  label: t.profile, icon: User },
    ]
  }
  if (role === "seller") {
    return [
      { id: "home",     label: "Feed",    icon: Home },
      { id: "mystore",  label: "Store",   icon: Store },
      { id: "messages", label: "Chat",    icon: MessageCircle },
      { id: "profile",  label: t.profile, icon: User },
    ]
  }
  return [
    { id: "home",     label: t.home,    icon: Home },
    { id: "explore",  label: t.explore, icon: Compass },
    { id: "emergency",label: "SOS",     icon: AlertTriangle, isEmergency: true },
    { id: "messages", label: "Chat",    icon: MessageCircle },
    { id: "profile",  label: t.profile, icon: User },
  ]
}

export function MobileNav({ activeTab, setActiveTab, userRole = "explorer" }: MobileNavProps) {
  const { t } = useLang()
  const navItems = getNavItems(userRole, t)
  
  // Fetch real unread count from DB
  const [totalUnread, setTotalUnread] = React.useState(0)
  
  React.useEffect(() => {
    const fetchUnreadCount = async () => {
      const currentUser = (() => { 
        try { return JSON.parse(localStorage.getItem("auth_user") || "{}") } 
        catch { return {} } 
      })()
      const currentUserId = currentUser.id
      if (!currentUserId) return

      try {
        const res = await fetch(`/api/messages?userId=${currentUserId}`)
        if (!res.ok) return
        const convs = await res.json()
        
        // Count unread messages across all conversations
        let unreadTotal = 0
        for (const conv of convs) {
          const msgRes = await fetch(`/api/messages/${conv.id}`)
          if (msgRes.ok) {
            const msgs = await msgRes.json()
            const unreadInConv = msgs.filter((m: any) => 
              m.senderId !== currentUserId && m.status !== "read"
            ).length
            unreadTotal += unreadInConv
          }
        }
        setTotalUnread(unreadTotal)
      } catch (err) {
        console.error('Failed to fetch unread count:', err)
      }
    }

    fetchUnreadCount()
    // Poll every 3 seconds
    const interval = setInterval(fetchUnreadCount, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 py-2 safe-area-inset-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
              activeTab === item.id
                ? "text-primary"
                : (item as any).isEmergency
                ? "text-red-500"
                : "text-muted-foreground"
            )}
          >
            {(item as any).isEmergency ? (
              <div className="w-12 h-12 -mt-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                <item.icon className="w-6 h-6 text-white" />
              </div>
            ) : (
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.id === "messages" && totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-card rounded-full" />
                )}
              </div>
            )}
            <span className={cn("text-xs font-medium", (item as any).isEmergency && "-mt-1")}>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
