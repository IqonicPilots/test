import { api } from "@/lib/api/axios"

export type PaymentMode = "sandbox" | "live"

export type PayLaterSettings = {
  isActive: boolean
}

export type PaypalSettings = {
  isActive: boolean
  mode: PaymentMode
  client_id: string
  client_secret: string
  currency: string
}

export type RazorpaySettings = {
  isActive: boolean
  mode: PaymentMode
  key_id: string
  key_secret: string
  currency: string
}

export type StripeSettings = {
  isActive: boolean
  mode: PaymentMode
  secret_api_key: string
  publishable_key: string
  currency: string
}

export type PaymentSettingsData = {
  pay_later?: PayLaterSettings
  paypal?: PaypalSettings
  razorpay?: RazorpaySettings
  stripe?: StripeSettings
}

type PaymentSettingsResponse = {
  statusCode: number
  data: any
  message?: string
  success?: boolean
}

type UpdatePaymentSettingsPayload = {
  name: "payment"
  data: Partial<PaymentSettingsData>
}

function normalizePaymentSettings(payload: any): PaymentSettingsData {
  const maybe = payload?.data?.data ?? payload?.data ?? payload
  return (maybe ?? {}) as PaymentSettingsData
}

export const paymentSettingsApi = {
  getSettings: async (): Promise<PaymentSettingsData> => {
    const response = await api.get<PaymentSettingsResponse>("/settings/payment")
    return normalizePaymentSettings(response.data?.data)
  },
  getPublicSettings: async (): Promise<PaymentSettingsData> => {
    const response = await api.get<PaymentSettingsResponse>("/settings/payment/public")
    return normalizePaymentSettings(response.data?.data)
  },

  saveSettings: async (data: Partial<PaymentSettingsData>): Promise<PaymentSettingsData> => {
    const payload: UpdatePaymentSettingsPayload = {
      name: "payment",
      data,
    }
    const response = await api.post<PaymentSettingsResponse>("/settings", payload)
    return normalizePaymentSettings(response.data?.data)
  },
}

