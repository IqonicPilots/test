"use client"

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import {
  createReceptionist,
  getReceptionists,
  updateReceptionist,
  deleteUser,
} from "@/services/user.service"
import type { UserListApiResponse, Receptionist } from "@/types/user.types"

export const receptionistsQueryKey = ["receptionists"] as const

type UseReceptionistsFilters = {
  clinicId?: string
  status?: "active" | "inactive"
  search?: string
}

export function useReceptionists(page = 1, limit = 10, filters?: UseReceptionistsFilters) {
  const queryKey = useMemo(() => [...receptionistsQueryKey, { page, limit, ...(filters || {}) }], [page, limit, filters])

  return useQuery<UserListApiResponse<Receptionist>>({
    queryKey,
    queryFn: () => getReceptionists(page, limit, filters),
    placeholderData: (previousData) => previousData,
  })
}

/** KPI row — default clinic scope only; omit status/search filters. */
export function useReceptionistSummaryStats(
  filters?: Pick<UseReceptionistsFilters, "clinicId">,
  options?: { enabled?: boolean }
) {
  const queryKey = useMemo(() => [...receptionistsQueryKey, "summary-stats", filters ?? {}], [filters])

  return useQuery<UserListApiResponse<Receptionist>>({
    queryKey,
    queryFn: () => getReceptionists(1, 1, filters),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

export function useInfiniteReceptionists(limit = 10, filters?: UseReceptionistsFilters) {
  const queryKey = useMemo(() => [...receptionistsQueryKey, "infinite", { limit, ...(filters || {}) }], [limit, filters])

  return useInfiniteQuery<UserListApiResponse<Receptionist>>({
    queryKey,
    queryFn: ({ pageParam = 1 }) => getReceptionists(pageParam as number, limit, filters),
    getNextPageParam: (lastPage: UserListApiResponse<Receptionist>) => {
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateReceptionist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => createReceptionist(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receptionistsQueryKey })
      toast.success("Receptionist created successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to create receptionist: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateReceptionist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => updateReceptionist(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: receptionistsQueryKey })
      queryClient.invalidateQueries({ queryKey: ["receptionist", variables.id] })
      toast.success("Receptionist updated successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to update receptionist: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteReceptionist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receptionistsQueryKey })
      toast.success("Receptionist deleted successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to delete receptionist: ${getApiErrorMessage(error)}`)
    },
  })
}
