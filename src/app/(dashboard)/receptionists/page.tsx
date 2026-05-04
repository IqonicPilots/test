"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowUp, Building2, CheckCircle2, UserCheck, XCircle } from "lucide-react"

import { StatValueSkeleton } from "@/components/dashboard-page-skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "./components/data-table"
import { getColumns, type ReceptionistTableRow } from "./components/columns"
import {
  ReceptionistFormDialog,
  type ReceptionistFormValues,
} from "./components/receptionist-form-dialog"
import { useClinics, useInfiniteClinics } from "@/hooks/api/use-clinics"
import { useProfile } from "@/hooks/api/use-profile"
import {
  receptionistsQueryKey,
  useCreateReceptionist,
  useDeleteReceptionist,
  useReceptionists,
  useReceptionistSummaryStats,
  useUpdateReceptionist,
} from "@/hooks/api/use-receptionists"
import type { Clinic } from "@/types/clinic.types"
import { Country, State } from "country-state-city"
import type { ProfileClinic, Receptionist } from "@/types/user.types"
import type { SystemConfig } from "@/types/system-config.types"
import { normalizeDialCountryCode } from "@/components/common/PhoneInputField"
import { getApiErrorMessage } from "@/lib/api/axios"
import { toast } from "sonner"
import { createReceptionist } from "@/services/user.service"
import { RoleGuard } from "@/components/role-guard"

function getInitials(firstName?: string, lastName?: string) {
  const first = firstName?.[0] ?? ""
  const last = lastName?.[0] ?? ""
  return `${first}${last}`.toUpperCase()
}

function formatMobile(countryCode?: string, mobile?: string) {
  return [countryCode, mobile].filter(Boolean).join("") || "N/A"
}

function getClinicReference(
  value: string | ProfileClinic | undefined | null
) {
  if (!value) return { id: "", name: "", email: "", cliniclogo: "", mobile: "", address: undefined as any }
  if (typeof value === "string") return { id: value, name: "", email: "", cliniclogo: "", mobile: "", address: undefined as any }
  const extended = value as ProfileClinic & { cliniclogo?: string; mobile?: string; address?: any }
  return {
    id: value._id,
    name: value.name ?? "",
    email: value.email ?? "",
    cliniclogo: extended.cliniclogo ?? "",
    mobile: extended.mobile ?? "",
    address: extended.address,
  }
}

function buildClinicMaps(clinics: Clinic[]) {
  return {
    clinicNameMap: new Map(clinics.map((c) => [c._id, c.name])),
    clinicEmailMap: new Map(clinics.map((c) => [c._id, c.email])),
    clinicLogoMap: new Map(clinics.map((c) => [c._id, c.cliniclogo])),
  }
}

function buildReceptionistFormData(
  values: ReceptionistFormValues,
  options?: { isActive?: boolean; countryCodeFallback?: string }
) {
  const formData = new FormData()
  const dial =
    values.countryCode.trim() ||
    options?.countryCodeFallback ||
    "+1"

  formData.append("role", "receptionist")
  formData.append("email", values.email.trim().toLowerCase())
  formData.append("firstName", values.firstName.trim())
  formData.append("lastName", values.lastName.trim())
  formData.append("mobile", values.mobile.trim())
  formData.append("countryCode", dial)
  formData.append("dob", values.dateOfBirth)
  formData.append("gender", values.gender)
  formData.append("clinics[0]", values.clinicId)

  if (options?.isActive !== undefined) {
    formData.append("isActive", String(options.isActive))
  }

  if (values.address?.trim()) {
    formData.append("address[street]", values.address.trim())
  }
  if (values.city?.trim()) {
    formData.append("address[city]", values.city.trim())
  }
  const stateName = (values.country && values.state) ?
    (State.getStateByCodeAndCountry(values.state, values.country)?.name || values.state) : (values.state || "")
  const countryName = values.country ?
    (Country.getCountryByCode(values.country)?.name || values.country) : ""
  if (stateName) {
    formData.append("address[state]", stateName)
  }
  if (countryName) {
    formData.append("address[country]", countryName)
  }
  if (values.postalCode?.trim()) {
    formData.append("address[postalCode]", values.postalCode.trim())
  }

  if (values.profileImage instanceof File) {
    formData.append("profilePicture", values.profileImage)
  } else if (values.profileImage === "" || values.profileImage === null) {
    formData.append("profilePicture", "")
  }

  return formData
}

