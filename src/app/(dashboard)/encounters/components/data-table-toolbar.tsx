"use client"

import type { Table } from "@tanstack/react-table"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { DataTableDateRangeFilterControlled } from "@/components/common/data-table-filters"
import {
  DataTableSearch,
  DataTableResetButton,
  DataTableFilterSelect,
  DataTableInfiniteFilterSelect
} from "@/components/common/data-table-filters"
import { ExportDialog, encounterExportColumns } from "@/components/common/export-dialog"
import type { DateRange } from "react-day-picker"
import { usePermissions } from "@/hooks/use-permissions"
import { AddEncounterDialog } from "./add-encounter-dialog"
import {
  DATA_TABLE_FILTER_CELL,
  DATA_TABLE_FILTER_GRID,
} from "@/components/data-table/data-table-toolbar-layout"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  data?: any[]
  filterType: string
  onFilterTypeChange: (value: string) => void
  dateFilter: DateRange | undefined
  onDateFilterChange: (date: DateRange | undefined) => void
  patientFilter: string
  onPatientFilterChange: (value: string) => void
  patientOptions?: { label: string; value: string }[]
  onPatientsLoadMore?: () => void
  onPatientsSearchChange?: (value: string) => void
  hasNextPatientsPage?: boolean
  isFetchingNextPatientsPage?: boolean
  doctorFilter: string
  onDoctorFilterChange: (value: string) => void
  doctorOptions?: { label: string; value: string }[]
  onDoctorsLoadMore?: () => void
  onDoctorsSearchChange?: (value: string) => void
  hasNextDoctorsPage?: boolean
  isFetchingNextDoctorsPage?: boolean
  clinicFilter: string
  onClinicFilterChange: (value: string) => void
  clinicOptions?: { label: string; value: string }[]
  onClinicsLoadMore?: () => void
  onClinicsSearchChange?: (value: string) => void
  hasNextClinicsPage?: boolean
  isFetchingNextClinicsPage?: boolean
  isClinicsLoading?: boolean
  isDoctorsLoading?: boolean
  isPatientsLoading?: boolean
  role?: any
}

export function DataTableToolbar<TData>({
  table,
  data = [],
  filterType,
  onFilterTypeChange,
  dateFilter,
  onDateFilterChange,
  patientFilter,
  onPatientFilterChange,
  patientOptions = [],
  onPatientsLoadMore,
  onPatientsSearchChange,
  hasNextPatientsPage,
  isFetchingNextPatientsPage,
  doctorFilter,
  onDoctorFilterChange,
  doctorOptions = [],
  onDoctorsLoadMore,
  onDoctorsSearchChange,
  hasNextDoctorsPage,
  isFetchingNextDoctorsPage,
  clinicFilter,
  onClinicFilterChange,
  clinicOptions = [],
  onClinicsLoadMore,
  onClinicsSearchChange,
  hasNextClinicsPage,
  isFetchingNextClinicsPage,
  isClinicsLoading,
  isDoctorsLoading,
  isPatientsLoading,
  role,
}: DataTableToolbarProps<TData>) {

  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Closed", value: "Closed" },
  ]

  const handleResetAll = () => {
    onFilterTypeChange("")
    onDateFilterChange(undefined)
    onPatientFilterChange("")
    onDoctorFilterChange("")
    onClinicFilterChange("")
    table.setGlobalFilter("")
  }

  const hasActiveFilters = () => {
    const globalFilter = table.getState().globalFilter as string | undefined
    return (
      filterType !== "" ||
      !!dateFilter ||
      patientFilter !== "" ||
      doctorFilter !== "" ||
      clinicFilter !== "" ||
      !!globalFilter
    )
  }

  const { can } = usePermissions()
  const canExport = can("encounter_export")

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className={DATA_TABLE_FILTER_GRID}>
        {role !== "patient" && (
          <DataTableInfiniteFilterSelect
            value={patientFilter}
            onValueChange={onPatientFilterChange}
            placeholder="Patient"
            options={patientOptions}
            allLabel="All Patients"
            onLoadMore={onPatientsLoadMore}
            onSearchChange={onPatientsSearchChange}
            hasNextPage={hasNextPatientsPage}
            isFetchingNextPage={isFetchingNextPatientsPage}
            isLoading={isPatientsLoading}
            className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
          />
        )}

        {role !== "clinic_admin" && (
          <DataTableInfiniteFilterSelect
            value={clinicFilter}
            onValueChange={onClinicFilterChange}
            placeholder="Clinic"
            options={clinicOptions}
            allLabel="All Clinics"
            onLoadMore={onClinicsLoadMore}
            onSearchChange={onClinicsSearchChange}
            hasNextPage={hasNextClinicsPage}
            isFetchingNextPage={isFetchingNextClinicsPage}
            isLoading={isClinicsLoading}
            className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
          />
        )}
        
        {role !== "doctor" && (
          <DataTableInfiniteFilterSelect
            value={doctorFilter}
            onValueChange={onDoctorFilterChange}
            placeholder="Doctor"
            options={doctorOptions}
            allLabel="All Doctors"
            onLoadMore={onDoctorsLoadMore}
            onSearchChange={onDoctorsSearchChange}
            hasNextPage={hasNextDoctorsPage}
            isFetchingNextPage={isFetchingNextDoctorsPage}
            isLoading={isDoctorsLoading}
            className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
          />
        )}


        <DataTableFilterSelect
          value={filterType}
          onValueChange={onFilterTypeChange}
          placeholder="Status"
          options={statusOptions}
          allLabel="All Status"
          className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
        />
        <div className="w-full min-w-0 sm:[&_button]:w-auto sm:hidden lg:block">
          <DataTableDateRangeFilterControlled
            date={dateFilter}
            onDateChange={onDateFilterChange}
          />
        </div>
      </div>

      {/* Own row so the trigger can be w-full on mobile (same pattern as Patients two-row date row). */}

      <div className="flex w-full min-w-0 flex-wrap items-center gap-3">
        <div className="sm:[&_button]:w-auto sm:[&_button]:min-w-[180px] hidden sm:block lg:hidden">
          <DataTableDateRangeFilterControlled
            date={dateFilter}
            onDateChange={onDateFilterChange}
          />
        </div>
        <DataTableSearch
          table={table}
          placeholder="Search Encounters"
          className="h-9 w-full min-w-0 sm:w-[200px] lg:w-[250px]"
        />
        <DataTableResetButton
          table={table}
          onReset={handleResetAll}
          disabled={!hasActiveFilters()}
        />
        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto sm:gap-3">
          {canExport && role !== "patient" && (
            <ExportDialog
              data={data}
              columns={encounterExportColumns}
              filename="encounters"
              title="Export Encounters"
            />
          )}
          <DataTableViewOptions table={table} />
          {can("encounter_add") && (
            <AddEncounterDialog />
          )}
        </div>
      </div>
    </div>
  )
}
