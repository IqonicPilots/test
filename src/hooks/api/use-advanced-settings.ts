"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import {
  advancedSettingsApi,
  type PermissionModuleData,
} from "@/services/advanced-settings.service"

export const advancedSettingsQueryKey = ["advanced-settings"] as const

export function useAdvancedSettings() {
  return useQuery<PermissionModuleData>({
    queryKey: advancedSettingsQueryKey,
    queryFn: () => advancedSettingsApi.getSettings(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSaveAdvancedSettings() {
  const queryClient = useQueryClient()

  return useMutation<any, Error, { data: PermissionModuleData }>({
    mutationFn: ({ data }) => advancedSettingsApi.saveSettings(data),
    onSuccess: (saved) => {
      // Refresh the query data with the saved result
      queryClient.setQueryData(advancedSettingsQueryKey, saved?.data ?? saved)
      toast.success("Advanced settings saved successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to save advanced settings: ${getApiErrorMessage(error)}`)
    },
  })
}
