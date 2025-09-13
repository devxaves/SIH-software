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
// import Landing from "../components/ui/landing"

export const metadata: Metadata = {
  title: "BharatAtlas",
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
            <header className="border-b bg-white shadow-md backdrop-blur-sm animate-fade-in">
              <nav className="mx-auto flex max-w-7xl items-center justify-between p-4">
                <Link
                  href="/landing"
                  className="font-semibold text-xl text-primary hover:text-secondary transition-colors duration-200"
                >
                  <span className="text-orange-600">Bharat</span><span className="text-green-600">Atlas</span>
                </Link>
                <div className="flex items-center gap-1">
                  <Link
                    className="text-sm font-medium text-gray-700 hover:text-primary transition-colors duration-200 px-3 py-2 rounded hover:bg-gray-50"
                    href="/dashboard"
                  >
                    Dashboard
                  </Link>
                  <Link
                    className="text-sm font-medium text-gray-700 hover:text-primary transition-colors duration-200 px-3 py-2 rounded hover:bg-gray-50"
                    href="/upload"
                  >
                    Upload
                  </Link>
                  <Link
                    className="text-sm font-medium text-gray-700 hover:text-primary transition-colors duration-200 px-3 py-2 rounded hover:bg-gray-50"
                    href="/atlas"
                  >
                    Atlas
                  </Link>
                  <Link
                    className="text-sm font-medium text-gray-700 hover:text-primary transition-colors duration-200 px-3 py-2 rounded hover:bg-gray-50"
                    href="/dss"
                  >
                    DSS
                  </Link>
                  <Link
                    className="text-sm font-medium text-gray-700 hover:text-primary transition-colors duration-200 px-3 py-2 rounded hover:bg-gray-50"
                    href="/archive"
                  >
                    Archive
                  </Link>
                  <Link
                    className="text-sm font-medium text-gray-700 hover:text-primary transition-colors duration-200 px-3 py-2 rounded hover:bg-gray-50"
                    href="/admin"
                  >
                    Admin
                  </Link>
                </div>
              </nav>
            </header>
            <main className="mx-auto max-w-7xl p-6 min-h-[calc(100vh-80px)] bg-gray-50 animate-fade-in">{children}</main>
            {/* <Landing /> */}
          </Suspense>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
