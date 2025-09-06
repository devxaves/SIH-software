import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const thresholds = await prisma.policyThreshold.findMany({
      orderBy: { parameter: "asc" },
    })
    return NextResponse.json(thresholds)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { parameter, value, unit, description } = body

    const threshold = await prisma.policyThreshold.upsert({
      where: { parameter },
      update: { value: Number(value), unit, description },
      create: { parameter, value: Number(value), unit, description },
    })

    return NextResponse.json(threshold)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
