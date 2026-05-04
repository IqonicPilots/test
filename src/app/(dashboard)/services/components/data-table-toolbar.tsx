"use client"

import type { Table } from "@tanstack/react-table"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { ServiceFormDialog } from "./service-form-dialog"
import type { StaticData } from "@/types/listing.types"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"
import {
  DataTableResetButton,
  DataTableInfiniteFilterSelect,
  DataTableFilterSelect,
  DataTableSearch
} from "@/components/common/data-table-filters"
import { usePermissions } from "@/hooks/use-permissions"
import { ExportDialog, getServiceExportColumns } from "@/components/common/export-dialog"
import { ImportDialog } from "@/components/common/import-dialog"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"
import {
  DATA_TABLE_FILTER_CELL,
  DATA_TABLE_FILTER_GRID,
} from "@/components/data-table/data-table-toolbar-layout"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  categories: StaticData[]
  data?: any[]
  allDoctors: Doctor[]
  allClinics: Clinic[]
  isLoadingCategories?: boolean
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  clinicFilter: string
  onClinicFilterChange: (value: string) => void
  doctorFilter: string
  onDoctorFilterChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  onResetFilters: () => void
  onClinicsLoadMore?: () => void
  onClinicsSearchChange?: (value: string) => void
  hasNextClinicsPage?: boolean
  isFetchingNextClinicsPage?: boolean
  onDoctorsLoadMore?: () => void
  onDoctorsSearchChange?: (value: string) => void
  hasNextDoctorsPage?: boolean
  isFetchingNextDoctorsPage?: boolean
  isClinicsLoading?: boolean
  isDoctorsLoading?: boolean
  onImportServices?: (services: any[]) => Promise<void>
  clinicOptions?: Clinic[]
  doctorOptions?: any[]
  role?: any
}

