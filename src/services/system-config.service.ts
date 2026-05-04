import { api } from "@/lib/api/axios"

import type { SystemConfig } from "@/types/system-config.types"

type SystemConfigApiResponse = {
  statusCode: number
  data: SystemConfig
  message: string
  success: boolean
}

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

function normalizeConfigurationSettings(
  raw: SystemConfig["configuration_settings"] | undefined
): NonNullable<SystemConfig["configuration_settings"]> {
  const o = (raw ?? {}) as Record<string, unknown>
  return {
    receptionist: coerceBoolean(o.receptionist, true),
    billing: coerceBoolean(o.billing, true),
    problem: coerceBoolean(o.problem, true),
    observations: coerceBoolean(o.observations, true),
    note: coerceBoolean(o.note, true),
    prescription: coerceBoolean(o.prescription, true),
  }
}

export const systemConfigApi = {
  getSystemConfig: async (): Promise<SystemConfig> => {
    const response = await api.get<SystemConfigApiResponse>("/settings/system-config")
    const data = response.data?.data ?? ({} as SystemConfig)
    return {
      ...data,
      language_display: coerceBoolean(data?.language_display, true),
      default_language: data?.default_language ?? "en",
      hide_customizer: coerceBoolean(data?.hide_customizer, false),
      configuration_settings: normalizeConfigurationSettings(data?.configuration_settings),
    }
  },
}

