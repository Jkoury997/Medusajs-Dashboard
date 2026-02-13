import Medusa from "@medusajs/js-sdk"

// En el browser usamos el proxy de Next.js (/medusa) para evitar CORS.
// El SDK requiere una URL absoluta (usa `new URL(path, baseUrl)` internamente).
// En server-side (API routes) usamos la URL directa del backend.
const backendUrl =
  typeof window !== "undefined"
    ? `${window.location.origin}/medusa`
    : process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!

export const sdk = new Medusa({
  baseUrl: backendUrl,
  auth: {
    type: "jwt",
  },
})
