import { api } from "@/lib/api/axios"

function coerceBoolean(value: unknown, defaultValue: boolean): boolean {
  if (value === null || value === undefined) return defaultValue
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    const v = value.trim().toLowerCase()
    if (v === "true" || v === "1" || v === "yes") return true
    if (v === "false" || v === "0" || v === "no" || v === "") return false
  }
  return Boolean(value)
}

export type AppointmentSettingsData = {
  enable_email_reminder: boolean
  enable_appointment_description: boolean
  enable_cancellation_buffer: boolean
  cancellation_buffer_hours: number
}

type AppointmentSettingsResponse = {
  statusCode: number
  data: any
  message?: string
  success?: boolean
}

type UpdateAppointmentSettingsPayload = {
  name: "appointment"
  data: Partial<AppointmentSettingsData>
}

const DEFAULT_APPOINTMENT_SETTINGS: AppointmentSettingsData = {
  enable_email_reminder: true,
  enable_appointment_description: true,
  enable_cancellation_buffer: true,
  cancellation_buffer_hours: 24,
}

function normalizeAppointmentSettings(payload: any): AppointmentSettingsData {
  const maybe = payload?.data?.data ?? payload?.data ?? payload
  const raw = { ...DEFAULT_APPOINTMENT_SETTINGS, ...(maybe ?? {}) }
  return {
    enable_email_reminder: coerceBoolean(raw.enable_email_reminder, true),
    enable_appointment_description: coerceBoolean(raw.enable_appointment_description, true),
    enable_cancellation_buffer: coerceBoolean(raw.enable_cancellation_buffer, true),
    cancellation_buffer_hours: Number(raw.cancellation_buffer_hours) || 24,
  }
}

export const appointmentSettingsApi = {
  getSettings: async (): Promise<AppointmentSettingsData> => {
    const response = await api.get<AppointmentSettingsResponse>("/settings/appointment")
    return normalizeAppointmentSettings(response.data?.data)
  },

  saveSettings: async (data: Partial<AppointmentSettingsData>): Promise<AppointmentSettingsData> => {
    const payload: UpdateAppointmentSettingsPayload = {
      name: "appointment",
      data,
    }
    const response = await api.post<AppointmentSettingsResponse>("/settings", payload)
    return normalizeAppointmentSettings(response.data?.data)
  },
}
