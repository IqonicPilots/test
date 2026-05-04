"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import {
  paymentSettingsApi,
  type PaymentSettingsData,
} from "@/services/payment-settings.service"

export const paymentSettingsQueryKey = ["payment-settings"] as const

export type SavePaymentSettingsVariables = {
  data: Partial<PaymentSettingsData>
  successMessage?: string
}

export function usePaymentSettings() {
  return useQuery<PaymentSettingsData>({
    queryKey: paymentSettingsQueryKey,
    queryFn: () => paymentSettingsApi.getSettings(),
    staleTime: 5 * 60 * 1000,
  })
}

export function usePublicPaymentSettings() {
  return useQuery<PaymentSettingsData>({
    queryKey: [...paymentSettingsQueryKey, "public"] as const,
    queryFn: () => paymentSettingsApi.getPublicSettings(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSavePaymentSettings() {
  const queryClient = useQueryClient()

  return useMutation<PaymentSettingsData, Error, SavePaymentSettingsVariables>({
    mutationFn: ({ data }) => paymentSettingsApi.saveSettings(data),
    onSuccess: (saved, variables) => {
      queryClient.setQueryData<PaymentSettingsData>(paymentSettingsQueryKey, (prev) => ({
        ...(prev ?? {}),
        ...(saved ?? {}),
        ...(variables.data ?? {}),
      }))
      toast.success(variables.successMessage ?? "Payment settings saved successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to save payment settings: ${getApiErrorMessage(error)}`)
    },
  })
}

