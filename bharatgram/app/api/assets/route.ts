import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const assets = await prisma.asset.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(assets)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const created = await prisma.asset.create({
    data: {
      name: String(body.name),
      owner: body.owner ? String(body.owner) : null,
      type: String(body.type),
      village: body.village ? String(body.village) : "Unknown",
      source: body.source ? String(body.source) : "Manual",
      coords: body.coords ?? {},
    },
  })
  return NextResponse.json(created)
}
