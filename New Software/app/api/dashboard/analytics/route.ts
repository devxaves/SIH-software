import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get comprehensive analytics
    const [
      totalClaims,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      totalAssets,
      recentClaims,
      claimsByDistrict,
      claimsByMonth,
      assetsByType,
      processingTimes,
    ] = await Promise.all([
      prisma.claim.count(),
      prisma.claim.count({ where: { status: "PENDING" } }),
      prisma.claim.count({ where: { status: "APPROVED" } }),
      prisma.claim.count({ where: { status: "REJECTED" } }),
      prisma.asset.count(),
      prisma.claim.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          claimantName: true,
          status: true,
          createdAt: true,
          district: true,
        },
      }),
      prisma.claim.groupBy({
        by: ["district"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as count,
          status
        FROM "Claim" 
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt"), status
        ORDER BY month DESC
      ` as any[],
      prisma.asset.groupBy({
        by: ["type"],
        _count: { id: true },
      }),
      prisma.$queryRaw`
        SELECT 
          AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))/86400) as avg_days
        FROM "Claim" 
        WHERE status != 'PENDING'
      ` as any[],
    ])

    // Convert BigInt values to numbers for JSON serialization
    const serializedClaimsByMonth = claimsByMonth.map((item: any) => ({
      ...item,
      count: Number(item.count)
    }))

    const serializedProcessingTimes = processingTimes.map((item: any) => ({
      ...item,
      avg_days: item.avg_days ? Number(item.avg_days) : 0
    }))

    const approvalRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0
    const pendingRate = totalClaims > 0 ? (pendingClaims / totalClaims) * 100 : 0

    return NextResponse.json({
      overview: {
        totalClaims,
        pendingClaims,
        approvedClaims,
        rejectedClaims,
        totalAssets,
        approvalRate: Math.round(approvalRate * 100) / 100,
        pendingRate: Math.round(pendingRate * 100) / 100,
      },
      recentClaims,
      claimsByDistrict,
      claimsByMonth: serializedClaimsByMonth,
      assetsByType,
      processingTimes: serializedProcessingTimes,
    })
  } catch (error) {
    console.error("Dashboard analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
