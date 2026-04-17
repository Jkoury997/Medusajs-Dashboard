"use client"

import { useState } from "react"

import { Header } from "@/components/dashboard/header"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useUtmBreakdown } from "@/hooks/use-sessions"
import { formatCurrency, formatNumber } from "@/lib/format"

export default function UtmPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const { data, isLoading } = useUtmBreakdown(dateRange)

  return (
    <div>
      <Header
        description="Sesiones por source / medium / campaign con conversión y revenue atribuido"
        title="UTM Breakdown"
      />
      <div className="p-6 space-y-6">
        <DateRangePicker onChange={setDateRange} value={dateRange} />

        {isLoading ? (
          <Skeleton className="h-[400px]" />
        ) : (
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Medium</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead className="text-right">Sesiones</TableHead>
                    <TableHead className="text-right">Convertidas</TableHead>
                    <TableHead className="text-right">Conversion</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.utm.map((row, i) => (
                    <TableRow key={`${row.source}-${row.medium}-${row.campaign}-${i}`}>
                      <TableCell className="font-medium">{row.source}</TableCell>
                      <TableCell>{row.medium}</TableCell>
                      <TableCell className="max-w-[260px] truncate">{row.campaign}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.sessions)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.converted)}</TableCell>
                      <TableCell className="text-right">
                        {row.sessions > 0
                          ? `${((row.converted / row.sessions) * 100).toFixed(1)}%`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
