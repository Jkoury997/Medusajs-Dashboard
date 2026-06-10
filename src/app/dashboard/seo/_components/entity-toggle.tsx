"use client"

import { Button } from "@/components/ui/button"
import type { EntityKind } from "@/types/seo-agent"
import { Package, FolderTree } from "lucide-react"

/** Selector segmentado Productos / Categorías, compartido entre tabs. */
export function EntityToggle({
  value,
  onChange,
}: {
  value: EntityKind
  onChange: (v: EntityKind) => void
}) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 p-0.5">
      <Button
        type="button"
        size="sm"
        variant={value === "product" ? "default" : "ghost"}
        onClick={() => onChange("product")}
      >
        <Package className="h-4 w-4" /> Productos
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "category" ? "default" : "ghost"}
        onClick={() => onChange("category")}
      >
        <FolderTree className="h-4 w-4" /> Categorías
      </Button>
    </div>
  )
}
