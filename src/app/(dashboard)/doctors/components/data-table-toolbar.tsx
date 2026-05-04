"use client"

import type { Table } from "@tanstack/react-table"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { DoctorFormDialog } from "./doctor-form-dialog"
import type { DoctorFormValues } from "./doctor-form-dialog"
import type { DoctorTableRow } from "./columns"
import type { Clinic } from "@/types/clinic.types"
import type { StaticData } from "@/types/listing.types"
import { Button } from "@/components/ui/button"
import {
  DataTableFilterSelect,
  DataTableResetButton,
  DataTableInfiniteFilterSelect,
  DataTableSearch
} from "@/components/common/data-table-filters"
import { ExportDialog, doctorExportColumns } from "@/components/common/export-dialog"
import { ImportDialog } from "@/components/common/import-dialog"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { Country, State } from "country-state-city"
import {
  DATA_TABLE_FILTER_CELL,
  DATA_TABLE_FILTER_GRID,
} from "@/components/data-table/data-table-toolbar-layout"

interface DataTableToolbarProps {
  table: Table<DoctorTableRow>
  data?: any[]
  doctors: DoctorTableRow[]
  onAddDoctor: (doctor: DoctorFormValues) => void | Promise<void>
  onImportDoctors?: (doctors: DoctorFormValues[]) => Promise<void | false>
  clinics: Clinic[]
  allClinics?: Clinic[]
  onClinicsLoadMore?: () => void
  onClinicsSearchChange?: (value: string) => void
  hasNextClinicsPage?: boolean
  isFetchingNextClinicsPage?: boolean
  isClinicsLoading?: boolean
  specialties: StaticData[]
  /** If set, used for the Specialization filter only (e.g. clinic-scoped). Forms still use `specialties`. */
  specializationFilterOptions?: StaticData[]
  clinicFilter: string
  onClinicFilterChange: (value: string) => void
  specializationFilter: string
  onSpecializationFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onResetFilters: () => void
  isCreateBusy?: boolean
  hideClinicFilter?: boolean
  hideSpecializationFilter?: boolean
}

