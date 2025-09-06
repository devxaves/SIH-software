import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { classifySatelliteImage } from "@/lib/ai-classification"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { imageData, bounds, village, model = "mock" } = body

    if (!imageData || !bounds || !Array.isArray(bounds) || bounds.length !== 4) {
      return NextResponse.json({ error: "Invalid image data or bounds" }, { status: 400 })
    }

    console.log("[v0] Processing AI classification request for village:", village)

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData, "base64")

    // Run AI classification
    const analysis = await classifySatelliteImage(imageBuffer, bounds, village || "Unknown")

    console.log("[v0] Classification completed, saving", analysis.classifications.length, "assets")

    // Save classified assets to database
    const savedAssets = await Promise.all(
      analysis.classifications
        .filter((c) => c.confidence > 0.75) // Only save high-confidence classifications
        .map(async (classification) => {
          return prisma.asset.create({
            data: {
              type: classification.type,
              coords: {
                type: "Point",
                coordinates: classification.coordinates,
              },
              village: village || "AI-Detected",
              source: "Satellite",
              name: `AI-${classification.type}-${Date.now()}`,
              owner: null,
            },
          })
        }),
    )

    console.log("[v0] Saved", savedAssets.length, "high-confidence assets to database")

    return NextResponse.json({
      analysis,
      savedAssets: savedAssets.length,
      totalDetected: analysis.classifications.length,
    })
  } catch (error: any) {
    console.error("[v0] AI classification failed:", error)
    return NextResponse.json({ error: error.message || "Classification failed" }, { status: 500 })
  }
}
