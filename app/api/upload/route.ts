import { type NextRequest, NextResponse } from "next/server"
import Tesseract from "tesseract.js"

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

    const { data } = await Tesseract.recognize(buffer, "eng", {
      logger: () => {},
    })

    const parsed = parseFields(data.text || "")
    return NextResponse.json({ text: data.text, fields: parsed })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "OCR failed" }, { status: 500 })
  }
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