export function DataTableToolbar({
  table,
  onAddDoctor,
  onImportDoctors,
  clinics,
  allClinics = [],
  data = [],
  onClinicsLoadMore,
  onClinicsSearchChange,
  hasNextClinicsPage,
  isFetchingNextClinicsPage,
  isClinicsLoading,
  specialties,
  specializationFilterOptions,
  clinicFilter,
  onClinicFilterChange,
  specializationFilter,
  onSpecializationFilterChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  onResetFilters,
  isCreateBusy = false,
  hideClinicFilter = false,
  hideSpecializationFilter = false,
}: DataTableToolbarProps) {
  const { can } = usePermissions()
  const specFilterItems = specializationFilterOptions ?? specialties

  const handleImport = async (parsedRows: any[]): Promise<void | false> => {
    const parseExcelDate = (val: any): string => {
      if (!val) return ""
      // If the value is an Excel serial number (e.g. 32060)
      if (!isNaN(Number(val)) && Number(val) > 10000) {
        const excelEpoch = new Date(1899, 11, 30)
        const dateObj = new Date(excelEpoch.getTime() + Number(val) * 86400000)
        return dateObj.toISOString().split("T")[0]
      }
      const parsed = new Date(val)
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0]
      }
      return String(val).trim()
    }

    const doctorsToImport: DoctorFormValues[] = []
    let skippedRowCount = 0

    for (const [rowIndex, row] of parsedRows.entries()) {
      const rowLabel = `Row ${rowIndex + 1}`
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

      const rawClinics = row["Clinic"]
        ? String(row["Clinic"]).split(",").map((s) => s.trim())
        : []

      const clinicList = allClinics.length > 0 ? allClinics : clinics
      const mappedClinics: string[] = []
      let rowHasMappingError = false
      for (const clinicName of rawClinics) {
        const found = clinicList.find(
          c => c.name.toLowerCase() === clinicName.toLowerCase()
        )
        if (!found) {
          rowHasMappingError = true
          toast.error(
            `${rowLabel}: Clinic "${clinicName}" not found in system records. Please check the spelling or ensure the clinic exists.`
          )
        } else {
          mappedClinics.push(found._id)
        }
      }

      const rawSpecs = row["Speciality"] || row["Specialization"]
        ? String(row["Speciality"] || row["Specialization"]).split(",").map((s) => s.trim())
        : []

      const mappedSpecs: string[] = []
      for (const specName of rawSpecs) {
        const found = specialties.find(
          s => s.label.toLowerCase() === specName.toLowerCase()
        )
        if (!found) {
          rowHasMappingError = true
          toast.error(
            `${rowLabel}: Specialization "${specName}" not found in system records. Please check the spelling.`
          )
        } else {
          mappedSpecs.push(found._id)
        }
      }

      if (rowHasMappingError) {
        skippedRowCount += 1
        continue
      }

      const data: DoctorFormValues = {
        firstName: row["First Name"] || row["firstName"] || "",
        lastName: row["Last Name"] || row["lastName"] || "",
        email: row["Email"] || row["email"] || "",
        mobile: String(row["Phone Number"] || row["Contact Number"] || row["Contact No"] || row["mobile"] || ""),
        countryCode: row["Country Code"],
        dateOfBirth: parseExcelDate(row["Date of Birth"] || row["DOB"] || row["dateOfBirth"]),
        gender: (row["Gender"] || row["gender"] || "Male").toString().charAt(0).toUpperCase() + (row["Gender"] || row["gender"] || "Male").toString().slice(1).toLowerCase(),
        status: row["Status"] || row["status"] || "Active",
        clinics: mappedClinics,
        specialties: mappedSpecs,
        address: row["Address"] || row["address"] || "",
        city: row["City"] || row["city"] || "",
        state: stateCode,
        country: countryCode,
        postalCode: String(row["Postal Code"] || row["postalCode"] || ""),
        experience: String(row["Years of Experience"] || row["Experience"] || row["experience"] || ""),
        description: row["Description"] || row["Biography"] || row["description"] || "",
      }
      doctorsToImport.push(data)
    }

    if (doctorsToImport.length === 0) {
      if (parsedRows.length > 0) {
        toast.error(
          "No valid rows to import. Fix clinic and specialization names, then try again."
        )
      }
      return false
    }

    if (onImportDoctors) {
      const result = await onImportDoctors(doctorsToImport)
      if (result === false) {
        return false
      }
    }

    if (skippedRowCount > 0) {
      toast.info(
        `Imported ${doctorsToImport.length} row(s). ${skippedRowCount} row(s) were skipped due to invalid clinic or specialization names.`
      )
    }
  }

  const requiredFields = [
    "First Name",
    "Last Name",
    "Email",
    "Phone Number",
    "Date of Birth",
    "Status",
    "Clinic",
    "Gender",
    "Speciality",
  ]

  const importNotes = [
    "Date of Birth must be formatted as YYYY-MM-DD (e.g., 1990-12-31).",
    "Gender must be exactly 'Male', 'Female', or 'Other'.",
    "If multiple Clinics or Specialities, separate them with a comma.",
    "Clinic and Speciality names must match the names in the system.",
  ]

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className={DATA_TABLE_FILTER_GRID}>
        {!hideClinicFilter && (
          <DataTableInfiniteFilterSelect
            value={clinicFilter || ""}
            onValueChange={onClinicFilterChange}
            placeholder="Clinic"
            options={clinics.map((clinic) => ({
              label: clinic.name,
              value: String(clinic._id || (clinic as any).id || ""),
            })).filter((o) => Boolean(o.value))}
            allLabel="All Clinics"
            onLoadMore={onClinicsLoadMore}
            onSearchChange={onClinicsSearchChange}
            hasNextPage={hasNextClinicsPage}
            isFetchingNextPage={isFetchingNextClinicsPage}
            isLoading={isClinicsLoading}
            className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
          />
        )}

        {!hideSpecializationFilter && (
          <DataTableFilterSelect
            value={specializationFilter || "all"}
            onValueChange={(value: string) => onSpecializationFilterChange(value === "all" ? "" : value)}
            placeholder="Specializations"
            options={specFilterItems.map((specialty: StaticData) => ({ label: specialty.label, value: specialty._id }))}
            allLabel="All Specializations"
            className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
          />
        )}

        <DataTableFilterSelect
          value={statusFilter || "all"}
          onValueChange={(value: string) => onStatusFilterChange(value === "all" ? "" : value)}
          placeholder="Status"
          options={[
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
          ]}
          allLabel="All Status"
          className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
        />
      </div>

      {/* Search and Actions Section */}
      <div className="flex w-full min-w-0 flex-wrap items-center gap-3">
        <DataTableSearch
          table={table}
          value={searchQuery}
          onValueChange={onSearchQueryChange}
          placeholder="Search Doctors"
          className="h-9 w-full min-w-0 sm:w-[200px] lg:w-[250px]"
        />
        <DataTableResetButton
          table={table}
          onReset={onResetFilters}
          disabled={!searchQuery.trim() && !clinicFilter && !specializationFilter && !statusFilter}
        />
        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto sm:gap-3">
          {can("doctor_import_export") && (
            <>
              <ImportDialog
                onImport={handleImport}
                requiredFields={requiredFields}
                notes={importNotes}
                title="Import Doctors"
                buttonLabel="Import"
              />
              <ExportDialog
                data={data}
                columns={doctorExportColumns}
                filename="doctors"
                title="Export Doctors"
              />
            </>
          )}
          <DataTableViewOptions table={table} />
          {can("doctor_add") && (
            <DoctorFormDialog
              onAddDoctor={onAddDoctor}
              clinics={clinics}
              onClinicsLoadMore={onClinicsLoadMore}
              onClinicsSearchChange={onClinicsSearchChange}
              hasNextClinicsPage={hasNextClinicsPage}
              isFetchingNextClinicsPage={isFetchingNextClinicsPage}
              isClinicsLoading={isClinicsLoading}
              specialties={specialties}
              isSubmitting={isCreateBusy}
            />
          )}
        </div>
      </div>
    </div>
  )
}
