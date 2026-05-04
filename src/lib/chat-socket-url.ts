/**
 * Socket.IO must reach the Node server directly (not via Next `/api/v1` rewrites).
 *
 * - Set `NEXT_PUBLIC_SOCKET_URL` in production (e.g. `https://api.example.com`).
 * - Local dev defaults to `http://localhost:5000` (same as backend default).
 */
export function resolveChatSocketUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SOCKET_URL?.trim().replace(/\/$/, "")
  if (fromEnv) return fromEnv

  if (typeof window !== "undefined") {
    const host = window.location.hostname
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5000"
    }
  }

  const internal =
    process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ||
    "http://localhost:5000"
  return internal
}
