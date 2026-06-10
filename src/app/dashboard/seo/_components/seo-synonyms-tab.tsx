"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useSynonyms,
  useCreateSynonym,
  useDeleteSynonym,
  useSynonymSuggestions,
} from "@/hooks/use-seo-agent"
import { formatNumber } from "@/lib/format"
import type { Synonym, SynonymType } from "@/types/seo-agent"
import { Plus, Trash2, Loader2, ArrowRight, Lightbulb, Search } from "lucide-react"

function synonymWords(s: Synonym): string {
  const words = s.synonyms ?? []
  if (s.type === "onewaysynonym" && s.input) {
    return `${s.input} → ${words.join(", ")}`
  }
  return words.join(" ↔ ")
}

export function SeoSynonymsTab({ salesChannelId }: { salesChannelId?: string }) {
  const [search, setSearch] = useState("")
  const { data, isLoading, error } = useSynonyms(search)
  const suggestions = useSynonymSuggestions(salesChannelId)
  const create = useCreateSynonym()
  const del = useDeleteSynonym()

  const [words, setWords] = useState("")
  const [type, setType] = useState<SynonymType>("synonym")
  const [formError, setFormError] = useState("")

  const synonyms = data?.synonyms ?? []

  const handleCreate = () => {
    setFormError("")
    const parts = words
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean)
    if (parts.length < 2) {
      setFormError("Cargá al menos 2 palabras separadas por comas.")
      return
    }
    const payload =
      type === "onewaysynonym"
        ? { type, input: parts[0], synonyms: parts.slice(1) }
        : { type, synonyms: parts }
    create.mutate(payload, {
      onSuccess: () => setWords(""),
      onError: (e) => setFormError((e as Error).message),
    })
  }

  const createFromSuggestion = (a: string, b: string) => {
    create.mutate({ type: "synonym", synonyms: [a, b] })
  }

  return (
    <div className="space-y-6">
      {/* Alta de synonym */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nuevo synonym
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-3">
            <div>
              <Label className="text-xs">Palabras (separadas por comas)</Label>
              <Input
                value={words}
                onChange={(e) => setWords(e.target.value)}
                placeholder="ej: sostén, corpiño"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as SynonymType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="synonym">Bidireccional</SelectItem>
                  <SelectItem value="onewaysynonym">Una dirección</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            {type === "onewaysynonym"
              ? "Una dirección: la primera palabra mapea a las demás (la búsqueda de la primera también trae las otras, no al revés)."
              : "Bidireccional: todas las palabras se tratan como equivalentes entre sí."}
          </p>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={create.isPending}>
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Crear synonym
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sugerencias automáticas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" /> Sugerencias automáticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestions.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (suggestions.data?.suggestions ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-2">
              No hay sugerencias pendientes. Se generan cruzando las búsquedas sin
              clicks/resultados con el catálogo.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sugerencia</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead className="text-right">Impacto</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(suggestions.data?.suggestions ?? []).map((s, idx) => (
                  <TableRow key={`${s.outsider_word}-${s.suggested_catalog_word}-${idx}`}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-1">
                        {s.outsider_word}
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        {s.suggested_catalog_word}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      “{s.query}”
                    </TableCell>
                    <TableCell className="text-right text-xs text-gray-500">
                      {formatNumber(s.count)} búsq.
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={create.isPending}
                        onClick={() =>
                          createFromSuggestion(s.outsider_word, s.suggested_catalog_word)
                        }
                      >
                        <Plus className="h-4 w-4" /> Crear
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Synonyms activos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Synonyms activos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar synonyms…"
              className="pl-9"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600">{(error as Error).message}</p>
          ) : isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : synonyms.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No hay synonyms cargados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Synonym</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {synonyms.map((s) => (
                  <TableRow key={s.objectID}>
                    <TableCell className="font-medium">{synonymWords(s)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {s.type === "onewaysynonym" ? "Una dirección" : "Bidireccional"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={del.isPending && del.variables === s.objectID}
                        onClick={() => del.mutate(s.objectID)}
                      >
                        {del.isPending && del.variables === s.objectID ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
