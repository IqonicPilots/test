"use client"

import { useState } from "react"
import {
  type ColumnDef, type ColumnFiltersState, type SortingState, type VisibilityState,
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import { Search, Pencil, Trash2, RefreshCcw } from "lucide-react"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableBodySkeleton } from "@/components/dashboard-page-skeleton"
import { Switch } from "@/components/ui/switch"
import type { StaticData } from "@/types/listing.types"
import { ListingFormDialog } from "./listing-form-dialog"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ConfirmDialog } from "@/components/confirm-dialog"

interface DataTableProps {
  listings: StaticData[]
  onDeleteListing: (id: string) => void
  onEditListing?: (listing: StaticData) => void
  onToggleStatus: (id: string) => void
  onUpdate?: () => void
  isLoading?: boolean
  isDeleting?: boolean
}

export function DataTable({ listings, onDeleteListing, onEditListing, onToggleStatus, onUpdate, isLoading, isDeleting }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ createdAt: false })
  const [globalFilter, setGlobalFilter] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const getTypeDisplayName = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'specialties': 'Speciality',
      'service_type': 'Service Type',
      'problem': 'Problem',
      'observation': 'Observation',
      'prescription': 'Prescription'
    }
    
    if (typeMap[type]) return typeMap[type]
    
    // Fallback: convert snake_case or lowercase to Capitalized words
    return type
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    const variantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      'specialties': 'outline',
    }
    return variantMap[type] || 'outline'
  }

  const columns: ColumnDef<StaticData>[] = [
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const listing = row.original
        return <span className="font-medium text-muted-foreground hidden">{new Date(listing.createdAt).toLocaleDateString()}</span>
      },
    },
    {
      accessorKey: "label",
      header: "Name",
      cell: ({ row }) => {
        const listing = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground/90">{listing.label}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return (
          <Badge variant={getTypeBadgeVariant(type)} className="text-xs">
            {getTypeDisplayName(type)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const listing = row.original
        return (
          <div className="flex items-center gap-2">
            <Switch 
              checked={listing.isActive} 
              onCheckedChange={() => onToggleStatus(listing._id)} 
              className="cursor-pointer" 
            />
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const listing = row.original
        return (
          <div className="flex items-center gap-1">
            <ListingFormDialog 
              listingToEdit={listing}
              onUpdate={onUpdate}
              trigger={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ActionIconButton>
                      <Pencil />
                    </ActionIconButton>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
              }
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionIconButton 
                  color="red" 
                  onClick={() => setDeleteConfirmId(listing._id)} 
                  className="cursor-pointer text-destructive hover:text-destructive"
                >
                  <Trash2 />
                </ActionIconButton>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: listings,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  })

  const uniqueTypes = Array.from(new Set(listings.map(l => l.type)))

  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter !== ""

  return (
    <div className="min-w-0 w-full max-w-full space-y-4">
      <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-[200px] lg:w-[300px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground" />
            <Input 
              placeholder="Search Anything..." 
              value={globalFilter ?? ""} 
              onChange={(e) => setGlobalFilter(String(e.target.value))} 
              className="pl-9 h-9 text-sm cursor-text text-foreground w-full" 
            />
          </div>
          
          <Select 
            value={(table.getColumn("type")?.getFilterValue() as string) || "all"}
            onValueChange={(v) => table.getColumn("type")?.setFilterValue(v === "all" ? "" : v)}
          >
            <SelectTrigger className="cursor-pointer w-full sm:w-[130px] h-9 text-sm text-foreground">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {getTypeDisplayName(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={table.getColumn("isActive")?.getFilterValue() === true ? "true" : table.getColumn("isActive")?.getFilterValue() === false ? "false" : "all"}
            onValueChange={(v) => table.getColumn("isActive")?.setFilterValue(v === "all" ? "" : v === "true")}
          >
            <SelectTrigger className="cursor-pointer w-full sm:w-[130px] h-9 text-sm text-foreground">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              table.resetColumnFilters()
              setGlobalFilter("")
            }}
            disabled={!isFiltered}
            className="h-9 px-3 cursor-pointer text-foreground w-full sm:w-auto"
          >
            <RefreshCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
        <div className="flex min-w-0 w-full items-center sm:w-auto sm:justify-end">
          <ListingFormDialog onUpdate={onUpdate} />
        </div>
      </div>

      <div className="min-w-0 max-w-full rounded-md border">
        <Table className="min-w-[600px]">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No listing data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            onDeleteListing(deleteConfirmId)
            setDeleteConfirmId(null)
          }
        }}
        title="Delete Listing?"
        description="Are you sure you want to delete this listing? This action cannot be undone."
        isLoading={isDeleting}
        confirmText="Delete"
      />
    </div>
  )
}
