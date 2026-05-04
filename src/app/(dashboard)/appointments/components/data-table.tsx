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
import type { Appointment, AppointmentPayload } from "@/services/appointment.service"
import { Loader2 } from "lucide-react"

import type { Clinic } from "@/types/clinic.types"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onAddAppointment: (data: AppointmentPayload) => void
  onUpdateAppointment: (id: string, data: Partial<AppointmentPayload>) => void
  filterType: string
  onFilterTypeChange: (value: string) => void
  clinicFilter: string
  onClinicFilterChange: (value: string) => void
  doctorFilter: string
  onDoctorFilterChange: (value: string) => void
  patientFilter: string
  onPatientFilterChange: (value: string) => void
  serviceFilter: string
  onServiceFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  pageCount?: number
  pageIndex?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSize?: number
  isLoading?: boolean
  clinics?: Clinic[]
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

  maxHeight?: string | number
  onLoadMore?: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean

  role?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
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
  pageCount,
  pageIndex = 0,
  onPageChange,
  onPageSizeChange,
  pageSize = 10,
  isLoading,
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
  maxHeight = "calc(100vh - 320px)",
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
  role
}: DataTableProps<TData, TValue>) {

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    "Created At": false,
    "doctorId": false,
    "clinicId": false,
  })

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "Created At", desc: true },
  ])
  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
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
    manualPagination: true,
    manualSorting: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const tableStyle = maxHeight
    ? { maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight }
    : undefined

  const sentinelRef = React.useRef<HTMLTableRowElement>(null)

  React.useEffect(() => {
    if (!onLoadMore || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentSentinel = sentinelRef.current
    if (currentSentinel) {
      observer.observe(currentSentinel)
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel)
      }
    }
  }, [onLoadMore, hasNextPage, isFetchingNextPage])

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        data={data as any[]}
        onAddAppointment={onAddAppointment}
        onUpdateAppointment={onUpdateAppointment}
        filterType={filterType}
        onFilterTypeChange={onFilterTypeChange}
        clinicFilter={clinicFilter}
        onClinicFilterChange={onClinicFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        doctorFilter={doctorFilter}
        onDoctorFilterChange={onDoctorFilterChange}
        patientFilter={patientFilter}
        onPatientFilterChange={onPatientFilterChange}
        serviceFilter={serviceFilter}
        onServiceFilterChange={onServiceFilterChange}

        clinics={clinics}
        onClinicsLoadMore={onClinicsLoadMore}
        onClinicsSearchChange={onClinicsSearchChange}
        hasNextClinicsPage={hasNextClinicsPage}
        isFetchingNextClinicsPage={isFetchingNextClinicsPage}
        isClinicsLoading={isClinicsLoading}

        doctors={doctors}
        onDoctorsLoadMore={onDoctorsLoadMore}
        onDoctorsSearchChange={onDoctorsSearchChange}
        hasNextDoctorsPage={hasNextDoctorsPage}
        isFetchingNextDoctorsPage={isFetchingNextDoctorsPage}
        isDoctorsLoading={isDoctorsLoading}

        patients={patients}
        onPatientsLoadMore={onPatientsLoadMore}
        onPatientsSearchChange={onPatientsSearchChange}
        hasNextPatientsPage={hasNextPatientsPage}
        isFetchingNextPatientsPage={isFetchingNextPatientsPage}
        isPatientsLoading={isPatientsLoading}

        services={services}
        onServicesLoadMore={onServicesLoadMore}
        onServicesSearchChange={onServicesSearchChange}
        hasNextServicesPage={hasNextServicesPage}
        isFetchingNextServicesPage={isFetchingNextServicesPage}
        isServicesLoading={isServicesLoading}
      />

      <div className="flex flex-1 flex-col min-h-0 rounded-md border">
        <div
          className="overflow-y-auto overflow-x-auto min-h-0"
          style={tableStyle}
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

              {/* Load More Sentinel */}
              {onLoadMore && hasNextPage && (
                <TableRow ref={sentinelRef}>
                  <TableCell colSpan={columns.length} className="h-10 text-center py-4">
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Loading more...</span>
                      </div>
                    ) : (
                      <div className="h-4" /> // Invisible sentinel
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {!onLoadMore && <DataTablePagination table={table} />}
    </div>
  )
}
