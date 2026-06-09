"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  useApproveSeoProposal,
  useRejectSeoProposal,
} from "@/hooks/use-seo-agent"
import { SEO_FIELD_LABELS } from "@/types/seo-agent"
import type { SeoProposal, ProposalDiffEntry } from "@/types/seo-agent"
import { Check, X, Loader2 } from "lucide-react"

const DIFF_BADGE: Record<ProposalDiffEntry["kind"], { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  added: { label: "nuevo", variant: "default" },
  changed: { label: "cambió", variant: "secondary" },
  removed: { label: "eliminado", variant: "destructive" },
  unchanged: { label: "igual", variant: "outline" },
}

function renderValue(v: unknown): string {
  if (v == null || v === "") return "—"
  if (Array.isArray(v)) {
    return v
      .map((item) =>
        typeof item === "object" && item !== null
          ? Object.values(item as Record<string, unknown>).join(" · ")
          : String(item),
      )
      .join(", ")
  }
  return String(v)
}

export function SeoProposalDialog({
  proposal,
  open,
  onOpenChange,
}: {
  proposal: SeoProposal | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const approve = useApproveSeoProposal()
  const reject = useRejectSeoProposal()
  const [rejectMode, setRejectMode] = useState(false)
  const [note, setNote] = useState("")
  const [editMetaTitle, setEditMetaTitle] = useState<string | null>(null)
  const [editMetaDesc, setEditMetaDesc] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  if (!proposal) return null

  const close = () => {
    setRejectMode(false)
    setNote("")
    setEditMetaTitle(null)
    setEditMetaDesc(null)
    setErrorMsg("")
    onOpenChange(false)
  }

  const handleApprove = () => {
    setErrorMsg("")
    const edits: Record<string, string> = {}
    if (editMetaTitle !== null && editMetaTitle !== proposal.proposal.meta_title)
      edits.meta_title = editMetaTitle
    if (editMetaDesc !== null && editMetaDesc !== proposal.proposal.meta_description)
      edits.meta_description = editMetaDesc
    approve.mutate(
      {
        id: proposal.proposal_id,
        edits: Object.keys(edits).length ? edits : undefined,
      },
      {
        onSuccess: close,
        onError: (e) => setErrorMsg((e as Error).message),
      },
    )
  }

  const handleReject = () => {
    setErrorMsg("")
    if (note.trim().length === 0) {
      setErrorMsg("La nota de rechazo es obligatoria.")
      return
    }
    reject.mutate(
      { id: proposal.proposal_id, note: note.trim() },
      { onSuccess: close, onError: (e) => setErrorMsg((e as Error).message) },
    )
  }

  const changedDiff = proposal.diff.filter((d) => d.kind !== "unchanged")
  const isPending = proposal.status === "proposed"

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {proposal.product_title}
            <Badge variant="outline">{proposal.sales_channel_name ?? "Global"}</Badge>
          </DialogTitle>
          <DialogDescription>
            Propuesta de SEO generada por IA. Revisá los cambios antes de aplicar.
          </DialogDescription>
        </DialogHeader>

        {/* Edición rápida de los dos campos clave */}
        {isPending && (
          <div className="space-y-3 rounded-md bg-gray-50 p-3">
            <div>
              <Label className="text-xs">Meta título</Label>
              <Input
                value={editMetaTitle ?? proposal.proposal.meta_title ?? ""}
                onChange={(e) => setEditMetaTitle(e.target.value)}
                className="mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs">Meta descripción</Label>
              <Textarea
                value={editMetaDesc ?? proposal.proposal.meta_description ?? ""}
                onChange={(e) => setEditMetaDesc(e.target.value)}
                className="mt-1 bg-white"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Diff */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-700">
            Cambios ({changedDiff.length})
          </p>
          {changedDiff.length === 0 ? (
            <p className="text-sm text-gray-400">Sin cambios respecto al SEO actual.</p>
          ) : (
            changedDiff.map((d) => (
              <div key={String(d.field)} className="rounded-md border border-gray-100 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {SEO_FIELD_LABELS[d.field as string] ?? d.field}
                  </span>
                  <Badge variant={DIFF_BADGE[d.kind].variant}>{DIFF_BADGE[d.kind].label}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-400">
                    <span className="block text-[10px] uppercase">Antes</span>
                    {renderValue(d.before)}
                  </div>
                  <div className="text-gray-800">
                    <span className="block text-[10px] uppercase">Después</span>
                    {renderValue(d.after)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {rejectMode && (
          <div>
            <Label className="text-xs">Motivo del rechazo (obligatorio)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1"
              rows={2}
              placeholder="Ej: el meta título es muy largo / no refleja el producto…"
            />
          </div>
        )}

        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

        <DialogFooter>
          {!isPending ? (
            <Button variant="outline" onClick={close}>
              Cerrar
            </Button>
          ) : rejectMode ? (
            <>
              <Button variant="ghost" onClick={() => setRejectMode(false)}>
                Volver
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={reject.isPending}
              >
                {reject.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Confirmar rechazo
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setRejectMode(true)}>
                <X className="h-4 w-4" /> Rechazar
              </Button>
              <Button onClick={handleApprove} disabled={approve.isPending}>
                {approve.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Aprobar y aplicar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
