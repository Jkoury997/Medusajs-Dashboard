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
import {
  useSeoProposals,
  useCategorySeoProposals,
  useBulkApproveSeo,
} from "@/hooks/use-seo-agent"
import { formatDateTime } from "@/lib/format"
import { SeoProposalDialog } from "./seo-proposal-dialog"
import { EntityToggle } from "./entity-toggle"
import type { SeoProposal, SeoProposalStatus, EntityKind } from "@/types/seo-agent"
import { CheckCheck, Loader2, ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE = 50

const STATUS_BADGE: Record<SeoProposalStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  proposed: { label: "Pendiente", variant: "default" },
  approved: { label: "Aprobada", variant: "secondary" },
  applied: { label: "Aplicada", variant: "secondary" },
  auto_applied: { label: "Auto-aplicada", variant: "secondary" },
  rejected: { label: "Rechazada", variant: "outline" },
  failed: { label: "Falló", variant: "destructive" },
}

export function SeoProposalsTab({ salesChannelId }: { salesChannelId?: string }) {
  const [entity, setEntity] = useState<EntityKind>("product")
  const [status, setStatus] = useState<string>("proposed")
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [active, setActive] = useState<SeoProposal | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Al cambiar entidad/estado/marca, volvemos a la página 1 y limpiamos selección.
  // Patrón "ajustar estado en render" (sin useEffect).
  const filterKey = `${entity}|${status}|${salesChannelId ?? "all"}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(0)
    setSelected(new Set())
  }

  const offset = page * PAGE_SIZE
  const productQuery = useSeoProposals(status, salesChannelId, PAGE_SIZE, offset)
  const categoryQuery = useCategorySeoProposals(status, salesChannelId, PAGE_SIZE, offset)
  const { data, isLoading, error } = entity === "category" ? categoryQuery : productQuery
  const bulkApprove = useBulkApproveSeo()

  const proposals = data?.proposals ?? []
  const total = data?.count ?? 0
  const fromRow = total === 0 ? 0 : offset + 1
  const toRow = offset + proposals.length
  const canPrev = page > 0
  const canNext = toRow < total
  // El bulk-approve y el reject solo existen para productos.
  const isProposed = status === "proposed" && entity === "product"

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === proposals.length) setSelected(new Set())
    else setSelected(new Set(proposals.map((p) => p.proposal_id)))
  }

  const openProposal = (p: SeoProposal) => {
    setActive(p)
    setDialogOpen(true)
  }

  const handleBulk = () => {
    bulkApprove.mutate(
      { ids: Array.from(selected) },
      { onSuccess: () => setSelected(new Set()) },
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <EntityToggle value={entity} onChange={setEntity} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="proposed">Pendientes</SelectItem>
              <SelectItem value="applied">Aplicadas</SelectItem>
              <SelectItem value="rejected">Rechazadas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isProposed && selected.size > 0 && (
          <Button onClick={handleBulk} disabled={bulkApprove.isPending}>
            {bulkApprove.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Aprobar {selected.size} seleccionadas
          </Button>
        )}
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            No se pudieron cargar las propuestas. {(error as Error).message}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {isProposed && (
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={proposals.length > 0 && selected.size === proposals.length}
                        onChange={toggleAll}
                        aria-label="Seleccionar todas"
                      />
                    </TableHead>
                  )}
                  <TableHead>{entity === "category" ? "Categoría" : "Producto"}</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Meta título propuesto</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isProposed ? 7 : 6} className="text-center text-sm text-gray-400 py-8">
                      No hay propuestas para este filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  proposals.map((p) => (
                    <TableRow key={p.proposal_id}>
                      {isProposed && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selected.has(p.proposal_id)}
                            onChange={() => toggle(p.proposal_id)}
                            aria-label={`Seleccionar ${p.product_title}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {p.product_title}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {p.sales_channel_name ?? "Global"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-[220px] truncate">
                        {p.proposal.meta_title ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={STATUS_BADGE[p.status].variant}>
                          {STATUS_BADGE[p.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-500">
                        {formatDateTime(p.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openProposal(p)}>
                          {p.status === "proposed" ? "Revisar" : "Ver"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {total === 0
              ? "Sin propuestas"
              : `Mostrando ${fromRow}–${toRow} de ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        </>
      )}

      <SeoProposalDialog
        proposal={active}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entity={entity}
      />
    </div>
  )
}
