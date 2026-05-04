"use client"

import type { Table } from "@tanstack/react-table"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { ClinicFormDialog } from "./clinic-form-dialog"
import { useSpecialties } from "@/hooks/api/use-listings"
import {
  DataTableSearch,
  DataTableSelectFilter,
  DataTableResetButton,
  DataTableFilterSelect
} from "@/components/common/data-table-filters"
import { usePermissions } from "@/hooks/use-permissions"
import { ExportDialog, clinicExportColumns } from "@/components/common/export-dialog"
import { ImportDialog } from "@/components/common/import-dialog"
import { Country, State } from "country-state-city"
import {
  DATA_TABLE_FILTER_CELL,
  DATA_TABLE_FILTER_GRID,
} from "@/components/data-table/data-table-toolbar-layout"

interface ClinicFormValues {
  name: string
  email: string
  adminFirstName: string
  adminLastName: string
  adminEmail: string
  contactNo: string
  adminMobile: string
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

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  data?: any[]
  onAddClinic: (data: ClinicFormValues) => void
  onImportClinics?: (clinics: ClinicFormValues[]) => Promise<void | false>
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
}

export function DataTableToolbar<TData>({
  table,
  data = [],
  onAddClinic,
  onImportClinics,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
}: DataTableToolbarProps<TData>) {
  const { can } = usePermissions()
  const { data: specialties = [], isLoading: isLoadingSpecialties } = useSpecialties()

  const specialtyOptions = specialties.map((spec) => ({
    label: spec.label,
    value: spec.label,
  }))

  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
  ]

  const hasActiveFilters = Boolean(
    searchQuery?.trim() ||
    statusFilter !== "all" ||
    (table.getColumn("specialties")?.getFilterValue() as string[])?.length
  )

  const handleReset = () => {
    onSearchQueryChange("")
    onStatusFilterChange("all")
    table.getColumn("specialties")?.setFilterValue(undefined)
    table.resetGlobalFilter()
  }

  const handleImport = async (parsedRows: any[]) => {
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

    const clinicsToImport: ClinicFormValues[] = []

    for (const row of parsedRows) {
      let countryCode = ""
      const rawCountry = (row["Country"] || row["country"] || "").trim()
      if (rawCountry) {
        const c = Country.getAllCountries().find(c => c.name.toLowerCase() === rawCountry.toLowerCase() || c.isoCode.toLowerCase() === rawCountry.toLowerCase())
        countryCode = c ? c.isoCode : rawCountry
      }

      let stateCode = ""
      const rawState = (row["State"] || row["state"] || "").trim()
      if (rawState && countryCode && countryCode.length === 2) {
        const s = State.getStatesOfCountry(countryCode).find(s => s.name.toLowerCase() === rawState.toLowerCase() || s.isoCode.toLowerCase() === rawState.toLowerCase())
        stateCode = s ? s.isoCode : rawState
      } else {
        stateCode = rawState
      }

      const rawSpecs = row["Speciality"]
        ? String(row["Speciality"]).split(",").map((s) => s.trim())
        : row["clinicSpecialties"]
        ? String(row["clinicSpecialties"]).split(",").map((s) => s.trim())
        : []

      const mappedSpecs = rawSpecs.map(specName => {
        const found = specialties.find(s => s.label.toLowerCase() === specName.toLowerCase())
        return found ? ((found as any)._id || found.value || specName) : specName
      })

      const data: ClinicFormValues = {
        name: row["Clinic Name"] || row["name"] || "",
        email: row["Clinic Email"] || row["email"] || "",
        adminFirstName: row["First Name"] || row["adminFirstName"] || "",
        adminLastName: row["Last Name"] || row["adminLastName"] || "",
        adminEmail: row["Admin Email"] || row["Email"] || row["adminEmail"] || "",
        contactNo: String(row["Phone Number"] || row["Contact No"] || row["contactNo"] || ""),
        adminMobile: String(row["Admin Phone Number"] || row["Phone Number"] || row["Admin Contact Number"] || row["Contact Number"] || row["adminMobile"] || ""),
        clinicSpecialties: mappedSpecs,
        address: row["Address"] || row["address"] || "",
        status: row["Status"] || row["status"] || "Active",
        city: row["City"] || row["city"] || "",
        state: stateCode,
        country: countryCode,
        postalCode: String(row["Postal Code"] || row["postalCode"] || ""),
        adminDateOfBirth: parseExcelDate(row["Date of Birth"] || row["DOB"] || row["adminDateOfBirth"]),
        adminGender: (row["Gender"] || row["adminGender"] || "Male").toString().charAt(0).toUpperCase() + (row["Gender"] || row["adminGender"] || "Male").toString().slice(1).toLowerCase(),
      }
      clinicsToImport.push(data)
    }

    if (onImportClinics && clinicsToImport.length > 0) {
      const result = await onImportClinics(clinicsToImport)
      if (result === false) {
        return false
      }
    }
  }

  const requiredFields = [
    "Clinic Name",
    "Clinic Email",
    "Phone Number",
    "Speciality",
    "Address",
    "Country",
    "State",
    "City",
    "Postal Code",
    "First Name",
    "Last Name",
    "Email",
    "Admin Phone Number",
    "Date of Birth",
    "Gender",
  ]

  const importNotes = [
    "Date of Birth must be formatted as YYYY-MM-DD (e.g., 1990-12-31).",
    "Gender must be exactly 'Male', 'Female', or 'Other'.",
    "If Specialization is multiple, separate them with a comma (e.g., Cardiology, Neurology).",
  ]
  
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className={DATA_TABLE_FILTER_GRID}>
        <DataTableSelectFilter
          table={table}
          columnId="specialties"
          placeholder={isLoadingSpecialties ? "Loading..." : "Specializations"}
          options={specialtyOptions}
          allLabel="All Specializations"
          className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
        />
        <DataTableFilterSelect
          value={statusFilter || "all"}
          onValueChange={(value: string) => onStatusFilterChange(value === "all" ? "" : value)}
          placeholder="Status"
          options={statusOptions}
          allLabel="All Status"
          className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
        />

      </div>

      <div className="flex w-full min-w-0 flex-wrap items-center gap-3">
        <DataTableSearch
          table={table}
          value={searchQuery}
          onValueChange={onSearchQueryChange}
          placeholder="Search Anything..."
          className="h-9 w-full min-w-0 sm:w-[200px] lg:w-[250px]"
        />

        <DataTableResetButton
          table={table}
          onReset={handleReset}
          disabled={!hasActiveFilters}
        />

        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto sm:gap-3">
          <ImportDialog
            onImport={handleImport}
            requiredFields={requiredFields}
            notes={importNotes}
            title="Import Clinics"
            buttonLabel="Import"
          />
          <ExportDialog
            data={data}
            columns={clinicExportColumns}
            filename="clinics"
            title="Export Clinics"
          />
          <DataTableViewOptions table={table} />
          {can("clinic_add") && <ClinicFormDialog onAddClinic={onAddClinic} />}
        </div>
      </div>
    </div>
  )
}
