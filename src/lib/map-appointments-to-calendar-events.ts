import type { CalendarEvent } from "@/types/calendar.types"
import type { Appointment } from "@/types/appointment.types"
import {
  getAppointmentDisplayStatus,
  STATUS_COLORS,
  type AppointmentStatusFilter,
} from "./calendar-filters"
import { parseScheduleDate } from "@/hooks/use-appointments"
import { isObject } from "./utils"

export type CalendarEventDateCount = {
  date: Date
  count: number
}

const PAST_COLOR = "bg-slate-500"

function getStatusColor(appointment: Appointment, eventDate: Date): string {
  const status = getAppointmentDisplayStatus(appointment, eventDate)
  if (status === "past") return PAST_COLOR
  return STATUS_COLORS[status as AppointmentStatusFilter] ?? "bg-blue-500"
}

function buildAppointmentTitle(appointment: Appointment) {
  const patient = appointment.patient
  const patientName = isObject(patient)
    ? (patient.fullName || [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim())
    : (typeof patient === 'string' ? `Patient (${patient})` : "")

  const service = appointment.service
  const serviceName = isObject(service) ? service.name : (typeof service === 'string' ? service : "")

  if (patientName && serviceName) return `${patientName} - ${serviceName}`
  if (patientName) return patientName
  if (serviceName) return serviceName

  return "Appointment"
}

export type MapAppointmentsResult = {
  events: CalendarEvent[]
  eventDates: CalendarEventDateCount[]
}

/** Single-pass mapping: produces both events and eventDates in one loop */
export function mapAppointmentsToCalendarData(
  appointments?: Appointment[] | null
): MapAppointmentsResult {
  const events: CalendarEvent[] = []
  const counts = new Map<string, CalendarEventDateCount>()

  if (!Array.isArray(appointments) || appointments.length === 0) {
    return { events: [], eventDates: [] }
  }

  for (const appointment of appointments) {
    const date = parseScheduleDate(appointment.schedule?.startDate)
    if (!date) continue

    const patient = appointment.patient
    const patientName = isObject(patient)
      ? (patient.fullName || [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim())
      : (typeof patient === 'string' ? patient : "")

    const service = appointment.service
    const serviceDuration = isObject(service) ? service.duration : undefined
    const clinic = appointment.clinic
    const clinicName = isObject(clinic) ? clinic.name : (typeof clinic === 'string' ? clinic : "")

    const event: CalendarEvent = {
      id: appointment._id,
      title: buildAppointmentTitle(appointment),
      date,
      time: appointment.schedule?.startTime || "",
      duration: typeof serviceDuration === "number" ? `${serviceDuration} min` : "",
      type: "event",
      attendees: patientName ? [patientName] : [],
      location: clinicName,
      color: getStatusColor(appointment, date),
      description: appointment.status?.label || appointment.status?.id || "Unknown",
      original: appointment,
    }
    events.push(event)

    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    const existing = counts.get(key)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(key, { date, count: 1 })
    }
  }

  const eventDates = Array.from(counts.values()).sort(
    (left, right) => left.date.getTime() - right.date.getTime()
  )
  return { events, eventDates }
}

export function mapAppointmentsToCalendarEvents(appointments?: Appointment[] | null): CalendarEvent[] {
  return mapAppointmentsToCalendarData(appointments).events
}

export function mapAppointmentsToCalendarEventDates(
  appointments?: Appointment[] | null
): CalendarEventDateCount[] {
  return mapAppointmentsToCalendarData(appointments).eventDates
}
