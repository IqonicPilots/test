"use client"

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import {
  createPatient,
  getPatients,
  updatePatient,
  deleteUser,
} from "@/services/user.service"
import type { UserListApiResponse, Patient } from "@/types/user.types"

export const patientsQueryKey = ["patients"] as const

export function usePatients(page = 1, limit = 10, filters?: { search?: string; status?: "active" | "inactive"; startDate?: string; endDate?: string }) {
  const queryKey = useMemo(() => [...patientsQueryKey, { page, limit, ...filters }], [page, limit, filters])

  return useQuery<UserListApiResponse<Patient>>({
    queryKey,
    queryFn: () => getPatients(page, limit, filters?.search, filters?.status, filters?.startDate, filters?.endDate),
    placeholderData: (previousData) => previousData,
  })
}

export function useInfinitePatients(limit = 10, filters?: { search?: string; status?: "active" | "inactive"; startDate?: string; endDate?: string }, enabled = true) {
  const queryKey = useMemo(() => [...patientsQueryKey, "infinite", { limit, ...filters }], [limit, filters])

  return useInfiniteQuery<UserListApiResponse<Patient>>({
    queryKey,
    queryFn: ({ pageParam = 1 }) => getPatients(
      pageParam as number,
      limit,
      filters?.search,
      filters?.status,
      filters?.startDate,
      filters?.endDate
    ),
    getNextPageParam: (lastPage: UserListApiResponse<Patient>) => {
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled,
    placeholderData: (previousData) => previousData,
  })
}

export function useCreatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, quiet }: { data: FormData; quiet?: boolean }) => createPatient(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: patientsQueryKey })
      if (!variables.quiet) {
        toast.success("Patient created successfully.")
      }
    },
    onError: (error) => {
      toast.error(`Failed to create patient: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => updatePatient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: patientsQueryKey })
      queryClient.invalidateQueries({ queryKey: ["patient", variables.id] })
      toast.success("Patient updated successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to update patient: ${getApiErrorMessage(error)}`)
    },
  })
}
export function useDeletePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientsQueryKey })
      toast.success("Patient deleted successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to delete patient: ${getApiErrorMessage(error)}`)
    },
  })
}
