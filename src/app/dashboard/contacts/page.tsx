"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useContactList,
  useDeleteContact,
  useContactGroupList,
  useDeleteContactGroup,
  useContactTags,
  useImportHistory,
  useImportMedusa,
} from "@/hooks/use-contacts"
import { ContactEditor } from "@/components/contacts/contact-editor"
import { GroupEditor } from "@/components/contacts/group-editor"
import { ImportDialog } from "@/components/contacts/import-dialog"
import { BulkActionsBar } from "@/components/contacts/bulk-actions-bar"
import type { ContactListFilters, ContactSource, SubscriptionStatus } from "@/types/contacts"
import {
  Search,
  Plus,
  MoreHorizontal,
  Upload,
  Database,
} from "lucide-react"

const PAGE_SIZE = 20

const SOURCE_LABELS: Record<ContactSource, string> = {
  manual: "Manual",
  csv_import: "CSV",
  medusa_import: "Medusa",
  api: "API",
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState("contacts")

  return (
    <div>
      <Header
        title="Contactos"
        description="Gestionar contactos, grupos e importaciones para email marketing"
      />

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="contacts">Contactos</TabsTrigger>
            <TabsTrigger value="groups">Grupos</TabsTrigger>
            <TabsTrigger value="import">Importar</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="mt-4">
            <ContactsTab />
          </TabsContent>
          <TabsContent value="groups" className="mt-4">
            <GroupsTab />
          </TabsContent>
          <TabsContent value="import" className="mt-4">
            <ImportTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ============================================================
// CONTACTS TAB
// ============================================================

function ContactsTab() {
  // Filters
  const [search, setSearch] = useState("")
  const [groupFilter, setGroupFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [listPage, setListPage] = useState(0)

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Dialogs
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const filters = useMemo<ContactListFilters>(() => {
    const f: ContactListFilters = { limit: PAGE_SIZE, offset: listPage * PAGE_SIZE }
    if (search) f.search = search
    if (groupFilter !== "all") f.group_id = groupFilter
    if (tagFilter !== "all") f.tag = tagFilter
    if (statusFilter !== "all") f.subscription_status = statusFilter as SubscriptionStatus
    if (sourceFilter !== "all") f.source = sourceFilter as ContactSource
    return f
  }, [search, groupFilter, tagFilter, statusFilter, sourceFilter, listPage])

  const { data, isLoading } = useContactList(filters)
  const { data: groupsData } = useContactGroupList()
  const { data: tagsData } = useContactTags()
  const deleteMutation = useDeleteContact()

  const contacts = data?.contacts ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const groups = groupsData?.groups ?? []
  const tags = tagsData?.tags ?? []

  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.includes(c._id))

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(contacts.map((c) => c._id))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const openEditor = (id?: string) => {
    setEditingId(id ?? null)
    setEditorOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm("¿Eliminar este contacto?")) {
      deleteMutation.mutate(id)
    }
  }

  const resetPage = () => setListPage(0)

  const getGroupNames = (groupIds?: string[]) => {
    if (!groupIds || groupIds.length === 0) return []
    return groupIds
      .map((gid) => groups.find((g) => g._id === gid))
      .filter(Boolean)
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
            placeholder="Buscar por email, nombre, empresa..."
            className="pl-9"
          />
        </div>

        <Select value={groupFilter} onValueChange={(v) => { setGroupFilter(v); resetPage() }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Grupo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los grupos</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={(v) => { setTagFilter(v); resetPage() }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tags</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage() }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="subscribed">Suscritos</SelectItem>
            <SelectItem value="unsubscribed">Desuscritos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); resetPage() }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="csv_import">CSV</SelectItem>
            <SelectItem value="medusa_import">Medusa</SelectItem>
            <SelectItem value="api">API</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => openEditor()}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo Contacto
        </Button>
      </div>

      {/* Contacts table */}
      {isLoading ? (
        <Skeleton className="h-[400px]" />
      ) : contacts.length > 0 ? (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Grupos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c._id} className={selectedIds.includes(c._id) ? "bg-blue-50/50" : ""}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c._id)}
                        onChange={() => toggleOne(c._id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">
                      {c.email}
                    </TableCell>
                    <TableCell className="text-sm">
                      {[c.first_name, c.last_name].filter(Boolean).join(" ") || "-"}
                    </TableCell>
                    <TableCell className="text-sm">{c.phone || "-"}</TableCell>
                    <TableCell className="text-sm">{c.company || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {getGroupNames(c.groups).map((g) => (
                          <span
                            key={g!._id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600"
                          >
                            {g!.color && (
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: g!.color }}
                              />
                            )}
                            {g!.name}
                          </span>
                        ))}
                        {(!c.groups || c.groups.length === 0) && <span className="text-xs text-gray-400">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={c.subscription_status === "subscribed" ? "default" : "secondary"}
                        className={c.subscription_status === "subscribed"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-500"}
                      >
                        {c.subscription_status === "subscribed" ? "Suscrito" : "Desuscrito"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {SOURCE_LABELS[c.source] || c.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(c.created_at).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditor(c._id)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(c._id)}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">
                  {total} contacto(s) en total
                </span>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={listPage <= 0}
                    onClick={() => setListPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-500">
                    Página {listPage + 1} de {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={listPage + 1 >= totalPages}
                    onClick={() => setListPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            {search || groupFilter !== "all" || tagFilter !== "all" || statusFilter !== "all" || sourceFilter !== "all"
              ? "No se encontraron contactos con estos filtros"
              : "No hay contactos aún. Creá tu primer contacto o importá desde CSV."}
          </CardContent>
        </Card>
      )}

      {/* Mutation feedback */}
      {deleteMutation.isSuccess && (
        <p className="text-sm text-green-600">Contacto eliminado</p>
      )}
      {deleteMutation.isError && (
        <p className="text-sm text-red-600">Error: {deleteMutation.error?.message}</p>
      )}

      {/* Contact editor dialog */}
      <ContactEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        contactId={editingId}
        onSaved={() => setEditorOpen(false)}
      />

      {/* Bulk actions bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onDone={() => setSelectedIds([])}
      />
    </div>
  )
}

// ============================================================
// GROUPS TAB
// ============================================================

function GroupsTab() {
  const { data, isLoading } = useContactGroupList()
  const deleteMutation = useDeleteContactGroup()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)

  const groups = data?.groups ?? []

  const openEditor = (id?: string) => {
    setEditingGroupId(id ?? null)
    setEditorOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Eliminar el grupo "${name}"? Los contactos no se eliminan, solo la referencia al grupo.`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{groups.length} grupo(s)</p>
        <Button onClick={() => openEditor()}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo Grupo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <Card key={g._id} className="relative">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {g.color && (
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: g.color }}
                      />
                    )}
                    <h3 className="font-medium text-gray-900">{g.name}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditor(g._id)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(g._id, g.name)}
                      >
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {g.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{g.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>{g.contact_count} contacto(s)</span>
                  <span>{new Date(g.created_at).toLocaleDateString("es-AR")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No hay grupos aún. Creá tu primer grupo para organizar contactos.
          </CardContent>
        </Card>
      )}

      {deleteMutation.isSuccess && (
        <p className="text-sm text-green-600">Grupo eliminado</p>
      )}
      {deleteMutation.isError && (
        <p className="text-sm text-red-600">Error: {deleteMutation.error?.message}</p>
      )}

      <GroupEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        groupId={editingGroupId}
        onSaved={() => setEditorOpen(false)}
      />
    </div>
  )
}

// ============================================================
// IMPORT TAB
// ============================================================

function ImportTab() {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [medusaGroups, setMedusaGroups] = useState<string[]>([])
  const [medusaTags, setMedusaTags] = useState<string[]>([])
  const [medusaTagInput, setMedusaTagInput] = useState("")
  const { data: historyData, isLoading: historyLoading, isError: historyError } = useImportHistory()
  const { data: groupsData } = useContactGroupList()
  const medusaImport = useImportMedusa()

  const imports = historyData?.imports ?? []
  const groups = groupsData?.groups ?? []

  const toggleMedusaGroup = (groupId: string) => {
    setMedusaGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    )
  }

  const addMedusaTag = (tag: string) => {
    const t = tag.trim().toLowerCase()
    if (t && !medusaTags.includes(t)) setMedusaTags([...medusaTags, t])
    setMedusaTagInput("")
  }

  const handleMedusaImport = () => {
    if (window.confirm("¿Importar todos los clientes desde Medusa?")) {
      medusaImport.mutate({
        group_ids: medusaGroups.length > 0 ? medusaGroups : undefined,
        tags: medusaTags.length > 0 ? medusaTags : undefined,
      }, {
        onSuccess: () => {
          setMedusaGroups([])
          setMedusaTags([])
          setMedusaTagInput("")
        },
      })
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Completado</Badge>
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Procesando</Badge>
      case "failed":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Import options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CSV Import Card */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Importar desde CSV</h3>
                <p className="text-xs text-gray-500">Subí un archivo CSV con tus contactos</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Columnas soportadas: email, nombre, apellido, teléfono, empresa y más.
              Las columnas extra se guardan como campos personalizados.
            </p>
            <Button onClick={() => setImportDialogOpen(true)} className="w-full">
              <Upload className="w-4 h-4 mr-2" /> Importar CSV
            </Button>
          </CardContent>
        </Card>

        {/* Medusa Import Card */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Importar desde Medusa</h3>
                <p className="text-xs text-gray-500">Sincronizá clientes de tu tienda</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Importa todos los clientes registrados en Medusa. Los existentes se actualizan automáticamente.
            </p>

            {/* Medusa group selection */}
            {groups.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600 mb-1.5">Asignar a grupos (opcional)</p>
                <div className="flex flex-wrap gap-1.5">
                  {groups.map((g) => (
                    <button
                      key={g._id}
                      type="button"
                      onClick={() => toggleMedusaGroup(g._id)}
                      className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                        medusaGroups.includes(g._id)
                          ? "bg-purple-50 border-purple-300 text-purple-700"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Medusa tags */}
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-600 mb-1.5">Tags (opcional)</p>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {medusaTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                    {tag}
                    <button type="button" onClick={() => setMedusaTags(medusaTags.filter((t) => t !== tag))}>
                      <span className="text-xs">&times;</span>
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                value={medusaTagInput}
                onChange={(e) => setMedusaTagInput(e.target.value)}
                placeholder="Agregar tag y presionar Enter"
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addMedusaTag(medusaTagInput)
                  }
                }}
              />
            </div>

            <Button
              onClick={handleMedusaImport}
              variant="outline"
              className="w-full"
              disabled={medusaImport.isPending}
            >
              <Database className="w-4 h-4 mr-2" />
              {medusaImport.isPending ? "Importando..." : "Importar desde Medusa"}
            </Button>
            {medusaImport.isSuccess && (
              <p className="text-xs text-green-600 mt-2">Importación iniciada</p>
            )}
            {medusaImport.isError && (
              <p className="text-xs text-red-600 mt-2">{medusaImport.error?.message}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Import history */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Historial de Importaciones</h3>
        {historyLoading ? (
          <Skeleton className="h-[200px]" />
        ) : historyError ? (
          <Card>
            <CardContent className="py-6 text-center text-gray-400 text-sm">
              No se pudo cargar el historial de importaciones
            </CardContent>
          </Card>
        ) : imports.length > 0 ? (
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origen</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Archivo</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Importados</TableHead>
                    <TableHead className="text-right">Actualizados</TableHead>
                    <TableHead className="text-right">Omitidos</TableHead>
                    <TableHead className="text-right">Errores</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((imp) => (
                    <TableRow key={imp._id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {imp.source === "csv" ? "CSV" : "Medusa"}
                        </Badge>
                      </TableCell>
                      <TableCell>{statusBadge(imp.status)}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">
                        {imp.filename || "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm">{imp.total_rows}</TableCell>
                      <TableCell className="text-right text-sm text-green-600 font-medium">
                        {imp.imported}
                      </TableCell>
                      <TableCell className="text-right text-sm text-blue-600">
                        {imp.updated}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-400">
                        {imp.skipped}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {(imp.errors?.length ?? 0) > 0 ? (
                          <span className="text-red-600 font-medium">{imp.errors.length}</span>
                        ) : (
                          "0"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(imp.created_at).toLocaleDateString("es-AR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-6 text-center text-gray-500 text-sm">
              No hay importaciones registradas
            </CardContent>
          </Card>
        )}
      </div>

      {/* CSV import dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  )
}
