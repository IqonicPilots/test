"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"
import { endOfMonth, format, startOfMonth } from "date-fns"

import { Calendar } from "./calendar/components/calendar"
import { AppointmentActions } from "./components/appointment-actions"
import { AppointmentFormDialog } from "./components/appointment-form-dialog"
import { AppointmentViewDialog } from "./components/appointment-view-dialog"
import { Button } from "@/components/ui/button"
import { buildAvailabilityHeatmapMap } from "@/lib/calendar-availability"
import { mapAppointmentsToCalendarData } from "@/lib/map-appointments-to-calendar-events"
import { applyCalendarFilters } from "@/lib/calendar-filters"
import { getClinicIdFromProfile } from "@/lib/calendar-utils"
import { useCalendarFilters } from "@/hooks/use-calendar-filters"
import {
  useAppointments,
  useCreateAppointment,
  useDeleteAppointment,
  useUpdateAppointment,
  parsePaginatedData,
} from "@/hooks/use-appointments"
import { useAuthRole } from "@/hooks/use-auth-role"
import { useDoctorSessions } from "@/hooks/api/use-doctor-sessions"
import { useHolidays } from "@/hooks/api/use-holidays"
import { useProfile } from "@/hooks/api/use-profile"
import { useDoctors, useDoctorsByClinic } from "@/hooks/api/use-doctors"
import { useServices } from "@/hooks/api/use-services"
import type { Appointment, AppointmentPayload } from "@/services/appointment.service"
import type { CalendarEvent } from "@/types/calendar.types"
import type { DoctorSession } from "@/types/doctor-session.types"
import type { Holiday } from "@/services/holiday.service"
import { getReferenceId } from "@/lib/utils"

