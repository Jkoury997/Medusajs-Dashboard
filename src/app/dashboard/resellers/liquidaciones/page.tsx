"use client"

import { useState } from "react"
import {
  useSettlements,
  useLiquidar,
  type SettlementDetail,
} from "@/hooks/use-commission-settlements"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Wallet, DollarSign, Clock, CheckCircle2 } from "lucide-react"

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

function periodLabel(period: string): string {
  const [y, m] = period.split("-")
  const idx = Number(m) - 1
  return `${MESES[idx] ?? m} ${y}`
}

function currentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function formatCentavos(centavos: number): string {
  return ((centavos || 0) / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

type LiquidarTarget = {
  period: string
  employee_id?: string
  label: string
  amount: number
}

export default function LiquidacionesPage() {
  const [month, setMonth] = useState<string>(currentPeriod)
  const { data, isLoading, error } = useSettlements(month)
  const liquidar = useLiquidar()

  const [target, setTarget] = useState<LiquidarTarget | null>(null)
  const [paymentRef, setPaymentRef] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")

  const months = data?.months ?? []
  const periods = months.map((m) => m.period)
  // El mes actual siempre seleccionable aunque todavía no tenga comisiones.
  const monthOptions = periods.includes(month) ? periods : [month, ...periods]
  const summary = months.find((m) => m.period === month)
  const detail = data?.detail ?? []
  const settlements = data?.settlements ?? []
  const totalPending = summary?.pending_amount ?? 0

  function openLiquidar(t: LiquidarTarget) {
    setPaymentRef("")
    setPaymentNotes("")
    setTarget(t)
  }

  async function confirmLiquidar() {
    if (!target) return
    try {
      await liquidar.mutateAsync({
        period: target.period,
        employee_id: target.employee_id,
        payment_reference: paymentRef || undefined,
        payment_notes: paymentNotes || undefined,
      })
      setTarget(null)
    } catch {
      /* el error se muestra en el dialog */
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Liquidación de comisiones</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar las liquidaciones.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liquidación de comisiones</h1>
          <p className="text-sm text-gray-500">
            Pagá las comisiones de empleados por mes. Al liquidar, las comisiones pendientes del
            período se marcan como pagadas y queda registrado el retiro.
          </p>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
        >
          {monthOptions.map((p) => (
            <option key={p} value={p}>
              {periodLabel(p)}
            </option>
          ))}
        </select>
      </div>

      {isLoading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-3" />
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : months.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Todavía no hay comisiones para liquidar.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Pendiente de pago"
              value={formatCentavos(summary?.pending_amount ?? 0)}
              icon={<Clock className="h-5 w-5" />}
              subtitle={`${summary?.pending_count ?? 0} comisiones`}
            />
            <MetricCard
              title="Ya pagado"
              value={formatCentavos(summary?.paid_amount ?? 0)}
              icon={<CheckCircle2 className="h-5 w-5" />}
              subtitle={`${summary?.paid_count ?? 0} comisiones`}
            />
            <MetricCard
              title="Total del mes"
              value={formatCentavos(summary?.total_amount ?? 0)}
              icon={<DollarSign className="h-5 w-5" />}
              subtitle={periodLabel(month)}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Por empleado · {periodLabel(month)}</CardTitle>
              <Button
                onClick={() =>
                  openLiquidar({
                    period: month,
                    label: `todo ${periodLabel(month)}`,
                    amount: totalPending,
                  })
                }
                disabled={totalPending <= 0}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Liquidar todo el mes
              </Button>
            </CardHeader>
            <CardContent>
              {detail.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Sin comisiones este mes.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead className="text-right">Pendiente</TableHead>
                      <TableHead className="text-right">Pagado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.map((d: SettlementDetail) => (
                      <TableRow key={d.employee_id}>
                        <TableCell>
                          <p className="font-medium">{d.name}</p>
                          {d.email && <p className="text-xs text-gray-500">{d.email}</p>}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={d.pending_amount > 0 ? "text-amber-600 font-medium" : ""}>
                            {formatCentavos(d.pending_amount)}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">({d.pending_count})</span>
                        </TableCell>
                        <TableCell className="text-right text-gray-500">
                          {formatCentavos(d.paid_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCentavos(d.total_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={d.pending_amount <= 0}
                            onClick={() =>
                              openLiquidar({
                                period: month,
                                employee_id: d.employee_id,
                                label: d.name,
                                amount: d.pending_amount,
                              })
                            }
                          >
                            Liquidar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {settlements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Liquidaciones registradas · {periodLabel(month)}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Comisiones</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.employee_name}</TableCell>
                        <TableCell className="text-right">{formatCentavos(s.total_amount)}</TableCell>
                        <TableCell className="text-right">{s.commission_count}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {s.payment_reference || "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm text-gray-500">
                          {formatDate(s.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Liquidar comisiones</DialogTitle>
          </DialogHeader>
          {target && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Vas a liquidar <span className="font-medium">{target.label}</span> por{" "}
                <span className="font-medium">{formatCentavos(target.amount)}</span>. Las comisiones
                pendientes pasan a <span className="font-medium">pagadas</span> y se registra el
                retiro. Esta acción no se puede deshacer.
              </p>
              <div>
                <Label>Referencia de pago (opcional)</Label>
                <Input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Nº de transferencia, etc."
                />
              </div>
              <div>
                <Label>Notas (opcional)</Label>
                <Input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Observaciones"
                />
              </div>
              <Button
                onClick={confirmLiquidar}
                disabled={liquidar.isPending || target.amount <= 0}
                className="w-full"
              >
                {liquidar.isPending ? "Liquidando..." : `Confirmar liquidación`}
              </Button>
              {liquidar.isError && (
                <p className="text-sm text-red-500">{(liquidar.error as Error).message}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
