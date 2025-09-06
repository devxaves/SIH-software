"use client"

import dynamic from "next/dynamic"

const Map = dynamic(() => import("@/components/map/Map"), { ssr: false })

export default function AtlasPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">FRA Atlas</h1>
      <div className="rounded-lg border">
        <Map />
      </div>
    </section>
  )
}
