"use client"

import { useState, useEffect } from "react"
import { Calculator, Ruler, Percent, TrendingUp, TrendingDown, FileText, ChevronRight, RotateCcw, Layers, Mountain, Sparkles, SquareParking, Coins, Building2, Paintbrush, Zap, Plus, Trash2, Upload, Activity, Info, X, Package, History, ClipboardList, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const tools = [
  {
    id: "expenses",
    label: "Expense Tracker",
    icon: Coins,
    description: "Track your building expenses",
    color: "bg-violet-500"
  },
  {
    id: "storage",
    label: "Storage Manager",
    icon: ClipboardList,
    description: "Manage construction material stock counts",
    color: "bg-purple-500"
  },
  {
    id: "cost",
    label: "Cost Estimator",
    icon: TrendingUp,
    description: "Estimate construction costs",
    color: "bg-fuchsia-500"
  },
  {
    id: "emi",
    label: "EMI Calculator",
    icon: Percent,
    description: "Calculate loan EMI",
    color: "bg-indigo-500"
  },
]


export function ToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null)

  // Expense Tracker State
  interface Expense {
    id: string;
    amount: number;
    category: "materials" | "labor" | "permits" | "equipment" | "other";
    description: string;
    date: string;
  }
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseCategory, setExpenseCategory] = useState<Expense["category"]>("materials")
  const [expenseDescription, setExpenseDescription] = useState("")

  // Storage Manager State
  interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    threshold: number;
  }

  interface StockLog {
    id: string;
    itemId: string;
    itemName: string;
    type: "in" | "out";
    quantity: number;
    date: string;
    notes: string;
  }

  const defaultInventory: InventoryItem[] = []

  const getTodayDateString = () => {
    const d = new Date()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${month}-${day}`
  };

  const getPastDateString = (daysAgo: number) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${month}-${day}`
  };

  const defaultLogs: StockLog[] = []

  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stockLogs, setStockLogs] = useState<StockLog[]>([])

  // Form states for adding items
  const [newItemName, setNewItemName] = useState("")
  const [newItemCategory, setNewItemCategory] = useState("Cement")
  const [newItemQuantity, setNewItemQuantity] = useState("")
  const [newItemUnit, setNewItemUnit] = useState("Bags")
  const [newItemThreshold, setNewItemThreshold] = useState("")

  // Adjustment states
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustType, setAdjustType] = useState<"in" | "out">("in")
  const [adjustNotes, setAdjustNotes] = useState("")
  const [adjustDate, setAdjustDate] = useState(getTodayDateString())
  const [selectedDailySheetDate, setSelectedDailySheetDate] = useState(getTodayDateString())
  const [managerTab, setManagerTab] = useState<"inventory" | "dailySheets">("inventory")
  const [dailyInflowInput, setDailyInflowInput] = useState<Record<string, string>>({})
  const [dailyOutflowInput, setDailyOutflowInput] = useState<Record<string, string>>({})
  const [dailyNotesInput, setDailyNotesInput] = useState<Record<string, string>>({})
  const [isEditingDailySheet, setIsEditingDailySheet] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // Cost Estimator State
  const [costArea, setCostArea] = useState("")
  const [costFloors, setCostFloors] = useState("1")
  const [costSoil, setCostSoil] = useState<"normal" | "soft" | "rocky">("normal")
  const [costParking, setCostParking] = useState(false)
  const [costType, setCostType] = useState<"basic" | "standard" | "premium">("standard")
  const [costResult, setCostResult] = useState<{
    total: number;
    totalArea: number;
    breakdown: { label: string; value: number; percentage: number }[]
  } | null>(null)

  // EMI Calculator State
  const [emiPrincipal, setEmiPrincipal] = useState("")
  const [emiRate, setEmiRate] = useState("8.5")
  const [emiTenure, setEmiTenure] = useState("20")
  const [emiResult, setEmiResult] = useState<{ emi: number; totalInterest: number; totalPayment: number } | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("construction_expenses")
      if (saved) {
        try {
          setExpenses(JSON.parse(saved))
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [])

  const saveExpenses = (updatedExpenses: Expense[]) => {
    setExpenses(updatedExpenses)
    if (typeof window !== "undefined") {
      localStorage.setItem("construction_expenses", JSON.stringify(updatedExpenses))
    }
  }

  // Storage Manager Actions
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedInv = localStorage.getItem("construction_inventory")
      const savedLogs = localStorage.getItem("construction_inventory_logs")
      if (savedInv) {
        try { setInventory(JSON.parse(savedInv)) } catch (e) { console.error(e) }
      } else {
        setInventory(defaultInventory)
        localStorage.setItem("construction_inventory", JSON.stringify(defaultInventory))
      }

      if (savedLogs) {
        try { setStockLogs(JSON.parse(savedLogs)) } catch (e) { console.error(e) }
      } else {
        setStockLogs(defaultLogs)
        localStorage.setItem("construction_inventory_logs", JSON.stringify(defaultLogs))
      }
    }
  }, [])

  const saveInventory = (updatedInv: InventoryItem[] | ((prev: InventoryItem[]) => InventoryItem[])) => {
    setInventory(prev => {
      const next = typeof updatedInv === "function" ? updatedInv(prev) : updatedInv
      if (typeof window !== "undefined") {
        localStorage.setItem("construction_inventory", JSON.stringify(next))
      }
      return next
    })
  }

  const saveLogs = (updatedLogs: StockLog[] | ((prev: StockLog[]) => StockLog[])) => {
    setStockLogs(prev => {
      const next = typeof updatedLogs === "function" ? updatedLogs(prev) : updatedLogs
      if (typeof window !== "undefined") {
        localStorage.setItem("construction_inventory_logs", JSON.stringify(next))
      }
      return next
    })
  }

  const addInventoryItem = () => {
    const qty = parseFloat(newItemQuantity)
    const thresh = parseFloat(newItemThreshold)
    if (newItemName.trim() && !isNaN(qty) && qty >= 0 && !isNaN(thresh) && thresh >= 0) {
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        category: newItemCategory,
        quantity: qty,
        unit: newItemUnit,
        threshold: thresh
      }
      
      saveInventory(prev => [...prev, newItem])

      const newLog: StockLog = {
        id: "log-" + Date.now(),
        itemId: newItem.id,
        itemName: newItem.name,
        type: "in",
        quantity: qty,
        date: getTodayDateString(),
        notes: "Initial stock registered"
      }
      saveLogs(prev => [newLog, ...prev])

      setNewItemName("")
      setNewItemQuantity("")
      setNewItemThreshold("")
    }
  }

  const adjustStock = (itemId: string, amountStr: string, type: "in" | "out", notesStr: string, dateStr: string) => {
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) return

    const item = inventory.find(i => i.id === itemId)
    if (!item) return

    const newLog: StockLog = {
      id: "log-" + Date.now(),
      itemId: item.id,
      itemName: item.name,
      type,
      quantity: amount,
      date: dateStr || getTodayDateString(),
      notes: notesStr.trim() || (type === "in" ? "Stock added" : "Stock used")
    }

    saveLogs(prev => [newLog, ...prev])

    saveInventory(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = type === "in" ? i.quantity + amount : Math.max(0, i.quantity - amount)
        return { ...i, quantity: newQty }
      }
      return i
    }))
  }

  const saveDailyLogs = () => {
    let newLogs: StockLog[] = []
    let invUpdates: Record<string, number> = {}

    inventory.forEach(item => {
      const inflowStr = dailyInflowInput[item.id]
      const outflowStr = dailyOutflowInput[item.id]
      const notes = (dailyNotesInput[item.id] || "").trim()

      const inflow = parseFloat(inflowStr || "0")
      const outflow = parseFloat(outflowStr || "0")

      if (inflow > 0 || outflow > 0) {
        invUpdates[item.id] = (inflow > 0 ? inflow : 0) - (outflow > 0 ? outflow : 0)

        if (inflow > 0) {
          newLogs.push({
            id: `log-${Date.now()}-${item.id}-in`,
            itemId: item.id,
            itemName: item.name,
            type: "in",
            quantity: inflow,
            date: selectedDailySheetDate,
            notes: notes || "Daily log entry (Inflow)"
          })
        }

        if (outflow > 0) {
          newLogs.push({
            id: `log-${Date.now()}-${item.id}-out`,
            itemId: item.id,
            itemName: item.name,
            type: "out",
            quantity: outflow,
            date: selectedDailySheetDate,
            notes: notes || "Daily log entry (Usage)"
          })
        }
      }
    })

    if (newLogs.length > 0) {
      saveLogs(prev => [...newLogs, ...prev])

      saveInventory(prev => prev.map(item => {
        if (invUpdates[item.id] !== undefined) {
          const newQty = Math.max(0, item.quantity + invUpdates[item.id])
          return { ...item, quantity: newQty }
        }
        return item
      }))

      setDailyInflowInput({})
      setDailyOutflowInput({})
      setDailyNotesInput({})
    }
  }

  const getDailySummary = (dateStr: string) => {
    return inventory.map(item => {
      const dayLogs = stockLogs.filter(log => log.itemId === item.id && log.date === dateStr)
      const added = dayLogs.filter(log => log.type === "in").reduce((sum, log) => sum + log.quantity, 0)
      const used = dayLogs.filter(log => log.type === "out").reduce((sum, log) => sum + log.quantity, 0)
      return {
        ...item,
        added,
        used,
        net: added - used
      }
    })
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ""
    try {
      const [year, month, day] = dateStr.split("-")
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    } catch {
      return dateStr
    }
  }

  const deleteInventoryItem = (itemId: string) => {
    const updated = inventory.filter(item => item.id !== itemId)
    saveInventory(updated)
    const updatedLogs = stockLogs.filter(log => log.itemId !== itemId)
    saveLogs(updatedLogs)
    if (selectedItemId === itemId) {
      setSelectedItemId(null)
    }
  }

  const clearAllStock = () => {
    if (confirm("Are you sure you want to delete all registered inventory materials and stock logs? This action cannot be undone.")) {
      saveInventory([])
      saveLogs([])
      setSelectedItemId(null)
    }
  }

  const addExpense = () => {
    const amount = parseFloat(expenseAmount)
    if (!isNaN(amount) && amount > 0 && expenseDescription.trim()) {
      const newExpense: Expense = {
        id: Date.now().toString(),
        amount,
        category: expenseCategory,
        description: expenseDescription.trim(),
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      }
      const updated = [newExpense, ...expenses]
      saveExpenses(updated)
      setExpenseAmount("")
      setExpenseDescription("")
    }
  }

  const deleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id)
    saveExpenses(updated)
  }



  const calculateCost = () => {
    const area = parseFloat(costArea)
    const floors = parseInt(costFloors) || 1

    // Rates per sq.ft based on construction quality
    const baseRates = {
      basic: 1400,
      standard: 1800,
      premium: 2500
    }

    // Fixed overhead costs (Architect, structural design, approvals, site mobilization)
    const fixedOverheads = {
      basic: 50000,
      standard: 120000,
      premium: 250000
    }

    if (!isNaN(area) && area > 0) {
      const rate = baseRates[costType]
      const overhead = fixedOverheads[costType]

      // Multiplier for structural reinforcement on higher floors
      const floorMultipliers = [1.0, 1.05, 1.12, 1.20, 1.30] // G, G+1, G+2, G+3, G+4
      const floorMultiplier = floorMultipliers[Math.min(floors - 1, 4)]

      let constructionCost = 0
      let totalArea = area * floors

      if (costParking && floors > 1) {
        // Ground floor is stilt parking (cheaper as it has no walls, finishing, plumbing, etc.)
        const stiltRate = rate * 0.55
        const groundCost = area * stiltRate
        // Upper floors are residential and require floor-height structural adjustments
        const upperCost = area * (floors - 1) * rate * floorMultiplier
        constructionCost = groundCost + upperCost
      } else {
        // Standard calculation for all floors
        constructionCost = totalArea * rate * floorMultiplier
      }

      // Soil adjustment factor
      const soilMultipliers = {
        normal: 1.0,
        soft: 1.15, // Pile foundation / extra steel
        rocky: 1.08  // Excavation breaker tools
      }
      constructionCost = constructionCost * soilMultipliers[costSoil]

      // Total Cost = Construction cost + Fixed overheads
      const total = Math.round(constructionCost + overhead)

      setCostResult({
        total,
        totalArea,
        breakdown: [
          { label: "Foundation & Structure (Steel & Cement)", value: Math.round(total * 0.42), percentage: 42 },
          { label: "Brickwork, Walls, Plastering & Shuttering", value: Math.round(total * 0.20), percentage: 20 },
          { label: "Flooring, Tiles & Granite Finish", value: Math.round(total * 0.13), percentage: 13 },
          { label: "Electrical & Plumbing Installations", value: Math.round(total * 0.15), percentage: 15 },
          { label: "Painting, Doors & Window Finishing", value: Math.round(total * 0.10), percentage: 10 },
        ]
      })
    }
  }

  const calculateEMI = () => {
    const principal = parseFloat(emiPrincipal)
    const rate = parseFloat(emiRate) / 12 / 100
    const tenure = parseFloat(emiTenure) * 12
    if (!isNaN(principal) && !isNaN(rate) && !isNaN(tenure)) {
      const emi = principal * rate * Math.pow(1 + rate, tenure) / (Math.pow(1 + rate, tenure) - 1)
      const totalPayment = emi * tenure
      const totalInterest = totalPayment - principal
      setEmiResult({
        emi: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment)
      })
    }
  }

  const resetTool = () => {
    setExpenseAmount("")
    setExpenseDescription("")
    setCostResult(null)
    setEmiResult(null)
    setNewItemName("")
    setNewItemQuantity("")
    setNewItemThreshold("")
    setSelectedItemId(null)
    setAdjustAmount("")
    setAdjustNotes("")
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Construction Tools</h1>
        <p className="text-muted-foreground">Calculators and estimators for your project</p>
      </div>

      {/* Tool Selection */}
      {!activeTool && (
        <div className="grid grid-cols-2 gap-4">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-lg transition-all group"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                tool.color
              )}>
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {tool.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
              <ChevronRight className="w-5 h-5 text-muted-foreground mt-3 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      )}

      {/* Expense Tracker */}
      {activeTool === "expenses" && (
        <div className="bg-card border border-border rounded-2xl p-8 space-y-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
                <Coins className="w-6 h-6 text-primary" /> Expense Tracker
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Log and track building expenses for materials, labor, permits, etc.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setActiveTool(null); resetTool(); }} className="hover:bg-secondary/80">
              ← Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side: Add Log Entry */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-card-foreground">Add Expense Entry</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="expenseAmount" className="text-sm font-semibold">Amount (₹)</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    <Input
                      id="expenseAmount"
                      type="number"
                      placeholder="e.g. 25000"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="pl-9 h-14 text-base rounded-xl bg-secondary/30 border-border focus-visible:ring-primary font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Category</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { id: "materials", label: "Materials" },
                      { id: "labor", label: "Labor / Workers" },
                      { id: "permits", label: "Permits & Fees" },
                      { id: "equipment", label: "Equipment / Tools" },
                      { id: "other", label: "Other Spending" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setExpenseCategory(cat.id as any)}
                        className={cn(
                          "py-3 px-4 rounded-xl border text-sm font-medium transition-all text-left focus:outline-none flex items-center justify-between",
                          expenseCategory === cat.id
                            ? "border-primary bg-primary text-primary-foreground font-bold shadow-md shadow-primary/10"
                            : "border-border text-muted-foreground bg-card hover:bg-secondary/40"
                        )}
                      >
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="expenseDescription" className="text-sm font-semibold">Description / Notes</Label>
                  <Input
                    id="expenseDescription"
                    type="text"
                    placeholder="e.g. Cement bags order, electrician labor..."
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="mt-2 h-14 text-base rounded-xl bg-secondary/30 border-border focus-visible:ring-primary"
                  />
                </div>

                <Button 
                  onClick={addExpense} 
                  className="w-full h-14 text-base rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Log Expenditure
                </Button>
              </div>
            </div>

            {/* Right side: Summary & History Log */}
            <div className="space-y-6">
              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Total Spend Logged</p>
                  <p className="text-4xl font-black text-primary mt-1">
                    ₹{expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-primary/10 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Entries</span>
                    <span className="text-lg font-bold text-card-foreground">{expenses.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Avg. Spent / Item</span>
                    <span className="text-lg font-bold text-card-foreground">
                      ₹{expenses.length > 0 ? Math.round(expenses.reduce((acc, curr) => acc + curr.amount, 0) / expenses.length).toLocaleString() : 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-card-foreground">Logged Expenses History</h4>
                
                {expenses.length === 0 ? (
                  <div className="text-center py-12 bg-secondary/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center p-4">
                    <span className="text-3xl mb-2">📑</span>
                    <p className="text-sm font-medium text-muted-foreground">No expenditures logged yet.</p>
                    <p className="text-xs text-muted-foreground/80 mt-1 max-w-[240px]">Enter amounts on the left to start tracking your construction expenses.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {expenses.map((expense) => {
                      let tagColor = "bg-blue-500/10 text-blue-600 border-blue-200"
                      if (expense.category === "labor") tagColor = "bg-orange-500/10 text-orange-600 border-orange-200"
                      else if (expense.category === "permits") tagColor = "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                      else if (expense.category === "equipment") tagColor = "bg-indigo-500/10 text-indigo-600 border-indigo-200"
                      else if (expense.category === "other") tagColor = "bg-slate-500/10 text-slate-600 border-slate-200"

                      return (
                        <div key={expense.id} className="p-4 bg-secondary/10 rounded-xl border border-border/40 hover:border-border transition-all flex items-center justify-between gap-4">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0", tagColor)}>
                                {expense.category}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0">{expense.date}</span>
                            </div>
                            <p className="text-sm font-semibold text-card-foreground truncate">{expense.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-base font-bold text-card-foreground">₹{expense.amount.toLocaleString()}</span>
                            <button
                              type="button"
                              onClick={() => deleteExpense(expense.id)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-all"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Storage Manager */}
      {activeTool === "storage" && (
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm max-w-4xl mx-auto w-full text-left">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2.5">
                <ClipboardList className="w-6 h-6 text-primary" /> Storage Manager
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Track daily building material stock levels, consumption logs, and low-stock alerts</p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              {/* Tab Navigation */}
              <div className="flex bg-muted/40 p-1 rounded-xl border border-border/60">
                <button
                  onClick={() => setManagerTab("inventory")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                    managerTab === "inventory"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Current Stock
                </button>
                <button
                  onClick={() => setManagerTab("dailySheets")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                    managerTab === "dailySheets"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Daily Sheets
                </button>
              </div>

              <Button variant="ghost" size="sm" onClick={() => { setActiveTool(null); resetTool(); }} className="hover:bg-secondary/80">
                ← Back
              </Button>
            </div>
          </div>

          {/* Quick Stock Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary/15 p-4 rounded-xl border border-border flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Materials</span>
              <span className="text-2xl font-black text-card-foreground mt-1">{inventory.length}</span>
            </div>
            <div className="bg-destructive/5 p-4 rounded-xl border border-destructive/10 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-destructive/80">Low Stock Alerts</span>
              <span className="text-2xl font-black text-destructive mt-1">
                {inventory.filter(item => item.quantity <= item.threshold).length}
              </span>
            </div>
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary/80">Total Activity Logs</span>
              <span className="text-2xl font-black text-primary mt-1">{stockLogs.length}</span>
            </div>
          </div>

          {/* Tab 1: Current Stock Inventory */}
          {managerTab === "inventory" && (
            <div className="space-y-6">
              
              {/* Header inside Inventory tab */}
              <div className="flex justify-between items-center border-b border-border pb-4 gap-4 print:hidden">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-card-foreground">Stock Inventory</h3>
                  <p className="text-xs text-muted-foreground">Select a material card to adjust stock, or register new items</p>
                </div>
                <div className="flex items-center gap-2">
                  {inventory.length > 0 && (
                    <button
                      onClick={clearAllStock}
                      className="px-4 py-2 text-xs rounded-lg font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border transition-all flex items-center justify-center gap-1.5"
                    >
                      Clear All Stock
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={cn(
                      "px-4 py-2 text-xs rounded-lg font-bold transition-all border flex items-center justify-center gap-1.5",
                      showAddForm 
                        ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20" 
                        : "bg-primary text-primary-foreground border-primary hover:bg-primary/95 shadow-sm shadow-primary/10"
                    )}
                  >
                    {showAddForm ? "Cancel Add" : "+ Register Material"}
                  </button>
                </div>
              </div>

              {/* Collapsible Register form card */}
              {showAddForm && (
                <div className="bg-secondary/15 border border-border p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-card-foreground">Add New Material</h3>
                    <button 
                      onClick={() => setShowAddForm(false)} 
                      className="text-muted-foreground hover:text-foreground text-xs font-bold"
                    >
                      Close
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name input */}
                    <div>
                      <Label htmlFor="name" className="text-xs font-bold">Material Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="e.g. Ultratech OPC Cement"
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        className="h-10 text-xs rounded-lg mt-1 bg-card border-border"
                      />
                    </div>

                    {/* Category & Unit */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-bold">Category</Label>
                        <select
                          value={newItemCategory}
                          onChange={e => {
                            setNewItemCategory(e.target.value)
                            const cat = e.target.value
                            if (cat === "Cement") setNewItemUnit("Bags")
                            else if (cat === "Steel / Metal") setNewItemUnit("Kg")
                            else if (cat === "Sand / Aggregates") setNewItemUnit("Tons")
                            else if (cat === "Bricks / Blocks") setNewItemUnit("Pieces")
                            else if (cat === "Paint") setNewItemUnit("Liters")
                            else setNewItemUnit("Pieces")
                          }}
                          className="w-full h-10 px-3 text-xs bg-card border border-border rounded-lg mt-1 font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {["Cement", "Sand / Aggregates", "Steel / Metal", "Bricks / Blocks", "Plumbing", "Electrical", "Paint", "Other"].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="unit" className="text-xs font-bold">Unit of Measure</Label>
                        <Input
                          id="unit"
                          type="text"
                          placeholder="e.g. Bags, Kg, Tons"
                          value={newItemUnit}
                          onChange={e => setNewItemUnit(e.target.value)}
                          className="h-10 text-xs rounded-lg mt-1 bg-card border-border"
                        />
                      </div>
                    </div>

                    {/* Initial stock */}
                    <div>
                      <Label htmlFor="qty" className="text-xs font-bold">Initial Stock</Label>
                      <Input
                        id="qty"
                        type="number"
                        placeholder="e.g. 100"
                        value={newItemQuantity}
                        onChange={e => setNewItemQuantity(e.target.value)}
                        className="h-10 text-xs rounded-lg mt-1 bg-card border-border"
                      />
                    </div>

                    {/* Threshold */}
                    <div>
                      <Label htmlFor="thresh" className="text-xs font-bold">Alert Threshold</Label>
                      <Input
                        id="thresh"
                        type="number"
                        placeholder="e.g. 20"
                        value={newItemThreshold}
                        onChange={e => setNewItemThreshold(e.target.value)}
                        className="h-10 text-xs rounded-lg mt-1 bg-card border-border"
                        title="If current stock levels go below this value, you will get a low-stock alert."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button 
                      className="w-full md:w-44 h-10 rounded-lg text-xs font-bold" 
                      onClick={() => {
                        addInventoryItem()
                        setShowAddForm(false)
                      }}
                      disabled={!newItemName.trim() || !newItemQuantity || !newItemThreshold}
                    >
                      Register Material
                    </Button>
                  </div>
                </div>
              )}

              {/* Cards Grid */}
              {inventory.length === 0 ? (
                <div className="text-center py-16 bg-secondary/10 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center p-6">
                  <Package className="w-12 h-12 text-muted-foreground/60 mb-2" />
                  <p className="font-semibold text-card-foreground">Inventory is Empty</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">Click Register Material to start tracking stock counts.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {inventory.map(item => {
                    const isLow = item.quantity <= item.threshold;
                    const isCritical = item.quantity === 0;
                    
                    const safetyRatio = item.threshold > 0 ? Math.min((item.quantity / item.threshold) * 100, 100) : 100;
                    
                    let cardBorder = "border-border/60 hover:border-border"
                    let badgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                    let badgeText = "In Stock"
                    let barColor = "bg-emerald-500"

                    if (isCritical) {
                      cardBorder = "border-destructive bg-destructive/5 hover:border-destructive"
                      badgeColor = "bg-destructive/10 text-destructive border-destructive/20"
                      badgeText = "Out of Stock"
                      barColor = "bg-destructive"
                    } else if (isLow) {
                      cardBorder = "border-amber-500/60 bg-amber-500/5 hover:border-amber-500"
                      badgeColor = "bg-amber-500/10 text-amber-600 border-amber-200"
                      badgeText = "Low Stock"
                      barColor = "bg-amber-500"
                    }

                    const isSelected = selectedItemId === item.id;

                    return (
                      <div 
                        key={item.id} 
                        className={cn(
                          "bg-card rounded-xl border p-4 transition-all shadow-sm flex flex-col gap-3",
                          cardBorder,
                          isSelected ? "col-span-1 md:col-span-2 ring-2 ring-primary border-primary animate-in fade-in zoom-in-95 duration-150" : ""
                        )}
                      >
                        {/* Upper Section */}
                        <div 
                          className="flex justify-between items-start cursor-pointer"
                          onClick={() => {
                            setSelectedItemId(isSelected ? null : item.id)
                            setAdjustAmount("")
                            setAdjustNotes("")
                            setAdjustDate(getTodayDateString())
                          }}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-secondary/80 text-muted-foreground uppercase">
                                {item.category}
                              </span>
                              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase", badgeColor)}>
                                {badgeText}
                              </span>
                            </div>
                            <h4 className="font-bold text-card-foreground text-base mt-1">{item.name}</h4>
                          </div>

                          <div className="text-right">
                            <span className="text-2xl font-black text-card-foreground">
                              {item.quantity.toLocaleString()}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground ml-1">{item.unit}</span>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Threshold: {item.threshold} {item.unit}</p>
                          </div>
                        </div>

                        {/* Safety Progress Bar */}
                        <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden border border-border/20">
                          <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${safetyRatio}%` }} />
                        </div>

                        {/* Expandable stock adjustment container */}
                        {isSelected && (
                          <div className="mt-2 pt-4 border-t border-border/60 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-card-foreground">Adjust Stock Level</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => deleteInventoryItem(item.id)}
                                title="Delete Item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                              {/* Quantity input */}
                              <div className="md:col-span-2">
                                <Label htmlFor={`qty-${item.id}`} className="text-[10px] font-bold text-muted-foreground uppercase">Amount</Label>
                                <Input
                                  id={`qty-${item.id}`}
                                  type="number"
                                  placeholder="e.g. 50"
                                  value={adjustAmount}
                                  onChange={(e) => setAdjustAmount(e.target.value)}
                                  className="h-9 mt-1 text-xs rounded-lg bg-card"
                                />
                              </div>

                              {/* Action selector */}
                              <div className="md:col-span-3 flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setAdjustType("in")}
                                  className={cn(
                                    "flex-1 h-9 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1",
                                    adjustType === "in"
                                      ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                      : "border-border text-muted-foreground bg-card hover:bg-secondary/40"
                                  )}
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAdjustType("out")}
                                  className={cn(
                                    "flex-1 h-9 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1",
                                    adjustType === "out"
                                      ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                                      : "border-border text-muted-foreground bg-card hover:bg-secondary/40"
                                  )}
                                >
                                  <TrendingDown className="w-3.5 h-3.5" /> Use
                                </button>
                              </div>

                              {/* Date Selector */}
                              <div className="md:col-span-3">
                                <Label htmlFor={`date-${item.id}`} className="text-[10px] font-bold text-muted-foreground uppercase">Date Logged</Label>
                                <Input
                                  id={`date-${item.id}`}
                                  type="date"
                                  value={adjustDate}
                                  onChange={(e) => setAdjustDate(e.target.value)}
                                  className="h-9 mt-1 text-xs rounded-lg bg-card"
                                />
                              </div>

                              {/* Notes */}
                              <div className="md:col-span-2">
                                <Label htmlFor={`notes-${item.id}`} className="text-[10px] font-bold text-muted-foreground uppercase">Notes</Label>
                                <Input
                                  id={`notes-${item.id}`}
                                  type="text"
                                  placeholder="e.g. Wall work"
                                  value={adjustNotes}
                                  onChange={(e) => setAdjustNotes(e.target.value)}
                                  className="h-9 mt-1 text-xs rounded-lg bg-card"
                                />
                              </div>

                              {/* Submit button */}
                              <div className="md:col-span-2">
                                <Button 
                                  size="sm" 
                                  className="w-full h-9 rounded-lg text-xs font-bold"
                                  onClick={() => {
                                    adjustStock(item.id, adjustAmount, adjustType, adjustNotes, adjustDate)
                                    setAdjustAmount("")
                                    setAdjustNotes("")
                                    setAdjustDate(getTodayDateString())
                                    setSelectedItemId(null)
                                  }}
                                >
                                  Confirm
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Daily Material Sheets (Daily Reports) */}
          {managerTab === "dailySheets" && (
            <div className="space-y-6">
              
              {/* Sheet Control Banner */}
              <div className="bg-secondary/20 p-5 rounded-2xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-card-foreground">Select Daily Log Date</h3>
                    <p className="text-xs text-muted-foreground">Review total structural adjustments and material usage for any day</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 print:hidden">
                  <Input
                    type="date"
                    value={selectedDailySheetDate}
                    onChange={(e) => {
                      setSelectedDailySheetDate(e.target.value)
                      setIsEditingDailySheet(false)
                    }}
                    className="h-10 text-xs rounded-lg bg-card w-40"
                  />
                  
                  <button
                    onClick={() => {
                      setIsEditingDailySheet(!isEditingDailySheet)
                      setDailyInflowInput({})
                      setDailyOutflowInput({})
                      setDailyNotesInput({})
                    }}
                    className={cn(
                      "h-10 px-4 text-xs rounded-lg font-bold transition-all border flex items-center justify-center gap-1.5",
                      isEditingDailySheet 
                        ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20" 
                        : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/85"
                    )}
                  >
                    {isEditingDailySheet ? "Cancel Edits" : "Edit Daily Sheet"}
                  </button>

                  <Button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.print()
                      }
                    }}
                    className="h-10 text-xs rounded-lg font-bold bg-primary text-primary-foreground flex items-center gap-2"
                  >
                    Print Daily Report
                  </Button>
                </div>
              </div>

              {/* Daily Log Sheet Report */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm relative overflow-hidden print:p-0 print:border-none print:shadow-none">
                
                {/* Print Banner Branding */}
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <div className="space-y-1">
                    <span className="text-[9px] text-primary uppercase tracking-widest font-black">Building Dreams Platform</span>
                    <h3 className="text-xl font-black text-card-foreground">Daily Construction Material Sheet</h3>
                    <p className="text-xs text-muted-foreground">Logged changes for date: <span className="font-extrabold text-foreground">{formatDisplayDate(selectedDailySheetDate)}</span></p>
                  </div>

                </div>

                {/* Daily Overview metrics */}
                {(() => {
                  const daySummary = getDailySummary(selectedDailySheetDate)
                  const totalItemsUsed = daySummary.filter(item => item.used > 0).length
                  const totalItemsAdded = daySummary.filter(item => item.added > 0).length
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2 border-b border-border/40 pb-4">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Items Consumed</span>
                        <span className="text-lg font-extrabold text-card-foreground">{totalItemsUsed} items</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Inflow Shipments</span>
                        <span className="text-lg font-extrabold text-card-foreground">{totalItemsAdded} items</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Active Log Records</span>
                        <span className="text-lg font-extrabold text-card-foreground">
                          {stockLogs.filter(log => log.date === selectedDailySheetDate).length} entries
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Log Submitter</span>
                        <span className="text-lg font-extrabold text-card-foreground">Site Supervisor</span>
                      </div>
                    </div>
                  )
                })()}

                {/* Materials Sheet Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 text-[10px] font-black uppercase text-muted-foreground tracking-wider bg-secondary/30">
                        <th className="py-3 px-4 rounded-l-lg">Material</th>
                        <th className="py-3 px-4">Category</th>
                        <th className={cn("py-3 px-4", isEditingDailySheet ? "text-center w-32" : "text-right")}>Inflow (Added)</th>
                        <th className={cn("py-3 px-4", isEditingDailySheet ? "text-center w-32" : "text-right")}>Outflow (Used)</th>
                        <th className="py-3 px-4 text-right">Net Change</th>
                        <th className="py-3 px-4 rounded-r-lg">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {(() => {
                        const summary = getDailySummary(selectedDailySheetDate)
                        
                        if (summary.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                                No registered materials found in inventory. Add items in Current Stock tab.
                              </td>
                            </tr>
                          )
                        }

                        return summary.map(item => {
                          const netVal = isEditingDailySheet
                            ? (parseFloat(dailyInflowInput[item.id] || "0") || 0) - (parseFloat(dailyOutflowInput[item.id] || "0") || 0)
                            : item.net
                          const netText = netVal > 0 ? `+${netVal.toLocaleString()}` : netVal === 0 ? "0" : `${netVal.toLocaleString()}`
                          const netColor = netVal > 0 ? "text-emerald-600" : netVal === 0 ? "text-muted-foreground/60" : "text-rose-600"
                          
                          return (
                            <tr key={item.id} className="hover:bg-secondary/10 transition-colors text-xs text-card-foreground font-semibold">
                              <td className="py-3 px-4 font-bold">{item.name}</td>
                              <td className="py-3 px-4 text-[10px] font-normal text-muted-foreground uppercase">{item.category}</td>
                              
                              {/* Inflow Cell */}
                              <td className={cn("py-2 px-4", isEditingDailySheet ? "text-center" : "text-right")}>
                                {isEditingDailySheet ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    className="w-24 text-right h-8 text-xs bg-card border-border/80 inline-block font-semibold focus-visible:ring-primary"
                                    value={dailyInflowInput[item.id] || ""}
                                    onChange={e => setDailyInflowInput(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  />
                                ) : (
                                  item.added > 0 ? `+${item.added.toLocaleString()}` : "—"
                                )}
                              </td>

                              {/* Outflow Cell */}
                              <td className={cn("py-2 px-4", isEditingDailySheet ? "text-center" : "text-right")}>
                                {isEditingDailySheet ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    className="w-24 text-right h-8 text-xs bg-card border-border/80 inline-block font-semibold focus-visible:ring-primary"
                                    value={dailyOutflowInput[item.id] || ""}
                                    onChange={e => setDailyOutflowInput(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  />
                                ) : (
                                  item.used > 0 ? `-${item.used.toLocaleString()}` : "—"
                                )}
                              </td>

                              {/* Net Change Cell */}
                              <td className={cn("py-3 px-4 text-right font-bold", netColor)}>
                                {netText}
                              </td>

                              <td className="py-3 px-4 text-muted-foreground text-[10px]">{item.unit}</td>
                            </tr>
                          )
                        })
                      })()}
                    </tbody>
                  </table>
                </div>

                {isEditingDailySheet && (
                  <div className="flex justify-end gap-3 mt-4 print:hidden">
                    <button
                      onClick={() => {
                        setIsEditingDailySheet(false)
                        setDailyInflowInput({})
                        setDailyOutflowInput({})
                        setDailyNotesInput({})
                      }}
                      className="px-4 py-2 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:bg-secondary/40 transition-all"
                    >
                      Cancel
                    </button>
                    <Button
                      onClick={() => {
                        saveDailyLogs()
                        setIsEditingDailySheet(false)
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground transition-all shadow-md"
                    >
                      Save Daily Logs
                    </Button>
                  </div>
                )}



              </div>
            </div>
          )}
        </div>
      )}


      {/* Cost Estimator */}
      {activeTool === "cost" && (
        <div className="bg-card border border-border rounded-2xl p-8 space-y-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-2xl font-bold text-card-foreground">Cost Estimator</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Calculate professional structure, material and finish quotes</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setActiveTool(null); resetTool(); }} className="hover:bg-secondary/80">
              ← Back
            </Button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Dimensions & Height */}
              <div className="space-y-6">
                <div>
                  <Label htmlFor="costArea" className="text-sm font-semibold text-card-foreground">Built-up Area (per floor, sq. ft)</Label>
                  <div className="relative mt-2">
                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="costArea"
                      type="number"
                      placeholder="Enter area (e.g. 1000)"
                      value={costArea}
                      onChange={(e) => setCostArea(e.target.value)}
                      className="pl-12 h-14 text-base rounded-xl bg-secondary/30 border-border focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-card-foreground flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary" /> Number of Floors
                  </Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {["1", "2", "3", "4", "5"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setCostFloors(f)}
                        className={cn(
                          "py-3 rounded-xl border font-bold text-sm transition-all focus:outline-none",
                          costFloors === f
                            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                            : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                        )}
                      >
                        {f === "1" ? "G" : `G+${parseInt(f) - 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Site & Quality */}
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-card-foreground flex items-center gap-1.5">
                    <Mountain className="w-4 h-4 text-primary" /> Soil Condition
                  </Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { id: "normal", label: "Normal Soil", desc: "Standard footing" },
                      { id: "soft", label: "Soft Soil", desc: "Pile footing (+15%)" },
                      { id: "rocky", label: "Rocky Plot", desc: "Blasting/Breaker (+8%)" }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCostSoil(s.id as any)}
                        className={cn(
                          "p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center focus:outline-none",
                          costSoil === s.id
                            ? "border-primary bg-primary/5 text-primary font-bold shadow-sm scale-[1.02]"
                            : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                        )}
                      >
                        <span className="text-xs">{s.label}</span>
                        <span className="text-[9px] opacity-80 mt-0.5">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-card-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" /> Finish Quality
                  </Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { id: "basic", label: "Basic", rate: "₹1,400/sqft" },
                      { id: "standard", label: "Standard", rate: "₹1,800/sqft" },
                      { id: "premium", label: "Premium", rate: "₹2,500/sqft" },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setCostType(type.id as typeof costType)}
                        className={cn(
                          "p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center focus:outline-none",
                          costType === type.id
                            ? "border-primary bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 scale-[1.02]"
                            : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                        )}
                      >
                        <span className="text-xs">{type.label}</span>
                        <span className="text-[10px] opacity-80 mt-0.5">{type.rate}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stilt Parking Switch Banner */}
            <div className="flex items-center justify-between p-4 bg-secondary/40 rounded-xl border border-border/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <SquareParking className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="parking" className="text-sm font-semibold text-card-foreground cursor-pointer">Ground Floor Stilt Parking</Label>
                  <p className="text-xs text-muted-foreground">Leaves Ground Floor open for parking (saves ~45% G-floor finishing costs)</p>
                </div>
              </div>
              <input
                id="parking"
                type="checkbox"
                checked={costParking}
                onChange={(e) => setCostParking(e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer rounded border-border"
              />
            </div>

            <Button onClick={calculateCost} className="w-full h-14 text-base rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
              <Coins className="w-5 h-5" /> Calculate Estimate
            </Button>
          </div>

          {costResult && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl border-t-4 border-t-primary animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Results Hero Header */}
              <div className="bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-6 border-b border-border grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                <div className="space-y-1 border-b md:border-b-0 md:border-r border-border/80 pb-4 md:pb-0 md:pr-6">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Built Area</p>
                  <p className="text-2xl font-black text-card-foreground">
                    {costResult.totalArea.toLocaleString()} <span className="text-sm font-semibold text-muted-foreground">sq. ft</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">({costArea} sq.ft × {costFloors} floors)</p>
                </div>

                <div className="space-y-1 border-b md:border-b-0 md:border-r border-border/80 pb-4 md:pb-0 md:px-6">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Estimated Cost</p>
                  <p className="text-3xl font-black text-primary">
                    ₹{costResult.total.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">Inclusive of design overheads</p>
                </div>

                <div className="space-y-1 md:pl-6 flex flex-col justify-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Average Construction Rate</p>
                  <p className="text-xl font-extrabold text-card-foreground mt-1">
                    ₹{Math.round(costResult.total / costResult.totalArea).toLocaleString()}<span className="text-xs font-semibold text-muted-foreground">/sq. ft</span>
                  </p>
                  <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Based on {costType} standard</p>
                </div>
              </div>



              {/* Cost Breakdown Grid */}
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-card-foreground">Component-Wise Cost Analysis</h4>
                  <span className="text-[10px] text-muted-foreground font-semibold">Standard Material Weightages</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {costResult.breakdown.map((item) => {
                    // Match icons & color styling based on item label
                    let IconComponent = Building2
                    let barColor = "from-violet-500 to-indigo-600"
                    let iconBg = "bg-violet-500/10 text-violet-600"

                    if (item.label.includes("Foundation")) {
                      IconComponent = Building2
                      barColor = "from-slate-500 to-slate-700"
                      iconBg = "bg-slate-500/10 text-slate-600"
                    } else if (item.label.includes("Brickwork")) {
                      IconComponent = Layers
                      barColor = "from-orange-500 to-amber-600"
                      iconBg = "bg-orange-500/10 text-orange-600"
                    } else if (item.label.includes("Flooring")) {
                      IconComponent = Ruler
                      barColor = "from-emerald-500 to-teal-600"
                      iconBg = "bg-emerald-500/10 text-emerald-600"
                    } else if (item.label.includes("Electrical")) {
                      IconComponent = Zap
                      barColor = "from-blue-500 to-cyan-600"
                      iconBg = "bg-blue-500/10 text-blue-600"
                    } else if (item.label.includes("Painting")) {
                      IconComponent = Paintbrush
                      barColor = "from-rose-500 to-pink-600"
                      iconBg = "bg-rose-500/10 text-rose-600"
                    }

                    return (
                      <div key={item.label} className="p-4 bg-secondary/20 rounded-xl border border-border/40 hover:border-border transition-all flex items-start gap-4">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-card-foreground truncate block pr-2">{item.label.split(" (")[0]}</span>
                            <span className="text-xs font-bold text-card-foreground shrink-0">₹{item.value.toLocaleString()}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-secondary/80 rounded-full h-2 overflow-hidden border border-border/20">
                              <div
                                className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", barColor)}
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-extrabold text-muted-foreground w-8 text-right">{item.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>


              </div>
            </div>
          )}
        </div>
      )}

      {/* EMI Calculator */}
      {activeTool === "emi" && (
        <div className="bg-card border border-border rounded-2xl p-8 space-y-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
                <Percent className="w-6 h-6 text-primary" /> Loan EMI Calculator
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Calculate your monthly home loan repayments and interest breakdown</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setActiveTool(null); resetTool(); }} className="hover:bg-secondary/80">
              ← Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side: Inputs */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-card-foreground">Loan Details</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="principal" className="text-sm font-semibold">Loan Amount (₹)</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    <Input
                      id="principal"
                      type="number"
                      placeholder="e.g. 5000000"
                      value={emiPrincipal}
                      onChange={(e) => setEmiPrincipal(e.target.value)}
                      className="pl-9 h-14 text-base rounded-xl bg-secondary/30 border-border focus-visible:ring-primary font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rate" className="text-sm font-semibold">Interest Rate (% p.a.)</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                      <Input
                        id="rate"
                        type="number"
                        placeholder="e.g. 8.5"
                        value={emiRate}
                        onChange={(e) => setEmiRate(e.target.value)}
                        className="pl-9 h-14 text-base rounded-xl bg-secondary/30 border-border focus-visible:ring-primary font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tenure" className="text-sm font-semibold">Tenure (Years)</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">Yr</span>
                      <Input
                        id="tenure"
                        type="number"
                        placeholder="e.g. 20"
                        value={emiTenure}
                        onChange={(e) => setEmiTenure(e.target.value)}
                        className="pl-10 h-14 text-base rounded-xl bg-secondary/30 border-border focus-visible:ring-primary font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={calculateEMI} 
                  className="w-full h-14 text-base rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <Calculator className="w-5 h-5" /> Calculate Repayments
                </Button>
              </div>
            </div>

            {/* Right side: Results */}
            <div className="space-y-6 max-h-[320px] overflow-y-auto pr-2">
              {!emiResult ? (
                <div className="h-full min-h-[300px] text-center bg-secondary/20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center p-6">
                  <span className="text-3xl mb-2">📊</span>
                  <p className="text-sm font-medium text-muted-foreground">Ready to calculate</p>
                  <p className="text-xs text-muted-foreground/80 mt-1 max-w-[240px]">Enter your loan amount, interest rate, and tenure to see a detailed repayment breakdown.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Monthly EMI Hero Card */}
                  <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 text-center relative overflow-hidden">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Monthly EMI (Repayment)</p>
                    <p className="text-4xl font-black text-primary mt-2">
                      ₹{emiResult.emi.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">Paid monthly for {emiTenure} years</p>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="bg-secondary/15 rounded-2xl p-5 border border-border/60 space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Breakdown</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> Principal Amount
                        </span>
                        <span className="font-semibold text-card-foreground">₹{parseFloat(emiPrincipal).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Total Interest
                        </span>
                        <span className="font-semibold text-card-foreground">₹{emiResult.totalInterest.toLocaleString()}</span>
                      </div>
                      
                      <div className="border-t border-border/80 pt-3 flex justify-between items-center text-base font-bold">
                        <span className="text-card-foreground">Total Payable</span>
                        <span className="text-primary">₹{emiResult.totalPayment.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Progress Bar Visual Representation */}
                    <div className="pt-2">
                      <div className="w-full bg-secondary/80 rounded-full h-3 overflow-hidden flex border border-border/20">
                        <div 
                          className="bg-blue-500 h-full" 
                          style={{ width: `${(parseFloat(emiPrincipal) / emiResult.totalPayment) * 100}%` }}
                          title="Principal"
                        />
                        <div 
                          className="bg-amber-500 h-full flex-1" 
                          title="Interest"
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground font-bold mt-1.5">
                        <span>Principal: {Math.round((parseFloat(emiPrincipal) / emiResult.totalPayment) * 100)}%</span>
                        <span>Interest: {Math.round((emiResult.totalInterest / emiResult.totalPayment) * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Pro Tip */}
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-3 items-start">
                    <span className="text-sm mt-0.5">💡</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-primary">Prepayment Tip</p>
                      <p className="text-[11px] text-primary/80 leading-relaxed">
                        Paying just one extra EMI per year can help reduce your tenure by nearly **3-4 years** and save you up to **10-15%** in total interest payments.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
