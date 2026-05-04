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
import { cn } from "@/lib/utils"
import type { Encounter, EncounterReportPayload } from "@/types/encounter.types"
import type { DateRange } from "react-day-picker"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onAddEncounter: (patientId: string, data: EncounterReportPayload) => void
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
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  isLoading?: boolean
  isDoctorsLoading?: boolean
  isPatientsLoading?: boolean
  role?: any
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onAddEncounter,
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
  pageCount,
  pageIndex = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  isLoading,
  role,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "encounterDate", desc: true },
  ])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const lastRowRef = React.useRef<HTMLTableRowElement>(null)

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount,
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
    manualPagination: true,
    manualSorting: false,
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
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // No infinite scroll for main table, handled by standard pagination

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table as any}
        data={data as any[]}
        filterType={filterType}
        onFilterTypeChange={onFilterTypeChange}
        dateFilter={dateFilter}
        onDateFilterChange={onDateFilterChange}
        patientFilter={patientFilter}
        onPatientFilterChange={onPatientFilterChange}
        patientOptions={patientOptions}
        onPatientsLoadMore={onPatientsLoadMore}
        onPatientsSearchChange={onPatientsSearchChange}
        hasNextPatientsPage={hasNextPatientsPage}
        isFetchingNextPatientsPage={isFetchingNextPatientsPage}
        doctorFilter={doctorFilter}
        onDoctorFilterChange={onDoctorFilterChange}
        doctorOptions={doctorOptions}
        onDoctorsLoadMore={onDoctorsLoadMore}
        onDoctorsSearchChange={onDoctorsSearchChange}
        hasNextDoctorsPage={hasNextDoctorsPage}
        isFetchingNextDoctorsPage={isFetchingNextDoctorsPage}
        clinicFilter={clinicFilter}
        onClinicFilterChange={onClinicFilterChange}
        clinicOptions={clinicOptions}
        onClinicsLoadMore={onClinicsLoadMore}
        onClinicsSearchChange={onClinicsSearchChange}
        hasNextClinicsPage={hasNextClinicsPage}
        isFetchingNextClinicsPage={isFetchingNextClinicsPage}
        isClinicsLoading={isClinicsLoading}
        isDoctorsLoading={isDoctorsLoading}
        isPatientsLoading={isPatientsLoading}
        role={role}
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
