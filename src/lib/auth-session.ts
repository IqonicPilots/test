import type { LoginResponse, UserRole } from "@/types/auth.types"

export type StoredAuthUser = {
  id?: string
  name: string
  email: string
  role?: UserRole
  avatar: string
}

export type StoredAuthSession = {
  user: StoredAuthUser
  accessToken?: string
  refreshToken?: string
}

const AUTH_SESSION_STORAGE_KEY = "kivicare.auth.session"
const JWT_EXPIRY_BUFFER_MS = 30 * 1000

function getDisplayName(user: LoginResponse["user"], fallbackEmail: string) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()

  if (fullName) {
    return fullName
  }

  if (user?.name?.trim()) {
    return user.name.trim()
  }

  return fallbackEmail.split("@")[0] || "KiviCare User"
}

export function buildStoredAuthSession(response: LoginResponse, fallbackEmail: string): StoredAuthSession {
  const user = response.user ?? response.data?.user
  const avatarFromUser =
    user?.meta?.profilePicture ?? user?.meta?.avatar ?? user?.profilePicture ?? user?.avatar ?? ""

  return {
    user: {
      id: user?.id,
      name: getDisplayName(user, fallbackEmail),
      email: user?.email ?? fallbackEmail,
      role: user?.role,
      avatar: typeof avatarFromUser === "string" ? avatarFromUser : "",
    },
    accessToken: response.accessToken ?? response.data?.accessToken ?? response.token,
    refreshToken: response.refreshToken ?? response.data?.refreshToken,
  }
}

export function saveAuthSession(session: StoredAuthSession) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event("kivicare-auth-session-changed"))
}

export function getStoredAuthSession() {
  if (typeof window === "undefined") {
    return null
  }

  const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession) as StoredAuthSession
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
    return null
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
  window.dispatchEvent(new Event("kivicare-auth-session-changed"))
}

export function updateStoredAccessToken(accessToken: string) {
  const session = getStoredAuthSession()

  if (!session) {
    return
  }

  saveAuthSession({
    ...session,
    accessToken,
  })
}

type JwtPayload = {
  exp?: number
  id?: string
}

function decodeJwtPayload(token?: string): JwtPayload | null {
  if (!token) {
    return null
  }

  const [, payload] = token.split(".")

  if (!payload) {
    return null
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/")
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "="
    )

    if (typeof window === "undefined" || typeof window.atob !== "function") {
      return null
    }

    return JSON.parse(window.atob(paddedPayload)) as JwtPayload
  } catch {
    return null
  }
}

export function getCurrentUserIdFromSession(): string | null {
  const session = getStoredAuthSession()
  if (session?.user?.id) {
    return session.user.id
  }
  const payload = decodeJwtPayload(session?.accessToken)
  return typeof payload?.id === "string" ? payload.id : null
}

export function isAccessTokenExpired(token?: string, bufferMs = JWT_EXPIRY_BUFFER_MS) {
  const payload = decodeJwtPayload(token)

  if (!payload?.exp) {
    return false
  }

  return payload.exp * 1000 <= Date.now() + bufferMs
}
