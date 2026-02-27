"use client"

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
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getWhatsAppUrl, getWhatsAppMessageType } from "@/lib/whatsapp"

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

function ChurnBadge({ days }: { days: number | null }) {
  if (days === null) return <Badge variant="outline">Sin compras</Badge>
  if (days <= 30)
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{days}d</Badge>
  if (days <= 60)
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{days}d</Badge>
  if (days <= 90)
    return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{days}d</Badge>
  return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{days}d</Badge>
}

function SortHeader({
  label,
  field,
  sortBy,
  sortDir,
  onSort,
}: {
  label: string
  field: string
  sortBy: string
  sortDir: "asc" | "desc"
  onSort: (field: string) => void
}) {
  return (
    <TableHead
      className="cursor-pointer select-none hover:bg-gray-50"
      onClick={() => onSort(field)}
    >
      {label}
      {sortBy === field && (
        <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
      )}
    </TableHead>
  )
}

export function CustomerTable({
  customers,
  sortBy,
  sortDir,
  onSort,
}: CustomerTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Grupo</TableHead>
            <SortHeader label="Órdenes" field="orderCount" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Total Gastado" field="totalSpent" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Ticket Prom." field="avgOrderValue" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortHeader label="Última Compra" field="daysSinceLastOrder" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <TableHead>Riesgo</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                No se encontraron clientes con los filtros seleccionados
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow key={customer.id} className="hover:bg-gray-50">
                <TableCell>
                  <Link
                    href={`/dashboard/customers/${customer.id}`}
                    className="hover:underline"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {customer.first_name} {customer.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {customer.phone || "-"}
                </TableCell>
                <TableCell>
                  {customer.metadata?.customer_group_resolved ? (
                    <Badge variant="secondary" className="text-xs">
                      {customer.metadata.customer_group_resolved.charAt(0).toUpperCase() +
                        customer.metadata.customer_group_resolved.slice(1)}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">{customer.orderCount}</TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(customer.totalSpent)}
                </TableCell>
                <TableCell>{formatCurrency(customer.avgOrderValue)}</TableCell>
                <TableCell>
                  {customer.lastOrderDate
                    ? formatDate(customer.lastOrderDate)
                    : "-"}
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
                      className="text-green-600 hover:text-green-700"
                      title={`WhatsApp: ${getWhatsAppMessageType(customer.orderCount, customer.daysSinceLastOrder)}`}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                  ) : (
                    <span className="text-gray-300 text-xs">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
