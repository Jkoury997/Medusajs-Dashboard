/**
 * Cliente unificado para el Events Backend.
 * Todos los requests pasan por /api/events-proxy/* (que reenvía X-API-Key).
 */

const PROXY_BASE = "/api/events-proxy"

class EventsBackendError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "EventsBackendError"
    this.status = status
  }
}

async function handle<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new EventsBackendError(res.status, body?.error || `${label}: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function eventsGet<T>(
  path: string,
  query?: Record<string, string | number | undefined>
): Promise<T> {
  const params = new URLSearchParams()
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v))
    }
  }
  const qs = params.toString()
  const url = `${PROXY_BASE}/${path}${qs ? `?${qs}` : ""}`
  const res = await fetch(url)
  return handle<T>(res, `GET ${path}`)
}

export async function eventsPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${PROXY_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  })
  return handle<T>(res, `POST ${path}`)
}

export { EventsBackendError }
