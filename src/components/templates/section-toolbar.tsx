"use client"

import { Button } from "@/components/ui/button"
import type { ContentSection } from "@/types/campaigns"

interface SectionToolbarProps {
  onAdd: (section: ContentSection) => void
}

const sectionTypes: {
  label: string
  icon: string
  create: () => ContentSection
}[] = [
  {
    label: "Texto",
    icon: "T",
    create: () => ({ type: "text", html: "<p>Escribe tu texto aqui...</p>" }),
  },
  {
    label: "Imagen",
    icon: "IMG",
    create: () => ({ type: "image", src: "", alt: "", width: "full" }),
  },
  {
    label: "Boton",
    icon: "BTN",
    create: () => ({
      type: "button",
      text: "Ver mas",
      url: "https://www.marcelakoury.com",
      backgroundColor: "#ff75a8",
    }),
  },
  {
    label: "Divisor",
    icon: "---",
    create: () => ({ type: "divider" }),
  },
  {
    label: "Espacio",
    icon: "[ ]",
    create: () => ({ type: "spacer", height: 24 }),
  },
]

export function SectionToolbar({ onAdd }: SectionToolbarProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 p-2">
      <span className="text-xs text-gray-500 font-medium">Agregar:</span>
      {sectionTypes.map(({ label, icon, create }) => (
        <Button
          key={label}
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={() => onAdd(create())}
        >
          <span className="font-mono text-[10px] opacity-60">{icon}</span>
          {label}
        </Button>
      ))}
    </div>
  )
}
