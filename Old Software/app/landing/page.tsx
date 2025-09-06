import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

const cards = [
  { title: "Dashboard", href: "/dashboard", desc: "KPIs & simple charts" },
  { title: "Upload Docs", href: "/upload", desc: "OCR PDFs & images" },
  { title: "FRA Atlas", href: "/atlas", desc: "Map of claims & assets" },
  { title: "DSS", href: "/dss", desc: "Recommendations & export" },
  { title: "Admin", href: "/admin", desc: "Manage data & rules" },
]

export default async function LandingPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <section className="py-6">
      <h1 className="mb-6 text-2xl font-semibold text-balance">Welcome to FRA Atlas & DSS</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="rounded-lg border p-4 transition hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            <h3 className="text-lg font-medium">{c.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
