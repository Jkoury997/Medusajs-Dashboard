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
import { useGeoProposals } from "@/hooks/use-geo-agent"
import { GeoGuideDialog } from "./geo-guide-dialog"
import { GEO_STATUS_BADGE } from "@/types/geo-agent"
import type { GeoProposal } from "@/types/geo-agent"
import { AlertTriangle } from "lucide-react"

export function GeoGuidesTab({ salesChannelId }: { salesChannelId?: string }) {
  const [status, setStatus] = useState("proposed")
  const { data, isLoading, error } = useGeoProposals(status, salesChannelId)
  const [active, setActive] = useState<GeoProposal | null>(null)
  const [open, setOpen] = useState(false)

  const proposals = data?.proposals ?? []

  const openGuide = (p: GeoProposal) => {
    setActive(p)
    setOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="proposed">Pendientes</SelectItem>
            <SelectItem value="applied">Publicadas</SelectItem>
            <SelectItem value="approved">Aprobadas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            No se pudieron cargar las guías. {(error as Error).message}
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
                  <TableHead>Título</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-center">Datos pend.</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-gray-400 py-8">
                      No hay guías para este filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  proposals.map((p) => {
                    const pending = p.guide?.data_needs.length ?? 0
                    return (
                      <TableRow key={p.proposal_id}>
                        <TableCell className="font-medium max-w-[260px] truncate">
                          {p.guide?.title ?? p.slug ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {p.brand ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {p.guide?.category ?? "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {pending > 0 ? (
                            <Badge variant="outline" className="text-amber-600">
                              <AlertTriangle className="h-3 w-3" /> {pending}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={GEO_STATUS_BADGE[p.status]?.variant ?? "outline"}>
                            {GEO_STATUS_BADGE[p.status]?.label ?? p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openGuide(p)}>
                            {p.status === "proposed" ? "Revisar" : "Ver / editar"}
                          </Button>
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

      <GeoGuideDialog proposal={active} open={open} onOpenChange={setOpen} />
    </div>
  )
}
