"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber, formatDate } from "@/lib/format"
import {
  useGestionOrders,
  useShipOrder,
  useDeliverOrder,
  useResolveFaltante,
  useCreateVoucher,
  useFaltantesReceive,
  useReceiveFaltante,
} from "@/hooks/use-picking"
import type { GestionTab, GestionOrder } from "@/types/picking"

export default function GestionPage() {
  const [activeTab, setActiveTab] = useState<GestionTab>("por-preparar")

  // --- Dialog states ---
  const [resolveOrderId, setResolveOrderId] = useState<string | null>(null)
  const [resolveResolution, setResolveResolution] = useState("")
  const [resolveNotes, setResolveNotes] = useState("")

  const [voucherOrderId, setVoucherOrderId] = useState<string | null>(null)
  const [voucherValue, setVoucherValue] = useState("")
  const [voucherNotes, setVoucherNotes] = useState("")

  const [receiveOrderId, setReceiveOrderId] = useState<string | null>(null)

  // --- Error state ---
  const [error, setError] = useState<string | null>(null)

  // --- Queries ---
  const { data, isLoading } = useGestionOrders(activeTab)
  const { data: faltantesData } = useFaltantesReceive(receiveOrderId)

  // --- Mutations ---
  const shipOrder = useShipOrder()
  const deliverOrder = useDeliverOrder()
  const resolveFaltante = useResolveFaltante()
  const createVoucher = useCreateVoucher()
  const receiveFaltante = useReceiveFaltante()

  const orders = data?.orders ?? []
  const counts = data?.counts ?? {
    "por-preparar": 0,
    faltantes: 0,
    "por-enviar": 0,
    enviados: 0,
  }

  // --- Handlers ---

  async function handleShipOrder(order: GestionOrder) {
    try {
      setError(null)
      await shipOrder.mutateAsync({
        orderId: order.order_id,
        orderDisplayId: order.order_display_id,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al marcar como enviado")
    }
  }

  async function handleDeliverOrder(order: GestionOrder) {
    try {
      setError(null)
      await deliverOrder.mutateAsync({
        orderId: order.order_id,
        orderDisplayId: order.order_display_id,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al marcar como entregado")
    }
  }

  async function handleResolveFaltante() {
    if (!resolveOrderId || !resolveResolution) return
    try {
      setError(null)
      await resolveFaltante.mutateAsync({
        orderId: resolveOrderId,
        resolution: resolveResolution,
        notes: resolveNotes || undefined,
      })
      setResolveOrderId(null)
      setResolveResolution("")
      setResolveNotes("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al resolver faltante")
    }
  }

  async function handleCreateVoucher() {
    if (!voucherOrderId || !voucherValue) return
    try {
      setError(null)
      await createVoucher.mutateAsync({
        orderId: voucherOrderId,
        value: Number(voucherValue),
        notes: voucherNotes || undefined,
      })
      setVoucherOrderId(null)
      setVoucherValue("")
      setVoucherNotes("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear voucher")
    }
  }

  async function handleReceiveFaltante(orderId: string, lineItemId: string) {
    try {
      setError(null)
      await receiveFaltante.mutateAsync({
        orderId,
        lineItemId,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar item recibido")
    }
  }

  // --- Loading skeleton ---
  function renderTableSkeleton(cols: number) {
    return (
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: cols }).map((_, j) => (
              <TableCell key={j}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Gesti\u00f3n de Pedidos"
        description="Preparaci\u00f3n, env\u00edo y resoluci\u00f3n de faltantes"
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900"
            >
              Cerrar
            </Button>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as GestionTab)}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="por-preparar">
              Por Preparar ({formatNumber(counts["por-preparar"])})
            </TabsTrigger>
            <TabsTrigger value="faltantes">
              Faltantes ({formatNumber(counts["faltantes"])})
            </TabsTrigger>
            <TabsTrigger value="por-enviar">
              Por Enviar ({formatNumber(counts["por-enviar"])})
            </TabsTrigger>
            <TabsTrigger value="enviados">
              Enviados ({formatNumber(counts["enviados"])})
            </TabsTrigger>
          </TabsList>

          {/* ===================== POR PREPARAR ===================== */}
          <TabsContent value="por-preparar">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead>M\u00e9todo Env\u00edo</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  {isLoading ? (
                    renderTableSkeleton(5)
                  ) : (
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            No hay pedidos por preparar
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => (
                          <TableRow key={order.order_id}>
                            <TableCell className="font-medium">
                              #{order.order_display_id}
                            </TableCell>
                            <TableCell>{order.customer_name}</TableCell>
                            <TableCell className="text-center">
                              {order.items_count}
                            </TableCell>
                            <TableCell>{order.shipping_method ?? "-"}</TableCell>
                            <TableCell>{formatDate(order.created_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  )}
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== FALTANTES ===================== */}
          <TabsContent value="faltantes">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-center">Faltantes</TableHead>
                      <TableHead className="text-center">Resuelto</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  {isLoading ? (
                    renderTableSkeleton(5)
                  ) : (
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            No hay pedidos con faltantes
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => (
                          <TableRow key={order.order_id}>
                            <TableCell className="font-medium">
                              #{order.order_display_id}
                            </TableCell>
                            <TableCell>{order.customer_name}</TableCell>
                            <TableCell className="text-center">
                              {order.faltantes_count ?? 0}
                            </TableCell>
                            <TableCell className="text-center">
                              {order.faltantes_resolved ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Resuelto
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                  Pendiente
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setResolveOrderId(order.order_id)
                                    setResolveResolution("")
                                    setResolveNotes("")
                                  }}
                                >
                                  Resolver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setVoucherOrderId(order.order_id)
                                    setVoucherValue("")
                                    setVoucherNotes("")
                                  }}
                                >
                                  Voucher
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setReceiveOrderId(order.order_id)}
                                >
                                  Recibir Items
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  )}
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== POR ENVIAR ===================== */}
          <TabsContent value="por-enviar">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead>Fecha Preparaci\u00f3n</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  {isLoading ? (
                    renderTableSkeleton(5)
                  ) : (
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            No hay pedidos por enviar
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => (
                          <TableRow key={order.order_id}>
                            <TableCell className="font-medium">
                              #{order.order_display_id}
                            </TableCell>
                            <TableCell>{order.customer_name}</TableCell>
                            <TableCell className="text-center">
                              {order.items_count}
                            </TableCell>
                            <TableCell>
                              {order.packed_at
                                ? formatDate(order.packed_at)
                                : order.picked_at
                                  ? formatDate(order.picked_at)
                                  : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleShipOrder(order)}
                                disabled={shipOrder.isPending}
                              >
                                {shipOrder.isPending
                                  ? "Enviando..."
                                  : "Marcar Enviado"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  )}
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== ENVIADOS ===================== */}
          <TabsContent value="enviados">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead>Fecha Env\u00edo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  {isLoading ? (
                    renderTableSkeleton(5)
                  ) : (
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            No hay pedidos enviados
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => (
                          <TableRow key={order.order_id}>
                            <TableCell className="font-medium">
                              #{order.order_display_id}
                            </TableCell>
                            <TableCell>{order.customer_name}</TableCell>
                            <TableCell className="text-center">
                              {order.items_count}
                            </TableCell>
                            <TableCell>
                              {order.shipped_at
                                ? formatDate(order.shipped_at)
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleDeliverOrder(order)}
                                disabled={deliverOrder.isPending}
                              >
                                {deliverOrder.isPending
                                  ? "Procesando..."
                                  : "Marcar Entregado"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  )}
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ===================== DIALOG: RESOLVER FALTANTE ===================== */}
      <Dialog
        open={resolveOrderId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setResolveOrderId(null)
            setResolveResolution("")
            setResolveNotes("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Faltante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">Resoluci\u00f3n</Label>
              <Select
                value={resolveResolution}
                onValueChange={setResolveResolution}
              >
                <SelectTrigger id="resolution">
                  <SelectValue placeholder="Seleccionar resoluci\u00f3n" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="refund">Reembolso</SelectItem>
                  <SelectItem value="replace">Reemplazar</SelectItem>
                  <SelectItem value="cancel_item">Cancelar item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolve-notes">Notas (opcional)</Label>
              <Textarea
                id="resolve-notes"
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolveOrderId(null)
                setResolveResolution("")
                setResolveNotes("")
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResolveFaltante}
              disabled={!resolveResolution || resolveFaltante.isPending}
            >
              {resolveFaltante.isPending ? "Resolviendo..." : "Resolver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== DIALOG: CREAR VOUCHER ===================== */}
      <Dialog
        open={voucherOrderId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setVoucherOrderId(null)
            setVoucherValue("")
            setVoucherNotes("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Voucher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="voucher-value">Valor del voucher</Label>
              <Input
                id="voucher-value"
                type="number"
                min="0"
                step="1"
                value={voucherValue}
                onChange={(e) => setVoucherValue(e.target.value)}
                placeholder="Ej: 5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voucher-notes">Notas (opcional)</Label>
              <Textarea
                id="voucher-notes"
                value={voucherNotes}
                onChange={(e) => setVoucherNotes(e.target.value)}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVoucherOrderId(null)
                setVoucherValue("")
                setVoucherNotes("")
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateVoucher}
              disabled={!voucherValue || Number(voucherValue) <= 0 || createVoucher.isPending}
            >
              {createVoucher.isPending ? "Creando..." : "Crear Voucher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== DIALOG: RECIBIR ITEMS ===================== */}
      <Dialog
        open={receiveOrderId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReceiveOrderId(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recibir Items Faltantes</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {!faltantesData ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : faltantesData?.items?.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No hay items faltantes para este pedido
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Faltante</TableHead>
                    <TableHead className="text-center">Recibido</TableHead>
                    <TableHead className="text-right">Acci\u00f3n</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faltantesData?.items?.map((item) => (
                    <TableRow key={item.line_item_id}>
                      <TableCell className="font-medium">
                        {item.product_title}
                      </TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell className="text-center">
                        {item.quantity_missing}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity_received}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleReceiveFaltante(
                              receiveOrderId!,
                              item.line_item_id
                            )
                          }
                          disabled={
                            receiveFaltante.isPending ||
                            item.quantity_received >= item.quantity_missing
                          }
                        >
                          {receiveFaltante.isPending
                            ? "Recibiendo..."
                            : "Recibir"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReceiveOrderId(null)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
