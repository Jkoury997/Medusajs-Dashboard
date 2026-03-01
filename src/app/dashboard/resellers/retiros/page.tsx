"use client"

import { useState } from "react"
import {
  useWithdrawals,
  useApproveWithdrawal,
  useRejectWithdrawal,
  useMarkWithdrawalPaid,
} from "@/hooks/use-resellers"
import type { WithdrawalStatus, WithdrawalRequest } from "@/types/reseller"
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

/* ── Bank details card component ── */
function BankDetailsCard({ reseller }: { reseller?: WithdrawalRequest["reseller"] }) {
  if (!reseller?.bank_account_configured) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
        <p className="text-sm text-yellow-700 font-medium">⚠ Sin datos bancarios configurados</p>
        <p className="text-xs text-yellow-600 mt-1">La revendedora aún no cargó sus datos bancarios.</p>
      </div>
    )
  }
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
      <p className="text-sm font-semibold text-blue-800 mb-2">Datos bancarios para transferir</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Titular:</span>
          <span className="font-medium text-gray-900">{reseller.bank_account_holder ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Banco:</span>
          <span className="font-medium text-gray-900">{reseller.bank_name ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">CBU / Alias:</span>
          <span className="font-mono font-medium text-gray-900">{reseller.bank_cbu ?? "-"}</span>
        </div>
      </div>
    </div>
  )
}

type ModalType =
  | { kind: "reject"; id: string; name: string }
  | { kind: "approve"; id: string; name: string; amount: number; reseller?: WithdrawalRequest["reseller"] }
  | { kind: "mark-paid"; id: string; name: string; amount: number; reseller?: WithdrawalRequest["reseller"] }
  | { kind: "bank-details"; name: string; reseller?: WithdrawalRequest["reseller"] }
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
  const [uploading, setUploading] = useState(false)
  const [uploadFileName, setUploadFileName] = useState("")

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

  async function handleApprove() {
    if (!modal || modal.kind !== "approve") return
    setActionError(null)
    try {
      await approve.mutateAsync(modal.id)
      setModal(null)
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

  async function handleFileUpload(file: File) {
    setUploading(true)
    setActionError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Error al subir archivo")
      const data = await res.json()
      setPaymentProof(data.url)
      setUploadFileName(file.name)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al subir comprobante")
    } finally {
      setUploading(false)
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
      setUploadFileName("")
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
    setUploadFileName("")
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

      {/* ── Approve modal with bank details ── */}
      {modal?.kind === "approve" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="font-semibold text-lg mb-1">Aprobar Retiro</h3>
            <p className="text-sm text-gray-500 mb-4">
              {modal.name} — {formatCentavos(modal.amount)}
            </p>
            <BankDetailsCard reseller={modal.reseller} />
            <p className="text-sm text-gray-600 mb-4">
              ¿Confirmar la aprobación de este retiro?
            </p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 text-sm border rounded-md" onClick={closeModal}>
                Cancelar
              </button>
              <button
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50"
                disabled={isActioning}
                onClick={handleApprove}
              >
                Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject modal ── */}
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

      {/* ── Mark paid modal with bank details ── */}
      {modal?.kind === "mark-paid" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
            <h3 className="font-semibold text-lg mb-1">Marcar como Pagado</h3>
            <p className="text-sm text-gray-500 mb-4">
              {modal.name} — {formatCentavos(modal.amount)}
            </p>
            <BankDetailsCard reseller={modal.reseller} />
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
                <label className="block text-sm text-gray-600 mb-1">Comprobante de pago</label>
                {paymentProof ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">
                      {uploadFileName || "Archivo subido"}
                    </span>
                    <button
                      className="text-xs text-red-500 hover:underline"
                      onClick={() => { setPaymentProof(""); setUploadFileName("") }}
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="w-full text-sm border rounded-md p-1.5 file:mr-2 file:py-1 file:px-3 file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 file:rounded file:cursor-pointer"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                )}
                {uploading && (
                  <p className="text-xs text-blue-500 mt-1">Subiendo comprobante...</p>
                )}
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
                disabled={isActioning || uploading}
                onClick={handleMarkPaid}
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bank details view modal ── */}
      {modal?.kind === "bank-details" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="font-semibold text-lg mb-1">Datos Bancarios</h3>
            <p className="text-sm text-gray-500 mb-4">{modal.name}</p>
            <BankDetailsCard reseller={modal.reseller} />
            <div className="flex justify-end">
              <button className="px-4 py-2 text-sm border rounded-md" onClick={closeModal}>
                Cerrar
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
                  <TableHead>Banco</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data?.withdrawals?.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
                          {w.reseller?.bank_name ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 font-mono">
                          {w.payment_reference ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(w.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap">
                            {w.status === "pending" && (
                              <>
                                <button
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-50"
                                  disabled={isActioning}
                                  onClick={() =>
                                    setModal({
                                      kind: "approve",
                                      id: w.id,
                                      name: resellerName,
                                      amount: w.requested_amount,
                                      reseller: w.reseller,
                                    })
                                  }
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
                                    reseller: w.reseller,
                                  })
                                }
                              >
                                Marcar Pagado
                              </button>
                            )}
                            {w.status === "paid" && w.payment_reference && (
                              <span className="text-xs text-green-600 font-mono">
                                {w.payment_reference}
                              </span>
                            )}
                            {/* Bank details button - always visible */}
                            <button
                              className="px-2 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
                              onClick={() =>
                                setModal({
                                  kind: "bank-details",
                                  name: resellerName,
                                  reseller: w.reseller,
                                })
                              }
                            >
                              Datos bancarios
                            </button>
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
