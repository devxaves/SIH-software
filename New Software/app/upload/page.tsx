"use client"

import { useState } from "react"

type OcrResult = {
  text: string
  fields: {
    claimant?: string
    village?: string
    area?: number
    type?: string
    status?: string
    coordinates?: string
    confidence?: number
  }
  nerEntities?: any
  documentId?: number
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OcrResult | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const onUpload = async () => {
    if (!file) return
    setLoading(true)
  setStatus("Processing document through AI ingestion pipeline...")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = (await res.json()) as OcrResult
      setResult(json)
      setStatus(null)
    } catch (e: any) {
      setStatus(e?.message || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  const saveProject = async () => {
    if (!result) return
  setStatus("Committing project profile...")
    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimant: result.fields.claimant || "Unknown",
        village: result.fields.village || "Unknown",
        type: result.fields.type || "IFR",
        area: result.fields.area || 0,
        status: result.fields.status || "Pending",
        coords: { type: "Point", coordinates: [77.0, 20.0] },
        nerData: result.nerEntities,
      }),
    })
    if (!res.ok) {
      setStatus("Failed to save project profile")
      return
    }
    setStatus("Project profile created successfully")
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Data Ops Workbench</h1>
        <p className="text-sm text-muted-foreground">
          Onboard village dossiers, survey scans, or sanction orders to auto-extract project metadata for Smart Adarsh Gram workflows.
        </p>
      </div>

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
            {loading ? "Processing..." : "Ingest"}
          </button>
        </div>
        {status && <p className="mt-2 text-sm text-muted-foreground">{status}</p>}
      </div>

      {result && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Extracted fields</span>
              {result.fields.confidence && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(result.fields.confidence * 100)}% confidence
                </span>
              )}
            </div>
            <div className="grid gap-2 text-sm">
              <div>Lead household / institution: {result.fields.claimant || "-"}</div>
              <div>Village: {result.fields.village || "-"}</div>
              <div>Project type: {result.fields.type || "-"}</div>
              <div>Coverage area (ha): {result.fields.area ?? "-"}</div>
              <div>Status: {result.fields.status || "-"}</div>
              {result.fields.coordinates && <div>Geo-coordinates: {result.fields.coordinates}</div>}
            </div>
            <button onClick={saveProject} className="mt-3 rounded border px-3 py-2 text-sm">
              Add to project registry
            </button>
          </div>

          {result.nerEntities && (
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-medium">Entity spotlight</div>
              <div className="space-y-2 text-xs">
                {result.nerEntities.persons?.length > 0 && (
                  <div>
                    <span className="font-medium">Persons:</span> {result.nerEntities.persons.join(", ")}
                  </div>
                )}
                {result.nerEntities.locations?.length > 0 && (
                  <div>
                    <span className="font-medium">Locations:</span> {result.nerEntities.locations.join(", ")}
                  </div>
                )}
                {result.nerEntities.organizations?.length > 0 && (
                  <div>
                    <span className="font-medium">Organizations:</span> {result.nerEntities.organizations.join(", ")}
                  </div>
                )}
                {result.nerEntities.claimTypes?.length > 0 && (
                  <div>
                    <span className="font-medium">Claim Types:</span> {result.nerEntities.claimTypes.join(", ")}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border p-4">
            <div className="mb-2 text-sm font-medium">Raw transcript</div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs">{result.text}</pre>
          </div>
        </div>
      )}
    </section>
  )
}
