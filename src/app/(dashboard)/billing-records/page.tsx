"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowUp, FileText, CheckCircle2, Clock, DollarSign } from "lucide-react"
import { DataTable } from "./components/data-table"
import { getColumns } from "./components/columns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatValueSkeleton } from "@/components/dashboard-page-skeleton"
import { useBills, useBillSummaryStats } from "@/hooks/api/use-bills"
import { useInfiniteClinics } from "@/hooks/api/use-clinics"
import { useInfiniteDoctors } from "@/hooks/api/use-doctors"
import { useInfinitePatients } from "@/hooks/api/use-patients"
import type { Bill } from "@/types/bill.types"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"
import { RoleGuard } from "@/components/role-guard"
import { useProfile } from "@/hooks/api/use-profile"

export default function BillingRecordsPage() {
  const { data: profile } = useProfile()
  const role = profile?.role
  
  const isDoctor = role === "doctor"
  const isClinicAdmin = role === "clinic_admin"
  const isReceptionist = role === "receptionist"

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


  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const { formatCurrencyCompact } = useCurrencyFormatter(true)

  // Infinite filter states — Clinic
  const [clinicFilter, setClinicFilter] = useState("")
  const [clinicSearch, setClinicSearch] = useState("")
  const [debouncedClinicSearch, setDebouncedClinicSearch] = useState("")

  // Infinite filter states — Doctor
  const [doctorFilter, setDoctorFilter] = useState("")
  const [doctorSearch, setDoctorSearch] = useState("")
  const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState("")

  // Infinite filter states — Patient
  const [patientFilter, setPatientFilter] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [debouncedPatientSearch, setDebouncedPatientSearch] = useState("")

  const [statusFilter, setStatusFilter] = useState<"" | "paid" | "unpaid">("")

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
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 500)
    return () => clearTimeout(t)
  }, [search])

  const apiDoctorId = isDoctor ? profile?._id : (doctorFilter || undefined)
  const apiClinicId = clinicFilter || (assignedClinicIds.length && (isClinicAdmin || isReceptionist) ? assignedClinicIds[0] : undefined)

  /** Role scope only — excludes table filters so KPI totals stay fixed while the grid filters. */
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

  const { data: statsResponse, isLoading: isStatsLoading } = useBillSummaryStats(statsScopeFilters, {
    enabled: !isDoctor || !!profile?._id,
  })

  useEffect(() => {
    setPage(1)
  }, [clinicFilter, doctorFilter, patientFilter, debouncedSearch, statusFilter])

  const { data: response, isLoading, error } = useBills(page, perPage, {
    search: debouncedSearch || undefined,
    patientId: patientFilter || undefined,
    doctorId: apiDoctorId,
    clinicId: apiClinicId,
    status: statusFilter || undefined,
  })

  // Infinite filter data sources
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
  } = useInfiniteDoctors(10, { 
    search: debouncedDoctorSearch,
    clinicId: apiClinicId,
    status: "active",
  }, !isDoctor)

  const {
    data: patientsInfiniteData,
    fetchNextPage: fetchNextPatientsPage,
    hasNextPage: hasNextPatientsPage,
    isFetchingNextPage: isFetchingNextPatientsPage,
    isLoading: isPatientsLoading,
  } = useInfinitePatients(10, { search: debouncedPatientSearch })

  const clinics = useMemo<Clinic[]>(() => {
    if (isDoctor || isClinicAdmin || isReceptionist) return assignedClinics
    if (!clinicsInfiniteData) return []
    return clinicsInfiniteData.pages.flatMap((p: any) => p.data || [])
  }, [clinicsInfiniteData, isDoctor, isClinicAdmin, isReceptionist, assignedClinics])

  const doctors = useMemo<Doctor[]>(() => {
    if (isDoctor && profile) return [{ _id: profile._id, firstName: profile.firstName, lastName: profile.lastName }] as Doctor[]
    if (!doctorsInfiniteData) return []
    return doctorsInfiniteData.pages.flatMap((p: any) => p.data || [])
  }, [doctorsInfiniteData, isDoctor, profile])

  const patients = useMemo(() => {
    if (!patientsInfiniteData) return []
    return patientsInfiniteData.pages.flatMap((p: any) => p.data || [])
  }, [patientsInfiniteData])

  const bills = useMemo(() => {
    if (!response) return []
    if (Array.isArray(response.data)) return response.data
    if (response.data && Array.isArray((response.data as any).data))
      return (response.data as any).data
    if (Array.isArray(response)) return response as any[]
    return []
  }, [response])

  const pagination = useMemo(() => {
    if (!response) return null
    if (response.pagination) return response.pagination
    if ((response.data as any)?.pagination) return (response.data as any).pagination
    const dataObj = response.data as any
    if (dataObj && typeof dataObj.total === "number") {
      const perPageVal = dataObj.limit || dataObj.perPage || 10
      return {
        total: dataObj.total,
        page: dataObj.page || 1,
        perPage: perPageVal,
        totalPages: dataObj.totalPages || Math.ceil(dataObj.total / perPageVal),
      }
    }
    return null
  }, [response])

  const enrichedBills = useMemo(() => {
    const getRefId = (value: unknown) => {
      if (!value) return ""
      if (typeof value === "string") return value
      if (typeof value === "object" && "_id" in (value as Record<string, unknown>))
        return String((value as Record<string, unknown>)._id || "")
      return ""
    }
    const doctorMap = new Map(doctors.map((d: any) => [String(d?._id || ""), d]))
    const clinicMap = new Map(clinics.map((c: any) => [String(c?._id || ""), c]))
    const patientMap = new Map(patients.map((p: any) => [String(p?._id || ""), p]))

    return bills.map((bill: Bill) => {
      const doctorId = getRefId(bill.doctor)
      const clinicId = getRefId(bill.clinic)
      const patientId = getRefId(bill.patient)
      const fullDoctor = doctorMap.get(doctorId)
      const fullClinic = clinicMap.get(clinicId)
      const fullPatient = patientMap.get(patientId)
      return {
        ...bill,
        doctor: typeof bill.doctor === "object" && bill.doctor ? { ...bill.doctor, ...(fullDoctor || {}) } : fullDoctor || bill.doctor,
        clinic: typeof bill.clinic === "object" && bill.clinic ? { ...bill.clinic, ...(fullClinic || {}) } : fullClinic || bill.clinic,
        patient: typeof bill.patient === "object" && bill.patient ? { ...bill.patient, ...(fullPatient || {}) } : fullPatient || bill.patient,
      } as Bill
    })
  }, [bills, doctors, clinics, patients])

  const stats = useMemo(() => {
    if (statsResponse?.stats) {
      const s = statsResponse.stats as {
        total: number
        paid?: number
        unpaid?: number
        pending?: number
        totalAmountSum?: number
      }
      const unpaid =
        typeof s.unpaid === "number"
          ? s.unpaid
          : typeof s.pending === "number"
            ? s.pending
            : 0
      const getPct = (count: number) => (s.total > 0 ? Math.round((count / s.total) * 100) : 0)
      const totalAmount =
        typeof s.totalAmountSum === "number"
          ? s.totalAmountSum
          : 0
      return {
        total: s.total,
        paid: s.paid ?? 0,
        unpaid,
        totalAmount,
        paidPct: getPct(s.paid || 0),
        unpaidPct: getPct(unpaid),
      }
    }
    return { total: 0, paid: 0, unpaid: 0, totalAmount: 0, paidPct: 0, unpaidPct: 0 }
  }, [statsResponse?.stats])

  const columns = useMemo(() => getColumns(formatCurrencyCompact, role), [formatCurrencyCompact, role])

  return (
    <RoleGuard permission="billing_access" fallback="forbidden">
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Billing Records</h1>
        <p className="text-muted-foreground">View and manage all patient billing records and payment status.</p>
      </div>

      <div className="flex h-full min-w-0 w-full flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Total Bills</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.total}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500"><ArrowUp className="size-3.5" />100%</span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 bg-primary/10 rounded-lg p-3"><FileText className="size-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Paid</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.paid}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500"><ArrowUp className="size-3.5" />{stats.paidPct}%</span>
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
                  <p className="text-muted-foreground text-sm font-medium">Unpaid</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.unpaid}</span>
                      <span className="flex items-center gap-0.5 text-sm text-orange-500"><ArrowUp className="size-3.5" />{stats.unpaidPct}%</span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 bg-primary/10 rounded-lg p-3"><Clock className="size-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Total Amount</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="break-words text-xl font-bold leading-tight sm:text-2xl">
                        {formatCurrencyCompact(stats.totalAmount)}
                      </span>
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
            <CardTitle>All Billing Records</CardTitle>
            <CardDescription>View, filter, and manage all your billing records in one place</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={enrichedBills}
              columns={columns}
              isLoading={isLoading && !bills.length}
              pageCount={pagination?.totalPages || 1}
              pageIndex={page - 1}
              pageSize={perPage}
              onPaginationChange={(p, s) => { setPage(p + 1); setPerPage(s) }}
              // Search
              search={search}
              onSearchChange={setSearch}
              // Clinic filter
              clinicFilter={clinicFilter}
              onClinicFilterChange={setClinicFilter}
              clinicOptions={clinics}
              onClinicsLoadMore={fetchNextClinicsPage}
              onClinicsSearchChange={setClinicSearch}
              hasNextClinicsPage={hasNextClinicsPage}
              isFetchingNextClinicsPage={isFetchingNextClinicsPage}
              isClinicsLoading={isClinicsLoading}
              // Doctor filter
              doctorFilter={doctorFilter}
              onDoctorFilterChange={setDoctorFilter}
              doctorOptions={doctors}
              onDoctorsLoadMore={fetchNextDoctorsPage}
              onDoctorsSearchChange={setDoctorSearch}
              hasNextDoctorsPage={hasNextDoctorsPage}
              isFetchingNextDoctorsPage={isFetchingNextDoctorsPage}
              isDoctorsLoading={isDoctorsLoading}
              // Patient filter
              patientFilter={patientFilter}
              onPatientFilterChange={setPatientFilter}
              patientOptions={patients}
              onPatientsLoadMore={fetchNextPatientsPage}
              onPatientsSearchChange={setPatientSearch}
              hasNextPatientsPage={hasNextPatientsPage}
              isFetchingNextPatientsPage={isFetchingNextPatientsPage}
              isPatientsLoading={isPatientsLoading}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              role={role}
            />
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
