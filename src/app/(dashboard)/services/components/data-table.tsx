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
import type { StaticData } from "@/types/listing.types"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  categories: StaticData[]
  isLoadingCategories?: boolean
  isLoading?: boolean
  clinicOptions: Clinic[]
  doctorOptions: Doctor[]
  clinicFilter: string
  onClinicFilterChange: (value: string) => void
  doctorFilter: string
  onDoctorFilterChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  onResetFilters: () => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
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
  onImportServices?: (services: any[]) => Promise<void>
  allClinics?: Clinic[]
  allDoctors?: Doctor[]
  role?: any
}

export function DataTable<TData, TValue>({
  columns,
  data,
  categories,
  isLoadingCategories,
  isLoading,
  clinicOptions,
  doctorOptions,
  clinicFilter,
  onClinicFilterChange,
  doctorFilter,
  onDoctorFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  onResetFilters,
  searchQuery,
  onSearchQueryChange,
  onPageChange,
  onPageSizeChange,
  pageCount,
  pageIndex = 0,
  pageSize = 10,
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
  onImportServices,
  allClinics,
  allDoctors,
  role,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const lastRowRef = React.useRef<HTMLTableRowElement>(null)

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
        data={data}
        categories={categories}
        allDoctors={allDoctors || doctorOptions}
        allClinics={allClinics || clinicOptions}
        isLoadingCategories={isLoadingCategories}
        globalFilter={searchQuery}
        onGlobalFilterChange={onSearchQueryChange}
        clinicFilter={clinicFilter}
        onClinicFilterChange={onClinicFilterChange}
        doctorFilter={doctorFilter}
        onDoctorFilterChange={onDoctorFilterChange}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={onCategoryFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        onResetFilters={onResetFilters}
        onClinicsLoadMore={onClinicsLoadMore}
        onClinicsSearchChange={onClinicsSearchChange}
        hasNextClinicsPage={hasNextClinicsPage}
        isFetchingNextClinicsPage={isFetchingNextClinicsPage}
        onDoctorsLoadMore={onDoctorsLoadMore}
        onDoctorsSearchChange={onDoctorsSearchChange}
        hasNextDoctorsPage={hasNextDoctorsPage}
        isFetchingNextDoctorsPage={isFetchingNextDoctorsPage}
        isClinicsLoading={isClinicsLoading}
        isDoctorsLoading={isDoctorsLoading}
        onImportServices={onImportServices}
        clinicOptions={clinicOptions}
        doctorOptions={doctorOptions}
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
