"use client"

import { useCallback, useState } from "react"
import {
  TOTAL_STATUS_COUNT,
  type AppointmentTimeFilter,
  type AppointmentStatusFilter,
  type CalendarFiltersState,
} from "@/lib/calendar-filters"

const DEFAULT_FILTERS: CalendarFiltersState = {
  timeFilter: "upcoming",
  statusFilters: ["booked", "checked_in", "completed", "cancelled"],
  doctorIds: [],
  serviceIds: [],
}

export interface UseCalendarFiltersReturn {
  filters: CalendarFiltersState
  setTimeFilter: (value: AppointmentTimeFilter) => void
  setStatusFilter: (value: AppointmentStatusFilter, checked: boolean) => void
  setDoctorIds: (ids: string[]) => void
  setServiceIds: (ids: string[]) => void
  toggleDoctor: (id: string) => void
  toggleService: (id: string) => void
  selectAllDoctors: (allIds: string[]) => void
  selectAllServices: (allIds: string[]) => void
  clearDoctor: (id: string) => void
  clearService: (id: string) => void
  clearTimeFilter: () => void
  clearStatusFilter: (value: AppointmentStatusFilter) => void
  clearAllFilters: () => void
  hasActiveFilters: boolean
}

export function useCalendarFilters(
  initialFilters?: Partial<CalendarFiltersState>
): UseCalendarFiltersReturn {
  const [filters, setFilters] = useState<CalendarFiltersState>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  })

  const setTimeFilter = useCallback((value: AppointmentTimeFilter) => {
    setFilters((prev) => ({ ...prev, timeFilter: value }))
  }, [])

  const setStatusFilter = useCallback((value: AppointmentStatusFilter, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      statusFilters: checked
        ? [...prev.statusFilters, value]
        : prev.statusFilters.filter((f) => f !== value),
    }))
  }, [])

  const setDoctorIds = useCallback((ids: string[]) => {
    setFilters((prev) => ({ ...prev, doctorIds: ids }))
  }, [])

  const setServiceIds = useCallback((ids: string[]) => {
    setFilters((prev) => ({ ...prev, serviceIds: ids }))
  }, [])

  const toggleDoctor = useCallback((id: string) => {
    setFilters((prev) => ({
      ...prev,
      doctorIds: prev.doctorIds.includes(id)
        ? prev.doctorIds.filter((d) => d !== id)
        : [...prev.doctorIds, id],
    }))
  }, [])

  const toggleService = useCallback((id: string) => {
    setFilters((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(id)
        ? prev.serviceIds.filter((s) => s !== id)
        : [...prev.serviceIds, id],
    }))
  }, [])

  const selectAllDoctors = useCallback((allIds: string[]) => {
    setFilters((prev) => ({
      ...prev,
      doctorIds: prev.doctorIds.length === allIds.length ? [] : allIds,
    }))
  }, [])

  const selectAllServices = useCallback((allIds: string[]) => {
    setFilters((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.length === allIds.length ? [] : allIds,
    }))
  }, [])

  const clearDoctor = useCallback((id: string) => {
    setFilters((prev) => ({
      ...prev,
      doctorIds: prev.doctorIds.filter((d) => d !== id),
    }))
  }, [])

  const clearService = useCallback((id: string) => {
    setFilters((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.filter((s) => s !== id),
    }))
  }, [])

  const clearTimeFilter = useCallback(() => {
    setFilters((prev) => ({ ...prev, timeFilter: "upcoming" }))
  }, [])

  const clearStatusFilter = useCallback((value: AppointmentStatusFilter) => {
    setFilters((prev) => ({
      ...prev,
      statusFilters: prev.statusFilters.filter((f) => f !== value),
    }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const hasActiveFilters =
    filters.timeFilter !== "upcoming" ||
    filters.statusFilters.length < TOTAL_STATUS_COUNT ||
    filters.doctorIds.length > 0 ||
    filters.serviceIds.length > 0

  return {
    filters,
    setTimeFilter,
    setStatusFilter,
    setDoctorIds,
    setServiceIds,
    toggleDoctor,
    toggleService,
    selectAllDoctors,
    selectAllServices,
    clearDoctor,
    clearService,
    clearTimeFilter,
    clearStatusFilter,
    clearAllFilters,
    hasActiveFilters,
  }
}
