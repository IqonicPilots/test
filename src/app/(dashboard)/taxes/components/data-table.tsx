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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { TableBodySkeleton } from "@/components/dashboard-page-skeleton"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import type { Tax, TaxPayload } from "@/types/tax.types"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  taxes: Tax[]
  onAddTax: (tax: TaxPayload) => void
  onUpdateTax: (id: string, tax: Partial<TaxPayload>) => void
  isLoading?: boolean
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  onPaginationChange?: (pageIndex: number, pageSize: number) => void
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
  // Service filter props
  serviceFilter: string
  onServiceFilterChange: (value: string) => void
  serviceOptions: any[]
  onServicesLoadMore?: () => void
  onServicesSearchChange?: (value: string) => void
  hasNextServicesPage?: boolean
  isFetchingNextServicesPage?: boolean
  isClinicsLoading?: boolean
  isDoctorsLoading?: boolean
  isServicesLoading?: boolean
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  role?: any
}

export function DataTable<TData, TValue>({
  columns,
  data,
  taxes,
  onAddTax,
  onUpdateTax,
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
  serviceFilter,
  onServiceFilterChange,
  serviceOptions,
  onServicesLoadMore,
  onServicesSearchChange,
  hasNextServicesPage,
  isFetchingNextServicesPage,
  isClinicsLoading,
  isDoctorsLoading,
  isServicesLoading,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  role,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ createdAt: false })
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ])
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
        taxes={taxes}
        onAddTax={onAddTax}
        onUpdateTax={onUpdateTax}
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
        serviceFilter={serviceFilter}
        onServiceFilterChange={onServiceFilterChange}
        serviceOptions={serviceOptions}
        onServicesLoadMore={onServicesLoadMore}
        onServicesSearchChange={onServicesSearchChange}
        hasNextServicesPage={hasNextServicesPage}
        isFetchingNextServicesPage={isFetchingNextServicesPage}
        isClinicsLoading={isClinicsLoading}
        isDoctorsLoading={isDoctorsLoading}
        isServicesLoading={isServicesLoading}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
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
