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
  title: "FRA Atlas & DSS v2.0",
  description: "Forest Rights Act Atlas & Decision Support System with AI-powered digitization",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <body
          className={`font-sans ${GeistSans.variable} ${GeistMono.variable} min-h-dvh bg-background text-foreground antialiased`}
        >
          {/* Background image */}
      <div className="absolute inset-0 fixed -z-10">
  <Image
    src={Forestbg}
    alt="Forest background"
    fill
    priority
    className="object-cover object-center opacity-20"
  />
</div>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <header className="border-b bg-gradient-to-r from-green-50 to-blue-50 shadow-sm">
              <nav className="mx-auto flex max-w-7xl items-center justify-between p-4">
                <Link
                  href="/landing"
                  className="font-bold text-xl text-green-700 hover:text-green-800 transition-colors"
                >
                  🌲 FRA Atlas & DSS v2.0
                </Link>
                <div className="flex items-center gap-4">
                  <Link
                    className="text-sm font-medium hover:text-green-600 transition-colors px-3 py-2 rounded-md hover:bg-white/50"
                    href="/dashboard"
                  >
                     Dashboard
                  </Link>
                  <Link
                    className="text-sm font-medium hover:text-blue-600 transition-colors px-3 py-2 rounded-md hover:bg-white/50"
                    href="/upload"
                  >
                     Upload
                  </Link>
                  <Link
                    className="text-sm font-medium hover:text-emerald-600 transition-colors px-3 py-2 rounded-md hover:bg-white/50"
                    href="/atlas"
                  >
                     Atlas
                  </Link>
                  <Link
                    className="text-sm font-medium hover:text-purple-600 transition-colors px-3 py-2 rounded-md hover:bg-white/50"
                    href="/dss"
                  >
                     DSS
                  </Link>
                  <Link
                    className="text-sm font-medium hover:text-orange-600 transition-colors px-3 py-2 rounded-md hover:bg-white/50"
                    href="/archive"
                  >
                     Archive
                  </Link>
                  <Link
                    className="text-sm font-medium hover:text-red-600 transition-colors px-3 py-2 rounded-md hover:bg-white/50"
                    href="/admin"
                  >
                     Admin
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
