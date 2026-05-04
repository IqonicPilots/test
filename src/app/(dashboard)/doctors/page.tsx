"use client"

import { useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowUp, Award, CheckCircle2, Stethoscope, XCircle } from "lucide-react"
import { StatValueSkeleton } from "@/components/dashboard-page-skeleton"
import { useClinics } from "@/hooks/api/use-clinics"
import { useProfile } from "@/hooks/api/use-profile"
import {
  useCreateDoctor,
  useDeleteDoctor,
  useDoctors,
  useDoctorSummaryStats,
  useEditDoctor,
  useToggleDoctorStatus,
  doctorsQueryKey,
} from "@/hooks/api/use-doctors"
import { useInfiniteClinics } from "@/hooks/api/use-clinics"
import { useSpecialties } from "@/hooks/api/use-listings"
import { doctorApi, buildDoctorFormData, buildDoctorUpdateFormData } from "@/services/doctor.service"
import { getApiErrorMessage } from "@/lib/api/axios"
import { toast } from "sonner"
import { Country, State } from "country-state-city"
import type {
  CreateDoctorPayload,
  Doctor,
  UpdateDoctorFormPayload,
} from "@/types/doctor.types"
import type { Clinic } from "@/types/clinic.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SystemConfig } from "@/types/system-config.types"
import { normalizeDialCountryCode } from "@/components/common/PhoneInputField"
import type { DoctorFormValues } from "./components/doctor-form-dialog"
import { DataTable } from "./components/data-table"
import { getColumns, type DoctorTableRow } from "./components/columns"

function getInitials(firstName?: string, lastName?: string) {
  const first = firstName?.[0] ?? ""
  const last = lastName?.[0] ?? ""
  return `${first}${last}`.toUpperCase()
}

function formatMobile(countryCode?: string, mobile?: string) {
  return [countryCode, mobile].filter(Boolean).join(" ").trim() || "N/A"
}

