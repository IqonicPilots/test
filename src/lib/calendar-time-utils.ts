import type { CalendarEvent } from "@/types/calendar.types"

export interface EventLayout {
  left: number // 0 to 100 percentage
  width: number // 0 to 100 percentage
  topOffset: number // pixels
  columnIndex: number
  totalColumns: number
  startMinutes: number
  endMinutes: number
}


/** 30-minute slots from 12:00 AM (0) to 11:30 PM (47) */
export const SLOTS_PER_DAY = 48
export const MINUTES_PER_SLOT = 30

/** Parse time string (e.g. "09:00", "20:30", "8:00 PM") to minutes since midnight */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr?.trim()) return 0

  const trimmed = timeStr.trim()

  // 24h format: "09:00", "20:30"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(?:am|pm))?$/i)
  if (match24) {
    let hours = parseInt(match24[1], 10)
    const minutes = parseInt(match24[2], 10)
    const isPM = /pm/i.test(trimmed)
    const isAM = /am/i.test(trimmed)
    if (isPM && hours < 12) hours += 12
    if (isAM && hours === 12) hours = 0
    if (!isAM && !isPM && hours < 12 && trimmed.toLowerCase().includes("pm")) hours += 12
    return Math.min(24 * 60 - 1, Math.max(0, hours * 60 + minutes))
  }

  // 12h format: "8:00 PM", "9:30 AM"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i)
  if (match12) {
    let hours = parseInt(match12[1], 10)
    const minutes = parseInt(match12[2], 10)
    const ampm = match12[3].toLowerCase()
    if (ampm === "pm" && hours < 12) hours += 12
    if (ampm === "am" && hours === 12) hours = 0
    return Math.min(24 * 60 - 1, Math.max(0, hours * 60 + minutes))
  }

  return 0
}

/** Parse duration string (e.g. "30 min", "60") to minutes */
export function parseDurationMinutes(durationStr: string): number {
  if (!durationStr?.trim()) return 30
  const match = durationStr.match(/(\d+)/)
  return match ? Math.max(5, parseInt(match[1], 10)) : 30
}

/** Get event start and end in minutes since midnight for a given date */
export function getEventMinutes(
  event: CalendarEvent,
  baseDate: Date
): { startMinutes: number; endMinutes: number } | null {
  const eventDate = event.date
  if (
    eventDate.getFullYear() !== baseDate.getFullYear() ||
    eventDate.getMonth() !== baseDate.getMonth() ||
    eventDate.getDate() !== baseDate.getDate()
  ) {
    return null
  }

  const startMinutes = parseTimeToMinutes(event.time)
  const durationMinutes = parseDurationMinutes(event.duration)
  const endMinutes = Math.min(24 * 60, startMinutes + durationMinutes)

  return { startMinutes, endMinutes }
}

export type LayoutStrategy = "split" | "stack"

/**
 * Computes layout positions (left, width) for events that may overlap.
 */
export function computeEventLayouts(
  events: CalendarEvent[],
  day: Date,
  strategy: LayoutStrategy = "split"
): (CalendarEvent & { layout: EventLayout })[] {
  // 1. Prepare event data with start/end minutes
  const eventsWithMinutes = events
    .map((event) => {
      const mins = getEventMinutes(event, day)
      return mins ? { ...event, ...mins } : null
    })
    .filter((e): e is CalendarEvent & { startMinutes: number; endMinutes: number } => e !== null)

  if (eventsWithMinutes.length === 0) return []

  // 2. Sort events by start time, then duration
  eventsWithMinutes.sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes
    return (b.endMinutes - b.startMinutes) - (a.endMinutes - a.startMinutes)
  })

  // 3. Group events into clusters of overlaps
  const clusters: (typeof eventsWithMinutes)[] = []
  let currentCluster: typeof eventsWithMinutes = []
  let clusterEnd = 0

  for (const event of eventsWithMinutes) {
    if (event.startMinutes < clusterEnd) {
      currentCluster.push(event)
      clusterEnd = Math.max(clusterEnd, event.endMinutes)
    } else {
      if (currentCluster.length > 0) {
        clusters.push(currentCluster)
      }
      currentCluster = [event]
      clusterEnd = event.endMinutes
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster)
  }

  // 4. For each cluster, assign columns
  const results: (CalendarEvent & { layout: EventLayout })[] = []

  for (const cluster of clusters) {
    const columns: number[] = [] // Stores last event's endMinutes for each column
    const eventColumnMap = new Map<string | number, number>()

    for (const event of cluster) {
      let columnIndex = -1
      for (let i = 0; i < columns.length; i++) {
        if (event.startMinutes >= columns[i]) {
          columnIndex = i
          break
        }
      }

      if (columnIndex === -1) {
        columnIndex = columns.length
        columns.push(event.endMinutes)
      } else {
        columns[columnIndex] = event.endMinutes
      }

      eventColumnMap.set(event.id, columnIndex)
    }

    const totalColumns = columns.length
    for (const event of cluster) {
      const columnIndex = eventColumnMap.get(event.id)!
      
      const isStack = strategy === "stack"
      
      results.push({
        ...event,
        layout: {
          left: isStack ? 0 : (columnIndex / totalColumns) * 100,
          width: isStack ? 100 : 100 / totalColumns,
          topOffset: isStack ? columnIndex * 24 : 0, // 24px offset per stacked item
          columnIndex,
          totalColumns,
          startMinutes: event.startMinutes,
          endMinutes: event.endMinutes,
        },
      })
    }
  }

  return results
}


/** Format slot index (0-47) to display time */
export function slotIndexToTimeLabel(index: number): string {
  const hours = Math.floor(index / 2)
  const minutes = (index % 2) * 30
  if (hours === 0 && minutes === 0) return "12am"
  if (hours === 12 && minutes === 0) return "12pm"
  if (hours < 12) return `${hours}am`
  if (hours === 12) return `${hours}pm`
  return `${hours - 12}pm`
}
