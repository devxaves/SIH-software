import Link from "next/link"
import { auth, currentUser } from "@clerk/nextjs/server"

const capabilityCards = [
  {
    title: "📊 Intelligence Hub",
    href: "/dashboard",
    desc: "Gap analytics, resource dashboards, and AI forecasts",
    color: "from-emerald-500 to-teal-600",
    authOnly: true,
  },
  {
    title: "�️ Geo Atlas",
    href: "/atlas",
    desc: "Village digital twins with geospatial overlays and asset trails",
    color: "from-sky-500 to-indigo-500",
  },
  {
    title: "⚖️ Prioritization Lab",
    href: "/dss",
    desc: "AI-assisted intervention ranking with policy simulations",
    color: "from-lime-500 to-green-500",
    authOnly: true,
  },
  {
    title: "🔗 Data Ops",
    href: "/upload",
    desc: "Ingest open data, field surveys, and IoT feeds in one pipeline",
    color: "from-cyan-500 to-blue-500",
  },
  {
    title: "� Community Pulse",
    href: "/archive",
    desc: "Stories, grievances, and multilingual feedback loops",
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "🛠️ Operations Desk",
    href: "/admin",
    desc: "Governance controls, audit trails, and officer workflows",
    color: "from-rose-500 to-pink-500",
    authOnly: true,
  },
]

const pillars = [
  {
    title: "Open Data Mesh",
    emoji: "🪢",
    description: "Standards-compliant APIs fuse government registries, live sensors, and surveys with OC4IDS-ready schemas.",
  },
  {
    title: "AI Gap Radar",
    emoji: "🧠",
    description: "Machine learning models surface infrastructure blind spots, predict service failures, and score impact potential.",
  },
  {
    title: "Smart Geographies",
    emoji: "🛰️",
    description: "Offline-capable geospatial layers reveal assets, demographic overlays, and mobile geotagged validations.",
  },
  {
    title: "Dynamic Prioritization",
    emoji: "⚙️",
    description: "Adaptive scoring blends urgency, cost, equity, and officer judgment with transparent audit logs.",
  },
  {
    title: "Inclusive Engagement",
    emoji: "🤝",
    description: "Multilingual portals, WhatsApp/SMS nudges, and grievance loops keep communities co-creating progress.",
  },
  {
    title: "Resource Automation",
    emoji: "⏱️",
    description: "Real-time alerts flag bottlenecks, mobilize support teams, and sync field visits to macro resource views.",
  },
  {
    title: "Risk & Accountability",
    emoji: "🛡️",
    description: "AI risk scoring forecasts delays while blockchain-backed ledgers secure funding and procurement flows.",
  },
  {
    title: "Accessible by Design",
    emoji: "🪄",
    description: "Voice, vernacular UI, and low-bandwidth optimization welcome first-time digital users across devices.",
  },
]

const highlights = [
  {
    title: "10x faster village diagnostics",
    detail: "AI gap analysis crunches 80+ indicators to recommend interventions in minutes instead of weeks.",
  },
  {
    title: "Trust-first funding flows",
    detail: "Blockchain audit trails map every rupee from sanction to asset completion and community validation.",
  },
  {
    title: "People-powered governance",
    detail: "Live storyboards, participatory surveys, and grievance loops keep officers tuned to on-ground realities.",
  },
]

export default async function LandingPage() {
  const { userId } = await auth()
  const user = userId ? await currentUser() : null

  return (
    <section className="relative min-h-screen space-y-16">
      <div className="relative text-center mt-12 px-6">
        {user && (
          <p className="text-lg text-gray-700 font-medium mb-3">Welcome back, {user.firstName || user.username}! 👋</p>
        )}

        <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm">
          <span>Mission Adarsh Gram</span>
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          <span>AI + Community + Accountability</span>
        </div>

        <h1 className="mt-6 text-balance text-5xl font-bold bg-gradient-to-r from-emerald-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
          BharatGram
        </h1>
        <p className="mt-4 mx-auto max-w-3xl text-balance text-lg text-muted-foreground">
          Deliver evidence-driven transformation for SC-majority villages with end-to-end gap analysis, smart
          prioritization, geospatial intelligence, and inclusive participation engineered for scale.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href={user ? "/dashboard" : "/sign-in"}
            className="rounded-lg bg-gradient-to-r from-emerald-500 to-sky-600 px-6 py-3 text-white text-base font-medium shadow hover:opacity-90 transition"
          >
            {user ? "Open Intelligence Hub" : "Launch Pilot Workspace"}
          </Link>
          <a
            href="#pillars"
            className="rounded-lg border border-emerald-200 bg-white px-6 py-3 text-base font-medium text-emerald-700 shadow-sm hover:bg-emerald-50 transition"
          >
            Explore Platform Pillars
          </a>
        </div>
      </div>

      <div className="relative grid gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
        {capabilityCards
          .filter((card) => (card.authOnly ? !!user : true))
          .map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
              />
              <div className="relative">
                <h3 className="text-xl font-semibold mb-2 text-slate-900 group-hover:text-emerald-700">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            </Link>
          ))}
      </div>

      <div id="pillars" className="relative px-6">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-semibold text-slate-900">Platform Pillars</h2>
          <p className="mt-3 text-muted-foreground">
            Each capability directly targets the Adarsh Gram guidelines—ensuring every SC-majority village is mapped,
            resourced, and celebrated with transparency.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="rounded-xl border border-emerald-100 bg-white/70 p-5 shadow-sm backdrop-blur">
              <div className="mb-3 text-3xl">{pillar.emoji}</div>
              <h3 className="text-lg font-semibold text-slate-900">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((highlight) => (
            <div key={highlight.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{highlight.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{highlight.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
