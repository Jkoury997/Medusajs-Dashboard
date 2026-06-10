"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSearchInsights, useRefreshSearchInsights } from "@/hooks/use-seo-agent"
import { formatNumber } from "@/lib/format"
import type { SearchInsightKind } from "@/types/seo-agent"
import { RefreshCw, Loader2, Search } from "lucide-react"

const KIND_LABEL: Record<SearchInsightKind, string> = {
  top_search: "Más buscadas",
  no_results: "Sin resultados",
  no_clicks: "Sin clicks",
}

const pct = (n: number | null): string => (n == null ? "—" : `${(n * 100).toFixed(1)}%`)

export function SeoSearchInsightsTab({ salesChannelId }: { salesChannelId?: string }) {
  const [kind, setKind] = useState<SearchInsightKind>("top_search")
  const { data, isLoading, error } = useSearchInsights(kind, salesChannelId)
  const refresh = useRefreshSearchInsights()

  const insights = data?.insights ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={kind} onValueChange={(v) => setKind(v as SearchInsightKind)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top_search">Más buscadas</SelectItem>
            <SelectItem value="no_results">Sin resultados</SelectItem>
            <SelectItem value="no_clicks">Sin clicks</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
        >
          {refresh.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refrescar desde Algolia
        </Button>
      </div>

      {refresh.isError && (
        <p className="text-sm text-red-600">{(refresh.error as Error).message}</p>
      )}

      <p className="text-sm text-gray-500">
        {kind === "no_results"
          ? "Búsquedas sin ningún resultado: candidatas a synonyms o a productos faltantes."
          : kind === "no_clicks"
            ? "Búsquedas con resultados pero sin clicks: posible mismatch de relevancia."
            : "Términos más buscados en el catálogo."}
      </p>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            No se pudieron cargar los insights. {(error as Error).message}
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
                  <TableHead>Búsqueda</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-right">Veces</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Conversión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-gray-400 py-8">
                      <Search className="mx-auto mb-2 h-5 w-5 text-gray-300" />
                      No hay datos. Probá “Refrescar desde Algolia”.
                    </TableCell>
                  </TableRow>
                ) : (
                  insights.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.query}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{KIND_LABEL[i.kind]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(i.count)}</TableCell>
                      <TableCell className="text-right text-gray-600">
                        {pct(i.click_through_rate)}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {pct(i.conversion_rate)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
