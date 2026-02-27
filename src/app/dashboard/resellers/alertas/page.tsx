"use client"

import { useState } from "react"
import { useFraudAlerts } from "@/hooks/use-resellers"
import type { FraudSeverity, FraudAlertStatus } from "@/types/reseller"
import { Card, CardContent } from "@/components/ui/card"
import { MetricCard } from "@/components/dashboard/metric-card"
import { ShieldAlert, AlertTriangle, Eye, CheckCircle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 20

const SEVERITY_CONFIG: Record<FraudSeverity, { label: string; className: string }> = {
  low: { label: "Baja", className: "bg-blue-100 text-blue-700" },
  medium: { label: "Media", className: "bg-yellow-100 text-yellow-700" },
  high: { label: "Alta", className: "bg-orange-100 text-orange-700" },
  critical: { label: "Crítica", className: "bg-red-100 text-red-700" },
}

const ALERT_STATUS_CONFIG: Record<FraudAlertStatus, { label: string; className: string }> = {
  new: { label: "Nueva", className: "bg-red-100 text-red-700" },
  investigating: { label: "Investigando", className: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Resuelta", className: "bg-green-100 text-green-700" },
  dismissed: { label: "Descartada", className: "bg-gray-100 text-gray-600" },
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  high_refund_rate: "Alta tasa de reembolso",
  rapid_orders: "Pedidos rápidos",
  self_referral: "Auto-referencia",
  same_ip_orders: "Misma IP",
  suspicious_pattern: "Patrón sospechoso",
  high_value_anomaly: "Anomalía de valor",
  customer_concentration: "Concentración de clientes",
  geographic_anomaly: "Anomalía geográfica",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default function ResellersAlertasPage() {
  const [statusFilter, setStatusFilter] = useState("")
  const [severityFilter, setSeverityFilter] = useState("")
  const [offset, setOffset] = useState(0)

  const { data, isLoading, error } = useFraudAlerts({
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
    limit: PAGE_SIZE,
    offset,
  })

  const count = data?.count ?? 0

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Alertas de Fraude</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar alertas. Verificá que la API esté configurada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Alertas de Fraude</h1>

      {/* Stats cards */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Críticas"
            value={String(data.stats.critical)}
            icon={<ShieldAlert className="w-5 h-5 text-red-500" />}
          />
          <MetricCard
            title="Altas"
            value={String(data.stats.high)}
            icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
          />
          <MetricCard
            title="Medias"
            value={String(data.stats.medium)}
            icon={<Eye className="w-5 h-5 text-yellow-500" />}
          />
          <MetricCard
            title="Bajas"
            value={String(data.stats.low)}
            icon={<CheckCircle className="w-5 h-5 text-blue-500" />}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setOffset(0)
          }}
        >
          <option value="">Todos los estados</option>
          <option value="new">Nuevas</option>
          <option value="investigating">Investigando</option>
          <option value="resolved">Resueltas</option>
          <option value="dismissed">Descartadas</option>
        </select>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value)
            setOffset(0)
          }}
        >
          <option value="">Todas las severidades</option>
          <option value="critical">Crítica</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Revendedora</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data?.fraud_alerts?.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No hay alertas de fraude
                    </TableCell>
                  </TableRow>
                ) : (
                  data.fraud_alerts.map((a) => {
                    const sevCfg = SEVERITY_CONFIG[a.severity] ?? {
                      label: a.severity,
                      className: "bg-gray-100 text-gray-600",
                    }
                    const stCfg = ALERT_STATUS_CONFIG[a.status] ?? {
                      label: a.status,
                      className: "bg-gray-100 text-gray-600",
                    }
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-sm">
                          {ALERT_TYPE_LABELS[a.alert_type] ?? a.alert_type}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevCfg.className}`}
                          >
                            {sevCfg.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${stCfg.className}`}
                          >
                            {stCfg.label}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-sm text-gray-500 max-w-[300px] truncate"
                          title={a.description}
                        >
                          {a.description}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-gray-500">
                          {a.reseller_id.slice(0, 12)}...
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(a.created_at)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {count > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-gray-500">
                Mostrando {offset + 1}-{Math.min(offset + PAGE_SIZE, count)} de {count}
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  Anterior
                </button>
                <button
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                  disabled={offset + PAGE_SIZE >= count}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
