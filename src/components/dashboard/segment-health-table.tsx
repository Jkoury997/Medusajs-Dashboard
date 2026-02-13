"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatNumber } from "@/lib/format"

interface SegmentHealthRow {
  group: string
  customers: number
  withOrders: number
  repeat: number
  atRisk: number
  totalRevenue: number
  avgLtv: number
  periodRevenue: number
  retentionRate: string
  riskRate: string
}

interface SegmentHealthTableProps {
  data: SegmentHealthRow[]
}

export function SegmentHealthTable({ data }: SegmentHealthTableProps) {
  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          👥 Salud por Segmento de Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segmento</TableHead>
                <TableHead className="text-right">Clientes</TableHead>
                <TableHead className="text-right">Recurrentes</TableHead>
                <TableHead className="text-right">En Riesgo</TableHead>
                <TableHead className="text-right">LTV Prom.</TableHead>
                <TableHead className="text-right">Ingreso Período</TableHead>
                <TableHead className="text-right">Retención</TableHead>
                <TableHead className="text-right">Riesgo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => {
                const riskVal = parseFloat(row.riskRate)
                const riskColor = riskVal > 25
                  ? "text-red-600 font-bold"
                  : riskVal > 10
                  ? "text-yellow-600 font-medium"
                  : "text-green-600"

                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.group}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.customers)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.repeat)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.atRisk)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.avgLtv)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.periodRevenue)}</TableCell>
                    <TableCell className="text-right">{row.retentionRate}</TableCell>
                    <TableCell className={`text-right ${riskColor}`}>{row.riskRate}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
