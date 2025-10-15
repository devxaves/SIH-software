"use client"

import type React from "react"

import { useAuth } from "@clerk/nextjs"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DashboardAnalytics {
  summary: {
    villagesOnboarded: number
    scCoverage: number
    highPriorityProjects: number
    liveResourceAlerts: number
  }
  adoptionTimeline: Array<{ month: string; onboarded: number; liveProjects: number }>
  gapBreakdown: Array<{ category: string; critical: number; moderate: number; low: number }>
  priorityVillages: Array<{
    id: string
    name: string
    district: string
    state: string
    priorityScore: number
    scCoverage: number
    readiness: string
    lastSurvey: string
    riskLevel: "High" | "Medium" | "Low"
    topGaps: string[]
  }>
  resourceAlerts: Array<{ id: string; village: string; message: string; severity: "critical" | "warning" | "info"; etaHours: number }>
  aiSignals: {
    delayProbability: number
    riskDrivers: Array<{ label: string; value: number }>
    fundingExposure: number
    confidence: number
  }
  blockchainLedger: Array<{ txId: string; project: string; amount: number; status: string; timestamp: string; hash: string }>
  communitySentiment: {
    engagementRate: number
    resolvedGrievances: number
    openFeedback: number
    storiesPublished: number
    lastSync: string
  }
  dataIntegrations: Array<{ source: string; freshness: string; coverage: number }>
}

export default function DashboardPage() {
  const { isSignedIn } = useAuth()
  const {
    data: analytics,
    error,
    isLoading,
  } = useSWR<DashboardAnalytics>(isSignedIn ? "/api/dashboard/analytics" : null, fetcher, { refreshInterval: 45000 })

  if (!isSignedIn) return <div className="p-6 text-sm text-muted-foreground">Sign in to access the BharatGram Intelligence Hub.</div>
  if (isLoading) return <div className="p-6">Loading intelligence feeds...</div>
  if (error) return <div className="p-6 text-red-600">Unable to load analytics. Please retry in a moment.</div>
  if (!analytics) return <div className="p-6">No intelligence data available yet.</div>

  return (
    <section className="space-y-6 p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Village Intelligence Hub</h1>
          <p className="text-sm text-muted-foreground">
            AI-driven diagnostics across infrastructure, inclusion, and accountability for SC-majority settlements.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">Last refreshed {new Date().toLocaleTimeString()}</div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Villages onboarded" value={analytics.summary.villagesOnboarded} hint="Live profiles" color="emerald" />
        <KpiCard label="SC household coverage" value={`${analytics.summary.scCoverage}%`} hint="Across onboarded villages" color="sky" />
        <KpiCard label="High-priority projects" value={analytics.summary.highPriorityProjects} hint="Flagged this week" color="amber" />
        <KpiCard label="Resource alerts" value={analytics.summary.liveResourceAlerts} hint="Active bottleneck alerts" color="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tile title="Adoption velocity">
          <TimelineChart timeline={analytics.adoptionTimeline} />
        </Tile>
        <Tile title="Gap breakdown by theme">
          <GapStack data={analytics.gapBreakdown} />
        </Tile>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Tile title="Priority villages">
          <PriorityVillageList villages={analytics.priorityVillages} />
        </Tile>
        <Tile title="Resource automation alerts">
          <ResourceAlertList alerts={analytics.resourceAlerts} />
        </Tile>
        <Tile title="AI risk & funding signals">
          <AiSignalsCard signals={analytics.aiSignals} />
        </Tile>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tile title="Community sentiment & transparency">
          <CommunityCard sentiment={analytics.communitySentiment} />
        </Tile>
        <Tile title="Open data integrations">
          <DataIntegrationsList sources={analytics.dataIntegrations} />
        </Tile>
      </div>

      <Tile title="Blockchain-backed funding ledger">
        <LedgerTable ledger={analytics.blockchainLedger} />
      </Tile>
    </section>
  )
}

