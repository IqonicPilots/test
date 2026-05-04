"use client"

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import { doctorApi } from "@/services/doctor.service"
import type { Doctor, UpdateDoctorPayload, DoctorListResponse } from "@/types/doctor.types"

export const doctorsQueryKey = ["doctors"] as const

type UseDoctorsFilters = {
  clinicId?: string
  specialtyId?: string
  status?: "active" | "inactive"
  search?: string
  sort?: string
}

export function useDoctors(page = 1, limit = 10, enabled = true, filters?: UseDoctorsFilters) {
  const queryKey = useMemo(() => [...doctorsQueryKey, { page, limit, ...(filters || {}) }], [page, limit, filters])

  return useQuery<DoctorListResponse>({
    queryKey,
    queryFn: () => doctorApi.getAllDoctors(page, limit, filters),
    placeholderData: (previousData) => previousData,
    enabled,
  })
}

/** KPI row — role scope only (e.g. default clinic); omit table filters. */
export function useDoctorSummaryStats(
  filters?: Pick<UseDoctorsFilters, "clinicId">,
  options?: { enabled?: boolean }
) {
  const queryKey = useMemo(() => [...doctorsQueryKey, "summary-stats", filters ?? {}], [filters])

  return useQuery<DoctorListResponse>({
    queryKey,
    queryFn: () => doctorApi.getAllDoctors(1, 1, filters),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

export function useInfiniteDoctors(limit = 10, filters?: UseDoctorsFilters, enabled = true) {
  const queryKey = useMemo(() => [...doctorsQueryKey, "infinite", { limit, ...(filters || {}) }], [limit, filters])

  return useInfiniteQuery<DoctorListResponse>({
    queryKey,
    queryFn: ({ pageParam = 1 }) =>
      doctorApi.getAllDoctors(pageParam as number, limit, filters),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled,
    placeholderData: (previousData) => previousData,
  })
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: ["doctor", id],
    queryFn: () => doctorApi.getDoctorById(id),
    enabled: !!id,
  })
}

export function useCreateDoctor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => doctorApi.createDoctor(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorsQueryKey })
      toast.success("Doctor created successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to create doctor: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useEditDoctor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      doctorApi.updateDoctorWithFormData(id, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: doctorsQueryKey })
      queryClient.invalidateQueries({ queryKey: ["doctor", variables.id] })
      toast.success("Doctor updated successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to update doctor: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDoctorPayload }) =>
      doctorApi.updateDoctor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: doctorsQueryKey })
      queryClient.invalidateQueries({ queryKey: ["doctor", variables.id] })
      toast.success("Doctor updated successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to update doctor: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useToggleDoctorStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      doctorApi.updateDoctor(id, { isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: doctorsQueryKey })
      toast.success(
        variables.isActive ? "Doctor activated successfully." : "Doctor deactivated successfully."
      )
    },
    onError: (error) => {
      toast.error(`Failed to update doctor status: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => doctorApi.deleteDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorsQueryKey })
      toast.success("Doctor deleted successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to delete doctor: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDoctorsByClinic(clinicId: string, page = 1, limit = 10) {
  const queryKey = useMemo(() => ["doctors", { clinicId, page, limit }], [clinicId, page, limit])

  return useQuery<DoctorListResponse>({
    queryKey,
    queryFn: () => doctorApi.getDoctorsByClinic(clinicId, page, limit),
    enabled: !!clinicId,
    placeholderData: (previousData) => previousData,
  })
}
