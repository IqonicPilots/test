"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import { notificationTestApi } from "@/services/notification-test.service"
import { notificationTemplateApi } from "@/services/notification-template.service"
import type {
  CreateCustomNotificationTemplatePayload,
  NotificationTemplate,
  NotificationTemplateType,
  TemplatesListResponse,
  UpdateNotificationTemplatePayload,
} from "@/types/notification-template.types"

export const notificationTemplatesQueryKey = ["notification-templates"] as const

export function useNotificationTemplates(args: {
  type: NotificationTemplateType
  page?: number
  perPage?: number
}) {
  return useQuery<TemplatesListResponse>({
    queryKey: [...notificationTemplatesQueryKey, args],
    queryFn: () => notificationTemplateApi.getTemplates(args),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateCustomNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCustomNotificationTemplatePayload | FormData) => 
      data instanceof FormData 
        ? notificationTemplateApi.createTemplateWithFormData(data)
        : notificationTemplateApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationTemplatesQueryKey })
      toast.success("Notification template created successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateNotificationTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNotificationTemplatePayload | FormData }) =>
      data instanceof FormData
        ? notificationTemplateApi.updateTemplateWithFormData(id, data)
        : notificationTemplateApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationTemplatesQueryKey })
      toast.success("Notification template updated successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useSendTestEmail() {
  return useMutation<void, Error, { email: string; content: string; subject?: string }>({
    mutationFn: (data) => notificationTestApi.sendTestEmail(data),
    onSuccess: () => {
      toast.success("Test email sent successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to send test email: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useSendTestSms() {
  return useMutation<void, Error, { phoneNumber: string; content: string }>({
    mutationFn: (data) => notificationTestApi.sendTestSms(data),
    onSuccess: () => {
      toast.success("Test SMS sent successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to send test SMS: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useSendTestWhatsapp() {
  return useMutation<void, Error, { phoneNumber: string; content: string }>({
    mutationFn: (data) => notificationTestApi.sendTestWhatsapp(data),
    onSuccess: () => {
      toast.success("Test WhatsApp sent successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to send test WhatsApp: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteNotificationTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationTemplateApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationTemplatesQueryKey })
      toast.success("Notification template deleted successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${getApiErrorMessage(error)}`)
    },
  })
}

