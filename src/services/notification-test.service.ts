import { api } from "@/lib/api/axios"

export type SendTestEmailPayload = {
  email: string
  subject?: string
  content: string
}

export type SendTestSmsPayload = {
  phoneNumber: string
  content: string
}

export type SendTestWhatsappPayload = {
  phoneNumber: string
  content: string
}

export const notificationTestApi = {
  sendTestEmail: async (data: SendTestEmailPayload): Promise<void> => {
    await api.post(`/notifications/send-test-email`, data)
  },
  sendTestSms: async (data: SendTestSmsPayload): Promise<void> => {
    await api.post(`/notifications/send-test-sms`, data)
  },
  sendTestWhatsapp: async (data: SendTestWhatsappPayload): Promise<void> => {
    await api.post(`/notifications/send-test-whatsapp`, data)
  },
}

