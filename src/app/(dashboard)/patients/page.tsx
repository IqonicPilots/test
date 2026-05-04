"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowUp, CheckCircle2, UserPlus, Users, XCircle } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { usePermissions } from "@/hooks/use-permissions"

import { StatValueSkeleton } from "@/components/dashboard-page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "./components/data-table"
import { getColumns, type PatientTableRow } from "./components/columns"
import { ExportDialog, patientExportColumns } from "@/components/common/export-dialog"
import {
  PatientFormDialog,
  type PatientFormValues,
} from "./components/patient-form-dialog"
import {
  useCreatePatient,
  usePatients,
  useUpdatePatient,
  useDeletePatient,
  patientsQueryKey,
} from "@/hooks/api/use-patients"
import { ImportDialog } from "@/components/common/import-dialog"
import { Country, State } from "country-state-city"
import type { Patient } from "@/types/user.types"
import type { SystemConfig } from "@/types/system-config.types"
import { normalizeDialCountryCode } from "@/components/common/PhoneInputField"
import { getApiErrorMessage } from "@/lib/api/axios"
import { toast } from "sonner"

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

function buildPatientFormData(
  values: PatientFormValues,
  options?: { includeStatus?: boolean; countryCodeFallback?: string }
) {
  const formData = new FormData()
  const dial =
    normalizeCountryCode(values.countryCode) ||
    options?.countryCodeFallback ||
    "+1"

  formData.append("role", "patient")
  formData.append("email", values.email.trim().toLowerCase())
  formData.append("firstName", values.firstName.trim())
  formData.append("lastName", values.lastName.trim())
  formData.append("mobile", values.mobile.trim())
  formData.append("countryCode", dial)
  formData.append("dob", values.dateOfBirth)
  formData.append("gender", values.gender)

  if (values.bloodGroup?.trim()) {
    formData.append("bloodGroup", values.bloodGroup.trim())
  }

  const countryName = values.country ?
    (Country.getCountryByCode(values.country)?.name || values.country) : ""
  const stateName = (values.country && values.state) ?
    (State.getStateByCodeAndCountry(values.state, values.country)?.name || values.state) : (values.state || "")

  formData.append("address[street]", values.street?.trim() || "")
  formData.append("address[city]", values.city?.trim() || "")
  formData.append("address[state]", stateName)
  formData.append("address[country]", countryName)
  formData.append("address[postalCode]", values.postalCode?.trim() || "")

  if (options?.includeStatus) {
    formData.append("isActive", String(values.status === "Active"))
  }

  if (values.profilePicture instanceof File) {
    formData.append("profilePicture", values.profilePicture)
  } else if (values.profilePicture === "" || values.profilePicture === null) {
    formData.append("profilePicture", "")
  }

  return formData
}

import { RoleGuard } from "@/components/role-guard"

