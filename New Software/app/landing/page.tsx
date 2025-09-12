import Link from "next/link"
import { auth, currentUser } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"



const cards = [
  {
    title: "📊 Dashboard",
    href: "/dashboard",
    desc: "Real-time KPIs, analytics & progress tracking",
    color: "from-blue-500 to-blue-600",
    authOnly: true,
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
  const user = userId ? await currentUser() : null

  return (
    <section className="relative min-h-screen">
      


      {/* Overlay for contrast
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/95" /> */}

      {/* Navbar */}
      {/* <nav className="relative flex justify-between items-center px-6 py-4 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
        >
          🌳 FRA Atlas v2.0
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-gray-600">
                Hi, <span className="font-medium">{user.firstName || user.username}</span>
              </span>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-lg bg-gradient-to-r from-green-500 to-blue-600 px-4 py-2 text-white text-sm font-medium shadow hover:opacity-90 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav> */}

      {/* Hero */}
      <div className="relative text-center mb-16 mt-12 px-6">
        {/* Greeting */}
        {user && (
          <p className="text-lg text-gray-700 font-medium mb-2">
            Hi, {user.firstName || user.username} 👋
          </p>
        )}

        {/* Project logo + name */}
        <div className="flex justify-center items-center gap-2 mb-4">
          <span className="text-3xl">🌳</span>
          <h2 className="text-2xl font-semibold text-gray-800">Forest Rights Digitization Platform</h2>
        </div>

        {/* Main headline */}
        <h1 className="mb-4 text-5xl font-bold text-balance bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Welcome to FRA Atlas & DSS v2.0
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance mb-6">
          AI-powered Forest Rights Act digitization platform with enhanced OCR, satellite mapping, and intelligent
          decision support
        </p>

        {/* Hero buttons */}
        <div className="flex justify-center gap-4">
          <Link
            href={user ? "/dashboard" : "/sign-in"}
            className="rounded-lg bg-gradient-to-r from-green-500 to-blue-600 px-6 py-3 text-white text-base font-medium shadow hover:opacity-90 transition"
          >
            {user ? "Go to Dashboard" : "Get Started"}
          </Link>
          <a
            href="#highlights"
            className="rounded-lg border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3 px-6">
        {cards
          .filter((c) => (c.authOnly ? !!user : true))
          .map((c) => (
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

      {/* Highlights */}
      <div id="highlights" className="relative mt-20 grid gap-8 md:grid-cols-3 px-6 pb-16">
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
