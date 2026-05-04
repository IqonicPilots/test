"use client"

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"

export function parsePaginatedData<T>(response: unknown): T[] {
  if (!response || typeof response !== "object") return []
  const r = response as Record<string, unknown>
  const data = r.data ?? r.list
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === "object" && "data" in data) {
    const inner = (data as Record<string, unknown>).data
    if (Array.isArray(inner)) return inner as T[]
  }
  return []
}
import { appointmentService, type AppointmentListResponse, type AppointmentPayload } from "@/services/appointment.service"
import type { Appointment } from "@/types/appointment.types"
import { getReferenceId } from "@/lib/utils"

export type UseAppointmentsParams = {
  page?: number
  perPage?: number
  month?: number
  year?: number
  date?: Date | string
  doctorId?: string
  clinicId?: string
  serviceId?: string
  status?: string
  search?: string
  patientId?: string
  receptionist?: string
  clinicAdmin?: string
  timeframe?: string
  upcoming?: boolean
  enabled?: boolean
}

type NormalizedAppointmentsParams = {
  page: number
  perPage: number
  month?: number
  year?: number
  date?: string
  doctorId?: string
  clinicId?: string
  serviceId?: string
  status?: string
  search?: string
  patientId?: string
  receptionist?: string
  clinicAdmin?: string
  timeframe?: string
  upcoming?: boolean
  usesClientFilters: boolean
}

export function parseScheduleDate(value?: string) {
  if (!value) return null

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const [, year, month, day] = match
    return new Date(Number(year), Number(month) - 1, Number(day), 12)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12)
}

function normalizeDateFilter(date?: Date | string) {
  if (!date) return undefined

  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, "0")
  const day = String(parsed.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function normalizeAppointmentsParams(params: UseAppointmentsParams): NormalizedAppointmentsParams {
  const monthYearValid =
    (params.month == null && params.year == null) ||
    (params.month != null && params.year != null)
  const normalizedDate = normalizeDateFilter(params.date)
  const usesClientFilters = Boolean(
    normalizedDate ||
    (monthYearValid && params.month != null && params.year != null)
  )

  return {
    page: params.page ?? 1,
    perPage: params.perPage ?? 10,
    month: params.month,
    year: params.year,
    date: normalizedDate,
    doctorId: params.doctorId,
    clinicId: params.clinicId,
    serviceId: params.serviceId,
    status: params.status,
    search: params.search?.trim(),
    patientId: params.patientId,
    receptionist: params.receptionist,
    clinicAdmin: params.clinicAdmin,
    timeframe: params.timeframe,
    upcoming: params.upcoming,
    usesClientFilters,
  }
}

function createAppointmentsQueryKey(params: NormalizedAppointmentsParams) {
  return [
    "appointments",
    {
      page: params.page,
      perPage: params.perPage,
      month: params.month ?? null,
      year: params.year ?? null,
      date: params.date ?? null,
      doctorId: params.doctorId ?? null,
      clinicId: params.clinicId ?? null,
      serviceId: params.serviceId ?? null,
      status: params.status ?? null,
      search: params.search ?? null,
      patientId: params.patientId ?? null,
      receptionist: params.receptionist ?? null,
      clinicAdmin: params.clinicAdmin ?? null,
      timeframe: params.timeframe ?? null,
      upcoming: params.upcoming ?? false,
    },
  ] as const
}

function matchesMonthFilter(appointment: Appointment, month?: number, year?: number) {
  if (month == null || year == null) return true

  const scheduleDate = parseScheduleDate(appointment.schedule?.startDate)
  if (!scheduleDate) return false

  return scheduleDate.getMonth() + 1 === month && scheduleDate.getFullYear() === year
}

export function useAppointments(params: UseAppointmentsParams = {}) {
  const normalizedParams = useMemo(() => normalizeAppointmentsParams(params), [params])
  const isEnabled = params.enabled ?? true
  const monthYearValid =
    (normalizedParams.month == null && normalizedParams.year == null) ||
    (normalizedParams.month != null && normalizedParams.year != null)

  const queryKey = useMemo(() => createAppointmentsQueryKey(normalizedParams), [normalizedParams])

  return useQuery<AppointmentListResponse, Error>({
    queryKey,
    queryFn: async () => {
      // Build server-side filters (role-based + any explicit id filters)
      const serverFilters: Record<string, string | undefined> = {}
      if (normalizedParams.doctorId) serverFilters.doctorId = normalizedParams.doctorId
      if (normalizedParams.clinicId) serverFilters.clinicId = normalizedParams.clinicId
      if (normalizedParams.serviceId) serverFilters.serviceId = normalizedParams.serviceId
      if (normalizedParams.status) serverFilters.status = normalizedParams.status
      if (normalizedParams.search) serverFilters.search = normalizedParams.search
      if (normalizedParams.patientId) serverFilters.patientId = normalizedParams.patientId
      if (normalizedParams.receptionist) serverFilters.receptionist = normalizedParams.receptionist
      if (normalizedParams.clinicAdmin) serverFilters.clinicAdmin = normalizedParams.clinicAdmin
      if (normalizedParams.timeframe) serverFilters.timeframe = normalizedParams.timeframe
      if (normalizedParams.date) serverFilters.date = normalizedParams.date
      if (normalizedParams.upcoming) serverFilters.upcoming = "true"

      const response = await appointmentService.getAllAppointments(
        normalizedParams.page,
        normalizedParams.perPage,
        "createdAt",
        "desc",
        serverFilters
      )

      if (!normalizedParams.usesClientFilters) {
        return response
      }

      // Client-side month/year filtering (date is already handled server-side)
      const allAppointments = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response) ? response : [])

      const filteredAppointments = allAppointments.filter((a) =>
        matchesMonthFilter(a, normalizedParams.month, normalizedParams.year)
      )

      return {
        ...response,
        data: filteredAppointments,
        pagination: {
          total: filteredAppointments.length,
          page: normalizedParams.page,
          perPage: normalizedParams.perPage,
          totalPages: filteredAppointments.length > 0
            ? Math.ceil(filteredAppointments.length / normalizedParams.perPage)
            : 1,
        },
      }
    },
    enabled: isEnabled && monthYearValid && (!params.date || Boolean(normalizedParams.date)),
    placeholderData: (previousData) => previousData,
  })
}

