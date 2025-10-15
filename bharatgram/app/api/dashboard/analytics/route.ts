import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

const samplePriorityVillages = [
  {
    id: "VIL-102",
    name: "Kusumpur",
    district: "Ganjam",
    state: "Odisha",
    priorityScore: 91,
    scCoverage: 78,
    readiness: "Cluster-ready",
    lastSurvey: "14 Sep 2025",
    riskLevel: "High" as const,
    topGaps: ["Drinking water", "Anganwadi expansion", "Skill hubs"],
  },
  {
    id: "VIL-205",
    name: "Bhadra Tola",
    district: "Dumka",
    state: "Jharkhand",
    priorityScore: 87,
    scCoverage: 82,
    readiness: "Blueprint-ready",
    lastSurvey: "01 Oct 2025",
    riskLevel: "Medium" as const,
    topGaps: ["Road connectivity", "Irrigation rehab"],
  },
  {
    id: "VIL-319",
    name: "Melaipatti",
    district: "Virudhunagar",
    state: "Tamil Nadu",
    priorityScore: 84,
    scCoverage: 76,
    readiness: "Field-validation",
    lastSurvey: "25 Aug 2025",
    riskLevel: "Medium" as const,
    topGaps: ["Primary health", "Street lighting"],
  },
  {
    id: "VIL-404",
    name: "Koira Para",
    district: "Bastar",
    state: "Chhattisgarh",
    priorityScore: 82,
    scCoverage: 69,
    readiness: "Needs baseline",
    lastSurvey: "18 Jul 2025",
    riskLevel: "High" as const,
    topGaps: ["Digital access", "Drinking water"],
  },
]

const sampleTimeline = [
  { month: "Apr", onboarded: 12, liveProjects: 28 },
  { month: "May", onboarded: 18, liveProjects: 35 },
  { month: "Jun", onboarded: 26, liveProjects: 47 },
  { month: "Jul", onboarded: 31, liveProjects: 59 },
  { month: "Aug", onboarded: 38, liveProjects: 71 },
  { month: "Sep", onboarded: 44, liveProjects: 83 },
  { month: "Oct", onboarded: 52, liveProjects: 95 },
]

const sampleGapBreakdown = [
  { category: "Water & Sanitation", critical: 9, moderate: 14, low: 6 },
  { category: "Livelihood & Skilling", critical: 7, moderate: 12, low: 5 },
  { category: "Health & Nutrition", critical: 6, moderate: 10, low: 8 },
  { category: "Connectivity", critical: 5, moderate: 9, low: 7 },
]

const sampleAlerts = [
  {
    id: "AL-01",
    village: "Kusumpur",
    message: "Safe drinking water tanker delayed. Triggering Jal Jeevan support escalation and SMS nudges.",
    severity: "critical" as const,
    etaHours: 6,
  },
  {
    id: "AL-02",
    village: "Bhadra Tola",
    message: "MGNREGA funds dipping below threshold. Automated request sent to district treasury.",
    severity: "warning" as const,
    etaHours: 12,
  },
  {
    id: "AL-03",
    village: "Koira Para",
    message: "Scheduled skill center visit pending officer confirmation. Suggested window shared via WhatsApp.",
    severity: "info" as const,
    etaHours: 20,
  },
]

const sampleLedger = [
  {
    txId: "TX-8A21",
    project: "Jal Jeevan - Kusumpur Ward 3",
    amount: 48.2,
    status: "Cleared",
    timestamp: "14 Oct 2025 09:42",
    hash: "0x9f3a...b21",
  },
  {
    txId: "TX-8A22",
    project: "Solar Street Lights - Melaipatti",
    amount: 26.4,
    status: "Pending",
    timestamp: "13 Oct 2025 19:18",
    hash: "0xa73d...91c",
  },
  {
    txId: "TX-8A23",
    project: "Anganwadi Upgrade - Bhadra Tola",
    amount: 17.9,
    status: "Disbursed",
    timestamp: "12 Oct 2025 16:02",
    hash: "0xbc18...54e",
  },
  {
    txId: "TX-8A24",
    project: "Tribal Livelihood Collective - Koira Para",
    amount: 32.6,
    status: "Cleared",
    timestamp: "11 Oct 2025 11:47",
    hash: "0xcd78...a90",
  },
]

