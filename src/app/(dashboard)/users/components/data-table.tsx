"use client"

import { useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Search,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Calendar,
  UserCheck,
  Settings2,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PatientFormDialog } from "./user-form-dialog"
import { DataTablePagination } from "@/components/ui/data-table-pagination"

interface Patient {
  id: string | number
  firstName: string
  lastName: string
  email: string
  avatar: string
  mobile: string
  gender: string
  dateOfBirth: string
  address: string
  clinic: string
  registeredOn: string
  status: string
}

interface PatientFormValues {
  firstName: string
  lastName: string
  email: string
  mobile: string
  gender: string
  dateOfBirth: string
  address: string
  clinic: string
  status: string
}

interface DataTableProps {
  patients: Patient[]
  onDeletePatient: (id: string | number) => void
  onEditPatient: (patient: Patient) => void
  onAddPatient: (patientData: PatientFormValues) => void
  clinicOptions?: string[]
  clinicFilter?: string
  onClinicFilterChange?: (value: string) => void
  statusFilter?: string
  onStatusFilterChange?: (value: string) => void
  searchQuery?: string
  onSearchQueryChange?: (value: string) => void
  isLoading?: boolean
  can?: (permission: string) => boolean
}

export function DataTable({
  patients,
  onDeletePatient,
  onEditPatient,
  onAddPatient,
  clinicOptions = [],
  clinicFilter: externalClinicFilter,
  onClinicFilterChange,
  statusFilter: externalStatusFilter,
  onStatusFilterChange,
  searchQuery: externalSearchQuery,
  onSearchQueryChange,
  isLoading = false,
  can = () => true,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [clinicFilter, setClinicFilter] = useState("")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20"
      case "Inactive":
        return "text-gray-500 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20"
      default:
        return "text-gray-500 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20"
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const columns: ColumnDef<Patient>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      id: "patient",
      accessorKey: "firstName",
      header: "Patient",
      cell: ({ row }) => {
        const patient = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {patient.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{patient.firstName} {patient.lastName}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {patient.email}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "mobile",
      header: "Phone Number",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.getValue("mobile")}</span>
      ),
    },
    {
      accessorKey: "registeredOn",
      header: "Registered ON",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.getValue("registeredOn"))}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant="secondary" className={`${getStatusColor(status)} border text-xs px-2 py-0.5`}>
            {status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const patient = row.original
        return (
          <div className="flex items-center gap-1">
            {can("patient_edit") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                title="Edit patient"
                onClick={() => onEditPatient(patient)}
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
            {can("patient_view") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-500 hover:text-gray-600 hover:bg-gray-50 cursor-pointer"
                title="View patient"
              >
                <Eye className="size-3.5" />
              </Button>
            )}
            {can("patient_medical_reports") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-orange-500 hover:text-orange-600 hover:bg-orange-50 cursor-pointer"
                title="Patient report"
              >
                <FileText className="size-3.5" />
              </Button>
            )}
            {can("patient_appointment") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-50 cursor-pointer"
                title="Book appointment"
              >
                <Calendar className="size-3.5" />
              </Button>
            )}
            {can("patient_encounters") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-purple-500 hover:text-purple-600 hover:bg-purple-50 cursor-pointer"
                title="Patient vitals"
              >
                <UserCheck className="size-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-gray-600 hover:bg-gray-50 cursor-pointer"
              title="Settings"
            >
              <Settings2 className="size-3.5" />
            </Button>
            {can("patient_delete") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                title="Delete patient"
                onClick={() => onDeletePatient(patient.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const selectedClinic = externalClinicFilter ?? clinicFilter
  const filteredPatients = onClinicFilterChange
    ? patients
    : (selectedClinic
      ? patients.filter((p) => p.clinic === selectedClinic)
      : patients)

  const table = useReactTable({
    data: filteredPatients,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  const tableStatusFilter = table.getColumn("status")?.getFilterValue() as string
  const selectedStatus = externalStatusFilter ?? tableStatusFilter

  return (
    <div className="w-full space-y-4">
      {/* Header row: title + Add Patient button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">All Patients</h2>
        <div className="flex items-center sm:justify-end">
          {can("patient_add") && <PatientFormDialog onAddPatient={onAddPatient} />}
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-col md:flex-row md:items-end gap-3 sm:gap-4">
        <div className="flex flex-1 flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px] sm:min-w-[160px] max-w-full sm:max-w-[220px] space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Clinic</Label>
            <Select
              onValueChange={(value) => {
                if (value === "all") {
                  if (onClinicFilterChange) onClinicFilterChange("")
                  else setClinicFilter("")
                } else {
                  if (onClinicFilterChange) onClinicFilterChange(value)
                  else setClinicFilter(value)
                }
              }}
              value={selectedClinic || "all"}
            >
              <SelectTrigger className="cursor-pointer w-full h-9 text-sm">
                <SelectValue placeholder="Select Clinic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clinics</SelectItem>
                {clinicOptions.map((clinic) => (
                  <SelectItem key={clinic} value={clinic}>
                    {clinic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[140px] sm:min-w-[160px] max-w-full sm:max-w-[220px] space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Status</Label>
            <Select
              value={selectedStatus || "all"}
              onValueChange={(value) => {
                const nextValue = value === "all" ? "" : value
                if (onStatusFilterChange) onStatusFilterChange(nextValue)
                else table.getColumn("status")?.setFilterValue(nextValue)
              }}
            >
              <SelectTrigger className="cursor-pointer w-full h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 min-w-full md:min-w-[200px] md:max-w-[280px] space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search Anything..."
              value={externalSearchQuery ?? globalFilter ?? ""}
              onChange={(event) => {
                const value = String(event.target.value)
                if (onSearchQueryChange) onSearchQueryChange(value)
                else setGlobalFilter(value)
              }}
              className="pl-9 h-9 text-sm w-full"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-1 flex-col min-h-0 rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-primary">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-primary/90 border-primary/20">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="bg-primary text-primary-foreground font-semibold text-sm">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {isLoading ? "Loading patients..." : "No patients found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  )
}
