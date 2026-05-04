"use client"

import { useEffect, useMemo, useState } from "react"
import { DataTable } from "./components/data-table"
import { useUsers } from "@/hooks/api/use-users"
import type { UserProfile } from "@/types/user.types"

interface Patient {
  id: string | number
  firstName: string
  lastName: string
  email: string
  avatar: string
  mobile: string
  gender: string
  dateOfBirth: string
  bloodGroup?: string
  address: string
  city?: string
  country?: string
  postalCode?: string
  clinic: string
  registeredOn: string
  status: string
}

interface PatientFormValues {
  firstName: string
  lastName: string
  clinic: string
  email: string
  countryCode?: string
  mobile: string
  dateOfBirth: string
  status: string
  bloodGroup?: string
  gender: string
  address: string
  city?: string
  country?: string
  postalCode?: string
}

function generateAvatar(firstName: string, lastName: string) {
  const first = firstName ? firstName[0] : ""
  const last = lastName ? lastName[0] : ""
  return `${first}${last}`.toUpperCase()
}

import { usePermissions } from "@/hooks/use-permissions"
import { Skeleton } from "@/components/ui/skeleton"
import { RoleGuard } from "@/components/role-guard"

export default function UsersPage() {
  const { can, isLoading: isPermissionsLoading } = usePermissions()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [clinicFilter, setClinicFilter] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const { data: response, isLoading } = useUsers({
    page: 1,
    limit: 100,
    role: "patient",
    status: statusFilter
      ? (statusFilter.toLowerCase() as "active" | "inactive")
      : "all",
    clinicId: clinicFilter,
    search: debouncedSearch,
  })

  const rawPatients = useMemo(() => {
    if (!response?.data) return []
    return response.data
  }, [response])

  const patients = useMemo<Patient[]>(() => {
    return rawPatients.map((patient: UserProfile) => {
      const clinics = Array.isArray(patient.meta?.clinics) ? patient.meta?.clinics : []
      const firstClinic = clinics[0]
      const clinicName = typeof firstClinic === "string"
        ? firstClinic
        : (firstClinic?.name || "")

      const address = patient.meta?.address
      const fullAddress = [
        address?.street,
        address?.city,
        address?.state,
        address?.country,
      ].filter(Boolean).join(", ")

      return {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        avatar: generateAvatar(patient.firstName, patient.lastName),
        mobile: [patient.countryCode, patient.mobile].filter(Boolean).join(" ").trim(),
        gender: patient.meta?.gender || "",
        dateOfBirth: patient.meta?.dob || "",
        bloodGroup: patient.meta?.bloodGroup || "",
        address: fullAddress,
        city: address?.city || "",
        country: address?.country || "",
        postalCode: address?.postalCode || "",
        clinic: clinicName,
        registeredOn: patient.createdAt,
        status: patient.isActive ? "Active" : "Inactive",
      }
    })
  }, [rawPatients])

  const clinicOptions = useMemo(() => {
    const set = new Set<string>()
    for (const patient of patients) {
      if (patient.clinic?.trim()) set.add(patient.clinic.trim())
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [patients])

  const handleAddPatient = (_patientData: PatientFormValues) => {
    // TODO: Wire add user API here (currently users page is list-first).
  }

  const handleDeletePatient = (_id: string | number) => {
    // TODO: Wire deactivate user API here.
  }

  const handleEditPatient = (patient: Patient) => {
    console.log("Edit patient:", patient)
  }

  return (
    <RoleGuard permission="user_list" fallback="forbidden">
      <div className="@container/main mt-6 px-4 lg:px-6">
        <DataTable
          patients={patients}
          onDeletePatient={handleDeletePatient}
          onEditPatient={handleEditPatient}
          onAddPatient={handleAddPatient}
          clinicOptions={clinicOptions}
          clinicFilter={clinicFilter}
          onClinicFilterChange={setClinicFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          isLoading={isLoading && !rawPatients.length}
          can={can}
        />
      </div>
    </RoleGuard>
  )
}
