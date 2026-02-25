"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useProductSearch } from "@/hooks/use-manual-campaigns"

interface ProductPickerProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  customerGroup?: string
}

export function ProductPicker({ selectedIds, onChange, customerGroup }: ProductPickerProps) {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useProductSearch(debouncedSearch, customerGroup)

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const toggleProduct = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((pid) => pid !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const removeProduct = (id: string) => {
    onChange(selectedIds.filter((pid) => pid !== id))
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(price)

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Buscar productos</Label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-1 h-8 text-sm"
          placeholder="Buscar por nombre..."
        />
      </div>

      {/* Selected products badges */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data?.products
            .filter((p) => selectedSet.has(p.id))
            .map((p) => (
              <Badge key={p.id} className="bg-pink-100 text-pink-700 gap-1">
                {p.title.length > 30 ? p.title.slice(0, 30) + "..." : p.title}
                <button onClick={() => removeProduct(p.id)} className="ml-1 hover:text-pink-900">
                  &times;
                </button>
              </Badge>
            ))}
          {selectedIds
            .filter((id) => !data?.products.some((p) => p.id === id))
            .map((id) => (
              <Badge key={id} className="bg-gray-100 text-gray-500 gap-1">
                {id.slice(0, 16)}...
                <button onClick={() => removeProduct(id)} className="ml-1">
                  &times;
                </button>
              </Badge>
            ))}
        </div>
      )}

      {/* Search results */}
      {isLoading && <p className="text-xs text-gray-500">Buscando...</p>}
      {data?.products && data.products.length > 0 && (
        <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
          {data.products.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`w-full flex items-center gap-3 p-2 text-left text-sm hover:bg-gray-50 ${
                selectedSet.has(p.id) ? "bg-pink-50" : ""
              }`}
              onClick={() => toggleProduct(p.id)}
            >
              {p.thumbnail && (
                <img src={p.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.title}</p>
                <p className="text-xs text-gray-500">
                  {p.category} {formatPrice(p.price)}
                </p>
              </div>
              {selectedSet.has(p.id) && (
                <Badge className="bg-pink-100 text-pink-700 text-[10px]">Seleccionado</Badge>
              )}
            </button>
          ))}
        </div>
      )}
      {data?.products && data.products.length === 0 && search && (
        <p className="text-xs text-gray-500 text-center p-2">No se encontraron productos</p>
      )}
    </div>
  )
}
