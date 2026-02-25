"use client"

import { useState, useRef } from "react"
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
import { useUploadMedia } from "@/hooks/use-media"

interface ImageSectionEditorProps {
  src: string
  alt?: string
  href?: string
  width?: "full" | "medium" | "small"
  onChange: (data: { src: string; alt?: string; href?: string; width?: "full" | "medium" | "small" }) => void
}

export function ImageSectionEditor({ src, alt, href, width, onChange }: ImageSectionEditorProps) {
  const [mode, setMode] = useState<"url" | "upload">(src && !src.startsWith("/api/") ? "url" : "upload")
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadMedia()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadMutation.mutateAsync(file)
      onChange({ src: result.url, alt, href, width })
    } catch {
      // Error handled by mutation
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "url" ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={() => setMode("url")}
        >
          URL
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "upload" ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={() => setMode("upload")}
        >
          Subir archivo
        </Button>
      </div>

      {mode === "url" ? (
        <div>
          <Label className="text-xs">URL de la imagen</Label>
          <Input
            value={src}
            onChange={(e) => onChange({ src: e.target.value, alt, href, width })}
            className="mt-1 h-8 text-sm"
            placeholder="https://ejemplo.com/imagen.jpg"
          />
        </div>
      ) : (
        <div>
          <Label className="text-xs">Archivo de imagen</Label>
          <div className="mt-1 flex gap-2 items-center">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Subiendo..." : "Elegir archivo"}
            </Button>
            {src && <span className="text-xs text-green-600 truncate max-w-[200px]">Imagen cargada</span>}
          </div>
          {uploadMutation.isError && (
            <p className="mt-1 text-xs text-red-600">{uploadMutation.error?.message}</p>
          )}
        </div>
      )}

      {/* Preview */}
      {src && (
        <div className="border rounded p-2 bg-gray-50">
          <img
            src={src}
            alt={alt || "Preview"}
            className="max-h-32 mx-auto rounded object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none"
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Alt text</Label>
          <Input
            value={alt || ""}
            onChange={(e) => onChange({ src, alt: e.target.value, href, width })}
            className="mt-1 h-8 text-sm"
            placeholder="Descripcion"
          />
        </div>
        <div>
          <Label className="text-xs">Link (opcional)</Label>
          <Input
            value={href || ""}
            onChange={(e) => onChange({ src, alt, href: e.target.value, width })}
            className="mt-1 h-8 text-sm"
            placeholder="https://..."
          />
        </div>
        <div>
          <Label className="text-xs">Ancho</Label>
          <Select
            value={width || "full"}
            onValueChange={(v) => onChange({ src, alt, href, width: v as "full" | "medium" | "small" })}
          >
            <SelectTrigger className="mt-1 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Completo</SelectItem>
              <SelectItem value="medium">Mediano</SelectItem>
              <SelectItem value="small">Chico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
