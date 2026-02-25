"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buildEmailPreviewHtml } from "@/components/templates/render-section-html"
import type { ContentPreset } from "@/types/campaigns"

interface TemplatePickerProps {
  presets: ContentPreset[]
  onSelect: (preset: ContentPreset) => void
  onSkip: () => void
}

function TemplateCard({ preset, onSelect }: { preset: ContentPreset; onSelect: () => void }) {
  const previewHtml = useMemo(() => {
    const sections = preset.content?.body_sections || []
    return buildEmailPreviewHtml({
      heading: preset.content?.heading,
      sections,
      buttonText: preset.content?.button_text,
      buttonUrl: preset.content?.button_url,
      footerText: preset.content?.footer_text,
    })
  }, [preset])

  const sectionCount = preset.content?.body_sections?.length || 0

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
      {/* Mini preview */}
      <div className="relative bg-gray-100 border-b" style={{ height: "200px", overflow: "hidden" }}>
        <iframe
          srcDoc={previewHtml}
          className="w-full border-0"
          style={{
            height: "600px",
            transform: "scale(0.33)",
            transformOrigin: "top left",
            width: "300%",
            pointerEvents: "none",
          }}
          sandbox="allow-same-origin"
          title={`Preview: ${preset.name}`}
          tabIndex={-1}
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-1">
            {preset.name}
          </h3>
          {sectionCount > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
              {sectionCount} secciones
            </Badge>
          )}
        </div>

        {preset.description && (
          <p className="text-xs text-gray-500 line-clamp-1">{preset.description}</p>
        )}

        {preset.content?.subject && (
          <p className="text-xs text-gray-400 truncate">
            Asunto: {preset.content.subject}
          </p>
        )}

        <Button
          size="sm"
          className="w-full h-7 text-xs mt-1"
          onClick={onSelect}
        >
          Seleccionar
        </Button>
      </CardContent>
    </Card>
  )
}

export function TemplatePicker({ presets, onSelect, onSkip }: TemplatePickerProps) {
  return (
    <div className="space-y-4 py-2">
      <div>
        <p className="text-sm text-gray-600">
          Elegi una plantilla para empezar o crea la campana desde cero.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
        {/* Blank template card */}
        <Card
          className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group border-dashed"
          onClick={onSkip}
        >
          <div
            className="flex items-center justify-center bg-gray-50 border-b"
            style={{ height: "200px" }}
          >
            <div className="text-center text-gray-400">
              <div className="text-3xl mb-2">+</div>
              <p className="text-xs font-medium">En blanco</p>
            </div>
          </div>
          <CardContent className="p-3">
            <h3 className="text-sm font-semibold text-gray-700">Empezar en blanco</h3>
            <p className="text-xs text-gray-400 mt-1">Sin plantilla, arma todo desde cero</p>
          </CardContent>
        </Card>

        {/* Template cards */}
        {presets.map((preset) => (
          <TemplateCard
            key={preset._id}
            preset={preset}
            onSelect={() => onSelect(preset)}
          />
        ))}
      </div>
    </div>
  )
}
