"use client"

import { useState } from "react"
import {
  useInvitationCodes,
  useResellerTypes,
  useCreateInvitationCode,
  useUpdateInvitationCode,
  useDeleteInvitationCode,
} from "@/hooks/use-resellers"
import type { InvitationCode } from "@/types/reseller"
import type { CreateInvitationCodeData, UpdateInvitationCodeData } from "@/hooks/use-resellers"
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
import { Plus, Pencil, Trash2, X, Check } from "lucide-react"

const PAGE_SIZE = 20

function formatDate(iso: string | null): string {
  if (!iso) return "Sin expiración"
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

type EditingState = {
  id: string
  data: UpdateInvitationCodeData
} | null

export default function InvitacionesPage() {
  const [typeFilter, setTypeFilter] = useState("")
  const [offset, setOffset] = useState(0)

  const { data, isLoading, error } = useInvitationCodes({
    reseller_type_id: typeFilter || undefined,
    limit: PAGE_SIZE,
    offset,
  })
  const { data: types } = useResellerTypes()
  const createMutation = useCreateInvitationCode()
  const updateMutation = useUpdateInvitationCode()
  const deleteMutation = useDeleteInvitationCode()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateInvitationCodeData>({
    reseller_type_id: "",
    code: "",
    max_uses: 100,
    expires_at: null,
    is_active: true,
    notes: "",
  })
  const [editing, setEditing] = useState<EditingState>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const count = data?.count ?? 0

  function handleCreate() {
    if (!form.reseller_type_id) return
    const payload: CreateInvitationCodeData = {
      reseller_type_id: form.reseller_type_id,
      is_active: form.is_active,
      notes: form.notes || undefined,
    }
    if (form.code?.trim()) payload.code = form.code.trim()
    if (form.max_uses != null) payload.max_uses = form.max_uses
    if (form.expires_at) payload.expires_at = form.expires_at
    createMutation.mutate(payload, {
      onSuccess: () => {
        setShowForm(false)
        setForm({
          reseller_type_id: "",
          code: "",
          max_uses: 100,
          expires_at: null,
          is_active: true,
          notes: "",
        })
      },
    })
  }

  function handleUpdate(id: string) {
    if (!editing) return
    updateMutation.mutate(
      { id, data: editing.data },
      { onSuccess: () => setEditing(null) }
    )
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    })
  }

  function startEditing(c: InvitationCode) {
    setEditing({
      id: c.id,
      data: {
        is_active: c.is_active,
        max_uses: c.max_uses,
        expires_at: c.expires_at,
      },
    })
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Códigos de Invitación</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar códigos. Verificá que la API esté configurada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Códigos de Invitación</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-mk-pink text-white rounded-md text-sm font-medium hover:bg-mk-pink-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Código
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Crear Código de Invitación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Revendedora *
                </label>
                <select
                  className="border rounded-md px-3 py-2 text-sm bg-white w-full"
                  value={form.reseller_type_id}
                  onChange={(e) => setForm({ ...form, reseller_type_id: e.target.value })}
                >
                  <option value="">Seleccionar tipo...</option>
                  {types?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código (opcional, se auto-genera)
                </label>
                <Input
                  placeholder="ej: NAVIDAD2025"
                  value={form.code ?? ""}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usos máximos
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Dejar vacío = ilimitado"
                  value={form.max_uses ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_uses: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de expiración
                </label>
                <Input
                  type="date"
                  value={form.expires_at ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, expires_at: e.target.value || null })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <Input
                  placeholder="ej: Para campaña de navidad"
                  value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !form.reseller_type_id}
                className="px-4 py-2 bg-mk-pink text-white rounded-md text-sm font-medium hover:bg-mk-pink-dark transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? "Creando..." : "Crear"}
              </button>
              <button
                onClick={() => setShowForm(false)}
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

      {/* Filter */}
      <div className="flex items-center gap-3">
        {types && types.length > 0 && (
          <select
            className="border rounded-md px-3 py-2 text-sm bg-white"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setOffset(0)
            }}
          >
            <option value="">Todos los tipos</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.display_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Usos</TableHead>
                  <TableHead>Expiración</TableHead>
                  <TableHead className="text-center">Activo</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data?.invitation_codes?.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No hay códigos de invitación
                    </TableCell>
                  </TableRow>
                ) : (
                  data.invitation_codes.map((c) => {
                    const isEditing = editing?.id === c.id
                    const isExpired = c.expires_at && new Date(c.expires_at) < new Date()

                    if (isEditing && editing) {
                      return (
                        <TableRow key={c.id} className="bg-blue-50/50">
                          <TableCell className="font-mono text-sm font-medium">
                            {c.code}
                          </TableCell>
                          <TableCell className="text-sm">
                            {c.reseller_type?.display_name ?? "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-sm text-gray-500">{c.current_uses}/</span>
                              <Input
                                type="number"
                                className="h-7 text-sm w-16 text-center"
                                min={1}
                                placeholder="∞"
                                value={editing.data.max_uses ?? ""}
                                onChange={(e) =>
                                  setEditing({
                                    ...editing,
                                    data: {
                                      ...editing.data,
                                      max_uses: e.target.value ? Number(e.target.value) : null,
                                    },
                                  })
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              className="h-7 text-sm w-36"
                              value={
                                editing.data.expires_at
                                  ? editing.data.expires_at.split("T")[0]
                                  : ""
                              }
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  data: {
                                    ...editing.data,
                                    expires_at: e.target.value || null,
                                  },
                                })
                              }
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
                          <TableCell className="text-sm text-gray-500">
                            {c.notes || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(c.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleUpdate(c.id)}
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
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {c.code}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {c.reseller_type?.display_name ?? "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {c.current_uses}/{c.max_uses ?? "∞"}
                        </TableCell>
                        <TableCell
                          className={`text-sm ${isExpired ? "text-red-500" : "text-gray-500"}`}
                        >
                          {formatDate(c.expires_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          {c.is_active ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Sí
                            </span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              No
                            </span>
                          )}
                        </TableCell>
                        <TableCell
                          className="text-sm text-gray-500 max-w-[200px] truncate"
                          title={c.notes ?? ""}
                        >
                          {c.notes || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(c.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => startEditing(c)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {deleteConfirm === c.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(c.id)}
                                  disabled={deleteMutation.isPending}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                  title="Confirmar"
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
                                onClick={() => setDeleteConfirm(c.id)}
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
  )
}
