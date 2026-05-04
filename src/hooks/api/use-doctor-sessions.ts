"use client"

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import {
  createDoctorSession,
  getDoctorSessions,
  getDoctorSessionsByDoctor,
  updateDoctorSession,
  getAppointmentBookSlots,
  getMonthAvailability,
  deleteDoctorSession,
} from "@/services/doctor-session.service"
import type { DoctorSessionPayload, AppointmentBookSlots, DoctorSessionListResponse } from "@/types/doctor-session.types"
import type { MonthAvailabilityDay } from "@/services/doctor-session.service"

export const doctorSessionsQueryKey = ["doctorSessions"] as const

type DoctorSessionMutationVariables = {
  clinicId: string
  doctorId: string
  data: DoctorSessionPayload
}

type UseDoctorSessionsFilters = {
  clinicId?: string
  doctorId?: string
  search?: string
}

export function useDoctorSessions(page = 1, limit = 10, filters?: UseDoctorSessionsFilters) {
  const queryKey = useMemo(() => [...doctorSessionsQueryKey, { page, limit, ...(filters || {}) }], [page, limit, filters])

  return useQuery<DoctorSessionListResponse>({
    queryKey,
    queryFn: () => getDoctorSessions(page, limit, filters),
    placeholderData: (previousData) => previousData,
  })
}

/** KPI row — role scope only (default clinic / doctor); omit search and user filters. */
export function useDoctorSessionsSummaryStats(
  filters?: Pick<UseDoctorSessionsFilters, "clinicId" | "doctorId">,
  options?: { enabled?: boolean }
) {
  const queryKey = useMemo(() => [...doctorSessionsQueryKey, "summary-stats", filters ?? {}], [filters])

  return useQuery<DoctorSessionListResponse>({
    queryKey,
    queryFn: () => getDoctorSessions(1, 1, filters),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

export function useInfiniteDoctorSessions(limit = 10, filters?: UseDoctorSessionsFilters, enabled = true) {
  const queryKey = useMemo(() => [...doctorSessionsQueryKey, "infinite", { limit, ...(filters || {}) }], [limit, filters])

  return useInfiniteQuery<DoctorSessionListResponse>({
    queryKey,
    queryFn: ({ pageParam = 1 }) =>
      getDoctorSessions(pageParam as number, limit, filters),
    getNextPageParam: (lastPage: DoctorSessionListResponse) => {
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled,
    placeholderData: (previousData) => previousData,
  })
}

export function useDoctorSessionsByDoctor(doctorId: string, page = 1, limit = 10) {
  const queryKey = useMemo(() => [...doctorSessionsQueryKey, "doctor", { doctorId, page, limit }], [doctorId, page, limit])

  return useQuery<DoctorSessionListResponse>({
    queryKey,
    queryFn: () => getDoctorSessionsByDoctor(doctorId, page, limit),
    enabled: Boolean(doctorId),
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateDoctorSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clinicId, doctorId, data }: DoctorSessionMutationVariables) =>
      createDoctorSession(clinicId, doctorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorSessionsQueryKey })
      queryClient.invalidateQueries({ queryKey: [...doctorSessionsQueryKey, "doctor"] })
      toast.success("Doctor session created successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to create doctor session: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateDoctorSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clinicId, doctorId, data }: DoctorSessionMutationVariables) =>
      updateDoctorSession(clinicId, doctorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorSessionsQueryKey })
      queryClient.invalidateQueries({ queryKey: [...doctorSessionsQueryKey, "doctor"] })
      toast.success("Doctor session updated successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to update doctor session: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteDoctorSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => deleteDoctorSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorSessionsQueryKey })
      toast.success("Doctor session deleted successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to delete doctor session: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useAppointmentBookSlots(params: {
  clinicId?: string
  doctorId?: string
  date?: string
  serviceId?: string
  enabled?: boolean
}) {
  const { clinicId, doctorId, date, serviceId, enabled = true } = params
  const queryKey = useMemo(() => [...doctorSessionsQueryKey, "book-slots", clinicId, doctorId, date, serviceId], [clinicId, doctorId, date, serviceId])

  return useQuery<AppointmentBookSlots>({
    queryKey,
    queryFn: async () => {
      if (!clinicId || !doctorId || !date || !serviceId) {
        return {
          date: date ?? "",
          totalSlots: 0,
          availableSlots: [],
        }
      }
      return getAppointmentBookSlots({ clinicId, doctorId, date, serviceId })
    },
    enabled: Boolean(enabled && clinicId && doctorId && date && serviceId),
  })
}

export function useDoctorMonthAvailability(params: {
  clinicId?: string
  doctorId?: string
  month?: number
  year?: number
  serviceId?: string
}) {
  const { clinicId, doctorId, month, year, serviceId } = params
  const queryKey = useMemo(() => [...doctorSessionsQueryKey, "month-availability", clinicId, doctorId, month, year, serviceId], [clinicId, doctorId, month, year, serviceId])

  return useQuery<MonthAvailabilityDay[]>({
    queryKey,
    queryFn: async () => {
      if (!clinicId || !doctorId || !month || !year) {
        throw new Error("Missing required parameters for month availability")
      }
      return getMonthAvailability({ clinicId, doctorId, month, year, serviceId })
    },
    enabled: Boolean(clinicId && doctorId && month && year),
  })
}
