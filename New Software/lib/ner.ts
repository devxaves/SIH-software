export interface NEREntity {
  entity: string
  score: number
  index: number
  word: string
  start: number
  end: number
}

export interface ExtractedEntities {
  persons: string[]
  locations: string[]
  organizations: string[]
  coordinates: string[]
  areas: string[]
  claimTypes: string[]
  statuses: string[]
}

export async function extractEntitiesWithNER(text: string): Promise<ExtractedEntities> {
  try {
    const response = await fetch("https://api-inference.huggingface.co/models/dslim/bert-base-NER", {
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ inputs: text }),
    })

    if (!response.ok) {
      throw new Error(`NER API failed: ${response.statusText}`)
    }

    const entities: NEREntity[] = await response.json()

    return categorizeEntities(entities, text)
  } catch (error) {
    console.error("NER extraction failed:", error)
    // Fallback to regex-based extraction
    return extractEntitiesWithRegex(text)
  }
}

function categorizeEntities(entities: NEREntity[], text: string): ExtractedEntities {
  const result: ExtractedEntities = {
    persons: [],
    locations: [],
    organizations: [],
    coordinates: [],
    areas: [],
    claimTypes: [],
    statuses: [],
  }

  // Group consecutive entities of same type
  const groupedEntities = groupConsecutiveEntities(entities)

  groupedEntities.forEach((entity) => {
    const word = entity.word.replace(/^##/, "") // Remove BERT subword markers

    switch (entity.entity) {
      case "B-PER":
      case "I-PER":
        if (!result.persons.includes(word)) {
          result.persons.push(word)
        }
        break
      case "B-LOC":
      case "I-LOC":
        if (!result.locations.includes(word)) {
          result.locations.push(word)
        }
        break
      case "B-ORG":
      case "I-ORG":
        if (!result.organizations.includes(word)) {
          result.organizations.push(word)
        }
        break
    }
  })

  // Extract domain-specific entities using regex patterns
  const domainEntities = extractDomainSpecificEntities(text)
  result.coordinates = domainEntities.coordinates
  result.areas = domainEntities.areas
  result.claimTypes = domainEntities.claimTypes
  result.statuses = domainEntities.statuses

  return result
}

function groupConsecutiveEntities(entities: NEREntity[]): NEREntity[] {
  const grouped: NEREntity[] = []
  let current: NEREntity | null = null

  entities.forEach((entity) => {
    if (entity.entity.startsWith("B-") || !current || !entity.entity.startsWith("I-")) {
      if (current) grouped.push(current)
      current = { ...entity }
    } else if (current && entity.entity.startsWith("I-")) {
      // Merge consecutive entities
      current.word += " " + entity.word.replace(/^##/, "")
      current.end = entity.end
      current.score = Math.min(current.score, entity.score)
    }
  })

  if (current) grouped.push(current)
  return grouped
}

function extractDomainSpecificEntities(text: string): Partial<ExtractedEntities> {
  const coordinates = extractCoordinates(text)
  const areas = extractAreas(text)
  const claimTypes = extractClaimTypes(text)
  const statuses = extractStatuses(text)

  return { coordinates, areas, claimTypes, statuses }
}

function extractCoordinates(text: string): string[] {
  const coordPatterns = [
    /(\d{1,3}°\s*\d{1,2}'\s*\d{1,2}(?:\.\d+)?"?\s*[NSEW])/gi,
    /(\d{1,3}\.\d+°?\s*[NSEW])/gi,
    /(\d{1,3}\.\d+,\s*\d{1,3}\.\d+)/gi,
  ]

  const coords: string[] = []
  coordPatterns.forEach((pattern) => {
    const matches = text.match(pattern)
    if (matches) coords.push(...matches)
  })

  return [...new Set(coords)]
}

function extractAreas(text: string): string[] {
  const areaPattern = /([\d.,]+)\s*(hectares?|ha|acres?|sq\.?\s*m)/gi
  const matches = text.match(areaPattern)
  return matches ? [...new Set(matches)] : []
}

function extractClaimTypes(text: string): string[] {
  const types: string[] = []
  const lower = text.toLowerCase()

  if (/(ifr|individual forest right)/i.test(lower)) types.push("IFR")
  if (/(cr|community right)/i.test(lower)) types.push("CR")
  if (/(cfr|community forest resource)/i.test(lower)) types.push("CFR")

  return types
}

function extractStatuses(text: string): string[] {
  const statuses: string[] = []
  const lower = text.toLowerCase()

  if (/granted|approved|sanctioned/i.test(lower)) statuses.push("Granted")
  if (/pending|under review|processing/i.test(lower)) statuses.push("Pending")
  if (/rejected|denied|cancelled/i.test(lower)) statuses.push("Rejected")

  return statuses
}

// Fallback regex-based extraction
function extractEntitiesWithRegex(text: string): ExtractedEntities {
  return {
    persons: extractPersonNames(text),
    locations: extractLocationNames(text),
    organizations: extractOrganizations(text),
    coordinates: extractCoordinates(text),
    areas: extractAreas(text),
    claimTypes: extractClaimTypes(text),
    statuses: extractStatuses(text),
  }
}

function extractPersonNames(text: string): string[] {
  const namePatterns = [
    /(claimant|name|applicant)\s*[:-]\s*([A-Za-z][A-Za-z\s.]{2,30})/gi,
    /(mr|mrs|ms|dr|shri|smt)\.?\s+([A-Za-z][A-Za-z\s.]{2,30})/gi,
  ]

  const names: string[] = []
  namePatterns.forEach((pattern) => {
    const matches = [...text.matchAll(pattern)]
    matches.forEach((match) => {
      if (match[2]) names.push(match[2].trim())
    })
  })

  return [...new Set(names)]
}

function extractLocationNames(text: string): string[] {
  const locationPatterns = [
    /(village|gram|panchayat|district|block|tehsil)\s*[:-]\s*([A-Za-z][A-Za-z\s.]{2,30})/gi,
    /(in|at|near)\s+([A-Z][A-Za-z\s]{2,20})\s+(village|gram|district)/gi,
  ]

  const locations: string[] = []
  locationPatterns.forEach((pattern) => {
    const matches = [...text.matchAll(pattern)]
    matches.forEach((match) => {
      const location = match[2] || match[1]
      if (location) locations.push(location.trim())
    })
  })

  return [...new Set(locations)]
}

function extractOrganizations(text: string): string[] {
  const orgPatterns = [
    /(forest department|revenue department|collector office|tehsildar|sarpanch)/gi,
    /(committee|panchayat|council|board)\s+([A-Za-z\s]{3,30})/gi,
  ]

  const orgs: string[] = []
  orgPatterns.forEach((pattern) => {
    const matches = text.match(pattern)
    if (matches) orgs.push(...matches)
  })

  return [...new Set(orgs)]
}
