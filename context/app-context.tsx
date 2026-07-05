"use client"

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react"
import { getCurrentPosition, reverseGeocode } from "@/lib/location"

export interface Message {
  id: string | number
  text: string
  isOwn: boolean
  senderId?: string   // name of the person who sent this message
  timestamp: string
  status: "sent" | "delivered" | "read"
  postCard?: {
    image: string
    userName: string
    profession: string
    description: string
    likes: number
  }
}

export interface Conversation {
  id: string | number
  name: string
  profession: string
  avatar: string
  lastMessage: string
  timestamp: string
  unread: number
  isOnline: boolean
  messages: Message[]
}

export interface PostComment {
  id: string | number
  userName: string
  userAvatar: string
  text: string
  createdAt: string
}

export interface Post {
  id: string | number
  user: {
    id(id: any): unknown
    name: string
    profession: string
    avatar: string
    verified: boolean
    location: string
    rating: number
    isFollowing: boolean
  }
  images: string[]
  likes: number
  comments: number
  commentsList?: PostComment[]
  description: string
  tags: string[]
  timestamp: string
  isLiked: boolean
  isSaved: boolean
}

export interface CartItem {
  id: number
  name: string
  brand: string
  price: number
  unit: string
  quantity: number
  image: string
}

export interface FollowingPerson {
  id: string | number
  name: string
  profession: string
  avatar: string
  isOnline: boolean
}

export interface UserLocation {
  lat: number
  lon: number
  city: string       // human-readable reverse-geocoded name
  status: "idle" | "detecting" | "success" | "denied" | "error"
}

export interface SellerProduct {
  id: number
  name: string
  brand: string
  category: string
  image: string
  price: number
  unit: string
  inStock: boolean
  discount: number
  description: string
  deliveryTime: string
  sellerName?: string
  sellerAvatar?: string
  sellerId?: string
}

export interface SellerOrder {
  id: number
  date: string
  buyerName: string
  buyerPhone?: string
  buyerLocation?: string
  productId: number
  productName: string
  productImage: string
  quantity: number
  totalPrice: number
  paymentMethod: "qr" | "cod"
  status: "Pending" | "Confirmed" | "Dispatched" | "Delivered" | "Cancelled"
  sellerId?: string
  upiTxnId?: string
}

export interface SellerPreOrder {
  id: number
  date: string
  buyerName: string
  buyerPhone: string
  buyerAddress: string
  productId: number
  productName: string
  productImage: string
  productUnit: string
  quantity: number
  estimatedValue: number
  expectedDate: string
  status: "Pending" | "Confirmed" | "Ready" | "Cancelled"
  sellerId?: string
}

export interface HireRequest {
  id: number
  date: string
  workerName: string
  workerAvatar: string
  workerProfession: string
  explorerName: string
  explorerAvatar: string
  explorerPhone: string
  jobTitle: string
  location: string
  startDate: string
  dailyRate: string
  message: string
  status: "Pending" | "Accepted" | "Rejected" | "Completed"
  hiddenFromExplorer?: boolean
  rating?: number
}

