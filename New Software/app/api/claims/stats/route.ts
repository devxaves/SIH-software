import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("[v0] Generating archive statistics...")

    // Basic counts
    const totalClaims = await prisma.claim.count()
    const grantedClaims = await prisma.claim.count({ where: { status: "Granted" } })
    const pendingClaims = await prisma.claim.count({ where: { status: "Pending" } })
    const rejectedClaims = await prisma.claim.count({ where: { status: "Rejected" } })

    // Area statistics
    const areaStats = await prisma.claim.aggregate({
      _sum: { area: true },
      _avg: { area: true },
      _max: { area: true },
    })

    // Claims by type
    const claimsByType = await prisma.claim.groupBy({
      by: ["type"],
      _count: { type: true },
    })

    // Claims by village (top 10)
    const claimsByVillage = await prisma.claim.groupBy({
      by: ["village"],
      _count: { village: true },
      orderBy: { _count: { village: "desc" } },
      take: 10,
    })

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentClaims = await prisma.claim.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    })

    // Claims with OCR/NER data
    const ocrProcessedClaims = await prisma.claim.count({
      where: { nerData: { not: null } },
    })

    // DSS recommendations count
    const totalRecommendations = await prisma.dSSRecommendation.count()

    console.log("[v0] Archive statistics generated successfully")

    return NextResponse.json({
      overview: {
        totalClaims,
        grantedClaims,
        pendingClaims,
        rejectedClaims,
        recentClaims,
        ocrProcessedClaims,
        totalRecommendations,
      },
      area: {
        totalArea: areaStats._sum.area || 0,
        averageArea: areaStats._avg.area || 0,
        maxArea: areaStats._max.area || 0,
      },
      distribution: {
        byType: claimsByType.map((item) => ({
          type: item.type,
          count: item._count.type,
        })),
        byVillage: claimsByVillage.map((item) => ({
          village: item.village,
          count: item._count.village,
        })),
      },
    })
  } catch (error: any) {
    console.error("[v0] Archive statistics failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
