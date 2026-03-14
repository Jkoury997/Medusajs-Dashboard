import { sdk } from "./medusa-sdk"

// El SDK de Medusa v2 guarda el JWT en localStorage con esta key
// (ver node_modules/@medusajs/js-sdk/dist/client.js → DEFAULT_JWT_STORAGE_KEY)
const SDK_JWT_KEY = "medusa_auth_token"

export async function login(email: string, password: string): Promise<string> {
  // sdk.auth.login llama POST /auth/user/emailpass
  // y automáticamente almacena el token via client.setToken()
  const result = await sdk.auth.login("user", "emailpass", {
    email,
    password,
  })

  if (typeof result !== "string") {
    // Esto pasa con auth de terceros (Google, etc.) - no aplica para emailpass
    throw new Error("Se requiere autenticación adicional")
  }

  return result
}

export async function logout() {
  try {
    await sdk.auth.logout()
  } catch {
    // Si falla el logout remoto, igual limpiamos local
    await sdk.client.clearToken()
  }
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false
  return !!window.localStorage.getItem(SDK_JWT_KEY)
}

/**
 * Decodifica el payload de un JWT sin verificar la firma.
 * Devuelve null si el token es inválido o no se puede parsear.
 */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
    return payload
  } catch {
    return null
  }
}

/**
 * Verifica si el token JWT almacenado está expirado.
 * Devuelve true si el token no existe, es inválido, o está expirado.
 */
export function isTokenExpired(): boolean {
  if (typeof window === "undefined") return false
  const token = window.localStorage.getItem(SDK_JWT_KEY)
  if (!token) return true
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false // Sin expiración → asumir válido
  return Date.now() >= payload.exp * 1000
}
