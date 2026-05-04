"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { useSearchParams } from "next/navigation"
import { ArrowUp, Activity, Users, FileText, CheckCircle } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { DataTable } from "./components/data-table"
import { getColumns } from "./components/columns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatValueSkeleton } from "@/components/dashboard-page-skeleton"
import { useEncounters, useAddEncounterReport, useDeleteEncounter, useUpdateEncounter } from "@/hooks/api/use-encounters"
import { useInfiniteClinics } from "@/hooks/api/use-clinics"
import { useInfiniteDoctors } from "@/hooks/api/use-doctors"
import { useInfinitePatients } from "@/hooks/api/use-patients"
import { useProfile } from "@/hooks/api/use-profile"
import type { EncounterReportPayload, Encounter } from "@/types/encounter.types"
import { RoleGuard } from "@/components/role-guard"

export default function EncountersPage() {
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get("patientId") || ""

  const { data: profile } = useProfile()
  const role = profile?.role
  const isDoctor = role === "doctor"
  const isClinicAdmin = role === "clinic_admin"
  const isReceptionist = role === "receptionist"
  const isPatient = role === "patient"

  const assignedClinicIds = useMemo(() => {
    if (!profile?.meta?.clinics) return [] as string[]
    return profile.meta.clinics
      .map((clinic: any): string => {
        if (typeof clinic === "string") return clinic
        return clinic?._id ?? ""
      })
      .filter(Boolean)
  }, [profile])

  const assignedClinics = useMemo(() => {
    if (!profile?.meta?.clinics) return []
    return profile.meta.clinics
      .map((clinic: any) => {
        if (typeof clinic === "string") return null
        return {
          _id: clinic._id,
          name: (clinic as any).name || (clinic as any).clinicName || "",
          email: clinic.email || "",
        }
      })
      .filter(Boolean) as any[]
  }, [profile])

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const [filterType, setFilterType] = useState("")
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined)
  const [patientFilter, setPatientFilter] = useState(initialPatientId)
  const [doctorFilter, setDoctorFilter] = useState("")
  const [clinicFilter, setClinicFilter] = useState("")

  const [patientSearch, setPatientSearch] = useState("")
  const [doctorSearch, setDoctorSearch] = useState("")
  const [clinicSearch, setClinicSearch] = useState("")
  const [debouncedPatientSearch, setDebouncedPatientSearch] = useState("")
  const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState("")
  const [debouncedClinicSearch, setDebouncedClinicSearch] = useState("")

  useEffect(() => {
    if (initialPatientId) {
      setPatientFilter(initialPatientId)
    }
  }, [initialPatientId])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPatientSearch(patientSearch.trim()), 350)
    return () => clearTimeout(t)
  }, [patientSearch])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDoctorSearch(doctorSearch.trim()), 350)
    return () => clearTimeout(t)
  }, [doctorSearch])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedClinicSearch(clinicSearch.trim()), 350)
    return () => clearTimeout(t)
  }, [clinicSearch])

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1)
  }, [filterType, dateFilter, patientFilter, doctorFilter, clinicFilter])

  const scopeClinicId = useMemo(
    () =>
      clinicFilter ||
      ((isClinicAdmin || isReceptionist || isDoctor) && assignedClinicIds.length
        ? assignedClinicIds[0]
        : undefined),
    [clinicFilter, isClinicAdmin, isReceptionist, isDoctor, assignedClinicIds]
  )

  const prevClinicFilterRef = useRef(clinicFilter)
  useEffect(() => {
    if (prevClinicFilterRef.current === clinicFilter) return
    prevClinicFilterRef.current = clinicFilter
    if (!isDoctor) setDoctorFilter("")
  }, [clinicFilter, isDoctor])

  const {
    data: response,
    isLoading,
    isFetching,
    error,
  } = useEncounters({
    page,
    perPage,
    status: filterType || undefined,
    startDate: dateFilter?.from ? format(dateFilter.from, "yyyy-MM-dd") : undefined,
    endDate: dateFilter?.to ? format(dateFilter.to, "yyyy-MM-dd") : undefined,
    patientId: patientFilter || undefined,
    doctorId: isDoctor ? profile?._id : (doctorFilter || undefined),
    clinicId: clinicFilter || ((isClinicAdmin || isReceptionist || isDoctor) && assignedClinicIds.length ? assignedClinicIds[0] : undefined),
  })
  const { data: summaryResponse, isLoading: isSummaryLoading } = useEncounters({
    page: 1,
    perPage: 1,
    patientId: isPatient ? profile?._id : undefined,
    doctorId: isDoctor ? profile?._id : undefined,
    clinicId: ((isClinicAdmin || isReceptionist || isDoctor) && assignedClinicIds.length) ? assignedClinicIds[0] : undefined,
  })

  // Filter options with search
  const {
    data: clinicsInfiniteData,
    fetchNextPage: fetchNextClinicsPage,
    hasNextPage: hasNextClinicsPage,
    isFetchingNextPage: isFetchingNextClinicsPage,
    isLoading: isClinicsLoading,
  } = useInfiniteClinics(10, { search: debouncedClinicSearch }, !isDoctor && !isClinicAdmin && !isReceptionist)

  const {
    data: doctorsInfiniteData,
    fetchNextPage: fetchNextDoctorsPage,
    hasNextPage: hasNextDoctorsPage,
    isFetchingNextPage: isFetchingNextDoctorsPage,
    isLoading: isDoctorsLoading,
  } = useInfiniteDoctors(
    10,
    { search: debouncedDoctorSearch, status: "active", clinicId: scopeClinicId },
    !isDoctor
  )

  const {
    data: patientsInfiniteData,
    fetchNextPage: fetchNextPatientsPage,
    hasNextPage: hasNextPatientsPage,
    isFetchingNextPage: isFetchingNextPatientsPage,
    isLoading: isPatientsLoading,
  } = useInfinitePatients(10, { search: debouncedPatientSearch })

  const clinics = useMemo(() => {
    if (isDoctor || isClinicAdmin || isReceptionist) return assignedClinics
    if (!clinicsInfiniteData) return []
    return clinicsInfiniteData.pages.flatMap(page => page.data || [])
  }, [clinicsInfiniteData, isDoctor, isClinicAdmin, isReceptionist, assignedClinics])

  const doctors = useMemo(() => {
    if (isDoctor && profile) return [{ _id: profile._id, firstName: profile.firstName, lastName: profile.lastName, fullName: `${profile.firstName} ${profile.lastName}` }]
    if (!doctorsInfiniteData) return []
    return doctorsInfiniteData.pages.flatMap(page => page.data || [])
  }, [doctorsInfiniteData, isDoctor, profile])

  const patients = useMemo(() => {
    if (!patientsInfiniteData) return []
    return patientsInfiniteData.pages.flatMap(page => page.data || [])
  }, [patientsInfiniteData])

  const encounters = useMemo(() => {
    if (!response) return []
    if (Array.isArray(response.data)) return response.data
    return []
  }, [response])

  const pagination = useMemo(() => {
    if (!response) return null
    return response.pagination || null
  }, [response])

  const firstPage = response

  const addReportMutation = useAddEncounterReport()
  const deleteMutation = useDeleteEncounter()
  const updateMutation = useUpdateEncounter()

  const handleAddEncounterReport = async (patientId: string, data: EncounterReportPayload) => {
    await addReportMutation.mutateAsync({ patientId, data }).catch(() => undefined)
  }

  const handleDeleteEncounter = async (id: string) => {
    await deleteMutation.mutateAsync(id).catch(() => undefined)
  }

  const handleUpdateEncounter = async (id: string, data: any) => {
    await updateMutation.mutateAsync({ id, data }).catch(() => undefined)
  }

  const handleToggleStatus = async (id: string, nextStatus: boolean) => {
    console.log("Toggle encounter status", id, nextStatus);
  }

  const columns = useMemo(
    () =>
      getColumns({
        onDeleteEncounter: handleDeleteEncounter,
        onUpdateEncounter: handleUpdateEncounter,
        onToggleStatus: handleToggleStatus,
        role
      }),
    []
  )

  const stats = useMemo(() => {
    const s = summaryResponse?.stats || response?.stats
    if (s) {
      const getPct = (count: number) => s.total > 0 ? Math.round((count / s.total) * 100) : 0
      return {
        total: s.total,
        active: s.active,
        closed: s.closed,
        patients: s.patients,
        activePct: getPct(s.active),
        closedPct: getPct(s.closed),
        patientsPct: getPct(s.patients),
      }
    }

    const total = pagination?.total || encounters.length
    const active = encounters.filter((e: any) => (e.encounter_status || e.status) === "Active").length
    const closed = encounters.filter((e: any) => (e.encounter_status || e.status) === "Closed").length
    const patientCount = new Set(encounters.map((e: any) => e.patient?._id)).size

    const getPct = (count: number) => total > 0 ? Math.round((count / total) * 100) : 0

    return {
      total,
      active,
      closed,
      patients: patientCount,
      activePct: getPct(active),
      closedPct: getPct(closed),
      patientsPct: getPct(patientCount),
    }
  }, [encounters, pagination, response?.stats, summaryResponse?.stats])

  return (
    <RoleGuard permission="encounter_access" fallback="forbidden">
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Encounters</h1>
        <p className="text-muted-foreground">
          {isDoctor
            ? "Manage and track your patient encounters efficiently."
            : isClinicAdmin || isReceptionist
              ? "Manage and track all patient encounters within your clinic efficiently."
              : isPatient
                ? "View and track your medical encounters and history."
                : "Manage and track all patient encounters efficiently across the system."}
        </p>
      </div>

      <div className="flex h-full min-w-0 w-full flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Encounters</p>
                  {isSummaryLoading ? (
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
                  <Activity className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Active</p>
                  {isSummaryLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.active}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {stats.activePct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <CheckCircle className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Closed</p>
                  {isSummaryLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.closed}</span>
                      <span className="flex items-center gap-0.5 text-sm text-orange-500">
                        <ArrowUp className="size-3.5" />
                        {stats.closedPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <FileText className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Patients</p>
                  {isSummaryLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.patients}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {stats.patientsPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <Users className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Encounters</CardTitle>
            <CardDescription>View, filter, and manage all your encounters in one place</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={encounters}
              columns={columns}
              onAddEncounter={handleAddEncounterReport}
              filterType={filterType}
              onFilterTypeChange={(value) => setFilterType(value)}
              dateFilter={dateFilter}
              onDateFilterChange={(date) => setDateFilter(date)}
              patientFilter={patientFilter}
              onPatientFilterChange={(value) => setPatientFilter(value)}
              patientOptions={patients.map((p: any) => ({ value: p._id || "", label: `${p.firstName} ${p.lastName}` }))}
              onPatientsLoadMore={fetchNextPatientsPage}
              onPatientsSearchChange={setPatientSearch}
              hasNextPatientsPage={hasNextPatientsPage}
              isFetchingNextPatientsPage={isFetchingNextPatientsPage}
              doctorFilter={doctorFilter}
              onDoctorFilterChange={(value) => setDoctorFilter(value)}
              doctorOptions={doctors.map((d: any) => ({ value: d._id || "", label: d.fullName || `${d.firstName} ${d.lastName}` }))}
              onDoctorsLoadMore={fetchNextDoctorsPage}
              onDoctorsSearchChange={setDoctorSearch}
              hasNextDoctorsPage={hasNextDoctorsPage}
              isFetchingNextDoctorsPage={isFetchingNextDoctorsPage}
              clinicFilter={clinicFilter}
              onClinicFilterChange={(value) => setClinicFilter(value)}
              clinicOptions={clinics.map((c: any) => ({ value: c._id || "", label: c.clinicName || c.name }))}
              onClinicsLoadMore={fetchNextClinicsPage}
              onClinicsSearchChange={setClinicSearch}
              hasNextClinicsPage={hasNextClinicsPage}
              isFetchingNextClinicsPage={isFetchingNextClinicsPage}
              isClinicsLoading={isClinicsLoading}
              isDoctorsLoading={isDoctorsLoading}
              isPatientsLoading={isPatientsLoading}
              pageCount={pagination?.totalPages || 1}
              pageIndex={page - 1}
              pageSize={perPage}
              onPageChange={(p: number) => setPage(p)}
              onPageSizeChange={(s: number) => setPerPage(s)}
              isLoading={isLoading && !encounters.length}
              role={role}
            />
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
