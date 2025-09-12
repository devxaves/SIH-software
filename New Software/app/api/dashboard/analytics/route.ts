import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Check authentication
    let userId: string | null = null
    try {
      const authResult = await auth()
      userId = authResult.userId
    } catch (authError) {
      console.warn("Auth error in analytics:", authError)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Initialize default response data
    const defaultResponse = {
      overview: {
        totalClaims: 0,
        pendingClaims: 0,
        approvedClaims: 0,
        rejectedClaims: 0,
        totalAssets: 0,
        approvalRate: 0,
        pendingRate: 0,
      },
      recentClaims: [],
      claimsByDistrict: [],
      claimsByMonth: [],
      assetsByType: [],
      processingTimes: [{ avg_days: 0 }],
    }

    // Test database connection first
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.error("Database connection failed:", dbError)
      return NextResponse.json(defaultResponse, { status: 200 })
    }

    // Get basic analytics with individual try-catch blocks
    let totalClaims = 0
    let pendingClaims = 0
    let approvedClaims = 0
    let rejectedClaims = 0
    let totalAssets = 0
    let recentClaims: any[] = []
    let claimsByDistrict: any[] = []
    let assetsByType: any[] = []

    try {
      totalClaims = await prisma.claim.count()
    } catch (error) {
      console.warn("Error counting total claims:", error)
    }

    try {
      pendingClaims = await prisma.claim.count({ where: { status: "PENDING" } })
    } catch (error) {
      console.warn("Error counting pending claims:", error)
    }

    try {
      approvedClaims = await prisma.claim.count({ where: { status: "APPROVED" } })
    } catch (error) {
      console.warn("Error counting approved claims:", error)
    }

    try {
      rejectedClaims = await prisma.claim.count({ where: { status: "REJECTED" } })
    } catch (error) {
      console.warn("Error counting rejected claims:", error)
    }

    try {
      totalAssets = await prisma.asset.count()
    } catch (error) {
      console.warn("Error counting assets:", error)
    }

    try {
      recentClaims = await prisma.claim.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          claimantName: true,
          status: true,
          createdAt: true,
          district: true,
        },
      })
    } catch (error) {
      console.warn("Error fetching recent claims:", error)
    }

    try {
      claimsByDistrict = await prisma.claim.groupBy({
        by: ["district"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      })
    } catch (error) {
      console.warn("Error fetching claims by district:", error)
    }

    try {
      assetsByType = await prisma.asset.groupBy({
        by: ["type"],
        _count: { id: true },
      })
    } catch (error) {
      console.warn("Error fetching assets by type:", error)
    }

    // Get monthly claims data with safer approach
    let claimsByMonth: any[] = []
    let processingTimes: any[] = []
    
    try {
      // Get claims from last 12 months using findMany instead of raw SQL
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
      
      const recentClaimsData = await prisma.claim.findMany({
        where: {
          createdAt: {
            gte: twelveMonthsAgo
          }
        },
        select: {
          createdAt: true,
          status: true,
          updatedAt: true
        }
      })

      // Process monthly data in JavaScript
      const monthlyData: { [key: string]: { [status: string]: number } } = {}
      recentClaimsData.forEach((claim: { createdAt: Date; status: string; updatedAt: Date }) => {
        const monthKey = claim.createdAt.toISOString().substring(0, 7) // YYYY-MM format
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {}
        }
        if (!monthlyData[monthKey][claim.status]) {
          monthlyData[monthKey][claim.status] = 0
        }
        monthlyData[monthKey][claim.status]++
      })

      claimsByMonth = Object.entries(monthlyData).map(([month, statuses]) => ({
        month: new Date(month + '-01'),
        ...statuses
      })).sort((a, b) => b.month.getTime() - a.month.getTime())

      // Calculate processing times in JavaScript
      const processedClaims = recentClaimsData.filter((claim: { status: string }) => claim.status !== 'PENDING')
      const avgProcessingDays = processedClaims.length > 0
        ? processedClaims.reduce((sum: number, claim: { createdAt: Date; updatedAt: Date }) => {
            const diffTime = claim.updatedAt.getTime() - claim.createdAt.getTime()
            const diffDays = diffTime / (1000 * 60 * 60 * 24)
            return sum + diffDays
          }, 0) / processedClaims.length
        : 0

      processingTimes = [{ avg_days: avgProcessingDays }]
    } catch (error) {
      console.warn("Error fetching advanced analytics:", error)
      // Fallback to empty arrays if advanced queries fail
      claimsByMonth = []
      processingTimes = [{ avg_days: 0 }]
    }

    // Calculate rates
    const approvalRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0
    const pendingRate = totalClaims > 0 ? (pendingClaims / totalClaims) * 100 : 0

    // Serialize data to ensure JSON compatibility
    const serializedClaimsByMonth = claimsByMonth.map((item: any) => ({
      month: item.month ? item.month.toISOString() : null,
      PENDING: item.PENDING || 0,
      APPROVED: item.APPROVED || 0,
      REJECTED: item.REJECTED || 0,
    }))

    const serializedProcessingTimes = processingTimes.map((item: any) => ({
      avg_days: typeof item.avg_days === 'number' ? Math.round(item.avg_days * 100) / 100 : 0
    }))

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
    return NextResponse.json({ 
      error: "Failed to fetch analytics",
      overview: {
        totalClaims: 0,
        pendingClaims: 0,
        approvedClaims: 0,
        rejectedClaims: 0,
        totalAssets: 0,
        approvalRate: 0,
        pendingRate: 0,
      },
      recentClaims: [],
      claimsByDistrict: [],
      claimsByMonth: [],
      assetsByType: [],
      processingTimes: [{ avg_days: 0 }],
    }, { status: 500 })
  } finally {
    // Ensure database connection is closed
    await prisma.$disconnect()
  }
}
