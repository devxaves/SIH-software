// lib/dss-engine.ts
export interface DSSRule {
  id: string
  name: string
  condition: RuleCondition
  action: RuleAction
  priority: number
  active: boolean
}

export interface RuleCondition {
  type: "and" | "or" | "simple"
  conditions?: RuleCondition[]
  field?: string
  operator?: "eq" | "gt" | "lt" | "gte" | "lte" | "contains" | "in"
  value?: any
}

export interface RuleAction {
  scheme: string
  reason: string
  priority: number
  metadata?: any
}

export interface PolicyThresholds {
  waterIndex: number
  forestCover: number
  maxAreaHa: number
  minAreaHa: number
  populationDensity: number
}

export interface ClaimContext {
  id: number
  claimant: string
  claimantName: string
  village: string
  district: string
  type: string
  area: number
  status: string
  coords: any
  waterIndex?: number
  forestCover?: number
  populationDensity?: number
  nearbyAssets?: string[]
}

export class DSSEngine {
  private rules: DSSRule[] = []
  private thresholds: PolicyThresholds

  constructor(thresholds: PolicyThresholds) {
    this.thresholds = thresholds
    this.initializeDefaultRules()
  }

  private initializeDefaultRules() {
    this.rules = [
      {
        id: "water-scarcity-jal-jeevan",
        name: "Water Scarcity - Jal Jeevan Mission",
        condition: {
          type: "and",
          conditions: [
            { type: "simple", field: "status", operator: "eq", value: "Granted" },
            { type: "simple", field: "area", operator: "gt", value: 0.5 },
            { type: "simple", field: "waterIndex", operator: "lt", value: this.thresholds.waterIndex },
          ],
        },
        action: {
          scheme: "Jal Jeevan Mission",
          reason: `Low water availability (index < ${this.thresholds.waterIndex}) requires water infrastructure development`,
          priority: 1,
        },
        priority: 1,
        active: true,
      },
      {
        id: "water-scarcity-irrigation",
        name: "Irrigation Support for Water Scarce Areas",
        condition: {
          type: "and",
          conditions: [
            { type: "simple", field: "waterIndex", operator: "lt", value: this.thresholds.waterIndex },
            { type: "simple", field: "type", operator: "in", value: ["IFR", "Agricultural"] },
          ],
        },
        action: {
          scheme: "Pradhan Mantri Krishi Sinchayee Yojana",
          reason: "Water scarcity in agricultural land requires irrigation support",
          priority: 2,
        },
        priority: 2,
        active: true,
      },
      {
        id: "forest-restoration-campa",
        name: "Forest Restoration under CAMPA",
        condition: {
          type: "and",
          conditions: [
            { type: "simple", field: "forestCover", operator: "gt", value: this.thresholds.forestCover },
            { type: "simple", field: "type", operator: "in", value: ["IFR", "CFR"] },
            { type: "simple", field: "status", operator: "eq", value: "Granted" },
          ],
        },
        action: {
          scheme: "CAMPA - Forest Conservation Program",
          reason: `High forest cover (${this.thresholds.forestCover * 100}%+) suitable for conservation activities`,
          priority: 2,
        },
        priority: 2,
        active: true,
      },
      {
        id: "pm-kisan-eligible",
        name: "PM-KISAN Farmer Support",
        condition: {
          type: "and",
          conditions: [
            { type: "simple", field: "status", operator: "eq", value: "Granted" },
            { type: "simple", field: "area", operator: "gte", value: this.thresholds.minAreaHa },
            { type: "simple", field: "area", operator: "lte", value: this.thresholds.maxAreaHa },
            { type: "simple", field: "type", operator: "in", value: ["IFR", "Agricultural"] },
          ],
        },
        action: {
          scheme: "PM-KISAN Samman Nidhi",
          reason: `Land area (${this.thresholds.minAreaHa}-${this.thresholds.maxAreaHa} ha) eligible for farmer income support`,
          priority: 1,
        },
        priority: 1,
        active: true,
      },
      {
        id: "mgnrega-employment",
        name: "MGNREGA Employment Guarantee",
        condition: {
          type: "and",
          conditions: [
            { type: "simple", field: "populationDensity", operator: "lt", value: this.thresholds.populationDensity },
            { type: "simple", field: "status", operator: "eq", value: "Granted" },
          ],
        },
        action: {
          scheme: "MGNREGA",
          reason: `Low population density area (< ${this.thresholds.populationDensity}/km²) needs employment guarantee schemes`,
          priority: 1,
        },
        priority: 1,
        active: true,
      },
      {
        id: "tribal-education-eklavya",
        name: "Tribal Education - Eklavya Schools",
        condition: {
          type: "and",
          conditions: [
            { type: "simple", field: "status", operator: "eq", value: "Granted" },
            { type: "simple", field: "type", operator: "in", value: ["IFR", "CFR", "CR"] },
          ],
        },
        action: {
          scheme: "Eklavya Model Residential Schools",
          reason: "Tribal community eligible for specialized educational infrastructure",
          priority: 2,
        },
        priority: 2,
        active: true,
      },
      {
        id: "housing-pmay",
        name: "Rural Housing Support",
        condition: {
          type: "and",
          conditions: [
            { type: "simple", field: "status", operator: "eq", value: "Granted" },
            { type: "simple", field: "type", operator: "in", value: ["IFR", "Homestead"] },
          ],
        },
        action: {
          scheme: "Pradhan Mantri Awas Yojana - Gramin",
          reason: "FRA title holder with homestead rights eligible for rural housing support",
          priority: 2,
        },
        priority: 2,
        active: true,
      },
      {
        id: "livelihood-nrlm",
        name: "Livelihood Diversification",
        condition: {
          type: "and",
          conditions: [
            { type: "simple", field: "status", operator: "eq", value: "Granted" },
            { type: "simple", field: "area", operator: "gt", value: 1.0 },
          ],
        },
        action: {
          scheme: "National Rural Livelihood Mission (NRLM)",
          reason: "Forest-dependent community eligible for livelihood diversification programs",
          priority: 3,
        },
        priority: 3,
        active: true,
      },
      {
        id: "pending-claim-support",
        name: "Pending Claim Documentation Support",
        condition: {
          type: "simple",
          field: "status",
          operator: "eq",
          value: "Pending",
        },
        action: {
          scheme: "FRA Documentation Support",
          reason: "Pending claim requires documentation and legal assistance for approval",
          priority: 3,
        },
        priority: 3,
        active: true,
      },
      {
        id: "rejected-claim-assistance",
        name: "Rejected Claim Legal Assistance",
        condition: {
          type: "simple",
          field: "status",
          operator: "eq",
          value: "Rejected",
        },
        action: {
          scheme: "Legal Aid for FRA Claims",
          reason: "Rejected claim requires legal assistance and resubmission support",
          priority: 2,
        },
        priority: 2,
        active: true,
      },
    ]
  }

