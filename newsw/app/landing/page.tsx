import Link from "next/link"
import { auth, currentUser } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"



const cards = [
  {
    title: "Dashboard",
    href: "/dashboard",
    desc: "Real-time KPIs, analytics & progress tracking",
    color: "bg-gradient-orange-white",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    authOnly: true,
  },
  {
    title: "Upload Docs",
    href: "/upload",
    desc: "AI-powered OCR + NER for document digitization",
    color: "bg-gradient-green-white",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
  {
    title: "BharatAtlas",
    href: "/atlas",
    desc: "Interactive map with Bhuvan WebGIS integration",
    color: "bg-black",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    title: "DSS Engine",
    href: "/dss",
    desc: "AI decision support with policy simulation",
    color: "bg-gradient-green-white",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: "Digital Archive",
    href: "/archive",
    desc: "Searchable claims database with filters",
    color: "bg-gradient-orange-white",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  {
    title: "Admin Panel",
    href: "/admin",
    desc: "Data management & system configuration",
    color: "bg-gradient-green-white",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default async function LandingPage() {
  const { userId } = await auth()
  const user = userId ? await currentUser() : null

  return (
    <section className="bg-white min-h-screen">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Images */}
         <div className="relative">
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-4">
      {/* First Image */}
      <div className="rounded-lg h-48 overflow-hidden">
        <img
          src="/pic1.jpg"
          alt="Forest"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Second Image */}
      <div className="rounded-lg h-32 overflow-hidden">
        <img
          src="/pic2.jpg"
          alt="Mountains"
          className="w-full h-full object-cover"
        />
      </div>
    </div>

    <div className="pt-8">
      {/* Third Image */}
      <div className="rounded-lg h-56 overflow-hidden">
        <img
          src="/pic3.jpg"
          alt="Community"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  </div>
</div>


          {/* Right side - Content */}
          <div className="space-y-8">
            {/* Greeting */}
            {user && (
              <p className="text-gray-600">
                Welcome back, {user.firstName || user.username}
              </p>
            )}

            {/* Main headline */}
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-orange-500 leading-tight">
                Bharat<span className="text-green-600">Atlas</span>
              </h1>
              <h2 className="text-2xl lg:text-3xl font-semibold text-gray-800">
                REVOLUTIONIZING FOREST RIGHTS!
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Providing comprehensive solutions 
                for document processing, land mapping, and decision support, ensuring transparent and efficient 
                forest rights management.
              </p>
            </div>

            {/* Hero buttons */}
            <div className="flex gap-4">
              <Link
                href={user ? "/dashboard" : "/sign-in"}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-md font-medium transition-colors duration-200"
              >
                {user ? "Go to Dashboard" : "Get Started"}
              </Link>
              <a
                href="#highlights"
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-md font-medium transition-colors duration-200"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-3 px-6 animate-fade-in">
        {cards
          .filter((c) => (c.authOnly ? !!user : true))
          .map((c, index) => (
            <Link
              key={c.title}
              href={c.href}
              className={`group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg hover:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative animate-fade-in">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 mr-4 bg-green-700 rounded-lg flex items-center justify-center text-white shadow-sm">
                    {c.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-primary group-hover:text-secondary transition-colors duration-200">{c.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground group-hover:text-gray-600 transition-colors leading-relaxed">{c.desc}</p>
              </div>
            </Link>
          ))}
      </div>

      {/* Highlights */}
      <div id="highlights" className="relative mt-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Government-Grade <span className="text-orange-600">Digital</span> <span className="text-green-700">Solutions</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Empowering government agencies with cutting-edge technology for efficient public administration
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
              <div className="w-16 h-16 mx-auto mb-6 bg-orange-600 rounded-lg flex items-center justify-center text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-3 text-lg text-gray-900">AI-Powered Processing</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Advanced OCR + NER for intelligent document digitization with 95% accuracy</p>
            </div>
            
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
              <div className="w-16 h-16 mx-auto mb-6 bg-green-700 rounded-lg flex items-center justify-center text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="font-semibold mb-3 text-lg text-gray-900">Satellite Integration</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Bhuvan WebGIS layers with AI asset classification and real-time monitoring</p>
            </div>
            
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
              <div className="w-16 h-16 mx-auto mb-6 bg-orange-600 rounded-lg flex items-center justify-center text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-3 text-lg text-gray-900">Smart Analytics</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Real-time KPIs and policy simulation capabilities with predictive insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                <span className="text-orange-600">Bharat</span><span className="text-green-700">Atlas</span>
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-md">
                Government of India's premier digital platform for land record management, 
                satellite integration, and AI-powered administrative solutions.
              </p>
              <div className="flex items-center mt-4 space-x-4">
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Government Certified
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Secure Platform
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Land Record Management</li>
                <li>Asset Classification</li>
                <li>Satellite Monitoring</li>
                <li>Digital Archive</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Training Resources</li>
                <li>Technical Support</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-500">
              © 2024 Government of India. All rights reserved. | National Informatics Centre
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-xs text-gray-500 hover:text-gray-700">Privacy Policy</a>
              <a href="#" className="text-xs text-gray-500 hover:text-gray-700">Terms of Service</a>
              <a href="#" className="text-xs text-gray-500 hover:text-gray-700">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </section>
  )
}