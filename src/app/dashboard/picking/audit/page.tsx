"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, formatNumber } from "@/lib/format"
import {
  useAuditLog,
  usePickingHistory,
  useOrdersCount,
  usePickingUsers,
} from "@/hooks/use-picking"
import type { AuditFilters, PickingHistoryFilters } from "@/types/picking"

const PAGE_SIZE = 50

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function getActionBadgeClass(action: string): string {
  switch (action) {
    case "pick":
      return "bg-green-100 text-green-700"
    case "unpick":
      return "bg-yellow-100 text-yellow-700"
    case "missing":
      return "bg-red-100 text-red-700"
    case "pack":
      return "bg-blue-100 text-blue-700"
    case "complete":
      return "bg-purple-100 text-purple-700"
    case "cancel":
      return "bg-gray-100 text-gray-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

function formatDetails(details?: Record<string, unknown>): string {
  if (!details) return "—"
  const str = JSON.stringify(details)
  return str.length > 80 ? str.slice(0, 80) + "..." : str
}

export default function AuditPage() {
  // ── Audit Log filters (draft + applied) ──
  const [auditUserDraft, setAuditUserDraft] = useState("")
  const [auditOrderDraft, setAuditOrderDraft] = useState("")
  const [auditActionDraft, setAuditActionDraft] = useState("all")
  const [auditFromDraft, setAuditFromDraft] = useState("")
  const [auditToDraft, setAuditToDraft] = useState("")

  const [auditFilters, setAuditFilters] = useState<AuditFilters>({
    limit: PAGE_SIZE,
    offset: 0,
  })

  // ── History filters (draft + applied) ──
  const [historyPickerDraft, setHistoryPickerDraft] = useState("")
  const [historyFromDraft, setHistoryFromDraft] = useState("")
  const [historyToDraft, setHistoryToDraft] = useState("")

  const [historyFilters, setHistoryFilters] = useState<PickingHistoryFilters>({
    limit: PAGE_SIZE,
    offset: 0,
  })

  // ── Data hooks ──
  const { data: ordersCount } = useOrdersCount()
  const { data: auditData, isLoading: auditLoading } = useAuditLog(auditFilters)
  const { data: historyData, isLoading: historyLoading } = usePickingHistory(historyFilters)
  const { data: pickingUsers } = usePickingUsers()

  // ── Audit search handler ──
  function handleAuditSearch() {
    setAuditFilters({
      limit: PAGE_SIZE,
      offset: 0,
      userName: auditUserDraft || undefined,
      orderId: auditOrderDraft || undefined,
      action: auditActionDraft !== "all" ? auditActionDraft : undefined,
      from: auditFromDraft || undefined,
      to: auditToDraft || undefined,
    })
  }

  // ── History search handler ──
  function handleHistorySearch() {
    setHistoryFilters({
      limit: PAGE_SIZE,
      offset: 0,
      userId: historyPickerDraft || undefined,
      from: historyFromDraft || undefined,
      to: historyToDraft || undefined,
    })
  }

  // ── Audit pagination ──
  const auditTotal = auditData?.total ?? 0
  const auditOffset = auditFilters.offset ?? 0
  const auditHasPrev = auditOffset > 0
  const auditHasNext = auditOffset + PAGE_SIZE < auditTotal

  function auditPrev() {
    setAuditFilters((f) => ({
      ...f,
      offset: Math.max(0, (f.offset ?? 0) - PAGE_SIZE),
    }))
  }

  function auditNext() {
    setAuditFilters((f) => ({
      ...f,
      offset: (f.offset ?? 0) + PAGE_SIZE,
    }))
  }

  // ── History pagination ──
  const historyTotal = historyData?.total ?? 0
  const historyOffset = historyFilters.offset ?? 0
  const historyHasPrev = historyOffset > 0
  const historyHasNext = historyOffset + PAGE_SIZE < historyTotal

  function historyPrev() {
    setHistoryFilters((f) => ({
      ...f,
      offset: Math.max(0, (f.offset ?? 0) - PAGE_SIZE),
    }))
  }

  function historyNext() {
    setHistoryFilters((f) => ({
      ...f,
      offset: (f.offset ?? 0) + PAGE_SIZE,
    }))
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Auditoría de Picking"
        description="Log de auditoría y historial de picking"
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Orders count card */}
        <Card className="w-fit">
          <CardContent className="py-3 px-5">
            <p className="text-sm text-gray-500">Pedidos listos para pick</p>
            <p className="text-2xl font-bold">
              {ordersCount ? formatNumber(ordersCount.count) : "—"}
            </p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="audit">
          <TabsList>
            <TabsTrigger value="audit">Log de Auditoría</TabsTrigger>
            <TabsTrigger value="history">Historial de Picking</TabsTrigger>
          </TabsList>

          {/* ────────────────────────────────────────────── */}
          {/* Tab 1 — Log de Auditoría                       */}
          {/* ────────────────────────────────────────────── */}
          <TabsContent value="audit" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                  <div className="space-y-1">
                    <Label>Buscar usuario</Label>
                    <Input
                      placeholder="Nombre de usuario"
                      value={auditUserDraft}
                      onChange={(e) => setAuditUserDraft(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Buscar pedido</Label>
                    <Input
                      placeholder="ID de pedido"
                      value={auditOrderDraft}
                      onChange={(e) => setAuditOrderDraft(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Acción</Label>
                    <Select
                      value={auditActionDraft}
                      onValueChange={setAuditActionDraft}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="pick">Pick</SelectItem>
                        <SelectItem value="unpick">Unpick</SelectItem>
                        <SelectItem value="missing">Missing</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="cancel">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Desde</Label>
                    <Input
                      type="date"
                      value={auditFromDraft}
                      onChange={(e) => setAuditFromDraft(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Hasta</Label>
                    <Input
                      type="date"
                      value={auditToDraft}
                      onChange={(e) => setAuditToDraft(e.target.value)}
                    />
                  </div>
                  <div>
                    <Button onClick={handleAuditSearch} className="w-full">
                      Buscar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        </TableRow>
                      ))
                    ) : auditData?.entries?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No se encontraron registros
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditData?.entries?.map((entry) => (
                        <TableRow key={entry._id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(entry.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={getActionBadgeClass(entry.action)}
                            >
                              {entry.action}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.user_name}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {entry.order_display_id || entry.order_id}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                            {formatDetails(entry.details)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {!auditLoading && auditTotal > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Mostrando {auditOffset + 1}–
                  {Math.min(auditOffset + PAGE_SIZE, auditTotal)} de{" "}
                  {formatNumber(auditTotal)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!auditHasPrev}
                    onClick={auditPrev}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!auditHasNext}
                    onClick={auditNext}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ────────────────────────────────────────────── */}
          {/* Tab 2 — Historial de Picking                   */}
          {/* ────────────────────────────────────────────── */}
          <TabsContent value="history" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <Label>Picker</Label>
                    <Select
                      value={historyPickerDraft}
                      onValueChange={setHistoryPickerDraft}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {pickingUsers?.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Desde</Label>
                    <Input
                      type="date"
                      value={historyFromDraft}
                      onChange={(e) => setHistoryFromDraft(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Hasta</Label>
                    <Input
                      type="date"
                      value={historyToDraft}
                      onChange={(e) => setHistoryToDraft(e.target.value)}
                    />
                  </div>
                  <div>
                    <Button onClick={handleHistorySearch} className="w-full">
                      Buscar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Picker</TableHead>
                      <TableHead>Pedido</TableHead>
                      <TableHead className="text-right">Items Pickeados</TableHead>
                      <TableHead className="text-right">Faltantes</TableHead>
                      <TableHead className="text-right">Tiempo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : historyData?.entries?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No se encontraron registros
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyData?.entries?.map((entry) => (
                        <TableRow key={entry._id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(entry.completed_at)}
                          </TableCell>
                          <TableCell>{entry.user_name}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {entry.order_display_id || entry.order_id}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(entry.items_picked)}
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.items_missing > 0 ? (
                              <span className="text-red-600 font-medium">
                                {formatNumber(entry.items_missing)}
                              </span>
                            ) : (
                              formatNumber(entry.items_missing)
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {formatTime(entry.pick_time_seconds)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {!historyLoading && historyTotal > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Mostrando {historyOffset + 1}–
                  {Math.min(historyOffset + PAGE_SIZE, historyTotal)} de{" "}
                  {formatNumber(historyTotal)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!historyHasPrev}
                    onClick={historyPrev}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!historyHasNext}
                    onClick={historyNext}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
