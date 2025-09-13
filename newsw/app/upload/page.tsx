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
    setStatus("Processing document with OCR + NER...")
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
        status: result.fields.status || "Pending",
        coords: { type: "Point", coordinates: [77.0, 20.0] },
        nerData: result.nerEntities,
      }),
    })
    if (!res.ok) {
      setStatus("Failed to save claim")
      return
    }
    setStatus("Saved claim successfully")
  }

  return (
    <section className="space-y-8 animate-fade-in">
      <div className="text-center animate-slide-in-left">
        <h1 className="text-4xl font-bold text-primary mb-4">Upload Documents</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload FRA documents for AI-powered OCR + NER entity extraction with 95% accuracy
        </p>
      </div>

      <div className="rounded-xl border p-8 bg-white/90 backdrop-blur-sm shadow-lg card-enhanced animate-slide-in-right">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Document (PDF or Image)
            </label>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
            />
          </div>
          <button
            onClick={onUpload}
            disabled={!file || loading}
            className="bg-gradient-orange-white text-white px-8 py-4 rounded-xl font-semibold disabled:opacity-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl btn-enhanced animate-glow"
          >
            {loading ? "Processing..." : "Start OCR + NER"}
          </button>
        </div>
        {status && (
          <p className="mt-4 text-center text-sm bg-primary/10 text-primary px-4 py-2 rounded-lg animate-fade-in">
            {status}
          </p>
        )}
      </div>

      {result && (
        <div className="grid gap-8 lg:grid-cols-3 animate-fade-in">
          <div className="rounded-xl border p-6 bg-white/90 backdrop-blur-sm shadow-lg card-enhanced">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-bold text-primary">Extracted Fields</span>
              {result.fields.confidence && (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                  {Math.round(result.fields.confidence * 100)}% confidence
                </span>
              )}
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="font-medium">Claimant:</span>
                <span className="text-gray-700">{result.fields.claimant || "-"}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="font-medium">Village:</span>
                <span className="text-gray-700">{result.fields.village || "-"}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="font-medium">Type:</span>
                <span className="text-gray-700">{result.fields.type || "-"}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="font-medium">Area:</span>
                <span className="text-gray-700">{result.fields.area ?? "-"}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="font-medium">Status:</span>
                <span className="text-gray-700">{result.fields.status || "-"}</span>
              </div>
              {result.fields.coordinates && (
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium">Coordinates:</span>
                  <span className="text-gray-700">{result.fields.coordinates}</span>
                </div>
              )}
            </div>
            <button 
              onClick={saveClaim} 
              className="mt-6 w-full bg-gradient-green-white text-primary px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 btn-enhanced"
            >
              Save as Claim
            </button>
          </div>

          {result.nerEntities && (
            <div className="rounded-xl border p-6 bg-white/90 backdrop-blur-sm shadow-lg card-enhanced">
              <div className="mb-4 text-lg font-bold text-secondary">NER Entities</div>
              <div className="space-y-4 text-sm">
                {result.nerEntities.persons?.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <span className="font-semibold text-blue-800">Persons:</span>
                    <div className="mt-1 text-blue-700">{result.nerEntities.persons.join(", ")}</div>
                  </div>
                )}
                {result.nerEntities.locations?.length > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <span className="font-semibold text-green-800">Locations:</span>
                    <div className="mt-1 text-green-700">{result.nerEntities.locations.join(", ")}</div>
                  </div>
                )}
                {result.nerEntities.organizations?.length > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <span className="font-semibold text-purple-800">Organizations:</span>
                    <div className="mt-1 text-purple-700">{result.nerEntities.organizations.join(", ")}</div>
                  </div>
                )}
                {result.nerEntities.claimTypes?.length > 0 && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <span className="font-semibold text-orange-800">Claim Types:</span>
                    <div className="mt-1 text-orange-700">{result.nerEntities.claimTypes.join(", ")}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border p-6 bg-white/90 backdrop-blur-sm shadow-lg card-enhanced">
            <div className="mb-4 text-lg font-bold text-primary">Raw Text</div>
            <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{result.text}</pre>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
