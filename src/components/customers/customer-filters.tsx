"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface CustomerFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  groups: string[]
  selectedGroup: string
  onGroupChange: (value: string) => void
  daysSinceFilter: string
  onDaysSinceChange: (value: string) => void
  orderCountFilter: string
  onOrderCountChange: (value: string) => void
  onReset: () => void
}

export function CustomerFilters({
  search,
  onSearchChange,
  groups,
  selectedGroup,
  onGroupChange,
  daysSinceFilter,
  onDaysSinceChange,
  orderCountFilter,
  onOrderCountChange,
  onReset,
}: CustomerFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Select value={selectedGroup} onValueChange={onGroupChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Grupo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los grupos</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group} value={group}>
              {group.charAt(0).toUpperCase() + group.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={daysSinceFilter} onValueChange={onDaysSinceChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Días sin comprar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="30">+30 días sin comprar</SelectItem>
          <SelectItem value="60">+60 días sin comprar</SelectItem>
          <SelectItem value="90">+90 días sin comprar</SelectItem>
          <SelectItem value="180">+180 días sin comprar</SelectItem>
        </SelectContent>
      </Select>

      <Select value={orderCountFilter} onValueChange={onOrderCountChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Nro. de compras" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="1">1 compra (nuevos)</SelectItem>
          <SelectItem value="2-5">2-5 compras</SelectItem>
          <SelectItem value="6+">6+ compras (fieles)</SelectItem>
          <SelectItem value="0">Sin compras</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" onClick={onReset}>
        Limpiar
      </Button>
    </div>
  )
}
