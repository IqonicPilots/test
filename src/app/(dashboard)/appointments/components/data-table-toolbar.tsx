"use client"

import type { Table } from "@tanstack/react-table"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { AppointmentFormDialog } from "./appointment-form-dialog"
import type { AppointmentPayload } from "@/services/appointment.service"
import type { Clinic } from "@/types/clinic.types"
import {
  DataTableSearch,
  DataTableFilterSelect,
  DataTableResetButton,
  DataTableInfiniteFilterSelect,
} from "@/components/common/data-table-filters"
import { ExportDialog, getAppointmentExportColumns } from "@/components/common/export-dialog"
import { usePermissions } from "@/hooks/use-permissions"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"
import {
  DATA_TABLE_FILTER_CELL,
  DATA_TABLE_FILTER_GRID,
} from "@/components/data-table/data-table-toolbar-layout"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  data?: any[]
  onAddAppointment: (data: AppointmentPayload) => void
  onUpdateAppointment: (id: string, data: Partial<AppointmentPayload>) => void
  filterType: string
  onFilterTypeChange: (value: string) => void
  clinicFilter: string
  onClinicFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  doctorFilter: string
  onDoctorFilterChange: (value: string) => void
  patientFilter: string
  onPatientFilterChange: (value: string) => void
  serviceFilter: string
  onServiceFilterChange: (value: string) => void

  clinics: Clinic[]
  onClinicsLoadMore?: () => void
  onClinicsSearchChange?: (value: string) => void
  hasNextClinicsPage?: boolean
  isFetchingNextClinicsPage?: boolean
  isClinicsLoading?: boolean

  doctors?: any[]
  onDoctorsLoadMore?: () => void
  onDoctorsSearchChange?: (value: string) => void
  hasNextDoctorsPage?: boolean
  isFetchingNextDoctorsPage?: boolean
  isDoctorsLoading?: boolean

  patients?: any[]
  onPatientsLoadMore?: () => void
  onPatientsSearchChange?: (value: string) => void
  hasNextPatientsPage?: boolean
  isFetchingNextPatientsPage?: boolean
  isPatientsLoading?: boolean

  services?: any[]
  onServicesLoadMore?: () => void
  onServicesSearchChange?: (value: string) => void
  hasNextServicesPage?: boolean
  isFetchingNextServicesPage?: boolean
  isServicesLoading?: boolean
}

