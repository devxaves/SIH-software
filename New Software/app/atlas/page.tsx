"use client"

import dynamic from "next/dynamic"

const Map = dynamic(() => import("@/components/map/Map"), { ssr: false })

export default function AtlasPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Geo Atlas</h1>
        <p className="text-sm text-muted-foreground">
          Digital twin of SC-majority villages with multi-layer intelligence, offline caching, and mobile geotagging.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 shadow-sm">
        <Map />
      </div>
    </section>
  )
}
