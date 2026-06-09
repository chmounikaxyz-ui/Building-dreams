"use client"

import { useState, useEffect } from "react"
import type { LucideIcon } from "lucide-react"
import { Search, ShoppingCart, Plus, Minus, Truck, Clock, Star, ChevronRight, Layers, Droplet, HardHat, Wrench, Zap, Paintbrush, Grid, Package, X, CheckCircle, Trash2, QrCode, Banknote, ClipboardList, FlaskConical, MessageSquare, ShoppingBag, CalendarClock, MapPin, Phone, Calendar, AlertCircle, MoreHorizontal, Store, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, resolveProductImage } from "@/lib/utils"
import { useApp } from "@/context/app-context"

type Product = {
  id: number
  name: string
  brand: string
  category: string
  image: string
  price: number
  unit: string
  rating: number
  reviews: number
  deliveryTime: string
  inStock: boolean
  discount: number
  sellerName: string
  sellerAvatar: string
}

const categories: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All", icon: Package },
  { id: "cement", label: "Cement", icon: Layers },
  { id: "sand", label: "Sand", icon: Droplet },
  { id: "steel", label: "Steel", icon: HardHat },
  { id: "bricks", label: "Bricks", icon: Grid },
  { id: "pipes", label: "Pipes", icon: Wrench },
  { id: "electrical", label: "Electrical", icon: Zap },
  { id: "paint", label: "Paint", icon: Paintbrush },
  { id: "other", label: "Other", icon: MoreHorizontal },
]

