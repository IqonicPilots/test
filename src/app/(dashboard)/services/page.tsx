"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowUp, CheckCircle2, Layers, Tag, XCircle } from "lucide-react"
import { useProfile } from "@/hooks/api/use-profile"

import { StatValueSkeleton } from "@/components/dashboard-page-skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "./components/data-table"
import { getColumns } from "./components/columns"
import {
  useServices,
  useServiceSummaryStats,
  useDeleteService,
  useEditService,
  useCreateService,
  servicesQueryKey,
} from "@/hooks/api/use-services"
import { serviceApi } from "@/services/service.service"
import { toast } from "sonner"
import { useListingData } from "@/hooks/api/use-listings"
import { getApiErrorMessage } from "@/lib/api/axios"
import { useClinics, useInfiniteClinics } from "@/hooks/api/use-clinics"
import { useDoctors, useInfiniteDoctors } from "@/hooks/api/use-doctors"
import type { Doctor } from "@/types/doctor.types"
import type { Clinic } from "@/types/clinic.types"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"

import { RoleGuard } from "@/components/role-guard"

export default function ServicesPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [clinicFilter, setClinicFilter] = useState("")
  const [doctorFilter, setDoctorFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const { formatCurrencyCompact } = useCurrencyFormatter(true)

  const [clinicSearch, setClinicSearch] = useState("")
  const [debouncedClinicSearch, setDebouncedClinicSearch] = useState("")

  const [doctorSearch, setDoctorSearch] = useState("")
  const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedClinicSearch(clinicSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [clinicSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDoctorSearch(doctorSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [doctorSearch])

  const { data: profile } = useProfile()
  const role = profile?.role

  const isDoctor = role === "doctor"
  const isClinicAdmin = role === "clinic_admin"
  const isReceptionist = role === "receptionist"

  const assignedClinicIds = useMemo(() => {
    if (!profile?.meta?.clinics) return [] as string[]
    return profile.meta.clinics
      .map((clinic): string => {
        if (typeof clinic === "string") return clinic
        return clinic?._id ?? ""
      })
      .filter(Boolean)
  }, [profile])

  const assignedClinics = useMemo<Clinic[]>(() => {
    if (!profile?.meta?.clinics) return []
    return profile.meta.clinics
      .map((clinic) => {
        if (typeof clinic === "string") return null
        return {
          _id: clinic._id,
          name: clinic.name || "",
          email: clinic.email || "",
        } as Clinic
      })
      .filter((c): c is Clinic => !!c)
  }, [profile])

  const isClinicAdminOrReceptionist = isClinicAdmin || isReceptionist

  const apiClinicId =
    isClinicAdminOrReceptionist && assignedClinicIds.length
      ? clinicFilter || assignedClinicIds[0]
      : (isDoctor && assignedClinicIds.length)
        ? clinicFilter || undefined // Doctors can see all their clinics, or filter by one
        : clinicFilter || undefined

  const apiDoctorId = isDoctor ? profile?._id : (doctorFilter || undefined)

  /** Role scope only — same as default table view without user filters; KPIs stay fixed when filters change. */
  const statsScopeFilters = useMemo(
    () => ({
      doctorId: isDoctor ? profile?._id : undefined,
      clinicId:
        (isClinicAdmin || isReceptionist) && assignedClinicIds.length
          ? assignedClinicIds[0]
          : undefined,
    }),
    [isDoctor, profile?._id, isClinicAdmin, isReceptionist, assignedClinicIds]
  )

  const { data: statsResponse, isLoading: isStatsLoading } = useServiceSummaryStats(statsScopeFilters, {
    enabled: !isDoctor || !!profile?._id,
  })

  const {
    data: response,
    isLoading,
    isFetching,
    error,
  } = useServices(page, perPage, {
    clinicId: apiClinicId,
    doctorId: apiDoctorId,
    categoryId: categoryFilter || undefined,
    status: statusFilter ? (statusFilter === "true" ? "active" : "inactive") : undefined,
    search: debouncedSearch || undefined,
  })

  const {
    data: clinicsInfiniteData,
    fetchNextPage: fetchNextClinicsPage,
    hasNextPage: hasNextClinicsPage,
    isFetchingNextPage: isFetchingNextClinicsPage,
    isLoading: isClinicsLoading,
  } = useInfiniteClinics(10, { search: debouncedClinicSearch }, !isDoctor && !isClinicAdmin && !isReceptionist)

  const {
    data: allClinicsResponse,
  } = useClinics(1, 1000, !isDoctor && !isClinicAdmin && !isReceptionist)

  const allClinics = useMemo<Clinic[]>(() => {
    if (isDoctor || isClinicAdmin || isReceptionist) return assignedClinics
    return allClinicsResponse?.data || []
  }, [allClinicsResponse, assignedClinics, isDoctor, isClinicAdmin, isReceptionist])

  const {
    data: allDoctorsResponse,
  } = useDoctors(1, 1000, !isDoctor, { status: "active" })

  const allDoctorsList = useMemo<Doctor[]>(() => {
    if (isDoctor && profile) return [{ _id: profile._id, firstName: profile.firstName, lastName: profile.lastName }] as Doctor[]
    return allDoctorsResponse?.data || []
  }, [allDoctorsResponse, isDoctor, profile])

  const {
    data: doctorsInfiniteData,
    fetchNextPage: fetchNextDoctorsPage,
    hasNextPage: hasNextPageDoctors,
    isFetchingNextPage: isFetchingNextPageDoctors,
    isLoading: isDoctorsLoading,
  } = useInfiniteDoctors(10, {
    search: debouncedDoctorSearch,
    clinicId: apiClinicId,
    status: "active",
  }, !isDoctor)

  const rawServices = useMemo(() => {
    if (!response) return []
    return response.data || []
  }, [response])

  const clinics = useMemo<Clinic[]>(() => {
    if (isDoctor || isClinicAdmin || isReceptionist) return assignedClinics
    if (!clinicsInfiniteData) return []
    return clinicsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [clinicsInfiniteData, assignedClinics, isDoctor, isClinicAdmin, isReceptionist])

  const doctors = useMemo<Doctor[]>(() => {
    if (isDoctor && profile) return [{ _id: profile._id, firstName: profile.firstName, lastName: profile.lastName }] as Doctor[]
    if (!doctorsInfiniteData) return []
    return doctorsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [doctorsInfiniteData, isDoctor, profile])

  const pagination = useMemo(() => {
    if (!response) return null
    return response.pagination || null
  }, [response])

  const deleteServiceMutation = useDeleteService()
  const createServiceMutation = useCreateService()
  const queryClient = useQueryClient()
  const { data: serviceTypes = [], isLoading: loadingServiceTypes } = useListingData("service_type", true)
  const { data: specialtiesData = [], isLoading: loadingSpecialties } = useListingData("specialties", true)

  const categories = useMemo(() => {
    const combined = [...serviceTypes, ...specialtiesData]
    return Array.from(new Map(combined.map(item => [item._id, item])).values())
  }, [serviceTypes, specialtiesData])

  const isLoadingCategories = loadingServiceTypes || loadingSpecialties

  const handleImportServices = async (services: any[]) => {
    let successCount = 0
    let failCount = 0

    for (const service of services) {
      try {
        const formData = new FormData()
        formData.append("name", service.name)
        formData.append("category", service.category)
        formData.append("charges", service.charges)
        formData.append("duration", service.duration)
        formData.append("telemed_service", String(service.telemed_service === "yes"))
        formData.append("isActive", String(service.status === "Active"))

        service.clinic.forEach((id: string, index: number) => {
          formData.append(`clinic[${index}]`, id)
        })

        service.doctor.forEach((id: string, index: number) => {
          formData.append(`doctor[${index}]`, id)
        })

        // Call API directly for batch to avoid multiple toasts
        await serviceApi.createService(formData)
        successCount++
      } catch (error) {
        const errMsg = getApiErrorMessage(error)
        if (process.env.NODE_ENV === "development") {
          console.warn("Failed to import service:", service.name, errMsg)
        }
        failCount++
      }
    }
    // Refresh the table silently
    queryClient.invalidateQueries({ queryKey: servicesQueryKey })
  }

  const handleDeleteService = useCallback(
    (id: string) => {
      deleteServiceMutation.mutate(id)
    },
    [deleteServiceMutation]
  )

  const editServiceMutation = useEditService()
  const handleToggleStatus = useCallback((id: string, nextStatus: boolean) => {
    const formData = new FormData()
    formData.append("isActive", String(nextStatus))
    editServiceMutation.mutate({ id, formData })
  }, [editServiceMutation])

  const columns = useMemo(
    () =>
      getColumns({
        onDeleteService: handleDeleteService,
        onToggleStatus: handleToggleStatus,
        allDoctors: doctors,
        allClinics: clinics,
        formatCurrency: formatCurrencyCompact,
        onClinicsLoadMore: fetchNextClinicsPage,
        onClinicsSearchChange: setClinicSearch,
        hasNextClinicsPage: hasNextClinicsPage,
        isFetchingNextClinicsPage: isFetchingNextClinicsPage,
        onDoctorsLoadMore: fetchNextDoctorsPage,
        onDoctorsSearchChange: setDoctorSearch,
        hasNextDoctorsPage: hasNextPageDoctors,
        isFetchingNextDoctorsPage: isFetchingNextPageDoctors,
        isClinicsLoading: isClinicsLoading,
        isDoctorsLoading: isDoctorsLoading,
        role
      }),
    [
      handleDeleteService,
      handleToggleStatus,
      doctors,
      clinics,
      formatCurrencyCompact,
      fetchNextClinicsPage,
      setClinicSearch,
      hasNextClinicsPage,
      isFetchingNextClinicsPage,
      fetchNextDoctorsPage,
      setDoctorSearch,
      hasNextPageDoctors,
      isFetchingNextPageDoctors,
      isClinicsLoading,
      isDoctorsLoading,
      role
    ]
  )

  const serviceStats = useMemo(() => {
    if (!statsResponse?.stats) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        categories: 0,
        totalPct: 100,
        activePct: 0,
        inactivePct: 0,
        categoriesPct: 0,
      }
    }
    const s = statsResponse.stats as {
      total: number
      active?: number
      inactive?: number
      categoriesCount?: number
    }
    const getPct = (count: number) => (s.total > 0 ? Math.round((count / s.total) * 100) : 0)
    const categories =
      typeof s.categoriesCount === "number" ? s.categoriesCount : 0
    return {
      total: s.total,
      active: s.active ?? 0,
      inactive: s.inactive ?? 0,
      categories,
      totalPct: 100,
      activePct: getPct(s.active || 0),
      inactivePct: getPct(s.inactive || 0),
      categoriesPct: getPct(categories),
    }
  }, [statsResponse?.stats])

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        Error loading services
      </div>
    )
  }

  return (
    <RoleGuard permission="service_access" fallback="forbidden">
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
        <p className="text-muted-foreground">
          {isDoctor
            ? "View and manage the medical services you provide."
            : isClinicAdminOrReceptionist
              ? "Configure and manage medical services offered by your clinic."
              : "Configure and manage all medical services offered across the system."}
        </p>
      </div>
      <div className="flex h-full min-w-0 w-full flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Services</p>
                  {isStatsLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{serviceStats.total}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {serviceStats.totalPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <Layers className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Active</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{serviceStats.active}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {serviceStats.activePct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <CheckCircle2 className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Inactive</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{serviceStats.inactive}</span>
                      <span className="flex items-center gap-0.5 text-sm text-orange-500">
                        <ArrowUp className="size-3.5" />
                        {serviceStats.inactivePct}%
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
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Categories</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{serviceStats.categories}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {serviceStats.categoriesPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <Tag className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{isDoctor ? "My Services" : "All Services"}</CardTitle>
            <CardDescription>
              {isDoctor ? "View, filter, and manage your services in one place" : "View, filter, and manage all services in one place"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={rawServices}
              categories={categories}
              isLoadingCategories={isLoadingCategories}
              isLoading={isLoading && !rawServices.length}
              clinicOptions={clinics}
              doctorOptions={doctors}
              clinicFilter={clinicFilter}
              onClinicFilterChange={setClinicFilter}
              doctorFilter={doctorFilter}
              onDoctorFilterChange={setDoctorFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onResetFilters={() => {
                setClinicFilter("")
                setDoctorFilter("")
                setCategoryFilter("")
                setStatusFilter("")
                setSearchQuery("")
                setDebouncedSearch("")
                setClinicSearch("")
                setDoctorSearch("")
              }}
              pageCount={pagination?.totalPages || 0}
              pageIndex={page - 1}
              pageSize={perPage}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => setPerPage(s)}
              onClinicsLoadMore={fetchNextClinicsPage}
              onClinicsSearchChange={setClinicSearch}
              hasNextClinicsPage={hasNextClinicsPage}
              isFetchingNextClinicsPage={isFetchingNextClinicsPage}
              onDoctorsLoadMore={fetchNextDoctorsPage}
              onDoctorsSearchChange={setDoctorSearch}
              hasNextDoctorsPage={hasNextPageDoctors}
              isFetchingNextDoctorsPage={isFetchingNextPageDoctors}
              isClinicsLoading={isClinicsLoading}
              isDoctorsLoading={isDoctorsLoading}
              onImportServices={handleImportServices}
              allClinics={allClinics}
              allDoctors={allDoctorsList}
              role={role}
            />
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
