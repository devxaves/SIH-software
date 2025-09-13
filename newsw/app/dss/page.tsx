"use client"

import type React from "react"
import { useState, useEffect } from "react"
import useSWR from "swr"

type Recommendation = {
  id: number
  claimId: number
  scheme: string
  reason: string
  priority: number
  createdAt: string
}

type Threshold = {
  id: number
  parameter: string
  value: number
  unit?: string
  description?: string
}

type Claim = {
  id: number
  claimant: string
  claimantName: string
  village: string
  district: string
  type: string
  area: number
  status: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DSSPage() {
  const { data: recommendations, mutate, isLoading: loadingRecs } = useSWR<Recommendation[]>("/api/dss", fetcher)
  const { data: thresholds, mutate: mutateThresholds, isLoading: loadingThresholds } = useSWR<Threshold[]>("/api/dss/thresholds", fetcher)
  const { data: claims, isLoading: loadingClaims } = useSWR<Claim[]>("/api/claims", fetcher)
  
  const [selectedClaimId, setSelectedClaimId] = useState("")
  const [evaluating, setEvaluating] = useState(false)
  const [simulationMode, setSimulationMode] = useState(false)
  const [tempThresholds, setTempThresholds] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Initialize default thresholds if none exist
  useEffect(() => {
    const initializeThresholds = async () => {
      if (thresholds && thresholds.length === 0) {
        const defaultThresholds = [
          { parameter: "water_index", value: 0.5, unit: "index", description: "Water availability index threshold" },
          { parameter: "forest_cover", value: 0.4, unit: "ratio", description: "Forest cover ratio threshold" },
          { parameter: "max_area_ha", value: 4.0, unit: "hectares", description: "Maximum area eligibility" },
          { parameter: "min_area_ha", value: 0.5, unit: "hectares", description: "Minimum area eligibility" },
          { parameter: "population_density", value: 150, unit: "per km²", description: "Population density threshold" },
        ]

        for (const threshold of defaultThresholds) {
          try {
            await fetch("/api/dss/thresholds", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(threshold),
            })
          } catch (err) {
            console.error("Failed to initialize threshold:", threshold.parameter, err)
          }
        }
        mutateThresholds()
      }
    }

    initializeThresholds()
  }, [thresholds, mutateThresholds])

  const exportCsv = () => {
    if (!recommendations || recommendations.length === 0) {
      setError("No recommendations to export")
      return
    }

    const header = ["ID", "Claim ID", "Scheme", "Reason", "Priority", "Created At"]
    const rows = recommendations.map((r) => [
      r.id,
      r.claimId,
      escapeCsv(r.scheme),
      escapeCsv(r.reason),
      r.priority,
      r.createdAt,
    ])
    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `dss_recommendations_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setSuccess("CSV exported successfully!")
    setTimeout(() => setSuccess(null), 3000)
  }

  const evaluateRules = async () => {
    if (!selectedClaimId) {
      setError("Please select a claim to evaluate")
      return
    }

    setEvaluating(true)
    setError(null)

    try {
      const requestBody: any = {
        claimId: Number(selectedClaimId),
      }

      if (simulationMode) {
        requestBody.thresholds = tempThresholds
      }

      const response = await fetch("/api/dss/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(`Generated ${result.recommendations?.length || 0} recommendations successfully!`)
        mutate() // Refresh recommendations
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || "Evaluation failed")
      }
    } catch (error: any) {
      console.error("Evaluation failed:", error)
      setError("Network error occurred during evaluation")
    } finally {
      setEvaluating(false)
    }
  }

  const updateThreshold = async (parameter: string, value: number) => {
    try {
      const response = await fetch("/api/dss/thresholds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parameter, value }),
      })

      if (response.ok) {
        setSuccess("Threshold updated successfully!")
        mutateThresholds()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const result = await response.json()
        setError(result.error || "Failed to update threshold")
      }
    } catch (error: any) {
      console.error("Threshold update failed:", error)
      setError("Network error occurred while updating threshold")
    }
  }

  const handleThresholdChange = (parameter: string, value: number) => {
    if (simulationMode) {
      setTempThresholds((prev) => ({ ...prev, [parameter]: value }))
    } else {
      updateThreshold(parameter, value)
    }
  }

  const getThresholdValue = (parameter: string) => {
    if (simulationMode && tempThresholds[parameter] !== undefined) {
      return tempThresholds[parameter]
    }
    return thresholds?.find((t) => t.parameter === parameter)?.value ?? 0
  }

  const clearError = () => setError(null)

  return (
    <section className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-in-left">
        <div>
          <h1 className="text-4xl font-bold text-primary">DSS Rule Engine</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Decision Support System for Forest Rights Act Implementation
          </p>
        </div>
        <button 
          onClick={exportCsv} 
          disabled={!recommendations || recommendations.length === 0}
          className="bg-gradient-orange-white text-white px-6 py-3 rounded-xl font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl btn-enhanced"
        >
          Export CSV
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button onClick={clearError} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <span className="sr-only">Dismiss</span>
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Panel - Controls */}
        <div className="space-y-4">
          {/* Rule Evaluation */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-3">Rule Evaluation</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Select Claim to Evaluate</label>
                {loadingClaims ? (
                  <div className="w-full rounded border px-3 py-2 text-sm bg-gray-50">Loading claims...</div>
                ) : (
                  <select
                    value={selectedClaimId}
                    onChange={(e) => setSelectedClaimId(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a claim...</option>
                    {claims?.map((claim) => (
                      <option key={claim.id} value={claim.id}>
                        #{claim.id} - {claim.claimantName} ({claim.claimant}) - {claim.village}, {claim.district} 
                        [{claim.type}, {claim.area}ha, {claim.status}]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={simulationMode}
                    onChange={(e) => setSimulationMode(e.target.checked)}
                    className="mr-2"
                  />
                  Policy Simulation Mode
                </label>
              </div>

              <button
                onClick={evaluateRules}
                disabled={!selectedClaimId || evaluating || loadingClaims}
                className="w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {evaluating ? "Evaluating Rules..." : "Evaluate DSS Rules"}
              </button>
            </div>
          </div>

          {/* Policy Thresholds */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-3">
              Policy Thresholds
              {simulationMode && <span className="text-xs text-orange-600 ml-2">(Simulation Mode)</span>}
            </h3>
            {loadingThresholds ? (
              <div className="text-sm text-gray-500">Loading thresholds...</div>
            ) : (
              <div className="space-y-3">
                {[
                  { param: "water_index", label: "Water Index Threshold", min: 0, max: 1, step: 0.1 },
                  { param: "forest_cover", label: "Forest Cover Threshold", min: 0, max: 1, step: 0.1 },
                  { param: "max_area_ha", label: "Max Area (Ha)", min: 1, max: 10, step: 0.5 },
                  { param: "min_area_ha", label: "Min Area (Ha)", min: 0.1, max: 2, step: 0.1 },
                  { param: "population_density", label: "Population Density (/km²)", min: 50, max: 500, step: 10 },
                ].map(({ param, label, min, max, step }) => (
                  <div key={param}>
                    <label className="block text-sm font-medium mb-1">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={getThresholdValue(param)}
                        onChange={(e) => handleThresholdChange(param, Number(e.target.value))}
                        className="flex-1 rounded border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-500 w-16">
                        {thresholds?.find(t => t.parameter === param)?.unit || ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Statistics */}
        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-3">Recommendation Statistics</h3>
          {loadingRecs ? (
            <div className="text-sm text-gray-500">Loading statistics...</div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{recommendations.length}</div>
                  <div className="text-muted-foreground">Total Recommendations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {new Set(recommendations.map((r) => r.claimId)).size}
                  </div>
                  <div className="text-muted-foreground">Claims Covered</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Priority Distribution</h4>
                <div className="space-y-1">
                  {[1, 2, 3].map(priority => {
                    const count = recommendations.filter(r => r.priority === priority).length
                    const percentage = Math.round((count / recommendations.length) * 100)
                    return (
                      <div key={priority} className="flex justify-between text-xs">
                        <span>Priority {priority} ({priority === 1 ? 'High' : priority === 2 ? 'Medium' : 'Low'})</span>
                        <span>{count} ({percentage}%)</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Top Schemes</h4>
                {Object.entries(
                  recommendations.reduce(
                    (acc, r) => {
                      acc[r.scheme] = (acc[r.scheme] || 0) + 1
                      return acc
                    },
                    {} as Record<string, number>,
                  ),
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([scheme, count]) => (
                    <div key={scheme} className="flex justify-between text-xs">
                      <span className="truncate pr-2" title={scheme}>{scheme}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              No recommendations yet. Select a claim and evaluate rules to see statistics.
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Table */}
      <div className="overflow-x-auto rounded-lg border">
        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
          <div className="text-sm font-medium">DSS Recommendations</div>
          <div className="text-xs text-gray-500">
            {loadingRecs ? "Loading..." : recommendations ? `${recommendations.length} total` : "0 total"}
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <Th>ID</Th>
              <Th>Claim ID</Th>
              <Th>Priority</Th>
              <Th>Scheme</Th>
              <Th>Reason</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {loadingRecs && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Loading recommendations...
                </td>
              </tr>
            )}
            {!loadingRecs && (!recommendations || recommendations.length === 0) && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No recommendations found. Evaluate claims to generate recommendations.
                </td>
              </tr>
            )}
            {recommendations?.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <Td>{r.id}</Td>
                <Td>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    #{r.claimId}
                  </span>
                </Td>
                <Td>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      r.priority === 1
                        ? "bg-red-100 text-red-800"
                        : r.priority === 2
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    P{r.priority}
                  </span>
                </Td>
                <Td>
                  <div className="font-medium text-gray-900">{r.scheme}</div>
                </Td>
                <Td className="max-w-md">
                  <div className="truncate" title={r.reason}>
                    {r.reason}
                  </div>
                </Td>
                <Td className="text-xs text-gray-500">
                  {new Date(r.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="p-3 text-left font-medium text-gray-900 bg-gray-50">{children}</th>
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`p-3 ${className}`}>{children}</td>
}

function escapeCsv(s: string) {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}