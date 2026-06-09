"use client"

import { useState } from "react"
import { Calculator, Ruler, Percent, TrendingUp, FileText, ChevronRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const tools = [
  {
    id: "cement",
    label: "Cement Calculator",
    icon: Calculator,
    description: "Calculate cement bags needed",
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
  
  // Cement Calculator State
  const [cementArea, setCementArea] = useState("")
  const [cementThickness, setCementThickness] = useState("0.15")
  const [cementResult, setCementResult] = useState<{ bags: number; sand: number; aggregate: number } | null>(null)

  // Area Calculator State
  const [areaLength, setAreaLength] = useState("")
  const [areaWidth, setAreaWidth] = useState("")
  const [areaResult, setAreaResult] = useState<{ sqft: number; sqm: number } | null>(null)

  // Cost Estimator State
  const [costArea, setCostArea] = useState("")
  const [costType, setCostType] = useState<"basic" | "standard" | "premium">("standard")
  const [costResult, setCostResult] = useState<{ total: number; breakdown: { label: string; value: number }[] } | null>(null)

  // EMI Calculator State
  const [emiPrincipal, setEmiPrincipal] = useState("")
  const [emiRate, setEmiRate] = useState("8.5")
  const [emiTenure, setEmiTenure] = useState("20")
  const [emiResult, setEmiResult] = useState<{ emi: number; totalInterest: number; totalPayment: number } | null>(null)

  const calculateCement = () => {
    const area = parseFloat(cementArea)
    const thickness = parseFloat(cementThickness)
    if (!isNaN(area) && !isNaN(thickness)) {
      const volume = (area * 0.0929) * thickness // Convert sqft to sqm
      const dryVolume = volume * 1.54
      const cement = dryVolume * (1/7) * 1440 / 50 // 1:2:4 ratio, 50kg bags
      const sand = dryVolume * (2/7)
      const aggregate = dryVolume * (4/7)
      setCementResult({
        bags: Math.ceil(cement),
        sand: Math.round(sand * 100) / 100,
        aggregate: Math.round(aggregate * 100) / 100
      })
    }
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
    const rates = {
      basic: 1400,
      standard: 1800,
      premium: 2500
    }
    if (!isNaN(area)) {
      const rate = rates[costType]
      const total = area * rate
      setCostResult({
        total,
        breakdown: [
          { label: "Foundation & Structure", value: Math.round(total * 0.35) },
          { label: "Walls & Plastering", value: Math.round(total * 0.25) },
          { label: "Flooring & Tiles", value: Math.round(total * 0.15) },
          { label: "Electrical & Plumbing", value: Math.round(total * 0.15) },
          { label: "Painting & Finishing", value: Math.round(total * 0.10) },
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
    setCementResult(null)
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

      {/* Cement Calculator */}
      {activeTool === "cement" && (
        <div className="bg-card border border-border rounded-2xl p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-card-foreground">Cement Calculator</h2>
            <Button variant="ghost" size="sm" onClick={() => { setActiveTool(null); resetTool(); }}>
              ← Back
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="area" className="text-base font-medium">Area (sq. ft)</Label>
              <Input
                id="area"
                type="number"
                placeholder="Enter area in square feet"
                value={cementArea}
                onChange={(e) => setCementArea(e.target.value)}
                className="mt-2 h-14 text-base rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="thickness" className="text-base font-medium">Concrete Thickness (meters)</Label>
              <Input
                id="thickness"
                type="number"
                placeholder="Enter thickness"
                value={cementThickness}
                onChange={(e) => setCementThickness(e.target.value)}
                className="mt-2 h-14 text-base rounded-xl"
              />
            </div>
            <Button onClick={calculateCement} className="w-full h-14 text-base rounded-xl">
              Calculate
            </Button>
          </div>

          {cementResult && (
            <div className="bg-secondary rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-secondary-foreground">Results (1:2:4 Mix)</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{cementResult.bags}</p>
                  <p className="text-xs text-muted-foreground">Cement Bags</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{cementResult.sand}</p>
                  <p className="text-xs text-muted-foreground">Sand (m³)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{cementResult.aggregate}</p>
                  <p className="text-xs text-muted-foreground">Aggregate (m³)</p>
                </div>
              </div>
            </div>
          )}
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
        <div className="bg-card border border-border rounded-2xl p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-card-foreground">Cost Estimator</h2>
            <Button variant="ghost" size="sm" onClick={() => { setActiveTool(null); resetTool(); }}>
              ← Back
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="costArea" className="text-base font-medium">Built-up Area (sq. ft)</Label>
              <Input
                id="costArea"
                type="number"
                placeholder="Enter area"
                value={costArea}
                onChange={(e) => setCostArea(e.target.value)}
                className="mt-2 h-14 text-base rounded-xl"
              />
            </div>
            <div>
              <Label className="text-base font-medium">Construction Type</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { id: "basic", label: "Basic", rate: "₹1,400/sqft" },
                  { id: "standard", label: "Standard", rate: "₹1,800/sqft" },
                  { id: "premium", label: "Premium", rate: "₹2,500/sqft" },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setCostType(type.id as typeof costType)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-center transition-all",
                      costType === type.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.rate}</p>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={calculateCost} className="w-full h-14 text-base rounded-xl">
              Estimate Cost
            </Button>
          </div>

          {costResult && (
            <div className="bg-secondary rounded-xl p-4 space-y-4">
              <div className="text-center pb-3 border-b border-border">
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="text-3xl font-bold text-primary">₹{costResult.total.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                {costResult.breakdown.map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">₹{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMI Calculator */}
      {activeTool === "emi" && (
        <div className="bg-card border border-border rounded-2xl p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-card-foreground">EMI Calculator</h2>
            <Button variant="ghost" size="sm" onClick={() => { setActiveTool(null); resetTool(); }}>
              ← Back
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="principal" className="text-base font-medium">Loan Amount (₹)</Label>
              <Input
                id="principal"
                type="number"
                placeholder="Enter loan amount"
                value={emiPrincipal}
                onChange={(e) => setEmiPrincipal(e.target.value)}
                className="mt-2 h-14 text-base rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="rate" className="text-base font-medium">Interest Rate (% per annum)</Label>
              <Input
                id="rate"
                type="number"
                placeholder="Enter interest rate"
                value={emiRate}
                onChange={(e) => setEmiRate(e.target.value)}
                className="mt-2 h-14 text-base rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="tenure" className="text-base font-medium">Loan Tenure (years)</Label>
              <Input
                id="tenure"
                type="number"
                placeholder="Enter tenure"
                value={emiTenure}
                onChange={(e) => setEmiTenure(e.target.value)}
                className="mt-2 h-14 text-base rounded-xl"
              />
            </div>
            <Button onClick={calculateEMI} className="w-full h-14 text-base rounded-xl">
              Calculate EMI
            </Button>
          </div>

          {emiResult && (
            <div className="bg-secondary rounded-xl p-4 space-y-4">
              <div className="text-center pb-3 border-b border-border">
                <p className="text-sm text-muted-foreground">Monthly EMI</p>
                <p className="text-3xl font-bold text-primary">₹{emiResult.emi.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-card-foreground">₹{emiResult.totalInterest.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Interest</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-card-foreground">₹{emiResult.totalPayment.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Payment</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
