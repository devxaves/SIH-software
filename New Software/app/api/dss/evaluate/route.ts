import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { DSSEngine, enrichClaimContext } from "@/lib/dss-engine"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { claimId, thresholds } = body

    console.log("[v0] Evaluating DSS rules for claim:", claimId)

    // Get claim data
    const claim = await prisma.claim.findUnique({
      where: { id: Number(claimId) },
    })

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Get current policy thresholds
    const policyThresholds = await prisma.policyThreshold.findMany()
    const thresholdMap = policyThresholds.reduce((acc, pt) => {
      acc[pt.parameter] = pt.value
      return acc
    }, {} as any)

    // Use provided thresholds or defaults
    const engineThresholds = {
      waterIndex: thresholds?.waterIndex ?? thresholdMap.water_index ?? 0.5,
      forestCover: thresholds?.forestCover ?? thresholdMap.forest_cover ?? 0.4,
      maxAreaHa: thresholds?.maxAreaHa ?? thresholdMap.max_area_ha ?? 5.0,
      minAreaHa: thresholds?.minAreaHa ?? thresholdMap.min_area_ha ?? 0.5,
      populationDensity: thresholds?.populationDensity ?? thresholdMap.population_density ?? 100,
    }

    // Initialize DSS engine
    const dssEngine = new DSSEngine(engineThresholds)

    // Enrich claim with environmental context
    const enrichedClaim = await enrichClaimContext(claim)

    // Evaluate rules
    const recommendations = dssEngine.evaluateRules(enrichedClaim)

    // Save recommendations to database
    const savedRecommendations = await Promise.all(
      recommendations.map((rec) =>
        prisma.dSSRecommendation.create({
          data: {
            claimId: claim.id,
            scheme: rec.scheme,
            reason: rec.reason,
            priority: rec.priority,
          },
        }),
      ),
    )

    console.log("[v0] Saved", savedRecommendations.length, "recommendations")

    return NextResponse.json({
      claimId: claim.id,
      recommendations: savedRecommendations,
      context: enrichedClaim,
      thresholds: engineThresholds,
    })
  } catch (error: any) {
    console.error("[v0] DSS evaluation failed:", error)
    return NextResponse.json({ error: error.message || "Evaluation failed" }, { status: 500 })
  }
}
