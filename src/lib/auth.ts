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
