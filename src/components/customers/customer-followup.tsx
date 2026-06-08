"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useUpdateCustomerMetadata,
  type CustomerFollowup,
  type FollowupNote,
} from "@/hooks/use-customers"
import { formatDate, formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ClipboardList, CalendarClock, CheckCircle2, MessageSquarePlus } from "lucide-react"

const CHANNELS: { value: string; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "llamada", label: "Llamada" },
  { value: "email", label: "Email" },
  { value: "presencial", label: "Presencial" },
  { value: "otro", label: "Otro" },
]

function channelLabel(value?: string): string {
  return CHANNELS.find((c) => c.value === value)?.label ?? "Contacto"
}

/** YYYY-MM-DD de hoy en local (para comparar vencimiento del próximo contacto). */
function todayStr(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60_000).toISOString().split("T")[0]
}

export function CustomerFollowupCard({
  customerId,
  metadata,
}: {
  customerId: string
  metadata: Record<string, unknown> | null | undefined
}) {
  const followup = (metadata?.seguimiento as CustomerFollowup | undefined) ?? {}
  const notes = followup.notes ?? []

  const update = useUpdateCustomerMetadata(customerId)
  const [text, setText] = useState("")
  const [channel, setChannel] = useState("whatsapp")
  const [nextContact, setNextContact] = useState(followup.nextContact ?? "")
  const [error, setError] = useState<string | null>(null)

  const overdue = !!followup.nextContact && followup.nextContact < todayStr()

  async function persist(next: CustomerFollowup) {
    setError(null)
    try {
      await update.mutateAsync({ ...(metadata ?? {}), seguimiento: next })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar el seguimiento")
    }
  }

  async function addNote() {
    if (!text.trim()) return
    const note: FollowupNote = {
      at: new Date().toISOString(),
      text: text.trim(),
      channel,
    }
    await persist({
      ...followup,
      notes: [note, ...notes],
      lastContact: note.at,
      nextContact: nextContact || followup.nextContact,
    })
    setText("")
  }

  async function saveNextContact() {
    await persist({ ...followup, nextContact: nextContact || undefined })
  }

  async function markContactedToday() {
    await persist({ ...followup, lastContact: new Date().toISOString() })
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-500" />
          Seguimiento
          {overdue && (
            <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border border-red-200 gap-1">
              <CalendarClock className="w-3 h-3" />
              Contacto vencido
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Resumen último / próximo contacto */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">Último contacto</p>
            <p className="text-sm font-medium text-gray-900">
              {followup.lastContact ? formatDateTime(followup.lastContact) : "Nunca"}
            </p>
          </div>
          <div
            className={cn(
              "rounded-lg border px-3 py-2",
              overdue ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"
            )}
          >
            <p className={cn("text-xs", overdue ? "text-red-600" : "text-gray-500")}>
              Próximo contacto
            </p>
            <p
              className={cn(
                "text-sm font-medium",
                overdue ? "text-red-700" : "text-gray-900"
              )}
            >
              {followup.nextContact ? formatDate(followup.nextContact) : "Sin programar"}
            </p>
          </div>
        </div>

        {/* Programar próximo contacto */}
        <div className="flex items-end gap-2">
          <div className="space-y-1 flex-1">
            <Label htmlFor="next-contact" className="text-xs">
              Programar próximo contacto
            </Label>
            <Input
              id="next-contact"
              type="date"
              value={nextContact}
              onChange={(e) => setNextContact(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={update.isPending || nextContact === (followup.nextContact ?? "")}
            onClick={saveNextContact}
          >
            Guardar fecha
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={update.isPending}
            onClick={markContactedToday}
            className="gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Contacté hoy
          </Button>
        </div>

        {/* Agregar nota */}
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <Label className="text-xs">Registrar contacto / nota</Label>
          <Textarea
            placeholder="Ej: La contacté por WhatsApp, dijo que pasa el jueves a retirar."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
          />
          <div className="flex items-center justify-between gap-2">
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={update.isPending || !text.trim()}
              onClick={addNote}
              className="gap-1.5"
            >
              <MessageSquarePlus className="w-4 h-4" />
              {update.isPending ? "Guardando..." : "Agregar nota"}
            </Button>
          </div>
        </div>

        {/* Historial de notas */}
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {notes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Sin registros de seguimiento todavía.
            </p>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {notes.map((n, i) => (
                <div
                  key={`${n.at}-${i}`}
                  className="rounded-lg border border-gray-100 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {channelLabel(n.channel)}
                    </Badge>
                    <span className="text-[11px] text-gray-400">
                      {formatDateTime(n.at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
