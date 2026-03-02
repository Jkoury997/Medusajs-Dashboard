"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
import { Pencil, Trash2, Plus, X, Check, Building2, FileText, Settings2, PenTool, Upload, Trash, Eraser, RotateCcw, Rocket } from "lucide-react"

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

      {/* Product Boost Settings */}
      <ProductBoostSettingsSection settings={settings} updateSetting={updateSetting} />

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
   Signature Pad Component
   ══════════════════════════════════════════════════════════════ */

function SignaturePad({
  onSave,
  onCancel,
  saving,
}: {
  onSave: (base64: string) => void
  onCancel: () => void
  saving: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [penColor, setPenColor] = useState("#000000")
  const [penSize, setPenSize] = useState(2)

  const getCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      if ("touches" in e) {
        const touch = e.touches[0]
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        }
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    },
    []
  )

  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getCoords(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = penColor
    ctx.lineWidth = penSize
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    setIsDrawing(true)
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getCoords(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawn(true)
  }

  function stopDraw() {
    setIsDrawing(false)
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) return
    const base64 = canvas.toDataURL("image/png")
    onSave(base64)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Color:</label>
          <input
            type="color"
            value={penColor}
            onChange={(e) => setPenColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Grosor:</label>
          <input
            type="range"
            min={1}
            max={6}
            value={penSize}
            onChange={(e) => setPenSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-gray-400 w-4">{penSize}</span>
        </div>
        <button
          onClick={clearCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md text-gray-600 hover:bg-gray-50"
        >
          <Eraser className="w-3.5 h-3.5" />
          Limpiar
        </button>
      </div>

      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full cursor-crosshair touch-none"
          style={{ height: "200px" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
      <p className="text-xs text-gray-400 text-center">
        Dibujá tu firma con el mouse o el dedo en pantallas táctiles
      </p>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!hasDrawn || saving}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar firma"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm border rounded-md text-gray-600"
        >
          Cancelar
        </button>
      </div>
    </div>
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
  const [showPad, setShowPad] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const signatureUrl = settings?.find((s) => s.key === "company_signature_url")?.value ?? ""
  const hasSignature = signatureUrl.length > 0

  async function uploadToBlob(file: File | Blob, filename: string): Promise<string> {
    const formData = new FormData()
    formData.append("file", file, filename)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (!res.ok) throw new Error("Error al subir imagen")
    const data = await res.json()
    return data.url
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
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

    setUploading(true)
    setUploadError(null)
    try {
      const url = await uploadToBlob(file, `firma-empresa-${Date.now()}.png`)
      updateSetting.mutate({ key: "company_signature_url", value: url })
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Error al subir imagen")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleSaveSignature(base64: string) {
    setUploading(true)
    setUploadError(null)
    try {
      // Convert base64 to blob
      const res = await fetch(base64)
      const blob = await res.blob()
      const url = await uploadToBlob(blob, `firma-empresa-${Date.now()}.png`)
      updateSetting.mutate(
        { key: "company_signature_url", value: url },
        { onSuccess: () => setShowPad(false) }
      )
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Error al guardar firma")
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    updateSetting.mutate(
      { key: "company_signature_url", value: "" },
      { onSuccess: () => setRemoving(false) }
    )
  }

  const isBusy = uploading || updateSetting.isPending

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
          Podés dibujarla directamente o subir una imagen PNG con fondo transparente.
        </p>

        {showPad ? (
          <SignaturePad
            onSave={handleSaveSignature}
            onCancel={() => setShowPad(false)}
            saving={isBusy}
          />
        ) : hasSignature ? (
          <div className="space-y-3">
            <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signatureUrl}
                alt="Firma de la empresa"
                className="max-h-32 max-w-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowPad(true)}
                disabled={isBusy}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                <PenTool className="w-3.5 h-3.5" />
                Dibujar nueva
              </button>
              <label className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md text-blue-600 hover:bg-blue-50 cursor-pointer ${isBusy ? "opacity-50 pointer-events-none" : ""}`}>
                <Upload className="w-3.5 h-3.5" />
                Subir imagen
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isBusy}
                />
              </label>
              {removing ? (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500 mr-1">¿Eliminar?</span>
                  <button
                    onClick={handleRemove}
                    disabled={isBusy}
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
                  disabled={isBusy}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Draw signature */}
            <button
              onClick={() => setShowPad(true)}
              disabled={isBusy}
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-colors disabled:opacity-50"
            >
              <PenTool className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Dibujar firma</span>
              <span className="text-xs text-gray-400 mt-1">Dibujá con el mouse o dedo</span>
            </button>
            {/* Upload image */}
            <label className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-colors ${isBusy ? "opacity-50 pointer-events-none" : ""}`}>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Subir imagen</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG o WebP (max 500KB)</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isBusy}
              />
            </label>
          </div>
        )}

        {isBusy && !showPad && (
          <p className="text-sm text-blue-600">
            {uploading ? "Subiendo imagen..." : "Guardando..."}
          </p>
        )}
        {uploadError && (
          <p className="text-sm text-red-500">{uploadError}</p>
        )}
        {updateSetting.isError && (
          <p className="text-sm text-red-500">{(updateSetting.error as Error).message}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// PRODUCT BOOST SETTINGS
// ============================================================

function ProductBoostSettingsSection({ settings, updateSetting }: SettingsSectionProps) {
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

  const isEnabled = getSettingValue("product_boost_enabled", "false") === "true"
  const stagnantDays = getSettingValue("product_boost_stagnant_days", "30")
  const defaultPct = getSettingValue("product_boost_default_percentage", "5")
  const maxPct = getSettingValue("product_boost_max_percentage", "15")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Rocket className="w-5 h-5" />
          Product Boosts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Enabled toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-sm">Boosts habilitados</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Activa o desactiva el sistema de bonus por productos estancados
            </p>
          </div>
          <button
            onClick={() => toggleBoolean("product_boost_enabled", String(isEnabled))}
            disabled={updateSetting.isPending}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              isEnabled ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                isEnabled ? "translate-x-4" : ""
              }`}
            />
          </button>
        </div>

        {/* Stagnant days */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-sm">Días para estancado</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Cantidad de días sin ventas para considerar un producto como estancado
            </p>
          </div>
          {editingKey === "product_boost_stagnant_days" ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                className="w-24 h-8 text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
              <span className="text-xs text-gray-500">días</span>
              <button
                className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                disabled={updateSetting.isPending || !editValue}
                onClick={() => saveEdit("product_boost_stagnant_days", editValue)}
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
              <span className="font-mono text-sm font-medium">{stagnantDays} días</span>
              <button
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                onClick={() => startEdit("product_boost_stagnant_days", stagnantDays)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Default percentage */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-sm">Bonus por defecto</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Porcentaje de bonus de comisión asignado automáticamente a productos estancados
            </p>
          </div>
          {editingKey === "product_boost_default_percentage" ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                className="w-24 h-8 text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
              <span className="text-xs text-gray-500">%</span>
              <button
                className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                disabled={updateSetting.isPending || !editValue}
                onClick={() => saveEdit("product_boost_default_percentage", editValue)}
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
              <span className="font-mono text-sm font-medium">{defaultPct}%</span>
              <button
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                onClick={() => startEdit("product_boost_default_percentage", defaultPct)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Max percentage */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium text-sm">Bonus máximo</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Porcentaje máximo de bonus que se puede asignar a un producto
            </p>
          </div>
          {editingKey === "product_boost_max_percentage" ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                className="w-24 h-8 text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
              <span className="text-xs text-gray-500">%</span>
              <button
                className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                disabled={updateSetting.isPending || !editValue}
                onClick={() => saveEdit("product_boost_max_percentage", editValue)}
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
              <span className="font-mono text-sm font-medium">{maxPct}%</span>
              <button
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                onClick={() => startEdit("product_boost_max_percentage", maxPct)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
