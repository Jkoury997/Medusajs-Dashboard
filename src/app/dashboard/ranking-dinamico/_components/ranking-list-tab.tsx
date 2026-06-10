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
import { useRankingList } from "@/hooks/use-ranking-agent"
import { formatNumber, formatDateTime } from "@/lib/format"
import { RankingDetailDialog } from "./ranking-detail-dialog"
import type { RankingItem, RankingType, RankingEntityType } from "@/types/ranking-agent"

export function RankingListTab({
  salesChannelId,
  channelName,
}: {
  salesChannelId?: string
  channelName: (id: string) => string
}) {
  const [type, setType] = useState<RankingType | "all">("all")
  const [entityType, setEntityType] = useState<RankingEntityType | "all">("all")
  const { data, isLoading, error } = useRankingList({
    salesChannelId,
    type,
    entityType,
  })
  const [active, setActive] = useState<RankingItem | null>(null)
  const [open, setOpen] = useState(false)

  const rankings = data?.rankings ?? []
  const groupsById = data?.customer_groups_by_id ?? {}

  const groupLabel = (id: string | null): string => {
    if (!id) return "Global / Invitado"
    return groupsById[id]?.name ?? id
  }

  const openDetail = (r: RankingItem) => {
    setActive(r)
    setOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={type} onValueChange={(v) => setType(v as RankingType | "all")}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="personalized">Personalizado</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={entityType}
          onValueChange={(v) => setEntityType(v as RankingEntityType | "all")}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Categorías y colecciones</SelectItem>
            <SelectItem value="category">Categorías</SelectItem>
            <SelectItem value="collection">Colecciones</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            No se pudieron cargar los rankings. {(error as Error).message}
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
                  <TableHead>Entidad</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Cohorte</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-right">Productos</TableHead>
                  <TableHead className="text-right">Generado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-gray-400 py-8">
                      No hay rankings para este filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  rankings.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {r.entity_name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {channelName(r.sales_channel_id)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {groupLabel(r.customer_group_id)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={r.type === "personalized" ? "default" : "secondary"}>
                          {r.type === "personalized" ? "Personalizado" : "General"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(r.total_products)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-500">
                        {formatDateTime(r.generated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openDetail(r)}>
                          Ver orden
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <RankingDetailDialog
        ranking={active}
        productsById={data?.products_by_id ?? {}}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  )
}
