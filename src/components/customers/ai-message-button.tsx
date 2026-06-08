"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { getWhatsAppUrlCustom } from "@/lib/whatsapp"
import { Sparkles, Copy, Check, RefreshCw } from "lucide-react"

export interface AIMessageCustomer {
  firstName?: string
  phone?: string | null
  daysSinceLastOrder?: number | null
  orderCount?: number
  totalSpent?: number
  topProducts?: string[]
  lastNote?: string
}

async function draft(customer: AIMessageCustomer): Promise<string> {
  const res = await fetch("/api/ai/customer-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error" }))
    throw new Error(err.error || "No se pudo generar el mensaje")
  }
  const data = await res.json()
  return (data.message as string) ?? ""
}

export function AIMessageButton({
  customer,
  variant = "outline",
  size = "sm",
  label = "Redactar IA",
}: {
  customer: AIMessageCustomer
  variant?: "outline" | "default" | "ghost"
  size?: "sm" | "default" | "icon"
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [copied, setCopied] = useState(false)

  const gen = useMutation({
    mutationFn: () => draft(customer),
    onSuccess: (msg) => setText(msg),
  })

  function handleOpen() {
    setOpen(true)
    setText("")
    gen.mutate()
  }

  function copy() {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const waUrl = customer.phone && text ? getWhatsAppUrlCustom(customer.phone, text) : null

  return (
    <>
      <Button variant={variant} size={size} onClick={handleOpen} className="gap-1.5">
        <Sparkles className="w-4 h-4" />
        {size !== "icon" && label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-mk-pink" />
              Mensaje sugerido por IA
              {customer.firstName ? ` — ${customer.firstName}` : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3">
            {gen.isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/6" />
              </div>
            ) : gen.isError ? (
              <p className="text-sm text-red-600">
                {gen.error instanceof Error ? gen.error.message : "Error al generar el mensaje"}
              </p>
            ) : (
              <>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  placeholder="El mensaje generado aparecerá acá…"
                />
                <p className="text-xs text-gray-400">
                  Podés editarlo antes de enviarlo. La IA propone, vos decidís.
                </p>
              </>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => gen.mutate()}
              disabled={gen.isPending}
              className="gap-1.5 sm:mr-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerar
            </Button>
            <Button variant="outline" size="sm" onClick={copy} disabled={!text} className="gap-1.5">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              Copiar
            </Button>
            {waUrl ? (
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5 w-full">
                  Enviar por WhatsApp
                </Button>
              </a>
            ) : (
              <Button size="sm" disabled className="gap-1.5" title="Sin teléfono">
                Enviar por WhatsApp
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
