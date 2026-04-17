"use client"

import { useMemo, useState } from "react"

import { Header } from "@/components/dashboard/header"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDevicesBreakdown } from "@/hooks/use-sessions"
import { formatNumber } from "@/lib/format"

export default function DispositivosPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const { data, isLoading } = useDevicesBreakdown(dateRange)

  const byDevice = useMemo(() => {
    if (!data?.devices) return []
    const map = new Map<string, number>()
    for (const d of data.devices) map.set(d.device_type, (map.get(d.device_type) ?? 0) + d.sessions)
    return Array.from(map.entries()).map(([k, v]) => ({ key: k, sessions: v })).sort((a, b) => b.sessions - a.sessions)
  }, [data])

  const byOs = useMemo(() => {
    if (!data?.devices) return []
    const map = new Map<string, number>()
    for (const d of data.devices) map.set(d.os, (map.get(d.os) ?? 0) + d.sessions)
    return Array.from(map.entries()).map(([k, v]) => ({ key: k, sessions: v })).sort((a, b) => b.sessions - a.sessions)
  }, [data])

  const byBrowser = useMemo(() => {
    if (!data?.devices) return []
    const map = new Map<string, number>()
    for (const d of data.devices) map.set(d.browser, (map.get(d.browser) ?? 0) + d.sessions)
    return Array.from(map.entries()).map(([k, v]) => ({ key: k, sessions: v })).sort((a, b) => b.sessions - a.sessions)
  }, [data])

  return (
    <div>
      <Header
        description="Breakdown de sesiones por device type, OS y browser"
        title="Dispositivos"
      />
      <div className="p-6 space-y-6">
        <DateRangePicker onChange={setDateRange} value={dateRange} />

        {isLoading ? (
          <Skeleton className="h-[400px]" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Dispositivo", rows: byDevice },
              { title: "Sistema operativo", rows: byOs },
              { title: "Browser", rows: byBrowser },
            ].map((block) => (
              <Card key={block.title}>
                <CardHeader>
                  <CardTitle className="text-base">{block.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="text-right">Sesiones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {block.rows.map((r) => (
                        <TableRow key={r.key}>
                          <TableCell>{r.key}</TableCell>
                          <TableCell className="text-right">{formatNumber(r.sessions)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
