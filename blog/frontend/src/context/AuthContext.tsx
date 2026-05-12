import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import api from '../lib/api'
import type { AuthResponse, User } from '../types'

const AUTH_STORAGE_KEY = 'blog_auth'
const TOKEN_STORAGE_KEY = 'blog_token'

type LoginPayload = {
  password: string
  username: string
}

type RegisterPayload = {
  email: string
  password: string
  username: string
}

type AuthContextValue = {
  isAuthenticated: boolean
  isReady: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
  register: (payload: RegisterPayload) => Promise<void>
  token: string | null
  user: User | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function persistAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
}

function clearPersistedAuth() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

function getStoredUser() {
  const rawUser = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as User
  } catch {
    clearPersistedAuth()
    return null
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    const storedUser = getStoredUser()

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(storedUser)
    } else {
      clearPersistedAuth()
    }

    setIsReady(true)
  }, [])

  const login = async (payload: LoginPayload) => {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)

    if (!data.token) {
      throw new Error('登录返回缺少 token')
    }

    persistAuth(data.token, data.user)
    setToken(data.token)
    setUser(data.user)
  }

  const register = async (payload: RegisterPayload) => {
    await api.post<AuthResponse>('/auth/register', payload)
    await login({ username: payload.username, password: payload.password })
  }

  const logout = () => {
    clearPersistedAuth()
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      isReady,
      login,
      logout,
      register,
      token,
      user,
    }),
    [isReady, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内使用')
  }

  return context
}

export { AuthProvider, useAuth }