function toReceptionistFormValues(
  receptionist: Receptionist
): ReceptionistFormValues {
  const address = receptionist.meta?.address
  const addressObject =
    typeof address === "object" && address !== null ? address : undefined
  const clinicReference = getClinicReference(
    receptionist.meta?.clinics?.[0]
  )

  return {
    profileImage:
      receptionist.meta?.profilePicture ?? receptionist.meta?.avatar ?? null,
    firstName: receptionist.firstName ?? "",
    lastName: receptionist.lastName ?? "",
    email: receptionist.email ?? "",
    mobile: receptionist.mobile ?? "",
    countryCode: receptionist.countryCode ?? "",
    gender: receptionist.meta?.gender ?? "",
    dateOfBirth: receptionist.meta?.dob
      ? receptionist.meta.dob.split("T")[0] ?? receptionist.meta.dob
      : "",
    clinicId: clinicReference.id,
    status: receptionist.isActive ? "Active" : "Inactive",
    address:
      typeof address === "string" ? address : addressObject?.street ?? "",
    city: addressObject?.city ?? "",
    state: (addressObject?.state && addressObject?.state.length > 2 && addressObject?.country) ?
      (State.getStatesOfCountry(Country.getAllCountries().find(c => c.name === addressObject.country || c.isoCode === addressObject.country)?.isoCode || "").find(s => s.name === addressObject.state)?.isoCode || addressObject.state) : (addressObject?.state ?? ""),
    country: (addressObject?.country && addressObject?.country.length > 2) ?
      (Country.getAllCountries().find(c => c.name === addressObject.country)?.isoCode || addressObject.country) : (addressObject?.country ?? ""),
    postalCode: addressObject?.postalCode ?? "",
  }
}

