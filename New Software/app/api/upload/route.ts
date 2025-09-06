import { type NextRequest, NextResponse } from "next/server"
import Tesseract from "tesseract.js"
import { extractEntitiesWithNER } from "@/lib/ner"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get("file")
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log("[v0] Starting OCR processing for file:", file.name)
    const { data } = await Tesseract.recognize(buffer, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`[v0] OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      },
    })

    const rawText = data.text || ""
    console.log("[v0] OCR completed, text length:", rawText.length)

    console.log("[v0] Starting NER entity extraction...")
    const nerEntities = await extractEntitiesWithNER(rawText)
    console.log("[v0] NER extraction completed:", Object.keys(nerEntities))

    const parsed = parseFieldsWithNER(rawText, nerEntities)
    console.log("[v0] Parsed fields:", parsed)

    const ocrDoc = await prisma.oCRDocument.create({
      data: {
        filename: file.name,
        rawText,
        nerEntities: nerEntities as any,
        processed: true,
      },
    })

    return NextResponse.json({
      text: rawText,
      fields: parsed,
      nerEntities,
      documentId: ocrDoc.id,
    })
  } catch (e: any) {
    console.error("[v0] OCR/NER processing failed:", e)
    return NextResponse.json({ error: e?.message || "OCR failed" }, { status: 500 })
  }
}

function parseFieldsWithNER(text: string, entities: any) {
  const result: any = {}

  if (entities.persons && entities.persons.length > 0) {
    result.claimant = entities.persons[0]
  }

  if (entities.locations && entities.locations.length > 0) {
    result.village =
      entities.locations.find((loc: string) =>
        /village|gram/i.test(
          text.substring(
            text.toLowerCase().indexOf(loc.toLowerCase()) - 20,
            text.toLowerCase().indexOf(loc.toLowerCase()) + 20,
          ),
        ),
      ) || entities.locations[0]
  }

  if (entities.areas && entities.areas.length > 0) {
    const areaMatch = entities.areas[0].match(/([\d.,]+)/)
    if (areaMatch) {
      result.area = Number(areaMatch[1].replace(/,/g, ""))
    }
  }

  if (entities.claimTypes && entities.claimTypes.length > 0) {
    result.type = entities.claimTypes[0]
  }

  if (entities.statuses && entities.statuses.length > 0) {
    result.status = entities.statuses[0]
  }

  if (entities.coordinates && entities.coordinates.length > 0) {
    result.coordinates = entities.coordinates[0]
  }

  const fallback = parseFields(text)

  return {
    claimant: result.claimant || fallback.claimant,
    village: result.village || fallback.village,
    area: result.area || fallback.area,
    type: result.type || fallback.type,
    status: result.status || "Pending",
    coordinates: result.coordinates,
    confidence: calculateConfidence(result, entities),
  }
}

function calculateConfidence(parsed: any, entities: any): number {
  let score = 0
  let total = 0

  if (parsed.claimant) {
    score += entities.persons?.length > 0 ? 0.9 : 0.5
    total += 1
  }
  if (parsed.village) {
    score += entities.locations?.length > 0 ? 0.9 : 0.5
    total += 1
  }
  if (parsed.area) {
    score += entities.areas?.length > 0 ? 0.9 : 0.6
    total += 1
  }
  if (parsed.type) {
    score += entities.claimTypes?.length > 0 ? 0.95 : 0.7
    total += 1
  }

  return total > 0 ? score / total : 0.5
}

function parseFields(text: string) {
  const lower = text.toLowerCase()
  const claimant = matchAfter(text, /(claimant|name)\s*[:-]\s*([A-Za-z .]+)/i)
  const village = matchAfter(text, /(village|gram|panchayat)\s*[:-]\s*([A-Za-z .]+)/i)
  const areaStr = matchAfter(text, /(area|hectares?|ha)\s*[:-]?\s*([\d.,]+)/i)
  const area = areaStr ? Number(areaStr.replace(/,/g, "")) : undefined
  const type = /(ifr|individual forest right)/i.test(lower)
    ? "IFR"
    : /(cr|community right)/i.test(lower)
      ? "CR"
      : /(cfr|community forest resource)/i.test(lower)
        ? "CFR"
        : undefined

  return { claimant, village, area, type }
}

function matchAfter(text: string, re: RegExp) {
  const m = text.match(re)
  return m?.[2]?.trim()
}