export function DataTableToolbar<TData>({
  table,
  data = [],
  onAddAppointment,
  onUpdateAppointment,
  filterType,
  onFilterTypeChange,
  clinicFilter,
  onClinicFilterChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  doctorFilter,
  onDoctorFilterChange,
  patientFilter,
  onPatientFilterChange,
  serviceFilter,
  onServiceFilterChange,
  clinics = [],
  onClinicsLoadMore,
  onClinicsSearchChange,
  hasNextClinicsPage,
  isFetchingNextClinicsPage,
  isClinicsLoading,
  doctors = [],
  onDoctorsLoadMore,
  onDoctorsSearchChange,
  hasNextDoctorsPage,
  isFetchingNextDoctorsPage,
  isDoctorsLoading,
  patients = [],
  onPatientsLoadMore,
  onPatientsSearchChange,
  hasNextPatientsPage,
  isFetchingNextPatientsPage,
  isPatientsLoading,
  services = [],
  onServicesLoadMore,
  onServicesSearchChange,
  hasNextServicesPage,
  isFetchingNextServicesPage,
  isServicesLoading,
}: DataTableToolbarProps<TData>) {
  const { role, can, isLoading: isPermissionsLoading } = usePermissions()
  const { formatCurrencyCompact } = useCurrencyFormatter(true)
  const isClinicAdminOrReceptionist = role === "clinic_admin" || role === "receptionist"
  const canAdd = can("appointment_add")
  const canExport = can("appointment_export")

  const clinicOptions = clinics.map((c) => ({ label: c.name, value: String((c as any)._id || (c as any).id || "") })).filter((o) => Boolean(o.value))

  const timeframeOptions = [
    { label: "Upcoming", value: "Upcoming" },
    { label: "Past Date", value: "Past" },
  ]

  const doctorOptions = doctors.map((d) => ({
    label: d.fullName || `${d.firstName} ${d.lastName}`,
    value: String(d._id || d.id || ""),
  })).filter((o) => Boolean(o.value))

  const patientOptions = patients.map((p) => ({
    label: p.fullName || `${p.firstName} ${p.lastName}`,
    value: String(p._id || p.id || ""),
  })).filter((o) => Boolean(o.value))

  const serviceOptions = services.map((s) => ({
    label: s.name,
    value: String(s._id || s.id || ""),
  })).filter((o) => Boolean(o.value))

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className={DATA_TABLE_FILTER_GRID}>
        <DataTableFilterSelect
          className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
          value={filterType}
          onValueChange={onFilterTypeChange}
          placeholder="Timeframe"
          options={timeframeOptions}
          allLabel="All Appointments"
        />

        {!isClinicAdminOrReceptionist && (
          <DataTableInfiniteFilterSelect
            value={clinicFilter}
            className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
            onValueChange={onClinicFilterChange}
            onSearchChange={onClinicsSearchChange || (() => { })}
            placeholder="Clinic"
            options={clinicOptions}
            allLabel="All Clinics"
            hasNextPage={hasNextClinicsPage}
            isFetchingNextPage={isFetchingNextClinicsPage}
            isLoading={isClinicsLoading}
            onLoadMore={onClinicsLoadMore}
          />
        )}

        {role !== "doctor" && (
          <DataTableInfiniteFilterSelect
            value={doctorFilter}
            className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
            onValueChange={onDoctorFilterChange}
            onSearchChange={onDoctorsSearchChange || (() => { })}
            placeholder="Doctor"
            options={doctorOptions}
            allLabel="All Doctors"
            hasNextPage={hasNextDoctorsPage}
            isFetchingNextPage={isFetchingNextDoctorsPage}
            isLoading={isDoctorsLoading}
            onLoadMore={onDoctorsLoadMore}
          />
        )}
        
        <DataTableInfiniteFilterSelect
          value={serviceFilter}
          onValueChange={onServiceFilterChange}
          onSearchChange={onServicesSearchChange || (() => { })}
          placeholder="Service"
          className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
          options={serviceOptions}
          allLabel="All Services"
          hasNextPage={hasNextServicesPage}
          isFetchingNextPage={isFetchingNextServicesPage}
          isLoading={isServicesLoading}
          onLoadMore={onServicesLoadMore}
        />

        {role !== "patient" && (
          <DataTableInfiniteFilterSelect
            value={patientFilter}
            className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
            onValueChange={onPatientFilterChange}
            onSearchChange={onPatientsSearchChange || (() => { })}
            placeholder="Patient"
            options={patientOptions}
            allLabel="All Patients"
            hasNextPage={hasNextPatientsPage}
            isFetchingNextPage={isFetchingNextPatientsPage}
            isLoading={isPatientsLoading}
            onLoadMore={onPatientsLoadMore}
          />
        )}


        <DataTableFilterSelect
          className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
          value={statusFilter}
          onValueChange={onStatusFilterChange}
          placeholder="Status"
          options={[
            { label: "Booked", value: "booked" },
            { label: "Check In", value: "check_in" },
            { label: "Check Out", value: "checkout" },
            { label: "Cancelled", value: "cancelled" },
          ]}
          allLabel="All Status"
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
          onReset={() => {
            onFilterTypeChange("Upcoming")
            onClinicFilterChange("")
            onStatusFilterChange("")
            onDoctorFilterChange("")
            onPatientFilterChange("")
            onServiceFilterChange("")
            onSearchQueryChange("")
          }}
          disabled={
            !clinicFilter &&
            !statusFilter &&
            !doctorFilter &&
            !patientFilter &&
            !serviceFilter &&
            !searchQuery &&
            filterType === "Upcoming"
          }
        />
        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto sm:gap-3">
          {canExport && role !== "patient" && (
            <ExportDialog
              data={data}
              columns={getAppointmentExportColumns(formatCurrencyCompact)}
              filename="appointments"
              title="Export Appointments"
            />
          )}
          <DataTableViewOptions table={table} />
          {canAdd && <AppointmentFormDialog onAddAppointment={onAddAppointment} onUpdateAppointment={onUpdateAppointment} />}
        </div>
      </div>
    </div>
  )
}
