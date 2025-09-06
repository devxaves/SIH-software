import type React from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const [claimsCount, assetsCount, grantedCount, pendingCount, totalArea] = await Promise.all([
    prisma.claim.count(),
    prisma.asset.count(),
    prisma.claim.count({ where: { status: "Granted" } }),
    prisma.claim.count({ where: { status: "Pending" } }),
    prisma.claim.aggregate({ _sum: { area: true } }),
  ])

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Claims" value={claimsCount} />
        <KpiCard label="Assets" value={assetsCount} />
        <KpiCard label="Granted" value={grantedCount} />
        <KpiCard label="Pending" value={pendingCount} />
        <KpiCard label="Total Area (ha)" value={Number(totalArea._sum.area ?? 0).toFixed(2)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Tile title="Claims by Status">
          <BarLike
            data={[
              { label: "Granted", v: grantedCount },
              { label: "Pending", v: pendingCount },
            ]}
          />
        </Tile>
        <Tile title="Claims vs Assets">
          <BarLike
            data={[
              { label: "Claims", v: claimsCount },
              { label: "Assets", v: assetsCount },
            ]}
          />
        </Tile>
      </div>
    </section>
  )
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  )
}

function Tile({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 text-sm font-medium">{title}</div>
      {children}
    </div>
  )
}

// Tailwind-only simple "chart" bars
function BarLike({ data }: { data: { label: string; v: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.v))
  return (
    <div className="flex items-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex flex-col items-center gap-2">
          <div
            className="w-8 rounded bg-blue-600"
            style={{ height: `${(d.v / max) * 120}px` }}
            aria-label={`${d.label} ${d.v}`}
          />
          <div className="text-xs">{d.label}</div>
        </div>
      ))}
    </div>
  )
}
