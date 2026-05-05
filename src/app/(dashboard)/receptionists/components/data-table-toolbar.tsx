"use client"

import type { Table } from "@tanstack/react-table"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { ReceptionistFormDialog } from "./receptionist-form-dialog"
import type { ReceptionistFormValues } from "./receptionist-form-dialog"
import type { Clinic } from "@/types/clinic.types"
import type { ReceptionistTableRow } from "./columns"
import {
  DataTableResetButton,
  DataTableInfiniteFilterSelect,
  DataTableSearch,
  DataTableFilterSelect
} from "@/components/common/data-table-filters"
import { usePermissions } from "@/hooks/use-permissions"
import { ExportDialog, receptionistExportColumns } from "@/components/common/export-dialog"
import { ImportDialog } from "@/components/common/import-dialog"
import {
  DATA_TABLE_FILTER_CELL,
  DATA_TABLE_FILTER_GRID,
} from "@/components/data-table/data-table-toolbar-layout"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  receptionists: ReceptionistTableRow[]
  clinics: Clinic[]
  data?: any[]
  onAddReceptionist: (data: ReceptionistFormValues) => void | Promise<void>
  onImportReceptionists?: (data: any[]) => Promise<void | false>
  isCreateBusy?: boolean
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  clinicFilter: string
  onClinicFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  onResetFilters: () => void
  onClinicsLoadMore?: () => void
  onClinicsSearchChange?: (value: string) => void
  hasNextClinicsPage?: boolean
  isFetchingNextClinicsPage?: boolean
  isClinicsLoading?: boolean
  role?: any
}

export function DataTableToolbar<TData>({
  table,
  clinics,
  data = [],
  onAddReceptionist,
  onImportReceptionists,
  isCreateBusy = false,
  clinicFilter,
  onClinicFilterChange,
  statusFilter,
  onStatusFilterChange,
  onResetFilters,
  globalFilter,
  onGlobalFilterChange,
  onClinicsLoadMore,
  onClinicsSearchChange,
  hasNextClinicsPage,
  isFetchingNextClinicsPage,
  isClinicsLoading,
  role,
}: DataTableToolbarProps<TData>) {
  const { can } = usePermissions()
  const hasServerFilters = Boolean(
    globalFilter?.trim() ||
    clinicFilter ||
    statusFilter
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className={DATA_TABLE_FILTER_GRID}>
        {role !== "clinic_admin" && role !== "receptionist" && (
          <DataTableInfiniteFilterSelect
            value={clinicFilter}
            onValueChange={onClinicFilterChange}
            placeholder="Clinic Name"
            options={clinics.map((c) => ({ label: c.name, value: c._id }))}
            onLoadMore={onClinicsLoadMore}
            onSearchChange={onClinicsSearchChange}
            hasNextPage={hasNextClinicsPage}
            isFetchingNextPage={isFetchingNextClinicsPage}
            isLoading={isClinicsLoading}
            className={`h-9 cursor-pointer ${DATA_TABLE_FILTER_CELL}`}
            allLabel="All Clinics"
          />
        )}

        <DataTableFilterSelect
          value={statusFilter || "all"}
          onValueChange={(value: string) => onStatusFilterChange(value === "all" ? "" : value)}
          placeholder="Status"
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
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
          disabled={!hasServerFilters}
        />

        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto sm:gap-3">
          {onImportReceptionists && can("receptionist_import_export") && (
            <>
              <ImportDialog 
                onImport={onImportReceptionists}
                title="Import Receptionists"
                requiredFields={[
                  "First Name",
                  "Last Name",
                  "Email",
                  "Phone Number",
                  "Clinic Name",
                  "Date of Birth",
                  "Status",
                  "Gender"
                ]}
                notes={[
                  "Clinic Name must match an existing clinic name exactly.",
                  "Status should be 'Active' or 'Inactive'.",
                  "Gender should be 'Male', 'Female', or 'Other'."
                ]}
              />
              <ExportDialog
                data={data}
                columns={receptionistExportColumns}
                filename="receptionists"
                title="Export Receptionists"
              />
            </>
          )}
          <DataTableViewOptions table={table} />
          {can("receptionist_add") && (
            <ReceptionistFormDialog
              mode="create"
              clinics={clinics}
              onSubmit={onAddReceptionist}
              isSubmitting={isCreateBusy}
              onClinicsLoadMore={onClinicsLoadMore}
              onClinicsSearchChange={onClinicsSearchChange}
              hasNextClinicsPage={hasNextClinicsPage}
              isFetchingNextClinicsPage={isFetchingNextClinicsPage}
              isClinicsLoading={isClinicsLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