function KpiCard({ label, value, hint, color }: { label: string; value: number | string; hint: string; color: "emerald" | "sky" | "amber" | "rose" }) {
  const theme = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
  }[color]

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${theme}`}>
      <div className="text-xs uppercase tracking-wide text-slate-600">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-slate-600">{hint}</div>
    </div>
  )
}

function Tile({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  )
}

function TimelineChart({ timeline }: { timeline: DashboardAnalytics["adoptionTimeline"] }) {
  const max = Math.max(1, ...timeline.map((item) => item.onboarded))
  return (
    <div className="flex h-36 items-end gap-3">
      {timeline.map((item) => (
        <div key={item.month} className="flex-1">
          <div
            className="mx-auto w-full rounded-t bg-gradient-to-t from-emerald-400 to-sky-500"
            style={{ height: `${(item.onboarded / max) * 100}%` }}
          >
            <span className="sr-only">{item.onboarded} villages onboarded in {item.month}</span>
          </div>
          <div className="mt-2 text-center text-xs text-slate-600">{item.month}</div>
          <div className="text-center text-[11px] text-muted-foreground">{item.liveProjects} live projects</div>
        </div>
      ))}
    </div>
  )
}

function GapStack({ data }: { data: DashboardAnalytics["gapBreakdown"] }) {
  return (
    <div className="space-y-4">
      {data.map((gap) => {
        const total = gap.critical + gap.moderate + gap.low
        return (
          <div key={gap.category}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-800">{gap.category}</span>
              <span className="text-muted-foreground">{total} gaps</span>
            </div>
            <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="bg-rose-500"
                style={{ width: `${(gap.critical / Math.max(1, total)) * 100}%` }}
                title={`${gap.critical} critical gaps`}
              />
              <div
                className="bg-amber-400"
                style={{ width: `${(gap.moderate / Math.max(1, total)) * 100}%` }}
                title={`${gap.moderate} moderate gaps`}
              />
              <div
                className="bg-emerald-400"
                style={{ width: `${(gap.low / Math.max(1, total)) * 100}%` }}
                title={`${gap.low} low gaps`}
              />
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Critical {gap.critical} · Moderate {gap.moderate} · Stabilized {gap.low}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PriorityVillageList({ villages }: { villages: DashboardAnalytics["priorityVillages"] }) {
  return (
    <div className="space-y-4">
      {villages.map((village) => (
        <div key={village.id} className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-emerald-800">{village.name}</div>
              <div className="text-xs text-emerald-700">{village.district}, {village.state}</div>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 shadow">
              Priority {village.priorityScore}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-emerald-800">
            <span>SC coverage {village.scCoverage}%</span>
            <span>Readiness {village.readiness}</span>
            <span>Last survey {village.lastSurvey}</span>
            <span>Risk {village.riskLevel}</span>
          </div>
          <div className="mt-2 text-xs text-emerald-900">
            Top gaps: {village.topGaps.join(", ")}
          </div>
        </div>
      ))}
    </div>
  )
}

function ResourceAlertList({ alerts }: { alerts: DashboardAnalytics["resourceAlerts"] }) {
  if (alerts.length === 0) {
    return <div className="text-sm text-muted-foreground">All operations nominal.</div>
  }

  const colors = {
    critical: "border-rose-200 bg-rose-50 text-rose-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div key={alert.id} className={`rounded-lg border p-3 text-sm shadow-sm ${colors[alert.severity]}`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{alert.village}</span>
            <span className="text-xs">Resolve in ~{alert.etaHours}h</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed">{alert.message}</p>
        </div>
      ))}
    </div>
  )
}

function AiSignalsCard({ signals }: { signals: DashboardAnalytics["aiSignals"] }) {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <div className="text-xs uppercase text-muted-foreground">Probable project delays</div>
        <div className="mt-1 flex items-baseline gap-2 text-2xl font-semibold text-rose-600">
          {signals.delayProbability}%
          <span className="text-xs font-normal text-slate-500">next 30 days</span>
        </div>
      </div>
      <div>
        <div className="text-xs uppercase text-muted-foreground">Top risk drivers</div>
        <div className="mt-2 space-y-2">
          {signals.riskDrivers.map((driver) => (
            <div key={driver.label}>
              <div className="flex items-center justify-between text-xs">
                <span>{driver.label}</span>
                <span>{driver.value}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-rose-500" style={{ width: `${driver.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
        <div>
          <div className="text-muted-foreground">Funding exposure</div>
          <div className="text-base font-semibold text-slate-900">₹{signals.fundingExposure.toLocaleString()} Cr</div>
        </div>
        <div>
          <div className="text-muted-foreground">Model confidence</div>
          <div className="text-base font-semibold text-slate-900">{signals.confidence}%</div>
        </div>
      </div>
    </div>
  )
}

