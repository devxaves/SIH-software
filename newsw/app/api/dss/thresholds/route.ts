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
    console.error("[Thresholds] GET failed:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch thresholds" }, { status: 500 })
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

    if (!parameter || value === undefined) {
      return NextResponse.json({ 
        error: "Parameter and value are required" 
      }, { status: 400 })
    }

    // Validate parameter names
    const validParameters = [
      "water_index", 
      "forest_cover", 
      "max_area_ha", 
      "min_area_ha", 
      "population_density"
    ]
    
    if (!validParameters.includes(parameter)) {
      return NextResponse.json({ 
        error: `Invalid parameter. Must be one of: ${validParameters.join(", ")}` 
      }, { status: 400 })
    }

    // Validate value ranges
    const numValue = Number(value)
    if (isNaN(numValue)) {
      return NextResponse.json({ 
        error: "Value must be a valid number" 
      }, { status: 400 })
    }

    // Parameter-specific validations
    const validations: Record<string, (val: number) => boolean> = {
      water_index: (val) => val >= 0 && val <= 1,
      forest_cover: (val) => val >= 0 && val <= 1,
      max_area_ha: (val) => val > 0 && val <= 50,
      min_area_ha: (val) => val > 0 && val <= 10,
      population_density: (val) => val >= 0 && val <= 2000,
    }

    if (validations[parameter] && !validations[parameter](numValue)) {
      const ranges: Record<string, string> = {
        water_index: "0.0 to 1.0",
        forest_cover: "0.0 to 1.0", 
        max_area_ha: "0.1 to 50.0",
        min_area_ha: "0.1 to 10.0",
        population_density: "0 to 2000",
      }
      return NextResponse.json({ 
        error: `Invalid value for ${parameter}. Must be between ${ranges[parameter]}` 
      }, { status: 400 })
    }

    const threshold = await prisma.policyThreshold.upsert({
      where: { parameter },
      update: { 
        value: numValue, 
        unit: unit || getDefaultUnit(parameter), 
        description: description || getDefaultDescription(parameter),
      },
      create: { 
        parameter, 
        value: numValue, 
        unit: unit || getDefaultUnit(parameter), 
        description: description || getDefaultDescription(parameter),
      },
    })

    console.log("[Thresholds] Updated:", parameter, "=", numValue)
    return NextResponse.json(threshold)
  } catch (error: any) {
    console.error("[Thresholds] POST failed:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to update threshold" 
    }, { status: 500 })
  }
}

function getDefaultUnit(parameter: string): string {
  const units: Record<string, string> = {
    water_index: "index",
    forest_cover: "ratio",
    max_area_ha: "hectares",
    min_area_ha: "hectares", 
    population_density: "per km²",
  }
  return units[parameter] || ""
}

function getDefaultDescription(parameter: string): string {
  const descriptions: Record<string, string> = {
    water_index: "Water availability index threshold for scheme eligibility",
    forest_cover: "Forest cover ratio threshold for conservation programs",
    max_area_ha: "Maximum land area for individual farmer schemes",
    min_area_ha: "Minimum land area required for scheme eligibility",
    population_density: "Population density threshold for rural development programs",
  }
  return descriptions[parameter] || ""
}