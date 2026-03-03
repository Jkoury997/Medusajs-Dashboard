"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useBulkDeleteContacts,
  useBulkAddToGroup,
  useBulkRemoveFromGroup,
  useBulkAddTags,
  useBulkRemoveTags,
  useBulkUpdateSubscription,
  useContactGroupList,
} from "@/hooks/use-contacts"
import { Trash2, UserPlus, UserMinus, TagIcon, Bell, X } from "lucide-react"

type BulkAction = "add-group" | "remove-group" | "add-tags" | "remove-tags" | "subscription" | null

interface BulkActionsBarProps {
  selectedIds: string[]
  onClearSelection: () => void
  onDone?: () => void
}

export function BulkActionsBar({ selectedIds, onClearSelection, onDone }: BulkActionsBarProps) {
  const [activeAction, setActiveAction] = useState<BulkAction>(null)
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [bulkTags, setBulkTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [subscriptionStatus, setSubscriptionStatus] = useState<"subscribed" | "unsubscribed">("subscribed")

  const { data: groupsData } = useContactGroupList()
  const groups = groupsData?.groups ?? []

  const bulkDelete = useBulkDeleteContacts()
  const bulkAddGroup = useBulkAddToGroup()
  const bulkRemoveGroup = useBulkRemoveFromGroup()
  const bulkAddTags = useBulkAddTags()
  const bulkRemoveTags = useBulkRemoveTags()
  const bulkSubscription = useBulkUpdateSubscription()

  const isPending =
    bulkDelete.isPending || bulkAddGroup.isPending || bulkRemoveGroup.isPending ||
    bulkAddTags.isPending || bulkRemoveTags.isPending || bulkSubscription.isPending

  if (selectedIds.length === 0) return null

  const handleBulkDelete = () => {
    if (window.confirm(`¿Eliminar ${selectedIds.length} contacto(s)? Esta acción no se puede deshacer.`)) {
      bulkDelete.mutate(selectedIds, {
        onSuccess: () => { onClearSelection(); onDone?.() },
      })
    }
  }

  const handleConfirmAction = () => {
    if (activeAction === "add-group" && selectedGroupId) {
      bulkAddGroup.mutate({ contact_ids: selectedIds, group_id: selectedGroupId }, {
        onSuccess: () => { closeDialog(); onDone?.() },
      })
    } else if (activeAction === "remove-group" && selectedGroupId) {
      bulkRemoveGroup.mutate({ contact_ids: selectedIds, group_id: selectedGroupId }, {
        onSuccess: () => { closeDialog(); onDone?.() },
      })
    } else if (activeAction === "add-tags" && bulkTags.length > 0) {
      bulkAddTags.mutate({ contact_ids: selectedIds, tags: bulkTags }, {
        onSuccess: () => { closeDialog(); onDone?.() },
      })
    } else if (activeAction === "remove-tags" && bulkTags.length > 0) {
      bulkRemoveTags.mutate({ contact_ids: selectedIds, tags: bulkTags }, {
        onSuccess: () => { closeDialog(); onDone?.() },
      })
    } else if (activeAction === "subscription") {
      bulkSubscription.mutate({ contact_ids: selectedIds, status: subscriptionStatus }, {
        onSuccess: () => { closeDialog(); onDone?.() },
      })
    }
  }

  const closeDialog = () => {
    setActiveAction(null)
    setSelectedGroupId("")
    setBulkTags([])
    setTagInput("")
  }

  const addBulkTag = (tag: string) => {
    const t = tag.trim().toLowerCase()
    if (t && !bulkTags.includes(t)) setBulkTags([...bulkTags, t])
    setTagInput("")
  }

  const dialogTitle = {
    "add-group": "Agregar a Grupo",
    "remove-group": "Quitar de Grupo",
    "add-tags": "Agregar Tags",
    "remove-tags": "Quitar Tags",
    "subscription": "Cambiar Suscripción",
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border shadow-xl rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">
          {selectedIds.length} seleccionado(s)
        </span>

        <div className="h-5 w-px bg-gray-200" />

        <Button size="sm" variant="outline" onClick={() => setActiveAction("add-group")}>
          <UserPlus className="w-3.5 h-3.5 mr-1" /> Agregar a grupo
        </Button>
        <Button size="sm" variant="outline" onClick={() => setActiveAction("remove-group")}>
          <UserMinus className="w-3.5 h-3.5 mr-1" /> Quitar de grupo
        </Button>
        <Button size="sm" variant="outline" onClick={() => setActiveAction("add-tags")}>
          <TagIcon className="w-3.5 h-3.5 mr-1" /> Tags
        </Button>
        <Button size="sm" variant="outline" onClick={() => setActiveAction("subscription")}>
          <Bell className="w-3.5 h-3.5 mr-1" /> Suscripción
        </Button>
        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={handleBulkDelete}>
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
        </Button>

        <div className="h-5 w-px bg-gray-200" />

        <Button size="sm" variant="outline" onClick={onClearSelection}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Bulk action dialog */}
      <Dialog open={!!activeAction} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{activeAction && dialogTitle[activeAction]}</DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <p className="text-sm text-gray-500">
              Se aplicará a {selectedIds.length} contacto(s)
            </p>

            {(activeAction === "add-group" || activeAction === "remove-group") && (
              <div className="space-y-1.5">
                <Label>Grupo</Label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(activeAction === "add-tags" || activeAction === "remove-tags") && (
              <div className="space-y-1.5">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {bulkTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button type="button" onClick={() => setBulkTags(bulkTags.filter((t) => t !== tag))}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Agregar tag y presionar Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addBulkTag(tagInput)
                    }
                  }}
                />
              </div>
            )}

            {activeAction === "subscription" && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={subscriptionStatus}
                  onValueChange={(v) => setSubscriptionStatus(v as "subscribed" | "unsubscribed")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscribed">Suscrito</SelectItem>
                    <SelectItem value="unsubscribed">Desuscrito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleConfirmAction} disabled={isPending}>
              {isPending ? "Aplicando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
