"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { TrafficSources } from "@/components/charts/traffic-sources"
import { useGA4Overview, useGA4Traffic, useGA4Devices } from "@/hooks/use-ga4"
import { useMetaOverview, useMetaCampaigns } from "@/hooks/use-meta"
import { formatCurrency, formatNumber } from "@/lib/format"
import { AIInsightWidget } from "@/components/dashboard/ai-insight-widget"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

const DEVICE_COLORS = ["#ff75a8", "#16a34a", "#eab308", "#ef4444"]

export default function MarketingPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())

  const { data: ga4Overview, isLoading: ga4Loading } = useGA4Overview(
    dateRange.from,
    dateRange.to
  )
  const { data: ga4Traffic } = useGA4Traffic(dateRange.from, dateRange.to)
  const { data: ga4Devices } = useGA4Devices(dateRange.from, dateRange.to)
  const { data: metaOverview, isLoading: metaLoading } = useMetaOverview(
    dateRange.from,
    dateRange.to
  )
  const { data: metaCampaigns } = useMetaCampaigns(dateRange.from, dateRange.to)

  const deviceChartData =
    ga4Devices?.map((d: any) => ({
      name: d.device === "desktop" ? "Desktop" : d.device === "mobile" ? "Mobile" : "Tablet",
      value: d.sessions,
    })) || []

  return (
    <div>
      <Header
        title="Marketing"
        description="Google Analytics y Meta Ads performance"
      />
      <div className="p-6 space-y-6">
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        <Tabs defaultValue="ga4">
          <TabsList>
            <TabsTrigger value="ga4">Google Analytics</TabsTrigger>
            <TabsTrigger value="meta">Meta Ads</TabsTrigger>
          </TabsList>

          <TabsContent value="ga4" className="space-y-6 mt-4">
            {ga4Loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-[100px]" />
                ))}
              </div>
            ) : ga4Overview ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Sesiones"
                    value={formatNumber(ga4Overview.sessions)}
                    icon="👁️"
                  />
                  <MetricCard
                    title="Usuarios"
                    value={formatNumber(ga4Overview.totalUsers)}
                    icon="👤"
                  />
                  <MetricCard
                    title="Tasa de Rebote"
                    value={`${(ga4Overview.bounceRate * 100).toFixed(1)}%`}
                    icon="↩️"
                  />
                  <MetricCard
                    title="Compras"
                    value={formatNumber(ga4Overview.purchases)}
                    icon="🛒"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {ga4Traffic && <TrafficSources data={ga4Traffic} />}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Dispositivos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={deviceChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {deviceChartData.map((_: any, index: number) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={DEVICE_COLORS[index % DEVICE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {ga4Traffic && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Detalle por Fuente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fuente / Medio</TableHead>
                            <TableHead className="text-right">Sesiones</TableHead>
                            <TableHead className="text-right">Usuarios</TableHead>
                            <TableHead className="text-right">Compras</TableHead>
                            <TableHead className="text-right">Conversión</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ga4Traffic
                            .sort((a: any, b: any) => b.sessions - a.sessions)
                            .slice(0, 15)
                            .map((row: any, i: number) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">
                                  {row.source} / {row.medium}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatNumber(row.sessions)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatNumber(row.users)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatNumber(row.purchases)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.sessions > 0
                                    ? `${((row.purchases / row.sessions) * 100).toFixed(2)}%`
                                    : "0%"}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Configurá las credenciales de Google Analytics en .env.local
                  para ver los datos
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="meta" className="space-y-6 mt-4">
            {metaLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-[100px]" />
                ))}
              </div>
            ) : metaOverview ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Gasto en Ads"
                    value={`$${metaOverview.spend.toLocaleString("es-AR")}`}
                    icon="💸"
                  />
                  <MetricCard
                    title="ROAS"
                    value={`${metaOverview.roas.toFixed(1)}x`}
                    changeType={metaOverview.roas >= 3 ? "positive" : "negative"}
                    icon="📈"
                  />
                  <MetricCard
                    title="Conversiones"
                    value={formatNumber(metaOverview.purchases)}
                    icon="🎯"
                  />
                  <MetricCard
                    title="CTR"
                    value={`${metaOverview.ctr.toFixed(2)}%`}
                    icon="🖱️"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard
                    title="Impresiones"
                    value={formatNumber(metaOverview.impressions)}
                    icon="👁️"
                  />
                  <MetricCard
                    title="Clicks"
                    value={formatNumber(metaOverview.clicks)}
                    icon="🔗"
                  />
                  <MetricCard
                    title="CPC"
                    value={`$${metaOverview.cpc.toFixed(2)}`}
                    icon="💰"
                  />
                </div>

                {metaCampaigns && metaCampaigns.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Performance por Campaña
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Campaña</TableHead>
                            <TableHead className="text-right">Gasto</TableHead>
                            <TableHead className="text-right">Impresiones</TableHead>
                            <TableHead className="text-right">Clicks</TableHead>
                            <TableHead className="text-right">CTR</TableHead>
                            <TableHead className="text-right">CPC</TableHead>
                            <TableHead className="text-right">Conversiones</TableHead>
                            <TableHead className="text-right">ROAS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {metaCampaigns.map((campaign: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">
                                {campaign.campaignName}
                              </TableCell>
                              <TableCell className="text-right">
                                ${campaign.spend.toLocaleString("es-AR")}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(campaign.impressions)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(campaign.clicks)}
                              </TableCell>
                              <TableCell className="text-right">
                                {campaign.ctr.toFixed(2)}%
                              </TableCell>
                              <TableCell className="text-right">
                                ${campaign.cpc.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                {campaign.purchases}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {campaign.roas.toFixed(1)}x
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Configurá las credenciales de Meta Ads en .env.local para ver
                  los datos
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <AIInsightWidget
          pageContext="marketing"
          metricsBuilder={() => {
            return {
              ga4: ga4Overview ? {
                sesiones: ga4Overview.sessions,
                usuarios: ga4Overview.users,
                tasaRebote: ga4Overview.bounceRate,
                compras: ga4Overview.purchases,
              } : null,
              trafico: ga4Traffic?.slice(0, 10) || null,
              dispositivos: deviceChartData || null,
              meta: metaOverview ? {
                gastoAds: metaOverview.spend,
                roas: metaOverview.roas,
                conversiones: metaOverview.conversions,
                ctr: metaOverview.ctr,
                impresiones: metaOverview.impressions,
                clicks: metaOverview.clicks,
                cpc: metaOverview.cpc,
              } : null,
              campanas: metaCampaigns?.slice(0, 10) || null,
            }
          }}
          isDataLoading={ga4Loading || metaLoading}
        />
      </div>
    </div>
  )
}
