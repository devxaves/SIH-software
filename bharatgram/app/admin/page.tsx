"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import maplibregl, { type Map as MaplibreMap } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
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

// Geocoding API using Nominatim
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

// Mini Map Component for coordinate selection
function MiniMap({ 
  onCoordinateSelect, 
  initialCoords 
}: { 
  onCoordinateSelect: (coords: [number, number]) => void
  initialCoords?: [number, number]
}) {
  const mapRef = useRef<MaplibreMap | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(
    initialCoords || null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  // Search for locations
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in&addressdetails=1`
      )
      const data = await response.json()
      setSearchResults(data)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    }
  }

  const selectSearchResult = (result: any) => {
    const coords: [number, number] = [parseFloat(result.lon), parseFloat(result.lat)]
    
    // Place or move marker
    if (markerRef.current) {
      markerRef.current.setLngLat(coords)
    } else {
      const marker = new maplibregl.Marker({ color: "#3b82f6", draggable: true })
        .setLngLat(coords)
        .addTo(mapRef.current!)
      
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        const newCoords: [number, number] = [lngLat.lng, lngLat.lat]
        setSelectedCoords(newCoords)
        onCoordinateSelect(newCoords)
      })
      
      markerRef.current = marker
    }
    
    setSelectedCoords(coords)
    onCoordinateSelect(coords)
    mapRef.current?.flyTo({ center: coords, zoom: 14 })
    
    // Clear search
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const mapStyle = {
      version: 8,
      sources: {
        "osm-standard": {
          type: "raster" as const,
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors",
          maxzoom: 19
        }
      },
      layers: [{
        id: "osm-standard",
        type: "raster" as const,
        source: "osm-standard",
        layout: { visibility: "visible" as const }
      }]
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: initialCoords || [77.0, 20.0],
      zoom: initialCoords ? 12 : 5,
      attributionControl: false
    })

    map.addControl(new maplibregl.NavigationControl(), "top-right")
    map.addControl(new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false
    }), "top-right")

    // Add initial marker if coordinates exist
    if (initialCoords) {
      const marker = new maplibregl.Marker({ color: "#3b82f6", draggable: true })
        .setLngLat(initialCoords)
        .addTo(map)
      
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        const coords: [number, number] = [lngLat.lng, lngLat.lat]
        setSelectedCoords(coords)
        onCoordinateSelect(coords)
      })
      
      markerRef.current = marker
    }

    // Click to place/move marker
    map.on('click', (e) => {
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      
      if (markerRef.current) {
        markerRef.current.setLngLat(coords)
      } else {
        const marker = new maplibregl.Marker({ color: "#3b82f6", draggable: true })
          .setLngLat(coords)
          .addTo(map)
        
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          const newCoords: [number, number] = [lngLat.lng, lngLat.lat]
          setSelectedCoords(newCoords)
          onCoordinateSelect(newCoords)
        })
        
        markerRef.current = marker
      }
      
      setSelectedCoords(coords)
      onCoordinateSelect(coords)
    })

    mapRef.current = map

    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
      }
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div className="space-y-2">
      {/* Search Box */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search location in India..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => selectSearchResult(result)}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 text-sm"
              >
                <div className="font-medium text-gray-800">{result.display_name}</div>
                <div className="text-xs text-gray-500">{result.type}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div ref={containerRef} className="w-full h-64 rounded-lg border border-gray-300 overflow-hidden" />
      {selectedCoords && (
        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
          <strong>Selected:</strong> {selectedCoords[1].toFixed(6)}°N, {selectedCoords[0].toFixed(6)}°E
          <div className="text-gray-500 mt-1">💡 Search, click map, or drag marker to adjust position</div>
        </div>
      )}
    </div>
  )
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
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Operations Desk</h1>
        <p className="text-sm text-muted-foreground">
          Manage village project records, sync community assets, and orchestrate BharatGram field operations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormCardWithMap title="Register project" onSubmit={addClaim}>
          <Field name="claimant" label="Lead household / institution" required />
          <Field name="claimantName" label="Project title" required />
          <Field name="village" label="Village" required />
          <Field name="district" label="District" required />
          <Select name="type" label="Project type" options={["IFR", "CR", "CFR"]} />
          <Field name="area" label="Coverage area (ha)" type="number" step="0.01" />
          <Select name="status" label="Status" options={["PENDING", "APPROVED", "REJECTED"]} />
        </FormCardWithMap>

        <FormCardWithMap title="Log community asset" onSubmit={addAsset}>
          <Field name="name" label="Asset name" required />
          <Field name="owner" label="Custodian" />
          <Field name="village" label="Village" />
          <Select name="type" label="Asset type" options={["water", "forest", "agriculture", "settlement"]} />
          <Select name="source" label="Source" options={["Manual", "Satellite"]} />
        </FormCardWithMap>
      </div>

      {aiAssets.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-3">AI-detected asset summary</h3>
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
        title="Project registry"
        rows={claims.map((c) => [c.id, c.claimant, c.claimantName, c.village, c.district, c.type, c.status, c.area])}
        headers={["ID", "Lead", "Project title", "Village", "District", "Type", "Status", "Coverage (ha)"]}
      />

      <DataList
        title={`Community assets (${assets.length} total: ${manualAssets.length} field-logged, ${aiAssets.length} AI-detected)`}
        rows={assets.map((a) => [a.id, a.name, a.owner ?? "-", a.type, a.village ?? "-", a.source ?? "Manual"])}
        headers={["ID", "Asset", "Custodian", "Type", "Village", "Source"]}
      />
    </section>
  )
}

function FormCardWithMap({
  title,
  onSubmit,
  children,
}: {
  title: string
  onSubmit: (fd: FormData) => Promise<void>
  children: React.ReactNode
}) {
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleCoordinateSelect = (coords: [number, number]) => {
    setSelectedCoords(coords)
  }

  const handleSubmit = async (fd: FormData) => {
    if (selectedCoords) {
      fd.set('coords', JSON.stringify({
        type: "Point",
        coordinates: selectedCoords
      }))
    }
    await onSubmit(fd)
    
    // Reset form and coordinates
    formRef.current?.reset()
    setSelectedCoords(null)
  }

  return (
    <form
      ref={formRef}
      className="rounded-lg border p-4"
      action={async (fd) => {
        await handleSubmit(fd)
      }}
    >
      <div className="mb-3 text-sm font-medium">{title}</div>
      <div className="grid gap-3">
        {children}
        
        {/* Map Section */}
        <div className="border-t pt-3 mt-2">
          <label className="block text-sm text-muted-foreground mb-2">
            Location coordinates
          </label>
          <MiniMap 
            onCoordinateSelect={handleCoordinateSelect}
            initialCoords={selectedCoords || undefined}
          />
        </div>
        
        {/* Hidden input for coordinates */}
        <input type="hidden" name="coords" />
      </div>
      <button 
        type="submit" 
        className="mt-3 w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={!selectedCoords}
      >
        {selectedCoords ? 'Save' : 'Select location on map first'}
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