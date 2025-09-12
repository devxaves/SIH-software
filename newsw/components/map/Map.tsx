"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl, { type Map as MaplibreMap, Popup } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import useSWR from "swr"

// Import geocoder
// @ts-ignore
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder'
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css'

type Claim = {
  id: number
  claimant: string
  village: string
  type: string
  status: string
  coords: any
}

type Asset = {
  id: number
  name: string
  type: string
  coords: any
  village?: string
}

// Only working tile sources
const TILE_SOURCES = {
  osm: {
    id: "osm-standard",
    name: "OpenStreetMap",
    type: "raster" as const,
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    attribution: "© OpenStreetMap contributors",
    maxzoom: 19
  },
  satellite: {
    id: "esri-satellite", 
    name: "Satellite Imagery",
    type: "raster" as const,
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    ],
    attribution: "© Esri, Maxar, Earthstar Geographics",
    maxzoom: 19
  },
  terrain: {
    id: "osm-terrain",
    name: "Topographic Map", 
    type: "raster" as const,
    tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
    attribution: "© OpenTopoMap (CC-BY-SA)",
    maxzoom: 17
  }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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

export default function Map() {
  const mapRef = useRef<MaplibreMap | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hoverPopupRef = useRef<Popup | null>(null)
  const { data: claims } = useSWR<Claim[]>("/api/claims", fetcher)
  const { data: assets } = useSWR<Asset[]>("/api/assets", fetcher)

  // Simple filters
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [assetFilter, setAssetFilter] = useState<string>("all") 
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [villageFilter, setVillageFilter] = useState<string>("all")
  
  const [activeLayer, setActiveLayer] = useState<string>("osm-standard")
  const [showClaims, setShowClaims] = useState(true)
  const [showAssets, setShowAssets] = useState(true)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    // Create map style with only working sources
    const mapStyle = {
      version: 8,
      sources: Object.fromEntries(
        Object.values(TILE_SOURCES).map(source => [
          source.id,
          {
            type: source.type,
            tiles: source.tiles,
            tileSize: 256,
            attribution: source.attribution,
            maxzoom: source.maxzoom
          }
        ])
      ),
      layers: Object.values(TILE_SOURCES).map((source, index) => ({
        id: source.id,
        type: "raster" as const,
        source: source.id,
        layout: { 
          visibility: index === 0 ? "visible" as const : "none" as const 
        }
      }))
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [77.0, 20.0], // Centered on India
      zoom: 5,
      maxZoom: 19,
      attributionControl: true
    })

    // Add controls
    map.addControl(new maplibregl.NavigationControl({ 
      visualizePitch: true 
    }), "top-right")
    
    map.addControl(new maplibregl.ScaleControl(), "bottom-left")
    map.addControl(new maplibregl.FullscreenControl(), "top-right")

    // Add geolocate control
    map.addControl(new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), "top-right")

    // Add geocoder control
    const geocoder = new MaplibreGeocoder(geocodingApi, {
      maplibregl: maplibregl,
      showResultsWhileTyping: true,
      showResultMarkers: true,
      marker: {
        color: '#16a34a'
      },
      popup: {
        closeButton: true,
        closeOnClick: false
      },
      placeholder: 'Search places in India...',
      limit: 5,
      minLength: 3
    })

    map.addControl(geocoder, 'top-left')

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Handle layer switching
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Hide all layers first
    Object.values(TILE_SOURCES).forEach((source) => {
      if (map.getLayer(source.id)) {
        map.setLayoutProperty(source.id, "visibility", "none")
      }
    })

    // Show the active layer
    if (map.getLayer(activeLayer)) {
      map.setLayoutProperty(activeLayer, "visibility", "visible")
    }
  }, [activeLayer])

  // Handle markers with hover functionality
  useEffect(() => {
    const map = mapRef.current
    if (!map || !claims || !assets) return

    // Remove existing markers
    ;(map as any).__markers?.forEach((m: any) => m.remove())
    ;(map as any).__markers = []

    const markers: maplibregl.Marker[] = []

    // Add claim markers with hover
    if (showClaims) {
      claims
        .filter((c) => typeFilter === "all" || c.type === typeFilter)
        .filter((c) => statusFilter === "all" || c.status === statusFilter)
        .filter((c) => villageFilter === "all" || c.village === villageFilter)
        .forEach((c) => {
          const coord = getPoint(c.coords)
          if (!coord) return

          const el = document.createElement("div")
          el.className = `w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transition-all duration-200 hover:scale-125 ${
            c.status === "Granted" 
              ? "bg-green-500 hover:bg-green-600" 
              : c.status === "Rejected" 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-blue-500 hover:bg-blue-600"
          }`

          // Create click popup
          const clickPopup = new Popup({ 
            offset: 15, 
            className: "custom-popup",
            closeButton: true,
            closeOnClick: false
          }).setHTML(`
            <div class="p-3 min-w-48">
              <div class="font-bold text-lg text-gray-800 mb-2 border-b pb-2">
                <span class="text-blue-600">🏛️ Forest Rights Claim #${c.id}</span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="font-semibold text-gray-600">Claimant:</span> 
                  <span class="text-gray-800">${c.claimant}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-semibold text-gray-600">Village:</span> 
                  <span class="text-gray-800">${c.village}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-semibold text-gray-600">Type:</span> 
                  <span class="text-gray-800">${c.type}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-gray-600">Status:</span>
                  <span class="px-3 py-1 rounded-full text-xs font-medium ${
                    c.status === "Granted"
                      ? "bg-green-100 text-green-800"
                      : c.status === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }">${c.status}</span>
                </div>
              </div>
            </div>
          `)

          // Add hover functionality
          el.addEventListener('mouseenter', () => {
            // Remove existing hover popup
            if (hoverPopupRef.current) {
              hoverPopupRef.current.remove()
            }

            // Create new hover popup
            hoverPopupRef.current = new Popup({ 
              offset: 15, 
              className: "hover-popup",
              closeButton: false,
              closeOnClick: false,
              closeOnMove: false
            }).setLngLat(coord)
              .setHTML(`
                <div class="p-2 text-xs bg-gray-800 text-white rounded shadow-lg">
                  <div class="font-semibold">${c.claimant}</div>
                  <div class="text-gray-300">${c.village} • ${c.type}</div>
                  <div class="mt-1">
                    <span class="px-2 py-0.5 rounded text-xs ${
                      c.status === "Granted" ? "bg-green-600" : 
                      c.status === "Rejected" ? "bg-red-600" : "bg-blue-600"
                    }">${c.status}</span>
                  </div>
                </div>
              `)
              .addTo(map)
          })

          el.addEventListener('mouseleave', () => {
            if (hoverPopupRef.current) {
              hoverPopupRef.current.remove()
              hoverPopupRef.current = null
            }
          })

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(coord)
            .setPopup(clickPopup)
            .addTo(map)
          
          markers.push(marker)
        })
    }

    // Add asset markers with hover
    if (showAssets) {
      assets
        .filter((a) => assetFilter === "all" || a.type === assetFilter)
        .filter((a) => villageFilter === "all" || a.village === villageFilter)
        .forEach((a) => {
          const coord = getPoint(a.coords)
          if (!coord) return

          const el = document.createElement("div")
          const assetColors = {
            water: "bg-cyan-500 hover:bg-cyan-600",
            forest: "bg-emerald-600 hover:bg-emerald-700",
            agriculture: "bg-yellow-500 hover:bg-yellow-600",
            settlement: "bg-gray-500 hover:bg-gray-600"
          }
          
          el.className = `w-3 h-3 rounded-full border-2 border-white shadow-md cursor-pointer transition-all duration-200 hover:scale-125 ${
            assetColors[a.type as keyof typeof assetColors] || "bg-purple-500 hover:bg-purple-600"
          }`

          // Create click popup
          const clickPopup = new Popup({ 
            offset: 15, 
            className: "custom-popup",
            closeButton: true,
            closeOnClick: false
          }).setHTML(`
            <div class="p-3 min-w-44">
              <div class="font-bold text-lg text-gray-800 mb-2 border-b pb-2">
                <span class="text-green-600">🌲 Forest Asset #${a.id}</span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="font-semibold text-gray-600">Name:</span> 
                  <span class="text-gray-800">${a.name}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-semibold text-gray-600">Type:</span> 
                  <span class="text-gray-800 capitalize">${a.type}</span>
                </div>
                ${a.village ? `<div class="flex justify-between"><span class="font-semibold text-gray-600">Village:</span> <span class="text-gray-800">${a.village}</span></div>` : ""}
              </div>
            </div>
          `)

          // Add hover functionality
          el.addEventListener('mouseenter', () => {
            // Remove existing hover popup
            if (hoverPopupRef.current) {
              hoverPopupRef.current.remove()
            }

            // Create new hover popup
            hoverPopupRef.current = new Popup({ 
              offset: 15, 
              className: "hover-popup",
              closeButton: false,
              closeOnClick: false,
              closeOnMove: false
            }).setLngLat(coord)
              .setHTML(`
                <div class="p-2 text-xs bg-gray-800 text-white rounded shadow-lg">
                  <div class="font-semibold">${a.name}</div>
                  <div class="text-gray-300 capitalize">${a.type} Asset</div>
                  ${a.village ? `<div class="text-gray-300">${a.village}</div>` : ""}
                </div>
              `)
              .addTo(map)
          })

          el.addEventListener('mouseleave', () => {
            if (hoverPopupRef.current) {
              hoverPopupRef.current.remove()
              hoverPopupRef.current = null
            }
          })

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(coord)
            .setPopup(clickPopup)
            .addTo(map)
          
          markers.push(marker)
        })
    }

    ;(map as any).__markers = markers
  }, [claims, assets, typeFilter, assetFilter, statusFilter, villageFilter, showClaims, showAssets])

  // Get unique filter values
  const villages = [
    ...new Set([
      ...(claims?.map((c) => c.village) || []), 
      ...(assets?.map((a) => a.village).filter(Boolean) || [])
    ])
  ]

  return (
    <div className="flex flex-col h-screen">
      {/* Simplified Control Panel */}
      <div className="bg-white shadow-md border-b p-4 space-y-4">
        {/* Base Layer Selection */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Base Layer:</span>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={activeLayer}
              onChange={(e) => setActiveLayer(e.target.value)}
            >
              {Object.values(TILE_SOURCES).map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>

          {/* Layer Toggles */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={showClaims}
                onChange={(e) => setShowClaims(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Show Claims</span>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={showAssets}
                onChange={(e) => setShowAssets(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Show Assets</span>
            </label>
          </div>
        </div>

        {/* Simple Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Village:</span>
            <select
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
            >
              <option value="all">All Villages</option>
              {villages.map((village) => (
                <option key={village} value={village}>
                  {village}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Claim Type:</span>
            <select
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="IFR">IFR</option>
              <option value="CR">CR</option>
              <option value="CFR">CFR</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Granted">Granted</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Asset Type:</span>
            <select
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
            >
              <option value="all">All Assets</option>
              <option value="water">Water</option>
              <option value="forest">Forest</option>
              <option value="agriculture">Agriculture</option>
              <option value="settlement">Settlement</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="border-t pt-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm"></div>
              <span>Granted Claims</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm"></div>
              <span>Pending Claims</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm"></div>
              <span>Rejected Claims</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-cyan-500 border border-white shadow-sm"></div>
              <span>Water Assets</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-600 border border-white shadow-sm"></div>
              <span>Forest Assets</span>
            </div>
            <div className="text-gray-600">
              <strong>💡 Tip:</strong> Hover over markers for quick info, click for details
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full" />
        
        {/* Info Panel */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 p-3 rounded-lg shadow-lg max-w-xs">
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>🔍 Search:</strong> Type location names to search</div>
            <div><strong>🗺️ Maps:</strong> Switch between OpenStreetMap, Satellite, and Terrain</div>
            <div><strong>👆 Hover:</strong> Quick info on markers</div>
            <div><strong>📍 Click:</strong> Detailed information popup</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getPoint(json: any): [number, number] | null {
  try {
    if (!json) return null
    const obj = typeof json === "string" ? JSON.parse(json) : json
    if (obj.type === "Point" && Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
      const [lng, lat] = obj.coordinates
      const longitude = Number(lng)
      const latitude = Number(lat)
      
      if (isNaN(longitude) || isNaN(latitude) || 
          longitude < -180 || longitude > 180 || 
          latitude < -90 || latitude > 90) {
        return null
      }
      
      return [longitude, latitude]
    }
    return null
  } catch (error) {
    console.error("Error parsing coordinates:", error)
    return null
  }
}