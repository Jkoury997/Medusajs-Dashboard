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
  usePatchGeoGuide,
  useApproveGeo,
  useRejectGeo,
  useDeleteGeo,
} from "@/hooks/use-geo-agent"
import { GEO_STATUS_BADGE } from "@/types/geo-agent"
import type { GeoProposal, GeoGuideContent, GeoGuideSection, GeoFaq } from "@/types/geo-agent"
import {
  Save,
  Check,
  Send,
  X,
  Trash2,
  Plus,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react"

export function GeoGuideDialog({
  proposal,
  open,
  onOpenChange,
}: {
  proposal: GeoProposal | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
        {proposal && proposal.guide ? (
          <GeoEditor
            key={proposal.proposal_id}
            proposal={proposal}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <DialogHeader>
            <DialogTitle>Guía sin contenido</DialogTitle>
            <DialogDescription>Esta propuesta no tiene contenido para editar.</DialogDescription>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  )
}

function GeoEditor({
  proposal,
  onClose,
}: {
  proposal: GeoProposal
  onClose: () => void
}) {
  const guide = proposal.guide as GeoGuideContent
  const patch = usePatchGeoGuide()
  const approve = useApproveGeo()
  const reject = useRejectGeo()
  const del = useDeleteGeo()

  const [form, setForm] = useState<GeoGuideContent>(guide)
  const [rejectMode, setRejectMode] = useState(false)
  const [note, setNote] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const isPending = proposal.status === "proposed" || proposal.status === "approved"
  const busy = patch.isPending || approve.isPending || reject.isPending || del.isPending

  const set = <K extends keyof GeoGuideContent>(key: K, value: GeoGuideContent[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrorMsg("")
  }

  const setSection = (i: number, patchObj: Partial<GeoGuideSection>) => {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s, idx) => (idx === i ? { ...s, ...patchObj } : s)),
    }))
  }
  const addSection = () =>
    setForm((f) => ({ ...f, sections: [...f.sections, { heading: "", body: "" }] }))
  const removeSection = (i: number) =>
    setForm((f) => ({ ...f, sections: f.sections.filter((_, idx) => idx !== i) }))

  const setFaq = (i: number, patchObj: Partial<GeoFaq>) => {
    setForm((f) => ({
      ...f,
      faq: f.faq.map((q, idx) => (idx === i ? { ...q, ...patchObj } : q)),
    }))
  }
  const addFaq = () => setForm((f) => ({ ...f, faq: [...f.faq, { pregunta: "", respuesta: "" }] }))
  const removeFaq = (i: number) =>
    setForm((f) => ({ ...f, faq: f.faq.filter((_, idx) => idx !== i) }))

  // Edits a mandar al backend (subset soportado por PATCH).
  const buildEdits = (): Partial<GeoGuideContent> => ({
    title: form.title,
    meta_title: form.meta_title,
    meta_description: form.meta_description,
    excerpt: form.excerpt,
    intro: form.intro,
    category: form.category ?? null,
    hero_image: form.hero_image ?? null,
    sections: form.sections,
    faq: form.faq,
    internal_links: form.internal_links,
    target_queries: form.target_queries,
  })

  const handleSave = async () => {
    setErrorMsg("")
    try {
      await patch.mutateAsync({ id: proposal.proposal_id, edits: buildEdits() })
    } catch (e) {
      setErrorMsg((e as Error).message)
    }
  }

  const handleApprove = async (publish: boolean) => {
    setErrorMsg("")
    try {
      // Persistimos primero las ediciones, después aprobamos/publicamos.
      await patch.mutateAsync({ id: proposal.proposal_id, edits: buildEdits() })
      await approve.mutateAsync({ id: proposal.proposal_id, publish })
      onClose()
    } catch (e) {
      setErrorMsg((e as Error).message)
    }
  }

  const handleReject = async () => {
    setErrorMsg("")
    try {
      await reject.mutateAsync({ id: proposal.proposal_id, note: note.trim() || undefined })
      onClose()
    } catch (e) {
      setErrorMsg((e as Error).message)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("¿Borrar esta guía? No se puede deshacer.")) return
    setErrorMsg("")
    try {
      await del.mutateAsync(proposal.proposal_id)
      onClose()
    } catch (e) {
      setErrorMsg((e as Error).message)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2">
          {form.title || "Guía"}
          <Badge variant={GEO_STATUS_BADGE[proposal.status]?.variant ?? "outline"}>
            {GEO_STATUS_BADGE[proposal.status]?.label ?? proposal.status}
          </Badge>
          {proposal.brand && <Badge variant="outline">{proposal.brand}</Badge>}
        </DialogTitle>
        <DialogDescription>
          {proposal.reason || "Guía citable generada por IA."}
        </DialogDescription>
      </DialogHeader>

      {/* Datos pendientes */}
      {form.data_needs.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="flex items-center gap-1 font-medium text-amber-700">
            <AlertTriangle className="h-4 w-4" /> {form.data_needs.length} dato(s) pendiente(s)
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs text-amber-700">
            {form.data_needs.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {proposal.status === "applied" && proposal.public_url && (
        <a
          href={proposal.public_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <ExternalLink className="h-4 w-4" /> Ver guía publicada
        </a>
      )}

      {/* Campos principales */}
      <div className="space-y-3">
        <Field label="Título (H1)">
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Categoría">
            <Input
              value={form.category ?? ""}
              onChange={(e) => set("category", e.target.value)}
            />
          </Field>
          <Field label="Imagen hero (URL)">
            <Input
              value={form.hero_image ?? ""}
              onChange={(e) => set("hero_image", e.target.value)}
              placeholder="https://…"
            />
          </Field>
        </div>
        <Field label="Meta título">
          <Input value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)} />
        </Field>
        <Field label="Meta descripción">
          <Textarea
            rows={2}
            value={form.meta_description}
            onChange={(e) => set("meta_description", e.target.value)}
          />
        </Field>
        <Field label="Excerpt (resumen 1 frase)">
          <Textarea rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
        </Field>
        <Field label="Intro (la 1ra frase debe responder la query)">
          <Textarea rows={4} value={form.intro} onChange={(e) => set("intro", e.target.value)} />
        </Field>
        <Field label="Queries objetivo (separadas por comas)">
          <Input
            value={form.target_queries.join(", ")}
            onChange={(e) =>
              set(
                "target_queries",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              )
            }
          />
        </Field>
      </div>

      {/* Secciones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Secciones ({form.sections.length})</h4>
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
        {form.sections.map((s, i) => (
          <div key={i} className="rounded-md border border-gray-100 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={s.heading}
                onChange={(e) => setSection(i, { heading: e.target.value })}
                placeholder="Encabezado"
                className="font-medium"
              />
              <Button variant="ghost" size="sm" onClick={() => removeSection(i)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            <Textarea
              rows={4}
              value={s.body}
              onChange={(e) => setSection(i, { body: e.target.value })}
              placeholder="Cuerpo (markdown básico)"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                value={s.tip ?? ""}
                onChange={(e) => setSection(i, { tip: e.target.value })}
                placeholder="Tip MK (opcional)"
              />
              <Input
                value={s.image ?? ""}
                onChange={(e) => setSection(i, { image: e.target.value })}
                placeholder="Imagen URL (opcional)"
              />
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">FAQ ({form.faq.length})</h4>
          <Button variant="outline" size="sm" onClick={addFaq}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
        {form.faq.map((q, i) => (
          <div key={i} className="rounded-md border border-gray-100 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={q.pregunta}
                onChange={(e) => setFaq(i, { pregunta: e.target.value })}
                placeholder="Pregunta"
              />
              <Button variant="ghost" size="sm" onClick={() => removeFaq(i)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            <Textarea
              rows={2}
              value={q.respuesta}
              onChange={(e) => setFaq(i, { respuesta: e.target.value })}
              placeholder="Respuesta"
            />
          </div>
        ))}
      </div>

      {/* Links internos (lectura) */}
      {form.internal_links.length > 0 && (
        <div className="text-xs text-gray-500">
          <span className="font-medium">Links internos sugeridos:</span>{" "}
          {form.internal_links.map((l, i) => (
            <span key={i}>
              {l.label} ({l.url_hint}){i < form.internal_links.length - 1 ? " · " : ""}
            </span>
          ))}
        </div>
      )}

      {rejectMode && (
        <Field label="Motivo del rechazo (opcional)">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      )}

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <DialogFooter className="flex-wrap gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={busy}
          className="mr-auto text-red-600"
        >
          <Trash2 className="h-4 w-4" /> Borrar
        </Button>

        <Button variant="outline" onClick={handleSave} disabled={busy}>
          {patch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>

        {isPending && !rejectMode && (
          <>
            <Button variant="outline" onClick={() => setRejectMode(true)} disabled={busy}>
              <X className="h-4 w-4" /> Rechazar
            </Button>
            <Button variant="secondary" onClick={() => handleApprove(false)} disabled={busy}>
              <Check className="h-4 w-4" /> Aprobar
            </Button>
            <Button onClick={() => handleApprove(true)} disabled={busy}>
              {approve.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publicar
            </Button>
          </>
        )}

        {rejectMode && (
          <>
            <Button variant="ghost" onClick={() => setRejectMode(false)} disabled={busy}>
              Volver
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={busy}>
              {reject.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Confirmar rechazo
            </Button>
          </>
        )}
      </DialogFooter>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
