"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import {
  createHoliday,
  deleteHoliday,
  getHolidays,
  updateHoliday,
  type GetHolidaysParams,
  type Holiday,
  type HolidayListResponse,
} from "@/services/holiday.service"

export const holidaysQueryKey = ["holidays"] as const

export function useHolidays(params?: GetHolidaysParams) {
  const page = params?.page ?? 1
  const perPage = params?.perPage ?? 10

  return useQuery<HolidayListResponse>({
    queryKey: [
      ...holidaysQueryKey,
      {
        page,
        perPage,
        search: params?.search,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        category: params?.category,
        targetId: params?.targetId,
        includeInactive: params?.includeInactive,
      },
    ],
    queryFn: () => getHolidays(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidaysQueryKey })
      toast.success("Holiday created successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to create holiday: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import("@/services/holiday.service").UpdateHolidayPayload }) =>
      updateHoliday(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidaysQueryKey })
      toast.success("Holiday updated successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to update holiday: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidaysQueryKey })
      toast.success("Holiday deleted successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to delete holiday: ${getApiErrorMessage(error)}`)
    },
  })
}
