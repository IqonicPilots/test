"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import {
  notificationSettingsApi,
  type NotificationSettingsData,
} from "@/services/notification-settings.service"

export const notificationSettingsQueryKey = ["notification-settings"] as const

export type SaveNotificationSettingsVariables = {
  data: NotificationSettingsData
  /** When true, skip success toast (e.g. custom notification toggles auto-save). */
  silent?: boolean
}

export function useNotificationSettings() {
  return useQuery<NotificationSettingsData>({
    queryKey: notificationSettingsQueryKey,
    queryFn: () => notificationSettingsApi.getSettings(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSaveNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation<NotificationSettingsData, Error, SaveNotificationSettingsVariables>({
    mutationFn: ({ data }) => notificationSettingsApi.saveSettings(data),
    onSuccess: (saved, variables) => {
      // Keep cache in sync with what we saved. Refetching GET /settings/notification can return a
      // partial shape (e.g. missing custom_notification) and would wipe UI state on reopen.
      queryClient.setQueryData(notificationSettingsQueryKey, saved)
      if (!variables.silent) {
        toast.success("Notification settings saved successfully.")
      }
    },
    onError: (error) => {
      toast.error(`Failed to save notification settings: ${getApiErrorMessage(error)}`)
    },
  })
}
