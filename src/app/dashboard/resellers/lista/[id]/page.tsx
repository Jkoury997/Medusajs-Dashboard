"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  useResellerDetail,
  useResellerCustomers,
  useResellerCommissions,
  useApproveReseller,
  useSuspendReseller,
  useReactivateReseller,
  useUpdateReseller,
} from "@/hooks/use-resellers"
import type { ResellerStatus } from "@/types/reseller"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_CONFIG: Record<ResellerStatus, { label: string; className: string }> = {
  active: { label: "Activa", className: "bg-green-100 text-green-700" },
  pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  suspended: { label: "Suspendida", className: "bg-red-100 text-red-700" },
  rejected: { label: "Rechazada", className: "bg-gray-100 text-gray-600" },
}

function formatCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

type Tab = "info" | "customers" | "commissions"

export default function ResellerDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data: reseller, isLoading, error } = useResellerDetail(id)
  const { data: customers, isLoading: loadingCustomers } = useResellerCustomers(id)
  const { data: commissions, isLoading: loadingCommissions } = useResellerCommissions(id)

  const [tab, setTab] = useState<Tab>("info")
  const [actionError, setActionError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editCommission, setEditCommission] = useState("")
  const [editDiscount, setEditDiscount] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [suspendReason, setSuspendReason] = useState("")
  const [showSuspend, setShowSuspend] = useState(false)

  const approve = useApproveReseller()
  const suspend = useSuspendReseller()
  const reactivate = useReactivateReseller()
  const update = useUpdateReseller()

  const isActioning = approve.isPending || suspend.isPending || reactivate.isPending || update.isPending

  function startEdit() {
    if (!reseller) return
    setEditCommission(reseller.custom_commission_percentage?.toString() ?? "")
    setEditDiscount(reseller.custom_customer_discount_percentage?.toString() ?? "")
    setEditNotes("")
    setEditing(true)
  }

  async function saveEdit() {
    if (!reseller) return
    setActionError(null)
    try {
      await update.mutateAsync({
        id: reseller.id,
        data: {
          custom_commission_percentage: editCommission ? Number(editCommission) : null,
          custom_customer_discount_percentage: editDiscount ? Number(editDiscount) : null,
          admin_notes: editNotes || undefined,
        },
      })
      setEditing(false)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al guardar")
    }
  }

  async function handleApprove() {
    if (!reseller) return
    setActionError(null)
    try {
      await approve.mutateAsync(reseller.id)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al aprobar")
    }
  }

  async function handleReject() {
    if (!reseller) return
    setActionError(null)
    try {
      await update.mutateAsync({ id: reseller.id, data: { status: "rejected" } })
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al rechazar")
    }
  }

  async function handleSuspend() {
    if (!reseller) return
    setActionError(null)
    try {
      await suspend.mutateAsync({ id: reseller.id, reason: suspendReason || undefined })
      setShowSuspend(false)
      setSuspendReason("")
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al suspender")
    }
  }

  async function handleReactivate() {
    if (!reseller) return
    setActionError(null)
    try {
      await reactivate.mutateAsync(reseller.id)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al reactivar")
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <Link href="/dashboard/resellers/lista" className="text-blue-600 hover:underline text-sm">
          &larr; Volver a Lista
        </Link>
        <Card className="mt-4">
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar detalle de revendedora.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !reseller) {
    return (
      <div className="p-6">
        <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mb-4" />
        <div className="h-64 bg-gray-100 animate-pulse rounded" />
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[reseller.status] ?? { label: reseller.status, className: "bg-gray-100 text-gray-600" }

  const tabs: { key: Tab; label: string }[] = [
    { key: "info", label: "Información" },
    { key: "customers", label: `Clientes (${customers?.length ?? "..."})` },
    { key: "commissions", label: `Comisiones (${commissions?.length ?? "..."})` },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/resellers/lista" className="text-blue-600 hover:underline text-sm">
            &larr; Volver a Lista
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {reseller.first_name} {reseller.last_name}
          </h1>
          <p className="text-sm text-gray-500">{reseller.email} &middot; {reseller.phone || "Sin teléfono"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusCfg.className}`}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {actionError}
        </div>
      )}

      {/* Actions bar */}
      <div className="flex flex-wrap gap-2">
        {reseller.status === "pending" && (
          <>
            <button
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md disabled:opacity-50"
              disabled={isActioning}
              onClick={handleApprove}
            >
              Aprobar
            </button>
            <button
              className="px-4 py-2 text-sm bg-gray-500 text-white rounded-md disabled:opacity-50"
              disabled={isActioning}
              onClick={handleReject}
            >
              Rechazar
            </button>
          </>
        )}
        {reseller.status === "active" && (
          <button
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-md disabled:opacity-50"
            disabled={isActioning}
            onClick={() => setShowSuspend(true)}
          >
            Suspender
          </button>
        )}
        {reseller.status === "suspended" && (
          <button
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50"
            disabled={isActioning}
            onClick={handleReactivate}
          >
            Reactivar
          </button>
        )}
        {!editing && (
          <button
            className="px-4 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-50"
            onClick={startEdit}
          >
            Editar Comisiones
          </button>
        )}
      </div>

      {/* Suspend modal */}
      {showSuspend && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="font-semibold text-lg mb-3">Suspender Revendedora</h3>
            <label className="block text-sm text-gray-600 mb-1">Motivo (opcional)</label>
            <textarea
              className="w-full border rounded-md p-2 text-sm mb-4"
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Ingresá el motivo de la suspensión..."
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm border rounded-md"
                onClick={() => { setShowSuspend(false); setSuspendReason("") }}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md disabled:opacity-50"
                disabled={isActioning}
                onClick={handleSuspend}
              >
                Suspender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {tab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Datos Generales</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Tipo" value={reseller.type?.display_name ?? "-"} />
              <Row label="Código referido" value={reseller.referral_code} mono />
              <Row label="Contrato firmado" value={reseller.has_signed_contract ? "Sí" : "No"} />
              <Row label="Cert. Monotributo" value={reseller.has_monotributo_cert ? "Sí" : "No"} />
              <Row label="Registrada" value={fmtDate(reseller.created_at)} />
            </CardContent>
          </Card>

          {/* Financial info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Finanzas</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Ventas totales" value={formatCentavos(reseller.total_sales_amount)} mono />
              <Row label="Comisiones ganadas" value={formatCentavos(reseller.total_commissions_earned)} mono />
              <Row label="Comisiones pagadas" value={formatCentavos(reseller.total_commissions_paid)} mono />
              <Row label="Saldo pendiente" value={formatCentavos(reseller.pending_balance)} mono />
              <Row label="Total pedidos" value={String(reseller.total_orders)} />
              <Row label="Total clientes" value={String(reseller.total_customers)} />
            </CardContent>
          </Card>

          {/* Commission settings */}
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-base">Comisiones Personalizadas</CardTitle></CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Comisión %</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={editCommission}
                        onChange={(e) => setEditCommission(e.target.value)}
                        placeholder={`Default: ${reseller.type?.default_commission_percentage ?? "N/A"}%`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Descuento cliente %</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={editDiscount}
                        onChange={(e) => setEditDiscount(e.target.value)}
                        placeholder="Dejar vacío = default del tipo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nota admin</label>
                      <input
                        type="text"
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Nota interna..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50"
                      disabled={isActioning}
                      onClick={saveEdit}
                    >
                      Guardar
                    </button>
                    <button
                      className="px-4 py-2 text-sm border rounded-md"
                      onClick={() => setEditing(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm space-y-2">
                  <Row
                    label="Comisión personalizada"
                    value={
                      reseller.custom_commission_percentage != null
                        ? `${reseller.custom_commission_percentage}%`
                        : `Default del tipo (${reseller.type?.default_commission_percentage ?? "N/A"}%)`
                    }
                  />
                  <Row
                    label="Descuento cliente personalizado"
                    value={
                      reseller.custom_customer_discount_percentage != null
                        ? `${reseller.custom_customer_discount_percentage}%`
                        : "Default del tipo"
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Customers */}
      {tab === "customers" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Pedidos</TableHead>
                    <TableHead className="text-right">Total Gastado</TableHead>
                    <TableHead>Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingCustomers ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !customers || customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Esta revendedora no tiene clientes aún
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {c.first_name} {c.last_name}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{c.email}</TableCell>
                        <TableCell className="text-center">{c.total_orders}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCentavos(c.total_spent)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{fmtDate(c.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Commissions */}
      {tab === "commissions" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead className="text-right">Venta</TableHead>
                    <TableHead className="text-center">%</TableHead>
                    <TableHead className="text-right">Comisión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingCommissions ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !commissions || commissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Esta revendedora no tiene comisiones aún
                      </TableCell>
                    </TableRow>
                  ) : (
                    commissions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-sm">
                          #{c.order_display_id ?? c.order_id?.slice(-6)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCentavos(c.sale_amount)}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {c.commission_percentage}%
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {formatCentavos(c.commission_amount)}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.status === "paid" ? "bg-green-100 text-green-700" :
                            c.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {c.status === "paid" ? "Pagada" :
                             c.status === "pending" ? "Pendiente" :
                             c.status === "approved" ? "Aprobada" : c.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{fmtDate(c.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={mono ? "font-mono" : "font-medium"}>{value}</span>
    </div>
  )
}
