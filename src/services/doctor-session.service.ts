import { api } from "@/lib/api/axios"
import type {
  DoctorSession,
  DoctorSessionPayload,
  AppointmentBookSlots,
  DoctorSessionListResponse,
} from "@/types/doctor-session.types"

export type {
  DoctorSessionDayId,
  DoctorSessionBreak,
  DoctorSessionSchedule,
  DoctorSessionClinicRef,
  DoctorSessionDoctorRef,
  DoctorSession,
  DoctorSessionPayload,
  AppointmentBookSlots,
  DoctorSessionListResponse,
} from "@/types/doctor-session.types"

export { DOCTOR_SESSION_DAYS } from "@/types/doctor-session.types"

export async function getDoctorSessions(
  page = 1,
  limit = 10,
  filters?: {
    clinicId?: string
    doctorId?: string
    search?: string
  }
) {
  const response = await api.get<DoctorSessionListResponse>("/doctor-sessions", {
    params: {
      page,
      limit,
      clinicId: filters?.clinicId || undefined,
      doctorId: filters?.doctorId || undefined,
      search: filters?.search?.trim() || undefined,
    }
  })
  return response.data
}

export async function getDoctorSessionsByDoctor(doctorId: string, page = 1, limit = 10) {
  const response = await api.get<DoctorSessionListResponse>(
    `/doctor-sessions/doctor/${doctorId}`, {
      params: { page, limit }
    }
  )

  return response.data
}

export async function createDoctorSession(
  clinicId: string,
  doctorId: string,
  data: DoctorSessionPayload
) {
  if (!clinicId || !doctorId) {
    throw new Error("Clinic and doctor ids are required for doctor session creation.")
  }

  const response = await api.post(
    `/doctor-sessions/clinic/${clinicId}/doctor/${doctorId}`,
    data
  )

  return response.data.data
}

export async function updateDoctorSession(
  clinicId: string,
  doctorId: string,
  data: DoctorSessionPayload
) {
  if (!clinicId || !doctorId) {
    throw new Error("Clinic and doctor ids are required for doctor session update.")
  }

  const response = await api.put(
    `/doctor-sessions/clinic/${clinicId}/doctor/${doctorId}`,
    data
  )

  return response.data.data
}

export async function getAppointmentBookSlots(params: {
  clinicId: string
  doctorId: string
  date: string
  serviceId: string
}) {
  const response = await api.get("/doctor-sessions/appointment-book-slot", {
    params,
  })
  return response.data.data
}

export type MonthAvailabilityDay = {
  date: string
  slotsAvailable: number
  status: string
}

export async function getMonthAvailability(params: {
  clinicId: string
  doctorId: string
  month: number
  year: number
  serviceId?: string
}) {
  const response = await api.get("/doctor-sessions/month-availability", {
    params,
  })
  return response.data.data
}

export async function deleteDoctorSession(sessionId: string) {
  if (!sessionId) {
    throw new Error("Session id is required for doctor session deletion.")
  }

  const response = await api.delete(`/doctor-sessions/${sessionId}`)
  return response.data
}
