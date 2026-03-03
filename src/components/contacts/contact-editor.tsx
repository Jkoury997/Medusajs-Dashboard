"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  useCreateContact,
  useUpdateContact,
  useContactDetail,
  useContactGroupList,
  useContactTags,
} from "@/hooks/use-contacts"
import { Plus, X, ChevronDown } from "lucide-react"

interface ContactEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId?: string | null
  onSaved?: () => void
}

export function ContactEditor({ open, onOpenChange, contactId, onSaved }: ContactEditorProps) {
  // Basic fields
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [notes, setNotes] = useState("")
  const [subscribed, setSubscribed] = useState(true)

  // Address
  const [showAddress, setShowAddress] = useState(false)
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [addrState, setAddrState] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [country, setCountry] = useState("")

  // Groups
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  // Tags
  const [contactTags, setContactTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  // Custom fields
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([])

  const { data: existing } = useContactDetail(contactId ?? null)
  const { data: groupsData } = useContactGroupList()
  const { data: tagsData } = useContactTags()
  const createMutation = useCreateContact()
  const updateMutation = useUpdateContact()

  const isEditing = !!contactId
  const saving = createMutation.isPending || updateMutation.isPending
  const groups = groupsData?.groups ?? []
  const existingTags = tagsData?.tags ?? []

  // Filter tag suggestions
  const tagSuggestions = tagInput.length > 0
    ? existingTags.filter(
        (t) => t.toLowerCase().includes(tagInput.toLowerCase()) && !contactTags.includes(t)
      )
    : []

  useEffect(() => {
    if (open && existing && isEditing) {
      setEmail(existing.email)
      setFirstName(existing.first_name || "")
      setLastName(existing.last_name || "")
      setPhone(existing.phone || "")
      setCompany(existing.company || "")
      setNotes(existing.notes || "")
      setSubscribed(existing.subscription_status === "subscribed")
      setSelectedGroups(existing.groups || [])
      setContactTags(existing.tags || [])
      if (existing.address) {
        setShowAddress(true)
        setStreet(existing.address.street || "")
        setCity(existing.address.city || "")
        setAddrState(existing.address.state || "")
        setPostalCode(existing.address.postal_code || "")
        setCountry(existing.address.country || "")
      } else {
        setShowAddress(false)
        setStreet(""); setCity(""); setAddrState(""); setPostalCode(""); setCountry("")
      }
      const cf = existing.custom_fields || {}
      setCustomFields(Object.entries(cf).map(([key, value]) => ({ key, value })))
    } else if (open && !isEditing) {
      setEmail(""); setFirstName(""); setLastName(""); setPhone("")
      setCompany(""); setNotes(""); setSubscribed(true)
      setSelectedGroups([]); setContactTags([]); setTagInput("")
      setShowAddress(false)
      setStreet(""); setCity(""); setAddrState(""); setPostalCode(""); setCountry("")
      setCustomFields([])
    }
  }, [open, existing, isEditing])

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase()
    if (t && !contactTags.includes(t)) {
      setContactTags([...contactTags, t])
    }
    setTagInput("")
  }

  const removeTag = (tag: string) => {
    setContactTags(contactTags.filter((t) => t !== tag))
  }

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    )
  }

  const addCustomField = () => {
    setCustomFields([...customFields, { key: "", value: "" }])
  }

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const updateCustomField = (index: number, field: "key" | "value", val: string) => {
    setCustomFields(customFields.map((cf, i) => (i === index ? { ...cf, [field]: val } : cf)))
  }

  const handleSave = async () => {
    if (!email.trim()) return

    const address =
      showAddress && (street || city || addrState || postalCode || country)
        ? { street: street || null, city: city || null, state: addrState || null, postal_code: postalCode || null, country: country || null }
        : null

    const cfRecord: Record<string, string> = {}
    for (const cf of customFields) {
      if (cf.key.trim()) cfRecord[cf.key.trim()] = cf.value
    }

    try {
      if (isEditing && contactId) {
        await updateMutation.mutateAsync({
          id: contactId,
          data: {
            first_name: firstName || null,
            last_name: lastName || null,
            phone: phone || null,
            company: company || null,
            address,
            notes: notes || null,
            tags: contactTags,
            custom_fields: Object.keys(cfRecord).length > 0 ? cfRecord : undefined,
            groups: selectedGroups,
            subscription_status: subscribed ? "subscribed" : "unsubscribed",
          },
        })
      } else {
        await createMutation.mutateAsync({
          email: email.trim().toLowerCase(),
          first_name: firstName || null,
          last_name: lastName || null,
          phone: phone || null,
          company: company || null,
          address,
          notes: notes || null,
          tags: contactTags,
          custom_fields: Object.keys(cfRecord).length > 0 ? cfRecord : undefined,
          groups: selectedGroups,
          source: "manual",
          subscription_status: subscribed ? "subscribed" : "unsubscribed",
        })
      }
      onSaved?.()
      onOpenChange(false)
    } catch {
      // error handled by mutation state
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Contacto" : "Nuevo Contacto"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Email */}
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@email.com"
              disabled={isEditing}
            />
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Apellido</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          {/* Phone & Company */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>

          {/* Address (collapsible) */}
          <div>
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
              onClick={() => setShowAddress(!showAddress)}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showAddress ? "rotate-180" : ""}`} />
              Dirección
            </button>
            {showAddress && (
              <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-200">
                <div className="space-y-1.5">
                  <Label>Calle</Label>
                  <Input value={street} onChange={(e) => setStreet(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Ciudad</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Provincia</Label>
                    <Input value={addrState} onChange={(e) => setAddrState(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Código Postal</Label>
                    <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>País</Label>
                    <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Groups */}
          <div className="space-y-1.5">
            <Label>Grupos</Label>
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <button
                  key={g._id}
                  type="button"
                  onClick={() => toggleGroup(g._id)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    selectedGroups.includes(g._id)
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {g.color && (
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: g.color }}
                    />
                  )}
                  {g.name}
                </button>
              ))}
              {groups.length === 0 && (
                <span className="text-xs text-gray-400">No hay grupos creados</span>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {contactTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="relative">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Agregar tag..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag(tagInput)
                  }
                }}
              />
              {tagSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg max-h-32 overflow-y-auto">
                  {tagSuggestions.slice(0, 8).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50"
                      onClick={() => addTag(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas internas..."
              rows={2}
            />
          </div>

          {/* Custom fields */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Campos personalizados</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                <Plus className="w-3 h-3 mr-1" /> Agregar
              </Button>
            </div>
            {customFields.map((cf, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  className="flex-1"
                  placeholder="Clave"
                  value={cf.key}
                  onChange={(e) => updateCustomField(i, "key", e.target.value)}
                />
                <Input
                  className="flex-1"
                  placeholder="Valor"
                  value={cf.value}
                  onChange={(e) => updateCustomField(i, "value", e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCustomField(i)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Subscription */}
          <div className="flex items-center justify-between">
            <Label>Suscrito a emails</Label>
            <Switch checked={subscribed} onCheckedChange={setSubscribed} />
          </div>
        </div>

        {(createMutation.isError || updateMutation.isError) && (
          <p className="text-sm text-red-600">
            {createMutation.error?.message || updateMutation.error?.message}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !email.trim()}>
            {saving ? "Guardando..." : isEditing ? "Guardar" : "Crear Contacto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
