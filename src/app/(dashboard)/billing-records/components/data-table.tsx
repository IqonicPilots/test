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

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableBodySkeleton } from "@/components/dashboard-page-skeleton"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  onPaginationChange?: (pageIndex: number, pageSize: number) => void
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

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  pageCount,
  pageIndex = 0,
  pageSize = 10,
  onPaginationChange,
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
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination: true,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter,
      pagination: { pageIndex, pageSize },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const nextState = updater({ pageIndex, pageSize })
        onPaginationChange?.(nextState.pageIndex, nextState.pageSize)
      } else {
        onPaginationChange?.(updater.pageIndex, updater.pageSize)
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

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        data={data as any[]}
        clinicFilter={clinicFilter}
        onClinicFilterChange={onClinicFilterChange}
        clinicOptions={clinicOptions}
        onClinicsLoadMore={onClinicsLoadMore}
        onClinicsSearchChange={onClinicsSearchChange}
        hasNextClinicsPage={hasNextClinicsPage}
        isFetchingNextClinicsPage={isFetchingNextClinicsPage}
        doctorFilter={doctorFilter}
        onDoctorFilterChange={onDoctorFilterChange}
        doctorOptions={doctorOptions}
        onDoctorsLoadMore={onDoctorsLoadMore}
        onDoctorsSearchChange={onDoctorsSearchChange}
        hasNextDoctorsPage={hasNextDoctorsPage}
        isFetchingNextDoctorsPage={isFetchingNextDoctorsPage}
        patientFilter={patientFilter}
        onPatientFilterChange={onPatientFilterChange}
        patientOptions={patientOptions}
        onPatientsLoadMore={onPatientsLoadMore}
        onPatientsSearchChange={onPatientsSearchChange}
        hasNextPatientsPage={hasNextPatientsPage}
        isFetchingNextPatientsPage={isFetchingNextPatientsPage}
        isClinicsLoading={isClinicsLoading}
        isDoctorsLoading={isDoctorsLoading}
        isPatientsLoading={isPatientsLoading}
        search={search}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
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
