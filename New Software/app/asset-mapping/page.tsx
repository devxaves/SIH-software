"use client"

import { useState } from "react"
import type { SatelliteImageAnalysis } from "@/lib/ai-classification"

export default function AssetMappingPage() {
  const [file, setFile] = useState<File | null>(null)
  const [village, setVillage] = useState("")
  const [bounds, setBounds] = useState("77.0,20.0,77.1,20.1")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SatelliteImageAnalysis | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const processImage = async () => {
    if (!file) return

    setLoading(true)
    setStatus("Processing satellite image with AI...")

    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString("base64")

      // Parse bounds
      const boundsArray = bounds.split(",").map(Number)
      if (boundsArray.length !== 4) {
        throw new Error("Invalid bounds format. Use: minLng,minLat,maxLng,maxLat")
      }

      const response = await fetch("/api/ai-classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: base64,
          bounds: boundsArray,
          village: village || "Unknown",
          model: "random-forest-v2",
        }),
      })

      if (!response.ok) {
        throw new Error("Classification failed")
      }

      const data = await response.json()
      setResult(data.analysis)
      setStatus(`Classified ${data.totalDetected} features, saved ${data.savedAssets} high-confidence assets`)
    } catch (error: any) {
      setStatus(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Asset Mapping</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload satellite imagery for AI-powered land-use classification
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="font-medium">Upload Satellite Image</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Satellite Image (GeoTIFF/PNG/JPG)</label>
              <input
                type="file"
                accept="image/*,.tiff,.tif"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Village Name</label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Enter village name"
                className="block w-full text-sm border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Geographic Bounds (minLng,minLat,maxLng,maxLat)</label>
              <input
                type="text"
                value={bounds}
                onChange={(e) => setBounds(e.target.value)}
                placeholder="77.0,20.0,77.1,20.1"
                className="block w-full text-sm border rounded px-3 py-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Define the geographic area covered by the satellite image
              </p>
            </div>

            <button
              onClick={processImage}
              disabled={!file || loading}
              className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Processing..." : "Classify Land Use"}
            </button>

            {status && <div className="text-sm p-3 rounded bg-muted">{status}</div>}
          </div>

          {result && (
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-3">Classification Summary</h3>
              <div className="space-y-2 text-sm">
                <div>Total Area: {result.totalArea.toFixed(2)} km²</div>
                <div>Processing Time: {result.processingTime}s</div>
                <div>Features Detected: {result.classifications.length}</div>
                <div>Resolution: {result.imageMetadata.resolution}m/pixel</div>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-3">Detected Assets</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {result.classifications.map((classification, index) => (
                  <div key={index} className="border rounded p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          classification.type === "agriculture"
                            ? "bg-yellow-100 text-yellow-800"
                            : classification.type === "forest"
                              ? "bg-green-100 text-green-800"
                              : classification.type === "water"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {classification.type}
                      </span>
                      <span className="text-muted-foreground">{Math.round(classification.confidence * 100)}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Area: {classification.area.toFixed(0)} m²</div>
                      <div>
                        Coords: {classification.coordinates[1].toFixed(4)}, {classification.coordinates[0].toFixed(4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-3">Land Use Distribution</h3>
              <div className="space-y-2">
                {["agriculture", "forest", "water", "settlement"].map((type) => {
                  const count = result.classifications.filter((c) => c.type === type).length
                  const percentage =
                    result.classifications.length > 0 ? ((count / result.classifications.length) * 100).toFixed(1) : "0"

                  return (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span>
                        {count} ({percentage}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
