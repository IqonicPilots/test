"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { TableBodySkeleton } from "@/components/dashboard-page-skeleton"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import type { DoctorTableRow } from "./columns"
import type { DoctorFormValues } from "./doctor-form-dialog"
import type { Clinic } from "@/types/clinic.types"
import type { StaticData } from "@/types/listing.types"

interface DataTableProps {
  columns: ColumnDef<DoctorTableRow>[]
  data: DoctorTableRow[]
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
  specializationFilterOptions?: StaticData[]
  isCreateBusy?: boolean
  isLoading?: boolean
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  clinicFilter: string
  onClinicFilterChange: (value: string) => void
  specializationFilter: string
  onSpecializationFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onResetFilters: () => void
  hideClinicFilter?: boolean
  hideSpecializationFilter?: boolean
  onLoadMore?: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
}

export function DataTable({
  columns,
  data,
  doctors,
  onAddDoctor,
  onImportDoctors,
  clinics,
  allClinics,
  onClinicsLoadMore,
  onClinicsSearchChange,
  hasNextClinicsPage,
  isFetchingNextClinicsPage,
  isClinicsLoading,
  specialties,
  specializationFilterOptions,
  isCreateBusy,
  isLoading,
  pageCount,
  pageIndex = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  clinicFilter,
  onClinicFilterChange,
  specializationFilter,
  onSpecializationFilterChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  onResetFilters,
  hideClinicFilter = false,
  hideSpecializationFilter = false,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
}: DataTableProps) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      registeredOn: false,
    })
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "registeredOn", desc: true },
  ])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination: true,
    manualFiltering: true,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const nextState = updater({ pageIndex, pageSize })
        onPageChange?.(nextState.pageIndex + 1)
        onPageSizeChange?.(nextState.pageSize)
      }
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // No infinite scroll for main table, handled by standard pagination

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        data={data as any[]}
        doctors={doctors}
        onAddDoctor={onAddDoctor}
        onImportDoctors={onImportDoctors}
        clinics={clinics}
        allClinics={allClinics}
        onClinicsLoadMore={onClinicsLoadMore}
        onClinicsSearchChange={onClinicsSearchChange}
        hasNextClinicsPage={hasNextClinicsPage}
        isFetchingNextClinicsPage={isFetchingNextClinicsPage}
        isClinicsLoading={isClinicsLoading}
        specialties={specialties}
        specializationFilterOptions={specializationFilterOptions}
        clinicFilter={clinicFilter}
        onClinicFilterChange={onClinicFilterChange}
        specializationFilter={specializationFilter}
        onSpecializationFilterChange={onSpecializationFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        onResetFilters={onResetFilters}
        isCreateBusy={isCreateBusy}
        hideClinicFilter={hideClinicFilter}
        hideSpecializationFilter={hideSpecializationFilter}
      />
      <div className="flex flex-1 flex-col min-h-0 rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableBodySkeleton columnCount={columns.length} />
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