export function DataTableToolbar<TData>({
  table,
  categories,
  allDoctors,
  allClinics,
  data = [],
  isLoadingCategories = false,
  clinicFilter,
  onClinicFilterChange,
  doctorFilter,
  onDoctorFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  onResetFilters,
  globalFilter,
  onGlobalFilterChange,
  onClinicsLoadMore,
  onClinicsSearchChange,
  hasNextClinicsPage,
  isFetchingNextClinicsPage,
  onDoctorsLoadMore,
  onDoctorsSearchChange,
  hasNextDoctorsPage,
  isFetchingNextDoctorsPage,
  isClinicsLoading,
  isDoctorsLoading,
  onImportServices,
  clinicOptions = [],
  doctorOptions = [],
  role,
}: DataTableToolbarProps<TData>) {
  const { can } = usePermissions()
  const { formatCurrencyCompact } = useCurrencyFormatter(true)

  const handleImport = async (parsedRows: any[]) => {
    const servicesToImport: any[] = []

    for (const row of parsedRows) {
      const rawCategory = (row["Service Type"] || row["Category"] || "").trim()
      const category = categories.find(c => c.label.toLowerCase() === rawCategory.toLowerCase())
      if (!category && rawCategory) {
        throw new Error(`Service Type "${rawCategory}" not found.`)
      }

      const rawClinics = row["Clinic"]
        ? String(row["Clinic"]).split(",").map((s) => s.trim())
        : []

      const mappedClinics = rawClinics.map(clinicName => {
        const found = allClinics.find(c => c.name.toLowerCase() === clinicName.toLowerCase())
        if (!found) {
          throw new Error(`Clinic "${clinicName}" not found.`)
        }
        return found._id
      })

      const rawDoctors = row["Doctor"]
        ? String(row["Doctor"]).split(",").map((s) => s.trim())
        : []

      const mappedDoctors = rawDoctors.map(doctorName => {
        const found = allDoctors.find(d => `${d.firstName} ${d.lastName}`.toLowerCase() === doctorName.toLowerCase() || d.firstName.toLowerCase() === doctorName.toLowerCase())
        if (!found) {
          throw new Error(`Doctor "${doctorName}" not found.`)
        }
        return found._id
      })

      const serviceData = {
        name: (row["Service Name"] || row["Name"] || "").trim(),
        category: category?._id || "",
        charges: String(row["Charges"] || "").trim(),
        duration: String(row["Duration (min)"] || row["Duration (minutes)"] || row["Duration"] || "").trim(),
        clinic: mappedClinics,
        doctor: mappedDoctors,
        telemed_service: (row["Telemed Service"] || "").toLowerCase() === "yes" ? "yes" : "no",
        status: (row["Status"] || "Active").trim(),
      }

      if (!serviceData.name) throw new Error(`Service name is missing in row for ${rawCategory}`)
      if (!serviceData.category) throw new Error(`Category "${rawCategory}" not found or missing.`)
      if (!serviceData.charges) throw new Error(`Charges missing for service "${serviceData.name}"`)
      if (!serviceData.duration) throw new Error(`Duration missing for service "${serviceData.name}"`)
      if (serviceData.clinic.length === 0) throw new Error(`At least one valid Clinic is required for "${serviceData.name}"`)

      servicesToImport.push(serviceData)
    }

    if (onImportServices && servicesToImport.length > 0) {
      await onImportServices(servicesToImport)
    }
  }

  const requiredFields = [
    "Service Name",
    "Service Type",
    "Charges",
    "Duration (min)",
    "Clinic",
    "Doctor",
    "Telemed Service",
    "Status"
  ]

  const importNotes = [
    "Duration must be in minutes (e.g., 30, 60).",
    "Service Type must match an existing Category.",
    "Clinic and Doctor names must match existing records.",
    "If multiple Clinics or Doctors, separate them with a comma.",
    "Telemed Service should be 'Yes' or 'No'.",
    "Status should be 'Active' or 'Inactive'."
  ]

  const statusOptions = [
    { label: "Active", value: "true" },
    { label: "Inactive", value: "false" },
  ]

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className={DATA_TABLE_FILTER_GRID}>
        <DataTableFilterSelect
          value={categoryFilter || "all"}
          onValueChange={(value: string) => onCategoryFilterChange(value === "all" ? "" : value)}
          placeholder="Category"
          options={categories.map((category: StaticData) => ({ label: category.label, value: category._id }))}
          allLabel="All Categories"
          className={`h-9 cursor-pointer ${DATA_TABLE_FILTER_CELL}`}
        />

        {role !== "clinic_admin" && (
          <DataTableInfiniteFilterSelect
            value={clinicFilter}
            onValueChange={onClinicFilterChange}
            placeholder="Clinic Name"
            options={clinicOptions.map((c) => ({ label: c.name, value: c._id }))}
            onLoadMore={onClinicsLoadMore}
            onSearchChange={onClinicsSearchChange}
            hasNextPage={hasNextClinicsPage}
            isFetchingNextPage={isFetchingNextClinicsPage}
            isLoading={isClinicsLoading}
            className={`h-9 cursor-pointer ${DATA_TABLE_FILTER_CELL}`}
            allLabel="All Clinics"
          />
        )}

        {role !== "doctor" && (
          <DataTableInfiniteFilterSelect
            value={doctorFilter}
            onValueChange={onDoctorFilterChange}
            placeholder="Doctor Name"
            options={doctorOptions.map((d: any) => ({ label: d.fullName || `${d.firstName} ${d.lastName}`, value: d._id }))}
            onLoadMore={onDoctorsLoadMore}
            onSearchChange={onDoctorsSearchChange}
            hasNextPage={hasNextDoctorsPage}
            isFetchingNextPage={isFetchingNextDoctorsPage}
            isLoading={isDoctorsLoading}
            className={`h-9 cursor-pointer ${DATA_TABLE_FILTER_CELL}`}
            allLabel="All Doctors"
          />
        )}

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
          value={globalFilter}
          onValueChange={onGlobalFilterChange}
          placeholder="Search Anything..."
          className="h-9 w-full min-w-0 sm:w-[200px] lg:w-[250px]"
        />

        <DataTableResetButton
          table={table}
          onReset={onResetFilters}
          disabled={
            !globalFilter.trim() &&
            !categoryFilter &&
            !clinicFilter &&
            !doctorFilter &&
            !statusFilter
          }
        />

        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto sm:gap-3">
          {can("service_import_export") && (
            <>
              <ImportDialog
                onImport={handleImport}
                requiredFields={requiredFields}
                notes={importNotes}
                title="Import Services"
                buttonLabel="Import"
              />
              <ExportDialog
                data={data}
                columns={getServiceExportColumns(formatCurrencyCompact)}
                filename="services"
                title="Export Services"
              />
            </>
          )}
          <DataTableViewOptions table={table} />
          {can("service_add") && (
            <ServiceFormDialog
              clinics={clinicOptions}
              allClinics={allClinics}
              allDoctors={allDoctors}
              onClinicsLoadMore={onClinicsLoadMore}
              onClinicsSearchChange={onClinicsSearchChange}
              hasNextClinicsPage={hasNextClinicsPage}
              isFetchingNextClinicsPage={isFetchingNextClinicsPage}
              isClinicsLoading={isClinicsLoading}
              role={role}
            />
          )}
        </div>
      </div>
    </div>
  )
}

