"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type Row,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table"
import { Eye, Pencil, Plus, Trash2 } from "lucide-react"
import {
  DataTableResetButton,
  DataTableSearch,
} from "@/components/common/data-table-filters"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { ConfirmDialog } from "@/components/confirm-dialog"

export type ReportItemRow = {
  name?: string
  date?: string
  file?: File | string
  _id?: string
}

export type ReportTableRow = ReportItemRow & { __originalIndex: number }

function reportFileLabel(r: ReportItemRow): string {
  if (r.file instanceof File) return r.file.name
  return r.file ? r.file.split("/").pop()?.replace(/^\d+-/, "") || r.file : ""
}

function reportGlobalFilter<T extends ReportTableRow>(
  row: Row<T>,
  _columnId: string,
  filterValue: unknown
): boolean {
  const q = String(filterValue ?? "")
    .toLowerCase()
    .trim()
  if (!q) return true
  const r = row.original
  const name = (r.name ?? "").toLowerCase()
  const file = reportFileLabel(r).toLowerCase()
  return name.includes(q) || file.includes(q)
}

export function ReportCardDataTable({
  reports,
  readOnly,
  pageSize,
  searchPlaceholder,
  emptyMessage,
  filterEmptyMessage,
  onPreviewRow,
  onEditRow,
  onRemoveRow,
  onAddReport,
}: {
  reports: ReportItemRow[]
  readOnly: boolean
  pageSize: number
  searchPlaceholder: string
  emptyMessage: string
  filterEmptyMessage: string
  onPreviewRow: (r: ReportItemRow) => void
  onEditRow: (originalIndex: number) => void
  onRemoveRow: (originalIndex: number, reportId?: string) => void | Promise<void>
  /** Renders an "Add Report" button to the right of View (e.g. patient reports upload). */
  onAddReport?: () => void
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }])
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{
    index: number
    reportId?: string
    name?: string
  } | null>(null)
  const [removing, setRemoving] = useState(false)

  const data = useMemo<ReportTableRow[]>(
    () => reports.map((r, originalIndex) => ({ ...r, __originalIndex: originalIndex })),
    [reports]
  )

  const requestDelete = useCallback((originalIndex: number, r: ReportItemRow) => {
    setPendingDelete({
      index: originalIndex,
      reportId: r._id,
      name: r.name,
    })
    setDeleteConfirmOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return
    setRemoving(true)
    try {
      await Promise.resolve(
        onRemoveRow(pendingDelete.index, pendingDelete.reportId)
      )
      setDeleteConfirmOpen(false)
      setPendingDelete(null)
    } catch {
      // Parent may throw; keep dialog open
    } finally {
      setRemoving(false)
    }
  }, [onRemoveRow, pendingDelete])

  const columns = useMemo<ColumnDef<ReportTableRow>[]>(() => {
    const cols: ColumnDef<ReportTableRow>[] = [
      {
        id: "name",
        accessorKey: "name",
        enableHiding: true,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => (
          <span
            className="block min-w-0 max-w-[10rem] truncate text-sm sm:max-w-[16rem] md:max-w-[20rem]"
            title={row.original.name}
          >
            {row.original.name ?? "—"}
          </span>
        ),
      },
      {
        id: "date",
        accessorFn: (row) => (row.date ? new Date(row.date).getTime() : 0),
        enableHiding: true,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {row.original.date ? new Date(row.original.date).toLocaleDateString() : "—"}
          </span>
        ),
      },
      {
        id: "file",
        accessorFn: (row) => reportFileLabel(row),
        enableHiding: true,
        header: ({ column }) => <DataTableColumnHeader column={column} title="File" />,
        cell: ({ row }) => {
          const r = row.original
          const label =
            r.file instanceof File
              ? r.file.name
              : r.file
                ? r.file.split("/").pop()?.replace(/^\d+-/, "") || r.file
                : "—"
          return (
            <span
              className="block min-w-0 max-w-[10rem] truncate text-sm sm:max-w-[16rem] md:max-w-[20rem]"
              title={label !== "—" ? label : undefined}
            >
              {label}
            </span>
          )
        },
      },
    ]

    if (!readOnly) {
      cols.push({
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        header: () => <span className="text-sm font-medium">Action</span>,
        cell: ({ row }) => {
          const r = row.original
          const originalIndex = r.__originalIndex
          return (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    type="button"
                    onClick={() => onPreviewRow(r)}
                  >
                    <Eye className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Preview</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    type="button"
                    onClick={() => onEditRow(originalIndex)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    type="button"
                    onClick={() => requestDelete(originalIndex, r)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )
        },
      })
    }

    return cols
  }, [readOnly, onPreviewRow, onEditRow, requestDelete])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: reportGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  })

  useEffect(() => {
    table.setPageSize(pageSize)
  }, [pageSize, table])

  const filteredRows = table.getFilteredRowModel().rows
  const colCount = table.getVisibleLeafColumns().length

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <DataTableSearch
            table={table}
            placeholder={searchPlaceholder}
            className="w-full min-w-0 sm:w-[200px] sm:max-w-full lg:w-[280px]"
          />
          <DataTableResetButton
            table={table}
            onReset={() => table.setPageIndex(0)}
          />
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:shrink-0">
          <DataTableViewOptions table={table} />
          {onAddReport && !readOnly ? (
            <Button
              type="button"
              size="sm"
              className="h-8 w-full gap-1 sm:w-auto"
              onClick={onAddReport}
            >
              <Plus className="size-4" />
              Add Report
            </Button>
          ) : null}
        </div>
      </div>

      <div className="w-full min-w-0 max-w-full rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4 py-1">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                  {filterEmptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.length > 0 && filteredRows.length > 0 ? (
        <DataTablePagination table={table} />
      ) : null}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open)
          if (!open) setPendingDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Delete this report?"
        description={
          pendingDelete?.name
            ? `This will permanently remove "${pendingDelete.name}" from this record.   `
            : "This report will be permanently removed. This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={removing}
      />
    </div>
  )
}
