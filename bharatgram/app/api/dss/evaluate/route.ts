import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { DSSEngine, enrichClaimContext, getDefaultThresholds } from "@/lib/dss-engine"

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

    if (!claimId) {
      return NextResponse.json({ error: "claimId is required" }, { status: 400 })
    }

    console.log("[DSS] Evaluating rules for claim:", claimId)

    // Get claim data
    const claim = await prisma.claim.findUnique({
      where: { id: Number(claimId) },
    })

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Get current policy thresholds from database
    const policyThresholds = await prisma.policyThreshold.findMany()
    const thresholdMap = policyThresholds.reduce((acc, pt) => {
      acc[pt.parameter] = pt.value
      return acc
    }, {} as any)

    // Use provided thresholds for simulation, or database thresholds, or defaults
    const engineThresholds = {
      waterIndex: thresholds?.water_index ?? thresholdMap.water_index ?? getDefaultThresholds().waterIndex,
      forestCover: thresholds?.forest_cover ?? thresholdMap.forest_cover ?? getDefaultThresholds().forestCover,
      maxAreaHa: thresholds?.max_area_ha ?? thresholdMap.max_area_ha ?? getDefaultThresholds().maxAreaHa,
      minAreaHa: thresholds?.min_area_ha ?? thresholdMap.min_area_ha ?? getDefaultThresholds().minAreaHa,
      populationDensity: thresholds?.population_density ?? thresholdMap.population_density ?? getDefaultThresholds().populationDensity,
    }

    console.log("[DSS] Using thresholds:", engineThresholds)

    // Initialize DSS engine with thresholds
    const dssEngine = new DSSEngine(engineThresholds)

    // Enrich claim with environmental context
    const enrichedClaim = await enrichClaimContext(claim)
    console.log("[DSS] Enriched claim context:", {
      id: enrichedClaim.id,
      village: enrichedClaim.village,
      waterIndex: enrichedClaim.waterIndex,
      forestCover: enrichedClaim.forestCover,
      populationDensity: enrichedClaim.populationDensity,
    })

    // Evaluate rules to get recommendations
    const ruleActions = dssEngine.evaluateRules(enrichedClaim)

    if (ruleActions.length === 0) {
      console.log("[DSS] No rules matched for claim:", claimId)
      return NextResponse.json({
        claimId: claim.id,
        recommendations: [],
        context: enrichedClaim,
        thresholds: engineThresholds,
        message: "No scheme recommendations generated for this claim based on current thresholds"
      })
    }

    // Delete existing recommendations for this claim to avoid duplicates
    await prisma.dSSRecommendation.deleteMany({
      where: { claimId: claim.id }
    })

    // Save new recommendations to database
    const savedRecommendations = await Promise.all(
      ruleActions.map((action) =>
        prisma.dSSRecommendation.create({
          data: {
            claimId: claim.id,
            scheme: action.scheme,
            reason: action.reason,
            priority: action.priority,
          },
        }),
      ),
    )

    console.log("[DSS] Saved", savedRecommendations.length, "recommendations")

    return NextResponse.json({
      success: true,
      claimId: claim.id,
      recommendations: savedRecommendations,
      context: {
        claimDetails: {
          id: enrichedClaim.id,
          claimant: enrichedClaim.claimantName,
          village: enrichedClaim.village,
          district: enrichedClaim.district,
          type: enrichedClaim.type,
          area: enrichedClaim.area,
          status: enrichedClaim.status,
        },
        environmentalData: {
          waterIndex: enrichedClaim.waterIndex,
          forestCover: enrichedClaim.forestCover,
          populationDensity: enrichedClaim.populationDensity,
          nearbyAssets: enrichedClaim.nearbyAssets,
        },
      },
      thresholds: engineThresholds,
      rulesEvaluated: dssEngine.getRules().filter(r => r.active).length,
    })
  } catch (error: any) {
    console.error("[DSS] Evaluation failed:", error)
    return NextResponse.json({ 
      error: error.message || "Internal server error during evaluation",
      details: error.stack 
    }, { status: 500 })
  }
}