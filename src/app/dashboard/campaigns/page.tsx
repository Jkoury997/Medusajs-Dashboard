"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge"
import { CampaignEditor } from "@/components/campaigns/campaign-editor"
import { CampaignStatsDialog } from "@/components/campaigns/campaign-stats"
import {
  useManualCampaignList,
  useDeleteCampaign,
  useDuplicateCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useCancelCampaign,
} from "@/hooks/use-manual-campaigns"
import { formatNumber } from "@/lib/format"
import type { ManualCampaignStatus, CampaignListFilters } from "@/types/campaigns"

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "draft", label: "Borradores" },
  { value: "scheduled", label: "Programadas" },
  { value: "sending", label: "Enviando" },
  { value: "sent", label: "Enviadas" },
  { value: "paused", label: "Pausadas" },
  { value: "cancelled", label: "Canceladas" },
]

const PAGE_SIZE = 20

export default function CampaignsPage() {
  // Filters
  const [statusFilter, setStatusFilter] = useState("all")
  const [listPage, setListPage] = useState(0)

  const filters = useMemo<CampaignListFilters>(() => {
    const f: CampaignListFilters = {
      limit: PAGE_SIZE,
      offset: listPage * PAGE_SIZE,
    }
    if (statusFilter !== "all") f.status = statusFilter as ManualCampaignStatus
    return f
  }, [statusFilter, listPage])

  const { data: campaignList, isLoading } = useManualCampaignList(filters)
  const totalPages = campaignList ? Math.ceil(campaignList.total / PAGE_SIZE) : 0

  // Dialogs
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [statsOpen, setStatsOpen] = useState(false)
  const [statsCampaignId, setStatsCampaignId] = useState("")
  const [statsCampaignName, setStatsCampaignName] = useState("")

  // Mutations
  const deleteMutation = useDeleteCampaign()
  const duplicateMutation = useDuplicateCampaign()
  const pauseMutation = usePauseCampaign()
  const resumeMutation = useResumeCampaign()
  const cancelMutation = useCancelCampaign()

  const openEditor = (id?: string) => {
    setEditingId(id ?? null)
    setEditorOpen(true)
  }

  const openStats = (id: string, name: string) => {
    setStatsCampaignId(id)
    setStatsCampaignName(name)
    setStatsOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm("¿Eliminar esta campaña? Esta acción no se puede deshacer.")) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div>
      <Header
        title="Campañas Manuales"
        description="Crear, programar y analizar campañas de email"
      />

      <div className="p-6 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setListPage(0) }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => openEditor()}>
            Nueva Campaña
          </Button>
        </div>

        {/* Campaign list */}
        {isLoading ? (
          <Skeleton className="h-[400px]" />
        ) : campaignList?.campaigns?.length ? (
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Audiencia</TableHead>
                    <TableHead>Fecha envío</TableHead>
                    <TableHead className="text-right">Enviados</TableHead>
                    <TableHead className="text-right">Fallidos</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignList.campaigns.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium max-w-[250px] truncate">
                        {c.name}
                      </TableCell>
                      <TableCell>
                        <CampaignStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {c.estimated_recipients != null ? formatNumber(c.estimated_recipients) : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.sending_completed_at
                          ? new Date(c.sending_completed_at).toLocaleString("es-AR")
                          : c.sending_started_at
                            ? new Date(c.sending_started_at).toLocaleString("es-AR")
                            : c.scheduled_at
                              ? new Date(c.scheduled_at).toLocaleString("es-AR")
                              : "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {c.total_sent > 0 ? formatNumber(c.total_sent) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {c.total_failed > 0 ? formatNumber(c.total_failed) : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              ...
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {c.status === "draft" && (
                              <DropdownMenuItem onClick={() => openEditor(c._id)}>
                                Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => duplicateMutation.mutate(c._id)}>
                              Duplicar
                            </DropdownMenuItem>
                            {(c.status === "sent" || c.status === "sending") && (
                              <DropdownMenuItem onClick={() => openStats(c._id, c.name)}>
                                Ver estadísticas
                              </DropdownMenuItem>
                            )}
                            {c.status === "sending" && (
                              <DropdownMenuItem onClick={() => pauseMutation.mutate(c._id)}>
                                Pausar
                              </DropdownMenuItem>
                            )}
                            {c.status === "paused" && (
                              <DropdownMenuItem onClick={() => resumeMutation.mutate(c._id)}>
                                Reanudar
                              </DropdownMenuItem>
                            )}
                            {(c.status === "scheduled" || c.status === "sending") && (
                              <DropdownMenuItem onClick={() => cancelMutation.mutate(c._id)}>
                                Cancelar
                              </DropdownMenuItem>
                            )}
                            {c.status === "draft" && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(c._id)}
                              >
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={listPage <= 0}
                    onClick={() => setListPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-500">
                    Página {listPage + 1} de {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={listPage + 1 >= totalPages}
                    onClick={() => setListPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              {statusFilter !== "all"
                ? "No se encontraron campañas con este estado"
                : "No hay campañas aún. Creá tu primera campaña para empezar."}
            </CardContent>
          </Card>
        )}

        {/* Mutation feedback */}
        {deleteMutation.isSuccess && (
          <p className="text-sm text-green-600">Campaña eliminada</p>
        )}
        {duplicateMutation.isSuccess && (
          <p className="text-sm text-green-600">Campaña duplicada como borrador</p>
        )}
        {(deleteMutation.isError || duplicateMutation.isError || pauseMutation.isError || resumeMutation.isError || cancelMutation.isError) && (
          <p className="text-sm text-red-600">
            Error: {deleteMutation.error?.message || duplicateMutation.error?.message || pauseMutation.error?.message || resumeMutation.error?.message || cancelMutation.error?.message}
          </p>
        )}
      </div>

      {/* Dialogs */}
      <CampaignEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        campaignId={editingId}
        onSaved={() => setEditorOpen(false)}
      />

      {statsCampaignId && (
        <CampaignStatsDialog
          open={statsOpen}
          onOpenChange={setStatsOpen}
          campaignId={statsCampaignId}
          campaignName={statsCampaignName}
        />
      )}
    </div>
  )
}
