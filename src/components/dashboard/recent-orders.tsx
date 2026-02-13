"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/format"
import { getPaymentStatusLabel } from "@/lib/aggregations"

interface RecentOrdersProps {
  orders: any[]
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  captured: "default",
  authorized: "secondary",
  not_paid: "outline",
  canceled: "destructive",
  refunded: "destructive",
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const recent = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  if (recent.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Últimas Órdenes</CardTitle>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" className="text-xs">
              Ver todas →
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  #{order.display_id}
                </TableCell>
                <TableCell className="text-xs">
                  {new Date(order.created_at).toLocaleDateString("es-AR")}
                </TableCell>
                <TableCell className="text-sm max-w-[150px] truncate">
                  {order.email || "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={STATUS_VARIANT[order.payment_status] || "outline"}
                    className="text-xs"
                  >
                    {getPaymentStatusLabel(order.payment_status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.total || 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
