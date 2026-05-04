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
import type { ReceptionistFormValues } from "./receptionist-form-dialog"
import type { ReceptionistTableRow } from "./columns"
import type { Clinic } from "@/types/clinic.types"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  receptionists: ReceptionistTableRow[]
  clinics: Clinic[]
  onAddReceptionist: (data: ReceptionistFormValues) => void | Promise<void>
  onImportReceptionists?: (data: any[]) => Promise<void | false>
  isCreateBusy?: boolean
  isLoading?: boolean
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  clinicFilter: string
  onClinicFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  onResetFilters: () => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onClinicsLoadMore?: () => void
  onClinicsSearchChange?: (value: string) => void
  hasNextClinicsPage?: boolean
  isFetchingNextClinicsPage?: boolean
  isClinicsLoading?: boolean
  role?: any
}

export function DataTable<TData, TValue>({
  columns,
  data,
  receptionists,
  clinics,
  onAddReceptionist,
  onImportReceptionists,
  isCreateBusy,
  isLoading,
  pageCount,
  pageIndex = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  clinicFilter,
  onClinicFilterChange,
  statusFilter,
  onStatusFilterChange,
  onResetFilters,
  searchQuery,
  onSearchQueryChange,
  onClinicsLoadMore,
  onClinicsSearchChange,
  hasNextClinicsPage,
  isFetchingNextClinicsPage,
  isClinicsLoading,
  role,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState(searchQuery)

  React.useEffect(() => {
    setGlobalFilter(searchQuery)
  }, [searchQuery])

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
        data={data}
        receptionists={receptionists}
        clinics={clinics}
        onAddReceptionist={onAddReceptionist}
        onImportReceptionists={onImportReceptionists}
        isCreateBusy={isCreateBusy}
        globalFilter={globalFilter}
        onGlobalFilterChange={(value) => {
          setGlobalFilter(value)
          onSearchQueryChange(value)
        }}
        clinicFilter={clinicFilter}
        onClinicFilterChange={onClinicFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        onResetFilters={onResetFilters}
        onClinicsLoadMore={onClinicsLoadMore}
        onClinicsSearchChange={onClinicsSearchChange}
        hasNextClinicsPage={hasNextClinicsPage}
        isFetchingNextClinicsPage={isFetchingNextClinicsPage}
        isClinicsLoading={isClinicsLoading}
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
