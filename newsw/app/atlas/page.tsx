"use client"

import dynamic from "next/dynamic"

const Map = dynamic(() => import("@/components/map/Map"), { ssr: false })

export default function AtlasPage() {
  return (
    <section className="space-y-8 animate-fade-in">
      <div className="text-center animate-slide-in-left">
        <h1 className="text-4xl font-bold text-primary mb-4">FRA Atlas</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Interactive map with Bhuvan WebGIS integration and AI-powered asset classification
        </p>
      </div>
      <div className="rounded-xl border shadow-lg overflow-hidden card-enhanced animate-slide-in-right">
        <Map />
      </div>
    </section>
  )
}
