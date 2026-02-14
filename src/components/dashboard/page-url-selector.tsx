"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEvents } from "@/hooks/use-events"
import type { DateRange } from "@/components/dashboard/date-range-picker"

interface PageUrlSelectorProps {
  value: string
  onChange: (url: string) => void
  dateRange: DateRange
}

export function PageUrlSelector({ value, onChange, dateRange }: PageUrlSelectorProps) {
  const [mode, setMode] = useState<"popular" | "custom">("popular")
  const [customUrl, setCustomUrl] = useState("")

  const toNext = new Date(dateRange.to)
  toNext.setDate(toNext.getDate() + 1)
  const fromStr = dateRange.from.toISOString().split("T")[0]
  const toStr = toNext.toISOString().split("T")[0]

  // Buscar eventos de interacción que tienen page_url en data
  const { data: clickEvents } = useEvents({
    event: "interaction.click",
    from: fromStr, to: toStr, limit: 500, sort: "desc",
  })
  const { data: scrollEvents } = useEvents({
    event: "interaction.scroll_depth",
    from: fromStr, to: toStr, limit: 500, sort: "desc",
  })
  const { data: visibilityEvents } = useEvents({
    event: "interaction.products_visible",
    from: fromStr, to: toStr, limit: 500, sort: "desc",
  })

  const popularUrls = useMemo(() => {
    const urlCounts = new Map<string, number>()

    const allEvents = [
      ...(clickEvents?.events || []),
      ...(scrollEvents?.events || []),
      ...(visibilityEvents?.events || []),
    ]

    allEvents.forEach((ev) => {
      const url = ev.data?.page_url as string | undefined
      if (url) {
        urlCounts.set(url, (urlCounts.get(url) || 0) + 1)
      }
    })

    return Array.from(urlCounts.entries())
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  }, [clickEvents, scrollEvents, visibilityEvents])

  const handleApplyCustom = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim())
    }
  }

  return (
    <div className="space-y-3">
      <Label>Página para Analizar</Label>

      <div className="flex gap-2">
        <Button
          variant={mode === "popular" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("popular")}
        >
          Páginas Populares
        </Button>
        <Button
          variant={mode === "custom" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("custom")}
        >
          URL Personalizada
        </Button>
      </div>

      {mode === "popular" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar página..." />
          </SelectTrigger>
          <SelectContent>
            {popularUrls.length > 0 ? (
              popularUrls.map(({ url, count }) => (
                <SelectItem key={url} value={url}>
                  {url} ({count} vistas)
                </SelectItem>
              ))
            ) : (
              <SelectItem value="_empty" disabled>
                No hay datos de páginas vistas
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="/products/remera-basica"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplyCustom()
            }}
          />
          <Button onClick={handleApplyCustom}>Aplicar</Button>
        </div>
      )}

      {value && (
        <p className="text-xs text-gray-500">
          Analizando: <span className="font-mono font-medium">{value}</span>
        </p>
      )}
    </div>
  )
}
