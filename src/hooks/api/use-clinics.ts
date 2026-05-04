"use client"

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import { clinicApi } from "@/services/clinic.service"

export const clinicsQueryKey = ["clinics"] as const

export function useClinics(page = 1, limit = 10, enabled = true, filters?: { search?: string; status?: boolean; isActive?: boolean; sortBy?: string }) {
  const queryKey = useMemo(() => [...clinicsQueryKey, { page, limit, filters }], [page, limit, filters])

  return useQuery({
    queryKey,
    queryFn: () => clinicApi.getAllClinics(page, limit, filters),
    placeholderData: (previousData) => previousData,
    enabled,
  })
}

/** KPI row — unfiltered list stats (no search/status). */
export function useClinicSummaryStats(options?: { enabled?: boolean }) {
  const queryKey = useMemo(() => [...clinicsQueryKey, "summary-stats"], [])

  return useQuery({
    queryKey,
    queryFn: () => clinicApi.getAllClinics(1, 1, {}),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

export function useInfiniteClinics(limit = 10, filters?: { search?: string; status?: boolean; isActive?: boolean; sortBy?: string }, enabled = true) {
  const queryKey = useMemo(() => [...clinicsQueryKey, "infinite", { limit, ...filters }], [limit, filters])

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => clinicApi.getAllClinics(pageParam as number, limit, filters),
    getNextPageParam: (lastPage: any) => {
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled,
    placeholderData: (previousData) => previousData,
  })
}

export function useClinic(id: string) {
  return useQuery({
    queryKey: ["clinic", id],
    queryFn: () => clinicApi.getClinicById(id),
    enabled: !!id,
  })
}

export function useCreateClinic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => clinicApi.createClinic(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicsQueryKey })
      toast.success("Clinic created successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to create clinic: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateClinic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      clinicApi.updateClinic(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: clinicsQueryKey })
      queryClient.invalidateQueries({ queryKey: ["clinic", id] })
      toast.success("Clinic updated successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to update clinic: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteClinic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => clinicApi.deleteClinic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicsQueryKey })
      toast.success("Clinic deleted successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to delete clinic: ${getApiErrorMessage(error)}`)
    },
  })
}
