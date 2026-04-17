"use client"

import Link from "next/link"

import { Header } from "@/components/dashboard/header"
import { Badge } from "@/components/ui/badge"
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
import { useLiveSessions } from "@/hooks/use-sessions"

export default function LivePage() {
  const { data, isLoading } = useLiveSessions()

  return (
    <div>
      <Header
        description="Sesiones activas en los últimos 5 minutos (refresca cada 10s)"
        title="En vivo"
      />
      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <span className="text-lg font-semibold">{data?.count ?? 0}</span>
            <span className="text-sm text-gray-500">usuarios activos ahora</span>
          </CardContent>
        </Card>

        {isLoading ? (
          <Skeleton className="h-[400px]" />
        ) : data?.sessions.length ? (
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sesión</TableHead>
                    <TableHead>Última vista</TableHead>
                    <TableHead>Página actual</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead className="text-right">Vistas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sessions.map((s) => (
                    <TableRow key={s.session_id}>
                      <TableCell className="text-xs font-mono">
                        <Link
                          className="text-pink-600 hover:underline"
                          href={`/dashboard/analytics/sesiones/${encodeURIComponent(s.session_id)}`}
                        >
                          {s.session_id.slice(0, 10)}…
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(s.last_seen_at).toLocaleTimeString("es-AR")}
                      </TableCell>
                      <TableCell className="text-xs max-w-[240px] truncate">
                        {s.current_path ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.device_type ? <Badge variant="outline">{s.device_type}</Badge> : "-"}
                      </TableCell>
                      <TableCell className="text-xs">{s.country ?? "-"}</TableCell>
                      <TableCell className="text-right">{s.total_pageviews}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No hay usuarios activos en este momento.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
