"use client"

import { useState } from "react"
import useSWR from "swr"

type Claim = {
  id: number
  claimant: string
  village: string
  type: string
  area: number
  status: string
  coords: any
  nerData?: any
  createdAt: string
  user?: { email: string }
  dss?: Array<{ scheme: string; priority: number }>
}

type SearchResult = {
  claims: Claim[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

type ArchiveStats = {
  overview: {
    totalClaims: number
    grantedClaims: number
    pendingClaims: number
    rejectedClaims: number
    recentClaims: number
    ocrProcessedClaims: number
  }
  area: {
    totalArea: number
    averageArea: number
    maxArea: number
  }
  distribution: {
    byType: Array<{ type: string; count: number }>
    byVillage: Array<{ village: string; count: number }>
  }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ArchivePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    village: "",
    type: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    minArea: "",
    maxArea: "",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Build search URL with parameters
  const searchParams = new URLSearchParams()
  if (searchQuery) searchParams.set("q", searchQuery)
  if (filters.village) searchParams.set("village", filters.village)
  if (filters.type) searchParams.set("type", filters.type)
  if (filters.status) searchParams.set("status", filters.status)
  if (filters.dateFrom) searchParams.set("dateFrom", filters.dateFrom)
  if (filters.dateTo) searchParams.set("dateTo", filters.dateTo)
  if (filters.minArea) searchParams.set("minArea", filters.minArea)
  if (filters.maxArea) searchParams.set("maxArea", filters.maxArea)
  searchParams.set("page", currentPage.toString())

  const { data: searchResult, isLoading } = useSWR<SearchResult>(
    `/api/claims/search?${searchParams.toString()}`,
    fetcher,
  )

  const { data: stats } = useSWR<ArchiveStats>("/api/claims/stats", fetcher)

  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page on new search
  }

  const clearFilters = () => {
    setSearchQuery("")
    setFilters({
      village: "",
      type: "",
      status: "",
      dateFrom: "",
      dateTo: "",
      minArea: "",
      maxArea: "",
    })
    setCurrentPage(1)
  }

  const exportResults = () => {
    if (!searchResult?.claims) return

    const header = [
      "ID",
      "Claimant",
      "Village",
      "Type",
      "Area",
      "Status",
      "Created",
      "OCR Processed",
      "DSS Recommendations",
    ]
    const rows = searchResult.claims.map((claim) => [
      claim.id,
      claim.claimant,
      claim.village,
      claim.type,
      claim.area,
      claim.status,
      new Date(claim.createdAt).toLocaleDateString(),
      claim.nerData ? "Yes" : "No",
      claim.dss?.length || 0,
    ])

    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fra_archive_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between animate-slide-in-left">
        <div>
          <h1 className="text-4xl font-bold text-primary">FRA Digital Archive</h1>
          <p className="text-lg text-muted-foreground mt-2">Search and browse digitized FRA claims</p>
        </div>
        <button
          onClick={exportResults}
          disabled={!searchResult?.claims?.length}
          className="bg-gradient-orange-white text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl btn-enhanced"
        >
          Export Results
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 animate-slide-in-right">
          <StatCard label="Total Claims" value={stats.overview.totalClaims} />
          <StatCard label="Granted" value={stats.overview.grantedClaims} color="text-green-600" />
          <StatCard label="Pending" value={stats.overview.pendingClaims} color="text-yellow-600" />
          <StatCard label="Rejected" value={stats.overview.rejectedClaims} color="text-red-600" />
          <StatCard label="Recent (30d)" value={stats.overview.recentClaims} />
          <StatCard label="OCR Processed" value={stats.overview.ocrProcessedClaims} />
        </div>
      )}

      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search claimant, village, type, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded border px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch} className="rounded bg-blue-600 px-4 py-2 text-white text-sm">
            Search
          </button>
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="rounded border px-4 py-2 text-sm">
            Advanced
          </button>
        </div>

        {showAdvanced && (
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            <input
              type="text"
              placeholder="Village"
              value={filters.village}
              onChange={(e) => setFilters((prev) => ({ ...prev, village: e.target.value }))}
              className="rounded border px-3 py-2 text-sm"
            />
            <select
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
              className="rounded border px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="IFR">IFR</option>
              <option value="CR">CR</option>
              <option value="CFR">CFR</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="rounded border px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="Granted">Granted</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
            <input
              type="date"
              placeholder="Date From"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="rounded border px-3 py-2 text-sm"
            />
            <input
              type="date"
              placeholder="Date To"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="rounded border px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Min Area (ha)"
              value={filters.minArea}
              onChange={(e) => setFilters((prev) => ({ ...prev, minArea: e.target.value }))}
              className="rounded border px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Max Area (ha)"
              value={filters.maxArea}
              onChange={(e) => setFilters((prev) => ({ ...prev, maxArea: e.target.value }))}
              className="rounded border px-3 py-2 text-sm"
            />
            <button onClick={clearFilters} className="rounded border px-3 py-2 text-sm text-red-600 hover:bg-red-50">
              Clear All
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg border">
        <div className="p-3 flex items-center justify-between border-b">
          <span className="text-sm font-medium">
            {searchResult ? `${searchResult.pagination.totalCount} claims found` : "Loading..."}
          </span>
          {searchResult?.pagination && (
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={!searchResult.pagination.hasPrev}
                className="px-2 py-1 rounded border disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {searchResult.pagination.page} of {searchResult.pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!searchResult.pagination.hasNext}
                className="px-2 py-1 rounded border disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-3 text-left font-medium">ID</th>
                <th className="p-3 text-left font-medium">Claimant</th>
                <th className="p-3 text-left font-medium">Village</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium">Area</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Created</th>
                <th className="p-3 text-left font-medium">Features</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    Loading claims...
                  </td>
                </tr>
              )}
              {searchResult?.claims?.map((claim) => (
                <tr key={claim.id} className="border-t hover:bg-muted/20">
                  <td className="p-3">{claim.id}</td>
                  <td className="p-3 font-medium">{claim.claimant}</td>
                  <td className="p-3">{claim.village}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">{claim.type}</span>
                  </td>
                  <td className="p-3">{claim.area} ha</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        claim.status === "Granted"
                          ? "bg-green-100 text-green-800"
                          : claim.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {claim.status}
                    </span>
                  </td>
                  <td className="p-3">{new Date(claim.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {claim.nerData && (
                        <span className="px-1 py-0.5 rounded text-xs bg-purple-100 text-purple-800">OCR</span>
                      )}
                      {claim.dss && claim.dss.length > 0 && (
                        <span className="px-1 py-0.5 rounded text-xs bg-orange-100 text-orange-800">
                          DSS({claim.dss.length})
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {searchResult?.claims?.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    No claims found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {stats && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-3">Claims by Type</h3>
            <div className="space-y-2">
              {stats.distribution.byType.map((item) => (
                <div key={item.type} className="flex justify-between text-sm">
                  <span>{item.type}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-3">Top Villages</h3>
            <div className="space-y-2">
              {stats.distribution.byVillage.slice(0, 5).map((item) => (
                <div key={item.village} className="flex justify-between text-sm">
                  <span className="truncate">{item.village}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function StatCard({ label, value, color = "text-blue-600" }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
