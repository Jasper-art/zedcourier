// src/api.js
// ─────────────────────────────────────────────
// Single place for base URL + all fetch helpers.
// Every tab imports from here — never hardcode
// the Render URL or token logic in a tab again.
// ─────────────────────────────────────────────

const BASE = 'https://zedcourier-1.onrender.com/api/v1'

// ── token helpers ────────────────────────────
export const getToken  = ()         => localStorage.getItem('token')
export const getUser   = ()         => JSON.parse(localStorage.getItem('user') || '{}')
export const setAuth = (token, user) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify({
    id:       user.Id       ?? user.id,
    fullName: user.FullName ?? user.fullName,
    email:    user.Email    ?? user.email,
    role:     user.Role     ?? user.role,
    branchId: user.BranchId ?? user.branchId,
    branchName: user.BranchName ?? user.branchName,
  }))
}
export const clearAuth = ()         => localStorage.clear()

// ── core fetch wrapper ───────────────────────
// • Attaches Bearer token automatically
// • Redirects to /login on 401 (expired token)
// • Throws a clean Error on non-OK responses
export async function apiFetch(path, options = {}) {
  const { body, method = 'GET', headers = {} } = options

  const res = await fetch(`${BASE}/${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${getToken()}`,
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  // Token expired / invalid → kick to login
  if (res.status === 401) {
    clearAuth()
    window.location.href = '/login'
    return                           // stop execution
  }

  // Parse JSON once
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    // Surface the backend error message if present
    throw new Error(data?.error || data?.details || `Request failed (${res.status})`)
  }

  return data
}

// ── convenience wrappers ─────────────────────
export const apiGet    = (path)           => apiFetch(path)
export const apiPost   = (path, body)     => apiFetch(path, { method: 'POST',  body })
export const apiPut    = (path, body)     => apiFetch(path, { method: 'PUT',   body })
export const apiDelete = (path)           => apiFetch(path, { method: 'DELETE' })

// ── named endpoints ──────────────────────────
// Import these directly in tabs — no more inline fetch URLs.
export const api = {
  // auth
  login:          (body)     => apiPost('auth/login', body),
  logout: () => apiPost('auth/logout'),
  register:       (body)     => apiPost('auth/register', body),
  getUsers:       ()         => apiGet('auth/users'),
  // ADD after getUsers line:
getAuditLogs: () => apiGet('finance/audit'),
  deactivate:     (id)       => apiPut(`auth/${id}/deactivate`),
  resetPassword:  (id, body) => apiPut(`auth/${id}/reset-password`, body),

  // parcels
  getParcels:     ()         => apiGet('parcel'),

  // finance
  financeSummary: ()         => apiGet('finance/summary'),
  financeDaily:   ()         => apiGet('finance/daily'),
  financeBranch:  ()         => apiGet('finance/branch'),

  // branches
  getBranches:    ()         => apiGet('branch'),
  createBranch:   (body)     => apiPost('branch', body),

  // tracking
  getTracking:    (waybill)  => apiGet(`tracking/${waybill}`),

  // collections
  getCollections: ()         => apiGet('collection'),
}