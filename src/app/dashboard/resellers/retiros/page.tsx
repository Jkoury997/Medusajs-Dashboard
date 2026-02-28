"use client"

import { useState } from "react"
import {
  useWithdrawals,
  useApproveWithdrawal,
  useRejectWithdrawal,
  useMarkWithdrawalPaid,
} from "@/hooks/use-resellers"
import type { WithdrawalStatus } from "@/types/reseller"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 20

const STATUS_CONFIG: Record<WithdrawalStatus, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Aprobado", className: "bg-blue-100 text-blue-700" },
  paid: { label: "Pagado", className: "bg-green-100 text-green-700" },
  rejected: { label: "Rechazado", className: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelado", className: "bg-gray-100 text-gray-600" },
}

const STATUS_TABS: { value: WithdrawalStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobados" },
  { value: "paid", label: "Pagados" },
  { value: "rejected", label: "Rechazados" },
]

function formatCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
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

type ModalType =
  | { kind: "reject"; id: string; name: string }
  | { kind: "mark-paid"; id: string; name: string; amount: number }
  | null

export default function ResellersRetirosPage() {
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | "">("")
  const [offset, setOffset] = useState(0)
  const [actionError, setActionError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalType>(null)

  // Reject form
  const [rejectReason, setRejectReason] = useState("")

  // Mark paid form
  const [paymentRef, setPaymentRef] = useState("")
  const [paymentProof, setPaymentProof] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")

  const { data, isLoading, error } = useWithdrawals({
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset,
  })

  const approve = useApproveWithdrawal()
  const reject = useRejectWithdrawal()
  const markPaid = useMarkWithdrawalPaid()

  const isActioning = approve.isPending || reject.isPending || markPaid.isPending
  const count = data?.count ?? 0

  async function handleApprove(id: string) {
    setActionError(null)
    try {
      await approve.mutateAsync(id)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al aprobar")
    }
  }

  async function handleReject() {
    if (!modal || modal.kind !== "reject") return
    if (!rejectReason.trim()) return
    setActionError(null)
    try {
      await reject.mutateAsync({ id: modal.id, rejection_reason: rejectReason })
      setModal(null)
      setRejectReason("")
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al rechazar")
    }
  }

  async function handleMarkPaid() {
    if (!modal || modal.kind !== "mark-paid") return
    setActionError(null)
    try {
      await markPaid.mutateAsync({
        id: modal.id,
        data: {
          payment_reference: paymentRef || undefined,
          payment_proof: paymentProof || undefined,
          payment_notes: paymentNotes || undefined,
        },
      })
      setModal(null)
      setPaymentRef("")
      setPaymentProof("")
      setPaymentNotes("")
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al marcar como pagado")
    }
  }

  function closeModal() {
    setModal(null)
    setRejectReason("")
    setPaymentRef("")
    setPaymentProof("")
    setPaymentNotes("")
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Retiros</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar retiros. Verificá que la API esté configurada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Retiros</h1>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {actionError}
        </div>
      )}

      {/* Reject modal */}
      {modal?.kind === "reject" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="font-semibold text-lg mb-1">Rechazar Retiro</h3>
            <p className="text-sm text-gray-500 mb-4">{modal.name}</p>
            <label className="block text-sm text-gray-600 mb-1">Motivo del rechazo *</label>
            <textarea
              className="w-full border rounded-md p-2 text-sm mb-4"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ingresá el motivo del rechazo..."
            />
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 text-sm border rounded-md" onClick={closeModal}>
                Cancelar
              </button>
              <button
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md disabled:opacity-50"
                disabled={isActioning || !rejectReason.trim()}
                onClick={handleReject}
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark paid modal */}
      {modal?.kind === "mark-paid" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="font-semibold text-lg mb-1">Marcar como Pagado</h3>
            <p className="text-sm text-gray-500 mb-4">
              {modal.name} — {formatCentavos(modal.amount)}
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nro. de transacción / referencia</label>
                <Input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="ej: TRF-123456"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">URL comprobante</label>
                <Input
                  value={paymentProof}
                  onChange={(e) => setPaymentProof(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Notas</label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm"
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 text-sm border rounded-md" onClick={closeModal}>
                Cancelar
              </button>
              <button
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md disabled:opacity-50"
                disabled={isActioning}
                onClick={handleMarkPaid}
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === tab.value
                ? "border-mk-pink text-mk-pink"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setStatusFilter(tab.value)
              setOffset(0)
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Revendedora</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data?.withdrawals?.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No hay retiros
                    </TableCell>
                  </TableRow>
                ) : (
                  data.withdrawals.map((w) => {
                    const statusCfg = STATUS_CONFIG[w.status] ?? {
                      label: w.status,
                      className: "bg-gray-100 text-gray-600",
                    }
                    const resellerName = w.reseller
                      ? `${w.reseller.first_name} ${w.reseller.last_name}`
                      : w.reseller_id.slice(0, 12) + "..."
                    return (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">
                          {resellerName}
                          {w.is_first_withdrawal && (
                            <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                              1er retiro
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCentavos(w.requested_amount)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}
                          >
                            {statusCfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {w.payment_method ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 font-mono">
                          {w.payment_reference ?? "-"}
                        </TableCell>
                        <TableCell
                          className="text-sm text-gray-500 max-w-[150px] truncate"
                          title={w.reseller_notes || w.payment_notes || ""}
                        >
                          {w.reseller_notes || w.payment_notes || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(w.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {w.status === "pending" && (
                              <>
                                <button
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-50"
                                  disabled={isActioning}
                                  onClick={() => handleApprove(w.id)}
                                >
                                  Aprobar
                                </button>
                                <button
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded disabled:opacity-50"
                                  disabled={isActioning}
                                  onClick={() =>
                                    setModal({ kind: "reject", id: w.id, name: resellerName })
                                  }
                                >
                                  Rechazar
                                </button>
                              </>
                            )}
                            {w.status === "approved" && (
                              <button
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded disabled:opacity-50"
                                disabled={isActioning}
                                onClick={() =>
                                  setModal({
                                    kind: "mark-paid",
                                    id: w.id,
                                    name: resellerName,
                                    amount: w.requested_amount,
                                  })
                                }
                              >
                                Marcar Pagado
                              </button>
                            )}
                            {w.status === "rejected" && w.payment_notes && (
                              <span className="text-xs text-red-500" title={w.payment_notes}>
                                {w.payment_notes.slice(0, 30)}...
                              </span>
                            )}
                            {w.status === "paid" && w.payment_reference && (
                              <span className="text-xs text-green-600 font-mono">
                                {w.payment_reference}
                              </span>
                            )}
                          </div>
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
                Mostrando {offset + 1}-{Math.min(offset + PAGE_SIZE, count)} de {count}
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