export function useInfiniteAppointments(params: UseAppointmentsParams = {}) {
  const normalizedParams = useMemo(() => normalizeAppointmentsParams(params), [params])
  const isEnabled = params.enabled ?? true
  const monthYearValid =
    (normalizedParams.month == null && normalizedParams.year == null) ||
    (normalizedParams.month != null && normalizedParams.year != null)

  const queryKey = useMemo(() => ["infinite-appointments", { ...normalizedParams, perPage: normalizedParams.perPage }], [normalizedParams])

  return useInfiniteQuery<AppointmentListResponse, Error>({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const serverFilters: Record<string, string | undefined> = {}
      if (normalizedParams.doctorId) serverFilters.doctorId = normalizedParams.doctorId
      if (normalizedParams.clinicId) serverFilters.clinicId = normalizedParams.clinicId
      if (normalizedParams.serviceId) serverFilters.serviceId = normalizedParams.serviceId
      if (normalizedParams.status) serverFilters.status = normalizedParams.status
      if (normalizedParams.search) serverFilters.search = normalizedParams.search
      if (normalizedParams.patientId) serverFilters.patientId = normalizedParams.patientId
      if (normalizedParams.receptionist) serverFilters.receptionist = normalizedParams.receptionist
      if (normalizedParams.clinicAdmin) serverFilters.clinicAdmin = normalizedParams.clinicAdmin
      if (normalizedParams.timeframe) serverFilters.timeframe = normalizedParams.timeframe
      if (normalizedParams.date) serverFilters.date = normalizedParams.date
      if (normalizedParams.upcoming) serverFilters.upcoming = "true"

      return appointmentService.getAllAppointments(
        pageParam as number,
        normalizedParams.perPage,
        "createdAt",
        "desc",
        serverFilters
      )
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled: isEnabled && monthYearValid && (!params.date || Boolean(normalizedParams.date)),
    placeholderData: (previousData) => previousData,
  })
}

function resolveAppointmentQueryId(id: string | null | undefined): string {
  if (id == null) return ""
  const s = String(id).trim()
  return s.length > 0 ? s : ""
}

/**
 * Fetches a single appointment by id. Query stays idle until `id` is a non-empty string
 * (pass `null`/`undefined`/"" when nothing is selected — no network request).
 */
export function useAppointment(id: string | null | undefined, options?: { enabled?: boolean }) {
  const idStr = resolveAppointmentQueryId(id)
  const userEnabled = options?.enabled ?? true
  return useQuery({
    queryKey: ["appointment", idStr],
    queryFn: () => appointmentService.getAppointmentById(idStr),
    enabled: Boolean(idStr) && userEnabled,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AppointmentPayload) => appointmentService.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["infinite-appointments"] })
      toast.success("Appointment booked successfully")
    },
    onError: (error) => {
      toast.error(`Failed to book appointment: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AppointmentPayload> }) =>
      appointmentService.updateAppointment(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["infinite-appointments"] })
      queryClient.invalidateQueries({ queryKey: ["appointment", id] })
      toast.success("Appointment updated successfully")
      return data
    },
    onError: (error) => {
      toast.error(`Failed to update appointment: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => appointmentService.deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["infinite-appointments"] })
      toast.success("Appointment deleted successfully")
    },
    onError: (error) => {
      toast.error(`Failed to delete appointment: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useBookSlots(params: { clinicId: string; doctorId: string; date: string; serviceId: string[] }) {
  const queryKey = useMemo(() => ["book-slots", params], [params])
  return useQuery({
    queryKey,
    queryFn: () => appointmentService.getBookSlots(params),
    enabled: Boolean(params.clinicId && params.doctorId && params.date && params.serviceId.length > 0),
  })
}

export function useMonthAvailability(params: {
  clinicId: string
  doctorId: string
  month: number
  year: number
  serviceId: string
}) {
  const queryKey = useMemo(() => ["month-availability", params], [params])
  return useQuery({
    queryKey,
    queryFn: () => appointmentService.getMonthAvailability(params),
    enabled: Boolean(params.clinicId && params.doctorId && params.month && params.year && params.serviceId),
  })
}

export function useRegenerateTelemedLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => appointmentService.regenerateTelemedLink(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(["appointment", id], data)
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["infinite-appointments"] })
      toast.success("Telemedicine link regenerated successfully")
    },
    onError: (error) => {
      toast.error(`Failed to regenerate telemedicine link: ${getApiErrorMessage(error)}`)
    },
  })
}