export function AppointmentsCalendarContent() {
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get("patientId") || undefined

  const { role } = useAuthRole()
  const { data: profile, isLoading: isProfileLoading } = useProfile()
  const createMutation = useCreateAppointment()
  const deleteMutation = useDeleteAppointment()
  const updateMutation = useUpdateAppointment()
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const isDoctor = role === "doctor"
  const currentUserId = profile?._id
  const clinicId = getClinicIdFromProfile(profile ?? null)

  // Compute role-based server-side filter params (same logic as list view)
  const roleFilters = useMemo(() => {
    if (!role) return {}
    const profileId = profile?._id
    if (role !== "admin" && !profileId) return {}
    if (role === 'patient') return { patientId: profileId }
    if (role === 'doctor') return { doctorId: profileId }
    if (role === 'receptionist') return { receptionist: profileId }
    if (role === 'clinic_admin') {
      const clinic = profile?.meta?.clinics?.[0]
      const cId = clinic ? (typeof clinic === 'string' ? clinic : clinic._id) : undefined
      return cId ? { clinicId: cId } : {}
    }
    return {} // admin sees all
  }, [role, profile])

  const areRoleFiltersReady = useMemo(() => {
    if (role === "admin") return true
    if (!profile?._id) return false
    if (role === "clinic_admin") {
      const clinic = profile.meta?.clinics?.[0]
      return Boolean(clinic)
    }
    return true
  }, [role, profile])

  const filterHook = useCalendarFilters(
    isDoctor && currentUserId ? { doctorIds: [currentUserId] } : undefined
  )

  const { data: appointmentResponse, isLoading, error } = useAppointments({
    month,
    year,
    perPage: 1000,
    ...roleFilters,
    patientId: initialPatientId || roleFilters.patientId,
    enabled: areRoleFiltersReady,
  })
  const { data: doctorSessionsResponse } = useDoctorSessions(1, 1000)
  const monthRange = useMemo(() => {
    const baseDate = new Date(year, month - 1)
    return {
      dateFrom: format(startOfMonth(baseDate), "yyyy-MM-dd"),
      dateTo: format(endOfMonth(baseDate), "yyyy-MM-dd"),
    }
  }, [month, year])
  const { data: doctorHolidaysResponse } = useHolidays({
    page: 1,
    perPage: 1000,
    category: "doctor",
    ...monthRange,
  })
  const { data: clinicHolidaysResponse } = useHolidays({
    page: 1,
    perPage: 1000,
    category: "clinic",
    ...monthRange,
  })
  const { data: doctorsByClinicResponse } = useDoctorsByClinic(clinicId ?? "", 1, 100)
  const { data: allDoctorsResponse } = useDoctors(1, 100, true, { status: "active" })

  // Compute service filter scope based on role:
  const servicesFilter = useMemo(() => {
    if (role === 'doctor') return { doctorId: profile?._id }
    if (role === 'receptionist' || role === 'clinic_admin') {
      const c = profile?.meta?.clinics?.[0]
      const cId = c ? (typeof c === 'string' ? c : c._id) : undefined
      return cId ? { clinicId: cId } : {}
    }
    return {}
  }, [role, profile])

  const { data: servicesSourceResponse } = useServices(1, 200, servicesFilter, areRoleFiltersReady)

  const appointments = useMemo(() => {
    if (!appointmentResponse) return []
    if (Array.isArray(appointmentResponse.data)) return appointmentResponse.data
    if (Array.isArray(appointmentResponse)) return appointmentResponse as Appointment[]
    return []
  }, [appointmentResponse])

  const doctorsResponse = clinicId ? doctorsByClinicResponse : allDoctorsResponse
  const doctors = useMemo(() => {
    const allDocs = parsePaginatedData<{ _id: string; firstName: string; lastName: string }>(doctorsResponse)
    if (isDoctor && currentUserId) {
      return allDocs.filter((doc) => doc._id === currentUserId)
    }
    return allDocs
  }, [doctorsResponse, isDoctor, currentUserId])


  const services = useMemo(
    () => parsePaginatedData<{ _id: string; name: string; duration?: number | string }>(servicesSourceResponse),
    [servicesSourceResponse]
  )
  const doctorSessions = useMemo(
    () => parsePaginatedData<DoctorSession>(doctorSessionsResponse),
    [doctorSessionsResponse]
  )
  const doctorHolidays = useMemo(
    () => doctorHolidaysResponse?.data ?? [],
    [doctorHolidaysResponse]
  )
  const clinicHolidays = useMemo(
    () => clinicHolidaysResponse?.data ?? [],
    [clinicHolidaysResponse]
  )

  const { events: allCalendarEvents, eventDates } = useMemo(
    () => mapAppointmentsToCalendarData(appointments),
    [appointments]
  )

  const calendarEvents = useMemo(
    () => applyCalendarFilters(allCalendarEvents, filterHook.filters),
    [allCalendarEvents, filterHook.filters]
  )
  const availabilityEvents = useMemo(
    () =>
      applyCalendarFilters(allCalendarEvents, {
        ...filterHook.filters,
        timeFilter: "all",
        statusFilters: ["booked", "checked_in", "completed", "cancelled"],
      }),
    [allCalendarEvents, filterHook.filters]
  )
  const availabilityAppointments = useMemo(
    () =>
      availabilityEvents
        .map((event) => event.original)
        .filter((appointment): appointment is Appointment => Boolean(appointment)),
    [availabilityEvents]
  )
  const doctorIdsInScope = useMemo(() => {
    if (filterHook.filters.doctorIds.length > 0) {
      return filterHook.filters.doctorIds
    }
    if (isDoctor && currentUserId) {
      return [currentUserId]
    }
    return []
  }, [filterHook.filters.doctorIds, isDoctor, currentUserId])
  const clinicIdsInScope = useMemo(() => {
    if (clinicId) {
      return [clinicId]
    }

    const appointmentClinicIds = availabilityAppointments
      .map((appointment) => getReferenceId(appointment.clinic ?? appointment.clinicId))
      .filter((value): value is string => Boolean(value))

    return Array.from(new Set(appointmentClinicIds))
  }, [availabilityAppointments, clinicId])
  const selectedServiceDuration = useMemo(() => {
    if (filterHook.filters.serviceIds.length !== 1) {
      return undefined
    }

    const selectedService = services.find(
      (service) => service._id === filterHook.filters.serviceIds[0]
    )
    const parsedDuration = Number(selectedService?.duration)

    return Number.isFinite(parsedDuration) && parsedDuration > 0
      ? parsedDuration
      : undefined
  }, [filterHook.filters.serviceIds, services])
  const availabilityHolidays = useMemo(
    () =>
      [...doctorHolidays, ...clinicHolidays].filter((holiday): holiday is Holiday => Boolean(holiday)),
    [clinicHolidays, doctorHolidays]
  )
  const availabilityByDate = useMemo(
    () =>
      buildAvailabilityHeatmapMap(month, year, availabilityAppointments, doctorSessions, {
        holidays: availabilityHolidays,
        serviceDuration: selectedServiceDuration,
        doctorIds: doctorIdsInScope,
        clinicIds: clinicIdsInScope,
      }),
    [
      month,
      year,
      availabilityAppointments,
      doctorSessions,
      availabilityHolidays,
      selectedServiceDuration,
      doctorIdsInScope,
      clinicIdsInScope,
    ]
  )

  const handleAddAppointment = useCallback(
    async (data: AppointmentPayload) => {
      return createMutation.mutateAsync(data).catch((err) => {
        if (process.env.NODE_ENV === "development") console.error("Error:", err)
        return undefined
      })
    },
    [createMutation]
  )

  const handleMonthChange = useCallback((nextMonth: number, nextYear: number) => {
    setMonth(nextMonth)
    setYear(nextYear)
  }, [])

  const handleUpdateAppointment = useCallback(
    async (id: string, data: Partial<AppointmentPayload>) => {
      const result = await updateMutation.mutateAsync({ id, data }).catch((err) => {
        if (process.env.NODE_ENV === "development") console.error("Error:", err)
        return null
      })

      // Update the selected appointment with the returned data if it exists
      if (result && selectedAppointment?._id === id) {
        setSelectedAppointment(result)
      }
    },
    [updateMutation, selectedAppointment?._id]
  )

  const handleDeleteAppointment = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id).catch((err) => {
        if (process.env.NODE_ENV === "development") console.error("Error:", err)
      })
      setIsViewOpen(false)
      setSelectedAppointment(null)
    },
    [deleteMutation]
  )

  const handleEventClick = useCallback((event: CalendarEvent) => {
    if (!event.original) return
    setSelectedAppointment(event.original)
    setIsViewOpen(true)
  }, [])

  if (error) {
    return <div className="px-4 py-8 text-red-500 lg:px-6">Error loading appointments</div>
  }

  return (
    <>
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground">Manage and track all patient appointments efficiently.</p>
      </div>

      <div className="mt-4 px-4 lg:px-6">
        <Calendar
          filters={filterHook}
          doctors={doctors}
          services={services}
          isDoctor={isDoctor}
          events={calendarEvents}
          eventDates={eventDates}
          availabilityByDate={availabilityByDate}
          doctorSessions={doctorSessions}
          onEventClick={handleEventClick}
          addAppointmentTrigger={
            <AppointmentFormDialog
              onAddAppointment={handleAddAppointment}
              trigger={
                <Button className="w-full cursor-pointer" type="button">
                  <Plus className="h-4 w-4" />
                  Add Appointment
                </Button>
              }
            />
          }
          onMonthChange={handleMonthChange}
        />

        {isLoading || (!areRoleFiltersReady && isProfileLoading) ? (
          <div className="py-4 text-sm text-muted-foreground">Loading appointments...</div>
        ) : null}
      </div>

      {selectedAppointment && (
        <AppointmentViewDialog
          appointment={selectedAppointment}
          isOpen={isViewOpen}
          onOpenChange={(value) => {
            setIsViewOpen(value)
            if (!value) setSelectedAppointment(null)
          }}
          footer={
            <AppointmentActions
              appointment={selectedAppointment}
              variant="dialog"
              onAddAppointment={handleAddAppointment}
              onUpdateAppointment={handleUpdateAppointment}
              onDeleteAppointment={handleDeleteAppointment}
            />
          }
        />
      )}
    </>
  )
}
