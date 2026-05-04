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

export type GeneralSettingsData = {
  app_subtext: string
  copyright_text: string
  language_display: boolean
  default_language: string
  currency_prefix: string
  currency_postfix: string
  country_code: string
  reg_doctor_role_active: boolean
  reg_doctor_default_status_active: boolean
  reg_receptionist_role_active: boolean
  reg_receptionist_default_status_active: boolean
  reg_patient_role_active: boolean
  reg_patient_default_status_active: boolean
  hide_customizer: boolean
  booking_appointment_layout: string
  booking_hero_badge_text: string
  booking_hero_title_text: string
  booking_hero_description_text: string
}

type GeneralSettingsResponse = {
  statusCode: number
  data: any
  message?: string
  success?: boolean
}

type UpdateGeneralSettingsPayload = {
  name: "general"
  data: Partial<GeneralSettingsData>
}

const DEFAULT_GENERAL_SETTINGS: GeneralSettingsData = {
  app_subtext: "Your Health, Our Priority",
  copyright_text: "© 2026 KiviCare. All rights reserved.",
  language_display: true,
  default_language: "en",
  currency_prefix: "$",
  currency_postfix: "",
  country_code: "+1",
  reg_doctor_role_active: true,
  reg_doctor_default_status_active: true,
  reg_receptionist_role_active: true,
  reg_receptionist_default_status_active: true,
  reg_patient_role_active: true,
  reg_patient_default_status_active: true,
  hide_customizer: false,
  booking_appointment_layout: "modern",
  booking_hero_badge_text: "Smart Booking Experience",
  booking_hero_title_text: "Schedule Your {Health} Visit.",
  booking_hero_description_text:
    "Experience the next generation of medical appointments with our simplified, secure, and modern booking system.",
}

function normalizeGeneralSettings(payload: any): GeneralSettingsData {
  const maybe = payload?.data?.data ?? payload?.data ?? payload
  const raw = { ...DEFAULT_GENERAL_SETTINGS, ...(maybe ?? {}) }
  return {
    ...raw,
    language_display: coerceBoolean(raw.language_display, true),
    hide_customizer: coerceBoolean(raw.hide_customizer, false),
    reg_doctor_role_active: coerceBoolean(raw.reg_doctor_role_active, true),
    reg_doctor_default_status_active: coerceBoolean(
      raw.reg_doctor_default_status_active,
      true
    ),
    reg_receptionist_role_active: coerceBoolean(raw.reg_receptionist_role_active, true),
    reg_receptionist_default_status_active: coerceBoolean(
      raw.reg_receptionist_default_status_active,
      true
    ),
    reg_patient_role_active: coerceBoolean(raw.reg_patient_role_active, true),
    reg_patient_default_status_active: coerceBoolean(
      raw.reg_patient_default_status_active,
      true
    ),
  }
}

export const generalSettingsApi = {
  getSettings: async (): Promise<GeneralSettingsData> => {
    const response = await api.get<GeneralSettingsResponse>("/settings/general")
    return normalizeGeneralSettings(response.data?.data)
  },

  saveSettings: async (data: Partial<GeneralSettingsData>): Promise<GeneralSettingsData> => {
    const payload: UpdateGeneralSettingsPayload = {
      name: "general",
      data,
    }
    const response = await api.post<GeneralSettingsResponse>("/settings", payload)
    return normalizeGeneralSettings(response.data?.data)
  },
}

