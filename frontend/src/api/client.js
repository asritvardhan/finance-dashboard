const TOKEN_KEY = 'fd_token'
const REFRESH_KEY = 'fd_refresh'

/** Deployed API (Render). Set VITE_API_URL to override; use empty string for relative /api + Vite dev proxy. */
const API_ORIGIN = (
  import.meta.env.VITE_API_URL ?? 'https://finance-dashboard-mj4u.onrender.com/api'
).replace(/\/$/, '')

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredRefresh() {
  return localStorage.getItem(REFRESH_KEY)
}

export function setStoredTokens(token, refreshToken) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
  else localStorage.removeItem(REFRESH_KEY)
}

export function clearStoredTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

/**
 * @param {string} path - e.g. '/auth/login'
 * @param {RequestInit & { json?: object }} options
 */
export async function api(path, options = {}) {
  const { json, headers: hdrs, ...rest } = options
  const headers = new Headers(hdrs)
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getStoredToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_ORIGIN}/api${path}`, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })

  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { message: text || 'Invalid response' }
  }

  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}
