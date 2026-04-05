import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  api,
  clearStoredTokens,
  getStoredRefresh,
  getStoredToken,
  setStoredTokens,
} from '../api/client'
import { AuthContext } from './auth-context'

function normalizeUser(raw) {
  if (!raw) return null
  return {
    id: raw.id || raw._id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    status: raw.status,
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const logout = useCallback(async () => {
    const refreshToken = getStoredRefresh()
    try {
      if (getStoredToken()) {
        await api('/auth/logout', {
          method: 'POST',
          json: refreshToken ? { refreshToken } : {},
        })
      }
    } catch {
      /* still clear locally */
    }
    clearStoredTokens()
    setUser(null)
  }, [])

  const refreshSession = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setUser(null)
      setReady(true)
      return
    }
    try {
      const res = await api('/auth/me')
      setUser(normalizeUser(res.data))
    } catch {
      clearStoredTokens()
      setUser(null)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const login = useCallback(async (email, password) => {
    const res = await api('/auth/login', {
      method: 'POST',
      json: { email, password },
    })
    const { token, refreshToken, user: u } = res.data
    setStoredTokens(token, refreshToken)
    setUser(normalizeUser(u))
    return res
  }, [])

  const register = useCallback(async (name, email, password) => {
    const res = await api('/auth/register', {
      method: 'POST',
      json: { name, email, password },
    })
    const { token, refreshToken, user: u } = res.data
    setStoredTokens(token, refreshToken)
    setUser(normalizeUser(u))
    return res
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, ready, login, register, logout, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
