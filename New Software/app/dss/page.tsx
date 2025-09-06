"use client"

import type React from "react"
import { useState } from "react"
import useSWR from "swr"

type Rec = {
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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DSSPage() {
  const { data: recommendations, mutate } = useSWR<Rec[]>("/api/dss", fetcher)
  const { data: thresholds, mutate: mutateThresholds } = useSWR<Threshold[]>("/api/dss/thresholds", fetcher)
  const { data: claims } = useSWR("/api/claims", fetcher)
  const [selectedClaimId, setSelectedClaimId] = useState("")
  const [evaluating, setEvaluating] = useState(false)
  const [simulationMode, setSimulationMode] = useState(false)
  const [tempThresholds, setTempThresholds] = useState<Record<string, number>>({})

  const exportCsv = () => {
    if (!recommendations) return
    const header = ["id", "claimId", "scheme", "reason", "priority", "createdAt"]
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
    a.download = "dss_recommendations.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const evaluateRules = async () => {
    if (!selectedClaimId) return

    setEvaluating(true)
    try {
      const response = await fetch("/api/dss/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: Number(selectedClaimId),
          thresholds: simulationMode ? tempThresholds : undefined,
        }),
      })

      if (response.ok) {
        mutate() // Refresh recommendations
      }
    } catch (error) {
      console.error("Evaluation failed:", error)
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
        mutateThresholds()
      }
    } catch (error) {
      console.error("Threshold update failed:", error)
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

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">DSS Rule Engine</h1>
          <p className="text-sm text-muted-foreground">Decision Support System with Policy Simulation</p>
        </div>
        <button onClick={exportCsv} className="rounded bg-blue-600 px-4 py-2 text-white">
          Export CSV
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-3">Rule Evaluation</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Select Claim to Evaluate</label>
                <select
                  value={selectedClaimId}
                  onChange={(e) => setSelectedClaimId(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                >
                  <option value="">Select a claim...</option>
                  {claims?.map((claim: any) => (
                    <option key={claim.id} value={claim.id}>
                      ID: {claim.id} - {claim.claimantName} ({claim.claimant}) - {claim.village}, {claim.district}
                    </option>
                  ))}
                </select>
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
                disabled={!selectedClaimId || evaluating}
                className="w-full rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {evaluating ? "Evaluating..." : "Evaluate DSS Rules"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-3">
              Policy Thresholds
              {simulationMode && <span className="text-xs text-orange-600 ml-2">(Simulation Mode)</span>}
            </h3>
            <div className="space-y-3">
              {[
                { param: "water_index", label: "Water Index Threshold", min: 0, max: 1, step: 0.1 },
                { param: "forest_cover", label: "Forest Cover Threshold", min: 0, max: 1, step: 0.1 },
                { param: "max_area_ha", label: "Max Area (Ha)", min: 1, max: 20, step: 0.5 },
                { param: "population_density", label: "Population Density", min: 50, max: 500, step: 10 },
              ].map(({ param, label, min, max, step }) => (
                <div key={param}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={getThresholdValue(param)}
                    onChange={(e) => handleThresholdChange(param, Number(e.target.value))}
                    className="w-full rounded border px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-3">Recommendation Statistics</h3>
          {recommendations && (
            <div className="space-y-3">
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
                      <span className="truncate">{scheme}</span>
                      <span>{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <div className="p-3 text-sm font-medium">DSS Recommendations</div>
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
            {!recommendations && (
              <tr>
                <td colSpan={6} className="p-3 text-center">
                  Loading...
                </td>
              </tr>
            )}
            {recommendations?.map((r) => (
              <tr key={r.id} className="border-t">
                <Td>{r.id}</Td>
                <Td>{r.claimId}</Td>
                <Td>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
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
                <Td>{r.scheme}</Td>
                <Td className="max-w-[480px]">{r.reason}</Td>
                <Td>{new Date(r.createdAt).toLocaleString()}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="p-3 text-left font-medium">{children}</th>
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
