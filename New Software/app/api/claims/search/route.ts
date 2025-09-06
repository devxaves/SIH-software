import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const query = searchParams.get("q") || ""
    const village = searchParams.get("village") || ""
    const type = searchParams.get("type") || ""
    const status = searchParams.get("status") || ""
    const dateFrom = searchParams.get("dateFrom") || ""
    const dateTo = searchParams.get("dateTo") || ""
    const minArea = searchParams.get("minArea") || ""
    const maxArea = searchParams.get("maxArea") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    console.log("[v0] Archive search query:", { query, village, type, status, page })

    // Build where clause for filtering
    const where: any = {}

    // Text search across multiple fields
    if (query) {
      where.OR = [
        { claimant: { contains: query, mode: "insensitive" } },
        { village: { contains: query, mode: "insensitive" } },
        { type: { contains: query, mode: "insensitive" } },
        { status: { contains: query, mode: "insensitive" } },
      ]
    }

    // Specific field filters
    if (village) {
      where.village = { contains: village, mode: "insensitive" }
    }
    if (type) {
      where.type = type
    }
    if (status) {
      where.status = status
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo + "T23:59:59.999Z")
      }
    }

    // Area range filter
    if (minArea || maxArea) {
      where.area = {}
      if (minArea) {
        where.area.gte = Number.parseFloat(minArea)
      }
      if (maxArea) {
        where.area.lte = Number.parseFloat(maxArea)
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.claim.count({ where })

    // Get paginated results
    const claims = await prisma.claim.findMany({
      where,
      include: {
        user: true,
        dss: {
          orderBy: { priority: "asc" },
          take: 3, // Include top 3 DSS recommendations
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    })

    const totalPages = Math.ceil(totalCount / limit)

    console.log("[v0] Archive search results:", claims.length, "of", totalCount, "total")

    return NextResponse.json({
      claims,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error: any) {
    console.error("[v0] Archive search failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
