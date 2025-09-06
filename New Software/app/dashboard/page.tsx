"use client"
import type React from "react"

import { useAuth } from "@clerk/nextjs"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DashboardAnalytics {
  overview: {
    totalClaims: number
    pendingClaims: number
    approvedClaims: number
    rejectedClaims: number
    totalAssets: number
    approvalRate: number
    pendingRate: number
  }
  recentClaims: Array<{
    id: string
    claimantName: string
    status: string
    createdAt: string
    district: string
  }>
  claimsByDistrict: Array<{ district: string; _count: { id: number } }>
  claimsByMonth: Array<{ month: string; count: number; status: string }>
  assetsByType: Array<{ type: string; _count: { id: number } }>
}

export default function DashboardPage() {
  const { isSignedIn } = useAuth()
  const {
    data: analytics,
    error,
    isLoading,
  } = useSWR<DashboardAnalytics>(isSignedIn ? "/api/dashboard/analytics" : null, fetcher, { refreshInterval: 30000 })

  if (!isSignedIn) return <div>Please sign in to access dashboard</div>
  if (isLoading) return <div className="p-6">Loading dashboard...</div>
  if (error) return <div className="p-6 text-red-600">Error loading dashboard data</div>
  if (!analytics) return <div className="p-6">No data available</div>

  return (
    <section className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">FRA Atlas Dashboard</h1>
        <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Claims"
          value={analytics.overview.totalClaims}
          trend={`${analytics.overview.approvalRate.toFixed(1)}% approved`}
          color="blue"
        />
        <KpiCard
          label="Pending Review"
          value={analytics.overview.pendingClaims}
          trend={`${analytics.overview.pendingRate.toFixed(1)}% of total`}
          color="yellow"
        />
        <KpiCard
          label="Approved Claims"
          value={analytics.overview.approvedClaims}
          trend="Processing complete"
          color="green"
        />
        <KpiCard
          label="Forest Assets"
          value={analytics.overview.totalAssets}
          trend="Digitally mapped"
          color="emerald"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tile title="Claims by District (Top 10)">
          <BarChart
            data={analytics.claimsByDistrict.slice(0, 10).map((d) => ({
              label: d.district,
              value: d._count.id,
            }))}
            color="blue"
          />
        </Tile>

        <Tile title="Asset Distribution by Type">
          <PieChart
            data={analytics.assetsByType.map((d) => ({
              label: d.type,
              value: d._count.id,
            }))}
          />
        </Tile>

        <Tile title="Monthly Claims Trend">
          <LineChart data={analytics.claimsByMonth} />
        </Tile>

        <Tile title="Recent Claims Activity">
          <RecentClaimsList claims={analytics.recentClaims} />
        </Tile>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ProgressCard
          title="Digitization Progress"
          current={analytics.overview.totalClaims}
          target={10000}
          unit="claims"
        />
        <ProgressCard title="Asset Mapping" current={analytics.overview.totalAssets} target={5000} unit="assets" />
        <ProgressCard title="Approval Rate" current={analytics.overview.approvalRate} target={85} unit="%" />
      </div>
    </section>
  )
}

function KpiCard({
  label,
  value,
  trend,
  color = "blue",
}: {
  label: string
  value: number | string
  trend?: string
  color?: string
}) {
  const colorClasses = {
    blue: "border-blue-200 bg-blue-50",
    yellow: "border-yellow-200 bg-yellow-50",
    green: "border-green-200 bg-green-50",
    emerald: "border-emerald-200 bg-emerald-50",
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {trend && <div className="mt-1 text-xs text-muted-foreground">{trend}</div>}
    </div>
  )
}

function Tile({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function BarChart({
  data,
  color = "blue",
}: {
  data: Array<{ label: string; value: number }>
  color?: string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-20 text-sm truncate">{d.label}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
            <div className={`h-4 rounded-full bg-${color}-600`} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <div className="w-12 text-sm text-right">{d.value}</div>
        </div>
      ))}
    </div>
  )
}

function PieChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-purple-500"]

  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const percentage = ((d.value / total) * 100).toFixed(1)
        return (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded ${colors[i % colors.length]}`} />
            <div className="flex-1 text-sm">{d.label}</div>
            <div className="text-sm font-medium">{percentage}%</div>
          </div>
        )
      })}
    </div>
  )
}

function LineChart({ data }: { data: Array<{ month: string; count: number; status: string }> }) {
  // Group by month and sum counts
  const monthlyData = data.reduce(
    (acc, curr) => {
      const month = new Date(curr.month).toLocaleDateString("en-US", { month: "short" })
      acc[month] = (acc[month] || 0) + curr.count
      return acc
    },
    {} as Record<string, number>,
  )

  const chartData = Object.entries(monthlyData).map(([month, count]) => ({ month, count }))
  const max = Math.max(1, ...chartData.map((d) => d.count))

  return (
    <div className="flex items-end gap-2 h-32">
      {chartData.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-1">
          <div
            className="w-full bg-blue-600 rounded-t"
            style={{ height: `${(d.count / max) * 100}%` }}
            title={`${d.month}: ${d.count} claims`}
          />
          <div className="text-xs">{d.month}</div>
        </div>
      ))}
    </div>
  )
}

function RecentClaimsList({ claims }: { claims: DashboardAnalytics["recentClaims"] }) {
  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  }

  return (
    <div className="space-y-3">
      {claims.map((claim) => (
        <div key={claim.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <div>
            <div className="font-medium text-sm">{claim.claimantName}</div>
            <div className="text-xs text-muted-foreground">{claim.district}</div>
          </div>
          <div className="text-right">
            <span
              className={`px-2 py-1 rounded-full text-xs ${statusColors[claim.status as keyof typeof statusColors]}`}
            >
              {claim.status}
            </span>
            <div className="text-xs text-muted-foreground mt-1">{new Date(claim.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProgressCard({
  title,
  current,
  target,
  unit,
}: {
  title: string
  current: number
  target: number
  unit: string
}) {
  const percentage = Math.min(100, (current / target) * 100)

  return (
    <div className="rounded-lg border p-4 bg-white">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold">{current}</span>
        <span className="text-sm text-muted-foreground">
          / {target} {unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}% complete</div>
    </div>
  )
}
