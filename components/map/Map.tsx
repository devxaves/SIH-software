"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl, { type Map as MaplibreMap, Popup } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import useSWR from "swr"

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
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Map() {
  const mapRef = useRef<MaplibreMap | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { data: claims } = useSWR<Claim[]>("/api/claims", fetcher)
  const { data: assets } = useSWR<Asset[]>("/api/assets", fetcher)

  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [assetFilter, setAssetFilter] = useState<string>("all")

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [77.0, 20.0],
      zoom: 4.5,
    })
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right")
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !claims || !assets) return // Clear previous markers
    ;(map as any).__markers?.forEach((m: any) => m.remove())
    ;(map as any).__markers = []

    const markers: maplibregl.Marker[] = []

    claims
      .filter((c) => typeFilter === "all" || c.type === typeFilter)
      .forEach((c) => {
        const coord = getPoint(c.coords)
        if (!coord) return
        const el = document.createElement("div")
        el.className = "rounded-full bg-blue-600"
        el.style.width = "12px"
        el.style.height = "12px"
        el.style.border = "2px solid white"
        const popup = new Popup({ offset: 12 }).setHTML(
          `<div class="text-sm"><div class="font-medium">Claim #${c.id}</div><div>${c.claimant} (${c.village})</div><div>${c.type} • ${c.status}</div></div>`,
        )
        const m = new maplibregl.Marker({ element: el }).setLngLat(coord).setPopup(popup).addTo(map)
        markers.push(m)
      })

    assets
      .filter((a) => assetFilter === "all" || a.type === assetFilter)
      .forEach((a) => {
        const coord = getPoint(a.coords)
        if (!coord) return
        const el = document.createElement("div")
        el.className = "rounded-full bg-green-600"
        el.style.width = "12px"
        el.style.height = "12px"
        el.style.border = "2px solid white"
        const popup = new Popup({ offset: 12 }).setHTML(
          `<div class="text-sm"><div class="font-medium">Asset #${a.id}</div><div>${a.name}</div><div>Type: ${a.type}</div></div>`,
        )
        const m = new maplibregl.Marker({ element: el }).setLngLat(coord).setPopup(popup).addTo(map)
        markers.push(m)
      })
    ;(map as any).__markers = markers
  }, [claims, assets, typeFilter, assetFilter])

  return (
    <div className="grid gap-3 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Claim Type:
          <select
            className="ml-2 rounded border px-2 py-1 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="IFR">IFR</option>
            <option value="CR">CR</option>
            <option value="CFR">CFR</option>
          </select>
        </label>
        <label className="text-sm">
          Asset Type:
          <select
            className="ml-2 rounded border px-2 py-1 text-sm"
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="water">water</option>
            <option value="farm">farm</option>
            <option value="forest">forest</option>
          </select>
        </label>
      </div>
      <div ref={containerRef} className="h-[520px] w-full rounded border" />
    </div>
  )
}

function getPoint(json: any): [number, number] | null {
  try {
    if (!json) return null
    const obj = typeof json === "string" ? JSON.parse(json) : json
    if (obj.type === "Point") {
      const [lng, lat] = obj.coordinates
      return [Number(lng), Number(lat)]
    }
    return null
  } catch {
    return null
  }
}
