"use client"

import { useState, useMemo } from "react"
import {
  useAuthorizedOrders,
  useOrderPaymentDetails,
  useCapturePayment,
  useAddOrderNote,
} from "@/hooks/use-admin-payments"
import { useAdminUser } from "@/hooks/use-admin-user"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 20

function formatCurrency(amount: number, code: string): string {
  return (amount / 1).toLocaleString("es-AR", {
    style: "currency",
    currency: code?.toUpperCase() || "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type CaptureModal = {
  orderId: string
  displayId: number
  email: string
  total: number
  currencyCode: string
} | null

export default function PagosPendientesPage() {
  const [offset, setOffset] = useState(0)
  const [modal, setModal] = useState<CaptureModal>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { data: allAuthorized, isLoading, error } = useAuthorizedOrders()

  // Paginación client-side
  const count = allAuthorized?.length ?? 0
  const orders = useMemo(
    () => allAuthorized?.slice(offset, offset + PAGE_SIZE) ?? [],
    [allAuthorized, offset]
  )

  const {
    data: orderDetails,
    isLoading: loadingDetails,
    error: detailsError,
  } = useOrderPaymentDetails(modal?.orderId)

  const { data: adminUser } = useAdminUser()
  const capturePayment = useCapturePayment()
  const addNote = useAddOrderNote()

  const isCapturing = capturePayment.isPending || addNote.isPending

  async function handleCapture() {
    if (!modal || !orderDetails) return
    setActionError(null)

    // Extraer payment_id de la cadena order → payment_collections → payments
    const paymentCollection = orderDetails.payment_collections?.[0]
    const payment =
      paymentCollection?.payments?.[0] ??
      paymentCollection?.payment_sessions?.[0]?.payment

    if (!payment?.id) {
      setActionError(
        "No se encontró el ID de pago para esta orden. Verificá que tenga un payment collection con pagos."
      )
      return
    }

    try {
      // 1. Capturar el pago
      await capturePayment.mutateAsync(payment.id)

      // 2. Agregar nota de auditoría (best-effort)
      const adminEmail = adminUser?.email ?? "admin desconocido"
      const now = formatDateTime(new Date())
      try {
        await addNote.mutateAsync({
          orderId: modal.orderId,
          value: `Pago capturado manualmente por ${adminEmail} el ${now}`,
        })
      } catch {
        // La nota es best-effort — el pago ya se capturó exitosamente
        console.warn("Pago capturado pero no se pudo agregar la nota de auditoría")
      }

      setSuccessMessage(
        `Pago capturado exitosamente para orden #${modal.displayId}`
      )
      setModal(null)
    } catch (e: unknown) {
      setActionError(
        e instanceof Error ? e.message : "Error al capturar el pago"
      )
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Pagos Pendientes
        </h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar órdenes. Verificá la conexión con Medusa.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Pagos Pendientes
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Órdenes con pago autorizado esperando confirmación de transferencia
          bancaria
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md text-sm flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            className="text-green-500 hover:text-green-700 text-xs ml-4"
            onClick={() => setSuccessMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Error message */}
      {actionError && !modal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button
            className="text-red-500 hover:text-red-700 text-xs ml-4"
            onClick={() => setActionError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Capture confirmation modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Capturar Pago</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Confirmar la captura del pago para esta orden
                </p>
              </div>

              <div className="bg-gray-50 border rounded-md p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Orden:</span>
                  <span className="font-mono font-medium">
                    #{modal.displayId}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cliente:</span>
                  <span className="font-medium">{modal.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-mono font-bold text-green-700">
                    {formatCurrency(modal.total, modal.currencyCode)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Autorizado por:</span>
                  <span className="font-medium text-mk-pink">
                    {adminUser?.email ?? "..."}
                  </span>
                </div>
              </div>

              {loadingDetails && (
                <div className="text-sm text-blue-500 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Cargando datos de pago...
                </div>
              )}

              {detailsError && (
                <div className="text-sm text-red-500">
                  Error al cargar datos de pago. Intentá de nuevo.
                </div>
              )}

              {actionError && modal && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {actionError}
                </div>
              )}

              <p className="text-xs text-gray-400">
                Esta acción capturará el pago y quedará registrado quién lo
                realizó mediante una nota en la orden.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
                  onClick={() => {
                    setModal(null)
                    setActionError(null)
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={isCapturing || loadingDetails || !orderDetails}
                  onClick={handleCapture}
                >
                  {isCapturing ? "Capturando..." : "Confirmar Captura"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !orders.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-gray-500"
                    >
                      <div className="space-y-2">
                        <p className="text-lg">🎉 No hay pagos pendientes</p>
                        <p className="text-sm">
                          Todas las órdenes tienen sus pagos capturados
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order: any) => {
                    const addr = order.shipping_address
                    const location = [addr?.city, addr?.province]
                      .filter(Boolean)
                      .join(", ") || "—"

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">
                          #{order.display_id}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="text-sm font-medium">
                              {order.email}
                            </span>
                            {addr?.first_name && (
                              <p className="text-xs text-gray-400">
                                {addr.first_name} {addr.last_name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {location}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(
                            order.total,
                            order.currency_code
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
                            disabled={isCapturing}
                            onClick={() =>
                              setModal({
                                orderId: order.id,
                                displayId: order.display_id,
                                email: order.email,
                                total: order.total,
                                currencyCode: order.currency_code,
                              })
                            }
                          >
                            Capturar Pago
                          </button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {count > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-gray-500">
                Mostrando {offset + 1}-{Math.min(offset + PAGE_SIZE, count)} de{" "}
                {count}
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  Anterior
                </button>
                <button
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                  disabled={offset + PAGE_SIZE >= count}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