  evaluateRules(claim: ClaimContext): RuleAction[] {
    console.log("[DSS] Evaluating rules for claim:", claim.id)

    const recommendations: RuleAction[] = []

    for (const rule of this.rules.filter((r) => r.active)) {
      if (this.evaluateCondition(rule.condition, claim)) {
        console.log("[DSS] Rule matched:", rule.name)
        recommendations.push({
          ...rule.action,
          metadata: {
            ruleId: rule.id,
            ruleName: rule.name,
            evaluatedAt: new Date().toISOString(),
            claimContext: {
              id: claim.id,
              village: claim.village,
              district: claim.district,
              area: claim.area,
              status: claim.status,
            },
          },
        })
      }
    }

    // Sort by priority (lower number = higher priority)
    recommendations.sort((a, b) => a.priority - b.priority)

    console.log("[DSS] Generated", recommendations.length, "recommendations")
    return recommendations
  }

  private evaluateCondition(condition: RuleCondition, claim: ClaimContext): boolean {
    if (condition.type === "simple") {
      return this.evaluateSimpleCondition(condition, claim)
    }

    if (condition.type === "and") {
      return condition.conditions?.every((c) => this.evaluateCondition(c, claim)) ?? false
    }

    if (condition.type === "or") {
      return condition.conditions?.some((c) => this.evaluateCondition(c, claim)) ?? false
    }

    return false
  }

