"use client"

import { useState, useRef, useEffect } from "react"
import {
  Plus, Search, Package, Edit2, Trash2, X, CheckCircle, Star,
  ShoppingBag, Truck, ToggleLeft, ToggleRight, QrCode, Banknote, Image as ImageIcon, Store, Camera,
  CalendarClock, MapPin, Phone, Calendar, Eye, User, RefreshCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, optimizeImage, resolveProductImage } from "@/lib/utils"
import { useApp } from "@/context/app-context"
import type { SellerProduct } from "@/context/app-context"

const emptyProduct: Omit<SellerProduct, "id"> = {
  name: "", brand: "", category: "cement", image: "",
  price: 0, unit: "", inStock: true, discount: 0, description: "", deliveryTime: "Same Day",
}

type StoreTab = "listings" | "orders" | "preorders"

export function SellerStorePage() {
  const { sellerProducts, setSellerProducts, updateSellerOrderStatus, updateSellerPreOrderStatus, allSellerProducts } = useApp()
  const [activeTab, setActiveTab] = useState<StoreTab>("listings")
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null)
  const [form, setForm] = useState<Omit<SellerProduct, "id">>(emptyProduct)
  const [saved, setSaved] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [viewingOrder, setViewingOrder] = useState<import("@/context/app-context").SellerOrder | null>(null)
  const [viewingPreOrder, setViewingPreOrder] = useState<import("@/context/app-context").SellerPreOrder | null>(null)
  const [clearConfirm, setClearConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rejectConfirmId, setRejectConfirmId] = useState<number | null>(null)
  const [viewingReviewsProduct, setViewingReviewsProduct] = useState<any | null>(null)

  // Separate persistent reviews store
  const [savedReviews] = useState<{ productId: number; rating: number; review: string }[]>(() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("global_product_reviews") || "[]") } catch { return [] }
    }
    return []
  })

  // Aggregate all ratings given per product ID
  const productRatings: { [id: number]: { total: number; count: number; reviews: string[] } } = {}
  for (const r of savedReviews) {
    if (r.rating && r.productId) {
      const id = r.productId
      if (!productRatings[id]) productRatings[id] = { total: 0, count: 0, reviews: [] }
      productRatings[id].total += r.rating
      productRatings[id].count += 1
      if (r.review?.trim()) productRatings[id].reviews.push(r.review.trim())
    }
  }
  
  // Track current user and refresh on login/logout
  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem("auth_user") || "{}")
    } catch { return {} }
  }
  const [currentUser, setCurrentUser] = useState(getCurrentUser)

  // Local orders/pre-orders state — read directly from localStorage so we always see the latest
  const [localOrders, setLocalOrders] = useState<import("@/context/app-context").SellerOrder[]>([])
  const [localPreOrders, setLocalPreOrders] = useState<import("@/context/app-context").SellerPreOrder[]>([])

  const refreshFromStorage = (user?: ReturnType<typeof getCurrentUser>) => {
    const u = user ?? getCurrentUser()
    const uid = String(u.id || "")
    if (!uid) return
    try {
      const ordersRaw = localStorage.getItem(`orders_${uid}`)
      setLocalOrders(ordersRaw ? JSON.parse(ordersRaw) : [])
    } catch { setLocalOrders([]) }
    try {
      const preOrdersRaw = localStorage.getItem(`preorders_${uid}`)
      setLocalPreOrders(preOrdersRaw ? JSON.parse(preOrdersRaw) : [])
    } catch { setLocalPreOrders([]) }
  }

  const handleClearHistory = () => {
    if (!clearConfirm) { setClearConfirm(true); return }
    const uid = String(getCurrentUser().id || "")
    if (!uid) { setClearConfirm(false); return }
    if (activeTab === "orders") {
      localStorage.removeItem(`orders_${uid}`)
      setLocalOrders([])
    } else if (activeTab === "preorders") {
      localStorage.removeItem(`preorders_${uid}`)
      setLocalPreOrders([])
    }
    setClearConfirm(false)
  }

  useEffect(() => {
    // Initial load
    refreshFromStorage()

    // Refresh when window regains focus (seller switches tabs or windows)
    const onFocus = () => refreshFromStorage()
    window.addEventListener("focus", onFocus)

    // Refresh periodically while page is open (every 5s)
    const interval = setInterval(() => refreshFromStorage(), 5000)

    const onAuthChange = () => {
      const user = getCurrentUser()
      setCurrentUser(user)
      refreshFromStorage(user)
    }
    window.addEventListener("auth-change", onAuthChange)

    const onStorage = (e: StorageEvent) => {
      const uid = String(getCurrentUser().id || "")
      if (uid && (e.key === `orders_${uid}` || e.key === `preorders_${uid}` || e.key === "global_seller_products")) {
        refreshFromStorage()
      }
    }
    window.addEventListener("storage", onStorage)

    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("auth-change", onAuthChange)
      window.removeEventListener("storage", onStorage)
      clearInterval(interval)
    }
  }, [])

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const optimized = await optimizeImage(file, 1600, 1600, 0.95)
      setForm(f => ({ ...f, image: optimized }))
    } catch (err) {
      console.error("Failed to optimize image:", err)
    }
    e.target.value = ""
  }

  const openAdd = () => { setEditingProduct(null); setForm(emptyProduct); setShowForm(true); setSaved(false) }
  const openEdit = (p: SellerProduct) => {
    setEditingProduct(p)
    setForm({ name: p.name, brand: p.brand, category: p.category, image: p.image, price: p.price, unit: p.unit, inStock: p.inStock, discount: p.discount, description: p.description, deliveryTime: p.deliveryTime || "Same Day" })
    setShowForm(true); setSaved(false)
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.brand.trim() || form.price <= 0 || !form.unit.trim() || !form.image) return
    if (editingProduct) {
      setSellerProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...form, id: editingProduct.id, sellerName: currentUser.name || "", sellerAvatar: currentUser.avatar || "", sellerId: currentUser.id || "" } : p))
    } else {
      setSellerProducts(prev => [...prev, { ...form, id: Date.now(), sellerName: currentUser.name || "", sellerAvatar: currentUser.avatar || "", sellerId: currentUser.id || "" }])
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); setShowForm(false) }, 1500)
  }

  const handleDelete = (id: number) => {
    setSellerProducts(prev => prev.filter(p => p.id !== id))
    setDeleteConfirmId(null)
  }

  const toggleStock = (id: number) => {
    setSellerProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: !p.inStock } : p))
  }

  // Only show this seller's own products in the My Store view
  // (All products are visible in the marketplace/materials page)
  const myProducts = sellerProducts.filter(p => !p.sellerId || p.sellerId === String(currentUser.id || ""))
  const filtered = myProducts.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Orders — use local state read from localStorage directly
  const sellerOrders = localOrders
  const sellerPreOrders = localPreOrders

  // Wrap updateStatus functions so they also sync local state
  const handleUpdateOrderStatus = (id: number, status: import("@/context/app-context").SellerOrder["status"]) => {
    const uid = String(currentUser.id || "")
    if (uid) {
      try {
        const key = `orders_${uid}`
        const existing: import("@/context/app-context").SellerOrder[] = JSON.parse(localStorage.getItem(key) || "[]")
        const targetOrder = existing.find(o => String(o.id) === String(id))
        
        // Sync to buyer_orders if possible
        if (targetOrder) {
          const buyerOrders = JSON.parse(localStorage.getItem("buyer_orders") || "[]")
          let modified = false
          const mappedStatus = status === "Delivered" ? "Delivered" : status === "Dispatched" ? "Dispatched" : status === "Cancelled" ? "Cancelled" : "Processing"
          const updatedBuyerOrders = buyerOrders.map((bo: any) => {
            if (String(bo.id) === String(targetOrder.id)) {
              modified = true
              return { ...bo, status: mappedStatus }
            }
            return bo
          })
          if (modified) localStorage.setItem("buyer_orders", JSON.stringify(updatedBuyerOrders))
        }

        const updated = existing.map(o => String(o.id) === String(id) ? { ...o, status } : o)
        localStorage.setItem(key, JSON.stringify(updated))
        setLocalOrders(updated)
      } catch {}
    }
    updateSellerOrderStatus(id, status)
  }

  const handleUpdatePreOrderStatus = (id: number, status: import("@/context/app-context").SellerPreOrder["status"]) => {
    const uid = String(currentUser.id || "")
    if (uid) {
      try {
        const key = `preorders_${uid}`
        const existing: import("@/context/app-context").SellerPreOrder[] = JSON.parse(localStorage.getItem(key) || "[]")
        const targetOrder = existing.find(o => String(o.id) === String(id))
        
        // Sync to buyer_preorders if possible
        if (targetOrder) {
          const buyerPreOrders = JSON.parse(localStorage.getItem("buyer_preorders") || "[]")
          let modified = false
          const updatedBuyerPreOrders = buyerPreOrders.map((bo: any) => {
            const isMatch = String(bo.id) === String(targetOrder.id) ||
              (bo.product && String(bo.product.id) === String(targetOrder.productId) && bo.buyerName === targetOrder.buyerName)
            if (isMatch) {
              if (bo.status === "Cancelled") return bo // Keep cancelled status!
              modified = true
              return { ...bo, status }
            }
            return bo
          })
          if (modified) localStorage.setItem("buyer_preorders", JSON.stringify(updatedBuyerPreOrders))
        }

        const updated = existing.map(r => String(r.id) === String(id) ? { ...r, status } : r)
        localStorage.setItem(key, JSON.stringify(updated))
        setLocalPreOrders(updated)
      } catch {}
    }
    updateSellerPreOrderStatus(id, status)
  }

  // Orders are per-user (already scoped), but filter by sellerId for extra safety
  const pendingOrders = sellerOrders.filter(o => o.status === "Pending")
  const activeOrders = sellerOrders.filter(o => o.status === "Confirmed" || o.status === "Dispatched")
  const deliveredOrders = sellerOrders.filter(o => o.status === "Delivered")

  // Dynamic seller store rating
  const myProductIds = myProducts.map(p => p.id)
  const myStoreReviews = savedReviews.filter(r => myProductIds.includes(r.productId))
  const myStoreReviewsCount = myStoreReviews.length
  const myStoreRating = myStoreReviewsCount > 0
    ? Math.round((myStoreReviews.reduce((sum, r) => sum + r.rating, 0) / myStoreReviewsCount) * 10) / 10
    : 0

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <Store className="w-7 h-7 text-emerald-600" /> My Store
          </h1>
          <p className="text-muted-foreground text-sm flex flex-wrap items-center gap-1.5 mt-1">
            <span>{sellerProducts.length} listing{sellerProducts.length !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{pendingOrders.length} pending order{pendingOrders.length !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{sellerPreOrders.filter(p => p.status === "Pending").length} pre-order{sellerPreOrders.filter(p => p.status === "Pending").length !== 1 ? "s" : ""}</span>
            <span>·</span>
            {myStoreReviewsCount > 0 ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                <Star className="w-3.5 h-3.5 fill-current animate-pulse text-amber-500" />
                {myStoreRating.toFixed(1)} ({myStoreReviewsCount} {myStoreReviewsCount === 1 ? "review" : "reviews"})
              </span>
            ) : (
              <span className="text-muted-foreground">No reviews yet</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(activeTab === "orders" || activeTab === "preorders") && (
            <button
              onClick={() => setClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition-all"
              title={`Clear ${activeTab === "orders" ? "orders" : "pre-orders"} history`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
          <Button className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Material
          </Button>
        </div>
      </div>

      {/* Search — always visible above tabs */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input placeholder="Search your materials..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 h-12 rounded-2xl bg-secondary border-0" />
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary rounded-2xl p-1">
        <button onClick={() => setActiveTab("listings")}
          className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
            activeTab === "listings" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <Package className="w-4 h-4" /> Listings
          {sellerProducts.length > 0 && <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full">{sellerProducts.length}</span>}
        </button>
        <button onClick={() => setActiveTab("orders")}
          className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
            activeTab === "orders" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <ShoppingBag className="w-4 h-4" /> Orders
          {pendingOrders.length > 0 && <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{pendingOrders.length}</span>}
        </button>
        <button onClick={() => setActiveTab("preorders")}
          className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
            activeTab === "preorders" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <CalendarClock className="w-4 h-4" /> Pre-Orders
          {sellerPreOrders.filter(p => p.status === "Pending").length > 0 && (
            <span className="bg-violet-100 text-violet-600 text-xs px-1.5 py-0.5 rounded-full">{sellerPreOrders.filter(p => p.status === "Pending").length}</span>
          )}
        </button>
      </div>

      {/* ── LISTINGS TAB ── */}
      {activeTab === "listings" && (
        <>

          {/* Empty state */}
          {sellerProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
                <Package className="w-10 h-10 text-emerald-300" />
              </div>
              <p className="font-semibold text-lg text-card-foreground">No materials listed yet</p>
              <p className="text-sm text-center">Add your first material to start receiving orders</p>
              <Button className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openAdd}>
                <Plus className="w-4 h-4" /> Add Your First Material
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Search className="w-8 h-8 opacity-30" />
              <p className="text-sm">No materials match your search</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(product => (
                <div key={product.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition">
                  {/* Image */}
                  <div className="relative w-full h-[160px] bg-secondary">
                    <img src={resolveProductImage(product.image, product.category)} alt={product.name}
                      onError={e => { e.currentTarget.src = resolveProductImage("", product.category) }}
                      className="w-full h-full object-cover" />
                    {product.discount > 0 && (
                      <span className="absolute top-2 left-2 bg-amber-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{product.discount}% OFF</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{product.brand}</p>
                      <h3 className="font-semibold text-base text-card-foreground mt-0.5 line-clamp-1">{product.name}</h3>
                      
                      {/* Rating stars display */}
                      {(() => {
                        const rData = productRatings[product.id]
                        const avgRating = rData ? Math.round((rData.total / rData.count) * 10) / 10 : 0
                        const reviewsCount = rData ? rData.count : 0
                        return (
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {reviewsCount > 0 ? (
                              <button
                                onClick={() => setViewingReviewsProduct({ ...product, rating: avgRating, reviews: reviewsCount })}
                                className="flex items-center gap-1 hover:underline text-left cursor-pointer"
                              >
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                <span className="font-semibold text-card-foreground">{avgRating}</span>
                                <span>({reviewsCount} {reviewsCount === 1 ? "review" : "reviews"})</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setViewingReviewsProduct({ ...product, rating: 0, reviews: 0 })}
                                className="flex items-center gap-1 hover:underline text-left cursor-pointer text-muted-foreground/50"
                              >
                                <Star className="h-3 w-3 text-muted-foreground/30" />
                                <span>No reviews yet</span>
                              </button>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-xl font-bold text-card-foreground">₹{product.price.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{product.unit}</p>
                        {product.deliveryTime && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Truck className="w-3 h-3" />{product.deliveryTime}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Stock toggle */}
                        <button onClick={() => toggleStock(product.id)}
                          className={cn("flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors",
                            product.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>
                          {product.inStock ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          {product.inStock ? "In Stock" : "Out"}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => openEdit(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-secondary hover:bg-muted text-xs font-medium text-card-foreground transition-colors">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => setDeleteConfirmId(product.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-xs font-medium text-red-600 transition-colors">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ORDERS TAB ── */}
      {activeTab === "orders" && (
        <div className="space-y-5">
          {sellerOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 opacity-30" />
              </div>
              <p className="font-semibold text-lg text-card-foreground">No orders yet</p>
              <p className="text-sm text-center">When buyers purchase your materials, orders will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...sellerOrders]
                .sort((a, b) => {
                  const statusOrder = { Pending: 0, Confirmed: 1, Dispatched: 2, Delivered: 3, Cancelled: 4 }
                  return statusOrder[a.status] - statusOrder[b.status]
                })
                .map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onUpdateStatus={handleUpdateOrderStatus} 
                    onViewDetails={setViewingOrder} 
                    onReject={setRejectConfirmId}
                  />
                ))
              }
            </div>
          )}
        </div>
      )}

      {/* ── PRE-ORDERS TAB ── */}
      {activeTab === "preorders" && (
        <div className="space-y-5">
          {sellerPreOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-violet-50 flex items-center justify-center">
                <CalendarClock className="w-10 h-10 text-violet-300" />
              </div>
              <p className="font-semibold text-lg text-card-foreground">No pre-orders yet</p>
              <p className="text-sm text-center">When buyers pre-order your materials for review, requests will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...sellerPreOrders]
                .sort((a, b) => {
                  const statusOrder = { Pending: 0, Confirmed: 1, Ready: 2, Cancelled: 3 }
                  return statusOrder[a.status] - statusOrder[b.status]
                })
                .map(req => (
                  <PreOrderCard key={req.id} req={req} onUpdate={handleUpdatePreOrderStatus} onViewDetails={setViewingPreOrder} />
                ))
              }
            </div>
          )}
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
            {saved ? (
              <div className="flex flex-col items-center justify-center p-10 gap-3">
                <CheckCircle className="w-14 h-14 text-emerald-500" />
                <p className="text-lg font-bold text-card-foreground">{editingProduct ? "Updated!" : "Material Added!"}</p>
                <p className="text-sm text-muted-foreground">Your listing has been saved</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                  <h3 className="font-semibold text-card-foreground">{editingProduct ? "Edit Material" : "Add New Material"}</h3>
                  <button onClick={() => setShowForm(false)} className="p-1 rounded-full hover:bg-secondary">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="p-4 space-y-3 overflow-y-auto flex-1">
                  {/* Photo upload */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Photo *</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "w-full rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors overflow-hidden",
                        form.image ? "border-solid border-emerald-300" : "h-28 flex flex-col items-center justify-center gap-2"
                      )}
                    >
                      {form.image ? (
                        <div className="relative">
                          <img src={form.image} alt="Preview" className="w-full h-36 object-cover rounded-xl"
                            onError={e => { e.currentTarget.src = "" }} />
                          <button onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, image: "" })) }}
                            className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center">
                            <X className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Camera className="w-7 h-7 text-muted-foreground/40" />
                          <p className="text-xs text-muted-foreground">Tap to upload photo</p>
                        </>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Material Name *</label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. UltraTech Cement 43 Grade" className="bg-secondary border-0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Brand *</label>
                    <Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. UltraTech" className="bg-secondary border-0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full h-10 px-3 rounded-xl bg-secondary border-0 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400">
                      <option value="cement">Cement</option>
                      <option value="sand">Sand</option>
                      <option value="steel">Steel</option>
                      <option value="bricks">Bricks</option>
                      <option value="pipes">Pipes</option>
                      <option value="electrical">Electrical</option>
                      <option value="paint">Paint</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Price (₹) *</label>
                      <Input type="number" min={0} value={form.price || ""} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="380" className="bg-secondary border-0" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Unit *</label>
                      <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="50kg bag" className="bg-secondary border-0" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Discount (%)</label>
                    <Input type="number" min={0} max={100} value={form.discount || ""} onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))} placeholder="0" className="bg-secondary border-0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" /> Delivery Time
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Same Day", "1-2 Days", "2-3 Days", "3-5 Days", "Contact Seller"].map(opt => (
                        <button key={opt} type="button"
                          onClick={() => setForm(f => ({ ...f, deliveryTime: opt }))}
                          className={cn("px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors",
                            form.deliveryTime === opt
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-secondary border-border text-secondary-foreground hover:border-emerald-300")}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-card-foreground">In Stock</span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, inStock: !f.inStock }))}
                      className={cn("relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none", form.inStock ? "bg-emerald-500" : "bg-gray-200")}>
                      <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200", form.inStock ? "translate-x-5" : "translate-x-0")} />
                    </button>
                  </div>
                </div>
                {/* Fixed button at bottom */}
                <div className="px-4 py-3 border-t border-border bg-card shrink-0">
                  <Button className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-semibold"
                    disabled={!form.name.trim() || !form.brand.trim() || form.price <= 0 || !form.unit.trim() || !form.image}
                    onClick={handleSave}>
                    {editingProduct ? "Save Changes" : "Add to Store"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-card-foreground">Remove listing?</h3>
            <p className="text-sm text-muted-foreground">This material will be removed from your store.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDelete(deleteConfirmId)}>Remove</Button>
            </div>
          </div>
        </div>
      )}

      {clearConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-card-foreground">Clear {activeTab === "orders" ? "Orders" : "Pre-Orders"} History?</h3>
            <p className="text-sm text-muted-foreground">Are you sure you want to clear your {activeTab === "orders" ? "orders" : "pre-orders"} history? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setClearConfirm(false)}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white" onClick={() => {
                const uid = String(getCurrentUser().id || "")
                if (uid) {
                  if (activeTab === "orders") {
                    const existing = JSON.parse(localStorage.getItem(`orders_${uid}`) || "[]")
                    const updated = existing.filter((o: any) => o.status !== "Delivered" && o.status !== "Cancelled")
                    localStorage.setItem(`orders_${uid}`, JSON.stringify(updated))
                    setLocalOrders(updated)
                  } else if (activeTab === "preorders") {
                    const existing = JSON.parse(localStorage.getItem(`preorders_${uid}`) || "[]")
                    const updated = existing.filter((po: any) => po.status === "Pending" || po.status === "Confirmed")
                    localStorage.setItem(`preorders_${uid}`, JSON.stringify(updated))
                    setLocalPreOrders(updated)
                  }
                }
                setClearConfirm(false)
              }}>Clear</Button>
            </div>
          </div>
        </div>
      )}

      {rejectConfirmId !== null && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-card-foreground">Reject Order?</h3>
            <p className="text-sm text-muted-foreground">Are you sure you want to reject/cancel this order? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setRejectConfirmId(null)}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white" onClick={() => {
                handleUpdateOrderStatus(rejectConfirmId, "Cancelled")
                setRejectConfirmId(null)
              }}>Reject</Button>
            </div>
          </div>
        </div>
      )}

      {viewingReviewsProduct && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h3 className="font-bold text-card-foreground text-lg">Customer Reviews</h3>
              <button 
                onClick={() => setViewingReviewsProduct(null)} 
                className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 bg-secondary rounded-xl p-3 shrink-0">
              <img
                src={resolveProductImage(viewingReviewsProduct.image, viewingReviewsProduct.category)}
                alt={viewingReviewsProduct.name}
                className="w-14 h-14 rounded-lg object-cover"
                onError={(e) => { e.currentTarget.src = resolveProductImage("", viewingReviewsProduct.category) }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{viewingReviewsProduct.brand}</p>
                <h4 className="font-bold text-card-foreground text-sm truncate">{viewingReviewsProduct.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                  {viewingReviewsProduct.reviews > 0 ? (
                    <>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-card-foreground">{viewingReviewsProduct.rating.toFixed(1)}</span>
                      <span>({viewingReviewsProduct.reviews} {viewingReviewsProduct.reviews === 1 ? "review" : "reviews"})</span>
                    </>
                  ) : (
                    <span>No reviews yet</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {savedReviews.filter(r => r.productId === viewingReviewsProduct.id).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No written reviews yet for this material.
                </div>
              ) : (
                savedReviews
                  .filter(r => r.productId === viewingReviewsProduct.id)
                  .map((r, idx) => (
                    <div key={idx} className="border-b border-border pb-3 last:border-0 last:pb-0 space-y-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            className={cn("w-3.5 h-3.5", star <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} 
                          />
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1">Verified Explorer</span>
                      </div>
                      {r.review && (
                        <p className="text-sm text-card-foreground italic">"{r.review}"</p>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-card-foreground">Order Details</h3>
              <button onClick={() => setViewingOrder(null)} className="p-1 rounded-full hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Product */}
              <div className="flex gap-3">
                {(() => {
                  const p = allSellerProducts.find(x => x.id === viewingOrder.productId)
                  return (
                    <img src={resolveProductImage(viewingOrder.productImage, p?.category || "")}
                      alt={viewingOrder.productName}
                      className="w-20 h-20 rounded-xl object-cover"
                      onError={e => { e.currentTarget.src = resolveProductImage("", p?.category || "") }} />
                  )
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Order #{String(viewingOrder.id).slice(-6)}</p>
                  <h4 className="font-bold text-card-foreground mt-0.5">{viewingOrder.productName}</h4>
                  <p className="text-sm text-muted-foreground">{viewingOrder.quantity} unit{viewingOrder.quantity > 1 ? "s" : ""}</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">₹{viewingOrder.totalPrice.toLocaleString()}</p>
                </div>
              </div>

              {/* Status */}
              <div className="bg-secondary rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Order Status</span>
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full",
                    viewingOrder.status === "Pending" ? "bg-amber-100 text-amber-700" :
                    viewingOrder.status === "Confirmed" ? "bg-blue-100 text-blue-700" :
                    viewingOrder.status === "Dispatched" ? "bg-violet-100 text-violet-700" :
                    viewingOrder.status === "Cancelled" ? "bg-red-100 text-red-700" :
                    "bg-emerald-100 text-emerald-700")}>
                    {viewingOrder.status}
                  </span>
                </div>
              </div>

              {/* Buyer Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <ShoppingBag className="w-3 h-3 text-emerald-600" />
                  </div>
                  Buyer Information
                </h4>
                <div className="bg-secondary rounded-xl p-3 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-semibold text-card-foreground">{viewingOrder.buyerName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-border">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Phone Number</p>
                      <p className="font-medium text-card-foreground">{viewingOrder.buyerPhone || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-border">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Delivery Address</p>
                      <p className="font-medium text-card-foreground">{viewingOrder.buyerLocation || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                  <div className={cn("flex items-center gap-1.5 font-semibold text-sm",
                    viewingOrder.paymentMethod === "qr" ? "text-blue-700" : "text-amber-700")}>
                    {viewingOrder.paymentMethod === "qr" ? <QrCode className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                    <span>{viewingOrder.paymentMethod === "qr" ? "UPI Payment" : "Cash on Delivery"}</span>
                  </div>
                  {viewingOrder.paymentMethod === "qr" && viewingOrder.upiTxnId && (
                    <p className="text-[10px] font-mono text-muted-foreground mt-1 select-all">UTR: {viewingOrder.upiTxnId}</p>
                  )}
                </div>
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Order Date</p>
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-card-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{viewingOrder.date}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Order Details Modal */}
      {viewingPreOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-card-foreground">Pre-Order Details</h3>
              <button onClick={() => setViewingPreOrder(null)} className="p-1 rounded-full hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Product */}
              <div className="flex gap-3">
                {(() => {
                  const p = allSellerProducts.find(x => x.id === viewingPreOrder.productId)
                  return (
                    <img src={resolveProductImage(viewingPreOrder.productImage, p?.category || "")}
                      alt={viewingPreOrder.productName}
                      className="w-20 h-20 rounded-xl object-cover"
                      onError={e => { e.currentTarget.src = resolveProductImage("", p?.category || "") }} />
                  )
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pre-Order #{String(viewingPreOrder.id).slice(-6)}</p>
                  <h4 className="font-bold text-card-foreground mt-0.5">{viewingPreOrder.productName}</h4>
                  <p className="text-sm text-muted-foreground">{viewingPreOrder.quantity} × {viewingPreOrder.productUnit}</p>
                  <p className="text-lg font-bold text-violet-600 mt-1">Est. ₹{viewingPreOrder.estimatedValue.toLocaleString()}</p>
                </div>
              </div>

              {/* Status */}
              <div className="bg-secondary rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Request Status</span>
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full",
                    viewingPreOrder.status === "Pending" ? "bg-violet-100 text-violet-700" :
                    viewingPreOrder.status === "Confirmed" ? "bg-blue-100 text-blue-700" :
                    viewingPreOrder.status === "Ready" ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-600")}>
                    {viewingPreOrder.status}
                  </span>
                </div>
              </div>

              {/* Buyer Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                    <User className="w-3 h-3 text-violet-600" />
                  </div>
                  Buyer Information
                </h4>
                <div className="bg-secondary rounded-xl p-3 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-semibold text-card-foreground">{viewingPreOrder.buyerName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-border">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Phone Number</p>
                      <p className="font-medium text-card-foreground">{viewingPreOrder.buyerPhone || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-border">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Delivery Address</p>
                      <p className="font-medium text-card-foreground">{viewingPreOrder.buyerAddress || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Request Date</p>
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-card-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{viewingPreOrder.date}</span>
                  </div>
                </div>
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Expected By</p>
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-card-foreground">
                    <CalendarClock className="w-4 h-4 text-violet-600" />
                    <span>{new Date(viewingPreOrder.expectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Pre-Order card sub-component
function PreOrderCard({ req, onUpdate, onViewDetails }: {
  req: import("@/context/app-context").SellerPreOrder
  onUpdate: (id: number, status: import("@/context/app-context").SellerPreOrder["status"]) => void
  onViewDetails: (req: import("@/context/app-context").SellerPreOrder) => void
}) {
  const { allSellerProducts } = useApp()
  const statusColor = {
    Pending:   "bg-violet-100 text-violet-700",
    Confirmed: "bg-blue-100 text-blue-700",
    Ready:     "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-600",
  }
  const nextStatus: Record<string, import("@/context/app-context").SellerPreOrder["status"] | null> = {
    Pending:   "Confirmed",
    Confirmed: "Ready",
    Ready:     null,
    Cancelled: null,
  }
  const next = nextStatus[req.status]

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition flex flex-col">
      {/* Product image with status badge overlay */}
      <div className="relative w-full h-[160px] bg-secondary shrink-0 overflow-hidden">
        {(() => {
          const p = allSellerProducts.find(x => x.id === req.productId)
          return (
            <img
              src={resolveProductImage(req.productImage, p?.category || "")}
              alt={req.productName}
              className="w-full h-full object-cover"
              onError={e => { e.currentTarget.src = resolveProductImage("", p?.category || "") }}
            />
          )
        })()}
        {/* Status badge */}
        <div className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase shadow-sm", statusColor[req.status])}>
          {req.status}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground tracking-wide uppercase">Pre-Order #{String(req.id).slice(-6)}</p>
          <h3 className="text-base font-bold text-card-foreground leading-tight line-clamp-1 mt-0.5">{req.productName}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{req.quantity} × {req.productUnit}</p>
        </div>
        
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xl font-bold text-violet-600">Est. ₹{req.estimatedValue.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-muted-foreground">{req.date}</p>
              <span className="text-muted-foreground text-[10px]">•</span>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                <Calendar className="w-3 h-3" />
                <span>Need by {new Date(req.expectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {next && (
            <Button className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white h-9 gap-1.5 font-semibold text-xs"
              onClick={() => onUpdate(req.id, next)}>
              <CalendarClock className="w-3.5 h-3.5" />
              {next === "Confirmed" ? "Confirm Request" : "Mark Ready for Review"}
            </Button>
          )}
          {req.status === "Pending" && (
            <Button variant="outline" className="flex-1 rounded-xl border-red-200 text-red-500 hover:bg-red-50 h-9 font-semibold text-xs"
              onClick={() => onUpdate(req.id, "Cancelled")}>
              Cancel
            </Button>
          )}
          {req.status === "Ready" && (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Ready for Review</span>
            </div>
          )}
          {req.status === "Cancelled" && (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold">
              <X className="w-3.5 h-3.5" />
              Cancelled
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => onViewDetails(req)}
            className="rounded-xl px-3 h-9 text-xs text-muted-foreground hover:text-card-foreground"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Order card sub-component
function OrderCard({ order, onUpdateStatus, onViewDetails, onReject }: {
  order: import("@/context/app-context").SellerOrder
  onUpdateStatus: (id: number, status: import("@/context/app-context").SellerOrder["status"]) => void
  onViewDetails: (order: import("@/context/app-context").SellerOrder) => void
  onReject: (id: number) => void
}) {
  const { allSellerProducts } = useApp()
  const statusConfig = {
    Pending:   { color: "text-amber-700",  bg: "bg-amber-50  border-amber-200",  dot: "bg-amber-400" },
    Confirmed: { color: "text-blue-700",   bg: "bg-blue-50   border-blue-200",   dot: "bg-blue-400" },
    Dispatched:{ color: "text-violet-700", bg: "bg-violet-50 border-violet-200", dot: "bg-violet-400" },
    Delivered: { color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200",dot: "bg-emerald-400" },
    Cancelled: { color: "text-red-700",    bg: "bg-red-50    border-red-200",    dot: "bg-red-400" },
  }
  const cfg = statusConfig[order.status]

  const nextLabel: Record<string, string> = {
    Pending: "Confirm Order",
    Confirmed: "Mark Dispatched",
    Dispatched: "Mark Delivered",
  }
  const nextStatus: Record<string, import("@/context/app-context").SellerOrder["status"] | null> = {
    Pending: "Confirmed",
    Confirmed: "Dispatched",
    Dispatched: "Delivered",
    Delivered: null,
    Cancelled: null,
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition flex flex-col">
      {/* Product image with status badge overlay */}
      <div className="relative w-full h-[160px] bg-secondary shrink-0 overflow-hidden">
        {(() => {
          const p = allSellerProducts.find(x => x.id === order.productId)
          return (
            <img
              src={resolveProductImage(order.productImage, p?.category || "")}
              alt={order.productName}
              className="w-full h-full object-cover"
              onError={e => { e.currentTarget.src = resolveProductImage("", p?.category || "") }}
            />
          )
        })()}
        {/* Status badge */}
        <div className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase shadow-sm", cfg.bg)}>
          <span className={cfg.color}>{order.status}</span>
        </div>
      </div>

      {/* Product details */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground tracking-wide uppercase">Order #{String(order.id).slice(-6)}</p>
          <h3 className="text-base font-bold text-card-foreground leading-tight line-clamp-1 mt-0.5">{order.productName}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{order.quantity} unit{order.quantity > 1 ? "s" : ""}</p>
        </div>
        
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xl font-bold text-card-foreground">₹{order.totalPrice.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-muted-foreground">{order.date}</p>
              <span className="text-muted-foreground text-[10px]">•</span>
              <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                order.paymentMethod === "qr" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>
                {order.paymentMethod === "qr" ? <QrCode className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                <span>{order.paymentMethod === "qr" ? "UPI" : "COD"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer to push buttons to bottom if needed */}
        <div className="flex-1"></div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {nextStatus[order.status] ? (
            <>
              <Button
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-9 gap-1.5 font-semibold text-xs"
                onClick={() => onUpdateStatus(order.id, nextStatus[order.status]!)}
              >
                <Truck className="w-3.5 h-3.5" />
                {nextLabel[order.status]}
              </Button>
              {order.status === "Pending" && (
                <Button
                  variant="outline"
                  className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 h-9 font-semibold text-xs px-2.5"
                  onClick={() => onReject(order.id)}
                >
                  Reject
                </Button>
              )}
            </>
          ) : order.status === "Cancelled" ? (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold">
              <X className="w-3.5 h-3.5" />
              Cancelled
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              Delivered
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => onViewDetails(order)}
            className="rounded-xl px-3 h-9 text-xs text-muted-foreground hover:text-card-foreground"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
