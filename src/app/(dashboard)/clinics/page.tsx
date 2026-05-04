"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowUp, Building2, CheckCircle2, Stethoscope, XCircle } from "lucide-react"
import { DataTable } from "./components/data-table"
import { getColumns } from "./components/columns"
import { useQueryClient } from "@tanstack/react-query"
import type { SystemConfig } from "@/types/system-config.types"
import { normalizeDialCountryCode } from "@/components/common/PhoneInputField"
import { useClinics, useClinicSummaryStats, useDeleteClinic, useUpdateClinic, clinicsQueryKey } from "@/hooks/api/use-clinics"
import { useResendCredentials } from "@/hooks/api/use-auth"
import { clinicApi } from "@/services/clinic.service"
import { getApiErrorMessage } from "@/lib/api/axios"
import { toast } from "sonner"
import { StatValueSkeleton } from "@/components/dashboard-page-skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleGuard } from "@/components/role-guard"

interface ClinicFormValues {
  name: string
  email: string
  adminFirstName: string
  adminLastName: string
  adminEmail: string
  contactNo: string
  contactNoCountryCode?: string
  adminMobile: string
  adminMobileCountryCode?: string
  clinicSpecialties: string[]
  address: string
  status: string
  city: string
  state: string
  country: string
  postalCode: string
  adminDateOfBirth: string
  adminGender: string
}

export default function ClinicsPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: statsResponse, isLoading: isStatsLoading } = useClinicSummaryStats()

  const {
    data: response,
    isLoading,
    error,
  } = useClinics(page, perPage, true, {
    search: debouncedSearch || undefined,
    isActive: statusFilter === "Active" ? true : statusFilter === "Inactive" ? false : undefined
  })

  const deleteClinicMutation = useDeleteClinic()
  const updateClinicMutation = useUpdateClinic()
  const resendCredentialsMutation = useResendCredentials()

  const rawClinics = useMemo(() => {
    if (!response) return []
    return response.data || []
  }, [response])

  const pagination = useMemo(() => {
    if (!response) return null
    return response.pagination || null
  }, [response])

  const queryClient = useQueryClient()

  const systemDialFallback = () => {
    const cfg = queryClient.getQueryData<SystemConfig>(["system-config"])
    return normalizeDialCountryCode(cfg?.country_code) || "+1"
  }

  const handleAddClinic = (data: ClinicFormValues) => {
    // Handled internally by ClinicFormDialog trigger in DataTable
  }

  const handleImportClinics = async (clinics: ClinicFormValues[]) => {
    try {
      for (const data of clinics) {
        const formData = new FormData()
        const clinicDial = data.contactNoCountryCode?.trim() || systemDialFallback()
        const adminDial = data.adminMobileCountryCode?.trim() || systemDialFallback()

        formData.append('name', data.name)
        formData.append('email', data.email)
        formData.append('mobile', data.contactNo)
        formData.append('countryCode', clinicDial)
        formData.append('isActive', String(data.status === 'Active'))

        formData.append('address[street]', data.address)
        formData.append('address[city]', data.city)
        formData.append('address[state]', data.state)
        formData.append('address[country]', data.country)
        formData.append('address[postalCode]', data.postalCode)

        formData.append('clinicAdmin[email]', data.adminEmail)
        formData.append('clinicAdmin[firstName]', data.adminFirstName)
        formData.append('clinicAdmin[lastName]', data.adminLastName)
        formData.append('clinicAdmin[mobile]', data.adminMobile)
        formData.append('clinicAdmin[countryCode]', adminDial)
        formData.append('clinicAdmin[dob]', data.adminDateOfBirth)
        formData.append('clinicAdmin[gender]', data.adminGender)

        if (data.clinicSpecialties && data.clinicSpecialties.length > 0) {
          data.clinicSpecialties.forEach((speciality, index) => {
            formData.append(`clinic_specialties[${index}]`, speciality)
          })
        }

        await clinicApi.createClinic(formData)
      }
      queryClient.invalidateQueries({ queryKey: clinicsQueryKey })
    } catch (error) {
      const errMsg = getApiErrorMessage(error)
      toast.error(`Failed to import clinics: ${errMsg}`)
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to import batch of clinics:", errMsg)
      }
      return false
    }
  }

  const handleDeleteClinic = (id: string) => {
    deleteClinicMutation.mutate(id)
  }

  const handleResendCredentials = async (user: { id: string; name: string; email: string; avatar?: string; role?: string }) => {
    if (!user.id) {
      throw new Error("Unable to resend credentials: missing clinic admin user id.")
    }

    await resendCredentialsMutation.mutateAsync({ userId: user.id })
  }

  const handleToggleStatus = async (id: string, nextStatus: boolean) => {
    const formData = new FormData()
    formData.append("isActive", String(nextStatus))
    updateClinicMutation.mutate({ id, data: formData })
  }

  const columns = useMemo(
    () => getColumns({
      onDeleteClinic: handleDeleteClinic,
      onToggleStatus: handleToggleStatus,
      onResendCredentials: handleResendCredentials,
    }),
    [handleDeleteClinic, handleResendCredentials, handleToggleStatus]
  )

  const stats = useMemo(() => {
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

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">Error loading clinics</div>
  }

  return (
    <RoleGuard permission="clinic_list" fallback="forbidden">
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Clinics</h1>
        <p className="text-muted-foreground">
          Manage your clinic network and their configurations.
        </p>
      </div>
      <div className="flex h-full min-w-0 w-full flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Clinics</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
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
                  <Building2 className="size-6 text-primary" />
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
                      <span className="text-2xl font-bold">{stats.active}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {stats.activePct}%
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
                      <span className="text-2xl font-bold">{stats.inactive}</span>
                      <span className="flex items-center gap-0.5 text-sm text-orange-500">
                        <ArrowUp className="size-3.5" />
                        {stats.inactivePct}%
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
                  <p className="text-muted-foreground text-sm font-medium">Specialties</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.specialties}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {stats.specialtiesPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <Stethoscope className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Clinics</CardTitle>
            <CardDescription>
              View, filter, and manage all your clinics in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={rawClinics}
              columns={columns}
              onAddClinic={handleAddClinic}
              onImportClinics={handleImportClinics}
              isLoading={isLoading && !rawClinics.length}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              pageCount={pagination?.totalPages || 0}
              pageIndex={page - 1}
              pageSize={perPage}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => setPerPage(s)}
            />
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