interface AppContextType {
  // Conversations
  conversations: Conversation[]
  selectedConversation: Conversation | null
  setSelectedConversation: (conv: Conversation | null) => void
  setConversations: (convs: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void
  sendMessage: (conversationId: number, text: string) => void
  getConversationMessages: (conversationId: number) => Message[]
  // Posts
  posts: Post[]
  toggleLikePost: (postId: number) => void
  toggleSavePost: (postId: number) => void
  toggleFollowPost: (postId: number) => void
  addComment: (postId: string | number, text: string) => void
  deleteComment: (postId: string | number, commentId: string | number) => Promise<void>
  addPost: (image: string, description: string, tags: string[], location: string) => void
  deletePost: (postId: number) => void
  reloadPosts: () => Promise<void>
  // Cart
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: number) => void
  updateCartItemQuantity: (itemId: number, quantity: number) => void
  cartTotal: number
  // Navigation
  activeTab: string
  setActiveTab: (tab: string) => void
  // Following
  followingIds: (string | number)[]
  followingList: FollowingPerson[]
  toggleFollow: (id: string | number, name: string, profession: string, avatar: string) => void
  // User avatar (shared across feed, stories, profile)
  userAvatar: string
  setUserAvatar: (url: string) => void
  // User location
  userLocation: UserLocation | null
  detectLocation: () => Promise<void>
  setUserLocation: React.Dispatch<React.SetStateAction<UserLocation | null>>
  // User story
  userStories: { image: string; caption: string }[]
  addUserStory: (story: { image: string; caption: string }) => void
  deleteUserStory: (index: number) => void
  userStoryWatched: boolean
  setUserStoryWatched: (v: boolean) => void
  // Seller store
  sellerProducts: SellerProduct[]
  setSellerProducts: React.Dispatch<React.SetStateAction<SellerProduct[]>>
  allSellerProducts: SellerProduct[]
  sellerOrders: SellerOrder[]
  addSellerOrder: (order: Omit<SellerOrder, "id" | "date" | "status"> & { id?: number }) => void
  updateSellerOrderStatus: (id: number, status: SellerOrder["status"]) => void
  // Worker hire requests
  hireRequests: HireRequest[]
  addHireRequest: (req: Omit<HireRequest, "id" | "date" | "status">) => void
  updateHireRequest: (id: number, status: HireRequest["status"]) => void
  setHireRequests: React.Dispatch<React.SetStateAction<HireRequest[]>>
  // Seller pre-orders
  sellerPreOrders: SellerPreOrder[]
  addSellerPreOrder: (req: Omit<SellerPreOrder, "id" | "date" | "status"> & { id?: number }) => void
  updateSellerPreOrderStatus: (id: number, status: SellerPreOrder["status"]) => void
}

const initialConversations: Conversation[] = []

