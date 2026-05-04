import { api } from "@/lib/api/axios"
import type {
  CreateCustomNotificationTemplatePayload,
  NotificationTemplate,
  NotificationTemplateType,
  TemplatesListResponse,
  UpdateNotificationTemplatePayload,
} from "@/types/notification-template.types"

export const notificationTemplateApi = {
  getTemplates: async (args: {
    type: NotificationTemplateType
    page?: number
    perPage?: number
  }): Promise<TemplatesListResponse> => {
    const params = new URLSearchParams()
    params.set("type", args.type)
    if (args.page) params.set("page", String(args.page))
    if (args.perPage) params.set("perPage", String(args.perPage))

    const response = await api.get(`/notifications/templates?${params.toString()}`)
    const payload = response.data as TemplatesListResponse
    const normalizeRecipients = (template: any) => {
      const recipientsValue = template.recipients
      const legacyRecipientValue = template.recipient

      if (Array.isArray(recipientsValue)) return recipientsValue
      if (typeof recipientsValue === "string") return [recipientsValue.trim()].filter(Boolean)
      if (Array.isArray(legacyRecipientValue)) {
        return legacyRecipientValue.map((value) => String(value).trim()).filter(Boolean) as NotificationTemplate["recipients"]
      }
      if (typeof legacyRecipientValue === "string") return [legacyRecipientValue.trim()] as NotificationTemplate["recipients"]
      return []
    }

    const normalizedData = (payload.data ?? []).map((template) => ({
      ...template,
      recipients: normalizeRecipients(template),
      contentsid: template.contentsid?.trim?.() ?? template.contentsid,
    }))

    return {
      ...payload,
      data: normalizedData,
    }
  },

  updateTemplate: async (
    id: string,
    data: UpdateNotificationTemplatePayload
  ): Promise<NotificationTemplate> => {
    const response = await api.put(`/notifications/templates/${id}`, data)
    return response.data.data as NotificationTemplate
  },

  updateTemplateWithFormData: async (
    id: string,
    formData: FormData
  ): Promise<NotificationTemplate> => {
    const response = await api.put(`/notifications/templates/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data.data as NotificationTemplate
  },

  createTemplate: async (data: CreateCustomNotificationTemplatePayload): Promise<NotificationTemplate> => {
    const response = await api.post("/notifications/templates", data)
    return response.data.data as NotificationTemplate
  },

  createTemplateWithFormData: async (formData: FormData): Promise<NotificationTemplate> => {
    const response = await api.post("/notifications/templates", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data.data as NotificationTemplate
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await api.delete(`/notifications/templates/${id}`)
  },
}