function normalizeCountryCode(value?: string) {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) return ""
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`
}

function getDisplayLabel(value: unknown) {
  if (!value) {
    return ""
  }

  if (typeof value === "string") {
    return /^[a-f0-9]{24}$/i.test(value) ? "" : value
  }

  if (typeof value === "object" && value !== null) {
    const candidate = value as {
      label?: unknown
      value?: unknown
      name?: unknown
    }

    if (typeof candidate.label === "string" && candidate.label.trim()) {
      return candidate.label.trim()
    }

    if (typeof candidate.value === "string" && candidate.value.trim()) {
      return candidate.value.trim()
    }

    if (typeof candidate.name === "string" && candidate.name.trim()) {
      return candidate.name.trim()
    }
  }

  return ""
}

function getReferenceId(value: unknown) {
  if (!value) {
    return ""
  }

  if (typeof value === "string") {
    return /^[a-f0-9]{24}$/i.test(value) ? value : ""
  }

  if (typeof value === "object" && value !== null && "_id" in value) {
    const maybeId = (value as { _id?: unknown })._id
    return typeof maybeId === "string" ? maybeId : ""
  }

  return ""
}

function getClinicLabels(doctor: Doctor, clinicMap: Map<string, string>) {
  const clinics = doctor.meta?.clinics ?? []
  const labels = clinics
    .map((clinic) => {
      const resolvedId = getReferenceId(clinic)
      if (resolvedId && clinicMap.has(resolvedId)) {
        return clinicMap.get(resolvedId) ?? ""
      }

      return getDisplayLabel(clinic)
    })
    .filter(Boolean)

  if (labels.length > 0) {
    return labels
  }

  if (clinics.length > 0) {
    return [`Assigned (${clinics.length})`]
  }

  return ["Unassigned"]
}

function getSpecializationLabels(doctor: Doctor, specialtyMap: Map<string, string>) {
  const specialties = doctor.meta?.specialties ?? []
  const labels = specialties
    .map((specialty) => {
      const resolvedId = getReferenceId(specialty)
      if (resolvedId && specialtyMap.has(resolvedId)) {
        return specialtyMap.get(resolvedId) ?? ""
      }

      return getDisplayLabel(specialty)
    })
    .filter(Boolean)

  if (labels.length > 0) {
    return labels
  }

  if (specialties.length > 0) {
    return [`Assigned (${specialties.length})`]
  }

  return ["Unassigned"]
}

import { RoleGuard } from "@/components/role-guard"

export default function DoctorsPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [clinicFilter, setClinicFilter] = useState("")
  const [specializationFilter, setSpecializationFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [clinicSearch, setClinicSearch] = useState("")

  const { data: profile } = useProfile()
  const role = profile?.role
  const assignedClinicIds = useMemo(() => {
    if (!profile?.meta?.clinics) return [] as string[]
    return (
      profile.meta.clinics
        .map((clinic): string => {
          if (typeof clinic === "string") return clinic
          return clinic?._id ?? ""
        })
        .filter(Boolean)
    )
  }, [profile])

  const isClinicAdminOrReceptionist =
    role === "clinic_admin" || role === "receptionist"

  const apiClinicId =
    isClinicAdminOrReceptionist && assignedClinicIds.length
      ? clinicFilter || assignedClinicIds[0]
      : clinicFilter || undefined

  const statsScopeFilters = useMemo(
    () => ({
      clinicId:
        isClinicAdminOrReceptionist && assignedClinicIds.length
          ? assignedClinicIds[0]
          : undefined,
    }),
    [isClinicAdminOrReceptionist, assignedClinicIds]
  )

  const { data: statsResponse, isLoading: isStatsLoading } = useDoctorSummaryStats(statsScopeFilters)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const {
    data: response,
    isLoading,
    isFetching,
    error,
  } = useDoctors(page, perPage, true, {
    clinicId: apiClinicId,
    specialtyId: specializationFilter || undefined,
    status: statusFilter ? (statusFilter as "active" | "inactive") : undefined,
    search: debouncedSearch || undefined,
    sort: "-createdAt",
  })

  const {
    data: clinicsInfiniteData,
    fetchNextPage: fetchNextClinicsPage,
    hasNextPage: hasNextClinicsPage,
    isFetchingNextPage: isFetchingNextClinicsPage,
    isLoading: isClinicsLoading
  } = useInfiniteClinics(10, { search: clinicSearch })

  const {
    data: allClinicsResponse,
    isLoading: isAllClinicsLoading
  } = useClinics(1, 1000, true)

  const allClinics = useMemo<Clinic[]>(() => {
    return allClinicsResponse?.data || []
  }, [allClinicsResponse])






  const clinics = useMemo<Clinic[]>(() => {
    if (!clinicsInfiniteData) return []
    return clinicsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [clinicsInfiniteData])

  const availableClinics = useMemo<Clinic[]>(() => {
    if (!isClinicAdminOrReceptionist) return clinics
    if (!assignedClinicIds.length) return clinics
    return clinics.filter((clinic: Clinic) => assignedClinicIds.includes(clinic._id))
  }, [clinics, assignedClinicIds, isClinicAdminOrReceptionist])

  const hideClinicFilter = isClinicAdminOrReceptionist

  useEffect(() => {
    if (!isClinicAdminOrReceptionist || !assignedClinicIds.length) return

    if (!clinicFilter || !assignedClinicIds.includes(clinicFilter)) {
      setClinicFilter(assignedClinicIds[0])
    }
  }, [isClinicAdminOrReceptionist, assignedClinicIds, clinicFilter])

  const { data: specialties = [] } = useSpecialties()
  const { data: clinicScopeDoctorsForSpecs, isLoading: isClinicSpecDoctorsLoading } = useDoctors(
    1,
    500,
    Boolean(apiClinicId),
    {
      clinicId: apiClinicId,
      status: "active",
      sort: "-createdAt",
    }
  )

  const specialtyIdsInClinicScope = useMemo(() => {
    if (!apiClinicId) return null
    const rows = clinicScopeDoctorsForSpecs?.data ?? []
    const ids = new Set<string>()
    for (const doc of rows) {
      for (const s of doc.meta?.specialties ?? []) {
        const id = getReferenceId(s)
        if (id) ids.add(id)
      }
    }
    return ids
  }, [apiClinicId, clinicScopeDoctorsForSpecs?.data])

  const specializationFilterOptions = useMemo(() => {
    if (!apiClinicId) return specialties
    if (isClinicSpecDoctorsLoading) return specialties
    if (!specialtyIdsInClinicScope || specialtyIdsInClinicScope.size === 0) return []
    return specialties.filter((s) => specialtyIdsInClinicScope.has(s._id))
  }, [apiClinicId, isClinicSpecDoctorsLoading, specialtyIdsInClinicScope, specialties])

  useEffect(() => {
    if (!specializationFilter) return
    if (specializationFilterOptions.some((s) => s._id === specializationFilter)) return
    setSpecializationFilter("")
  }, [apiClinicId, specializationFilter, specializationFilterOptions])

  const hideSpecializationFilter = specialties.length <= 1
  const queryClient = useQueryClient()
  const createDoctorMutation = useCreateDoctor()
  const editDoctorMutation = useEditDoctor()
  const deleteDoctorMutation = useDeleteDoctor()
  const toggleDoctorStatusMutation = useToggleDoctorStatus()

  const rawDoctors = useMemo(() => {
    if (!response) return []
    return response.data || []
  }, [response])

  const pagination = useMemo(() => {
    if (!response) return null
    return response.pagination || null
  }, [response])

  const clinicMap = new Map<string, string>(clinics.map((clinic: any) => [clinic._id, clinic.name]))
  const clinicsMapFull = new Map<string, any>(clinics.map((clinic: any) => [clinic._id, clinic]))
  const specialtyMap = new Map(specialties.map((specialty) => [specialty._id, specialty.label]))

  const doctorRows: DoctorTableRow[] = useMemo(() => {
    return rawDoctors.map((doctor: any) => {
      const firstClinicRef = doctor.meta?.clinics?.[0]
      const firstClinicId = getReferenceId(firstClinicRef)
      const primaryClinic = firstClinicId ? clinicsMapFull.get(firstClinicId) : null

      return {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        avatar: getInitials(doctor.firstName, doctor.lastName),
        avatarUrl: doctor.meta?.profilePicture ?? doctor.meta?.avatar,
        mobile: formatMobile(doctor.countryCode, doctor.mobile),
        specializations: getSpecializationLabels(doctor, specialtyMap as any),
        clinic: getClinicLabels(doctor, clinicMap),
        clinicEmail: primaryClinic?.email || "N/A",
        clinicAvatar: getInitials(primaryClinic?.name),
        clinicAvatarUrl: primaryClinic?.cliniclogo,
        registeredOn: doctor.createdAt,
        status: doctor.isActive ? "Active" : "Inactive",
        sourceDoctor: doctor,
      }
    })
  }, [rawDoctors, clinicsMapFull, specialtyMap, clinicMap])

  const doctorStats = useMemo(() => {
    if (!statsResponse?.stats) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        specialties: 0,
        activePct: 0,
        inactivePct: 0,
        specialtiesPct: 0,
      }
    }
    const s = statsResponse.stats as {
      total: number
      active?: number
      inactive?: number
      specialtiesCount?: number
    }
    const getPct = (count: number) => (s.total > 0 ? Math.round((count / s.total) * 100) : 0)
    const specialties =
      typeof s.specialtiesCount === "number" ? s.specialtiesCount : 0
    return {
      total: s.total,
      active: s.active ?? 0,
      inactive: s.inactive ?? 0,
      specialties,
      activePct: getPct(s.active || 0),
      inactivePct: getPct(s.inactive || 0),
      specialtiesPct: getPct(specialties),
    }
  }, [statsResponse?.stats])

  const handleDeleteDoctor = (id: string) => {
    deleteDoctorMutation.mutate(id)
  }

  const handleAddDoctor = (doctor: DoctorFormValues) => {
    const cfg = queryClient.getQueryData<SystemConfig>(["system-config"])
    const dialFallback = normalizeDialCountryCode(cfg?.country_code) || "+1"
    const payload: CreateDoctorPayload = {
      email: doctor.email,
      role: "doctor",
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      mobile: doctor.mobile,
      countryCode: normalizeCountryCode(doctor.countryCode) || dialFallback,
      gender: doctor.gender,
      dob: doctor.dateOfBirth,
      experience: doctor.experience?.trim() || undefined,
      description: doctor.description?.trim() || undefined,
      clinics: doctor.clinics,
      specialties: doctor.specialties,
      address: doctor.address?.trim() || undefined,
      city: doctor.city?.trim() || undefined,
      state: (doctor.country && doctor.state) ?
        (State.getStateByCodeAndCountry(doctor.state, doctor.country)?.name || doctor.state) : (doctor.state || undefined),
      country: doctor.country ?
        (Country.getCountryByCode(doctor.country)?.name || doctor.country) : undefined,
      postalCode: doctor.postalCode?.trim() || undefined,
      isActive: doctor.status === "Active",
      profilePicture:
        doctor.profilePicture instanceof File ? doctor.profilePicture : undefined,
      signatureImage:
        doctor.signatureImage instanceof File ? doctor.signatureImage : undefined,
    }

    const formData = buildDoctorFormData(payload)
    createDoctorMutation.mutate(formData)
  }

  const handleEditDoctor = (id: string, doctor: DoctorFormValues) => {
    const cfg = queryClient.getQueryData<SystemConfig>(["system-config"])
    const dialFallback = normalizeDialCountryCode(cfg?.country_code) || "+1"
    const payload: UpdateDoctorFormPayload = {
      email: doctor.email,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      mobile: doctor.mobile,
      countryCode: normalizeCountryCode(doctor.countryCode) || dialFallback,
      gender: doctor.gender,
      dob: doctor.dateOfBirth,
      experience: doctor.experience?.trim() || undefined,
      description: doctor.description?.trim() || undefined,
      clinics: doctor.clinics,
      specialties: doctor.specialties,
      address: doctor.address?.trim() || undefined,
      city: doctor.city?.trim() || undefined,
      state: (doctor.country && doctor.state) ?
        (State.getStateByCodeAndCountry(doctor.state, doctor.country)?.name || doctor.state) : (doctor.state || undefined),
      country: doctor.country ?
        (Country.getCountryByCode(doctor.country)?.name || doctor.country) : undefined,
      postalCode: doctor.postalCode?.trim() || undefined,
      isActive: doctor.status === "Active",
      profilePicture:
        doctor.profilePicture instanceof File ? doctor.profilePicture : undefined,
      signatureImage:
        doctor.signatureImage instanceof File ? doctor.signatureImage : undefined,
    }

    const formData = buildDoctorUpdateFormData(payload)
    editDoctorMutation.mutate({ id, formData })
  }

  const handleToggleStatus = (id: string, nextStatus: boolean) => {
    toggleDoctorStatusMutation.mutate({ id, isActive: nextStatus })
  }

  const handleImportDoctors = async (doctors: DoctorFormValues[]) => {
    const cfg = queryClient.getQueryData<SystemConfig>(["system-config"])
    const dialFallback = normalizeDialCountryCode(cfg?.country_code) || "+1"

    try {
      for (const doctor of doctors) {
        const payload: CreateDoctorPayload = {
          email: doctor.email,
          role: "doctor",
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          mobile: doctor.mobile,
          countryCode: normalizeCountryCode(doctor.countryCode) || dialFallback,
          gender: doctor.gender,
          dob: doctor.dateOfBirth,
          experience: doctor.experience?.trim() || undefined,
          description: doctor.description?.trim() || undefined,
          clinics: doctor.clinics,
          specialties: doctor.specialties,
          address: doctor.address?.trim() || undefined,
          city: doctor.city?.trim() || undefined,
          state: (doctor.country && doctor.state) ?
            (State.getStateByCodeAndCountry(doctor.state, doctor.country)?.name || doctor.state) : (doctor.state || undefined),
          country: doctor.country ?
            (Country.getCountryByCode(doctor.country)?.name || doctor.country) : undefined,
          postalCode: doctor.postalCode?.trim() || undefined,
          isActive: doctor.status === "Active",
        }

        const formData = buildDoctorFormData(payload)
        await doctorApi.createDoctor(formData)
      }
      queryClient.invalidateQueries({ queryKey: doctorsQueryKey })
    } catch (error) {
      const errMsg = getApiErrorMessage(error)
      toast.error(`Failed to import doctors: ${errMsg}`)
      // Avoid logging the Axios Error object: Next.js dev overlay treats
      // console.error(Error) as a "Console AxiosError" full-screen UI.
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to import batch of doctors:", errMsg)
      }
      return false
    }
  }

  const columns = useMemo(
    () =>
      getColumns({
        onDeleteDoctor: handleDeleteDoctor,
        onEditDoctor: handleEditDoctor,
        onAddDoctor: handleAddDoctor,
        onToggleStatus: handleToggleStatus,
        clinics,
        onClinicsLoadMore: fetchNextClinicsPage,
        onClinicsSearchChange: setClinicSearch,
        hasNextClinicsPage: hasNextClinicsPage,
        isFetchingNextClinicsPage: isFetchingNextClinicsPage,
        isClinicsLoading: isClinicsLoading,
        specialties,
        isBusy: deleteDoctorMutation.isPending || toggleDoctorStatusMutation.isPending,
        isEditBusy: editDoctorMutation.isPending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clinics, specialties, deleteDoctorMutation.isPending, toggleDoctorStatusMutation.isPending, editDoctorMutation.isPending, hasNextClinicsPage, isFetchingNextClinicsPage, isClinicsLoading]
  )

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">Error loading doctors</div>
  }

  return (
    <RoleGuard permission="doctor_access" fallback="forbidden">
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Doctors</h1>
        <p className="text-muted-foreground">
          Manage your medical professionals and their profiles.
        </p>
      </div>
      <div className="flex h-full min-w-0 w-full flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Total Doctors</p>
                  {isLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{doctorStats.total}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        100%
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 bg-primary/10 rounded-lg p-3">
                  <Stethoscope className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Active</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{doctorStats.active}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {doctorStats.activePct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 bg-primary/10 rounded-lg p-3">
                  <CheckCircle2 className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Inactive</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{doctorStats.inactive}</span>
                      <span className="flex items-center gap-0.5 text-sm text-orange-500">
                        <ArrowUp className="size-3.5" />
                        {doctorStats.inactivePct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 bg-primary/10 rounded-lg p-3">
                  <XCircle className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Specialties</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{doctorStats.specialties}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {doctorStats.specialtiesPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 bg-primary/10 rounded-lg p-3">
                  <Award className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Doctors</CardTitle>
            <CardDescription>
              View, filter, and manage all your doctors in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={doctorRows}
              doctors={doctorRows}
              onAddDoctor={handleAddDoctor}
              onImportDoctors={handleImportDoctors}
              clinics={availableClinics}
              allClinics={allClinics}
              onClinicsLoadMore={fetchNextClinicsPage}
              onClinicsSearchChange={setClinicSearch}
              hasNextClinicsPage={hasNextClinicsPage}
              isFetchingNextClinicsPage={isFetchingNextClinicsPage}
              isClinicsLoading={isClinicsLoading}
              specialties={specialties}
              specializationFilterOptions={specializationFilterOptions}
              clinicFilter={clinicFilter || ""}
              onClinicFilterChange={(value) => {
                setPage(1)
                setClinicFilter(value)
              }}
              specializationFilter={specializationFilter}
              onSpecializationFilterChange={(value) => {
                setSpecializationFilter(value)
              }}
              statusFilter={statusFilter}
              onStatusFilterChange={(value) => {
                setStatusFilter(value)
              }}
              searchQuery={searchQuery}
              onSearchQueryChange={(value) => {
                setSearchQuery(value)
              }}
              onResetFilters={() => {
                setClinicFilter("")
                setSpecializationFilter("")
                setStatusFilter("")
                setSearchQuery("")
                setDebouncedSearch("")
              }}
              isCreateBusy={createDoctorMutation.isPending}
              isLoading={isLoading && !rawDoctors.length}
              pageCount={pagination?.totalPages || 0}
              pageIndex={page - 1}
              pageSize={perPage}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => setPerPage(s)}
              hideClinicFilter={hideClinicFilter}
              hideSpecializationFilter={hideSpecializationFilter}
            />
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
