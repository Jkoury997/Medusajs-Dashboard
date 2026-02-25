"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { SectionEditor } from "./section-editor"
import type { ContentSection } from "@/types/campaigns"

const sectionLabels: Record<string, string> = {
  text: "Texto",
  image: "Imagen",
  button: "Boton",
  divider: "Divisor",
  spacer: "Espacio",
}

interface SortableSectionProps {
  id: string
  section: ContentSection
  onChange: (updated: ContentSection) => void
  onRemove: () => void
}

export function SortableSection({ id, section, onChange, onRemove }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md border border-gray-200 bg-white shadow-sm"
    >
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b bg-gray-50 px-3 py-1.5 rounded-t-md">
        {/* Drag handle */}
        <button
          className="cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          type="button"
          title="Arrastrar para reordenar"
        >
          <GripIcon />
        </button>

        <span className="text-xs font-medium text-gray-600">
          {sectionLabels[section.type] || section.type}
        </span>

        <div className="flex-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
          onClick={onRemove}
          title="Eliminar seccion"
        >
          <TrashIcon />
        </Button>
      </div>

      {/* Editor content */}
      <div className="p-3">
        <SectionEditor section={section} onChange={onChange} />
      </div>
    </div>
  )
}

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  )
}
