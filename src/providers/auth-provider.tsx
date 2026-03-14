"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import { login as authLogin, logout as authLogout, isLoggedIn, isTokenExpired } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// Intervalo de verificación de token expirado (60 segundos)
const TOKEN_CHECK_INTERVAL = 60_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const logoutCalledRef = useRef(false)

  const logout = useCallback(async () => {
    // Evitar múltiples logouts simultáneos
    if (logoutCalledRef.current) return
    logoutCalledRef.current = true
    try {
      await authLogout()
    } finally {
      setIsAuthenticated(false)
      router.push("/login")
      logoutCalledRef.current = false
    }
  }, [router])

  useEffect(() => {
    setIsAuthenticated(isLoggedIn())
    setIsLoading(false)
  }, [])

  // Verificar periódicamente si el token expiró + al volver a la pestaña
  useEffect(() => {
    if (!isAuthenticated) return

    const checkToken = () => {
      if (isTokenExpired()) {
        logout()
      }
    }

    // Verificar inmediatamente
    checkToken()

    const interval = setInterval(checkToken, TOKEN_CHECK_INTERVAL)

    // También verificar cuando el usuario vuelve a la pestaña
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkToken()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isAuthenticated, logout])

  const login = useCallback(async (email: string, password: string) => {
    await authLogin(email, password)
    setIsAuthenticated(true)
    router.push("/dashboard")
  }, [router])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
