const GRAPH_API_VERSION = "v22.0"
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`

async function metaFetch(endpoint: string, params: Record<string, string> = {}) {
  const accessToken = process.env.META_ACCESS_TOKEN!
  const searchParams = new URLSearchParams({
    access_token: accessToken,
    ...params,
  })

  const response = await fetch(`${BASE_URL}${endpoint}?${searchParams}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Meta API error: ${JSON.stringify(error)}`)
  }

  return response.json()
}

export async function getMetaAdInsights(params: {
  startDate: string
  endDate: string
  level?: "account" | "campaign" | "adset" | "ad"
}) {
  const adAccountId = process.env.META_AD_ACCOUNT_ID!

  const data = await metaFetch(`/${adAccountId}/insights`, {
    time_range: JSON.stringify({
      since: params.startDate,
      until: params.endDate,
    }),
    level: params.level || "account",
    fields: [
      "spend",
      "impressions",
      "clicks",
      "ctr",
      "cpc",
      "reach",
      "frequency",
      "actions",
      "cost_per_action_type",
      "purchase_roas",
    ].join(","),
  })

  return data.data || []
}

export async function getMetaCampaignInsights(
  startDate: string,
  endDate: string
) {
  const adAccountId = process.env.META_AD_ACCOUNT_ID!

  const data = await metaFetch(`/${adAccountId}/insights`, {
    time_range: JSON.stringify({
      since: startDate,
      until: endDate,
    }),
    level: "campaign",
    fields: [
      "campaign_name",
      "spend",
      "impressions",
      "clicks",
      "ctr",
      "cpc",
      "reach",
      "actions",
      "purchase_roas",
    ].join(","),
    limit: "50",
  })

  return (data.data || []).map((row: any) => {
    const purchases =
      row.actions?.find((a: any) => a.action_type === "purchase")?.value || 0
    const roas = row.purchase_roas?.[0]?.value || 0

    return {
      campaignName: row.campaign_name,
      spend: parseFloat(row.spend || "0"),
      impressions: parseInt(row.impressions || "0"),
      clicks: parseInt(row.clicks || "0"),
      ctr: parseFloat(row.ctr || "0"),
      cpc: parseFloat(row.cpc || "0"),
      reach: parseInt(row.reach || "0"),
      purchases: parseInt(purchases),
      roas: parseFloat(roas),
    }
  })
}

export async function getMetaAccountOverview(
  startDate: string,
  endDate: string
) {
  const insights = await getMetaAdInsights({
    startDate,
    endDate,
    level: "account",
  })

  if (!insights.length) return null

  const row = insights[0]
  const purchases =
    row.actions?.find((a: any) => a.action_type === "purchase")?.value || 0
  const roas = row.purchase_roas?.[0]?.value || 0

  return {
    spend: parseFloat(row.spend || "0"),
    impressions: parseInt(row.impressions || "0"),
    clicks: parseInt(row.clicks || "0"),
    ctr: parseFloat(row.ctr || "0"),
    cpc: parseFloat(row.cpc || "0"),
    reach: parseInt(row.reach || "0"),
    frequency: parseFloat(row.frequency || "0"),
    purchases: parseInt(purchases),
    roas: parseFloat(roas),
  }
}
