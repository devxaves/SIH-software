import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import Link from "next/link"
import { Suspense } from "react"
import Forestbg from "./forestbg.png"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Smart Adarsh Gram Platform",
  description:
    "AI-driven infrastructure planning, inclusion analytics, and participatory governance toolkit for SC-majority villages.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <body
          className={`font-sans ${GeistSans.variable} ${GeistMono.variable} min-h-dvh bg-background text-foreground antialiased`}
        >
          {/* Background image */}
  <div className="fixed inset-0 -z-10">
  <Image
    src={Forestbg}
    alt="Forest background"
    fill
    priority
    className="object-cover object-center opacity-20"
  />
</div>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <header className="border-b bg-gradient-to-r from-slate-50 via-emerald-50 to-sky-50 shadow-sm">
              <nav className="mx-auto flex max-w-7xl items-center justify-between p-4">
                <Link
                  href="/landing"
                  className="font-bold text-xl text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  � Smart Adarsh Gram Platform
                </Link>
                <div className="flex items-center gap-4">
                  <Link
                    className="text-sm font-medium hover:text-emerald-600 transition-colors px-3 py-2 rounded-md hover:bg-white/60"
                    href="/dashboard"
                  >
                    Intelligence Hub
                  </Link>
                  <Link
                    className="text-sm font-medium hover:text-sky-600 transition-colors px-3 py-2 rounded-md hover:bg-white/60"
                    href="/atlas"
                  >
                    Geo Atlas
                  </Link>
                  <Link
                    className="text-sm font-medium hover:text-lime-600 transition-colors px-3 py-2 rounded-md hover:bg-white/60"
                    href="/dss"
                  >
                    Prioritization Lab
                  </Link>
                  <Link
                    className="text-sm font-medium hover:text-cyan-600 transition-colors px-3 py-2 rounded-md hover:bg-white/60"
                    href="/upload"
                  >
                    Data Ops
                  </Link>
                  <Link
                    className="text-sm font-medium hover:text-amber-600 transition-colors px-3 py-2 rounded-md hover:bg-white/60"
                    href="/archive"
                  >
                    Community Pulse
                  </Link>
                  <Link
                    className="text-sm font-medium hover:text-rose-600 transition-colors px-3 py-2 rounded-md hover:bg-white/60"
                    href="/admin"
                  >
                    Operations Desk
                  </Link>
                </div>
              </nav>
            </header>
            <main className="mx-auto max-w-7xl p-6 min-h-[calc(100vh-80px)]">{children}</main>
          </Suspense>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
