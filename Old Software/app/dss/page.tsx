"use client"

import type React from "react"

import useSWR from "swr"

type Rec = {
  id: number
  claimId: number
  scheme: string
  reason: string
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DSSPage() {
  const { data, isLoading } = useSWR<Rec[]>("/api/dss", fetcher)

  const exportCsv = () => {
    if (!data) return
    const header = ["id", "claimId", "scheme", "reason", "createdAt"]
    const rows = data.map((r) => [r.id, r.claimId, escapeCsv(r.scheme), escapeCsv(r.reason), r.createdAt])
    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "dss_recommendations.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">DSS Recommendations</h1>
        <button onClick={exportCsv} className="rounded bg-blue-600 px-4 py-2 text-white">
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <Th>ID</Th>
              <Th>Claim ID</Th>
              <Th>Scheme</Th>
              <Th>Reason</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-3 text-center">
                  Loading...
                </td>
              </tr>
            )}
            {data?.map((r) => (
              <tr key={r.id} className="border-t">
                <Td>{r.id}</Td>
                <Td>{r.claimId}</Td>
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
