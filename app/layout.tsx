import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { Suspense } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DEVX AVES",
  description: "DEVX AVES Software",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`font-sans ${GeistSans.variable} ${GeistMono.variable} min-h-dvh bg-background text-foreground antialiased`}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <header className="border-b">
              <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
                <Link href="/landing" className="font-semibold">
                  FRA Atlas & DSS
                </Link>
                <div className="flex items-center gap-3">
                  <Link className="text-sm hover:underline" href="/dashboard">
                    Dashboard
                  </Link>
                  <Link className="text-sm hover:underline" href="/upload">
                    Upload
                  </Link>
                  <Link className="text-sm hover:underline" href="/atlas">
                    Atlas
                  </Link>
                  <Link className="text-sm hover:underline" href="/dss">
                    DSS
                  </Link>
                  <Link className="text-sm hover:underline" href="/admin">
                    Admin
                  </Link>
                </div>
              </nav>
            </header>
            <main className="mx-auto max-w-6xl p-4">{children}</main>
          </Suspense>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
