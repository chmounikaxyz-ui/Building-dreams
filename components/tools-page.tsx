"use client"

import { useState, useCallback, useEffect } from "react"
import { Calculator, Ruler, Percent, TrendingUp, FileText, ChevronRight, RotateCcw, Layers, Mountain, Sparkles, SquareParking, Coins, Building2, Paintbrush, Zap, Plus, Trash2 } from "lucide-react"
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
    id: "area",
    label: "Area Calculator",
    icon: Ruler,
    description: "Calculate construction area",
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

  // Area Calculator State
  const [areaLength, setAreaLength] = useState("")
  const [areaWidth, setAreaWidth] = useState("")
  const [areaResult, setAreaResult] = useState<{ sqft: number; sqm: number } | null>(null)

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

  const calculateArea = () => {
    const length = parseFloat(areaLength)
    const width = parseFloat(areaWidth)
    if (!isNaN(length) && !isNaN(width)) {
      const sqft = length * width
      const sqm = sqft * 0.0929
      setAreaResult({
        sqft: Math.round(sqft * 100) / 100,
        sqm: Math.round(sqm * 100) / 100
      })
    }
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
    setAreaResult(null)
    setCostResult(null)
    setEmiResult(null)
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

      {/* Area Calculator */}
      {activeTool === "area" && (
        <div className="bg-card border border-border rounded-2xl p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-card-foreground">Area Calculator</h2>
            <Button variant="ghost" size="sm" onClick={() => { setActiveTool(null); resetTool(); }}>
              ← Back
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="length" className="text-base font-medium">Length (ft)</Label>
              <Input
                id="length"
                type="number"
                placeholder="Enter length"
                value={areaLength}
                onChange={(e) => setAreaLength(e.target.value)}
                className="mt-2 h-14 text-base rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="width" className="text-base font-medium">Width (ft)</Label>
              <Input
                id="width"
                type="number"
                placeholder="Enter width"
                value={areaWidth}
                onChange={(e) => setAreaWidth(e.target.value)}
                className="mt-2 h-14 text-base rounded-xl"
              />
            </div>
            <Button onClick={calculateArea} className="w-full h-14 text-base rounded-xl">
              Calculate
            </Button>
          </div>

          {areaResult && (
            <div className="bg-secondary rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-secondary-foreground">Results</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{areaResult.sqft}</p>
                  <p className="text-xs text-muted-foreground">Square Feet</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{areaResult.sqm}</p>
                  <p className="text-xs text-muted-foreground">Square Meters</p>
                </div>
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