export default function PatientsPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined)

  const queryClient = useQueryClient()

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
  } = usePatients(page, perPage, {
    search: debouncedSearch || undefined,
    status: statusFilter ? (statusFilter as "active" | "inactive") : undefined,
    startDate: dateFilter?.from ? format(dateFilter.from, "yyyy-MM-dd") : undefined,
    endDate: dateFilter?.to ? format(dateFilter.to, "yyyy-MM-dd") : undefined,
  })
  const { data: summaryResponse, isLoading: isSummaryLoading } = usePatients(1, 1)

  const { can, isLoading: isPermissionsLoading } = usePermissions()
  const createPatientMutation = useCreatePatient()
  const updatePatientMutation = useUpdatePatient()
  const deletePatientMutation = useDeletePatient()
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const rawData = useMemo(() => {
    if (!response) return []
    return response.data || []
  }, [response])

  const pagination = useMemo(() => {
    if (!response) return null
    return response.pagination || null
  }, [response])

  const patientsRows: PatientTableRow[] = useMemo(() => {
    return rawData.map((patient: any) => ({
      id: patient._id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      avatar: getInitials(patient.firstName, patient.lastName),
      avatarUrl: patient.meta?.profilePicture ?? patient.meta?.avatar,
      mobile: formatMobile(patient.countryCode, patient.mobile),
      gender: patient.meta?.gender ?? "",
      dateOfBirth: patient.meta?.dob ?? "",
      bloodGroup: patient.meta?.bloodGroup,
      registeredOn: patient.createdAt,
      status: patient.isActive ? "Active" : "Inactive",
      sourcePatient: patient,
    })).sort((a: any, b: any) => new Date(b.registeredOn).getTime() - new Date(a.registeredOn).getTime())
  }, [rawData])

  const handleToggleStatus = useCallback(
    (patient: Patient, nextStatus: boolean) => {
      const formData = new FormData()
      formData.append("isActive", String(nextStatus))
      updatePatientMutation.mutate({
        id: patient._id,
        data: formData,
      })
    },
    [updatePatientMutation]
  )

  const handleEditPatient = useCallback((patient: Patient) => {
    setSelectedPatient(patient)
    setDialogMode("edit")
  }, [])

  const handleDeletePatient = useCallback((patient: Patient) => {
    deletePatientMutation.mutate(patient._id)
  }, [deletePatientMutation])

  const handleAddPatient = useCallback(() => {
    setSelectedPatient(null)
    setDialogMode("add")
  }, [])

  function closeDialog() {
    setDialogMode(null)
    setSelectedPatient(null)
  }

  const handleImportPatients = async (parsedRows: any[]) => {
    const parseExcelDate = (val: any): string => {
      if (!val) return ""
      // If the value is an Excel serial number (e.g. 32060)
      if (!isNaN(Number(val)) && Number(val) > 10000) {
        const excelEpoch = new Date(1899, 11, 30) // Excel starts counting from Dec 30, 1899
        const dateObj = new Date(excelEpoch.getTime() + Number(val) * 86400000)
        return dateObj.toISOString().split("T")[0]
      }
      // If it's a string, try converting standard date strings
      const parsed = new Date(val)
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0]
      }
      return String(val).trim()
    }

    try {
      const cfg = queryClient.getQueryData<SystemConfig>(["system-config"])
      const countryCodeFallback = normalizeDialCountryCode(cfg?.country_code) || "+1"

      for (const row of parsedRows) {
        // Map common variations of column names
        const firstName = row["First Name"] || row["firstName"] || ""
        const lastName = row["Last Name"] || row["lastName"] || ""
        const email = row["Email"] || row["email"] || ""
        const mobile = String(row["Phone Number"] || row["Contact Number"] || row["Mobile"] || row["mobile"] || "")
        const gender = (row["Gender"] || row["gender"] || "Male").toString()
        const dob = parseExcelDate(row["Date of Birth"] || row["DOB"] || row["dateOfBirth"])
        const status = row["Status"] || row["status"] || "Active"
        
        let countryCodeArg = ""
        const rawCountry = (row["Country"] || row["country"] || "").trim()
        if (rawCountry) {
          const c = Country.getAllCountries().find(c => c.name.toLowerCase() === rawCountry.toLowerCase() || c.isoCode.toLowerCase() === rawCountry.toLowerCase())
          countryCodeArg = c ? c.isoCode : rawCountry
        }

        let stateCodeArg = ""
        const rawState = (row["State"] || row["state"] || "").trim()
        if (rawState && countryCodeArg && countryCodeArg.length === 2) {
          const s = State.getStatesOfCountry(countryCodeArg).find(s => s.name.toLowerCase() === rawState.toLowerCase() || s.isoCode.toLowerCase() === rawState.toLowerCase())
          stateCodeArg = s ? s.isoCode : rawState
        } else {
          stateCodeArg = rawState
        }

        const values: PatientFormValues = {
          firstName,
          lastName,
          email,
          mobile,
          countryCode: row["Country Code"] || row["countryCode"] || countryCodeFallback,
          gender: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase(),
          dateOfBirth: dob,
          status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
          bloodGroup: row["Blood Group"] || row["bloodGroup"] || "",
          street: row["Address"] || row["street"] || "",
          city: row["City"] || row["city"] || "",
          state: stateCodeArg,
          country: countryCodeArg,
          postalCode: String(row["Postal Code"] || row["postalCode"] || ""),
        }

        await createPatientMutation.mutateAsync({
          data: buildPatientFormData(values, { countryCodeFallback, includeStatus: true }),
          quiet: true
        })
      }
      queryClient.invalidateQueries({ queryKey: patientsQueryKey })
    } catch (error) {
      const errMsg = getApiErrorMessage(error)
      toast.error(`Failed to import patients: ${errMsg}`)
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to import batch of patients:", errMsg)
      }
      return false
    }
  }

  function handleSubmitPatient(values: PatientFormValues) {
    const onSuccess = () => closeDialog()
    const cfg = queryClient.getQueryData<SystemConfig>(["system-config"])
    const countryCodeFallback =
      normalizeDialCountryCode(cfg?.country_code) || "+1"

    if (dialogMode === "edit" && selectedPatient) {
      updatePatientMutation.mutate(
        {
          id: selectedPatient._id,
          data: buildPatientFormData(values, {
            includeStatus: true,
            countryCodeFallback,
          }),
        },
        { onSuccess }
      )
    } else {
      createPatientMutation.mutate(
        { data: buildPatientFormData(values, { countryCodeFallback }) },
        { onSuccess }
      )
    }
  }

  const columns = useMemo(
    () =>
      getColumns({
        onEditPatient: handleEditPatient,
        onDeletePatient: handleDeletePatient,
        onToggleStatus: handleToggleStatus,
        isBusy: updatePatientMutation.isPending || deletePatientMutation.isPending,
        can,
      }),
    [handleEditPatient, handleDeletePatient, handleToggleStatus, updatePatientMutation.isPending, deletePatientMutation.isPending, can]
  )

  const patientStats = useMemo(() => {
    const lastPage = summaryResponse || response
    
    // Priority 1: Use server-provided global stats
    if (lastPage?.stats) {
      const s = lastPage.stats
      const getPct = (count: number) => (s.total > 0 ? Math.round((count / s.total) * 100) : 0)
      return {
        total: s.total,
        active: s.active,
        inactive: s.inactive,
        newThisMonth: s.newThisMonth ?? 0,
        activePct: getPct(s.active),
        inactivePct: getPct(s.inactive),
        newThisMonthPct: getPct(s.newThisMonth ?? 0),
      }
    }

    // Priority 2: Fallback to current page calculation
    const total = pagination?.total || 0
    const active = rawData.filter((p: any) => p.isActive).length
    const inactive = rawData.filter((p: any) => !p.isActive).length
    const now = new Date()
    const newThisMonth = rawData.filter((p: any) => {
      const created = new Date(p.createdAt)
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()
    }).length
    const getPct = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0)
    return {
      total,
      active,
      inactive,
      newThisMonth,
      activePct: getPct(active),
      inactivePct: getPct(inactive),
      newThisMonthPct: getPct(newThisMonth),
    }
  }, [pagination, rawData, response, summaryResponse])

  if (isLoading || isPermissionsLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 md:px-6 py-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="mt-4 grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-lg mt-6" />
      </div>
    )
  }

  if (!can("patient_access")) {
    return (
      <div className="flex flex-col gap-2 px-4 md:px-6 py-8 items-center text-center">
        <Users className="h-12 w-12 text-muted-foreground opacity-20 mb-2" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground max-w-sm">
          You don't have permission to view patient records. Please contact your administrator.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        Error loading patients
      </div>
    )
  }

  return (
    <RoleGuard permission="patient_access" fallback="forbidden">
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
        <p className="text-muted-foreground">
          Manage patient records and their health information.
        </p>
      </div>
      <div className="flex h-full min-w-0 w-full flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Total Patients</p>
                  {isSummaryLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{patientStats.total}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        100%
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 bg-primary/10 rounded-lg p-3">
                  <Users className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium">Active</p>
                  {isSummaryLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{patientStats.active}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {patientStats.activePct}%
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
                  {isSummaryLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{patientStats.inactive}</span>
                      <span className="flex items-center gap-0.5 text-sm text-orange-500">
                        <ArrowUp className="size-3.5" />
                        {patientStats.inactivePct}%
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
                  <p className="text-muted-foreground text-sm font-medium">New Patients <span className="text-[10px] text-muted-foreground">( This Month )</span></p>
                  {isSummaryLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{patientStats.newThisMonth}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {patientStats.newThisMonthPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 bg-primary/10 rounded-lg p-3">
                  <UserPlus className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Patients</CardTitle>
            <CardDescription>
              View, filter, and manage all your patients in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={patientsRows}
              toolbarConfig={{
                searchPlaceholder: "Search patients...",
                addButton: can("patient_add") ? { label: "Add Patient", onClick: handleAddPatient } : undefined,
                dateRangeFilter: { columnId: "registeredOn" },
                selectFilter: {
                  columnId: "status",
                  placeholder: "Status",
                  options: [
                    { label: "Active", value: "active" },
                    { label: "Inactive", value: "inactive" },
                  ],
                  allLabel: "All Status",
                },
                showViewOptions: true,
                serverSideFilters: true,
                extraActions: (
                  <div className="flex items-center gap-3">
                    <ImportDialog
                      onImport={handleImportPatients}
                      title="Import Patients"
                      buttonLabel="Import"
                      requiredFields={[
                        "First Name",
                        "Last Name",
                        "Email",
                        "Phone Number",
                        "Date of Birth",
                        "Gender",
                        "Status",
                      ]}
                      notes={[
                        "Date of Birth must be YYYY-MM-DD (e.g., 1990-12-31).",
                        "Gender must be 'Male', 'Female', or 'Other'.",
                        "Status must be 'Active' or 'Inactive'.",
                      ]}
                    />
                    <ExportDialog
                      data={patientsRows}
                      columns={patientExportColumns}
                      filename="patients"
                      title="Export Patients"
                    />
                  </div>
                ),
                filterState: {
                  search: searchQuery,
                  status: statusFilter || "all",
                  dateRange: dateFilter,
                },
                onSearchChange: (val) => setSearchQuery(val),
                onFilterChange: (filters: any) => {
                  if (filters.status !== undefined) {
                    setStatusFilter(filters.status === "all" ? "" : filters.status)
                  }
                  if (filters.search !== undefined) {
                    setSearchQuery(filters.search)
                  }
                  if (filters.dateRange !== undefined) {
                    setDateFilter(filters.dateRange)
                  }
                },
                onResetFilters: () => {
                   setSearchQuery("")
                   setStatusFilter("")
                   setDateFilter(undefined)
                   setPage(1)
                }
              }}
              isLoading={isLoading && !rawData.length}
              pageCount={pagination?.totalPages || 0}
              pageIndex={page - 1}
              pageSize={perPage}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => setPerPage(s)}
              maxHeight="400px"
              serverSideFiltering={true}
            />
          </CardContent>
        </Card>
      </div>

      {dialogMode ? (
        <PatientFormDialog
          mode={dialogMode}
          patient={selectedPatient}
          isSubmitting={
            createPatientMutation.isPending ||
            updatePatientMutation.isPending
          }
          onSubmit={handleSubmitPatient}
          open={Boolean(dialogMode)}
          onOpenChange={(open) => {
            if (!open) closeDialog()
          }}
          hideTrigger
        />
      ) : null}
    </RoleGuard>
  )
}
