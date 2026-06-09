"use client"

import React from "react"
import { Home, Compass, MessageCircle, Package, AlertTriangle, Wrench, User, Settings, HardHat, Store, BarChart3, ClipboardList, Users, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { useLang } from "@/context/language-context"
import type { UserRole } from "@/app/page"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  userRole?: UserRole
}

// Nav items per role
function getNavItems(role: UserRole, t: any) {
  if (role === "worker") {
    return [
      { id: "home",     label: "Feed",      icon: Home },
      { id: "messages", label: t.messages,  icon: MessageCircle },
      { id: "myjobs",   label: "My Jobs",   icon: Briefcase },
    ]
  }
  if (role === "seller") {
    return [
      { id: "home",     label: "Feed",      icon: Home },
      { id: "mystore",  label: "My Store",  icon: Store },
      { id: "messages", label: t.messages,  icon: MessageCircle },
    ]
  }
  return [
    { id: "home",      label: t.home,      icon: Home },
    { id: "explore",   label: t.explore,   icon: Compass },
    { id: "messages",  label: t.messages,  icon: MessageCircle },
    { id: "materials", label: t.materials, icon: Package },
    { id: "emergency", label: t.emergency, icon: AlertTriangle, isEmergency: true },
    { id: "tools",     label: t.tools,     icon: Wrench },
  ]
}

const roleMeta: Record<UserRole, { label: string; color: string }> = {
  explorer: { label: "Explorer",  color: "bg-blue-100 text-blue-700" },
  worker:   { label: "Worker",    color: "bg-amber-100 text-amber-700" },
  seller:   { label: "Seller",    color: "bg-emerald-100 text-emerald-700" },
}

export function Sidebar({ activeTab, setActiveTab, userRole = "explorer" }: SidebarProps) {
  const { conversations } = useApp()
  const { user } = useAuth()
  const { t } = useLang()
  
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

  const navItems = getNavItems(userRole, t)
  const bottomItems = [
    { id: "profile",  label: t.profile,  icon: User },
    { id: "settings", label: t.settings, icon: Settings },
  ]
  const meta = roleMeta[userRole]

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col h-full">
      {/* Logo + role badge */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center">
            <HardHat className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground leading-tight">Building</h1>
            <p className="text-sm text-sidebar-foreground/70 -mt-0.5">Dreams</p>
          </div>
        </div>
        {/* Role badge */}
        <div className="mt-3">
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", meta.color)}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
              activeTab === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : (item as any).isEmergency
                ? "text-red-400 hover:bg-red-500/10"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="relative">
              <item.icon className={cn("w-5 h-5", (item as any).isEmergency && activeTab !== item.id && "text-red-400")} />
              {item.id === "messages" && totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-sidebar rounded-full" />
              )}
            </div>
            <span className="font-medium">{item.label}</span>
            {item.id === "messages" && totalUnread > 0 && (
              <span className="ml-auto bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User info + bottom nav */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
              activeTab === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
