import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

const cards = [
  {
    title: "📊 Dashboard",
    href: "/dashboard",
    desc: "Real-time KPIs, analytics & progress tracking",
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "📄 Upload Docs",
    href: "/upload",
    desc: "AI-powered OCR + NER for document digitization",
    color: "from-green-500 to-green-600",
  },
  {
    title: "🗺️ FRA Atlas",
    href: "/atlas",
    desc: "Interactive map with Bhuvan WebGIS integration",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    title: "🤖 DSS Engine",
    href: "/dss",
    desc: "AI decision support with policy simulation",
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "📚 Digital Archive",
    href: "/archive",
    desc: "Searchable claims database with filters",
    color: "from-indigo-500 to-indigo-600",
  },
  {
    title: "⚙️ Admin Panel",
    href: "/admin",
    desc: "Data management & system configuration",
    color: "from-orange-500 to-orange-600",
  },
]

export default async function LandingPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <section className="py-8">
      <div className="text-center mb-12">
        <h1 className="mb-4 text-4xl font-bold text-balance bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Welcome to FRA Atlas & DSS v2.0
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
          AI-powered Forest Rights Act digitization platform with enhanced OCR, satellite mapping, and intelligent
          decision support
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
            />
            <div className="relative">
              <h3 className="text-xl font-semibold mb-2 group-hover:text-gray-900 transition-colors">{c.title}</h3>
              <p className="text-sm text-muted-foreground group-hover:text-gray-700 transition-colors">{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl">
            🤖
          </div>
          <h3 className="font-semibold mb-2">AI-Powered Processing</h3>
          <p className="text-sm text-muted-foreground">Advanced OCR + NER for intelligent document digitization</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
            🛰️
          </div>
          <h3 className="font-semibold mb-2">Satellite Integration</h3>
          <p className="text-sm text-muted-foreground">Bhuvan WebGIS layers with AI asset classification</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl">
            📊
          </div>
          <h3 className="font-semibold mb-2">Smart Analytics</h3>
          <p className="text-sm text-muted-foreground">Real-time KPIs and policy simulation capabilities</p>
        </div>
      </div>
    </section>
  )
}
