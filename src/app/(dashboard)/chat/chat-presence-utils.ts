import type { User } from "./use-chat"

/** Timestamps at or before this (first ~24h of Unix time) are treated as “unknown”, not real presence. */
const MAX_PLACEHOLDER_LAST_SEEN_MS = 86_400_000

export function isMeaningfulLastSeen(iso: string | null | undefined): boolean {
  if (iso == null || String(iso).trim() === "") return false
  const t = new Date(iso).getTime()
  return Number.isFinite(t) && t > MAX_PLACEHOLDER_LAST_SEEN_MS
}

/** Human-readable “last active” line, or null if we should not show a date. */
export function formatLastSeenLabel(iso: string | null | undefined): string | null {
  if (!isMeaningfulLastSeen(iso)) return null
  try {
    return new Date(iso as string).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return null
  }
}

/** Online only when the API/socket says so — not guessed. */
export function directPeerAppearsOnline(
  peer: User | undefined,
  onlineUserIds: string[]
): boolean {
  if (!peer) return false
  if (onlineUserIds.includes(peer.id)) return true
  return peer.status === "online"
}