const sampleIntegrations = [
  { source: "PM GatiShakti pipeline", freshness: "Synced 2h ago", coverage: 92 },
  { source: "State MIS (SC Welfare)", freshness: "Synced 4h ago", coverage: 88 },
  { source: "IoT Water Sensors", freshness: "Live", coverage: 64 },
  { source: "Community WhatsApp bot", freshness: "Live", coverage: 73 },
]

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let villagesOnboarded = samplePriorityVillages.length * 3
    let highPriorityProjects = 18
    let scCoverage = 76

    try {
      await prisma.$connect()
      const claims = await prisma.claim.findMany({
        select: { village: true, status: true },
      })
      const assets = await prisma.asset.count()

      if (claims.length > 0) {
        const uniqueVillages = new Set(claims.map((c) => c.village).filter(Boolean))
        villagesOnboarded = Math.max(uniqueVillages.size, villagesOnboarded)
        highPriorityProjects = Math.max(
          claims.filter((c) => c.status?.toUpperCase() === "PENDING").length,
          highPriorityProjects,
        )
        scCoverage = Math.min(95, 60 + Math.round((assets / Math.max(1, uniqueVillages.size)) * 8))
      }
    } catch (error) {
      console.warn("Dashboard analytics using sample data due to error:", error)
    } finally {
      await prisma.$disconnect()
    }

    return NextResponse.json({
      summary: {
        villagesOnboarded,
        scCoverage,
        highPriorityProjects,
        liveResourceAlerts: sampleAlerts.length,
      },
      adoptionTimeline: sampleTimeline,
      gapBreakdown: sampleGapBreakdown,
      priorityVillages: samplePriorityVillages,
      resourceAlerts: sampleAlerts,
      aiSignals: {
        delayProbability: 28,
        fundingExposure: 134.6,
        confidence: 86,
        riskDrivers: [
          { label: "Water tanker delays", value: 72 },
          { label: "Fund utilization lag", value: 54 },
          { label: "Officer vacancies", value: 41 },
        ],
      },
      blockchainLedger: sampleLedger,
      communitySentiment: {
        engagementRate: 68,
        resolvedGrievances: 127,
        openFeedback: 19,
        storiesPublished: 34,
        lastSync: "14 Oct 2025 08:20",
      },
      dataIntegrations: sampleIntegrations,
    })
  } catch (error) {
    console.error("Dashboard analytics fatal error:", error)
    return NextResponse.json(
      {
        summary: {
          villagesOnboarded: samplePriorityVillages.length * 2,
          scCoverage: 72,
          highPriorityProjects: 15,
          liveResourceAlerts: sampleAlerts.length,
        },
        adoptionTimeline: sampleTimeline,
        gapBreakdown: sampleGapBreakdown,
        priorityVillages: samplePriorityVillages,
        resourceAlerts: sampleAlerts,
        aiSignals: {
          delayProbability: 30,
          fundingExposure: 120,
          confidence: 80,
          riskDrivers: [
            { label: "Data sync lag", value: 65 },
            { label: "Road closures", value: 48 },
            { label: "Funds pending", value: 37 },
          ],
        },
        blockchainLedger: sampleLedger,
        communitySentiment: {
          engagementRate: 60,
          resolvedGrievances: 90,
          openFeedback: 22,
          storiesPublished: 20,
          lastSync: "14 Oct 2025 07:10",
        },
        dataIntegrations: sampleIntegrations,
        fallback: true,
      },
      { status: 200 },
    )
  }
}
