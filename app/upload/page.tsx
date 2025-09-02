"use client"

import { useState } from "react"

type OcrResult = {
  text: string
  fields: {
    claimant?: string
    village?: string
    area?: number
    type?: string
  }
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OcrResult | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const onUpload = async () => {
    if (!file) return
    setLoading(true)
    setStatus(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = (await res.json()) as OcrResult
      setResult(json)
    } catch (e: any) {
      setStatus(e?.message || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  const saveClaim = async () => {
    if (!result) return
    setStatus("Saving claim...")
    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimant: result.fields.claimant || "Unknown",
        village: result.fields.village || "Unknown",
        type: result.fields.type || "IFR",
        area: result.fields.area || 0,
        status: "Pending",
        coords: { type: "Point", coordinates: [77.0, 20.0] },
      }),
    })
    if (!res.ok) {
      setStatus("Failed to save claim")
      return
    }
    setStatus("Saved claim successfully")
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Upload Documents</h1>

      <div className="rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          <button
            onClick={onUpload}
            disabled={!file || loading}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Processing..." : "OCR Upload"}
          </button>
        </div>
        {status && <p className="mt-2 text-sm text-muted-foreground">{status}</p>}
      </div>

      {result && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="mb-2 text-sm font-medium">Extracted Fields</div>
            <div className="grid gap-2 text-sm">
              <div>Claimant: {result.fields.claimant || "-"}</div>
              <div>Village: {result.fields.village || "-"}</div>
              <div>Type: {result.fields.type || "-"}</div>
              <div>Area: {result.fields.area ?? "-"}</div>
            </div>
            <button onClick={saveClaim} className="mt-3 rounded border px-3 py-2 text-sm">
              Save as Claim
            </button>
          </div>
          <div className="rounded-lg border p-4">
            <div className="mb-2 text-sm font-medium">Raw Text</div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-sm">{result.text}</pre>
          </div>
        </div>
      )}
    </section>
  )
}