export function MaterialsPage({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { cartItems, addToCart, removeFromCart, updateCartItemQuantity, cartTotal, addSellerOrder, allSellerProducts, addSellerPreOrder, sellerProducts, updateSellerOrderStatus, updateSellerPreOrderStatus } = useApp()

  // Validation helpers
  const isPhoneValid = (p: string) => /^(?:\+91|0)?[6-9]\d{9}$/.test(p.trim())
  const isAddressValid = (a: string) => a.trim().length >= 10

  const [activeCategory, setActiveCategory] = useState("all")
  const [showCart, setShowCart] = useState(false)
  const [sellers, setSellers] = useState<any[]>([])

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await fetch("/api/users")
        if (res.ok) {
          const data = await res.json()
          const sellerUsers = data.filter((u: any) => u.role === "seller")
          setSellers(sellerUsers)
        }
      } catch (err) {
        console.error("Failed to fetch sellers:", err)
      }
    }
    fetchSellers()
  }, [])
  const [searchQuery, setSearchQuery] = useState("")
  const [showCheckout, setShowCheckout] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [showOrders, setShowOrders] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)
  // Per-store delivery details: { [sellerId]: { address, phone, paymentMethod } }
  const [storeDelivery, setStoreDelivery] = useState<{
    [sellerId: string]: { address: string; phone: string; paymentMethod: "qr" | "cod" }
  }>({})
  const [checkoutStep, setCheckoutStep] = useState(0) // which store's step is being shown
  const [orders, setOrders] = useState<{
    id: number
    date: string
    items: typeof cartItems
    total: number
    status: "Delivered" | "Dispatched" | "Processing" | "Cancelled"
    itemRatings: { [itemId: number]: { rating: number; review: string } }
  }[]>(() => {
    try { return JSON.parse(localStorage.getItem("buyer_orders") || "[]") } catch { return [] }
  })
  // itemRatingDraft: { [orderId]: { [itemId]: { rating, review } } }
  const [itemRatingDraft, setItemRatingDraft] = useState<{
    [orderId: number]: { [itemId: number]: { rating: number; review: string } }
  }>({})

  // Sample requests
  type SampleRequest = {
    id: number
    date: string
    product: Product
    address: string
    status: "Requested" | "Dispatched" | "Delivered"
    rating: number | null
    review: string | null
  }
  const [samples, setSamples] = useState<SampleRequest[]>([])
  const [sampleProduct, setSampleProduct] = useState<Product | null>(null)
  const [sampleAddress, setSampleAddress] = useState("")
  const [sampleDate, setSampleDate] = useState("")
  const [sampleSubmitted, setSampleSubmitted] = useState(false)
  const [sampleRatingDraft, setSampleRatingDraft] = useState<{ [id: number]: number }>({})
  const [sampleReviewDraft, setSampleReviewDraft] = useState<{ [id: number]: string }>({})
  const [ordersTab, setOrdersTab] = useState<"orders" | "preorders">("orders")

  // Pre-order state
  type PreOrder = {
    id: number
    date: string
    product: Product
    quantity: number
    address: string
    phone: string
    expectedDate: string
    status: "Pending" | "Confirmed" | "Ready" | "Cancelled"
    rating: number | null
    review: string | null
  }
  const [preOrders, setPreOrders] = useState<PreOrder[]>(() => {
    try { return JSON.parse(localStorage.getItem("buyer_preorders") || "[]") } catch { return [] }
  })

  // Separate persistent reviews store — survives clearing order history
  type SavedReview = { productId: number; rating: number; review: string }
  const [savedReviews, setSavedReviews] = useState<SavedReview[]>(() => {
    try { return JSON.parse(localStorage.getItem("global_product_reviews") || "[]") } catch { return [] }
  })

  useEffect(() => {
    try { localStorage.setItem("global_product_reviews", JSON.stringify(savedReviews)) } catch {}
  }, [savedReviews])

  const [viewingReviewsProduct, setViewingReviewsProduct] = useState<Product | null>(null)
  const [cancelOrderConfirmId, setCancelOrderConfirmId] = useState<number | null>(null)
  const [cancelPreOrderConfirmId, setCancelPreOrderConfirmId] = useState<number | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "verifying" | "success">("idle")

  // Persist orders to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem("buyer_orders", JSON.stringify(orders)) } catch {}
  }, [orders])

  // Persist pre-orders to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem("buyer_preorders", JSON.stringify(preOrders)) } catch {}
  }, [preOrders])

  // Sync buyer orders with actual seller statuses on mount
  useEffect(() => {
    let modifiedOrders = false
    let modifiedPreOrders = false
    
    const allSellerOrders: any[] = []
    const allSellerPreOrders: any[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("orders_")) {
        try { allSellerOrders.push(...JSON.parse(localStorage.getItem(key) || "[]")) } catch {}
      }
      if (key?.startsWith("preorders_")) {
        try { allSellerPreOrders.push(...JSON.parse(localStorage.getItem(key) || "[]")) } catch {}
      }
    }

    setOrders(prev => {
      const next = prev.map(o => {
        let newStatus = o.status
        const matchingSellerOrder = allSellerOrders.find(so => String(so.id) === String(o.id))
        if (matchingSellerOrder) {
          newStatus = matchingSellerOrder.status === "Delivered" ? "Delivered" : matchingSellerOrder.status === "Dispatched" ? "Dispatched" : matchingSellerOrder.status === "Cancelled" ? "Cancelled" : "Processing"
        }
        if (newStatus !== o.status) {
          modifiedOrders = true
          return { ...o, status: newStatus }
        }
        return o
      })
      return modifiedOrders ? next : prev
    })

    const buyerName = (() => { try { return JSON.parse(localStorage.getItem("auth_user") || "{}").name || "Buyer" } catch { return "Buyer" } })()

    setPreOrders(prev => {
      const next = prev.map(po => {
        if (po.status === "Cancelled") return po
        let newStatus = po.status
        const matchingSellerPreOrder = allSellerPreOrders.find(spo => String(spo.id) === String(po.id)) ||
          allSellerPreOrders.find(spo => String(spo.productId) === String(po.product.id) && spo.buyerName === buyerName)
        if (matchingSellerPreOrder) {
          newStatus = matchingSellerPreOrder.status
        }
        if (newStatus !== po.status) {
          modifiedPreOrders = true
          return { ...po, status: newStatus }
        }
        return po
      })
      return modifiedPreOrders ? next : prev
    })
  }, [])

  // Group cart items by seller
  const cartByStore = (() => {
    const map: { sellerId: string; sellerName: string; items: typeof cartItems }[] = []
    for (const item of cartItems) {
      const product = allSellerProducts.find(p => String(p.id) === String(item.id)) || sellerProducts.find(p => String(p.id) === String(item.id))
      const sellerId = product?.sellerId || "unknown"
      const sellerName = product?.sellerName || product?.brand || "Unknown Store"
      const existing = map.find(g => g.sellerId === sellerId)
      if (existing) existing.items.push(item)
      else map.push({ sellerId, sellerName, items: [item] })
    }
    return map
  })()

  useEffect(() => {
    if (showCheckout) {
      try {
        const currentUser = JSON.parse(localStorage.getItem("auth_user") || "{}")
        // Pre-fill delivery details for each store group
        setStoreDelivery(prev => {
          const next = { ...prev }
          for (const group of cartByStore) {
            if (!next[group.sellerId]) {
              next[group.sellerId] = {
                address: currentUser.location || "",
                phone: currentUser.phone || "",
                paymentMethod: "qr",
              }
            }
          }
          return next
        })
        setCheckoutStep(0)
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCheckout])
  const [preOrderProduct, setPreOrderProduct] = useState<Product | null>(null)
  const [showPreOrderModal, setShowPreOrderModal] = useState(false)
  const [preOrderQty, setPreOrderQty] = useState(1)
  const [preOrderAddress, setPreOrderAddress] = useState("")
  const [preOrderPhone, setPreOrderPhone] = useState("")
  const [preOrderDate, setPreOrderDate] = useState("")
  const [preOrderSubmitted, setPreOrderSubmitted] = useState(false)
  const [preOrderRatingDraft, setPreOrderRatingDraft] = useState<{ [id: number]: number }>({})
  const [preOrderReviewDraft, setPreOrderReviewDraft] = useState<{ [id: number]: string }>({})
  const [currentSellerUpi, setCurrentSellerUpi] = useState("construction@upi")

  // Pre-fill pre-order details from logged-in user profile
  useEffect(() => {
    if (showPreOrderModal && preOrderProduct) {
      try {
        const currentUser = JSON.parse(localStorage.getItem("auth_user") || "{}")
        setPreOrderAddress(currentUser.location || "")
        setPreOrderPhone(currentUser.phone || "")
      } catch {}
    }
  }, [showPreOrderModal, preOrderProduct])

  // Dynamically load active checkout seller's registered UPI ID
  useEffect(() => {
    const currentGroup = cartByStore[checkoutStep]
    if (currentGroup?.sellerId) {
      fetch(`/api/users/${currentGroup.sellerId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.upiId) {
            setCurrentSellerUpi(data.upiId)
          } else {
            setCurrentSellerUpi("construction@upi")
          }
        })
        .catch(() => setCurrentSellerUpi("construction@upi"))
    } else {
      setCurrentSellerUpi("construction@upi")
    }
  }, [checkoutStep, showCheckout, cartItems])

  const handleSubmitPreOrder = () => {
    if (!preOrderProduct || !preOrderAddress.trim() || !preOrderPhone.trim() || !preOrderDate) return
    const buyerName = (() => { try { return JSON.parse(localStorage.getItem("auth_user") || "{}").name || "Buyer" } catch { return "Buyer" } })()
    const matchingProduct = allSellerProducts.find(p => String(p.id) === String(preOrderProduct.id)) || sellerProducts.find(p => String(p.id) === String(preOrderProduct.id))
    const sellerId = matchingProduct?.sellerId || (preOrderProduct as any).sellerId || ""
    const newPreOrderId = Date.now()
    const newPreOrder: PreOrder = {
      id: newPreOrderId,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      product: {
        ...preOrderProduct,
        image: resolveProductImage(preOrderProduct.image, preOrderProduct.category),
        sellerId
      },
      quantity: preOrderQty,
      address: preOrderAddress,
      phone: preOrderPhone,
      expectedDate: preOrderDate,
      status: "Pending",
      rating: null,
      review: null,
    }
    setPreOrders(prev => [newPreOrder, ...prev])
    
    // Push to seller's pre-order list via context
    addSellerPreOrder({
      id: newPreOrderId,
      buyerName,
      buyerPhone: preOrderPhone,
      buyerAddress: preOrderAddress,
      productId: preOrderProduct.id,
      productName: preOrderProduct.name,
      productImage: resolveProductImage(preOrderProduct.image, preOrderProduct.category),
      productUnit: preOrderProduct.unit,
      quantity: preOrderQty,
      estimatedValue: preOrderProduct.price * preOrderQty,
      expectedDate: preOrderDate,
      sellerId,
    })
    setPreOrderSubmitted(true)
    setTimeout(() => {
      setPreOrderSubmitted(false)
      setShowPreOrderModal(false)
      setPreOrderProduct(null)
      setPreOrderQty(1)
      setPreOrderAddress("")
      setPreOrderPhone("")
      setPreOrderDate("")
    }, 2500)
  }

  const handleRequestSample = () => {
    if (!sampleProduct || !sampleAddress.trim()) return
    const newSample: SampleRequest = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      product: sampleProduct,
      address: sampleAddress,
      status: "Requested",
      rating: null,
      review: null,
    }
    setSamples(prev => [newSample, ...prev])
    setSampleSubmitted(true)
    setTimeout(() => {
      setSampleSubmitted(false)
      setSampleProduct(null)
      setSampleAddress("")
      setSampleDate("")
    }, 2000)
  }

  const handleContactSeller = async (sellerName: string, sellerAvatar: string, sellerId?: string) => {
    console.log('🔵 handleContactSeller called:', { sellerName, sellerAvatar, sellerId })
    const currentUser = (() => { try { return JSON.parse(localStorage.getItem("auth_user") || "{}") } catch { return {} } })()
    console.log('🔵 Current user:', { id: currentUser.id, name: currentUser.name })
    let resolvedSellerId = sellerId || ""

    // If sellerId not stamped on product, look up seller by exact name in DB
    if (!resolvedSellerId && sellerName) {
      console.log('🔵 Looking up seller by name:', sellerName)
      try {
        const res = await fetch(`/api/users?name=${encodeURIComponent(sellerName)}`)
        if (res.ok) {
          const users = await res.json()
          console.log('🔵 Found users:', users)
          // Find exact name match
          const found = Array.isArray(users) ? users.find((u: any) => u.name === sellerName) : null
          resolvedSellerId = found?.id || ""
          console.log('🔵 Resolved seller ID:', resolvedSellerId)
        }
      } catch (err) {
        console.error('🔴 User lookup error:', err)
      }
    }

    if (!resolvedSellerId) {
      alert("Seller not found. Please ask the seller to re-login and re-save their product.")
      return
    }
    if (resolvedSellerId === String(currentUser.id)) {
      console.log('🔵 Cannot message yourself')
      return // can't message yourself
    }

    console.log('🔵 Creating conversation:', { userId: currentUser.id, otherUserId: resolvedSellerId })
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: String(currentUser.id), otherUserId: resolvedSellerId })
      })
      const data = await res.json()
      console.log('🔵 Conversation response:', data, 'Status:', res.status)
      if (res.ok) {
        console.log('🔵 Switching to messages tab')
        setActiveTab?.("messages")
      } else {
        alert(data.error || "Could not start conversation. Please try again.")
      }
    } catch (err) {
      console.error("Contact seller error:", err)
    }
  }

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

  const filteredProducts = allSellerProducts.map(sp => {
      const rData = productRatings[sp.id]
      const avgRating = rData ? Math.round((rData.total / rData.count) * 10) / 10 : 0
      const topReview = rData?.reviews?.length ? rData.reviews[rData.reviews.length - 1] : ""
      return {
        id: sp.id,
        name: sp.name,
        brand: sp.brand,
        category: sp.category,
        image: sp.image,
        price: sp.price,
        unit: sp.unit,
        rating: avgRating,
        reviews: rData?.count ?? 0,
        topReview,
        deliveryTime: sp.deliveryTime || "Contact Seller",
        inStock: sp.inStock,
        discount: sp.discount,
        sellerName: sp.sellerName || sp.brand,
        sellerAvatar: sp.sellerAvatar || "",
        sellerId: sp.sellerId || "",
      }
    }).filter(p =>
    (activeCategory === "all" || p.category === activeCategory) &&
    (searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      unit: product.unit,
      quantity: 1,
      image: resolveProductImage(product.image, product.category)
    })
  }

  const getCartQuantity = (productId: number) => {
    return cartItems.find(item => item.id === productId)?.quantity || 0
  }

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  const executePlaceOrder = () => {
    const buyerName = (() => { try { return JSON.parse(localStorage.getItem("auth_user") || "{}").name || "Buyer" } catch { return "Buyer" } })()

    const newBuyerOrders: typeof orders = []
    cartByStore.forEach((group, groupIdx) => {
      const delivery = storeDelivery[group.sellerId] || { address: "", phone: "", paymentMethod: "cod" as const }
      group.items.forEach((item, idx) => {
        const total = item.price * item.quantity
        const orderId = Date.now() + groupIdx * 1000 + idx
        const product = allSellerProducts.find(p => String(p.id) === String(item.id)) || sellerProducts.find(p => String(p.id) === String(item.id))

        const newOrder = {
          id: orderId,
          date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          items: [{
            ...item,
            image: resolveProductImage(item.image, product?.category || "")
          }],
          total: total,
          status: "Processing" as const,
          itemRatings: {},
        }
        newBuyerOrders.push(newOrder)

        addSellerOrder({
          id: orderId,
          buyerName,
          buyerPhone: delivery.phone,
          buyerLocation: delivery.address,
          productId: item.id,
          productName: item.name,
          productImage: resolveProductImage(item.image, product?.category || ""),
          quantity: item.quantity,
          totalPrice: total,
          paymentMethod: delivery.paymentMethod,
          sellerId: group.sellerId,
          upiTxnId: delivery.upiTxnId,
        })
      })
    })

    setOrders(prev => [...newBuyerOrders, ...prev])
    setOrderPlaced(true)
    setTimeout(() => {
      setOrderPlaced(false)
      setShowCheckout(false)
      setShowCart(false)
      setStoreDelivery({})
      cartItems.forEach(item => updateCartItemQuantity(item.id, 0))
    }, 2500)
  }

  const handlePlaceOrder = () => {
    const hasUpi = cartByStore.some(g => (storeDelivery[g.sellerId]?.paymentMethod || "qr") === "qr")
    
    if (hasUpi) {
      setPaymentStatus("verifying")
      setTimeout(() => {
        setPaymentStatus("success")
        setTimeout(() => {
          setPaymentStatus("idle")
          executePlaceOrder()
        }, 1500)
      }, 2500)
    } else {
      // For COD, place the order directly without showing the payment gateway modal
      executePlaceOrder()
    }
  }

  const handleCancelOrder = (orderId: number) => {
    // 1. Update local buyer orders state
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Cancelled" as const } : o))

    // 2. Find the buyer order to get its items and match with seller orders
    const targetOrder = orders.find(o => o.id === orderId)
    if (!targetOrder) return

    const buyerName = (() => { try { return JSON.parse(localStorage.getItem("auth_user") || "{}").name || "Buyer" } catch { return "Buyer" } })()

    // 3. For each item in the order, find and update the corresponding seller order in localStorage
    targetOrder.items.forEach(item => {
      // Find the product to identify the seller
      const product = allSellerProducts.find(p => String(p.id) === String(item.id)) || sellerProducts.find(p => String(p.id) === String(item.id))
      const sellerId = product?.sellerId || ""
      if (sellerId) {
        try {
          const key = `orders_${sellerId}`
          const sellerOrdersRaw = localStorage.getItem(key)
          if (sellerOrdersRaw) {
            const existingOrders: any[] = JSON.parse(sellerOrdersRaw)
            // Update the matching order.
            const updatedOrders = existingOrders.map(so => {
              if (String(so.id) === String(orderId)) {
                // Also trigger context update if the seller is currently logged in
                updateSellerOrderStatus(so.id, "Cancelled")
                return { ...so, status: "Cancelled" }
              }
              return so
            })
            localStorage.setItem(key, JSON.stringify(updatedOrders))
          }
        } catch (err) {
          console.error("Failed to cancel seller order:", err)
        }
      }
    })
  }

  const handleCancelPreOrder = (preOrderId: number) => {
    // 1. Update local buyer pre-orders state
    setPreOrders(prev => prev.map(po => po.id === preOrderId ? { ...po, status: "Cancelled" as const } : po))

    // 2. Find the target pre-order
    const targetPreOrder = preOrders.find(po => po.id === preOrderId)
    if (!targetPreOrder) return

    const buyerName = (() => { try { return JSON.parse(localStorage.getItem("auth_user") || "{}").name || "Buyer" } catch { return "Buyer" } })()

    // 3. Find seller and update the pre-order in their localStorage
    const product = targetPreOrder.product
    const matchingProduct = allSellerProducts.find(p => String(p.id) === String(product.id)) || sellerProducts.find(p => String(p.id) === String(product.id))
    const sellerId = product?.sellerId || (product as any).sellerId || matchingProduct?.sellerId || ""
    if (sellerId) {
      try {
        const key = `preorders_${sellerId}`
        const sellerPreOrdersRaw = localStorage.getItem(key)
        if (sellerPreOrdersRaw) {
          const existingPreOrders: any[] = JSON.parse(sellerPreOrdersRaw)
          const updatedPreOrders = existingPreOrders.map(spo => {
            const isMatch = String(spo.id) === String(preOrderId) || 
              (String(spo.productId) === String(product.id) && spo.buyerName === buyerName && (spo.status === "Pending" || spo.status === "Confirmed"))
            if (isMatch) {
              updateSellerPreOrderStatus(spo.id, "Cancelled")
              return { ...spo, status: "Cancelled" }
            }
            return spo
          })
          localStorage.setItem(key, JSON.stringify(updatedPreOrders))
        }
      } catch (err) {
        console.error("Failed to cancel seller pre-order:", err)
      }
    }
  }

  const getSellerNameForOrder = (order: typeof orders[0]) => {
    if (order.items.length === 0) return "Unknown Store"
    const firstItem = order.items[0]
    const product = allSellerProducts.find(p => String(p.id) === String(firstItem.id)) || sellerProducts.find(p => String(p.id) === String(firstItem.id))
    return product?.sellerName || product?.brand || "Seller Store"
  }

  const getSellerRating = (sellerId: string, sellerName: string) => {
    const sellerProductsList = allSellerProducts.filter(p => 
      (sellerId && String(p.sellerId) === String(sellerId)) || 
      (sellerName && p.sellerName === sellerName)
    )
    const sellerProductIds = sellerProductsList.map(p => p.id)
    const sellerReviews = savedReviews.filter(r => sellerProductIds.includes(r.productId))
    if (sellerReviews.length === 0) {
      const dbSeller = sellers.find(s => 
        (sellerId && String(s.id) === String(sellerId)) || 
        (sellerName && s.name === sellerName)
      )
      if (dbSeller && dbSeller.rating > 0) {
        return { rating: dbSeller.rating, reviewsCount: 1 }
      }
      return { rating: 0, reviewsCount: 0 }
    }
    const totalRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0)
    const avg = Math.round((totalRating / sellerReviews.length) * 10) / 10
    return { rating: avg, reviewsCount: sellerReviews.length }
  }

  const activeOrdersCount = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length
  const activePreOrdersCount = preOrders.filter(po => po.status !== "Cancelled" && !(po.status === "Ready" && po.rating !== null)).length
  const totalActiveActivityCount = activeOrdersCount + activePreOrdersCount

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Construction Materials</h1>
          <p className="text-muted-foreground">Quality materials delivered to your site</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="relative rounded-xl gap-2" onClick={() => setShowOrders(true)}>
            <ClipboardList className="w-5 h-5" />
            <span className="hidden sm:inline">Orders</span>
            {totalActiveActivityCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {totalActiveActivityCount}
              </span>
            )}
          </Button>
          <Button variant="outline" className="relative rounded-xl gap-2" onClick={() => setShowCart(true)}>
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input 
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap",
              activeCategory === cat.id
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <cat.icon className="h-4 w-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
            <Package className="w-14 h-14 opacity-20" />
            <p className="text-base font-medium">No materials listed yet</p>
            <p className="text-sm text-center">Sellers can add products from their store. Check back soon.</p>
          </div>
        ) : filteredProducts.map((product) => (
          <div
            key={product.id}
            className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
          >
            {/* Product Image */}
            <div className="relative aspect-[4/3] bg-slate-100">
              <img
                src={resolveProductImage(product.image, product.category)}
                alt={product.name}
                onError={(e) => { e.currentTarget.src = resolveProductImage("", product.category) }}
                className="w-full h-full object-cover"
              />
              {product.discount > 0 && (
                <span className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-semibold uppercase px-2 py-1 rounded-full shadow-md">
                  {product.discount}% OFF
                </span>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-2.5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400">{product.brand}</p>
                <h3 className="mt-0.5 text-base font-semibold text-slate-900 leading-snug">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  {product.rating > 0 ? (
                    <button
                      onClick={() => setViewingReviewsProduct(product)}
                      className="flex items-center gap-1 hover:underline text-left cursor-pointer"
                    >
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="font-semibold text-slate-700">{product.rating}</span>
                      <span>({product.reviews} {product.reviews === 1 ? "review" : "reviews"})</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setViewingReviewsProduct(product)}
                      className="flex items-center gap-1 hover:underline text-left cursor-pointer text-slate-400"
                    >
                      <Star className="h-3 w-3 text-slate-300" />
                      <span>No reviews yet</span>
                    </button>
                  )}
                  <span className="flex items-center gap-1">
                    <Truck className="h-3 w-3 text-slate-400" />
                    {product.deliveryTime === "Contact Seller"
                      ? ((product as any).sellerName ? "Contact Seller" : "—")
                      : product.deliveryTime}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-slate-900">₹{product.price}</p>
                  <p className="text-xs text-slate-400">{product.unit}</p>
                </div>

                {getCartQuantity(product.id) > 0 ? (
                  <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => updateCartItemQuantity(product.id, getCartQuantity(product.id) - 1)}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <span className="w-5 text-center text-sm font-semibold text-slate-900">
                      {getCartQuantity(product.id)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => updateCartItemQuantity(product.id, getCartQuantity(product.id) + 1)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="rounded-xl px-4 h-9 text-sm"
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to Cart
                  </Button>
                )}
              </div>

              {/* Pre-Order + Contact Seller buttons */}
              <div className="flex flex-col gap-1.5 pt-0.5">
                <button
                  onClick={() => setViewingReviewsProduct(product)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-violet-300 text-violet-500 text-xs font-medium hover:border-violet-500 hover:bg-violet-50 transition-colors"
                >
                  <Star className="w-3.5 h-3.5" />
                  Store Details & Reviews
                </button>

                <button
                  onClick={() => { setPreOrderProduct(product); setPreOrderQty(1); setPreOrderSubmitted(false); setShowPreOrderModal(true) }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-violet-300 text-violet-500 text-xs font-medium hover:border-violet-500 hover:bg-violet-50 transition-colors"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  Pre-Order for Review
                </button>

                {(product as any).sellerName && (
                  <button
                    onClick={() => {
                      const sellerName = (product as any).sellerName || product.brand
                      const sellerAvatar = (product as any).sellerAvatar || ""
                      const sellerId = (product as any).sellerId || ""
                      handleContactSeller(sellerName, sellerAvatar, sellerId)
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-violet-300 text-violet-500 text-xs font-medium hover:border-violet-500 hover:bg-violet-50 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Contact Seller
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Floating Checkout Button — visible when cart has items */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            className="rounded-2xl h-14 px-6 shadow-xl text-base font-semibold gap-3"
            onClick={() => { setShowCart(false); setShowCheckout(true) }}
          >
            <ShoppingBag className="w-5 h-5" />
            Checkout
            <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          </Button>
        </div>
      )}

      {/* Pre-Order Modal */}
      {showPreOrderModal && preOrderProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {preOrderSubmitted ? (
              <div className="flex flex-col items-center justify-center p-10 gap-4">
                <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                  <CalendarClock className="w-8 h-8 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Pre-Order Confirmed!</h3>
                <p className="text-muted-foreground text-center text-sm">
                  Your pre-order for <span className="font-semibold text-card-foreground">{preOrderProduct.name}</span> has been placed. We'll notify you when it's ready for review.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-violet-500" />
                    <h3 className="font-semibold text-card-foreground">Pre-Order for Review</h3>
                  </div>
                  <button onClick={() => setShowPreOrderModal(false)} className="p-1 rounded-full hover:bg-secondary">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Product Preview */}
                <div className="flex items-center gap-3 mx-4 mt-4 p-3 bg-violet-50 border border-violet-100 rounded-xl">
                  <img
                    src={resolveProductImage(preOrderProduct.image, preOrderProduct.category)}
                    alt={preOrderProduct.name}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                    onError={(e) => { e.currentTarget.src = resolveProductImage("", preOrderProduct.category) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-violet-500 uppercase tracking-wide font-medium">{preOrderProduct.brand}</p>
                    <p className="font-semibold text-card-foreground truncate">{preOrderProduct.name}</p>
                    <p className="text-sm text-muted-foreground">₹{preOrderProduct.price} / {preOrderProduct.unit}</p>
                  </div>
                </div>

                {/* Info Banner */}
                <div className="flex items-start gap-2 mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">Pre-ordering lets you reserve this item and inspect/review it before committing to a full purchase. No payment required now.</p>
                </div>

                <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPreOrderQty(q => Math.max(1, q - 1))}
                        className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-border transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-bold text-card-foreground w-8 text-center">{preOrderQty}</span>
                      <button
                        onClick={() => setPreOrderQty(q => q + 1)}
                        className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-border transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-muted-foreground">{preOrderProduct.unit}</span>
                    </div>
                  </div>

                  {/* Preferred Review Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Preferred Review Date
                    </label>
                    <input
                      type="date"
                      value={preOrderDate}
                      min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                      onChange={(e) => setPreOrderDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-secondary border-0 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>

                  {/* Delivery Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Site / Delivery Address
                    </label>
                    <textarea
                      value={preOrderAddress}
                      onChange={(e) => setPreOrderAddress(e.target.value)}
                      placeholder="Enter your site address for delivery..."
                      rows={2}
                      className={cn(
                        "w-full px-3 py-2 rounded-xl bg-secondary border-0 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none",
                        preOrderAddress && !isAddressValid(preOrderAddress) && "border border-red-500 focus:ring-red-500"
                      )}
                    />
                    {preOrderAddress && !isAddressValid(preOrderAddress) && (
                      <p className="text-[11px] text-red-500">Address must be at least 10 characters.</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={preOrderPhone}
                      onChange={(e) => setPreOrderPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className={cn(
                        "w-full h-10 px-3 rounded-xl bg-secondary border-0 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400",
                        preOrderPhone && !isPhoneValid(preOrderPhone) && "border border-red-500 focus:ring-red-500"
                      )}
                    />
                    {preOrderPhone && !isPhoneValid(preOrderPhone) && (
                      <p className="text-[11px] text-red-500">Please enter a valid 10-digit Indian phone number.</p>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="bg-secondary rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Item</span>
                      <span className="font-medium text-card-foreground">{preOrderProduct.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-medium text-card-foreground">{preOrderQty} × {preOrderProduct.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Est. Value</span>
                      <span className="font-semibold text-violet-600">₹{(preOrderProduct.price * preOrderQty).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-border pt-1.5">
                      <span className="text-muted-foreground">Payment</span>
                      <span className="text-green-600 font-medium">After Review ✓</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <Button
                    className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white"
                    disabled={!preOrderAddress.trim() || !preOrderPhone.trim() || !preOrderDate || !isAddressValid(preOrderAddress) || !isPhoneValid(preOrderPhone)}
                    onClick={handleSubmitPreOrder}
                  >
                    <CalendarClock className="w-4 h-4 mr-2" />
                    Confirm Pre-Order
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-sm bg-card h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-lg text-card-foreground">Your Cart ({totalItems})</h2>
              <button onClick={() => setShowCart(false)} className="p-1 rounded-full hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 opacity-30" />
                  <p>Your cart is empty</p>
                </div>
              ) : cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-secondary rounded-xl p-3">
                  <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg"
                    onError={(e) => { e.currentTarget.src = resolveProductImage("", "") }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-card-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.price} / {item.unit}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-card flex items-center justify-center hover:bg-border"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-card flex items-center justify-center hover:bg-border"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                    <button onClick={() => updateCartItemQuantity(item.id, 0)} className="mt-1 text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span><span>₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Delivery</span><span className="text-green-500">Free</span>
                </div>
                <div className="flex justify-between font-bold text-card-foreground">
                  <span>Total</span><span>₹{cartTotal.toLocaleString()}</span>
                </div>
                <Button className="w-full rounded-xl" onClick={() => { setShowCart(false); setShowCheckout(true) }}>
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal — per-store delivery */}
      {showCheckout && (() => {
        const currentGroup = cartByStore[checkoutStep]
        if (!currentGroup) return null
        const delivery = storeDelivery[currentGroup.sellerId] || { address: "", phone: "", paymentMethod: "qr" as const }
        const storeTotal = currentGroup.items.reduce((s, i) => s + i.price * i.quantity, 0)
        const isLastStep = checkoutStep === cartByStore.length - 1
        const allFilled = cartByStore.every(g => {
          const d = storeDelivery[g.sellerId]
          const basicFilled = d?.address?.trim() && d?.phone?.trim() && isAddressValid(d.address) && isPhoneValid(d.phone)
          if ((d?.paymentMethod || "qr") === "qr") {
            return basicFilled && d?.upiTxnId?.length === 12
          }
          return basicFilled
        })

        const setDelivery = (field: "address" | "phone" | "paymentMethod" | "upiTxnId", val: string) => {
          setStoreDelivery(prev => ({
            ...prev,
            [currentGroup.sellerId]: { ...prev[currentGroup.sellerId], [field]: val }
          }))
        }

        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              {paymentStatus !== "idle" ? (
                <div className="flex flex-col items-center justify-center p-8 min-h-[400px] text-center space-y-6 animate-in fade-in duration-200">
                  {paymentStatus === "verifying" ? (
                    <>
                      <div className="relative flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin" />
                        <Lock className="w-6 h-6 text-violet-600 absolute" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-card-foreground">DreamsPay Secure Gateway</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                          {delivery.paymentMethod === "cod"
                            ? "Verifying Cash on Delivery request details..."
                            : "Contacting partner bank to verify UPI transaction..."}
                        </p>
                      </div>
                      <div className="bg-secondary rounded-2xl p-4 w-full space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Recipient</span>
                          <span className="font-semibold text-card-foreground">{currentGroup.sellerName}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-semibold text-card-foreground">₹{storeTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Method</span>
                          <span className="font-semibold text-violet-600 uppercase">
                            {delivery.paymentMethod === "cod" ? "Cash on Delivery" : "UPI QR"}
                          </span>
                        </div>
                        {delivery.paymentMethod === "qr" && delivery.upiTxnId && (
                          <div className="flex justify-between text-xs pt-1.5 border-t border-border">
                            <span className="text-muted-foreground">UPI Ref / UTR</span>
                            <span className="font-mono font-semibold text-card-foreground">{delivery.upiTxnId}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-red-500 font-medium animate-pulse">
                        ⚠ Please do not close this window or refresh the page.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-500 scale-in-center animate-bounce">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-card-foreground">Transaction Reference Submitted!</h3>
                        <p className="text-sm text-muted-foreground">UPI UTR reference logged for seller verification</p>
                      </div>
                      <div className="bg-secondary rounded-2xl p-4 w-full space-y-2.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Transaction ID</span>
                          <span className="font-mono font-semibold text-card-foreground select-all">
                            {delivery.upiTxnId ? `UTR-${delivery.upiTxnId}` : `TXN-${Math.random().toString(36).substring(2, 14).toUpperCase()}`}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Amount Paid</span>
                          <span className="font-semibold text-card-foreground">₹{storeTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Status</span>
                          <span className="text-amber-600 font-bold uppercase tracking-wider text-[10px] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            PENDING VERIFICATION
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : orderPlaced ? (
                <div className="flex flex-col items-center justify-center p-10 gap-4">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                  <h3 className="text-xl font-bold text-card-foreground">Orders Placed!</h3>
                  <p className="text-muted-foreground text-center text-sm">Your materials will be delivered to your site. You'll receive a confirmation shortly.</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <div>
                      <h3 className="font-semibold text-card-foreground">Checkout</h3>
                      {cartByStore.length > 1 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Store {checkoutStep + 1} of {cartByStore.length}
                        </p>
                      )}
                    </div>
                    <button onClick={() => setShowCheckout(false)} className="p-1 rounded-full hover:bg-secondary"><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>

                  {/* Step tabs when multiple stores */}
                  {cartByStore.length > 1 && (
                    <div className="flex border-b border-border shrink-0 overflow-x-auto">
                      {cartByStore.map((group, idx) => (
                        <button
                          key={group.sellerId}
                          onClick={() => setCheckoutStep(idx)}
                          className={cn(
                            "flex-1 min-w-fit px-3 py-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap",
                            idx === checkoutStep
                              ? "border-primary text-primary bg-primary/5"
                              : "border-transparent text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="truncate block max-w-[100px]">{group.sellerName}</span>
                          {storeDelivery[group.sellerId]?.address?.trim() && storeDelivery[group.sellerId]?.phone?.trim() && isAddressValid(storeDelivery[group.sellerId].address) && isPhoneValid(storeDelivery[group.sellerId].phone) && (
                            <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Store header */}
                    <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
                      <Store className="w-4 h-4 text-violet-500 shrink-0" />
                      <span className="text-sm font-semibold text-card-foreground">{currentGroup.sellerName}</span>
                      {cartByStore.length > 1 && (
                        <span className="ml-auto text-xs text-muted-foreground">{currentGroup.items.length} item{currentGroup.items.length > 1 ? "s" : ""}</span>
                      )}
                    </div>

                    {/* Items in this store */}
                    <div className="bg-secondary rounded-xl p-3 space-y-2">
                      {currentGroup.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate">{item.name} × {item.quantity}</span>
                          <span className="font-medium text-card-foreground shrink-0 ml-2">₹{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t border-border pt-2 flex justify-between font-bold text-card-foreground text-sm">
                        <span>Store Total</span><span>₹{storeTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Delivery address for this store */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Delivery Address
                      </label>
                      <Input
                        placeholder="Enter site address"
                        className={cn(
                          "bg-secondary border-0",
                          delivery.address && !isAddressValid(delivery.address) && "border border-red-500 focus-visible:ring-red-500"
                        )}
                        value={delivery.address}
                        onChange={(e) => setDelivery("address", e.target.value)}
                      />
                      {delivery.address && !isAddressValid(delivery.address) && (
                        <p className="text-[11px] text-red-500">Address must be at least 10 characters.</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        Contact Number
                      </label>
                      <Input
                        placeholder="+91 XXXXX XXXXX"
                        className={cn(
                          "bg-secondary border-0",
                          delivery.phone && !isPhoneValid(delivery.phone) && "border border-red-500 focus-visible:ring-red-500"
                        )}
                        value={delivery.phone}
                        onChange={(e) => setDelivery("phone", e.target.value)}
                      />
                      {delivery.phone && !isPhoneValid(delivery.phone) && (
                        <p className="text-[11px] text-red-500">Please enter a valid 10-digit Indian phone number.</p>
                      )}
                    </div>

                    {/* Payment method for this store */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setDelivery("paymentMethod", "qr")}
                          className={cn(
                            "flex flex-col items-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                            delivery.paymentMethod === "qr"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-secondary text-card-foreground hover:border-primary/50"
                          )}
                        >
                          <QrCode className="w-5 h-5" />
                          Scan QR / UPI
                        </button>
                        <button
                          onClick={() => setDelivery("paymentMethod", "cod")}
                          className={cn(
                            "flex flex-col items-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                            delivery.paymentMethod === "cod"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-secondary text-card-foreground hover:border-primary/50"
                          )}
                        >
                          <Banknote className="w-5 h-5" />
                          Cash on Delivery
                        </button>
                      </div>

                      {delivery.paymentMethod === "qr" && (
                        <div className="flex flex-col items-center gap-3 bg-white border border-border rounded-xl p-4 mt-1 w-full">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scan to Pay · ₹{storeTotal.toLocaleString()}</p>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${encodeURIComponent(currentSellerUpi)}%26pn=${encodeURIComponent(currentGroup.sellerName)}%26am=${storeTotal}%26cu=INR%26tn=MaterialOrder`}
                            alt="UPI QR Code"
                            className="w-36 h-36 rounded-lg"
                          />
                          <p className="text-[11px] text-muted-foreground text-center">UPI Address: <span className="font-semibold text-card-foreground select-all">{currentSellerUpi}</span></p>
                          <p className="text-[10px] text-muted-foreground text-center mb-1">Open any UPI app and scan this code</p>
                          
                          <div className="w-full space-y-1.5 border-t border-border pt-3">
                            <label className="text-xs font-semibold text-card-foreground flex items-center gap-1">
                              <span>UPI Transaction ID (12-digit UTR) *</span>
                            </label>
                            <Input
                              placeholder="e.g. 301234567890"
                              maxLength={12}
                              value={delivery.upiTxnId || ""}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "")
                                setDelivery("upiTxnId", val)
                              }}
                              className={cn(
                                "bg-secondary border-0 text-center font-mono tracking-widest text-sm",
                                delivery.upiTxnId && delivery.upiTxnId.length !== 12 && "border border-red-500 focus-visible:ring-red-500"
                              )}
                            />
                            {delivery.upiTxnId && delivery.upiTxnId.length !== 12 && (
                              <p className="text-[10px] text-red-500 text-center">UTR must be exactly 12 digits.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {delivery.paymentMethod === "cod" && (
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-1">
                          <Banknote className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-amber-800">Cash on Delivery</p>
                            <p className="text-[11px] text-amber-700 mt-0.5">Pay ₹{storeTotal.toLocaleString()} in cash when materials arrive.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 pb-4 pt-2 border-t border-border shrink-0 space-y-2">
                    {cartByStore.length > 1 && (
                      <div className="flex gap-2">
                        {checkoutStep > 0 && (
                          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setCheckoutStep(s => s - 1)}>
                            ← Back
                          </Button>
                        )}
                        {!isLastStep && (
                          <Button
                            className="flex-1 rounded-xl"
                            disabled={
                              !delivery.address?.trim() ||
                              !delivery.phone?.trim() ||
                              !isAddressValid(delivery.address) ||
                              !isPhoneValid(delivery.phone) ||
                              ((delivery.paymentMethod || "qr") === "qr" && (!delivery.upiTxnId || delivery.upiTxnId.length !== 12))
                            }
                            onClick={() => setCheckoutStep(s => s + 1)}
                          >
                            Next Store →
                          </Button>
                        )}
                      </div>
                    )}
                    {isLastStep && (
                      <Button
                        className="w-full rounded-xl"
                        onClick={handlePlaceOrder}
                        disabled={!allFilled}
                      >
                        Place {cartByStore.length > 1 ? `${cartByStore.length} Orders` : "Order"} · ₹{cartTotal.toLocaleString()}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })()}
      {/* Orders Drawer */}
      {showOrders && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowOrders(false)} />
          <div className="relative w-full max-w-sm bg-card h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-card-foreground">My Activity</h2>
                {(orders.length > 0 || preOrders.length > 0) && (
                      <button
                        onClick={() => setClearConfirm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition-all"
                        title={ordersTab === "orders" ? "Clear Orders" : "Clear Pre-Orders"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    )}
              </div>
              <button onClick={() => setShowOrders(false)} className="p-1 rounded-full hover:bg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setOrdersTab("orders")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2",
                  ordersTab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                Orders {activeOrdersCount > 0 && <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">{activeOrdersCount}</span>}
              </button>
              <button
                onClick={() => setOrdersTab("preorders")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2",
                  ordersTab === "preorders" ? "border-violet-500 text-violet-600" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarClock className="w-4 h-4" />
                Pre-Orders {activePreOrdersCount > 0 && <span className="bg-violet-100 text-violet-600 text-xs px-1.5 py-0.5 rounded-full">{activePreOrdersCount}</span>}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Orders Tab */}
              {ordersTab === "orders" && (
                orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                    <ClipboardList className="w-12 h-12 opacity-30" />
                    <p className="text-sm">No orders yet</p>
                    <p className="text-xs text-center">Your placed orders will appear here</p>
                  </div>
                ) : <>{orders.map(order => (
                <div key={order.id} className="bg-secondary rounded-2xl p-4 space-y-2.5">
                  {/* Order Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Order #{String(order.id).slice(-6)}</p>
                      <p className="text-xs text-muted-foreground">{order.date}</p>
                    </div>
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full",
                      order.status === "Delivered" ? "bg-green-100 text-green-700" :
                      order.status === "Dispatched" ? "bg-blue-100 text-blue-700" :
                      order.status === "Cancelled" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {order.status}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.items.map(item => (
                      <div key={item.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                            onError={(e) => { e.currentTarget.src = resolveProductImage("", "") }}
                          />
                          <div className="flex-1 min-w-0">
                             <p className="text-sm font-medium text-card-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">×{item.quantity} · ₹{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Per-item rating — only when delivered */}
                        {order.status === "Delivered" && (
                          <div className="ml-12 space-y-1.5">
                            {order.itemRatings[item.id] ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  {[1,2,3,4,5].map(star => (
                                    <Star key={star} className={cn("w-4 h-4", star <= order.itemRatings[item.id].rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                                  ))}
                                  <span className="ml-1 text-xs text-muted-foreground">{order.itemRatings[item.id].rating}/5</span>
                                </div>
                                {order.itemRatings[item.id].review && (
                                  <p className="text-xs text-muted-foreground italic">"{order.itemRatings[item.id].review}"</p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1">
                                  {[1,2,3,4,5].map(star => {
                                    const draft = itemRatingDraft[order.id]?.[item.id]
                                    const active = star <= (draft?.rating ?? 0)
                                    return (
                                      <button
                                        key={star}
                                        onClick={() => setItemRatingDraft(prev => ({
                                          ...prev,
                                          [order.id]: {
                                            ...prev[order.id],
                                            [item.id]: { rating: star, review: prev[order.id]?.[item.id]?.review ?? "" }
                                          }
                                        }))}
                                        className="hover:scale-110 transition-transform"
                                      >
                                        <Star className={cn("w-4 h-4", active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                                      </button>
                                    )
                                  })}
                                </div>
                                {(itemRatingDraft[order.id]?.[item.id]?.rating ?? 0) > 0 && (
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={itemRatingDraft[order.id]?.[item.id]?.review ?? ""}
                                      onChange={(e) => setItemRatingDraft(prev => ({
                                        ...prev,
                                        [order.id]: {
                                          ...prev[order.id],
                                          [item.id]: { rating: prev[order.id]?.[item.id]?.rating ?? 0, review: e.target.value }
                                        }
                                      }))}
                                      placeholder="Write a review..."
                                      className="flex-1 h-7 px-2 rounded-lg bg-card border border-border text-xs text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <button
                                      onClick={() => {
                                        const draft = itemRatingDraft[order.id]?.[item.id]
                                        if (!draft?.rating) return
                                        setOrders(prev => prev.map(o =>
                                          o.id === order.id
                                            ? { ...o, itemRatings: { ...o.itemRatings, [item.id]: { rating: draft.rating, review: draft.review } } }
                                            : o
                                        ))
                                        const newSavedReviews = [...savedReviews, { productId: item.id, rating: draft.rating, review: draft.review ?? "" }]
                                        setSavedReviews(newSavedReviews)

                                        // Find sellerId and update average rating in DB
                                        const product = allSellerProducts.find(p => String(p.id) === String(item.id)) || sellerProducts.find(p => String(p.id) === String(item.id))
                                        const sellerId = product?.sellerId
                                        if (sellerId) {
                                          const sellerProductsList = allSellerProducts.filter(p => String(p.sellerId) === String(sellerId))
                                          const sellerProductIds = sellerProductsList.map(p => p.id)
                                          const sellerReviews = newSavedReviews.filter(r => sellerProductIds.includes(r.productId))
                                          if (sellerReviews.length > 0) {
                                            const totalRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0)
                                            const avg = Math.round((totalRating / sellerReviews.length) * 10) / 10
                                            
                                            // Send PATCH to /api/users
                                            fetch("/api/users", {
                                              method: "PATCH",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ userId: sellerId, rating: avg })
                                            }).catch(err => console.error("Failed to update seller rating in DB:", err))
                                          }
                                        }
                                      }}
                                      className="text-xs font-semibold text-primary hover:underline shrink-0"
                                    >
                                      Submit
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center pt-1 border-t border-border font-semibold text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-card-foreground">₹{order.total.toLocaleString()}</span>
                  </div>

                  {order.status !== "Delivered" && order.status !== "Cancelled" && (
                    <div className="space-y-1.5 mt-1">
                      <Button
                        variant="outline"
                        className="w-full rounded-xl border-red-200 text-red-500 hover:bg-red-50 h-9 font-semibold text-xs"
                        onClick={() => setCancelOrderConfirmId(order.id)}
                      >
                        Cancel Order
                      </Button>
                      <p className="text-[10px] text-muted-foreground italic text-center">Ratings available after delivery</p>
                    </div>
                  )}
                </div>
              ))}</>
              )}

              {/* Pre-Orders Tab */}
              {ordersTab === "preorders" && (
                preOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground pt-16">
                    <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center">
                      <CalendarClock className="w-7 h-7 text-violet-300" />
                    </div>
                    <p className="text-sm font-medium">No pre-orders yet</p>
                    <p className="text-xs text-center px-4">Pre-order items to inspect and review before committing to a full purchase</p>
                  </div>
                ) : preOrders.map(po => (
                  <div key={po.id} className="bg-secondary rounded-2xl p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Pre-Order #{String(po.id).slice(-6)}</p>
                        <p className="text-xs text-muted-foreground">{po.date}</p>
                      </div>
                      <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full shrink-0",
                        po.status === "Ready" ? "bg-green-100 text-green-700" :
                        po.status === "Confirmed" ? "bg-blue-100 text-blue-700" :
                        po.status === "Cancelled" ? "bg-red-100 text-red-700" :
                        "bg-violet-100 text-violet-700"
                      )}>
                        {po.status}
                      </span>
                    </div>

                    {/* Product */}
                    <div className="flex items-center gap-3">
                      <img
                        src={po.product.image}
                        alt={po.product.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                        onError={(e) => { e.currentTarget.src = resolveProductImage("", po.product.category) }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-card-foreground truncate">{po.product.name}</p>
                        <p className="text-xs text-muted-foreground">{po.quantity} × {po.product.unit}</p>
                        <p className="text-xs font-medium text-violet-600">Est. ₹{(po.product.price * po.quantity).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Review by: <span className="text-card-foreground font-medium">{new Date(po.expectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></span>
                      </div>
                    </div>

                    {/* Payment note */}
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      <p className="text-xs text-green-700">Payment due only after your review & approval</p>
                    </div>

                    {/* Rating after review */}
                    {po.status === "Ready" && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          {po.rating ? "Your Review Rating" : "Rate after inspection"}
                        </p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => {
                            const active = po.rating
                              ? star <= po.rating
                              : star <= (preOrderRatingDraft[po.id] ?? 0)
                            return (
                              <button
                                key={star}
                                disabled={!!po.rating}
                                onClick={() => setPreOrderRatingDraft(prev => ({ ...prev, [po.id]: star }))}
                                className={cn("transition-transform", !po.rating && "hover:scale-110")}
                              >
                                <Star className={cn("w-5 h-5", active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
                              </button>
                            )
                          })}
                          {!po.rating && preOrderRatingDraft[po.id] && (
                            <button
                              onClick={() => {
                                const rating = preOrderRatingDraft[po.id]
                                const review = preOrderReviewDraft[po.id] ?? ""
                                setPreOrders(prev => prev.map(p =>
                                  p.id === po.id ? { ...p, rating, review } : p
                                ))
                                if (po.product?.id) {
                                  const newSavedReviews = [...savedReviews, { productId: po.product.id, rating, review }]
                                  setSavedReviews(newSavedReviews)

                                  // Find sellerId and update average rating in DB
                                  const product = allSellerProducts.find(p => String(p.id) === String(po.product.id)) || sellerProducts.find(p => String(p.id) === String(po.product.id))
                                  const sellerId = product?.sellerId || po.product.sellerId
                                  if (sellerId) {
                                    const sellerProductsList = allSellerProducts.filter(p => String(p.sellerId) === String(sellerId))
                                    const sellerProductIds = sellerProductsList.map(p => p.id)
                                    const sellerReviews = newSavedReviews.filter(r => sellerProductIds.includes(r.productId))
                                    if (sellerReviews.length > 0) {
                                      const totalRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0)
                                      const avg = Math.round((totalRating / sellerReviews.length) * 10) / 10
                                      
                                      // Send PATCH to /api/users
                                      fetch("/api/users", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ userId: sellerId, rating: avg })
                                      }).catch(err => console.error("Failed to update seller rating in DB:", err))
                                    }
                                  }
                                }
                              }}
                              className="ml-2 text-xs font-semibold text-violet-600 hover:underline"
                            >
                              Submit
                            </button>
                          )}
                          {po.rating && <span className="ml-1 text-xs text-muted-foreground">{po.rating}/5</span>}
                        </div>
                        {!po.rating && preOrderRatingDraft[po.id] && (
                          <textarea
                            value={preOrderReviewDraft[po.id] ?? ""}
                            onChange={(e) => setPreOrderReviewDraft(prev => ({ ...prev, [po.id]: e.target.value }))}
                            placeholder="Write your review (optional)..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                          />
                        )}
                      </div>
                    )}


                    {(po.status === "Pending" || po.status === "Confirmed") && (
                      <Button
                        variant="outline"
                        className="w-full rounded-xl border-red-200 text-red-500 hover:bg-red-50 h-9 font-semibold text-xs mt-1"
                        onClick={() => setCancelPreOrderConfirmId(po.id)}
                      >
                        Cancel Pre-Order
                      </Button>
                    )}
                  </div>
                ))
              )}

            </div>
          </div>
        </div>
      )}
      {clearConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-card-foreground">Clear {ordersTab === "orders" ? "Orders" : "Pre-Orders"} History?</h3>
            <p className="text-sm text-muted-foreground">Are you sure you want to clear your {ordersTab === "orders" ? "orders" : "pre-orders"} history? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setClearConfirm(false)}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white" onClick={() => {
                if (ordersTab === "orders") {
                  setOrders(prev => prev.filter(o => o.status !== "Delivered" && o.status !== "Cancelled"))
                } else {
                  setPreOrders(prev => prev.filter(po => po.status === "Pending" || po.status === "Confirmed" || (po.status === "Ready" && !po.rating)))
                }
                setClearConfirm(false)
              }}>Clear</Button>
            </div>
          </div>
        </div>
      )}

      {cancelOrderConfirmId !== null && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-card-foreground">Cancel Order?</h3>
            <p className="text-sm text-muted-foreground">Are you sure you want to cancel this order? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setCancelOrderConfirmId(null)}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white" onClick={() => {
                handleCancelOrder(cancelOrderConfirmId)
                setCancelOrderConfirmId(null)
              }}>Confirm Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {cancelPreOrderConfirmId !== null && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-card-foreground">Cancel Pre-Order?</h3>
            <p className="text-sm text-muted-foreground">Are you sure you want to cancel this pre-order? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setCancelPreOrderConfirmId(null)}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white" onClick={() => {
                handleCancelPreOrder(cancelPreOrderConfirmId)
                setCancelPreOrderConfirmId(null)
              }}>Confirm Cancel</Button>
            </div>
          </div>
        </div>
      )}
      {viewingReviewsProduct && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <h3 className="font-bold text-card-foreground text-lg">Store Details & Reviews</h3>
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
                <p className="text-xs font-semibold text-emerald-600 mt-1">
                  Store: {viewingReviewsProduct.sellerName || viewingReviewsProduct.brand || "Seller Store"}
                </p>
                <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-muted-foreground">Material Rating:</span>
                    {viewingReviewsProduct.reviews > 0 ? (
                      <>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-card-foreground">{viewingReviewsProduct.rating.toFixed(1)}</span>
                        <span>({viewingReviewsProduct.reviews} reviews)</span>
                      </>
                    ) : (
                      <span>No reviews yet</span>
                    )}
                  </div>
                  {(() => {
                    const sRating = getSellerRating(viewingReviewsProduct.sellerId, viewingReviewsProduct.sellerName)
                    return (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-muted-foreground">Store Rating:</span>
                        {sRating.reviewsCount > 0 ? (
                          <>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-card-foreground">{sRating.rating.toFixed(1)}</span>
                            <span>({sRating.reviewsCount} reviews)</span>
                          </>
                        ) : (
                          <span>No reviews yet</span>
                        )}
                      </div>
                    )
                  })()}
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
                        <span className="text-[10px] text-muted-foreground ml-1">Verified Buyer</span>
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
    </div>
  )
}
