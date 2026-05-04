"use client"

import type { Table } from "@tanstack/react-table"
import { Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import {
  DataTableResetButton,
  DataTableInfiniteFilterSelect,
  DataTableSearch
} from "@/components/common/data-table-filters"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"
import { usePermissions } from "@/hooks/use-permissions"
import {
  DATA_TABLE_FILTER_CELL,
  DATA_TABLE_FILTER_GRID,
} from "@/components/data-table/data-table-toolbar-layout"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAddSession?: () => void
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  clinicFilter: string
  onClinicFilterChange: (value: string) => void
  doctorFilter: string
  onDoctorFilterChange: (value: string) => void
  onResetFilters: () => void
  clinicOptions: Clinic[]
  doctorOptions: Doctor[]
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
  role?: any
}

export function DataTableToolbar<TData>({
  table,
  onAddSession,
  globalFilter,
  onGlobalFilterChange,
  clinicFilter,
  onClinicFilterChange,
  doctorFilter,
  onDoctorFilterChange,
  onResetFilters,
  clinicOptions,
  doctorOptions,
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
  role,
}: DataTableToolbarProps<TData>) {
  const { can } = usePermissions()
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className={DATA_TABLE_FILTER_GRID}>
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
      </div>

      <div className="flex w-full min-w-0 flex-wrap items-center gap-3">
        <DataTableSearch
          table={table}
          value={globalFilter}
          onValueChange={onGlobalFilterChange}
          placeholder="Search sessions..."
          className="h-9 w-full min-w-0 sm:w-[200px] lg:w-[250px]"
        />

        <DataTableResetButton
          table={table}
          onReset={onResetFilters}
          disabled={!globalFilter.trim() && !clinicFilter && !doctorFilter}
        />

        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto sm:gap-3">
          <DataTableViewOptions table={table} />
          {onAddSession && can("doctor_session_add") && (
            <Button onClick={onAddSession} className="h-9 gap-1.5 px-3">
              <Plus className="size-4" />
              Add Session
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
