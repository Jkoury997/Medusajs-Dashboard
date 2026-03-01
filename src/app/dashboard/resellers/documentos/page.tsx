"use client"

import { useState } from "react"
import {
  useDocuments,
  useVerifyDocument,
  useRejectDocument,
} from "@/hooks/use-resellers"
import type { DocumentStatus } from "@/types/reseller"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 20
const BASE = "/api/reseller-proxy"

const STATUS_CONFIG: Record<DocumentStatus, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Aprobado", className: "bg-green-100 text-green-700" },
  rejected: { label: "Rechazado", className: "bg-red-100 text-red-700" },
}

const STATUS_TABS: { value: DocumentStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobados" },
  { value: "rejected", label: "Rechazados" },
]

const DOC_TYPE_LABELS: Record<string, string> = {
  monotributo_cert: "Constancia de Monotributo",
  contract: "Contrato Firmado",
  invoice: "Factura",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type ModalType =
  | { kind: "reject"; id: string; name: string }
  | { kind: "view"; id: string; name: string; mimeType: string }
  | null

export default function ResellersDocumentosPage() {
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "">("")
  const [offset, setOffset] = useState(0)
  const [actionError, setActionError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalType>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileLoading, setFileLoading] = useState(false)

  const { data, isLoading, error } = useDocuments({
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset,
  })

  const verify = useVerifyDocument()
  const reject = useRejectDocument()

  const isActioning = verify.isPending || reject.isPending
  const count = data?.count ?? 0

  async function handleVerify(id: string) {
    setActionError(null)
    try {
      await verify.mutateAsync(id)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al verificar")
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

  async function handleViewFile(id: string, name: string, mimeType: string) {
    setModal({ kind: "view", id, name, mimeType })
    setFileContent(null)
    setFileLoading(true)
    try {
      const res = await fetch(`${BASE}/admin/documents/${id}`)
      if (!res.ok) throw new Error("Error al obtener archivo")
      const data = await res.json()
      const content = data.document?.file_content
      if (!content) throw new Error("El documento no tiene archivo")
      setFileContent(content)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al cargar archivo")
      setModal(null)
    } finally {
      setFileLoading(false)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Documentos</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar documentos. Verificá que la API esté configurada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {actionError}
        </div>
      )}

      {/* View file modal */}
      {modal?.kind === "view" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg truncate">{modal.name}</h3>
              <button
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
                onClick={() => { setModal(null); setFileContent(null) }}
              >
                Cerrar
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
              {fileLoading ? (
                <div className="text-gray-500 text-sm">Cargando archivo...</div>
              ) : fileContent ? (
                modal.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:${modal.mimeType};base64,${fileContent}`}
                    alt={modal.name}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : modal.mimeType === "application/pdf" ? (
                  <iframe
                    src={`data:application/pdf;base64,${fileContent}`}
                    className="w-full h-[70vh]"
                    title={modal.name}
                  />
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-gray-500 text-sm">
                      No se puede previsualizar este tipo de archivo ({modal.mimeType})
                    </p>
                    <a
                      href={`data:${modal.mimeType};base64,${fileContent}`}
                      download={modal.name}
                      className="inline-block px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
                    >
                      Descargar
                    </a>
                  </div>
                )
              ) : (
                <div className="text-gray-400 text-sm">Sin contenido</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {modal?.kind === "reject" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="font-semibold text-lg mb-1">Rechazar Documento</h3>
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
              <button
                className="px-4 py-2 text-sm border rounded-md"
                onClick={() => { setModal(null); setRejectReason("") }}
              >
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data?.documents?.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No hay documentos
                    </TableCell>
                  </TableRow>
                ) : (
                  data.documents.map((doc) => {
                    const statusCfg = STATUS_CONFIG[doc.status as DocumentStatus] ?? {
                      label: doc.status,
                      className: "bg-gray-100 text-gray-600",
                    }
                    const resellerName = doc.reseller
                      ? `${doc.reseller.first_name} ${doc.reseller.last_name}`
                      : doc.reseller_id.slice(0, 12) + "..."
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div>
                            {resellerName}
                            {doc.reseller?.email && (
                              <p className="text-xs text-gray-400">{doc.reseller.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          <div>
                            <button
                              className="text-blue-600 hover:underline truncate max-w-[200px] block text-left"
                              title={doc.original_filename}
                              onClick={() =>
                                handleViewFile(
                                  doc.id,
                                  doc.original_filename,
                                  doc.mime_type
                                )
                              }
                            >
                              {doc.original_filename}
                            </button>
                            <p className="text-xs text-gray-400">
                              {formatFileSize(doc.file_size)} — {doc.mime_type}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}
                          >
                            {statusCfg.label}
                          </span>
                          {doc.status === "rejected" && doc.rejection_reason && (
                            <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={doc.rejection_reason}>
                              {doc.rejection_reason}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(doc.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                              onClick={() =>
                                handleViewFile(
                                  doc.id,
                                  doc.original_filename,
                                  doc.mime_type
                                )
                              }
                            >
                              Ver
                            </button>
                            {doc.status === "pending" && (
                              <>
                                <button
                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded disabled:opacity-50"
                                  disabled={isActioning}
                                  onClick={() => handleVerify(doc.id)}
                                >
                                  Aprobar
                                </button>
                                <button
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded disabled:opacity-50"
                                  disabled={isActioning}
                                  onClick={() =>
                                    setModal({ kind: "reject", id: doc.id, name: `${resellerName} — ${DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}` })
                                  }
                                >
                                  Rechazar
                                </button>
                              </>
                            )}
                            {doc.status === "approved" && doc.verified_at && (
                              <span className="text-xs text-green-600">
                                Aprobado {formatDate(doc.verified_at)}
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
