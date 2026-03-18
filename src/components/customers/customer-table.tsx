"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getWhatsAppUrl, getWhatsAppMessageType } from "@/lib/whatsapp"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react"

interface CustomerWithMetrics {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  metadata?: { customer_group?: string; customer_group_resolved?: string; [key: string]: any }
  orderCount: number
  totalSpent: number
  avgOrderValue: number
  lastOrderDate: string | null
  daysSinceLastOrder: number | null
}

interface CustomerTableProps {
  customers: CustomerWithMetrics[]
  sortBy: string
  sortDir: "asc" | "desc"
  onSort: (field: string) => void
}

const PAGE_SIZE = 25

function ChurnBadge({ days }: { days: number | null }) {
  if (days === null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        Sin compras
      </span>
    )
  }

  const config =
    days <= 30
      ? { label: "Activo", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" }
      : days <= 60
      ? { label: "Alerta", bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" }
      : days <= 90
      ? { label: "Riesgo", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" }
      : { label: "Crítico", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" }

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", config.bg, config.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {days}d
    </span>
  )
}

function SortHeader({
  label,
  field,
  sortBy,
  sortDir,
  onSort,
  className,
}: {
  label: string
  field: string
  sortBy: string
  sortDir: "asc" | "desc"
  onSort: (field: string) => void
  className?: string
}) {
  const isActive = sortBy === field
  return (
    <TableHead
      className={cn("cursor-pointer select-none hover:bg-gray-50 transition-colors", className)}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          sortDir === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5 text-mk-pink" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-mk-pink" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-gray-300" />
        )}
      </div>
    </TableHead>
  )
}

export function CustomerTable({
  customers,
  sortBy,
  sortDir,
  onSort,
}: CustomerTableProps) {
  const [page, setPage] = useState(0)

  // Reset page when data changes
  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const paginatedCustomers = useMemo(
    () => customers.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [customers, currentPage]
  )

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="min-w-[200px]">Cliente</TableHead>
              <TableHead>Grupo</TableHead>
              <SortHeader label="Órdenes" field="orderCount" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Total Gastado" field="totalSpent" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Ticket Prom." field="avgOrderValue" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Última Compra" field="daysSinceLastOrder" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center text-gray-400">
                    <svg className="w-12 h-12 mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <p className="text-sm font-medium">No se encontraron clientes</p>
                    <p className="text-xs mt-1">Probá ajustando los filtros</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="group flex items-center gap-3"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-mk-pink-light flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-mk-pink">
                          {(customer.first_name?.[0] || customer.email[0]).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 group-hover:text-mk-pink transition-colors truncate">
                          {customer.first_name} {customer.last_name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{customer.email}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    {customer.metadata?.customer_group_resolved ? (
                      <Badge variant="secondary" className="text-xs font-medium">
                        {customer.metadata.customer_group_resolved.charAt(0).toUpperCase() +
                          customer.metadata.customer_group_resolved.slice(1)}
                      </Badge>
                    ) : (
                      <span className="text-gray-300 text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-gray-900">{customer.orderCount}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(customer.totalSpent)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatCurrency(customer.avgOrderValue)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : "-"}
                  </TableCell>
                  <TableCell>
                    <ChurnBadge days={customer.daysSinceLastOrder} />
                  </TableCell>
                  <TableCell>
                    {customer.phone ? (
                      <a
                        href={getWhatsAppUrl({
                          phone: customer.phone,
                          firstName: customer.first_name || "",
                          orderCount: customer.orderCount,
                          daysSinceLastOrder: customer.daysSinceLastOrder,
                          totalSpent: customer.totalSpent,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-500 hover:text-green-600 transition-colors"
                        title={`WhatsApp: ${getWhatsAppMessageType(customer.orderCount, customer.daysSinceLastOrder)}`}
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {customers.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, customers.length)} de {customers.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 0}
              onClick={() => setPage(0)}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 text-sm font-medium text-gray-700">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
