import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const recommendations = await prisma.dSSRecommendation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        claim: {
          select: {
            id: true,
            claimantName: true,
            village: true,
            district: true,
            type: true,
            status: true,
          }
        }
      }
    })
    
    return NextResponse.json(
      recommendations.map((r) => ({
        id: r.id,
        claimId: r.claimId,
        scheme: r.scheme,
        reason: r.reason,
        priority: r.priority,
        createdAt: r.createdAt.toISOString(),
        claim: r.claim,
      })),
    )
  } catch (error: any) {
    console.error("[DSS] GET recommendations failed:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to fetch recommendations" 
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { claimId, scheme, reason, priority = 3 } = body

    if (!claimId || !scheme || !reason) {
      return NextResponse.json({ 
        error: "claimId, scheme, and reason are required" 
      }, { status: 400 })
    }

    // Validate that the claim exists
    const claim = await prisma.claim.findUnique({
      where: { id: Number(claimId) }
    })

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    const recommendation = await prisma.dSSRecommendation.create({
      data: {
        claimId: Number(claimId),
        scheme: String(scheme),
        reason: String(reason),
        priority: Number(priority),
      },
      include: {
        claim: {
          select: {
            id: true,
            claimantName: true,
            village: true,
            district: true,
            type: true,
            status: true,
          }
        }
      }
    })

    return NextResponse.json({
      ...recommendation,
      createdAt: recommendation.createdAt.toISOString(),
    })
  } catch (error: any) {
    console.error("[DSS] POST recommendation failed:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to create recommendation" 
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const claimId = searchParams.get('claimId')

    if (id) {
      // Delete specific recommendation
      await prisma.dSSRecommendation.delete({
        where: { id: Number(id) }
      })
      return NextResponse.json({ message: "Recommendation deleted successfully" })
    } else if (claimId) {
      // Delete all recommendations for a claim
      const result = await prisma.dSSRecommendation.deleteMany({
        where: { claimId: Number(claimId) }
      })
      return NextResponse.json({ 
        message: `Deleted ${result.count} recommendations for claim ${claimId}` 
      })
    } else {
      return NextResponse.json({ 
        error: "Either 'id' or 'claimId' parameter is required" 
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error("[DSS] DELETE recommendation failed:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to delete recommendation" 
    }, { status: 500 })
  }
}