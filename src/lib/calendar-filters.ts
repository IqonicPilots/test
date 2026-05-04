import { startOfDay } from "date-fns"
import type { CalendarEvent } from "@/types/calendar.types"
import type { Appointment } from "@/types/appointment.types"
import { getReferenceId } from "@/lib/utils"

/** Time-based filter: mutually exclusive */
export type AppointmentTimeFilter = "all" | "upcoming" | "past"

/** Status-based filter: multi-select (API status values) */
export type AppointmentStatusFilter =
  | "booked"
  | "checked_in"
  | "completed"
  | "cancelled"

export interface CalendarFiltersState {
  timeFilter: AppointmentTimeFilter
  statusFilters: AppointmentStatusFilter[]
  doctorIds: string[]
  serviceIds: string[]
}

export const DEFAULT_CALENDAR_FILTERS: CalendarFiltersState = {
  timeFilter: "upcoming",
  statusFilters: ["booked", "checked_in", "completed", "cancelled"],
  doctorIds: [],
  serviceIds: [],
}

/** Time filter labels (no colors) */
export const TIME_FILTER_LABELS: Record<AppointmentTimeFilter, string> = {
  all: "All",
  upcoming: "Upcoming",
  past: "Past Date",
}

/** Status filter labels with colors */
export const STATUS_FILTER_LABELS: Record<AppointmentStatusFilter, string> = {
  booked: "Booked",
  checked_in: "Checked-in",
  completed: "Completed",
  cancelled: "Cancelled",
}

export const STATUS_COLORS: Record<AppointmentStatusFilter, string> = {
  booked: "bg-blue-500",
  checked_in: "bg-amber-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
}

/** Number of status filter options (used for hasActiveFilters check) */
export const TOTAL_STATUS_COUNT = (
  Object.keys(STATUS_FILTER_LABELS) as AppointmentStatusFilter[]
).length

/** Get API status type for filtering: booked, checkin, checkout, cancelled */
export function getAppointmentStatusType(appointment: Appointment): AppointmentStatusFilter {
  const statusId = (appointment.status?.id ?? "").toLowerCase().replace(/_/g, "")

  if (statusId === "cancelled" || statusId.includes("cancel")) return "cancelled"
  if (statusId === "checkin" || statusId.includes("checkin")) return "checked_in"
  if (statusId === "checkout" || statusId.includes("checkout")) return "completed"

  return "booked"
}

/** Derive display status for card color. Past booked = gray. */
export function getAppointmentDisplayStatus(
  appointment: Appointment,
  eventDate: Date
): "booked" | "past" | "checked_in" | "completed" | "cancelled" {
  const statusType = getAppointmentStatusType(appointment)
  const today = startOfDay(new Date())
  const apptDate = startOfDay(eventDate)

  if (statusType === "cancelled") return "cancelled"
  if (statusType === "checked_in") return "checked_in"
  if (statusType === "completed") return "completed"

  if (apptDate < today) return "past"
  return "booked"
}

/** Filter by time: all / upcoming / past */
export function filterByTime(
  events: CalendarEvent[],
  timeFilter: AppointmentTimeFilter
): CalendarEvent[] {
  if (timeFilter === "all") return events

  const today = startOfDay(new Date())

  return events.filter((event) => {
    const d = event.date instanceof Date ? event.date : new Date(event.date)
    const eventDate = startOfDay(d)
    if (timeFilter === "upcoming") return eventDate >= today
    if (timeFilter === "past") return eventDate < today
    return true
  })
}

/** Filter by status (multi-select) */
export function filterByStatus(
  events: CalendarEvent[],
  statusFilters: AppointmentStatusFilter[]
): CalendarEvent[] {
  if (!statusFilters.length) return events

  return events.filter((event) => {
    if (!event.original) return false
    const statusType = getAppointmentStatusType(event.original)
    return statusFilters.includes(statusType)
  })
}

/** Filter events by doctor IDs */
export function filterByDoctors(
  events: CalendarEvent[],
  doctorIds: string[]
): CalendarEvent[] {
  if (!doctorIds.length) return events

  return events.filter((event) => {
    const doctorId = getReferenceId(event.original?.doctor ?? event.original?.doctorId)
    return doctorId && doctorIds.includes(doctorId)
  })
}

/** Filter events by service IDs */
export function filterByServices(
  events: CalendarEvent[],
  serviceIds: string[]
): CalendarEvent[] {
  if (!serviceIds.length) return events

  return events.filter((event) => {
    const serviceId = getReferenceId(event.original?.service ?? event.original?.serviceId)
    return serviceId && serviceIds.includes(serviceId)
  })
}

/** Apply all filters in sequence */
export function applyCalendarFilters(
  events: CalendarEvent[],
  filters: CalendarFiltersState
): CalendarEvent[] {
  return filterByDoctors(
    filterByServices(
      filterByStatus(filterByTime(events, filters.timeFilter), filters.statusFilters),
      filters.serviceIds
    ),
    filters.doctorIds
  )
}
