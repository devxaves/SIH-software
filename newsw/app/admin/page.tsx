"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import maplibregl, { type Map as MaplibreMap } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

// Import geocoder
// @ts-ignore
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder'
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css'

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

// Geocoding function using Nominatim 
const geocodingApi = {
  forwardGeocode: async (config: any) => {
    const features = []
    try {
      const request = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        config.query
      )}&format=geojson&limit=5&countrycodes=in&addressdetails=1`
      
      const response = await fetch(request)
      const geojson = await response.json()
      
      for (const feature of geojson.features) {
        const center = [
          feature.geometry.coordinates[0],
          feature.geometry.coordinates[1]
        ]
        const point = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: center
          },
          place_name: feature.properties.display_name,
          properties: feature.properties,
          text: feature.properties.display_name,
          place_type: ['place'],
          center
        }
        features.push(point)
      }
    } catch (e) {
      console.error(`Failed to forwardGeocode with error: ${e}`)
    }

    return { features }
  }
}

// Mini Map Component for Coordinate Selection
function MiniMapSelector({ 
  onLocationSelect, 
  initialCoords = [77, 20] 
}: { 
  onLocationSelect: (coords: [number, number]) => void
  initialCoords?: [number, number]
}) {
  const mapRef = useRef<MaplibreMap | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string>("")

  useEffect(() => {
    if (!isOpen || mapRef.current || !containerRef.current) return

    // Satellite tile source only
    const mapStyle = {
      version: 8,
      sources: {
        "esri-satellite": {
          type: "raster" as const,
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          ],
          tileSize: 256,
          attribution: "© Esri, Maxar, Earthstar Geographics",
          maxzoom: 19
        }
      },
      layers: [{
        id: "esri-satellite",
        type: "raster" as const,
        source: "esri-satellite",
        layout: { visibility: "visible" as const }
      }]
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: initialCoords,
      zoom: 10,
      maxZoom: 19
    })

    // Add controls
    map.addControl(new maplibregl.NavigationControl(), "top-right")
    map.addControl(new maplibregl.ScaleControl(), "bottom-left")

    // Add geocoder control
    const geocoder = new MaplibreGeocoder(geocodingApi, {
      maplibregl: maplibregl,
      showResultsWhileTyping: true,
      showResultMarkers: false,
      placeholder: 'Search places in India...',
      limit: 5,
      minLength: 3
    })

    map.addControl(geocoder, 'top-left')

    // Add initial marker
    const marker = new maplibregl.Marker({
      draggable: true,
      color: '#16a34a'
    })
    .setLngLat(initialCoords)
    .addTo(map)

    markerRef.current = marker

    // Handle marker drag
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat()
      onLocationSelect([lngLat.lng, lngLat.lat])
      setSelectedLocation(`${lngLat.lat.toFixed(6)}, ${lngLat.lng.toFixed(6)}`)
    })

    // Handle map click to move marker
    map.on('click', (e) => {
      const { lng, lat } = e.lngLat
      marker.setLngLat([lng, lat])
      onLocationSelect([lng, lat])
      setSelectedLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    })

    // Handle geocoder result
    geocoder.on('result', (e: any) => {
      const [lng, lat] = e.result.center
      marker.setLngLat([lng, lat])
      onLocationSelect([lng, lat])
      setSelectedLocation(e.result.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      map.flyTo({ center: [lng, lat], zoom: 15 })
    })

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      if (markerRef.current) {
        markerRef.current = null
      }
    }
  }, [isOpen, onLocationSelect, initialCoords])

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      // Set initial location name
      setSelectedLocation(`${initialCoords[1].toFixed(6)}, ${initialCoords[0].toFixed(6)}`)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {selectedLocation || "Click to select location on map"}
        <span className="float-right text-green-600">
          {isOpen ? "↑ Close Map" : "🗺️ Open Map"}
        </span>
      </button>
      
      {isOpen && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-green-50 px-3 py-2 text-xs text-green-800">
            <strong>Instructions:</strong> Search for a location, click on the map, or drag the green marker to select coordinates.
          </div>
          <div 
            ref={containerRef} 
            className="w-full h-80"
            style={{ minHeight: '320px' }}
          />
          {selectedLocation && (
            <div className="bg-gray-50 px-3 py-2 text-xs text-gray-700">
              <strong>Selected:</strong> {selectedLocation}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  // Coordinate states for forms
  const [claimCoords, setClaimCoords] = useState<[number, number]>([77, 20])
  const [assetCoords, setAssetCoords] = useState<[number, number]>([77, 20])

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
        coords: {
          type: "Point",
          coordinates: claimCoords
        },
      }),
    })
    if (res.ok) {
      const created = await res.json()
      setClaims((s) => [created, ...s])
      // Reset coordinates to default
      setClaimCoords([77, 20])
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
        coords: {
          type: "Point",
          coordinates: assetCoords
        },
      }),
    })
    if (res.ok) {
      const created = await res.json()
      setAssets((s) => [created, ...s])
      // Reset coordinates to default
      setAssetCoords([77, 20])
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading admin data...</p>
      </div>
    </div>
  )

  const aiAssets = assets.filter((a) => a.source === "Satellite")
  const manualAssets = assets.filter((a) => a.source !== "Satellite")

  return (
    <section className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage forest rights claims and assets with interactive map selection</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <FormCard title="Add New Claim" onSubmit={addClaim}>
          <Field name="claimant" label="Claimant ID" required />
          <Field name="claimantName" label="Claimant Name" required />
          <Field name="village" label="Village" required />
          <Field name="district" label="District" required />
          <Select name="type" label="Claim Type" options={["IFR", "CR", "CFR"]} />
          <Field name="area" label="Area (hectares)" type="number" step="0.01" />
          <Select name="status" label="Status" options={["PENDING", "APPROVED", "REJECTED"]} />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Location Coordinates</label>
            <MiniMapSelector 
              onLocationSelect={setClaimCoords}
              initialCoords={claimCoords}
            />
            <p className="text-xs text-gray-500">
              Current coordinates: [{claimCoords[0].toFixed(6)}, {claimCoords[1].toFixed(6)}]
            </p>
          </div>
        </FormCard>

        <FormCard title="Add New Asset (Manual)" onSubmit={addAsset}>
          <Field name="name" label="Asset Name" required />
          <Field name="owner" label="Owner" />
          <Field name="village" label="Village" />
          <Select name="type" label="Asset Type" options={["water", "forest", "agriculture", "settlement"]} />
          <Select name="source" label="Source" options={["Manual", "Satellite"]} />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Location Coordinates</label>
            <MiniMapSelector 
              onLocationSelect={setAssetCoords}
              initialCoords={assetCoords}
            />
            <p className="text-xs text-gray-500">
              Current coordinates: [{assetCoords[0].toFixed(6)}, {assetCoords[1].toFixed(6)}]
            </p>
          </div>
        </FormCard>
      </div>

      {aiAssets.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-green-50 to-indigo-50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🤖</span>
            AI-Detected Assets Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {["agriculture", "forest", "water", "settlement"].map((type) => {
              const count = aiAssets.filter((a) => a.type === type).length
              const icons = {
                agriculture: "🌾",
                forest: "🌲",
                water: "💧",
                settlement: "🏘️"
              }
              return (
                <div key={type} className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-2xl mb-2">{icons[type as keyof typeof icons]}</div>
                  <div className="text-3xl font-bold text-blue-600">{count}</div>
                  <div className="text-gray-600 capitalize font-medium">{type}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <DataList
          title={`Forest Rights Claims (${claims.length} total)`}
          rows={claims.map((c) => [
            c.id, 
            c.claimant, 
            c.claimantName, 
            c.village, 
            c.district, 
            c.type, 
            c.status, 
            `${c.area} ha`
          ])}
          headers={["ID", "Claimant ID", "Claimant Name", "Village", "District", "Type", "Status", "Area"]}
        />

        <DataList
          title={`Forest Assets (${assets.length} total: ${manualAssets.length} manual, ${aiAssets.length} AI-detected)`}
          rows={assets.map((a) => [
            a.id, 
            a.name, 
            a.owner ?? "-", 
            a.type, 
            a.village ?? "-", 
            a.source ?? "Manual"
          ])}
          headers={["ID", "Name", "Owner", "Type", "Village", "Source"]}
        />
      </div>
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <form
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      action={async (fd) => {
        setIsSubmitting(true)
        try {
          await onSubmit(fd)
        } finally {
          setIsSubmitting(false)
        }
      }}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <div className="mt-1 h-0.5 w-16 bg-green-600 rounded"></div>
      </div>
      <div className="space-y-4">{children}</div>
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 text-white font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Saving..." : "Save Entry"}
      </button>
    </form>
  )
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { name, label, required, ...rest } = props
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <input 
        name={name} 
        required={required}
        {...rest} 
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" 
      />
    </label>
  )
}

function Select({ 
  name, 
  label, 
  options, 
  required 
}: { 
  name: string
  label: string
  options: string[]
  required?: boolean 
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <select 
        name={name} 
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th 
                  key={header} 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}