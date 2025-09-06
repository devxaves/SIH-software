import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth, currentUser } from "@clerk/nextjs/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const claims = await prisma.claim.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  })
  return NextResponse.json(claims)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const user = await currentUser()
  const email =
    user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress || "unknown@example.com"

  const created = await prisma.claim.create({
    data: {
      claimant: String(body.claimant),
      village: String(body.village),
      type: String(body.type),
      area: Number(body.area || 0),
      status: String(body.status || "Pending"),
      coords: body.coords ?? {},
      user: {
        connectOrCreate: {
          where: { clerkId: userId },
          create: { clerkId: userId, email },
        },
      },
    },
  })
  return NextResponse.json(created)
}
