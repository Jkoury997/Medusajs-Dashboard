"use client"

import { useState } from "react"
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  type EmployeeBreakdown,
  type EmployeeRow,
} from "@/hooks/use-employees"
import { useCustomerGroups } from "@/hooks/use-customers"
import {
  useEmployeeFunnel,
  type FunnelBucket,
  type FunnelEmployeeBucket,
} from "@/hooks/use-employee-funnel"
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
import {
  Users,
  DollarSign,
  ShoppingCart,
  Percent,
  UserPlus,
  Copy,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Pencil,
  Tag,
} from "lucide-react"

const STOREFRONT_URL = "https://marcelakoury.com"
const DEFAULT_PCT = 2
const FUNNEL_RANGES = [30, 90, 180] as const

function formatCentavos(centavos: number): string {
  return ((centavos || 0) / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

// El funnel devuelve montos en pesos (no centavos).
function formatPesos(pesos: number): string {
  return (pesos || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

// Suma los desgloses (por canal o por grupo) de todos los empleados.
function mergeBreakdowns(rows: EmployeeBreakdown[][]): EmployeeBreakdown[] {
  const m = new Map<string, EmployeeBreakdown>()
  for (const list of rows) {
    for (const r of list) {
      const e = m.get(r.id) ?? { id: r.id, name: r.name, sales: 0, commission: 0, orders: 0 }
      e.sales += r.sales || 0
      e.commission += r.commission || 0
      e.orders += r.orders || 0
      m.set(r.id, e)
    }
  }
  return Array.from(m.values()).sort((a, b) => b.sales - a.sales)
}

function ConversionBar({ rate }: { rate: number }) {
  const pct = Math.max(0, Math.min(100, rate))
  const color = pct >= 40 ? "bg-green-500" : pct >= 20 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums w-12 text-right">{pct.toFixed(1)}%</span>
    </div>
  )
}

// Tabla genérica del funnel (canal / grupo / empleado).
function FunnelTable({
  label,
  rows,
}: {
  label: string
  rows: Array<FunnelBucket | FunnelEmployeeBucket>
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{label}</TableHead>
          <TableHead className="text-right">Carritos</TableHead>
          <TableHead className="text-right">Compraron</TableHead>
          <TableHead className="text-right">No compraron</TableHead>
          <TableHead className="text-right">Conversión</TableHead>
          <TableHead className="text-right">Ventas</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">
              {r.name}
              {"referral_code" in r && (
                <span className="ml-1 text-xs text-gray-400">({r.referral_code})</span>
              )}
            </TableCell>
            <TableCell className="text-right">{r.carts}</TableCell>
            <TableCell className="text-right text-green-600">{r.completed}</TableCell>
            <TableCell className="text-right text-gray-500">{r.abandoned}</TableCell>
            <TableCell className="text-right">
              <ConversionBar rate={r.conversion_rate} />
            </TableCell>
            <TableCell className="text-right">{formatPesos(r.completed_sales_amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Multi-select de customer groups (allowlist de comisión). Sin selección = todos.
function GroupMultiSelect({
  groups,
  selected,
  onChange,
}: {
  groups: { id: string; name: string }[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((g) => g !== id) : [...selected, id])
  }
  return (
    <div>
      <div className="max-h-40 overflow-y-auto rounded border border-gray-200 divide-y">
        {groups.length === 0 ? (
          <p className="text-xs text-gray-400 p-2">No hay customer groups.</p>
        ) : (
          groups.map((g) => (
            <label
              key={g.id}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(g.id)}
                onChange={() => toggle(g.id)}
              />
              <span>{g.name}</span>
            </label>
          ))
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {selected.length === 0
          ? "Sin selección = comisiona TODOS los grupos."
          : `Solo comisiona ${selected.length} grupo(s) seleccionado(s).`}
      </p>
    </div>
  )
}

// Badge de los grupos permitidos de un empleado en la tabla.
function GroupsBadge({ groups }: { groups: { id: string; name: string }[] }) {
  if (groups.length === 0) {
    return <span className="text-xs text-gray-400">Todos</span>
  }
  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {groups.map((g) => (
        <span
          key={g.id}
          className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded"
        >
          <Tag className="h-3 w-3" />
          {g.name}
        </span>
      ))}
    </div>
  )
}

type EditState = {
  id: string
  name: string
  commission_percentage: string
  active: boolean
  groups: string[]
}

export default function EmpleadosPage() {
  const { data, isLoading, error } = useEmployees()
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const { data: groupsData } = useCustomerGroups()
  const customerGroups: { id: string; name: string }[] = (groupsData?.customer_groups ?? []).map(
    (g: { id: string; name: string }) => ({ id: g.id, name: g.name }),
  )
  const [funnelDays, setFunnelDays] = useState<number>(90)
  const { data: funnel, isLoading: funnelLoading } = useEmployeeFunnel(funnelDays)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    commission_percentage: "",
  })
  const [createGroups, setCreateGroups] = useState<string[]>([])
  const [editing, setEditing] = useState<EditState | null>(null)

  const employees = data?.employees ?? []

  const totals = employees.reduce(
    (acc, e) => {
      acc.sales += e.total_sales_amount || 0
      acc.commissions += e.total_commissions_earned || 0
      acc.orders += e.total_orders || 0
      return acc
    },
    { sales: 0, commissions: 0, orders: 0 },
  )

  const byChannel = mergeBreakdowns(employees.map((e) => e.by_channel ?? []))
  const byGroup = mergeBreakdowns(employees.map((e) => e.by_group ?? []))

  async function handleCreate() {
    try {
      await createEmployee.mutateAsync({
        name: form.name,
        email: form.email,
        commission_percentage: form.commission_percentage
          ? Number(form.commission_percentage)
          : undefined,
        allowed_customer_group_ids: createGroups.length ? createGroups : undefined,
      })
      setShowCreate(false)
      setForm({ name: "", email: "", commission_percentage: "" })
      setCreateGroups([])
    } catch {
      /* el error se muestra en el dialog */
    }
  }

  function openEdit(e: EmployeeRow) {
    setEditing({
      id: e.id,
      name: e.name,
      commission_percentage: String(e.commission_percentage ?? ""),
      active: e.active,
      groups: e.allowed_customer_group_ids ?? [],
    })
  }

  async function handleEdit() {
    if (!editing) return
    try {
      await updateEmployee.mutateAsync({
        id: editing.id,
        name: editing.name,
        commission_percentage: editing.commission_percentage
          ? Number(editing.commission_percentage)
          : undefined,
        active: editing.active,
        allowed_customer_group_ids: editing.groups,
      })
      setEditing(null)
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
            Cada empleado comparte su link <code>?ref=</code> y se le atribuye la venta web +
            comisión.
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
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nombre y apellido"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="empleado@marcelakoury.com"
                  />
                </div>
                <div>
                  <Label>Comisión % (opcional)</Label>
                  <Input
                    type="number"
                    value={form.commission_percentage}
                    onChange={(e) => setForm({ ...form, commission_percentage: e.target.value })}
                    placeholder={`Default ${DEFAULT_PCT}%`}
                  />
                </div>
              </div>
              <div>
                <Label>Restringir a grupos de cliente (opcional)</Label>
                <GroupMultiSelect
                  groups={customerGroups}
                  selected={createGroups}
                  onChange={setCreateGroups}
                />
              </div>
              <p className="text-xs text-gray-500">
                El código de referido se genera automáticamente. La atribución mide la venta web por
                canal (MK/MakeYou/ML) y por grupo de cliente.
              </p>
              <Button
                onClick={handleCreate}
                disabled={
                  !form.name || !form.email || !form.email.includes("@") || createEmployee.isPending
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
              subtitle={`${employees.filter((e) => e.active).length} activos`}
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
              value={`${DEFAULT_PCT}%`}
              icon={<Percent className="h-5 w-5" />}
              subtitle="Sobre venta web"
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
                      <TableHead className="text-right">Grupos</TableHead>
                      <TableHead className="text-right">Ventas</TableHead>
                      <TableHead className="text-right">Órdenes</TableHead>
                      <TableHead className="text-right">Comisión ganada</TableHead>
                      <TableHead className="text-right">Pendiente</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...employees]
                      .sort((a, b) => (b.total_sales_amount || 0) - (a.total_sales_amount || 0))
                      .map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <p className="font-medium">{e.name || e.email}</p>
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
                            <GroupsBadge groups={e.allowed_customer_groups ?? []} />
                          </TableCell>
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
                          <TableCell className="text-right">
                            <button
                              type="button"
                              onClick={() => openEdit(e)}
                              className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 text-gray-500"
                              title="Editar empleado"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {(byChannel.length > 0 || byGroup.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Por canal de venta</CardTitle>
                </CardHeader>
                <CardContent>
                  {byChannel.length === 0 ? (
                    <p className="text-center text-gray-500 py-6">Sin datos todavía.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Canal</TableHead>
                          <TableHead className="text-right">Ventas</TableHead>
                          <TableHead className="text-right">Órdenes</TableHead>
                          <TableHead className="text-right">Comisión</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {byChannel.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.name}</TableCell>
                            <TableCell className="text-right">{formatCentavos(r.sales)}</TableCell>
                            <TableCell className="text-right">{r.orders}</TableCell>
                            <TableCell className="text-right">
                              {formatCentavos(r.commission)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Por grupo de cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  {byGroup.length === 0 ? (
                    <p className="text-center text-gray-500 py-6">Sin datos todavía.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Grupo</TableHead>
                          <TableHead className="text-right">Ventas</TableHead>
                          <TableHead className="text-right">Órdenes</TableHead>
                          <TableHead className="text-right">Comisión</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {byGroup.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.name}</TableCell>
                            <TableCell className="text-right">{formatCentavos(r.sales)}</TableCell>
                            <TableCell className="text-right">{r.orders}</TableCell>
                            <TableCell className="text-right">
                              {formatCentavos(r.commission)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Funnel de conversión del link de referido: quién compró vs quién no. */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Funnel de conversión</h2>
                <p className="text-sm text-gray-500">
                  Carritos que entraron con un link <code>?ref=</code>: cuántos terminaron comprando
                  y cuántos no, por canal, grupo y empleado.
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
                {FUNNEL_RANGES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFunnelDays(d)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      funnelDays === d
                        ? "bg-white shadow-sm font-medium text-gray-900"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {funnelLoading ? (
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
            ) : !funnel || funnel.totals.referral_carts === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  Todavía no hay carritos con código de referido en los últimos {funnelDays} días.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Carritos con código"
                    value={String(funnel.totals.referral_carts)}
                    icon={<ShoppingCart className="h-5 w-5" />}
                    subtitle={`Últimos ${funnelDays} días`}
                  />
                  <MetricCard
                    title="Compraron"
                    value={String(funnel.totals.completed)}
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    subtitle={formatPesos(funnel.totals.completed_sales_amount)}
                  />
                  <MetricCard
                    title="No compraron"
                    value={String(funnel.totals.abandoned)}
                    icon={<XCircle className="h-5 w-5" />}
                    subtitle="Carritos abandonados"
                  />
                  <MetricCard
                    title="Conversión"
                    value={`${funnel.totals.conversion_rate.toFixed(1)}%`}
                    icon={<TrendingUp className="h-5 w-5" />}
                    subtitle="Compraron / total"
                  />
                </div>

                {funnel.truncated && (
                  <p className="text-xs text-amber-600">
                    Se alcanzó el tope de carritos analizados; achicá el rango de días para datos
                    exactos.
                  </p>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Por canal de venta</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {funnel.by_channel.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">Sin datos.</p>
                      ) : (
                        <FunnelTable label="Canal" rows={funnel.by_channel} />
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Por grupo de cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {funnel.by_group.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">Sin datos.</p>
                      ) : (
                        <FunnelTable label="Grupo" rows={funnel.by_group} />
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Por empleado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {funnel.by_employee.length === 0 ? (
                      <p className="text-center text-gray-500 py-6">Sin datos.</p>
                    ) : (
                      <FunnelTable label="Empleado" rows={funnel.by_employee} />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar empleado</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Comisión %</Label>
                  <Input
                    type="number"
                    value={editing.commission_percentage}
                    onChange={(e) =>
                      setEditing({ ...editing, commission_percentage: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.active}
                      onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                    />
                    Activo
                  </label>
                </div>
              </div>
              <div>
                <Label>Restringir a grupos de cliente</Label>
                <GroupMultiSelect
                  groups={customerGroups}
                  selected={editing.groups}
                  onChange={(ids) => setEditing({ ...editing, groups: ids })}
                />
              </div>
              <Button
                onClick={handleEdit}
                disabled={!editing.name || updateEmployee.isPending}
                className="w-full"
              >
                {updateEmployee.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
              {updateEmployee.isError && (
                <p className="text-sm text-red-500">{(updateEmployee.error as Error).message}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
