"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "./rich-text-editor"
import { ImageSectionEditor } from "./image-section-editor"
import type { ContentSection } from "@/types/campaigns"

interface SectionEditorProps {
  section: ContentSection
  onChange: (updated: ContentSection) => void
}

export function SectionEditor({ section, onChange }: SectionEditorProps) {
  switch (section.type) {
    case "text":
      return (
        <RichTextEditor
          content={section.html}
          onChange={(html) => onChange({ type: "text", html })}
        />
      )

    case "image":
      return (
        <ImageSectionEditor
          src={section.src}
          alt={section.alt}
          href={section.href}
          width={section.width}
          onChange={(data) => onChange({ type: "image", ...data })}
        />
      )

    case "button":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Texto del boton</Label>
              <Input
                value={section.text}
                onChange={(e) =>
                  onChange({ ...section, text: e.target.value })
                }
                className="mt-1 h-8 text-sm"
                placeholder="Ej: Ver oferta"
              />
            </div>
            <div>
              <Label className="text-xs">URL</Label>
              <Input
                value={section.url}
                onChange={(e) =>
                  onChange({ ...section, url: e.target.value })
                }
                className="mt-1 h-8 text-sm"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Color</Label>
            <input
              type="color"
              value={section.backgroundColor || "#ff75a8"}
              onChange={(e) =>
                onChange({ ...section, backgroundColor: e.target.value })
              }
              className="h-7 w-10 cursor-pointer rounded border p-0.5"
            />
            <span className="text-xs text-gray-500">
              {section.backgroundColor || "#ff75a8"}
            </span>
          </div>
          {/* Button preview */}
          <div className="rounded bg-gray-50 p-3 text-center">
            <span
              className="inline-block rounded-lg px-6 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: section.backgroundColor || "#ff75a8" }}
            >
              {section.text || "Boton"}
            </span>
          </div>
        </div>
      )

    case "divider":
      return (
        <div className="py-2">
          <hr className="border-gray-300" />
          <p className="mt-1 text-center text-xs text-gray-400">Linea divisora</p>
        </div>
      )

    case "spacer":
      return (
        <div className="flex items-center gap-2">
          <Label className="text-xs">Altura (px)</Label>
          <Input
            type="number"
            min={8}
            max={100}
            value={section.height || 24}
            onChange={(e) =>
              onChange({ type: "spacer", height: Number(e.target.value) || 24 })
            }
            className="h-8 w-24 text-sm"
          />
          <div
            className="flex-1 rounded bg-gray-100"
            style={{ height: section.height || 24 }}
          />
        </div>
      )

    default:
      return null
  }
}
