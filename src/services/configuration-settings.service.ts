import { api } from "@/lib/api/axios"

export type ConfigurationSettings = {
  receptionist: boolean
  billing: boolean
  problem: boolean
  observations: boolean
  note: boolean
  prescription: boolean
}

type ConfigurationSettingsResponse = {
  statusCode: number
  data: any
  message?: string
  success?: boolean
}

type UpdateConfigurationSettingsPayload = {
  name: "configurations"
  data: {
    enable_receptionist: boolean
    enable_billing: boolean
    encounter_enable_problem: boolean
    encounter_enable_observations: boolean
    encounter_enable_note: boolean
    enable_prescription: boolean
  }
}

function toConfigurationSettings(data: any): ConfigurationSettings {
  return {
    receptionist: Boolean(data?.enable_receptionist),
    billing: Boolean(data?.enable_billing),
    problem: Boolean(data?.encounter_enable_problem),
    observations: Boolean(data?.encounter_enable_observations),
    note: Boolean(data?.encounter_enable_note),
    prescription: Boolean(data?.enable_prescription),
  }
}

function toUpdatePayload(data: ConfigurationSettings): UpdateConfigurationSettingsPayload {
  return {
    name: "configurations",
    data: {
      enable_receptionist: data.receptionist,
      enable_billing: data.billing,
      encounter_enable_problem: data.problem,
      encounter_enable_observations: data.observations,
      encounter_enable_note: data.note,
      enable_prescription: data.prescription,
    },
  }
}

export const configurationSettingsApi = {
  getSettings: async (): Promise<ConfigurationSettings> => {
    const response = await api.get<ConfigurationSettingsResponse>("/settings/configurations")
    return toConfigurationSettings(response.data?.data)
  },

  saveSettings: async (data: ConfigurationSettings): Promise<ConfigurationSettings> => {
    const payload = toUpdatePayload(data)
    const response = await api.post<ConfigurationSettingsResponse>("/settings", payload)
    return toConfigurationSettings(response.data?.data?.data ?? response.data?.data)
  },
}
