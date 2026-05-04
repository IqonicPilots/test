import type { Appointment } from "@/types/appointment.types"

/** Slot availability state for calendar cells */
export type SlotAvailabilityState =
  | "available"
  | "full"
  | "doctor_leave"
  | "clinic_holiday"

export interface SlotAvailability {
  date: string
  slotKey?: string
  state: SlotAvailabilityState
}

export interface CalendarEvent {
  id: string | number
  title: string
  date: Date
  time: string
  duration: string
  type: "meeting" | "event" | "personal" | "task" | "reminder"
  attendees: string[]
  location: string
  color: string
  description?: string
  original?: Appointment
}
