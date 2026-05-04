import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowUp, CalendarDays, LogIn, LogOut, Loader2, XCircle } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

import { DataTable } from "./components/data-table"
import { getColumns } from "./components/columns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatValueSkeleton } from "@/components/dashboard-page-skeleton"
import {
  useAppointments,
  useInfiniteAppointments,
  useDeleteAppointment,
  useCreateAppointment,
  useUpdateAppointment,
} from "@/hooks/use-appointments"
import type { AppointmentPayload } from "@/services/appointment.service"
import { useAuthRole } from "@/hooks/use-auth-role"
import { useProfile } from "@/hooks/api/use-profile"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"
import { useInfiniteClinics } from "@/hooks/api/use-clinics"
import { useInfiniteDoctors } from "@/hooks/api/use-doctors"
import { useInfinitePatients } from "@/hooks/api/use-patients"
import { useInfiniteServices } from "@/hooks/api/use-services"

export function AppointmentListContent() {
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get("patientId") || ""
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [filterType, setFilterType] = useState("Upcoming")
  const [clinicFilter, setClinicFilter] = useState("")
  const [doctorFilter, setDoctorFilter] = useState("")
  const [patientFilter, setPatientFilter] = useState(initialPatientId)
  const [serviceFilter, setServiceFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const [clinicSearch, setClinicSearch] = useState("")
  const [doctorSearch, setDoctorSearch] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [serviceSearch, setServiceSearch] = useState("")
  const [debouncedClinicSearch, setDebouncedClinicSearch] = useState("")
  const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState("")
  const [debouncedPatientSearch, setDebouncedPatientSearch] = useState("")
  const [debouncedServiceSearch, setDebouncedServiceSearch] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setDebouncedClinicSearch(clinicSearch.trim()), 350)
    return () => clearTimeout(t)
  }, [clinicSearch])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDoctorSearch(doctorSearch.trim()), 350)
    return () => clearTimeout(t)
  }, [doctorSearch])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPatientSearch(patientSearch.trim()), 350)
    return () => clearTimeout(t)
  }, [patientSearch])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedServiceSearch(serviceSearch.trim()), 350)
    return () => clearTimeout(t)
  }, [serviceSearch])

  const { role } = useAuthRole()
  const { data: profile, isLoading: isProfileLoading } = useProfile()
  const { formatCurrencyCompact } = useCurrencyFormatter(true)

  // Compute role-based server-side filter params
  const roleFilters = useMemo(() => {
    if (!role) return {}
    const profileId = profile?._id
    if (role !== "admin" && !profileId) return {}
    if (role === 'patient') return { patientId: profileId }
    if (role === 'doctor') return { doctorId: profileId }
    if (role === 'receptionist') return { receptionist: profileId }
    if (role === 'clinic_admin') {
      const clinic = profile?.meta?.clinics?.[0]
      const clinicId = clinic ? (typeof clinic === 'string' ? clinic : clinic._id) : undefined
      return clinicId ? { clinicId } : {}
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

  const queryClient = useQueryClient()

  // Invalidate and refetch whenever any filter changes to ensure fresh data and reset to page 1
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["appointments"] })
    queryClient.invalidateQueries({ queryKey: ["infinite-appointments"] })
  }, [
    clinicFilter,
    doctorFilter,
    patientFilter,
    serviceFilter,
    statusFilter,
    searchQuery,
    filterType,
    queryClient
  ])

  const {
    data: response,
    isLoading,
    isFetching,
    error,
  } = useAppointments({
    page,
    perPage,
    ...roleFilters,
    clinicId: clinicFilter || roleFilters.clinicId,
    doctorId: doctorFilter || roleFilters.doctorId,
    patientId: patientFilter || roleFilters.patientId,
    serviceId: serviceFilter || undefined,
    status: statusFilter || undefined,
    search: searchQuery.trim() || undefined,
    timeframe: filterType && filterType !== "All" ? filterType.toLowerCase() : undefined,
    clinicAdmin: role === "clinic_admin" ? profile?._id : undefined,
    enabled: areRoleFiltersReady,
  })

  const {
    data: summaryResponse,
    isLoading: isSummaryLoading,
  } = useAppointments({
    page: 1,
    perPage: 1,
    ...roleFilters,
    clinicAdmin: role === "clinic_admin" ? profile?._id : undefined,
    enabled: areRoleFiltersReady,
  })

  const statsResponse = summaryResponse?.stats || response?.stats

  const {
    data: clinicsInfiniteData,
    fetchNextPage: fetchNextClinicsPage,
    hasNextPage: hasNextClinicsPage,
    isFetchingNextPage: isFetchingNextClinicsPage,
    isLoading: isClinicsLoading,
  } = useInfiniteClinics(10, { search: debouncedClinicSearch })

  const {
    data: doctorsInfiniteData,
    fetchNextPage: fetchNextDoctorsPage,
    hasNextPage: hasNextDoctorsPage,
    isFetchingNextPage: isFetchingNextDoctorsPage,
    isLoading: isDoctorsLoading,
  } = useInfiniteDoctors(10, {
    clinicId: clinicFilter || undefined,
    search: debouncedDoctorSearch,
    status: "active",
  })

  const {
    data: patientsInfiniteData,
    fetchNextPage: fetchNextPatientsPage,
    hasNextPage: hasNextPatientsPage,
    isFetchingNextPage: isFetchingNextPatientsPage,
    isLoading: isPatientsLoading,
  } = useInfinitePatients(10, { search: debouncedPatientSearch })

  const {
    data: servicesInfiniteData,
    fetchNextPage: fetchNextServicesPage,
    hasNextPage: hasNextServicesPage,
    isFetchingNextPage: isFetchingNextServicesPage,
    isLoading: isServicesLoading,
  } = useInfiniteServices(10, {
    clinicId: clinicFilter || undefined,
    doctorId: doctorFilter || undefined,
    search: debouncedServiceSearch,
  })

  const appointments = useMemo(() => {
    if (!response) return []
    if (Array.isArray(response.data)) return response.data
    if (Array.isArray(response)) return response as any[]
    return []
  }, [response])

  const clinics = useMemo(() => {
    if (!clinicsInfiniteData) return []
    return clinicsInfiniteData.pages.flatMap((page) => page.data || [])
  }, [clinicsInfiniteData])

  const doctors = useMemo(() => {
    if (!doctorsInfiniteData) return []
    return doctorsInfiniteData.pages.flatMap((page) => page.data || [])
  }, [doctorsInfiniteData])

  const patients = useMemo(() => {
    if (!patientsInfiniteData) return []
    return patientsInfiniteData.pages.flatMap((page) => page.data || [])
  }, [patientsInfiniteData])

  const services = useMemo(() => {
    if (!servicesInfiniteData) return []
    return servicesInfiniteData.pages.flatMap((page) => page.data || [])
  }, [servicesInfiniteData])

  const pagination = response?.pagination

  const deleteMutation = useDeleteAppointment()
  const createMutation = useCreateAppointment()
  const updateMutation = useUpdateAppointment()
  const handleAddAppointment = async (data: AppointmentPayload) => {
    return createMutation.mutateAsync(data).catch(() => undefined)
  }

  const handleDeleteAppointment = async (id: string) => {
    await deleteMutation.mutateAsync(id).catch(() => undefined)
  }

  const handleUpdateAppointment = async (id: string, data: Partial<AppointmentPayload>) => {
    await updateMutation.mutateAsync({ id, data }).catch(() => undefined)
  }

  const handleTimeframeChange = (value: string) => {
    setPage(1)
    setFilterType(value)
  }

  const handleClinicFilterChange = (value: string) => {
    setPage(1)
    setClinicFilter(value)
  }

  const handleStatusFilterChange = (value: string) => {
    setPage(1)
    setStatusFilter(value)
  }

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleDoctorFilterChange = (value: string) => {
    setDoctorFilter(value)
  }

  const handlePatientFilterChange = (value: string) => {
    setPatientFilter(value)
  }

  const handleServiceFilterChange = (value: string) => {
    setServiceFilter(value)
  }

  const columns = useMemo(
    () =>
      getColumns({
        onDeleteAppointment: handleDeleteAppointment,
        onAddAppointment: handleAddAppointment,
        onUpdateAppointment: handleUpdateAppointment,
        formatCurrency: formatCurrencyCompact,
        role: role || undefined,
      }),
    [handleDeleteAppointment, handleAddAppointment, handleUpdateAppointment, formatCurrencyCompact, role]
  )

  const stats = useMemo(() => {
    // Priority 1: Use server-provided global stats
    if (statsResponse) {
      const s = statsResponse
      const getPct = (count: number) => (s.total > 0 ? Math.round((count / s.total) * 100) : 0)
      return {
        total: s.total,
        checkIn: s.checkIn,
        checkOut: s.checkout,
        cancelled: s.cancelled,
        checkInPct: getPct(s.checkIn),
        checkOutPct: getPct(s.checkout),
        cancelledPct: getPct(s.cancelled),
      }
    }

    // Priority 2: Fallback to calculation
    const total = pagination?.total || appointments.length
    const checkIn = appointments.filter((a) => a.status?.id === "check_in" || a.status?.id === "check-in").length
    const checkOut = appointments.filter((a) => {
      const id = a.status?.id?.toLowerCase() || ""
      return id === "check_out" || id === "checkout" || id === "chekout" || id === "check-out" || id === "chek out"
    }).length
    const cancelled = appointments.filter((a) => a.status?.id === "cancelled").length

    const getPct = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0)

    return {
      total,
      checkIn,
      checkOut,
      cancelled,
      checkInPct: getPct(checkIn),
      checkOutPct: getPct(checkOut),
      cancelledPct: getPct(cancelled),
    }
  }, [appointments, pagination, statsResponse])

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">Error loading appointments</div>
  }

  // Only show skeleton on initial load (no data yet), not on background refetches.
  // This prevents table rows/images from reloading when filter dropdowns scroll.
  const isTableLoading = (isLoading && !appointments.length) || (!areRoleFiltersReady && isProfileLoading)
  const isSummaryCardsLoading = isSummaryLoading || (!areRoleFiltersReady && isProfileLoading)

  return (
    <>
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground">
          {role === "doctor"
            ? "Manage and track all your patient appointments efficiently."
            : role === "patient"
              ? "View, schedule, and track all your medical appointments effortlessly."
              : "Manage and track all patient appointments efficiently."}
        </p>
      </div>

      <div className="flex h-full min-w-0 w-full flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Appointments</p>
                  {isSummaryCardsLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.total}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        100%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <CalendarDays className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Check In</p>
                  {isSummaryCardsLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.checkIn}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {stats.checkInPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <LogIn className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Check Out</p>
                  {isSummaryCardsLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.checkOut}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {stats.checkOutPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <LogOut className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Cancelled</p>
                  {isSummaryCardsLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.cancelled}</span>
                      <span className="flex items-center gap-0.5 text-sm text-orange-500">
                        <ArrowUp className="size-3.5" />
                        {stats.cancelledPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <XCircle className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Appointments</CardTitle>
            <CardDescription>View, filter, and manage all your appointments in one place</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={appointments}
              columns={columns}
              onAddAppointment={handleAddAppointment}
              onUpdateAppointment={handleUpdateAppointment}
              filterType={filterType}
              onFilterTypeChange={handleTimeframeChange}
              clinicFilter={clinicFilter}
              onClinicFilterChange={handleClinicFilterChange}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              searchQuery={searchQuery}
              onSearchQueryChange={handleSearchQueryChange}
              doctorFilter={doctorFilter}
              onDoctorFilterChange={handleDoctorFilterChange}
              patientFilter={patientFilter}
              onPatientFilterChange={handlePatientFilterChange}
              serviceFilter={serviceFilter}
              onServiceFilterChange={handleServiceFilterChange}
              pageCount={pagination?.totalPages || 1}
              pageIndex={page - 1}
              pageSize={perPage}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => setPerPage(newSize)}
              isLoading={isTableLoading}
              clinics={clinics}
              onClinicsLoadMore={fetchNextClinicsPage}
              onClinicsSearchChange={setClinicSearch}
              hasNextClinicsPage={hasNextClinicsPage}
              isFetchingNextClinicsPage={isFetchingNextClinicsPage}
              isClinicsLoading={isClinicsLoading}
              doctors={doctors}
              onDoctorsLoadMore={fetchNextDoctorsPage}
              onDoctorsSearchChange={setDoctorSearch}
              hasNextDoctorsPage={hasNextDoctorsPage}
              isFetchingNextDoctorsPage={isFetchingNextDoctorsPage}
              isDoctorsLoading={isDoctorsLoading}
              patients={patients}
              onPatientsLoadMore={fetchNextPatientsPage}
              onPatientsSearchChange={setPatientSearch}
              hasNextPatientsPage={hasNextPatientsPage}
              isFetchingNextPatientsPage={isFetchingNextPatientsPage}
              isPatientsLoading={isPatientsLoading}
              services={services}
              onServicesLoadMore={fetchNextServicesPage}
              onServicesSearchChange={setServiceSearch}
              hasNextServicesPage={hasNextServicesPage}
              isFetchingNextServicesPage={isFetchingNextServicesPage}
              isServicesLoading={isServicesLoading}
            />

          </CardContent>
        </Card>
      </div>
    </>
  )
}
