"use client"

import { useState } from "react"
import { useEmployees, useCreateEmployee } from "@/hooks/use-employees"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, DollarSign, ShoppingCart, Percent, UserPlus, Copy } from "lucide-react"

const STOREFRONT_URL = "https://marcelakoury.com"

function formatCentavos(centavos: number): string {
  return ((centavos || 0) / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export default function EmpleadosPage() {
  const { data, isLoading, error } = useEmployees()
  const createEmployee = useCreateEmployee()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    commission_percentage: "",
  })

  const employees = data?.employees ?? []
  const defaultPct = data?.commission_percentage_default ?? 2

  const totals = employees.reduce(
    (acc, e) => {
      acc.sales += e.total_sales_amount || 0
      acc.commissions += e.total_commissions_earned || 0
      acc.orders += e.total_orders || 0
      return acc
    },
    { sales: 0, commissions: 0, orders: 0 },
  )

  async function handleCreate() {
    try {
      await createEmployee.mutateAsync({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        commission_percentage: form.commission_percentage
          ? Number(form.commission_percentage)
          : undefined,
      })
      setShowCreate(false)
      setForm({ email: "", password: "", first_name: "", last_name: "", commission_percentage: "" })
    } catch {
      /* el error se muestra en el dialog */
    }
  }

  function copyLink(code: string) {
    void navigator.clipboard?.writeText(`${STOREFRONT_URL}/?ref=${code}`)
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Empleados</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar empleados.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
          <p className="text-sm text-gray-500">
            Cada empleado comparte su link <code>?ref=</code> y se le atribuye la venta web + comisión.
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Empleado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Apellido *</Label>
                  <Input
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="empleado@marcelakoury.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Contraseña *</Label>
                  <Input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <Label>Comisión % (opcional)</Label>
                  <Input
                    type="number"
                    value={form.commission_percentage}
                    onChange={(e) => setForm({ ...form, commission_percentage: e.target.value })}
                    placeholder={`Default ${defaultPct}%`}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Con email + contraseña el empleado puede entrar al portal a ver sus comisiones. El
                código de referido se genera automáticamente.
              </p>
              <Button
                onClick={handleCreate}
                disabled={
                  !form.email ||
                  form.password.length < 6 ||
                  !form.first_name ||
                  !form.last_name ||
                  createEmployee.isPending
                }
                className="w-full"
              >
                {createEmployee.isPending ? "Creando..." : "Crear Empleado"}
              </Button>
              {createEmployee.isError && (
                <p className="text-sm text-red-500">{(createEmployee.error as Error).message}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-3" />
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Empleados"
              value={String(employees.length)}
              icon={<Users className="h-5 w-5" />}
              subtitle={`${employees.filter((e) => e.status === "active").length} activos`}
            />
            <MetricCard
              title="Ventas atribuidas"
              value={formatCentavos(totals.sales)}
              icon={<ShoppingCart className="h-5 w-5" />}
              subtitle={`${totals.orders} órdenes`}
            />
            <MetricCard
              title="Comisiones generadas"
              value={formatCentavos(totals.commissions)}
              icon={<DollarSign className="h-5 w-5" />}
              subtitle="Total acumulado"
            />
            <MetricCard
              title="Comisión default"
              value={`${defaultPct}%`}
              icon={<Percent className="h-5 w-5" />}
              subtitle="Tipo Empleado"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ranking de empleados</CardTitle>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay empleados todavía. Creá uno con el botón de arriba.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="text-right">Comisión</TableHead>
                      <TableHead className="text-right">Ventas</TableHead>
                      <TableHead className="text-right">Órdenes</TableHead>
                      <TableHead className="text-right">Comisión ganada</TableHead>
                      <TableHead className="text-right">Pendiente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...employees]
                      .sort((a, b) => (b.total_sales_amount || 0) - (a.total_sales_amount || 0))
                      .map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <p className="font-medium">
                              {[e.first_name, e.last_name].filter(Boolean).join(" ") || e.email}
                            </p>
                            <p className="text-xs text-gray-500">{e.email}</p>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => copyLink(e.referral_code)}
                              className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                              title="Copiar link de referido"
                            >
                              <code>{e.referral_code}</code>
                              <Copy className="h-3 w-3" />
                            </button>
                          </TableCell>
                          <TableCell className="text-right">{e.commission_percentage}%</TableCell>
                          <TableCell className="text-right">
                            {formatCentavos(e.total_sales_amount)}
                          </TableCell>
                          <TableCell className="text-right">{e.total_orders}</TableCell>
                          <TableCell className="text-right">
                            {formatCentavos(e.total_commissions_earned)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCentavos(e.pending_balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
