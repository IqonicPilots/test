"use client"

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import { serviceApi } from "@/services/service.service"
import type { Service, ServiceListResponse } from "@/types/service.types"

export const servicesQueryKey = ["services"] as const

type UseServicesFilters = {
  clinicId?: string
  doctorId?: string
  categoryId?: string
  status?: "active" | "inactive"
  search?: string
}

export function useServices(page = 1, limit = 10, filters?: UseServicesFilters, enabled = true) {
  const queryKey = useMemo(() => [...servicesQueryKey, { page, limit, ...(filters || {}) }], [page, limit, filters])

  return useQuery<ServiceListResponse>({
    queryKey,
    queryFn: () =>
      serviceApi.getAllServices(page, limit, {
        clinicId: filters?.clinicId,
        doctorId: filters?.doctorId,
        categoryId: filters?.categoryId,
        status: filters?.status,
        search: filters?.search,
      }),
    placeholderData: (previousData) => previousData,
    enabled,
  })
}

/** KPI totals for the page — pass only role scope (no table filters). Invalidates with `servicesQueryKey`. */
export function useServiceSummaryStats(
  filters?: Pick<UseServicesFilters, "clinicId" | "doctorId">,
  options?: { enabled?: boolean }
) {
  const queryKey = useMemo(() => [...servicesQueryKey, "summary-stats", filters ?? {}], [filters])

  return useQuery<ServiceListResponse>({
    queryKey,
    queryFn: () =>
      serviceApi.getAllServices(1, 1, {
        clinicId: filters?.clinicId,
        doctorId: filters?.doctorId,
      }),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

export function useInfiniteServices(limit = 10, filters?: UseServicesFilters, enabled = true) {
  const queryKey = useMemo(() => [...servicesQueryKey, "infinite", { limit, ...(filters || {}) }], [limit, filters])

  return useInfiniteQuery<ServiceListResponse>({
    queryKey,
    queryFn: ({ pageParam = 1 }) =>
      serviceApi.getAllServices(pageParam as number, limit, filters),
    getNextPageParam: (lastPage: ServiceListResponse) => {
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled,
    placeholderData: (previousData) => previousData,
  })
}

export function useServicesByFilter(
  clinicId?: string,
  doctorId?: string,
  page = 1,
  limit = 50,
  enabled = true
) {
  const queryKey = useMemo(() => ["services", { clinicId, doctorId, page, limit }], [clinicId, doctorId, page, limit])

  return useQuery<ServiceListResponse>({
    queryKey,
    queryFn: () => serviceApi.getAllServices(page, limit, { clinic: clinicId, doctor: doctorId }),
    enabled: Boolean(enabled && clinicId && doctorId),
    placeholderData: (previousData) => previousData,
  })
}

export function useService(id: string) {
  return useQuery<Service>({
    queryKey: ["service", id],
    queryFn: () => serviceApi.getServiceById(id),
    enabled: !!id,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => serviceApi.createService(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicesQueryKey })
      toast.success("Service created successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to create service: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useEditService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      serviceApi.updateService(id, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: servicesQueryKey })
      queryClient.invalidateQueries({ queryKey: ["service", variables.id] })
      toast.success("Service updated successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to update service: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => serviceApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicesQueryKey })
      toast.success("Service deleted successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to delete service: ${getApiErrorMessage(error)}`)
    },
  })
}
