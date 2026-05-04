import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios"

import {
  clearAuthSession,
  getStoredAuthSession,
  isAccessTokenExpired,
  updateStoredAccessToken,
} from "@/lib/auth-session"

/**
 * Browser: default same-origin `/api/v1` → Next `rewrites` → Express (no CORS / no OPTIONS preflight).
 * Server: use `BACKEND_INTERNAL_URL` or localhost (relative `/api/v1` is invalid for Node axios).
 * Browser override: set `NEXT_PUBLIC_API_BASE_URL` to a relative path (e.g. `/api/v1`).
 * Absolute browser URLs are ignored here to prevent accidental cross-origin CORS preflight calls.
 */
function resolveApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")

  if (typeof window !== "undefined") {
    if (fromEnv?.startsWith("/")) return fromEnv
    return "/api/v1"
  }

  // Server-side: Node requires absolute URLs; skip relative paths
  if (fromEnv && !fromEnv.startsWith("/")) return fromEnv

  const internal =
    process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") || "http://localhost:5000"
  return `${internal}/api/v1`
}

const API_BASE_URL = resolveApiBaseUrl()

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

type RefreshTokenResponse = {
  data?: {
    token?: string
  }
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

let refreshPromise: Promise<string | null> | null = null

// Request deduplication
const activeRequests = new Map<string, Promise<any>>()

function getRequestKey(config: any): string {
  const { method, url, params, data } = config
  return `${method}:${url}:${JSON.stringify(params)}:${typeof data === "string" ? data : JSON.stringify(data)}`
}

const originalRequest = api.request.bind(api)

// @ts-ignore
api.request = (configOrUrl: any, config?: any) => {
  let finalConfig = configOrUrl
  if (typeof configOrUrl === "string") {
    finalConfig = { ...config, url: configOrUrl }
  }

  if (finalConfig.method?.toLowerCase() !== "get") {
    return originalRequest(finalConfig)
  }

  const key = getRequestKey(finalConfig)
  if (activeRequests.has(key)) {
    return activeRequests.get(key)
  }

  const promise = originalRequest(finalConfig).finally(() => {
    activeRequests.delete(key)
  })

  activeRequests.set(key, promise)
  return promise
}

function isPublicAuthRoute(url?: string) {
  return Boolean(
    url &&
    ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"].some(
      (route) => url.includes(route)
    )
  )
}

const PUBLIC_PATHS = ["/", "/landing", "/book-appointment"]

function isPublicPage() {
  if (typeof window === "undefined") return true
  const pathname = window.location.pathname
  return PUBLIC_PATHS.some(path => {
    if (path === "/") return pathname === "/"
    return pathname === path || pathname.startsWith(path + "/")
  })
}

function redirectToLanding() {
  if (typeof window === "undefined" || isPublicPage()) {
    return
  }

  if (window.location.pathname !== "/") {
    window.location.replace("/")
  }
}

function clearSessionAndRedirect() {
  clearAuthSession()
  redirectToLanding()
}

async function refreshAccessToken() {
  const session = getStoredAuthSession()
  const refreshToken = session?.refreshToken

  if (!refreshToken) {
    clearSessionAndRedirect()
    return null
  }

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<RefreshTokenResponse>("/auth/refresh", { refreshToken })
      .then((response) => {
        const nextAccessToken = response.data?.data?.token

        if (!nextAccessToken) {
          clearSessionAndRedirect()
          return null
        }

        updateStoredAccessToken(nextAccessToken)
        return nextAccessToken
      })
      .catch(() => {
        clearSessionAndRedirect()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

function setAuthorizationHeader(
  config: InternalAxiosRequestConfig,
  token: string
) {
  const headers = AxiosHeaders.from(config.headers)
  headers.set("Authorization", `Bearer ${token}`)
  config.headers = headers
}

api.interceptors.request.use(async (config) => {
  if (isPublicAuthRoute(config.url)) {
    return config
  }

  const session = getStoredAuthSession()
  const accessToken = session?.accessToken

  if (!accessToken) {
    return config
  }

  const token = isAccessTokenExpired(accessToken)
    ? await refreshAccessToken()
    : accessToken

  if (token) {
    setAuthorizationHeader(config, token)
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    const key = getRequestKey(response.config)
    activeRequests.delete(key)
    return response
  },
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined
    if (config) {
      const key = getRequestKey(config)
      activeRequests.delete(key)
    }

    const originalRequest = config
    const isUnauthorized = error.response?.status === 401
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh")
    const isPublicAuthRequest = isPublicAuthRoute(originalRequest?.url)

    if (
      !isUnauthorized ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest ||
      isPublicAuthRequest
    ) {
      if (isUnauthorized && !isRefreshRequest && !isPublicAuthRequest) {
        clearSessionAndRedirect()
      }

      return Promise.reject(error)
    }

    originalRequest._retry = true

    const nextAccessToken = await refreshAccessToken()

    if (!nextAccessToken) {
      return Promise.reject(error)
    }

    setAuthorizationHeader(originalRequest, nextAccessToken)
    return api(originalRequest)
  }
)

type ApiErrorPayload = {
  message?: string
  error?: string
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      "Something went wrong."
    )
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Something went wrong."
}
