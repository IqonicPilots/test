"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import {
  appointmentSettingsApi,
  type AppointmentSettingsData,
} from "@/services/appointment-settings.service"

export const appointmentSettingsQueryKey = ["appointment-settings"] as const

export type SaveAppointmentSettingsVariables = {
  data: Partial<AppointmentSettingsData>
  successMessage?: string
}

export function useAppointmentSettings() {
  return useQuery<AppointmentSettingsData>({
    queryKey: appointmentSettingsQueryKey,
    queryFn: () => appointmentSettingsApi.getSettings(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSaveAppointmentSettings() {
  const queryClient = useQueryClient()

  return useMutation<AppointmentSettingsData, Error, SaveAppointmentSettingsVariables>({
    mutationFn: ({ data }) => appointmentSettingsApi.saveSettings(data),
    onSuccess: (saved, variables) => {
      queryClient.setQueryData<AppointmentSettingsData>(appointmentSettingsQueryKey, (prev) => ({
        ...(prev ?? {}),
        ...(saved ?? {}),
        ...(variables.data ?? {}),
      }))
      toast.success(variables.successMessage ?? "Appointment settings saved successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to save appointment settings: ${getApiErrorMessage(error)}`)
    },
  })
}
