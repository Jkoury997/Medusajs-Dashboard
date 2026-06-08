"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, formatNumber } from "@/lib/format"
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "@/hooks/use-picking"
import { KeyRound, Copy, Check, ShieldAlert } from "lucide-react"

export default function SeguridadPage() {
  const { data: keys, isLoading } = useApiKeys()
  const createKey = useCreateApiKey()
  const revokeKey = useRevokeApiKey()

  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revokeId, setRevokeId] = useState<{ id: string; name: string } | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  async function handleCreate() {
    setMutationError(null)
    if (newName.trim().length < 2) {
      setMutationError("El nombre debe tener al menos 2 caracteres")
      return
    }
    try {
      const res = await createKey.mutateAsync(newName.trim())
      setCreatedKey(res.apiKey.key)
      setNewName("")
      setShowForm(false)
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Error desconocido")
    }
  }

  async function handleRevoke(id: string) {
    setMutationError(null)
    try {
      await revokeKey.mutateAsync(id)
      setRevokeId(null)
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "Error desconocido")
    }
  }

  async function copyKey() {
    if (!createdKey) return
    try {
      await navigator.clipboard.writeText(createdKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard bloqueado */
    }
  }

  const totalActive = keys?.filter((k) => k.active).length ?? 0

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Seguridad"
        description="API keys de solo lectura para integraciones externas con el pickup-system"
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* ---- Mutation error banner ---- */}
        {mutationError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {mutationError}
            <button
              className="ml-3 font-medium underline"
              onClick={() => setMutationError(null)}
            >
              Cerrar
            </button>
          </div>
        )}

        {/* ---- Top bar ---- */}
        <div className="flex items-center justify-between">
          <div>
            {isLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              <Badge variant="secondary" className="text-sm">
                {formatNumber(totalActive)} API key{totalActive !== 1 ? "s" : ""} activa
                {totalActive !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <Button onClick={() => setShowForm(true)}>
            <KeyRound className="w-4 h-4 mr-2" />
            Nueva API key
          </Button>
        </div>

        {/* ---- Keys table ---- */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último uso</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : !keys || keys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No hay API keys creadas
                    </TableCell>
                  </TableRow>
                ) : (
                  keys.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.name}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">{k.key}</TableCell>
                      <TableCell>
                        {k.active ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-gray-500">
                            Revocada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {k.lastUsedAt ? formatDate(k.lastUsedAt) : "Nunca"}
                      </TableCell>
                      <TableCell className="text-gray-500">{formatDate(k.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {k.active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setRevokeId({ id: k.id, name: k.name })}
                          >
                            Revocar
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================ */}
      {/* Dialog — Crear API key                                           */}
      {/* ================================================================ */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false)
            setNewName("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva API key</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="key-name">Nombre / descripción</Label>
            <Input
              id="key-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Dashboard ventas"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
              }}
            />
            <p className="text-xs text-gray-500">
              La key se mostrará completa una sola vez. Guardala en un lugar seguro.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setNewName("")
              }}
            >
              Cancelar
            </Button>
            <Button disabled={createKey.isPending} onClick={handleCreate}>
              {createKey.isPending ? "Creando..." : "Crear key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* Dialog — Mostrar key recién creada (una sola vez)                */}
      {/* ================================================================ */}
      <Dialog
        open={createdKey !== null}
        onOpenChange={(open) => {
          if (!open) setCreatedKey(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>API key creada</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Esta es la única vez que verás la key completa. Copiala y guardala ahora.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded-md bg-gray-100 px-3 py-2 font-mono text-xs">
                {createdKey}
              </code>
              <Button variant="outline" size="sm" onClick={copyKey}>
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedKey(null)}>Listo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* Dialog — Confirmar revocación                                    */}
      {/* ================================================================ */}
      <Dialog
        open={revokeId !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeId(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Revocar API key</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            La key <span className="font-medium">{revokeId?.name}</span> dejará de funcionar
            inmediatamente. Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={revokeKey.isPending}
              onClick={() => {
                if (revokeId) handleRevoke(revokeId.id)
              }}
            >
              {revokeKey.isPending ? "Revocando..." : "Revocar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
