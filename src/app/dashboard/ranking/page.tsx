"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useRankingHealth,
  useRankingStatsSummary,
  useRankingLastJobStatus,
  useEntityRankings,
  useTriggerRankingCycle,
} from "@/hooks/use-ranking"
import {
  Trophy,
  Globe,
  Users,
  Layers,
  Activity,
  Cpu,
  DollarSign,
  Zap,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"

// ============================================================
// SKELETON
// ============================================================

function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    completed: {
      label: "Completado",
      className: "bg-green-100 text-green-700",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    running: {
      label: "Ejecutando",
      className: "bg-yellow-100 text-yellow-700",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    failed: {
      label: "Fallido",
      className: "bg-red-100 text-red-700",
      icon: <XCircle className="w-3 h-3" />,
    },
    pending: {
      label: "Pendiente",
      className: "bg-blue-100 text-blue-700",
      icon: <Clock className="w-3 h-3" />,
    },
  }

  const s = map[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700",
    icon: <AlertTriangle className="w-3 h-3" />,
  }

  return (
    <Badge variant="outline" className={`${s.className} gap-1`}>
      {s.icon}
      {s.label}
    </Badge>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function RankingPage() {
  const { data: health } = useRankingHealth()
  const { data: summary, isLoading: loadingSummary } = useRankingStatsSummary()
  const { data: lastJob, isLoading: loadingJob } = useRankingLastJobStatus()
  const triggerMutation = useTriggerRankingCycle()

  const [entityId, setEntityId] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [searchEntityId, setSearchEntityId] = useState<string | null>(null)
  const [searchCustomerId, setSearchCustomerId] = useState<string | undefined>()

  const {
    data: entityRankings,
    isLoading: loadingEntity,
    isError: entityError,
  } = useEntityRankings(searchEntityId, searchCustomerId)

  const handleSearch = () => {
    if (!entityId.trim()) return
    setSearchEntityId(entityId.trim())
    setSearchCustomerId(customerId.trim() || undefined)
  }

  // Cost calculations
  const tokenCount = lastJob?.total_tokens_used ?? 0
  const costMin = (tokenCount / 1_000_000) * 3 // all input rate
  const costMax = (tokenCount / 1_000_000) * 15 // all output rate

  const isHealthy = health?.status === "ok"
  const isMongoConnected = health?.mongodb === "connected"

  return (
    <div>
      <Header
        title="Ranking de Productos"
        description="Rankings AI para colecciones y categorías"
      />

      <div className="p-6 space-y-8">
        {/* ---- Health ---- */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${isHealthy ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm text-gray-600">
              Servicio: {isHealthy ? "Activo" : "Inactivo"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${isMongoConnected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm text-gray-600">
              MongoDB: {isMongoConnected ? "Conectado" : "Desconectado"}
            </span>
          </div>
        </div>

        {/* ---- Summary Stats ---- */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
          {loadingSummary ? (
            <SkeletonCards count={4} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Rankings"
                value={summary?.total_rankings?.toLocaleString() ?? "0"}
                icon={<Trophy className="w-5 h-5 text-mk-pink" />}
              />
              <MetricCard
                title="Rankings Generales"
                value={summary?.general?.toLocaleString() ?? "0"}
                icon={<Globe className="w-5 h-5 text-blue-500" />}
              />
              <MetricCard
                title="Rankings Personalizados"
                value={summary?.personalized?.toLocaleString() ?? "0"}
                icon={<Users className="w-5 h-5 text-purple-500" />}
              />
              <MetricCard
                title="Entidades con Rankings"
                value={summary?.entities_with_rankings?.toLocaleString() ?? "0"}
                icon={<Layers className="w-5 h-5 text-orange-500" />}
              />
            </div>
          )}
        </div>

        {/* ---- Last Job Status ---- */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Último Ciclo de Ranking</h3>
          {loadingJob ? (
            <SkeletonCards count={4} />
          ) : lastJob ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-gray-500">Estado</p>
                    <div className="mt-2">
                      <StatusBadge status={lastJob.status} />
                    </div>
                    {lastJob.duration_seconds != null && (
                      <p className="text-xs text-gray-400 mt-2">
                        Duración: {lastJob.duration_seconds.toFixed(1)}s
                      </p>
                    )}
                  </CardContent>
                </Card>
                <MetricCard
                  title="Entidades Procesadas"
                  value={lastJob.entities_processed?.toLocaleString() ?? "0"}
                  icon={<Layers className="w-5 h-5 text-blue-500" />}
                />
                <MetricCard
                  title="Clientes Procesados"
                  value={lastJob.customers_processed?.toLocaleString() ?? "0"}
                  icon={<Users className="w-5 h-5 text-purple-500" />}
                />
                <MetricCard
                  title="Llamadas API"
                  value={lastJob.total_api_calls?.toLocaleString() ?? "0"}
                  icon={<Activity className="w-5 h-5 text-orange-500" />}
                />
              </div>

              {/* AI Cost Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Costo AI Estimado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Tokens Usados</p>
                      <p className="text-xl font-bold text-gray-900">
                        {tokenCount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(tokenCount / 1_000_000).toFixed(4)} MTok
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Costo Mínimo</p>
                      <p className="text-xl font-bold text-green-600">
                        ${costMin.toFixed(4)}
                      </p>
                      <p className="text-xs text-gray-400">$3/MTok (todo input)</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Costo Máximo</p>
                      <p className="text-xl font-bold text-red-600">
                        ${costMax.toFixed(4)}
                      </p>
                      <p className="text-xs text-gray-400">$15/MTok (todo output)</p>
                    </div>
                  </div>
                  {typeof lastJob.errors === "number" && lastJob.errors > 0 && (
                    <div className="mt-4 p-3 bg-red-50 rounded-md">
                      <p className="text-sm text-red-700">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        {lastJob.errors} error(es) durante el ciclo
                      </p>
                    </div>
                  )}
                  {Array.isArray(lastJob.errors) && lastJob.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 rounded-md space-y-1">
                      <p className="text-sm font-medium text-red-700">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        Errores ({lastJob.errors.length}):
                      </p>
                      {lastJob.errors.slice(0, 5).map((err, i) => (
                        <p key={i} className="text-xs text-red-600 truncate">
                          {err}
                        </p>
                      ))}
                      {lastJob.errors.length > 5 && (
                        <p className="text-xs text-red-500">
                          ... y {lastJob.errors.length - 5} más
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hay datos del último ciclo.</p>
          )}
        </div>

        {/* ---- Trigger ---- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Disparar Ciclo de Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Inicia un nuevo ciclo de ranking AI en background. Procesa todas las
              entidades y genera rankings generales y personalizados.
            </p>
            <Button
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending}
              className="bg-mk-pink hover:bg-mk-pink-dark text-white"
            >
              {triggerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4 mr-2" />
                  Disparar Ranking
                </>
              )}
            </Button>
            {triggerMutation.isSuccess && (
              <p className="text-sm text-green-600 mt-2">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                {triggerMutation.data?.message || "Ciclo disparado exitosamente"}
              </p>
            )}
            {triggerMutation.isError && (
              <p className="text-sm text-red-600 mt-2">
                <XCircle className="w-4 h-4 inline mr-1" />
                {triggerMutation.error?.message || "Error al disparar ciclo"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ---- Entity Lookup ---- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              Buscar Rankings por Entidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Input
                placeholder="Entity ID (colección/categoría)"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Input
                placeholder="Customer ID (opcional)"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={!entityId.trim() || loadingEntity}
                variant="outline"
              >
                {loadingEntity ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {entityError && (
              <p className="text-sm text-red-600 mb-4">
                Error al obtener rankings. Verificá que el Entity ID sea correcto.
              </p>
            )}

            {entityRankings && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-gray-100">
                    {entityRankings.is_personalized ? "Personalizado" : "General"}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {entityRankings.rankings?.length ?? 0} productos
                  </span>
                </div>

                {entityRankings.rankings?.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead>Product ID</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entityRankings.rankings.map((product) => (
                          <TableRow key={product.product_id}>
                            <TableCell className="font-medium">
                              {product.rank}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {product.product_id}
                            </TableCell>
                            <TableCell>{product.title ?? "—"}</TableCell>
                            <TableCell className="text-right">
                              {typeof product.score === "number"
                                ? product.score.toFixed(2)
                                : product.score}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No se encontraron rankings para esta entidad.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
