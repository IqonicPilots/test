"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowUp, Receipt, CheckCircle2, XCircle, Percent, DollarSign } from "lucide-react"
import { DataTable } from "./components/data-table"
import { getColumns } from "./components/columns"
import { useTaxes, useDeleteTax, useUpdateTax, useCreateTax } from "@/hooks/api/use-tax-mutation"
import { useInfiniteClinics } from "@/hooks/api/use-clinics"
import { useInfiniteDoctors } from "@/hooks/api/use-doctors"
import { useInfiniteServices } from "@/hooks/api/use-services"
import type { TaxPayload } from "@/types/tax.types"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatValueSkeleton } from "@/components/dashboard-page-skeleton"
import { usePermissions } from "@/hooks/use-permissions"
import { RoleGuard } from "@/components/role-guard"
import { useProfile } from "@/hooks/api/use-profile"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"

export default function TaxesPage() {
  const { can } = usePermissions()
  const { data: profile } = useProfile()
  const role = profile?.role
  const isDoctor = role === "doctor"
  const isClinicAdmin = role === "clinic_admin"
  const isReceptionist = role === "receptionist"

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
          name: clinic.clinicName || clinic.name || "",
          email: clinic.email || "",
        }
      })
      .filter(Boolean) as Clinic[]
  }, [profile])

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Clinic filter
  const [clinicFilter, setClinicFilter] = useState("")
  const [clinicSearch, setClinicSearch] = useState("")
  const [debouncedClinicSearch, setDebouncedClinicSearch] = useState("")

  // Doctor filter
  const [doctorFilter, setDoctorFilter] = useState("")
  const [doctorSearch, setDoctorSearch] = useState("")
  const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState("")

  // Service filter
  const [serviceFilter, setServiceFilter] = useState("")
  const [serviceSearch, setServiceSearch] = useState("")
  const [debouncedServiceSearch, setDebouncedServiceSearch] = useState("")

  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedClinicSearch(clinicSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [clinicSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDoctorSearch(doctorSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [doctorSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedServiceSearch(serviceSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [serviceSearch])

  const scopeClinicId = useMemo(
    () =>
      clinicFilter ||
      ((isClinicAdmin || isReceptionist || isDoctor) && assignedClinicIds.length
        ? assignedClinicIds[0]
        : undefined),
    [clinicFilter, isClinicAdmin, isReceptionist, isDoctor, assignedClinicIds]
  )

  const effectiveTaxDoctorId = isDoctor ? profile?._id : doctorFilter || undefined

  const prevClinicFilterRef = useRef(clinicFilter)
  useEffect(() => {
    if (prevClinicFilterRef.current === clinicFilter) return
    prevClinicFilterRef.current = clinicFilter
    setPage(1)
    if (!isDoctor) {
      setDoctorFilter("")
      setServiceFilter("")
    }
  }, [clinicFilter, isDoctor])

  const prevDoctorFilterRef = useRef(doctorFilter)
  useEffect(() => {
    if (prevDoctorFilterRef.current === doctorFilter) return
    prevDoctorFilterRef.current = doctorFilter
    setPage(1)
    if (!isDoctor) setServiceFilter("")
  }, [doctorFilter, isDoctor])

  const { data: response, isLoading, error } = useTaxes(page, limit, {
    clinicId: scopeClinicId,
    doctorId: effectiveTaxDoctorId,
    serviceId: serviceFilter || undefined,
  })
  const { data: summaryResponse, isLoading: isSummaryLoading } = useTaxes(1, 1, {
    clinicId: ((isClinicAdmin || isReceptionist || isDoctor) && assignedClinicIds.length)
      ? assignedClinicIds[0]
      : undefined,
    doctorId: isDoctor ? profile?._id : undefined,
  })
  
  const taxes = useMemo(() => {
    if (!response) return []
    if (Array.isArray(response.data)) return response.data
    if (response.data && Array.isArray((response.data as any).data)) return (response.data as any).data
    if (Array.isArray(response)) return response as any[]
    return []
  }, [response])
  
  const pagination = useMemo(() => {
    if (!response) return null
    if (response.pagination) return response.pagination
    if ((response.data as any)?.pagination) return (response.data as any).pagination
    const dataObj = response.data as any
    if (dataObj && typeof dataObj.total === "number") {
      const perPage = dataObj.limit || dataObj.perPage || 10
      return {
        total: dataObj.total,
        page: dataObj.page || 1,
        perPage,
        totalPages: dataObj.totalPages || Math.ceil(dataObj.total / perPage),
      }
    }
    return null
  }, [response])

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
    data: servicesInfiniteData,
    fetchNextPage: fetchNextServicesPage,
    hasNextPage: hasNextServicesPage,
    isFetchingNextPage: isFetchingNextServicesPage,
    isLoading: isServicesLoading,
  } = useInfiniteServices(10, {
    search: debouncedServiceSearch,
    clinicId: scopeClinicId,
    doctorId: effectiveTaxDoctorId,
  })

  const clinics = useMemo<Clinic[]>(() => {
    if (isDoctor || isClinicAdmin || isReceptionist) return assignedClinics
    if (!clinicsInfiniteData) return []
    return clinicsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [clinicsInfiniteData, isDoctor, isClinicAdmin, isReceptionist, assignedClinics])

  const doctors = useMemo<Doctor[]>(() => {
    if (isDoctor && profile) return [{ _id: profile._id, firstName: profile.firstName, lastName: profile.lastName, fullName: `${profile.firstName} ${profile.lastName}` } as any]
    if (!doctorsInfiniteData) return []
    return doctorsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [doctorsInfiniteData, isDoctor, profile])

  const services = useMemo(() => {
    if (!servicesInfiniteData) return []
    return servicesInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [servicesInfiniteData])

  const deleteTaxMutation = useDeleteTax()
  const updateTaxMutation = useUpdateTax()
  const createTaxMutation = useCreateTax()

  const handleAddTax = async (data: TaxPayload) => {
    await createTaxMutation.mutateAsync(data)
  }

  const handleDeleteTax = async (id: string) => {
    try {
      await deleteTaxMutation.mutateAsync(id)
    } catch (err) {
      console.error("error delete", err)
    }
  }

  const handleToggleStatus = async (id: string) => {
    const tax = taxes.find((t: any) => t._id === id)
    if (!tax) return
    try {
      await updateTaxMutation.mutateAsync({ id, data: { isActive: !tax.isActive } })
    } catch (err) {
      console.error("error status", err)
    }
  }

  const handleUpdateTax = async (id: string, updatedData: Partial<TaxPayload>) => {
    await updateTaxMutation.mutateAsync({ id, data: updatedData })
  }

  const { formatCurrency } = useCurrencyFormatter()
  const columns = useMemo(
    () =>
      getColumns({
        onDeleteTax: handleDeleteTax,
        onToggleStatus: handleToggleStatus,
        onUpdateTax: handleUpdateTax,
        onAddTax: handleAddTax,
        can,
        formatCurrency,
      }),
    [taxes, can, formatCurrency, handleDeleteTax, handleToggleStatus, handleUpdateTax, handleAddTax]
  )

  const stats = useMemo(() => {
    const s = summaryResponse?.stats || response?.stats
    if (s) {
      const percentageType =
        typeof s.percentageType === "number"
          ? s.percentageType
          : taxes.filter((t: any) => t.type === "percentage").length
      const fixedType =
        typeof s.fixedType === "number"
          ? s.fixedType
          : taxes.filter((t: any) => t.type === "fixed").length
      const getPct = (count: number) => (s.total > 0 ? Math.round((count / s.total) * 100) : 0)
      return {
        total: s.total,
        active: s.active,
        inactive: s.inactive,
        percentageType,
        activePct: getPct(s.active || 0),
        inactivePct: getPct(s.inactive || 0),
        percentagePct: getPct(percentageType),
        fixedType,
        fixedPct: getPct(fixedType),
      }
    }
    const total = pagination?.total || 0
    const active = taxes.filter((t: any) => t.isActive).length
    const inactive = taxes.filter((t: any) => !t.isActive).length
    const percentageType = taxes.filter((t: any) => t.type === "percentage").length
    const getPct = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0)
    return { total, active, inactive, percentageType, activePct: getPct(active), inactivePct: getPct(inactive), percentagePct: getPct(percentageType), fixedType: taxes.filter((t: any) => t.type === "fixed").length, fixedPct: getPct(taxes.filter((t: any) => t.type === "fixed").length) }
  }, [pagination, taxes, response?.stats, summaryResponse?.stats])

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">Error loading taxes</div>
  }

  return (
    <RoleGuard permission="tax_access" fallback="forbidden">
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Taxes</h1>
        <p className="text-muted-foreground">Manage your tax configurations for clinics, doctors, and services.</p>
      </div>
      <div className="flex h-full min-w-0 w-full flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Total Taxes</p>
                  {isSummaryLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                       <span className="text-2xl font-bold">{stats.total}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500"><ArrowUp className="size-3.5" />100%</span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 bg-primary/10 rounded-lg p-3"><Receipt className="size-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Active</p>
                  {isSummaryLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.active}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500"><ArrowUp className="size-3.5" />{stats.activePct}%</span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 bg-primary/10 rounded-lg p-3"><CheckCircle2 className="size-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Inactive</p>
                  {isSummaryLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.inactive}</span>
                      <span className="flex items-center gap-0.5 text-sm text-orange-500"><ArrowUp className="size-3.5" />{stats.inactivePct}%</span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 bg-primary/10 rounded-lg p-3"><XCircle className="size-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Percentage Type</p>
                  {isSummaryLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.percentageType}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500"><ArrowUp className="size-3.5" />{stats.percentagePct}%</span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 bg-primary/10 rounded-lg p-3"><Percent className="size-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Fixed Type</p>
                  {isSummaryLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.fixedType}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500"><ArrowUp className="size-3.5" />{stats.fixedPct}%</span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 bg-primary/10 rounded-lg p-3"><DollarSign className="size-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Taxes</CardTitle>
            <CardDescription>View, filter, and manage all your taxes in one place</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={taxes}
              columns={columns}
              taxes={taxes}
              onAddTax={handleAddTax}
              onUpdateTax={handleUpdateTax}
              isLoading={isLoading && !taxes.length}
              pageCount={pagination?.totalPages || 0}
              pageIndex={page - 1}
              pageSize={limit}
              onPaginationChange={(p, s) => {
                setPage(p + 1)
                setLimit(s)
              }}
              clinicFilter={clinicFilter}
              onClinicFilterChange={setClinicFilter}
              clinicOptions={clinics}
              onClinicsLoadMore={fetchNextClinicsPage}
              onClinicsSearchChange={setClinicSearch}
              hasNextClinicsPage={hasNextClinicsPage}
              isFetchingNextClinicsPage={isFetchingNextClinicsPage}
              doctorFilter={doctorFilter}
              onDoctorFilterChange={setDoctorFilter}
              doctorOptions={doctors}
              onDoctorsLoadMore={fetchNextDoctorsPage}
              onDoctorsSearchChange={setDoctorSearch}
              hasNextDoctorsPage={hasNextDoctorsPage}
              isFetchingNextDoctorsPage={isFetchingNextDoctorsPage}
              serviceFilter={serviceFilter}
              onServiceFilterChange={setServiceFilter}
              serviceOptions={services}
              onServicesLoadMore={fetchNextServicesPage}
              onServicesSearchChange={setServiceSearch}
              hasNextServicesPage={hasNextServicesPage}
              isFetchingNextServicesPage={isFetchingNextServicesPage}
              isClinicsLoading={isClinicsLoading}
              isDoctorsLoading={isDoctorsLoading}
              isServicesLoading={isServicesLoading}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              role={role}
            />
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