  private evaluateSimpleCondition(condition: RuleCondition, claim: ClaimContext): boolean {
    const { field, operator, value } = condition
    if (!field || !operator) return false

    const claimValue = (claim as any)[field]
    
    // Handle undefined/null values
    if (claimValue === undefined || claimValue === null) {
      return false
    }

    switch (operator) {
      case "eq":
        return claimValue === value
      case "gt":
        return Number(claimValue) > Number(value)
      case "lt":
        return Number(claimValue) < Number(value)
      case "gte":
        return Number(claimValue) >= Number(value)
      case "lte":
        return Number(claimValue) <= Number(value)
      case "contains":
        return String(claimValue).toLowerCase().includes(String(value).toLowerCase())
      case "in":
        return Array.isArray(value) ? value.includes(claimValue) : false
      default:
        return false
    }
  }

  updateThresholds(newThresholds: Partial<PolicyThresholds>) {
    this.thresholds = { ...this.thresholds, ...newThresholds }
    this.initializeDefaultRules() // Reinitialize rules with new thresholds
  }

  addRule(rule: DSSRule) {
    this.rules.push(rule)
  }

  updateRule(ruleId: string, updates: Partial<DSSRule>) {
    const index = this.rules.findIndex((r) => r.id === ruleId)
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates }
    }
  }

  getRules(): DSSRule[] {
    return [...this.rules]
  }

  getThresholds(): PolicyThresholds {
    return { ...this.thresholds }
  }
}

// Enhanced claim context with environmental data
export async function enrichClaimContext(claim: any): Promise<ClaimContext> {
  // Simulate realistic environmental data based on Indian FRA regions
  const baseWaterIndex = 0.4 + Math.random() * 0.4 // 0.4-0.8
  const baseForestCover = 0.3 + Math.random() * 0.5 // 0.3-0.8
  const basePopulationDensity = 80 + Math.random() * 180 // 80-260 per sq km

  // Adjust based on claim characteristics
  let waterIndex = baseWaterIndex
  let forestCover = baseForestCover
  let populationDensity = basePopulationDensity

  // Regional adjustments (mock data based on typical FRA states)
  if (claim.district?.toLowerCase().includes('tribal') || 
      claim.village?.toLowerCase().includes('adivasi')) {
    forestCover += 0.1 // Higher forest cover in tribal areas
    populationDensity *= 0.7 // Lower population density
  }

  if (claim.type === 'CFR' || claim.type === 'CR') {
    forestCover += 0.15 // Community rights usually in forested areas
  }

  // Clamp values to realistic ranges
  waterIndex = Math.min(Math.max(waterIndex, 0.1), 0.95)
  forestCover = Math.min(Math.max(forestCover, 0.1), 0.9)
  populationDensity = Math.min(Math.max(populationDensity, 30), 400)

  return {
    id: claim.id,
    claimant: claim.claimant,
    claimantName: claim.claimantName,
    village: claim.village,
    district: claim.district,
    type: claim.type,
    area: claim.area,
    status: claim.status,
    coords: claim.coords,
    waterIndex: Number(waterIndex.toFixed(3)),
    forestCover: Number(forestCover.toFixed(3)),
    populationDensity: Number(populationDensity.toFixed(1)),
    nearbyAssets: generateNearbyAssets(forestCover, waterIndex),
  }
}

function generateNearbyAssets(forestCover: number, waterIndex: number): string[] {
  const assets: string[] = []
  
  if (forestCover > 0.5) {
    assets.push('forest', 'wildlife_corridor')
  }
  if (forestCover > 0.7) {
    assets.push('timber_resources', 'ntfp_collection')
  }
  if (waterIndex > 0.6) {
    assets.push('water_bodies', 'irrigation_potential')
  }
  if (waterIndex < 0.4) {
    assets.push('water_scarcity_zone')
  }
  
  // Common assets
  assets.push('rural_road', 'primary_health_center')
  
  return assets
}

// Default thresholds for Indian FRA context
export function getDefaultThresholds(): PolicyThresholds {
  return {
    waterIndex: 0.5,
    forestCover: 0.4,
    maxAreaHa: 4.0, // Typical FRA individual limit
    minAreaHa: 0.5,
    populationDensity: 150, // Rural threshold
  }
}