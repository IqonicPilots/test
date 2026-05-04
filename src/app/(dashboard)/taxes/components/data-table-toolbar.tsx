"use client"

import type { Table } from "@tanstack/react-table"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { TaxFormDialog } from "./tax-form-dialog"
import type { Tax, TaxPayload } from "@/types/tax.types"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"
import {
  DataTableResetButton,
  DataTableInfiniteFilterSelect,
  DataTableFilterSelect,
  DataTableSearch,
} from "@/components/common/data-table-filters"
import { usePermissions } from "@/hooks/use-permissions"
import {
  DATA_TABLE_FILTER_CELL,
  DATA_TABLE_FILTER_GRID,
} from "@/components/data-table/data-table-toolbar-layout"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  taxes: Tax[]
  onAddTax: (tax: TaxPayload) => void
  onUpdateTax: (id: string, tax: Partial<TaxPayload>) => void
  // Clinic filter props
  clinicFilter: string
  onClinicFilterChange: (value: string) => void
  clinicOptions: Clinic[]
  onClinicsLoadMore?: () => void
  onClinicsSearchChange?: (value: string) => void
  hasNextClinicsPage?: boolean
  isFetchingNextClinicsPage?: boolean
  // Doctor filter props
  doctorFilter: string
  onDoctorFilterChange: (value: string) => void
  doctorOptions: Doctor[]
  onDoctorsLoadMore?: () => void
  onDoctorsSearchChange?: (value: string) => void
  hasNextDoctorsPage?: boolean
  isFetchingNextDoctorsPage?: boolean
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  // Service filter props
  serviceFilter: string
  onServiceFilterChange: (value: string) => void
  serviceOptions: any[]
  onServicesLoadMore?: () => void
  onServicesSearchChange?: (value: string) => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  hasNextServicesPage?: boolean
  isFetchingNextServicesPage?: boolean
  isClinicsLoading?: boolean
  isDoctorsLoading?: boolean
  isServicesLoading?: boolean
  role?: any
}

export function DataTableToolbar<TData>({
  table,
  taxes,
  onAddTax,
  onUpdateTax,
  clinicFilter,
  onClinicFilterChange,
  clinicOptions,
  onClinicsLoadMore,
  onClinicsSearchChange,
  hasNextClinicsPage,
  isFetchingNextClinicsPage,
  doctorFilter,
  onDoctorFilterChange,
  doctorOptions,
  onDoctorsLoadMore,
  onDoctorsSearchChange,
  hasNextDoctorsPage,
  isFetchingNextDoctorsPage,
  serviceFilter,
  statusFilter,
  onStatusFilterChange,
  onServiceFilterChange,
  serviceOptions,
  onServicesLoadMore,
  onServicesSearchChange,
  searchQuery,
  onSearchQueryChange,
  hasNextServicesPage,
  isFetchingNextServicesPage,
  isClinicsLoading,
  isDoctorsLoading,
  isServicesLoading,
  role,
}: DataTableToolbarProps<TData>) {

  const { can } = usePermissions()

  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
  ]

  const isFiltered =
    !!clinicFilter ||
    !!doctorFilter ||
    !!serviceFilter ||
    !!statusFilter ||
    !!table.getState().globalFilter

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className={DATA_TABLE_FILTER_GRID}>
        {(role !== "clinic_admin" && role !== "receptionist") && (
          <DataTableInfiniteFilterSelect
            value={clinicFilter}
            onValueChange={(val) => {
              onClinicFilterChange(val)
              table.getColumn("clinicId")?.setFilterValue(val === "all" ? undefined : val)
            }}
            placeholder="Clinic Name"
            options={clinicOptions.map((c) => ({ label: c.name, value: c._id }))}
            onLoadMore={onClinicsLoadMore}
            onSearchChange={onClinicsSearchChange}
            hasNextPage={hasNextClinicsPage}
            isFetchingNextPage={isFetchingNextClinicsPage}
            isLoading={isClinicsLoading}
            className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
            allLabel="All Clinics"
          />
        )}

        {role !== "doctor" && (
          <DataTableInfiniteFilterSelect
            value={doctorFilter}
            onValueChange={(val) => {
              onDoctorFilterChange(val)
              table.getColumn("doctorIds")?.setFilterValue(val === "all" ? undefined : val)
            }}
            placeholder="Doctor Name"
            options={doctorOptions.map((d) => ({ label: `${d.firstName} ${d.lastName}`, value: d._id }))}
            onLoadMore={onDoctorsLoadMore}
            onSearchChange={onDoctorsSearchChange}
            hasNextPage={hasNextDoctorsPage}
            isFetchingNextPage={isFetchingNextDoctorsPage}
            isLoading={isDoctorsLoading}
            className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
            allLabel="All Doctors"
          />
        )}

        <DataTableInfiniteFilterSelect
          value={serviceFilter}
          onValueChange={(val) => {
            onServiceFilterChange(val)
            table.getColumn("serviceIds")?.setFilterValue(val === "all" ? undefined : val)
          }}
          placeholder="Service Name"
          options={serviceOptions.map((s) => ({ label: s.name, value: s._id }))}
          onLoadMore={onServicesLoadMore}
          onSearchChange={onServicesSearchChange}
          hasNextPage={hasNextServicesPage}
          isFetchingNextPage={isFetchingNextServicesPage}
          isLoading={isServicesLoading}
          className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
          allLabel="All Services"
        />

        <DataTableFilterSelect
          value={statusFilter || "all"}
          onValueChange={(value: string) => {
            onStatusFilterChange(value)
            table.getColumn("isActive")?.setFilterValue(value === "" ? "all" : value)
          }}
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
          placeholder="Search Taxes"
          className="h-9 w-full min-w-0 sm:w-[200px] lg:w-[250px]"
        />

        <DataTableResetButton
          table={table}
          onReset={() => {
            table.resetColumnFilters()
            table.setGlobalFilter("")
            onClinicFilterChange("")
            onDoctorFilterChange("")
            onServiceFilterChange("")
            onStatusFilterChange("")
          }}
          disabled={!isFiltered}
        />

        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto sm:gap-3">
          <DataTableViewOptions table={table} />
          {can("tax_add") && <TaxFormDialog onAddTax={onAddTax} onUpdateTax={onUpdateTax} role={role} />}
        </div>
      </div>
    </div>
  )
}
