import { BetaAnalyticsDataClient } from "@google-analytics/data"

let client: BetaAnalyticsDataClient | null = null

function getClient() {
  if (!client) {
    client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL!,
        private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      },
    })
  }
  return client
}

export async function getGA4Report(params: {
  startDate: string
  endDate: string
  metrics: string[]
  dimensions?: string[]
}) {
  const analyticsClient = getClient()
  const propertyId = process.env.GA4_PROPERTY_ID!

  const [response] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: params.startDate, endDate: params.endDate }],
    metrics: params.metrics.map((name) => ({ name })),
    dimensions: params.dimensions?.map((name) => ({ name })),
  })

  return response
}

export async function getGA4Overview(startDate: string, endDate: string) {
  const [overview] = await Promise.all([
    getGA4Report({
      startDate,
      endDate,
      metrics: [
        "sessions",
        "totalUsers",
        "newUsers",
        "bounceRate",
        "averageSessionDuration",
        "ecommercePurchases",
        "totalRevenue",
      ],
    }),
  ])

  const row = overview.rows?.[0]
  if (!row) return null

  return {
    sessions: parseInt(row.metricValues?.[0]?.value || "0"),
    totalUsers: parseInt(row.metricValues?.[1]?.value || "0"),
    newUsers: parseInt(row.metricValues?.[2]?.value || "0"),
    bounceRate: parseFloat(row.metricValues?.[3]?.value || "0"),
    avgSessionDuration: parseFloat(row.metricValues?.[4]?.value || "0"),
    purchases: parseInt(row.metricValues?.[5]?.value || "0"),
    revenue: parseFloat(row.metricValues?.[6]?.value || "0"),
  }
}

export async function getGA4TrafficSources(
  startDate: string,
  endDate: string
) {
  const response = await getGA4Report({
    startDate,
    endDate,
    metrics: ["sessions", "totalUsers", "ecommercePurchases", "totalRevenue"],
    dimensions: ["sessionSource", "sessionMedium"],
  })

  return (
    response.rows?.map((row) => ({
      source: row.dimensionValues?.[0]?.value || "unknown",
      medium: row.dimensionValues?.[1]?.value || "unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
      purchases: parseInt(row.metricValues?.[2]?.value || "0"),
      revenue: parseFloat(row.metricValues?.[3]?.value || "0"),
    })) || []
  )
}

export async function getGA4DeviceBreakdown(
  startDate: string,
  endDate: string
) {
  const response = await getGA4Report({
    startDate,
    endDate,
    metrics: ["sessions", "totalUsers"],
    dimensions: ["deviceCategory"],
  })

  return (
    response.rows?.map((row) => ({
      device: row.dimensionValues?.[0]?.value || "unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
    })) || []
  )
}
