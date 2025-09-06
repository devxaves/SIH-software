import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const recs = await prisma.dSSRecommendation.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(
    recs.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  )
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const created = await prisma.dSSRecommendation.create({
    data: {
      claimId: Number(body.claimId),
      scheme: String(body.scheme),
      reason: String(body.reason),
    },
  })
  return NextResponse.json(created)
}
