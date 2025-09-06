"use client"

import type React from "react"

import { useEffect, useState } from "react"

type Claim = {
  id: number
  claimant: string
  claimantName: string
  village: string
  district: string
  type: string
  area: number
  status: string
  coords: any
  createdAt: string
}

type Asset = {
  id: number
  name: string
  owner?: string | null
  type: string
  coords: any
  village?: string
  source?: string
  createdAt: string
}

export default function AdminPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetch("/api/claims").then((r) => r.json()), fetch("/api/assets").then((r) => r.json())]).then(
      ([c, a]) => {
        setClaims(c)
        setAssets(a)
        setLoading(false)
      },
    )
  }, [])

  const addClaim = async (formData: FormData) => {
    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimant: formData.get("claimant"),
        claimantName: formData.get("claimantName") || formData.get("claimant"),
        village: formData.get("village"),
        district: formData.get("district") || formData.get("village"),
        type: formData.get("type"),
        area: Number(formData.get("area") || 0),
        status: formData.get("status"),
        coords: JSON.parse(String(formData.get("coords") || '{"type":"Point","coordinates":[77,20]}')),
      }),
    })
    if (res.ok) {
      const created = await res.json()
      setClaims((s) => [created, ...s])
    }
  }

  const addAsset = async (formData: FormData) => {
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        owner: formData.get("owner"),
        type: formData.get("type"),
        village: formData.get("village"),
        source: formData.get("source") || "Manual",
        coords: JSON.parse(String(formData.get("coords") || '{"type":"Point","coordinates":[77,20]}')),
      }),
    })
    if (res.ok) {
      const created = await res.json()
      setAssets((s) => [created, ...s])
    }
  }

  if (loading) return <div>Loading...</div>

  const aiAssets = assets.filter((a) => a.source === "Satellite")
  const manualAssets = assets.filter((a) => a.source !== "Satellite")

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Tools</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <FormCard title="Add Claim" onSubmit={addClaim}>
          <Field name="claimant" label="Claimant ID" required />
          <Field name="claimantName" label="Claimant Name" required />
          <Field name="village" label="Village" required />
          <Field name="district" label="District" required />
          <Select name="type" label="Type" options={["IFR", "CR", "CFR"]} />
          <Field name="area" label="Area (ha)" type="number" step="0.01" />
          <Select name="status" label="Status" options={["PENDING", "APPROVED", "REJECTED"]} />
          <Textarea name="coords" label="Coords (GeoJSON)" placeholder='{"type":"Point","coordinates":[77,20]}' />
        </FormCard>

        <FormCard title="Add Asset (Manual)" onSubmit={addAsset}>
          <Field name="name" label="Name" required />
          <Field name="owner" label="Owner" />
          <Field name="village" label="Village" />
          <Select name="type" label="Type" options={["water", "forest", "agriculture", "settlement"]} />
          <Select name="source" label="Source" options={["Manual", "Satellite"]} />
          <Textarea name="coords" label="Coords (GeoJSON)" placeholder='{"type":"Point","coordinates":[77,20]}' />
        </FormCard>
      </div>

      {aiAssets.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-3">AI-Detected Assets Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {["agriculture", "forest", "water", "settlement"].map((type) => {
              const count = aiAssets.filter((a) => a.type === type).length
              return (
                <div key={type} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{count}</div>
                  <div className="text-muted-foreground capitalize">{type}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <DataList
        title="Claims"
        rows={claims.map((c) => [c.id, c.claimant, c.claimantName, c.village, c.district, c.type, c.status, c.area])}
        headers={["ID", "Claimant ID", "Claimant Name", "Village", "District", "Type", "Status", "Area"]}
      />

      <DataList
        title={`Assets (${assets.length} total: ${manualAssets.length} manual, ${aiAssets.length} AI-detected)`}
        rows={assets.map((a) => [a.id, a.name, a.owner ?? "-", a.type, a.village ?? "-", a.source ?? "Manual"])}
        headers={["ID", "Name", "Owner", "Type", "Village", "Source"]}
      />
    </section>
  )
}

function FormCard({
  title,
  onSubmit,
  children,
}: {
  title: string
  onSubmit: (fd: FormData) => Promise<void>
  children: React.ReactNode
}) {
  return (
    <form
      className="rounded-lg border p-4"
      action={async (fd) => {
        await onSubmit(fd)
      }}
    >
      <div className="mb-3 text-sm font-medium">{title}</div>
      <div className="grid gap-3">{children}</div>
      <button type="submit" className="mt-3 rounded bg-blue-600 px-4 py-2 text-white">
        Save
      </button>
    </form>
  )
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { name, label, ...rest } = props
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input name={name} {...rest} className="rounded border px-3 py-2" />
    </label>
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const { name, label, ...rest } = props
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <textarea name={name} {...rest} className="min-h-24 rounded border px-3 py-2" />
    </label>
  )
}

function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select name={name} className="rounded border px-3 py-2">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}

function DataList({
  title,
  headers,
  rows,
}: {
  title: string
  headers: string[]
  rows: (string | number)[][]
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="p-3 text-sm font-medium">{title}</div>
      <table className="min-w-full text-sm">
        <thead className="bg-muted/30">
          <tr>
            {headers.map((h) => (
              <th key={h} className="p-3 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="border-t">
              {r.map((c, i) => (
                <td key={i} className="p-3">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
