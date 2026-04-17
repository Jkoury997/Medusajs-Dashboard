"use client"

import { useParams } from "next/navigation"

import { Header } from "@/components/dashboard/header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSessionJourney } from "@/hooks/use-sessions"
import { formatCurrency } from "@/lib/format"

function formatDuration(ms: number | null) {
  if (!ms) return "—"
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}m ${rem}s`
}

export default function SessionJourneyPage() {
  const params = useParams<{ id: string }>()
  const sessionId = decodeURIComponent(params.id)
  const { data, isLoading } = useSessionJourney(sessionId)

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!data?.session) {
    return <div className="p-6">Sesión no encontrada.</div>
  }

  const s = data.session as Record<string, string | number | boolean | null>

  const meta: Array<[string, string]> = [
    ["Inicio", new Date(String(s.first_seen_at)).toLocaleString("es-AR")],
    ["Última vista", new Date(String(s.last_seen_at)).toLocaleString("es-AR")],
    ["Landing", String(s.landing_page ?? "-")],
    ["Referrer", String(s.referrer ?? "-")],
    ["UTM", `${s.utm_source ?? "-"} / ${s.utm_medium ?? "-"} / ${s.utm_campaign ?? "-"}`],
    ["Device", `${s.device_type ?? "-"} · ${s.os ?? "-"} ${s.os_version ?? ""} · ${s.browser ?? "-"} ${s.browser_version ?? ""}`],
    ["Ubicación", `${s.city ?? "-"}, ${s.region ?? "-"}, ${s.country ?? "-"}`],
    ["Viewport", `${s.viewport_width ?? "-"}×${s.viewport_height ?? "-"} (screen ${s.screen_width ?? "-"}×${s.screen_height ?? "-"})`],
    ["Timezone", String(s.timezone ?? "-")],
    ["Idioma", String(s.language ?? "-")],
    ["Cliente", String(s.customer_id ?? "Invitado")],
    ["Grupo", String(s.customer_group ?? "-")],
  ]

  return (
    <div>
      <Header
        description={`Journey completo de ${sessionId.slice(0, 12)}…`}
        title="Sesión"
      />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-3">
              Resumen
              {s.converted_at ? (
                <Badge className="bg-green-600">Convertida · {formatCurrency(Number(s.revenue ?? 0))}</Badge>
              ) : (
                <Badge variant="outline">No convertida</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {meta.map(([label, value]) => (
                <div className="flex gap-3" key={label}>
                  <dt className="text-gray-500 min-w-[120px]">{label}</dt>
                  <dd className="font-medium text-gray-900 truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Páginas visitadas ({data.pageviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {data.pageviews.map((pv, i) => (
                <li className="flex items-center gap-3 text-sm" key={pv._id}>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pink-50 text-pink-700 text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="font-mono text-xs text-gray-500 w-[180px]">
                    {new Date(pv.entered_at).toLocaleTimeString("es-AR")}
                  </span>
                  <span className="flex-1 truncate">{pv.path}</span>
                  <span className="text-xs text-gray-500">
                    {formatDuration(pv.duration_ms)} · scroll {pv.scroll_depth_max}% · {pv.click_count} clicks
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline combinado ({data.journey.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="text-left py-1 pr-2">Hora</th>
                    <th className="text-left py-1 pr-2">Tipo</th>
                    <th className="text-left py-1 pr-2">Detalle</th>
                    <th className="text-left py-1">Data / Path</th>
                  </tr>
                </thead>
                <tbody>
                  {data.journey.map((entry, i) => (
                    <tr className="border-b border-gray-100" key={i}>
                      <td className="py-1 pr-2 font-mono text-gray-500 whitespace-nowrap">
                        {new Date(entry.ts).toLocaleTimeString("es-AR")}
                      </td>
                      <td className="py-1 pr-2">
                        {entry.kind === "pageview" ? (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200">pageview</Badge>
                        ) : (
                          <Badge variant="outline">{entry.event}</Badge>
                        )}
                      </td>
                      <td className="py-1 pr-2 truncate max-w-[280px]">
                        {entry.kind === "pageview"
                          ? `${entry.path} · ${formatDuration(entry.duration_ms)}`
                          : entry.path ?? "-"}
                      </td>
                      <td className="py-1 text-gray-500 truncate max-w-[400px]">
                        {entry.kind === "pageview"
                          ? `scroll ${entry.scroll_depth_max}% · ${entry.click_count} clicks`
                          : JSON.stringify(entry.data).slice(0, 120)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
