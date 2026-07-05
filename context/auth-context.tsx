"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"

export interface User {
  id: string
  email: string
  name: string
  profession: string
  avatar: string
  role?: string
  verified?: boolean
  bio?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  signup: (email: string, password: string, name: string, profession: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("auth_token")
      const storedUser = localStorage.getItem("auth_user")
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch (err) {
      console.error("Failed to initialize auth state:", err)
    }
  }, [])

  const signup = async (
    email: string,
    password: string,
    name: string,
    profession: string
  ) => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, profession }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Signup failed")
      }

      const data = await response.json()
      setUser(data.user)
      setToken(data.token)
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("auth_user", JSON.stringify(data.user))
      // Notify all contexts to reload data for new user
      window.dispatchEvent(new CustomEvent("auth-change", { detail: { userId: data.user.id } }))
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Login failed")
      }

      const data = await response.json()
      setUser(data.user)
      setToken(data.token)
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("auth_user", JSON.stringify(data.user))
      // Notify all contexts to reload data for new user
      window.dispatchEvent(new CustomEvent("auth-change", { detail: { userId: data.user.id } }))
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    // Notify all contexts to clear user data
    window.dispatchEvent(new CustomEvent("auth-change", { detail: { userId: null } }))
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
