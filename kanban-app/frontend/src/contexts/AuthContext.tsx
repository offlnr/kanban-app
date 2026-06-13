import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import api from '../services/api'

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (token: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    api.get<User>('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => {
        setToken(null)
        localStorage.removeItem('token')
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    const { data } = await api.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${newToken}` },
    })
    setUser(data)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updated: User) => setUser(updated)

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
