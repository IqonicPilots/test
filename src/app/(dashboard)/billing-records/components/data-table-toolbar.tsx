"use client"

import type { Table } from "@tanstack/react-table"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { AddBillDialog } from "./add-bill-dialog"
import {
  DataTableResetButton,
  DataTableInfiniteFilterSelect,
  DataTableSearch,
  DataTableFilterSelect,
} from "@/components/common/data-table-filters"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"
import { ExportDialog, getBillingRecordsExportColumns } from "@/components/common/export-dialog"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"
import { usePermissions } from "@/hooks/use-permissions"
import {
  DATA_TABLE_FILTER_CELL,
  DATA_TABLE_FILTER_GRID,
} from "@/components/data-table/data-table-toolbar-layout"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  data: any[]
  // Clinic filter
  clinicFilter: string
  onClinicFilterChange: (value: string) => void
  clinicOptions: Clinic[]
  onClinicsLoadMore?: () => void
  onClinicsSearchChange?: (value: string) => void
  hasNextClinicsPage?: boolean
  isFetchingNextClinicsPage?: boolean
  // Doctor filter
  doctorFilter: string
  onDoctorFilterChange: (value: string) => void
  doctorOptions: Doctor[]
  onDoctorsLoadMore?: () => void
  onDoctorsSearchChange?: (value: string) => void
  hasNextDoctorsPage?: boolean
  isFetchingNextDoctorsPage?: boolean
  // Patient filter
  patientFilter: string
  onPatientFilterChange: (value: string) => void
  patientOptions: any[]
  onPatientsLoadMore?: () => void
  onPatientsSearchChange?: (value: string) => void
  hasNextPatientsPage?: boolean
  isFetchingNextPatientsPage?: boolean
  isClinicsLoading?: boolean
  isDoctorsLoading?: boolean
  isPatientsLoading?: boolean
  search?: string
  onSearchChange?: (value: string) => void
  statusFilter?: "" | "paid" | "unpaid"
  onStatusFilterChange?: (value: "" | "paid" | "unpaid") => void
  role?: any
}

export function DataTableToolbar<TData>({
  table,
  data,
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
  patientFilter,
  onPatientFilterChange,
  patientOptions,
  onPatientsLoadMore,
  onPatientsSearchChange,
  hasNextPatientsPage,
  isFetchingNextPatientsPage,
  isClinicsLoading,
  isDoctorsLoading,
  isPatientsLoading,
  search,
  onSearchChange,
  statusFilter = "",
  onStatusFilterChange,
  role,
}: DataTableToolbarProps<TData>) {
  const currentStatus = statusFilter || "all"
  const { formatCurrencyCompact } = useCurrencyFormatter(true)
  const isFiltered =
    !!clinicFilter ||
    !!doctorFilter ||
    !!patientFilter ||
    !!search ||
    !!statusFilter ||
    !!table.getState().globalFilter

  const { can } = usePermissions()

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className={DATA_TABLE_FILTER_GRID}>
        {role !== "patient" && (
          <DataTableInfiniteFilterSelect
            value={patientFilter}
            onValueChange={onPatientFilterChange}
            placeholder="Patient Name"
            options={patientOptions.map((p: any) => {
              const name = [p?.firstName, p?.lastName].filter(Boolean).join(" ").trim() || p?.fullName || ""
              return { label: name, value: p._id }
            })}
            onLoadMore={onPatientsLoadMore}
            onSearchChange={onPatientsSearchChange}
            hasNextPage={hasNextPatientsPage}
            isFetchingNextPage={isFetchingNextPatientsPage}
            isLoading={isPatientsLoading}
            className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
            allLabel="All Patients"
          />
        )}

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
            className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
            allLabel="All Clinics"
          />
        )}
        
        {role !== "doctor" && (
          <DataTableInfiniteFilterSelect
            value={doctorFilter}
            onValueChange={onDoctorFilterChange}
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


        <DataTableFilterSelect
          value={currentStatus}
          onValueChange={(value) =>
            onStatusFilterChange?.(value === "all" ? "" : (value as "paid" | "unpaid"))
          }
          placeholder="Payment Status"
          options={[
            { label: "Paid", value: "paid" },
            { label: "Unpaid", value: "unpaid" },
          ]}
          allLabel="All Status"
          className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
        />
      </div>

      <div className="flex w-full min-w-0 flex-wrap items-center gap-3">
        {/* Global search */}
        <DataTableSearch
          table={table}
          value={search ?? ""}
          onValueChange={onSearchChange!}
          placeholder="Search billing records..."
          className="h-9 w-full min-w-0 sm:w-[200px] lg:w-[250px]"
        />

        <DataTableResetButton
          table={table}
          onReset={() => {
            table.resetColumnFilters()
            table.setGlobalFilter("")
            onSearchChange?.("")
            onClinicFilterChange("")
            onDoctorFilterChange("")
            onPatientFilterChange("")
            onStatusFilterChange?.("")
          }}
          disabled={!isFiltered}
        />

        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto sm:gap-3">
          {can("billing_export") && role !== "patient" && (
            <ExportDialog
              data={data}
              columns={getBillingRecordsExportColumns(formatCurrencyCompact)}
              filename="billing-records"
              title="Export Billing Records"
            />
          )}
          <DataTableViewOptions table={table} />
          {can("billing_add") && role !== "patient" && <AddBillDialog />}
        </div>
      </div>
    </div>
  )
}
