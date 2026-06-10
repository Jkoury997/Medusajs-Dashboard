"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRankingRuns } from "@/hooks/use-ranking-agent"
import { formatNumber, formatDateTime } from "@/lib/format"
import { RefreshCw, Loader2 } from "lucide-react"

function shortTrigger(trigger: string): string {
  if (trigger.startsWith("manual:admin")) return "Manual"
  if (trigger.startsWith("cron")) return "Cron"
  if (trigger.startsWith("mcp")) return "MCP"
  if (trigger.startsWith("paperclip")) return "Paperclip"
  return trigger
}

function duration(ms: number): string {
  if (!ms || ms < 0) return "—"
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export function RankingRunsTab() {
  const { data, isLoading, error, refetch, isFetching } = useRankingRuns(50)
  const runs = data?.runs ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Historial de corridas del workflow de regeneración. Refrescá para ver el progreso de
          una corrida en curso.
        </p>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Actualizar
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            No se pudo cargar el historial. {(error as Error).message}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Combos</TableHead>
                  <TableHead className="text-right">Rankings</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Duración</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-gray-400 py-8">
                      No hay corridas registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.map((r) => {
                    const done = r.completed_at != null
                    const failed = r.combos_failed > 0
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-gray-600">
                          {formatDateTime(r.started_at)}
                        </TableCell>
                        <TableCell className="text-sm">{shortTrigger(r.trigger)}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              !done ? "default" : failed ? "destructive" : "secondary"
                            }
                          >
                            {!done ? "En curso" : failed ? "Con errores" : "Completado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatNumber(r.combos_processed)}/{formatNumber(r.combos_planned)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(r.rankings_generated)}
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          USD {r.usd_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-gray-500">
                          {done ? duration(r.duration_ms) : "…"}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
