"use client"

import { useState } from "react"
import {
  useResellerTypes,
  useCreateResellerType,
  useUpdateResellerType,
  useDeleteResellerType,
  useResellerSettings,
  useUpdateResellerSetting,
} from "@/hooks/use-resellers"
import type { ResellerType } from "@/types/reseller"
import type { CreateResellerTypeData, UpdateResellerTypeData } from "@/hooks/use-resellers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2, Plus, X, Check } from "lucide-react"

type EditingState = {
  id: string
  data: UpdateResellerTypeData
} | null

const EMPTY_FORM: CreateResellerTypeData = {
  name: "",
  display_name: "",
  description: "",
  requires_invitation: false,
  default_commission_percentage: 10,
  default_customer_discount_percentage: 0,
  has_wholesale_prices: false,
  priority: 0,
}

export default function ResellersConfigPage() {
  const { data: types, isLoading, error } = useResellerTypes()
  const createMutation = useCreateResellerType()
  const updateMutation = useUpdateResellerType()
  const deleteMutation = useDeleteResellerType()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateResellerTypeData>(EMPTY_FORM)
  const [editing, setEditing] = useState<EditingState>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Settings
  const { data: settings } = useResellerSettings()
  const updateSetting = useUpdateResellerSetting()
  const [editingMinWithdrawal, setEditingMinWithdrawal] = useState(false)
  const [minWithdrawalPesos, setMinWithdrawalPesos] = useState("")

  const currentMinWithdrawal = settings?.find((s) => s.key === "min_withdrawal_amount")
  const currentMinPesos = currentMinWithdrawal ? Number(currentMinWithdrawal.value) / 100 : null

  function handleCreate() {
    if (!form.name.trim() || !form.display_name.trim()) return
    createMutation.mutate(form, {
      onSuccess: () => {
        setShowForm(false)
        setForm(EMPTY_FORM)
      },
    })
  }

  function handleUpdate(id: string) {
    if (!editing) return
    updateMutation.mutate(
      { id, data: editing.data },
      {
        onSuccess: () => setEditing(null),
      }
    )
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    })
  }

  function startEditing(t: ResellerType) {
    setEditing({
      id: t.id,
      data: {
        display_name: t.display_name,
        description: t.description,
        requires_invitation: t.requires_invitation,
        default_commission_percentage: t.default_commission_percentage,
        default_customer_discount_percentage: t.default_customer_discount_percentage,
        has_wholesale_prices: t.has_wholesale_prices,
        is_active: t.is_active,
        priority: t.priority,
      },
    })
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración — Tipos de Revendedora</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar tipos. Verificá que la API esté configurada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Configuración — Tipos de Revendedora</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-mk-pink text-white rounded-md text-sm font-medium hover:bg-mk-pink-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Tipo
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Crear Tipo de Revendedora</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre (slug)
                </label>
                <Input
                  placeholder="ej: revendedora-online"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre para mostrar
                </label>
                <Input
                  placeholder="ej: Revendedora Online"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <Input
                  placeholder="ej: Reventa por redes sociales"
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comisión (%)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.default_commission_percentage}
                  onChange={(e) =>
                    setForm({ ...form, default_commission_percentage: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento al cliente (%)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.default_customer_discount_percentage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      default_customer_discount_percentage: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <Input
                  type="number"
                  min={0}
                  value={form.priority ?? 0}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-6 pt-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.requires_invitation ?? false}
                    onChange={(e) => setForm({ ...form, requires_invitation: e.target.checked })}
                    className="rounded"
                  />
                  Requiere invitación
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.has_wholesale_prices ?? false}
                    onChange={(e) => setForm({ ...form, has_wholesale_prices: e.target.checked })}
                    className="rounded"
                  />
                  Precios mayoristas
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !form.name.trim() || !form.display_name.trim()}
                className="px-4 py-2 bg-mk-pink text-white rounded-md text-sm font-medium hover:bg-mk-pink-dark transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? "Creando..." : "Crear"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  setForm(EMPTY_FORM)
                }}
                className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
            {createMutation.isError && (
              <p className="text-sm text-red-500">{(createMutation.error as Error).message}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Types table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Comisión</TableHead>
                  <TableHead className="text-center">Descuento</TableHead>
                  <TableHead className="text-center">Invitación</TableHead>
                  <TableHead className="text-center">Mayorista</TableHead>
                  <TableHead className="text-center">Activo</TableHead>
                  <TableHead className="text-center">Prioridad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !types?.length ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No hay tipos de revendedora
                    </TableCell>
                  </TableRow>
                ) : (
                  types.map((t) => {
                    const isEditing = editing?.id === t.id

                    if (isEditing && editing) {
                      return (
                        <TableRow key={t.id} className="bg-blue-50/50">
                          <TableCell>
                            <Input
                              className="h-8 text-sm"
                              value={editing.data.display_name ?? ""}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  data: { ...editing.data, display_name: e.target.value },
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-8 text-sm"
                              value={editing.data.description ?? ""}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  data: { ...editing.data, description: e.target.value },
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              className="h-8 text-sm w-16 mx-auto text-center"
                              min={0}
                              max={100}
                              value={editing.data.default_commission_percentage ?? 0}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  data: {
                                    ...editing.data,
                                    default_commission_percentage: Number(e.target.value),
                                  },
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              className="h-8 text-sm w-16 mx-auto text-center"
                              min={0}
                              max={100}
                              value={editing.data.default_customer_discount_percentage ?? 0}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  data: {
                                    ...editing.data,
                                    default_customer_discount_percentage: Number(e.target.value),
                                  },
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={editing.data.requires_invitation ?? false}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  data: { ...editing.data, requires_invitation: e.target.checked },
                                })
                              }
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={editing.data.has_wholesale_prices ?? false}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  data: { ...editing.data, has_wholesale_prices: e.target.checked },
                                })
                              }
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={editing.data.is_active ?? true}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  data: { ...editing.data, is_active: e.target.checked },
                                })
                              }
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              className="h-8 text-sm w-16 mx-auto text-center"
                              min={0}
                              value={editing.data.priority ?? 0}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  data: { ...editing.data, priority: Number(e.target.value) },
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleUpdate(t.id)}
                                disabled={updateMutation.isPending}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                title="Guardar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditing(null)}
                                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    }

                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.display_name}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {t.description || "-"}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {t.default_commission_percentage}%
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {t.default_customer_discount_percentage}%
                        </TableCell>
                        <TableCell className="text-center">
                          {t.requires_invitation ? (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              Sí
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {t.has_wholesale_prices ? (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Sí
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {t.is_active ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Sí
                            </span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              No
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{t.priority}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => startEditing(t)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {deleteConfirm === t.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(t.id)}
                                  disabled={deleteMutation.isPending}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                  title="Confirmar eliminar"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(t.id)}
                                className="p-1.5 text-red-400 hover:bg-red-50 rounded"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

          {/* Mutation errors */}
          {(updateMutation.isError || deleteMutation.isError) && (
            <div className="px-4 py-3 border-t">
              <p className="text-sm text-red-500">
                {(updateMutation.error as Error)?.message ||
                  (deleteMutation.error as Error)?.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuración General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Min withdrawal amount */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Monto mínimo de retiro</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Las revendedoras no podrán solicitar retiros por debajo de este monto
              </p>
            </div>
            {editingMinWithdrawal ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">$</span>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  className="w-32 h-8 text-sm"
                  value={minWithdrawalPesos}
                  onChange={(e) => setMinWithdrawalPesos(e.target.value)}
                  placeholder="ej: 5000"
                />
                <button
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                  disabled={updateSetting.isPending || !minWithdrawalPesos}
                  onClick={() => {
                    const centavos = Math.round(Number(minWithdrawalPesos) * 100)
                    updateSetting.mutate(
                      { key: "min_withdrawal_amount", value: String(centavos) },
                      {
                        onSuccess: () => {
                          setEditingMinWithdrawal(false)
                          setMinWithdrawalPesos("")
                        },
                      }
                    )
                  }}
                  title="Guardar"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                  onClick={() => { setEditingMinWithdrawal(false); setMinWithdrawalPesos("") }}
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">
                  {currentMinPesos != null
                    ? `$${currentMinPesos.toLocaleString("es-AR")}`
                    : "$1.000 (default)"}
                </span>
                <button
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  onClick={() => {
                    setMinWithdrawalPesos(currentMinPesos != null ? String(currentMinPesos) : "1000")
                    setEditingMinWithdrawal(true)
                  }}
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {updateSetting.isError && (
            <p className="text-sm text-red-500">{(updateSetting.error as Error).message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
