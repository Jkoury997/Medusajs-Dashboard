"use client"

import { useState, useEffect } from "react"
import {
  useResellerTypes,
  useCreateResellerType,
  useUpdateResellerType,
  useDeleteResellerType,
  useResellerSettings,
  useUpdateResellerSetting,
} from "@/hooks/use-resellers"
import type { ResellerType } from "@/types/reseller"
import type { CreateResellerTypeData, UpdateResellerTypeData, ResellerSetting } from "@/hooks/use-resellers"
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
import { Pencil, Trash2, Plus, X, Check, Building2, FileText, Settings2, PenTool, Upload, Trash } from "lucide-react"

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar configuración. Verificá que la API esté configurada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      {/* Company Info */}
      <CompanyInfoSection settings={settings} updateSetting={updateSetting} />

      {/* General Settings */}
      <SettingsSection settings={settings} updateSetting={updateSetting} />

      {/* Contract */}
      <ContractSection settings={settings} updateSetting={updateSetting} />

      {/* Company Signature */}
      <CompanySignatureSection settings={settings} updateSetting={updateSetting} />

      {/* Reseller Types */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Tipos de Revendedora
          </h2>
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
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Company Info Section
   ══════════════════════════════════════════════════════════════ */

interface CompanyInfoData {
  nombre: string
  cuit: string
  domicilio: string
  representante: string
  representante_dni: string
  cargo: string
  email: string
  ciudad: string
  provincia: string
}

const EMPTY_COMPANY: CompanyInfoData = {
  nombre: "",
  cuit: "",
  domicilio: "",
  representante: "",
  representante_dni: "",
  cargo: "",
  email: "",
  ciudad: "",
  provincia: "",
}

function CompanyInfoSection({
  settings,
  updateSetting,
}: {
  settings: ResellerSetting[] | undefined
  updateSetting: ReturnType<typeof useUpdateResellerSetting>
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<CompanyInfoData>(EMPTY_COMPANY)

  const rawValue = settings?.find((s) => s.key === "company_info")?.value
  const companyInfo: CompanyInfoData = (() => {
    try {
      return rawValue ? JSON.parse(rawValue) : EMPTY_COMPANY
    } catch {
      return EMPTY_COMPANY
    }
  })()

  function startEdit() {
    setForm({ ...EMPTY_COMPANY, ...companyInfo })
    setEditing(true)
  }

  function save() {
    updateSetting.mutate(
      { key: "company_info", value: JSON.stringify(form) },
      { onSuccess: () => setEditing(false) }
    )
  }

  const fields: { key: keyof CompanyInfoData; label: string; placeholder: string; colSpan?: boolean }[] = [
    { key: "nombre", label: "Nombre de la empresa", placeholder: "ej: Marcela Koury SRL" },
    { key: "cuit", label: "CUIT", placeholder: "ej: 30-12345678-9" },
    { key: "domicilio", label: "Domicilio", placeholder: "ej: Av. Corrientes 1234", colSpan: true },
    { key: "representante", label: "Representante legal", placeholder: "ej: Marcela Koury" },
    { key: "representante_dni", label: "DNI del representante", placeholder: "ej: 12345678" },
    { key: "cargo", label: "Cargo", placeholder: "ej: Gerente General" },
    { key: "email", label: "Email de contacto", placeholder: "ej: info@marcelakoury.com" },
    { key: "ciudad", label: "Ciudad", placeholder: "ej: Buenos Aires" },
    { key: "provincia", label: "Provincia", placeholder: "ej: Buenos Aires" },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Datos de la Empresa
          </CardTitle>
          {!editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md text-blue-600 hover:bg-blue-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.key} className={f.colSpan ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <Input
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={save}
                disabled={updateSetting.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50"
              >
                {updateSetting.isPending ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm border rounded-md text-gray-600"
              >
                Cancelar
              </button>
            </div>
            {updateSetting.isError && (
              <p className="text-sm text-red-500">{(updateSetting.error as Error).message}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {fields.map((f) => (
              <div key={f.key} className={`flex justify-between py-1.5 ${f.colSpan ? "md:col-span-2" : ""}`}>
                <span className="text-sm text-gray-500">{f.label}</span>
                <span className="text-sm font-medium">{companyInfo[f.key] || <span className="text-gray-300">Sin configurar</span>}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════════
   General Settings Section
   ══════════════════════════════════════════════════════════════ */

interface SettingsSectionProps {
  settings: ResellerSetting[] | undefined
  updateSetting: ReturnType<typeof useUpdateResellerSetting>
}

function SettingsSection({ settings, updateSetting }: SettingsSectionProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  function getSettingValue(key: string, fallback: string = "") {
    return settings?.find((s) => s.key === key)?.value ?? fallback
  }

  function startEdit(key: string, currentValue: string) {
    setEditingKey(key)
    setEditValue(currentValue)
  }

  function cancelEdit() {
    setEditingKey(null)
    setEditValue("")
  }

  function saveEdit(key: string, value: string) {
    updateSetting.mutate(
      { key, value },
      { onSuccess: () => cancelEdit() }
    )
  }

  function toggleBoolean(key: string, current: string) {
    const newVal = current === "true" ? "false" : "true"
    updateSetting.mutate({ key, value: newVal })
  }

  const minWithdrawalCentavos = Number(getSettingValue("min_withdrawal_amount", "100000"))
  const minWithdrawalPesos = minWithdrawalCentavos / 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          Configuración General
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Min withdrawal amount */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-sm">Monto mínimo de retiro</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Las revendedoras no podrán solicitar retiros por debajo de este monto
            </p>
          </div>
          {editingKey === "min_withdrawal_amount" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">$</span>
              <Input
                type="number"
                min={0}
                step={100}
                className="w-32 h-8 text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="ej: 5000"
              />
              <button
                className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                disabled={updateSetting.isPending || !editValue}
                onClick={() => saveEdit("min_withdrawal_amount", String(Math.round(Number(editValue) * 100)))}
                title="Guardar"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                onClick={cancelEdit}
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium">
                ${minWithdrawalPesos.toLocaleString("es-AR")}
              </span>
              <button
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                onClick={() => startEdit("min_withdrawal_amount", String(minWithdrawalPesos))}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Liquidacion periodicidad */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-sm">Periodicidad de liquidación</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Frecuencia con la que se liquidan las comisiones a las revendedoras
            </p>
          </div>
          {editingKey === "liquidacion_periodicidad" ? (
            <div className="flex items-center gap-2">
              <select
                className="border rounded-md px-3 py-1.5 text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              >
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
              <button
                className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                disabled={updateSetting.isPending}
                onClick={() => saveEdit("liquidacion_periodicidad", editValue)}
                title="Guardar"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                onClick={cancelEdit}
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium capitalize">
                {getSettingValue("liquidacion_periodicidad", "mensual")}
              </span>
              <button
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                onClick={() => startEdit("liquidacion_periodicidad", getSettingValue("liquidacion_periodicidad", "mensual"))}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Plazo preaviso */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-sm">Plazo de preaviso</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Días de preaviso para rescisión del contrato
            </p>
          </div>
          {editingKey === "plazo_preaviso" ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                className="w-20 h-8 text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="30"
              />
              <span className="text-sm text-gray-500">días</span>
              <button
                className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                disabled={updateSetting.isPending || !editValue}
                onClick={() => saveEdit("plazo_preaviso", editValue)}
                title="Guardar"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                onClick={cancelEdit}
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium">
                {getSettingValue("plazo_preaviso", "30")} días
              </span>
              <button
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                onClick={() => startEdit("plazo_preaviso", getSettingValue("plazo_preaviso", "30"))}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Contract version */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-sm">Versión del contrato</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Al cambiar la versión, las revendedoras deberán firmar nuevamente
            </p>
          </div>
          {editingKey === "contract_version" ? (
            <div className="flex items-center gap-2">
              <Input
                className="w-24 h-8 text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="ej: 1.0"
              />
              <button
                className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                disabled={updateSetting.isPending || !editValue.trim()}
                onClick={() => saveEdit("contract_version", editValue)}
                title="Guardar"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                onClick={cancelEdit}
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium">
                v{getSettingValue("contract_version", "1.0")}
              </span>
              <button
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                onClick={() => startEdit("contract_version", getSettingValue("contract_version", "1.0"))}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Boolean toggles */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-sm">Requiere contrato para 1er retiro</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              La revendedora debe firmar el contrato antes de su primer retiro
            </p>
          </div>
          <button
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              getSettingValue("first_withdrawal_requires_contract", "true") === "true"
                ? "bg-blue-600"
                : "bg-gray-300"
            }`}
            disabled={updateSetting.isPending}
            onClick={() =>
              toggleBoolean("first_withdrawal_requires_contract", getSettingValue("first_withdrawal_requires_contract", "true"))
            }
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                getSettingValue("first_withdrawal_requires_contract", "true") === "true"
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-sm">Requiere monotributo para 1er retiro</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              La revendedora debe subir su constancia de monotributo antes de su primer retiro
            </p>
          </div>
          <button
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              getSettingValue("first_withdrawal_requires_monotributo", "true") === "true"
                ? "bg-blue-600"
                : "bg-gray-300"
            }`}
            disabled={updateSetting.isPending}
            onClick={() =>
              toggleBoolean("first_withdrawal_requires_monotributo", getSettingValue("first_withdrawal_requires_monotributo", "true"))
            }
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                getSettingValue("first_withdrawal_requires_monotributo", "true") === "true"
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {updateSetting.isError && (
          <p className="text-sm text-red-500">{(updateSetting.error as Error).message}</p>
        )}
      </CardContent>
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════════
   Contract Section
   ══════════════════════════════════════════════════════════════ */

const CONTRACT_PLACEHOLDERS = [
  { placeholder: "{{empresa_nombre}}", desc: "Nombre de la empresa" },
  { placeholder: "{{empresa_cuit}}", desc: "CUIT de la empresa" },
  { placeholder: "{{empresa_domicilio}}", desc: "Domicilio de la empresa" },
  { placeholder: "{{empresa_representante}}", desc: "Nombre del representante" },
  { placeholder: "{{empresa_representante_dni}}", desc: "DNI del representante" },
  { placeholder: "{{empresa_cargo}}", desc: "Cargo del representante" },
  { placeholder: "{{empresa_email}}", desc: "Email de la empresa" },
  { placeholder: "{{ciudad}}", desc: "Ciudad" },
  { placeholder: "{{provincia}}", desc: "Provincia" },
  { placeholder: "{{revendedora_nombre}}", desc: "Nombre de la revendedora" },
  { placeholder: "{{revendedora_dni_cuit}}", desc: "DNI/CUIT de la revendedora" },
  { placeholder: "{{revendedora_domicilio}}", desc: "Domicilio de la revendedora" },
  { placeholder: "{{revendedora_email}}", desc: "Email de la revendedora" },
  { placeholder: "{{comision_porcentaje}}", desc: "% de comisión" },
  { placeholder: "{{liquidacion_periodicidad}}", desc: "Periodicidad de liquidación" },
  { placeholder: "{{plazo_preaviso}}", desc: "Plazo de preaviso (días)" },
  { placeholder: "{{dia}}", desc: "Día actual" },
  { placeholder: "{{mes}}", desc: "Mes actual" },
  { placeholder: "{{anio}}", desc: "Año actual" },
]

function ContractSection({
  settings,
  updateSetting,
}: {
  settings: ResellerSetting[] | undefined
  updateSetting: ReturnType<typeof useUpdateResellerSetting>
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [showPlaceholders, setShowPlaceholders] = useState(false)

  const contractText = settings?.find((s) => s.key === "contract_text")?.value ?? ""

  function startEdit() {
    setEditValue(contractText)
    setEditing(true)
  }

  function save() {
    updateSetting.mutate(
      { key: "contract_text", value: editValue },
      { onSuccess: () => setEditing(false) }
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Texto del Contrato
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPlaceholders(!showPlaceholders)}
              className="px-3 py-1.5 text-xs border rounded-md text-gray-600 hover:bg-gray-50"
            >
              {showPlaceholders ? "Ocultar" : "Ver"} Placeholders
            </button>
            {!editing && (
              <button
                onClick={startEdit}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Placeholders reference */}
        {showPlaceholders && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Placeholders disponibles</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {CONTRACT_PLACEHOLDERS.map((p) => (
                <div key={p.placeholder} className="flex items-center gap-2 text-xs">
                  <code className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono text-[11px]">
                    {p.placeholder}
                  </code>
                  <span className="text-gray-600">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {editing ? (
          <div className="space-y-3">
            <textarea
              className="w-full border rounded-md p-3 text-sm font-mono leading-relaxed min-h-[400px]"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Escribí el texto del contrato usando los placeholders disponibles..."
            />
            <div className="flex gap-2">
              <button
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50"
                disabled={updateSetting.isPending}
                onClick={save}
              >
                {updateSetting.isPending ? "Guardando..." : "Guardar"}
              </button>
              <button
                className="px-4 py-2 text-sm border rounded-md text-gray-600"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 border rounded-md p-4 max-h-[400px] overflow-y-auto leading-relaxed">
            {contractText || "Sin contrato configurado"}
          </pre>
        )}

        {updateSetting.isError && (
          <p className="text-sm text-red-500">{(updateSetting.error as Error).message}</p>
        )}
      </CardContent>
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════════
   Company Signature Section
   ══════════════════════════════════════════════════════════════ */

function CompanySignatureSection({
  settings,
  updateSetting,
}: {
  settings: ResellerSetting[] | undefined
  updateSetting: ReturnType<typeof useUpdateResellerSetting>
}) {
  const [removing, setRemoving] = useState(false)

  const signatureBase64 = settings?.find((s) => s.key === "company_signature")?.value ?? ""
  const hasSignature = signatureBase64.length > 0

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Solo se permiten archivos de imagen (PNG, JPG, etc.)")
      return
    }

    if (file.size > 500 * 1024) {
      alert("La imagen no debe superar los 500KB")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      updateSetting.mutate({ key: "company_signature", value: base64 })
    }
    reader.readAsDataURL(file)

    // Reset input
    e.target.value = ""
  }

  function handleRemove() {
    updateSetting.mutate(
      { key: "company_signature", value: "" },
      { onSuccess: () => setRemoving(false) }
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <PenTool className="w-5 h-5" />
            Firma de la Empresa
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-500">
          Esta firma aparecerá en el PDF del contrato junto a la firma de la revendedora.
          Subí una imagen PNG con fondo transparente para mejores resultados.
        </p>

        {hasSignature ? (
          <div className="space-y-3">
            <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signatureBase64}
                alt="Firma de la empresa"
                className="max-h-32 max-w-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md text-blue-600 hover:bg-blue-50 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Cambiar imagen
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {removing ? (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500 mr-1">Eliminar?</span>
                  <button
                    onClick={handleRemove}
                    disabled={updateSetting.isPending}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Confirmar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRemoving(false)}
                    className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setRemoving(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md text-red-500 hover:bg-red-50"
                >
                  <Trash className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-600">Subir imagen de firma</span>
            <span className="text-xs text-gray-400 mt-1">PNG, JPG o WebP (max 500KB)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}

        {updateSetting.isPending && (
          <p className="text-sm text-blue-600">Guardando...</p>
        )}
        {updateSetting.isError && (
          <p className="text-sm text-red-500">{(updateSetting.error as Error).message}</p>
        )}
      </CardContent>
    </Card>
  )
}
