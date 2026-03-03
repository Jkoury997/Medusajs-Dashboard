"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useSegmentList,
  useDeleteSegment,
  useEstimateSegment,
} from "@/hooks/use-segments"
import { SegmentEditor } from "@/components/segments/segment-editor"
import { RULE_TYPES } from "@/types/segments"
import type { SegmentRule } from "@/types/segments"
import {
  Plus,
  MoreHorizontal,
  Users,
  Zap,
  RefreshCw,
} from "lucide-react"

function getRuleLabel(type: string): string {
  return RULE_TYPES.find((r) => r.type === type)?.label || type
}

function formatRuleSummary(rule: SegmentRule): string {
  const label = getRuleLabel(rule.type)
  const parts = [label]
  if (rule.value) parts.push(`"${rule.value}"`)
  if (rule.days) parts.push(`${rule.days}d`)
  if (rule.engagement_type) parts.push(rule.engagement_type === "opened" ? "abrió" : "click")
  return parts.join(" ")
}

export default function SegmentsPage() {
  const { data: segments, isLoading } = useSegmentList()
  const deleteMutation = useDeleteSegment()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [estimatingId, setEstimatingId] = useState<string | null>(null)

  const openEditor = (id?: string) => {
    setEditingId(id ?? null)
    setEditorOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Eliminar el segmento "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div>
      <Header
        title="Segmentos"
        description="Crear y gestionar segmentos de audiencia para campañas de email"
      />

      <div className="p-6 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {segments ? `${segments.length} segmento(s)` : ""}
          </p>
          <Button onClick={() => openEditor()}>
            <Plus className="w-4 h-4 mr-1" /> Nuevo Segmento
          </Button>
        </div>

        {/* Segments table */}
        {isLoading ? (
          <Skeleton className="h-[300px]" />
        ) : segments && segments.length > 0 ? (
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Reglas</TableHead>
                    <TableHead>Lógica</TableHead>
                    <TableHead className="text-right">Estimado</TableHead>
                    <TableHead>Última estimación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map((seg) => (
                    <TableRow key={seg._id}>
                      <TableCell className="font-medium">{seg.name}</TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                        {seg.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(seg.rules || []).slice(0, 3).map((rule, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {formatRuleSummary(rule)}
                            </Badge>
                          ))}
                          {(seg.rules || []).length > 3 && (
                            <Badge variant="outline" className="text-xs text-gray-400">
                              +{seg.rules.length - 3} más
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={seg.match === "all"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-orange-50 text-orange-600"}
                        >
                          {seg.match === "all" ? "AND" : "OR"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <EstimateCell segment={seg} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {seg.last_estimated_at
                          ? new Date(seg.last_estimated_at).toLocaleDateString("es-AR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditor(seg._id)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(seg._id, seg.name)}
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No hay segmentos aún. Creá tu primer segmento para segmentar audiencias.
            </CardContent>
          </Card>
        )}

        {/* Mutation feedback */}
        {deleteMutation.isSuccess && (
          <p className="text-sm text-green-600">Segmento eliminado</p>
        )}
        {deleteMutation.isError && (
          <p className="text-sm text-red-600">Error: {deleteMutation.error?.message}</p>
        )}
      </div>

      {/* Segment editor dialog */}
      <SegmentEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        segmentId={editingId}
        onSaved={() => setEditorOpen(false)}
      />
    </div>
  )
}

// ============================================================
// ESTIMATE CELL — Re-estimate button per segment
// ============================================================

function EstimateCell({ segment }: { segment: { _id: string; estimated_count: number } }) {
  const estimateMutation = useEstimateSegment(segment._id)

  return (
    <div className="flex items-center justify-end gap-1.5">
      <span className="font-medium text-sm">
        {(estimateMutation.data?.estimated_count ?? segment.estimated_count).toLocaleString("es-AR")}
      </span>
      <button
        type="button"
        onClick={() => estimateMutation.mutate()}
        disabled={estimateMutation.isPending}
        className="text-gray-400 hover:text-blue-600 transition-colors"
        title="Re-estimar"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${estimateMutation.isPending ? "animate-spin" : ""}`} />
      </button>
    </div>
  )
}