// No pre-seeded posts - users create their own
const initialPosts: Post[] = []

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [activeTab, setActiveTab] = useState("home")
  const [userStories, setUserStories] = useState<{ image: string; caption: string }[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const uid = getCurrentUserId()
        if (uid) {
          const s = localStorage.getItem(`stories_${uid}`)
          if (s) return JSON.parse(s)
        }
      } catch { }
    }
    return []
  })
  const [userStoryWatched, setUserStoryWatched] = useState(false)
  const [userAvatar, setUserAvatar] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("auth_user")
        if (stored) {
          const u = JSON.parse(stored)
          if (u?.avatar) return u.avatar
        }
      } catch { }
    }
    return "" // No default avatar
  })

  // Sync userAvatar from database on mount
  useEffect(() => {
    const syncAvatarFromDB = async () => {
      try {
        const stored = localStorage.getItem("auth_user")
        if (stored) {
          const user = JSON.parse(stored)
          if (user.id) {
            const res = await fetch(`/api/users/${user.id}`)
            if (res.ok) {
              const dbUser = await res.json()
              if (dbUser.avatar !== user.avatar) {
                // Update localStorage to match DB
                user.avatar = dbUser.avatar || ""
                localStorage.setItem("auth_user", JSON.stringify(user))
                setUserAvatar(dbUser.avatar || "")
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to sync avatar from DB:", err)
      }
    }
    syncAvatarFromDB()
  }, [])

  const syncConversationsFromDB = async () => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) {
        const user = JSON.parse(stored)
        if (user.id) {
          const res = await fetch(`/api/messages?userId=${user.id}`)
          if (res.ok) {
            const dbConvs = await res.json()
            const enriched = await Promise.all(dbConvs.map(async (conv: any) => {
              try {
                const userRes = await fetch(`/api/users/${conv.otherUserId}`)
                if (!userRes.ok) {
                  return {
                    id: conv.id,
                    name: "Unknown User",
                    profession: "User",
                    avatar: "",
                    lastMessage: conv.lastMessage || "",
                    timestamp: conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleString() : "",
                    unread: 0,
                    isOnline: true,
                    messages: [],
                  }
                }
                const otherUser = await userRes.json()
                const msgRes = await fetch(`/api/messages/${conv.id}`)
                const msgs: any[] = msgRes.ok ? await msgRes.json() : []
                return {
                  id: conv.id,
                  name: otherUser.name,
                  profession: otherUser.profession || "User",
                  avatar: otherUser.avatar || "",
                  lastMessage: conv.lastMessage || "",
                  timestamp: conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleString() : "",
                  unread: msgs.filter((m: any) => m.senderId !== String(user.id) && m.status !== "read").length,
                  isOnline: true,
                  messages: msgs.map((m: any) => ({
                    id: m.id,
                    text: m.text,
                    isOwn: m.senderId === String(user.id),
                    senderId: m.senderId,
                    timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    status: m.status,
                  })),
                }
              } catch {
                return {
                  id: conv.id,
                  name: "Unknown User",
                  profession: "User",
                  avatar: "",
                  lastMessage: conv.lastMessage || "",
                  timestamp: "",
                  unread: 0,
                  isOnline: true,
                  messages: [],
                }
              }
            }))
            setConversations(enriched)
          }
        }
      }
    } catch (err) {
      console.error("Failed to sync conversations from DB:", err)
    }
  }

  const syncFollowsFromDB = async () => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) {
        const user = JSON.parse(stored)
        if (user.id) {
          const res = await fetch(`/api/users/${user.id}`)
          if (res.ok) {
            const dbUser = await res.json()
            if (dbUser && dbUser.following) {
              const list = dbUser.following.map((f: any) => ({
                id: f.following.id,
                name: f.following.name,
                profession: f.following.profession || "User",
                avatar: f.following.avatar || "",
                isOnline: true
              }))
              setFollowingList(list)
              setFollowingIds(list.map((l: any) => l.id))
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to sync follows from DB:", err)
    }
  }

  useEffect(() => {
    syncConversationsFromDB()
    syncFollowsFromDB()
  }, [])

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)

  // Get current user ID
  const getCurrentUserId = (): string | null => {
    if (typeof window === "undefined") return null
    try {
      const authUser = localStorage.getItem("auth_user")
      if (authUser) {
        const user = JSON.parse(authUser)
        return user.id ? String(user.id) : null
      }
    } catch { }
    return null
  }

  // Per-user localStorage key helpers (inline usage)

  const [sellerProducts, setSellerProductsState] = useState<SellerProduct[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const uid = getCurrentUserId()
        const key = uid ? `products_${uid}` : null
        if (key) {
          const stored = localStorage.getItem(key)
          if (stored) {
            const items = JSON.parse(stored)
            return items.map((p: any) => ({
              ...p,
              sellerId: p.sellerId || uid || ""
            }))
          }
        }
      } catch { }
    }
    return []
  })

  // Global list: all sellers' products — readable by any user (explorers, workers)
  const [allSellerProducts, setAllSellerProductsState] = useState<SellerProduct[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("global_seller_products")
        if (stored) {
          const items = JSON.parse(stored)
          return items
        }
      } catch { }
    }
    return []
  })

  const setSellerProducts: React.Dispatch<React.SetStateAction<SellerProduct[]>> = (value) => {
    setSellerProductsState(prev => {
      const next = typeof value === "function" ? (value as (p: SellerProduct[]) => SellerProduct[])(prev) : value
      try {
        const uid = getCurrentUserId()
        if (uid) {
          const nextWithSellerId = next.map(p => ({
            ...p,
            sellerId: p.sellerId || uid || ""
          }))
          localStorage.setItem(`products_${uid}`, JSON.stringify(nextWithSellerId))
          const existing: SellerProduct[] = JSON.parse(localStorage.getItem("global_seller_products") || "[]")
          const others = existing.filter(p => p.sellerId !== uid)
          const updated = [...others, ...nextWithSellerId]
          localStorage.setItem("global_seller_products", JSON.stringify(updated))
          setAllSellerProductsState(updated)
          return nextWithSellerId
        }
      } catch { }
      return next
    })
  }
  const [sellerOrders, setSellerOrdersState] = useState<SellerOrder[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const uid = getCurrentUserId()
        const key = uid ? `orders_${uid}` : null
        if (key) {
          const stored = localStorage.getItem(key)
          if (stored) return JSON.parse(stored)
        }
      } catch { }
    }
    return []
  })
  const setSellerOrders = (value: SellerOrder[] | ((prev: SellerOrder[]) => SellerOrder[])) => {
    setSellerOrdersState(prev => {
      const next = typeof value === "function" ? value(prev) : value
      try {
        const uid = getCurrentUserId()
        const key = uid ? `orders_${uid}` : null
        if (key) localStorage.setItem(key, JSON.stringify(next))
      } catch { }
      return next
    })
  }
  const [hireRequests, setHireRequestsState] = useState<HireRequest[]>(() => {
    if (typeof window !== "undefined") {
      try {
        // Load all hire requests globally (workers need to see requests directed at them)
        const stored = localStorage.getItem("global_hire_requests")
        if (stored) return JSON.parse(stored)
      } catch { }
    }
    return []
  })
  const setHireRequests = (value: HireRequest[] | ((prev: HireRequest[]) => HireRequest[])) => {
    setHireRequestsState(prev => {
      const next = typeof value === "function" ? value(prev) : value
      try {
        localStorage.setItem("global_hire_requests", JSON.stringify(next))
      } catch { }
      return next
    })
  }

  const addSellerOrder = (order: Omit<SellerOrder, "id" | "date" | "status"> & { id?: number }) => {
    let sellerId = order.sellerId
    if (!sellerId && order.productId) {
      let product = allSellerProducts.find(p => String(p.id) === String(order.productId))
      if (product?.sellerId) sellerId = product.sellerId

      if (!sellerId) {
        try {
          const global = JSON.parse(localStorage.getItem("global_seller_products") || "[]")
          const found = global.find((p: any) => String(p.id) === String(order.productId))
          if (found?.sellerId) sellerId = found.sellerId
        } catch { }
      }
      if (!sellerId) {
        try {
          const keys = Object.keys(localStorage).filter(k => k.startsWith("products_"))
          for (const k of keys) {
            const items = JSON.parse(localStorage.getItem(k) || "[]")
            const found = items.find((p: any) => String(p.id) === String(order.productId))
            if (found) {
              sellerId = found.sellerId || k.substring(9)
              break
            }
          }
        } catch { }
      }
    }

    const uniqueId = order.id || (Date.now() + Math.floor(Math.random() * 10000))

    if (sellerId) {
      try {
        const key = `orders_${sellerId}`
        const existing: SellerOrder[] = JSON.parse(localStorage.getItem(key) || "[]")
        const newOrder: SellerOrder = {
          ...order,
          sellerId,
          id: uniqueId,
          date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          status: "Pending" as const,
        }
        const updated = [newOrder, ...existing]
        localStorage.setItem(key, JSON.stringify(updated))

        const uid = getCurrentUserId()
        if (uid === sellerId) {
          setSellerOrdersState(updated)
        }
      } catch (err) {
        console.error("Failed to add seller order to localStorage:", err)
      }
    } else {
      setSellerOrders(prev => [{
        ...order,
        id: uniqueId,
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        status: "Pending" as const,
      }, ...prev])
    }
  }

  const updateSellerOrderStatus = (id: number, status: SellerOrder["status"]) => {
    const uid = getCurrentUserId()
    const key = uid ? `orders_${uid}` : null
    if (key) {
      try {
        const latest: SellerOrder[] = JSON.parse(localStorage.getItem(key) || "[]")
        const updated = latest.map(o => String(o.id) === String(id) ? { ...o, status } : o)
        localStorage.setItem(key, JSON.stringify(updated))
        setSellerOrdersState(updated)
        return
      } catch { }
    }
    setSellerOrders(prev => prev.map(o => String(o.id) === String(id) ? { ...o, status } : o))
  }

  const addHireRequest = (req: Omit<HireRequest, "id" | "date" | "status">) => {
    setHireRequests(prev => [{
      ...req,
      id: Date.now(),
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      status: "Pending" as const,
    }, ...prev])
  }

  const updateHireRequest = (id: number, status: HireRequest["status"]) => {
    setHireRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const [sellerPreOrders, setSellerPreOrdersState] = useState<SellerPreOrder[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const uid = getCurrentUserId()
        const key = uid ? `preorders_${uid}` : null
        if (key) {
          const s = localStorage.getItem(key)
          if (s) return JSON.parse(s)
        }
      } catch { }
    }
    return []
  })
  const setSellerPreOrders = (v: SellerPreOrder[] | ((p: SellerPreOrder[]) => SellerPreOrder[])) => {
    setSellerPreOrdersState(prev => {
      const next = typeof v === "function" ? v(prev) : v
      try {
        const uid = getCurrentUserId()
        const key = uid ? `preorders_${uid}` : null
        if (key) localStorage.setItem(key, JSON.stringify(next))
      } catch { }
      return next
    })
  }
  const addSellerPreOrder = (req: Omit<SellerPreOrder, "id" | "date" | "status"> & { id?: number }) => {
    let sellerId = req.sellerId
    if (!sellerId && req.productId) {
      let product = allSellerProducts.find(p => String(p.id) === String(req.productId))
      if (product?.sellerId) sellerId = product.sellerId

      if (!sellerId) {
        try {
          const global = JSON.parse(localStorage.getItem("global_seller_products") || "[]")
          const found = global.find((p: any) => String(p.id) === String(req.productId))
          if (found?.sellerId) sellerId = found.sellerId
        } catch { }
      }
      if (!sellerId) {
        try {
          const keys = Object.keys(localStorage).filter(k => k.startsWith("products_"))
          for (const k of keys) {
            const items = JSON.parse(localStorage.getItem(k) || "[]")
            const found = items.find((p: any) => String(p.id) === String(req.productId))
            if (found) {
              sellerId = found.sellerId || k.substring(9)
              break
            }
          }
        } catch { }
      }
    }

    const uniqueId = req.id || (Date.now() + Math.floor(Math.random() * 10000))

    if (sellerId) {
      try {
        const key = `preorders_${sellerId}`
        const existing: SellerPreOrder[] = JSON.parse(localStorage.getItem(key) || "[]")
        const newPreOrder: SellerPreOrder = {
          ...req,
          sellerId,
          id: uniqueId,
          date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          status: "Pending" as const,
        }
        const updated = [newPreOrder, ...existing]
        localStorage.setItem(key, JSON.stringify(updated))

        const uid = getCurrentUserId()
        if (uid === sellerId) {
          setSellerPreOrdersState(updated)
        }
      } catch (err) {
        console.error("Failed to add seller pre-order to localStorage:", err)
      }
    } else {
      setSellerPreOrders(prev => [{
        ...req, id: uniqueId,
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        status: "Pending" as const,
      }, ...prev])
    }
  }
  const updateSellerPreOrderStatus = (id: number, status: SellerPreOrder["status"]) => {
    const uid = getCurrentUserId()
    const key = uid ? `preorders_${uid}` : null
    if (key) {
      try {
        const latest: SellerPreOrder[] = JSON.parse(localStorage.getItem(key) || "[]")
        const updated = latest.map(r => String(r.id) === String(id) ? { ...r, status } : r)
        localStorage.setItem(key, JSON.stringify(updated))
        setSellerPreOrdersState(updated)
        return
      } catch { }
    }
    setSellerPreOrders(prev => prev.map(r => String(r.id) === String(id) ? { ...r, status } : r))
  }

  const detectLocation = async () => {
    setUserLocation(prev => ({ lat: prev?.lat ?? 0, lon: prev?.lon ?? 0, city: prev?.city ?? "", status: "detecting" }))
    try {
      const pos = await getCurrentPosition()
      const { latitude: lat, longitude: lon } = pos.coords
      const city = await reverseGeocode(lat, lon)
      setUserLocation({ lat, lon, city, status: "success" })
      // Persist to DB if user is logged in
      try {
        const storedUser = localStorage.getItem("auth_user")
        if (storedUser) {
          const user = JSON.parse(storedUser)
          await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, lat, lon, location: city }),
          })
        }
      } catch { /* non-critical */ }
    } catch {
      setUserLocation(prev => ({ lat: prev?.lat ?? 0, lon: prev?.lon ?? 0, city: prev?.city ?? "Location unavailable", status: "denied" }))
    }
  }
  const [followingIds, setFollowingIds] = useState<(string | number)[]>([]) // nobody pre-followed

  // On mount: scan ALL products_* localStorage keys and rebuild global list
  // This ensures products added before the global list feature are still visible
  useEffect(() => {
    try {
      const allKeys = Object.keys(localStorage)
      const productKeys = allKeys.filter(k => k.startsWith("products_"))
      if (productKeys.length > 0) {
        const allProducts: SellerProduct[] = productKeys.flatMap(key => {
          const sellerId = key.substring(9) // key is "products_" + sellerId
          try {
            const items = JSON.parse(localStorage.getItem(key) || "[]")
            return items.map((item: any) => ({
              ...item,
              sellerId: item.sellerId || sellerId || ""
            }))
          } catch { return [] }
        })
        localStorage.setItem("global_seller_products", JSON.stringify(allProducts))
        setAllSellerProductsState(allProducts)
      }
    } catch { }
  }, [])

  // Load posts from API on mount
  const loadPosts = async () => {
    try {
      const uid = getCurrentUserId()
      const url = uid ? `/api/posts?userId=${uid}` : "/api/posts"
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setPosts(data)
        }
      }
    } catch (error) {
      console.error("Error loading posts:", error)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const reloadPosts = loadPosts

  // Reload user-specific data when user changes (login/logout/switch)
  useEffect(() => {
    const reloadUserData = () => {
      const userId = getCurrentUserId()
      if (!userId) {
        setSellerProductsState([])
        setSellerOrdersState([])
        setSellerPreOrdersState([])
        setHireRequestsState([])
        setConversations([])
        return
      }

      // Load seller products (per-user)
      try {
        const stored = localStorage.getItem(`products_${userId}`)
        if (stored) {
          const items = JSON.parse(stored)
          setSellerProductsState(items.map((p: any) => ({
            ...p,
            sellerId: p.sellerId || userId || ""
          })))
        } else {
          setSellerProductsState([])
        }
      } catch { setSellerProductsState([]) }

      // Load seller orders (per-user)
      try {
        const stored = localStorage.getItem(`orders_${userId}`)
        setSellerOrdersState(stored ? JSON.parse(stored) : [])
      } catch { setSellerOrdersState([]) }

      // Load seller pre-orders (per-user)
      try {
        const stored = localStorage.getItem(`preorders_${userId}`)
        setSellerPreOrdersState(stored ? JSON.parse(stored) : [])
      } catch { setSellerPreOrdersState([]) }

      // Load hire requests (global — workers filter by name)
      try {
        const stored = localStorage.getItem("global_hire_requests")
        setHireRequestsState(stored ? JSON.parse(stored) : [])
      } catch { setHireRequestsState([]) }

      syncConversationsFromDB()
      syncFollowsFromDB()
    }

    reloadUserData()

    // Listen for auth-change events (login/logout)
    const handleAuthChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { userId: string | null } | undefined
      const uid = detail?.userId

      if (uid === undefined) {
        reloadUserData()
        return
      }

      if (!uid) {
        // Logged out — clear all user-specific state
        setSellerProductsState([])
        setSellerOrdersState([])
        setSellerPreOrdersState([])
        setHireRequestsState([])
        setCartItems([])
        setUserStories([])
        setFollowingIds([])
        setFollowingList([])
        setUserAvatar("")
        setConversations([])
        return
      }

      // Logged in as a new user — load their data
      try {
        const stored = localStorage.getItem(`products_${uid}`)
        if (stored) {
          const items = JSON.parse(stored)
          setSellerProductsState(items.map((p: any) => ({
            ...p,
            sellerId: p.sellerId || uid || ""
          })))
        } else {
          setSellerProductsState([])
        }
      } catch { setSellerProductsState([]) }

      try {
        const stored = localStorage.getItem(`orders_${uid}`)
        setSellerOrdersState(stored ? JSON.parse(stored) : [])
      } catch { setSellerOrdersState([]) }

      try {
        const stored = localStorage.getItem(`preorders_${uid}`)
        setSellerPreOrdersState(stored ? JSON.parse(stored) : [])
      } catch { setSellerPreOrdersState([]) }

      // hire requests are global — always reload them
      try {
        const stored = localStorage.getItem("global_hire_requests")
        setHireRequestsState(stored ? JSON.parse(stored) : [])
      } catch { setHireRequestsState([]) }

      // Clear cart and stories for new user
      setCartItems([])
      setUserStories([])
      setFollowingIds([])
      setFollowingList([])

      // Load new user's avatar from auth_user
      try {
        const authStr = localStorage.getItem("auth_user")
        if (authStr) {
          const authUser = JSON.parse(authStr)
          setUserAvatar(authUser.avatar || "")
        }
      } catch { }

      syncConversationsFromDB()
      syncFollowsFromDB()
    }

    window.addEventListener("auth-change", handleAuthChange)
    // Also listen for storage changes (cross-tab)
    window.addEventListener('storage', reloadUserData)
    return () => {
      window.removeEventListener("auth-change", handleAuthChange)
      window.removeEventListener('storage', reloadUserData)
    }
  }, [])
  const [followingList, setFollowingList] = useState<FollowingPerson[]>([])

  const toggleFollow = async (id: string | number, name: string, profession: string, avatar: string) => {
    const isFollowing = followingIds.includes(id)
    setFollowingIds(prev => isFollowing ? prev.filter(i => i !== id) : [...prev, id])
    setFollowingList(prev =>
      isFollowing
        ? prev.filter(p => p.id !== id)
        : [...prev, { id, name, profession, avatar, isOnline: true }]
    )
    // Also update posts isFollowing
    setPosts(prev => prev.map(p =>
      p.user.name === name ? { ...p, user: { ...p.user, isFollowing: !isFollowing } } : p
    ))

    try {
      const currentUser = JSON.parse(localStorage.getItem("auth_user") || "{}")
      if (currentUser.id && id) {
        await fetch("/api/users/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followerId: currentUser.id, followingId: String(id) }),
        })
      }
    } catch (err) {
      console.error("Failed to sync follow state to DB:", err)
    }
  }

  const addUserStory = (story: { image: string; caption: string }) => {
    setUserStories(prev => {
      const next = [...prev, story]
      try {
        const uid = getCurrentUserId()
        if (uid) localStorage.setItem(`stories_${uid}`, JSON.stringify(next))
      } catch { }
      return next
    })
    setUserStoryWatched(false)
  }

  const deleteUserStory = (index: number) => {
    setUserStories(prev => {
      const next = prev.filter((_, i) => i !== index)
      try {
        const uid = getCurrentUserId()
        if (uid) localStorage.setItem(`stories_${uid}`, JSON.stringify(next))
      } catch { }
      return next
    })
  }

  // ── Messaging ──────────────────────────────────────────────────────────────

  const msgCounterRef = useRef(1000)

  const sendMessage = (conversationId: number, text: string) => {
    const currentUser = (() => { try { return JSON.parse(localStorage.getItem("auth_user") || "{}") } catch { return {} } })()
    const currentUserId: string = String(currentUser.id || "")
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    msgCounterRef.current += 1
    const newMessage: Message = { id: msgCounterRef.current, text, isOwn: true, senderId: currentUserId, timestamp: timeStr, status: "sent" }

    setConversations(prev =>
      prev.map(conv => {
        if (conv.id !== conversationId) return conv
        // Only increment unread if the conversation is NOT currently open (i.e. the other party will see it)
        const isOpen = selectedConversation?.id === conversationId
        const updated = { ...conv, lastMessage: text, timestamp: "Just now", unread: isOpen ? 0 : conv.unread + 1, messages: [...conv.messages, newMessage] }
        if (isOpen) setSelectedConversation(updated)
        return updated
      })
    )
  }

  const getConversationMessages = (conversationId: number): Message[] =>
    conversations.find(c => c.id === conversationId)?.messages || []

  // ── Posts ──────────────────────────────────────────────────────────────────

  const toggleLikePost = async (postId: number) => {
    try {
      const user = JSON.parse(localStorage.getItem("auth_user") || "{}")
      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userId: user.id }),
      })
      if (response.ok) {
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
            : p
        ))
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      // Fallback to local update
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      ))
    }
  }

  const toggleSavePost = async (postId: number) => {
    try {
      const user = JSON.parse(localStorage.getItem("auth_user") || "{}")
      const response = await fetch("/api/posts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userId: user.id }),
      })
      if (response.ok) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: !p.isSaved } : p))
      }
    } catch (error) {
      console.error("Error toggling save:", error)
      // Fallback to local update
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: !p.isSaved } : p))
    }
  }

  const toggleFollowPost = (postId: number) => {
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, user: { ...p.user, isFollowing: !p.user.isFollowing } }
        : p
    ))
  }

  const addComment = async (postId: string | number, text: string) => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) {
        const u = JSON.parse(stored)
        if (u.id) {
          const res = await fetch("/api/posts/comment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, userId: u.id, text })
          })
          if (res.ok) {
            const newComment = await res.json()
            setPosts(prev => prev.map(p => {
              if (p.id === postId) {
                const existingList = p.commentsList || []
                return {
                  ...p,
                  comments: p.comments + 1,
                  commentsList: [...existingList, newComment]
                }
              }
              return p
            }))
            return
          }
        }
      }
    } catch (err) {
      console.error("Error posting comment to DB:", err)
    }

    // Fallback local update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const existingList = p.commentsList || []
        const newLocalComment = {
          id: Date.now(),
          userName: "You",
          userAvatar: "",
          text,
          createdAt: new Date().toISOString()
        }
        return {
          ...p,
          comments: p.comments + 1,
          commentsList: [...existingList, newLocalComment]
        }
      }
      return p
    }))
  }

  const deleteComment = async (postId: string | number, commentId: string | number) => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) {
        const u = JSON.parse(stored)
        if (u.id) {
          const res = await fetch("/api/posts/comment", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commentId, userId: u.id })
          })
          if (res.ok) {
            setPosts(prev => prev.map(p => {
              if (p.id === postId) {
                return {
                  ...p,
                  comments: Math.max(0, p.comments - 1),
                  commentsList: (p.commentsList || []).filter(c => c.id !== commentId)
                }
              }
              return p
            }))
            return
          }
        }
      }
    } catch (err) {
      console.error("Error deleting comment from DB:", err)
    }

    // Fallback local update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: Math.max(0, p.comments - 1),
          commentsList: (p.commentsList || []).filter(c => c.id !== commentId)
        }
      }
      return p
    }))
  }

  const addPost = async (image: string, description: string, tags: string[], location: string) => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (!stored) return
      const u = JSON.parse(stored)
      if (!u?.id) return

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: u.id,
          description,
          images: [image || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=600&fit=crop"],
          tags,
          location: location || "",
        }),
      })
      if (response.ok) {
        const newPost = await response.json()
        // Reload all posts with correct isLiked/isSaved for this user
        const all = await fetch(`/api/posts?userId=${u.id}`)
        if (all.ok) {
          const data = await all.json()
          if (Array.isArray(data)) setPosts(data)
        } else {
          setPosts(prev => [newPost, ...prev])
        }
      }
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  const deletePost = (postId: number) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  // ── Cart ────────────────────────────────────────────────────────────────────

  const addToCart = (item: CartItem) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: number) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
      }
      return prev.filter(i => i.id !== itemId)
    })
  }

  const updateCartItemQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(i => i.id !== itemId))
    } else {
      setCartItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i))
    }
  }

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

  return (
    <AppContext.Provider value={{
      conversations,
      selectedConversation,
      setSelectedConversation,
      setConversations,
      sendMessage,
      getConversationMessages,
      posts,
      toggleLikePost,
      toggleSavePost,
      toggleFollowPost,
      addComment,
      deleteComment,
      addPost,
      deletePost,
      reloadPosts,
      cartItems,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      cartTotal,
      activeTab,
      setActiveTab,
      followingIds,
      followingList,
      toggleFollow,
      userStories,
      addUserStory,
      deleteUserStory,
      userStoryWatched,
      setUserStoryWatched,
      userAvatar,
      setUserAvatar,
      userLocation,
      detectLocation,
      setUserLocation,
      sellerProducts,
      setSellerProducts,
      allSellerProducts,
      sellerOrders,
      addSellerOrder,
      updateSellerOrderStatus,
      hireRequests,
      addHireRequest,
      updateHireRequest,
      setHireRequests,
      sellerPreOrders,
      addSellerPreOrder,
      updateSellerPreOrderStatus,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useApp must be used within AppProvider")
  return context
}
