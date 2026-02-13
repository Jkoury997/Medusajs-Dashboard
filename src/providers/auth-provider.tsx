"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { login as authLogin, logout as authLogout, isLoggedIn } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setIsAuthenticated(isLoggedIn())
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await authLogin(email, password)
    setIsAuthenticated(true)
    router.push("/dashboard")
  }, [router])

  const logout = useCallback(async () => {
    await authLogout()
    setIsAuthenticated(false)
    router.push("/login")
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
