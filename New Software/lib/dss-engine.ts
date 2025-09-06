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
  village: string
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
        id: "water-scarcity-borewell",
        name: "Water Scarcity - Borewell Recommendation",
        condition: {
          type: "and",
          conditions: [
            { type: "simple", field: "status", operator: "eq", value: "Granted" },
            { type: "simple", field: "area", operator: "gt", value: 1 },
            { type: "simple", field: "waterIndex", operator: "lt", value: this.thresholds.waterIndex },
          ],
        },
        action: {
          scheme: "Jal Shakti - Borewell Construction",
          reason: "Low water availability in granted claim area requires water infrastructure",
          priority: 1,
        },
        priority: 1,
        active: true,
      },
      {
        id: "forest-restoration-campa",
        name: "Forest Restoration under CAMPA",
        condition: {
          type: "and",
          conditions: [
            { type: "simple", field: "forestCover", operator: "lt", value: this.thresholds.forestCover },
            { type: "simple", field: "type", operator: "in", value: ["IFR", "CFR"] },
          ],
        },
        action: {
          scheme: "CAMPA - Afforestation Program",
          reason: "Forest cover below threshold requires restoration activities",
          priority: 2,
        },
        priority: 2,
        active: true,
      },
      {
        id: "large-area-livelihood",
        name: "Large Area Livelihood Support",
        condition: {
          type: "and",
          conditions: [
            { type: "simple", field: "status", operator: "eq", value: "Granted" },
            { type: "simple", field: "area", operator: "gte", value: this.thresholds.maxAreaHa },
          ],
        },
        action: {
          scheme: "MGNREGA - Livelihood Enhancement",
          reason: "Large granted area suitable for comprehensive livelihood programs",
          priority: 1,
        },
        priority: 1,
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
          reason: "Pending claim requires documentation and legal assistance",
          priority: 3,
        },
        priority: 3,
        active: true,
      },
      {
        id: "high-density-infrastructure",
        name: "High Population Density Infrastructure",
        condition: {
          type: "and",
          conditions: [
            { type: "simple", field: "populationDensity", operator: "gt", value: this.thresholds.populationDensity },
            { type: "simple", field: "status", operator: "eq", value: "Granted" },
          ],
        },
        action: {
          scheme: "PM Gati Shakti - Rural Infrastructure",
          reason: "High population density area requires improved infrastructure connectivity",
          priority: 2,
        },
        priority: 2,
        active: true,
      },
    ]
  }

  evaluateRules(claim: ClaimContext): RuleAction[] {
    console.log("[v0] Evaluating DSS rules for claim:", claim.id)

    const recommendations: RuleAction[] = []

    for (const rule of this.rules.filter((r) => r.active)) {
      if (this.evaluateCondition(rule.condition, claim)) {
        console.log("[v0] Rule matched:", rule.name)
        recommendations.push({
          ...rule.action,
          metadata: {
            ruleId: rule.id,
            ruleName: rule.name,
            evaluatedAt: new Date().toISOString(),
          },
        })
      }
    }

    // Sort by priority (lower number = higher priority)
    recommendations.sort((a, b) => a.priority - b.priority)

    console.log("[v0] Generated", recommendations.length, "recommendations")
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
  // Mock environmental data - in production, this would fetch from external APIs
  const mockWaterIndex = 0.3 + Math.random() * 0.7 // 0.3-1.0
  const mockForestCover = 0.2 + Math.random() * 0.6 // 0.2-0.8
  const mockPopulationDensity = 50 + Math.random() * 200 // 50-250 per sq km

  return {
    ...claim,
    waterIndex: mockWaterIndex,
    forestCover: mockForestCover,
    populationDensity: mockPopulationDensity,
    nearbyAssets: ["water", "forest"], // Mock nearby assets
  }
}