export default function ReceptionistsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [clinicFilter, setClinicFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

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

  const { data: statsResponse, isLoading: isStatsLoading } =
    useReceptionistSummaryStats(statsScopeFilters)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const {
    data: response,
    isLoading,
    error,
  } = useReceptionists(page, perPage, {
    clinicId: apiClinicId,
    status: statusFilter ? (statusFilter.toLowerCase() as "active" | "inactive") : undefined,
    search: debouncedSearch || undefined,
  })

  const [clinicSearch, setClinicSearch] = useState("")
  const [debouncedClinicSearch, setDebouncedClinicSearch] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedClinicSearch(clinicSearch.trim())
    }, 350)
    return () => window.clearTimeout(timer)
  }, [clinicSearch])

  const {
    data: clinicsInfiniteData,
    fetchNextPage: fetchNextClinicsPage,
    hasNextPage: hasNextClinicsPage,
    isFetchingNextPage: isFetchingNextClinicsPage,
    isLoading: isClinicsLoading
  } = useInfiniteClinics(10, { search: debouncedClinicSearch })

  const clinics = useMemo<Clinic[]>(() => {
    if (!clinicsInfiniteData) return []
    return clinicsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [clinicsInfiniteData])

  const { data: mappingClinicsResponse } = useClinics(1, 100, true, { isActive: true })
  const mappingClinics = useMemo(() => mappingClinicsResponse?.data || [], [mappingClinicsResponse])

  const availableClinics = useMemo(() => {
    if (!isClinicAdminOrReceptionist) return clinics
    if (!assignedClinicIds.length) return clinics
    return clinics.filter((clinic: Clinic) => assignedClinicIds.includes(clinic._id))
  }, [clinics, assignedClinicIds, isClinicAdminOrReceptionist])

  useEffect(() => {
    if (!isClinicAdminOrReceptionist || !assignedClinicIds.length) return

    if (!clinicFilter || !assignedClinicIds.includes(clinicFilter)) {
      setClinicFilter(assignedClinicIds[0])
    }
  }, [isClinicAdminOrReceptionist, assignedClinicIds, clinicFilter])

  const createReceptionistMutation = useCreateReceptionist()
  const updateReceptionistMutation = useUpdateReceptionist()
  const deleteReceptionistMutation = useDeleteReceptionist()
  const [editReceptionist, setEditReceptionist] =
    useState<Receptionist | null>(null)

  const rawReceptionists = useMemo(() => {
    if (!response) return []
    return response.data || []
  }, [response])

  const pagination = useMemo(() => {
    if (!response) return null
    return response.pagination || null
  }, [response])

  const { clinicNameMap, clinicEmailMap, clinicLogoMap } = useMemo(
    () => buildClinicMaps(clinics),
    [clinics]
  )

  const receptionistRows: ReceptionistTableRow[] = useMemo(() => {
    return rawReceptionists.map(
      (receptionist: any) => {
        const clinicReference = getClinicReference(
          receptionist.meta?.clinics?.[0]
        )
        const clinicName =
          clinicReference.name ||
          clinicNameMap.get(clinicReference.id) ||
          "Unassigned"
        const clinicEmail =
          clinicReference.email ||
          clinicEmailMap.get(clinicReference.id) ||
          "N/A"
        const clinicLogo = clinicReference.cliniclogo || clinicLogoMap.get(clinicReference.id)

        return {
          id: receptionist._id,
          firstName: receptionist.firstName,
          lastName: receptionist.lastName,
          email: receptionist.email,
          avatar: getInitials(receptionist.firstName, receptionist.lastName),
          avatarUrl:
            receptionist.meta?.profilePicture ?? receptionist.meta?.avatar,
          mobile: formatMobile(receptionist.countryCode, receptionist.mobile),
          clinic: clinicName,
          clinicEmail,
          clinicAvatarUrl: clinicLogo,
          registeredOn: receptionist.createdAt,
          status: receptionist.isActive ? "Active" : "Inactive",
          sourceReceptionist: receptionist,
        }
      }
    )
  }, [rawReceptionists, clinicNameMap, clinicEmailMap, clinicLogoMap])

  const countryCodeFallback = useCallback(() => {
    const cfg = queryClient.getQueryData<SystemConfig>(["system-config"])
    return normalizeDialCountryCode(cfg?.country_code) || "+1"
  }, [queryClient])

  const handleAddReceptionist = useCallback(
    (values: ReceptionistFormValues) => {
      const formData = buildReceptionistFormData(values, {
        countryCodeFallback: countryCodeFallback(),
      })
      createReceptionistMutation.mutate(formData)
    },
    [createReceptionistMutation, countryCodeFallback]
  )

  const handleEditReceptionist = useCallback(
    (receptionist: Receptionist) => {
      setEditReceptionist(receptionist)
    },
    []
  )

  const handleUpdateReceptionist = (values: ReceptionistFormValues) => {
    if (!editReceptionist) return
    const formData = buildReceptionistFormData(values, {
      isActive: values.status === "Active",
      countryCodeFallback: countryCodeFallback(),
    })
    updateReceptionistMutation.mutate(
      { id: editReceptionist._id, data: formData },
      { onSuccess: () => setEditReceptionist(null) }
    )
  }

  const handleImportReceptionists = async (data: any[]) => {
    try {
      const cfg = queryClient.getQueryData<SystemConfig>(["system-config"])
      const dialFb = normalizeDialCountryCode(cfg?.country_code) || "+1"

      for (const row of data) {
        const clinicName = row["Clinic Name"] || row["Clinic"]
        const matchedClinic = mappingClinics.find(
          (c: any) => c.name.toLowerCase() === clinicName?.toString().toLowerCase()
        )

        if (!matchedClinic) continue
        const rawGender = (row["Gender"] || "Other").toString().trim()
        const gender = rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase()

        let dob = (row["Date of Birth"] || "").toString().trim()
        if (!isNaN(Number(dob)) && dob.length > 4) {
          const date = new Date((Number(dob) - 25569) * 86400 * 1000)
          dob = date.toISOString().split('T')[0]
        }

        const formData = new FormData()
        formData.append("role", "receptionist")
        formData.append("firstName", (row["First Name"] || "").toString().trim())
        formData.append("lastName", (row["Last Name"] || "").toString().trim())
        formData.append("email", (row["Email"] || "").toString().trim().toLowerCase())
        formData.append("mobile", (row["Phone Number"] || row["Contact Number"] || row["Mobile"] || "").toString().trim())
        formData.append("countryCode", dialFb)
        formData.append("dob", dob)
        formData.append("gender", gender)
        formData.append("clinics[0]", matchedClinic._id)
        formData.append("isActive", String(row["Status"]?.toString().trim().toLowerCase() === "active"))

        if (row["Address"]) formData.append("address[street]", row["Address"].toString())
        if (row["City"]) formData.append("address[city]", row["City"].toString())
        if (row["State"]) formData.append("address[state]", row["State"].toString())
        if (row["Country"]) formData.append("address[country]", row["Country"].toString())
        if (row["Postal Code"] || row["Zip Code"]) formData.append("address[postalCode]", (row["Postal Code"] || row["Zip Code"]).toString())

        await createReceptionist(formData)
      }
      queryClient.invalidateQueries({ queryKey: receptionistsQueryKey })
      toast.success("Receptionists imported successfully")
    } catch (error) {
      const errMsg = getApiErrorMessage(error)
      toast.error(`Failed to import receptionists: ${errMsg}`)
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to import batch of receptionists:", errMsg)
      }
      return false
    }
  }

  const handleToggleStatus = useCallback(
    (receptionist: Receptionist, nextStatus: boolean) => {
      const cfg = queryClient.getQueryData<SystemConfig>(["system-config"])
      const dialFb = normalizeDialCountryCode(cfg?.country_code) || "+1"
      const formData = buildReceptionistFormData(
        toReceptionistFormValues(receptionist),
        { isActive: nextStatus, countryCodeFallback: dialFb }
      )
      updateReceptionistMutation.mutate({
        id: receptionist._id,
        data: formData,
      })
    },
    [queryClient, updateReceptionistMutation]
  )

  const columns = useMemo(
    () =>
      getColumns({
        onDeleteReceptionist: (id) => deleteReceptionistMutation.mutate(id),
        onEditReceptionist: handleEditReceptionist,
        onToggleStatus: handleToggleStatus,
        isBusy: updateReceptionistMutation.isPending || deleteReceptionistMutation.isPending,
      }),
    [handleEditReceptionist, handleToggleStatus, updateReceptionistMutation.isPending]
  )

  const receptionistStats = useMemo(() => {
    if (!statsResponse?.stats) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        clinics: 0,
        activePct: 0,
        inactivePct: 0,
        clinicsPct: 0,
      }
    }
    const s = statsResponse.stats as {
      total: number
      active?: number
      inactive?: number
      clinicsCount?: number
    }
    const getPct = (count: number) => (s.total > 0 ? Math.round((count / s.total) * 100) : 0)
    const clinics =
      typeof s.clinicsCount === "number" ? s.clinicsCount : 0
    return {
      total: s.total,
      active: s.active ?? 0,
      inactive: s.inactive ?? 0,
      clinics,
      activePct: getPct(s.active || 0),
      inactivePct: getPct(s.inactive || 0),
      clinicsPct: getPct(clinics),
    }
  }, [statsResponse?.stats])

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">Error loading receptionists</div>
  }

  return (
    <RoleGuard permission="receptionist_access" fallback="forbidden">
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Receptionists</h1>
        <p className="text-muted-foreground">Manage front desk staff and their assignments.</p>
      </div>
      <div className="flex h-full min-w-0 w-full flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Receptionists</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{receptionistStats.total}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500"><ArrowUp className="size-3.5" />100%</span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3"><UserCheck className="size-6 text-primary" /></div>
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
                      <span className="text-2xl font-bold">{receptionistStats.active}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500"><ArrowUp className="size-3.5" />{receptionistStats.activePct}%</span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3"><CheckCircle2 className="size-6 text-primary" /></div>
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
                      <span className="text-2xl font-bold">{receptionistStats.inactive}</span>
                      <span className="flex items-center gap-0.5 text-sm text-orange-500"><ArrowUp className="size-3.5" />{receptionistStats.inactivePct}%</span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3"><XCircle className="size-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Clinics</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{receptionistStats.clinics}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500"><ArrowUp className="size-3.5" />{receptionistStats.clinicsPct}%</span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3"><Building2 className="size-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Receptionists</CardTitle>
            <CardDescription>View, filter, and manage all your receptionists in one place</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={receptionistRows}
              receptionists={receptionistRows}
              clinics={availableClinics}
              onAddReceptionist={handleAddReceptionist}
              onImportReceptionists={handleImportReceptionists}
              isCreateBusy={createReceptionistMutation.isPending}
              isLoading={isLoading && !rawReceptionists.length}
              pageCount={pagination?.totalPages || 0}
              pageIndex={page - 1}
              pageSize={perPage}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => setPerPage(s)}
              clinicFilter={clinicFilter}
              onClinicFilterChange={setClinicFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onResetFilters={() => {
                setClinicFilter("")
                setStatusFilter("")
                setSearchQuery("")
                setDebouncedSearch("")
              }}
              onClinicsLoadMore={fetchNextClinicsPage}
              onClinicsSearchChange={setClinicSearch}
              hasNextClinicsPage={hasNextClinicsPage}
              isFetchingNextClinicsPage={isFetchingNextClinicsPage}
              isClinicsLoading={isClinicsLoading}
              role={role}
            />
          </CardContent>
        </Card>
      </div>

      {editReceptionist && (
        <ReceptionistFormDialog
          mode="edit"
          receptionist={editReceptionist}
          clinics={clinics}
          isSubmitting={updateReceptionistMutation.isPending}
          onSubmit={handleUpdateReceptionist}
          open={Boolean(editReceptionist)}
          onOpenChange={(isOpen) => { if (!isOpen) setEditReceptionist(null) }}
          hideTrigger
          onClinicsLoadMore={fetchNextClinicsPage}
          onClinicsSearchChange={setClinicSearch}
          hasNextClinicsPage={hasNextClinicsPage}
          isFetchingNextClinicsPage={isFetchingNextClinicsPage}
          isClinicsLoading={isClinicsLoading}
        />
      )}
    </RoleGuard>
  )
}
