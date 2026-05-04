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

interface ClinicFormValues {
  name: string
  email: string
  adminFirstName: string
  adminLastName: string
  adminEmail: string
  contactNo: string
  adminMobile: string
  clinicSpecialties: string[]
  address: string
  status: string
  city: string
  state: string
  country: string
  postalCode: string
  adminDateOfBirth: string
  adminGender: string
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onAddClinic: (data: ClinicFormValues) => void
  onImportClinics?: (clinics: ClinicFormValues[]) => Promise<void | false>
  isLoading?: boolean
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onAddClinic,
  onImportClinics,
  isLoading,
  pageCount,
  pageIndex = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState(searchQuery)
  const lastRowRef = React.useRef<HTMLTableRowElement>(null)

  React.useEffect(() => {
    setGlobalFilter(searchQuery)
  }, [searchQuery])

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
        data={data as any[]}
        onAddClinic={onAddClinic}
        onImportClinics={onImportClinics}
        searchQuery={globalFilter}
        onSearchQueryChange={(val) => {
          setGlobalFilter(val)
          onSearchQueryChange(val)
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
      />
      <div className="flex flex-1 flex-col min-h-0 rounded-md border">
        <div
          className="overflow-y-auto overflow-x-auto min-h-0"
        >
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
              {isLoading && data.length === 0 ? (
                <TableBodySkeleton columnCount={columns.length} />
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    ref={index === table.getRowModel().rows.length - 1 ? lastRowRef : null}
                  >
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
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
