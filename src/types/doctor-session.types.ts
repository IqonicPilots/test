import type { PaginatedResponse } from "./pagination.types"

export const DOCTOR_SESSION_DAYS = [
  { id: "mon", label: "Monday", shortLabel: "Mon" },
  { id: "tue", label: "Tuesday", shortLabel: "Tue" },
  { id: "wed", label: "Wednesday", shortLabel: "Wed" },
  { id: "thu", label: "Thursday", shortLabel: "Thu" },
  { id: "fri", label: "Friday", shortLabel: "Fri" },
  { id: "sat", label: "Saturday", shortLabel: "Sat" },
  { id: "sun", label: "Sunday", shortLabel: "Sun" },
] as const

export type DoctorSessionDayId = (typeof DOCTOR_SESSION_DAYS)[number]["id"]

export interface DoctorSessionBreak {
  start: string
  end: string
}

export interface DoctorSessionSchedule {
  id: DoctorSessionDayId
  startTime: string
  endTime: string
  isActive: boolean
  breaks: DoctorSessionBreak[]
}

export interface DoctorSessionClinicRef {
  _id: string
  name?: string
  email?: string
  cliniclogo?: string
}

export interface DoctorSessionDoctorRef {
  _id: string
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  meta?: {
    avatar?: string
    profilePicture?: string
  }
}

export interface DoctorSession {
  _id?: string
  clinic?: string | DoctorSessionClinicRef
  clinicId?: string | DoctorSessionClinicRef
  doctor?: string | DoctorSessionDoctorRef
  doctorId?: string | DoctorSessionDoctorRef
  sessions: DoctorSessionSchedule[]
  createdAt?: string
  updatedAt?: string
}

export interface DoctorSessionPayload {
  sessions: DoctorSessionSchedule[]
}
export interface AppointmentBookSlots {
  date: string
  totalSlots: number
  availableSlots: string[]
}

export type DoctorSessionListResponse = PaginatedResponse<DoctorSession>
