export const INVALID_VIEW_VALUE_TOKENS = new Set([
  "",
  "-",
  "n/a",
  "na",
  "null",
  "undefined",
])

function normalizeString(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

export function isViewValuePresent(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === "string") {
    const normalized = normalizeString(value)
    return normalized.length > 0 && !INVALID_VIEW_VALUE_TOKENS.has(normalized.toLowerCase())
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
  }

  if (typeof value === "boolean") {
    return true
  }

  if (value instanceof Date) {
    return !Number.isNaN(value.getTime())
  }

  if (Array.isArray(value)) {
    return value.some((entry) => isViewValuePresent(entry))
  }

  // Objects (including React elements) are considered renderable by default.
  return true
}

export function toViewText(value: unknown): string {
  if (!isViewValuePresent(value)) return ""
  if (typeof value === "string") return normalizeString(value)
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export function joinViewValues(values: unknown[], separator = ", "): string {
  return values
    .map((value) => toViewText(value))
    .filter((value) => isViewValuePresent(value))
    .join(separator)
}
