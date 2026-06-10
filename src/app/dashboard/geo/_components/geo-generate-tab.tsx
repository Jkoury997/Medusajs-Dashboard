"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useGenerateGeo } from "@/hooks/use-geo-agent"
import type { GenerateGeoResult } from "@/types/geo-agent"
import { Sparkles, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

export function GeoGenerateTab({
  salesChannelId,
  channelName,
}: {
  salesChannelId?: string
  channelName?: string
}) {
  const [topics, setTopics] = useState("")
  const [maxGuides, setMaxGuides] = useState(3)
  const generate = useGenerateGeo()
  const [result, setResult] = useState<GenerateGeoResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const noBrand = !salesChannelId

  const handleGenerate = () => {
    setErrorMsg("")
    setResult(null)
    const topicList = topics
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
    generate.mutate(
      {
        sales_channel_id: salesChannelId,
        topics: topicList.length ? topicList : undefined,
        max_guides: maxGuides,
      },
      {
        onSuccess: (r) => setResult(r),
        onError: (e) => setErrorMsg((e as Error).message),
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Generar guías GEO</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-500">
          Genera guías citables por IA para{" "}
          <span className="font-medium">{channelName ?? "—"}</span>. Quedan en estado pendiente
          para revisar en la pestaña Guías. Sin temas, se derivan del catálogo + Search Console.
        </p>

        {noBrand && (
          <p className="flex items-center gap-1 text-sm text-amber-600">
            <AlertTriangle className="h-4 w-4" /> Elegí una marca arriba: la generación es por
            marca.
          </p>
        )}

        <div>
          <Label className="text-xs">Temas (uno por línea, opcional)</Label>
          <Textarea
            rows={4}
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder={"mejores talles para cuerpo pera\ncómo cuidar prendas de encaje"}
            className="mt-1"
            disabled={noBrand}
          />
        </div>

        <div className="flex items-end gap-3">
          <div>
            <Label className="text-xs">Máx. de guías</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={maxGuides}
              onChange={(e) => {
                const n = Number(e.target.value)
                setMaxGuides(Math.min(10, Math.max(1, Number.isFinite(n) ? n : 1)))
              }}
              className="mt-1 w-28"
              disabled={noBrand}
            />
          </div>
          <Button onClick={handleGenerate} disabled={noBrand || generate.isPending}>
            {generate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generar
          </Button>
        </div>

        {result && (
          <div className="rounded-md border border-green-100 bg-green-50 p-3 text-sm space-y-1">
            <p className="flex items-center gap-1 font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" /> {result.created} guía(s) creada(s)
            </p>
            <p className="text-gray-700">
              Costo: USD {result.cost_usd.toFixed(2)} ·{" "}
              {result.llm_used ? "generadas por IA" : "fallback sin IA"}
              {result.fallback_used ? " (con fallback)" : ""}. Revisalas en la pestaña Guías.
            </p>
          </div>
        )}

        {errorMsg && (
          <p className="flex items-center gap-1 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" /> {errorMsg}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