function CommunityCard({ sentiment }: { sentiment: DashboardAnalytics["communitySentiment"] }) {
  return (
    <div className="grid gap-4 text-sm text-slate-700 md:grid-cols-2">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
        <div className="text-xs uppercase text-emerald-700">Engagement rate</div>
        <div className="mt-2 text-2xl font-semibold text-emerald-900">{sentiment.engagementRate}%</div>
        <div className="text-xs text-emerald-700">Participatory inputs from onboarded villages</div>
      </div>
      <div className="rounded-lg border border-sky-200 bg-sky-50/80 p-4">
        <div className="text-xs uppercase text-sky-700">Grievances resolved</div>
        <div className="mt-2 text-2xl font-semibold text-sky-900">{sentiment.resolvedGrievances}</div>
        <div className="text-xs text-sky-700">Last sync {sentiment.lastSync}</div>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="text-xs uppercase text-amber-700">Active feedback items</div>
        <div className="mt-2 text-2xl font-semibold text-amber-900">{sentiment.openFeedback}</div>
        <div className="text-xs text-amber-700">Awaiting officer action</div>
      </div>
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
        <div className="text-xs uppercase text-rose-700">Stories published</div>
        <div className="mt-2 text-2xl font-semibold text-rose-900">{sentiment.storiesPublished}</div>
        <div className="text-xs text-rose-700">Celebrating impact transformations</div>
      </div>
    </div>
  )
}

function DataIntegrationsList({ sources }: { sources: DashboardAnalytics["dataIntegrations"] }) {
  return (
    <div className="space-y-3 text-sm text-slate-700">
      {sources.map((source) => (
        <div key={source.source} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <div className="font-medium text-slate-900">{source.source}</div>
            <div className="text-xs text-muted-foreground">Freshness: {source.freshness}</div>
          </div>
          <div className="text-xs text-slate-600">Coverage {source.coverage}%</div>
        </div>
      ))}
    </div>
  )
}

function LedgerTable({ ledger }: { ledger: DashboardAnalytics["blockchainLedger"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            <th className="p-3 text-left">Tx ID</th>
            <th className="p-3 text-left">Project</th>
            <th className="p-3 text-left">Amount (₹ L)</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Timestamp</th>
            <th className="p-3 text-left">Ledger hash</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map((entry) => (
            <tr key={entry.txId} className="border-b last:border-0">
              <td className="p-3 font-mono text-xs">{entry.txId}</td>
              <td className="p-3">{entry.project}</td>
              <td className="p-3">{entry.amount.toLocaleString()}</td>
              <td className="p-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    entry.status === "Cleared"
                      ? "bg-emerald-100 text-emerald-700"
                      : entry.status === "Pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {entry.status}
                </span>
              </td>
              <td className="p-3 text-xs text-muted-foreground">{entry.timestamp}</td>
              <td className="p-3 font-mono text-[11px] text-slate-500">{entry.hash}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
