import { api } from "@/lib/api/axios"

export type TwilioSettings = {
  enable_sms: boolean
  enable_whatsapp: boolean
  account_sid: string
  auth_token: string
  sms_phone_number: string
  whatsapp_phone_number: string
}

export type CustomNotificationSettings = {
  enable_custom_sms: boolean
  enable_custom_whatsapp: boolean
  enable_custom_push: boolean
}

export type NotificationSettingsData = {
  twilio?: TwilioSettings
  custom_notification?: CustomNotificationSettings
}

type NotificationSettingsResponse = {
  statusCode: number
  data: any
  message?: string
  success?: boolean
}

type UpdateNotificationSettingsPayload = {
  name: "notification"
  data: NotificationSettingsData
}

function normalizeNotificationSettings(payload: any): NotificationSettingsData {
  // Common shapes seen across settings endpoints:
  // - { data: { twilio: {...} } }
  // - { data: { name, data: { twilio: {...} } } }
  // - { name, data: { twilio: {...} } }
  const maybe = payload?.data?.data ?? payload?.data ?? payload
  return (maybe ?? {}) as NotificationSettingsData
}

export const notificationSettingsApi = {
  getSettings: async (): Promise<NotificationSettingsData> => {
    const response = await api.get<NotificationSettingsResponse>("/settings/notification")
    return normalizeNotificationSettings(response.data?.data)
  },

  saveSettings: async (data: NotificationSettingsData): Promise<NotificationSettingsData> => {
    const payload: UpdateNotificationSettingsPayload = {
      name: "notification",
      data,
    }
    const response = await api.post<NotificationSettingsResponse>("/settings", payload)
    return normalizeNotificationSettings(response.data?.data) ?? data
  },
}

