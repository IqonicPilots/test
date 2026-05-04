"use client"

import { useMemo, useState } from "react"
import { type ColumnDef, type ColumnFiltersState, type SortingState, type VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Search, RefreshCcw, Trash2 } from "lucide-react"
import { useDeleteNotificationTemplate } from "@/hooks/api/use-notification-templates"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableBodySkeleton } from "@/components/dashboard-page-skeleton"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { cn } from "@/lib/utils"
import type { NotificationTemplate, NotificationRecipient } from "@/types/notification-template.types"
import { NotificationTemplateFormDialog } from "./notification-template-form-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function recipientLabel(recipient: NotificationRecipient) {
  const map: Record<NotificationRecipient, string> = {
    clinic: "Clinic",
    doctor: "Doctor",
    patient: "Patient",
    common: "Common",
    receptionist: "Receptionist",
    admin: "Admin",
    clinic_admin: "Clinic Admin",
    newsletter_subscribers: "Newsletter Subscribers",
  }
  return map[recipient] ?? recipient
}

function getRecipientColor(recipient: NotificationRecipient) {
  return "bg-primary/10 text-primary dark:bg-muted dark:text-white border-transparent"
}

function templateTypeLabel(type: NotificationTemplate["type"]) {
  if (type === "custom") return "Custom"
  if (type === "email") return "Email"
  if (type === "sms_whatsapp") return "SMS / WhatsApp"
  return "Push"
}

function serviceTypeLabel(type?: NotificationTemplate["service_type"]) {
  if (type === "email") return "Email"
  if (type === "sms_whatsapp") return "SMS / WhatsApp"
  if (type === "push") return "Push"
  return "—"
}

function targetConditionLabel(condition?: NotificationTemplate["target_condition"]) {
  if (!condition) return "—"
  const map: Record<string, string> = {
    all: "All Users",
    new_user: "New User",
    all_clinic_admin: "All Clinic Admins",
    all_patients: "All Patients",
    all_doctors: "All Doctors",
    new_doctors: "New Doctors",
    new_patients: "New Patients",
    particular_clinic_all_user: "Particular Clinic - All Users",
    particular_clinic_all_doctor: "Particular Clinic - All Doctors",
    particular_clinic_all_receptionist: "Particular Clinic - All Receptionists",
    particular_clinic_all_patient: "Particular Clinic - All Patients",
    particular_clinic_all_admin: "Particular Clinic - All Admins",
    patients_with_pending_bills: "Patients With Pending Bills",
    patients_with_appointments_today: "Patients With Appointments Today",
    birthday_today: "Birthday Today",
  }
  return map[condition] ?? condition
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function NotificationTemplatesTable({
  templates,
  isLoading,
  onToggleStatus,
  headerActions,
  tableMode = "default",
}: {
  templates: NotificationTemplate[]
  isLoading?: boolean
  onToggleStatus: (id: string, nextIsActive: boolean) => void
  headerActions?: React.ReactNode
  tableMode?: "default" | "custom"
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    createdAt: false,
    updatedAt: false,
    type: false,
    service_type: false,
  })
  const [globalFilter, setGlobalFilter] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const columns = useMemo<ColumnDef<NotificationTemplate>[]>(() => {
    const commonColumns: ColumnDef<NotificationTemplate>[] = [
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
          const v = row.original.createdAt
          return <span className="hidden text-muted-foreground">{new Date(v).toLocaleDateString()}</span>
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => {
          const v = row.original.updatedAt
          return <span className="hidden text-muted-foreground">{new Date(v).toLocaleString()}</span>
        },
      },
      {
        accessorKey: "name",
        header: "Templates",
        cell: ({ row }) => {
          const t = row.original
          const subLabel =
            tableMode === "custom" ? serviceTypeLabel(t.service_type) : templateTypeLabel(t.type)
          return (
            <div className="flex flex-col">
              <span className="font-medium text-foreground/90">{t.name}</span>
              {tableMode === "custom" && (
                <span className="text-xs text-muted-foreground">{subLabel}</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "service_type",
        header: "Service Type",
        cell: ({ row }) => {
          const v = row.original.service_type
          return <span className="hidden">{v ?? ""}</span>
        },
      },
    ]

    const customColumns: ColumnDef<NotificationTemplate>[] = [
      {
        accessorKey: "target_condition",
        header: "Target Condition",
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{targetConditionLabel(row.original.target_condition)}</span>
        ),
      },
      {
        accessorKey: "schedule_type",
        header: "Schedule",
        cell: ({ row }) => {
          const t = row.original
          if (t.schedule_type === "multiple") {
            const interval = `${t.interval_value ?? 1} ${t.interval_type ?? "day"}`
            return <span className="text-sm text-foreground">Multiple ({interval})</span>
          }
          return (
            <div className="flex flex-col">
              <span className="text-sm text-foreground">One Time</span>
              {t.send_time && (
                <span className="text-[11px] text-muted-foreground/80 leading-tight">
                  {new Date(t.send_time).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          )
        },
      },
    ]

    const defaultRecipientColumn: ColumnDef<NotificationTemplate> = {
      accessorKey: "recipients",
      header: "Recipients",
      cell: ({ row }) => {
        const recipients = row.original.recipients ?? []
        if (!recipients.length) {
          return <span className="text-sm text-muted-foreground">—</span>
        }
        return (
          <div className="flex flex-wrap gap-1.5">
            {recipients.map((r) => (
              <span
                key={r}
                className={cn(
                  "inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium border transition-colors",
                  getRecipientColor(r)
                )}
              >
                {recipientLabel(r)}
              </span>
            ))}
          </div>
        )
      },
      filterFn: (row, _id, filterValue) => {
        const v = filterValue as string
        if (!v) return true
        const recipients = (row.original.recipients ?? []) as string[]
        return recipients.includes(v)
      },
    }

    return [
      ...commonColumns,
      tableMode === "custom" ? customColumns[0] : defaultRecipientColumn,
      ...(tableMode === "custom" ? [customColumns[1]] : []),
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
          const t = row.original
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={t.isActive}
                onCheckedChange={() => onToggleStatus(t._id, !t.isActive)}
                className="cursor-pointer"
              />
              <span className="text-sm text-muted-foreground"></span>
            </div>
          )
        },
      },
      {

        id: "actions",
        header: "Actions",
        cell: function ActionCell({ row }) {
          const t = row.original
          const deleteMutation = useDeleteNotificationTemplate()

          const handleDelete = (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setDeleteConfirmId(t._id)
          }

          return (
            <div className="flex items-center gap-2">
              <NotificationTemplateFormDialog
                template={t}
                trigger={
                  <Button variant="outline" size="sm" className="h-8 px-2 cursor-pointer text-foreground/90 border border-border hover:text-muted-foreground hover:bg-muted/50">
                    Manage
                  </Button>
                }
              />
              {!t.isSystem && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10 cursor-pointer"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <RefreshCcw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )
        },
      },
    ]
  }, [onToggleStatus, tableMode])

  const table = useReactTable({
    data: templates,
    columns,
    getRowId: (row) => row._id,
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

  const deleteMutation = useDeleteNotificationTemplate()

  const uniqueRecipients = useMemo(() => {
    const set = new Set<string>()
    templates.forEach((t) => (t.recipients ?? []).forEach((r) => set.add(r)))
    return Array.from(set)
  }, [templates])

  const uniqueServiceTypes = useMemo(() => {
    const set = new Set<string>()
    templates.forEach((t) => {
      if (t.service_type) set.add(t.service_type)
    })
    return Array.from(set)
  }, [templates])

  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter !== ""

  return (
    <div className="min-w-0 w-full max-w-full space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full min-w-0 sm:w-[170px] lg:w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(String(e.target.value))}
              className="h-9 cursor-text pl-9 text-sm text-foreground"
            />
          </div>

          {tableMode === "custom" ? (
            <Select
              value={(table.getColumn("service_type")?.getFilterValue() as string) || "all"}
              onValueChange={(v) => {
                if (v === "all") {
                  table.getColumn("service_type")?.setFilterValue("")
                  return
                }
                table.getColumn("service_type")?.setFilterValue(v)
              }}
            >
              <SelectTrigger className="h-9 w-full min-w-0 cursor-pointer text-sm text-foreground sm:w-[170px]">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {uniqueServiceTypes.map((st) => (
                  <SelectItem key={st} value={st}>
                    {serviceTypeLabel(st as NotificationTemplate["service_type"])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select
              value={(table.getColumn("recipients")?.getFilterValue() as string) || "all"}
              onValueChange={(v) => table.getColumn("recipients")?.setFilterValue(v === "all" ? "" : v)}
            >
              <SelectTrigger className="h-9 w-full min-w-0 cursor-pointer text-sm text-foreground sm:w-[170px]">
                <SelectValue placeholder="All Recipients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recipients</SelectItem>
                {uniqueRecipients.map((r) => (
                  <SelectItem key={r} value={r}>
                    {recipientLabel(r as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={
              table.getColumn("isActive")?.getFilterValue() === true
                ? "true"
                : table.getColumn("isActive")?.getFilterValue() === false
                  ? "false"
                  : "all"
            }
            onValueChange={(v) => table.getColumn("isActive")?.setFilterValue(v === "all" ? "" : v === "true")}
          >
            <SelectTrigger className="h-9 w-full min-w-0 cursor-pointer text-sm text-foreground sm:w-[150px]">
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
            className="h-9 w-full cursor-pointer px-3 text-foreground sm:w-auto"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        </div>

        {headerActions ? (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {headerActions}
          </div>
        ) : null}
      </div>

      <div className="min-w-0 max-w-full rounded-md border">
        <Table className="min-w-[680px]">
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
                  No templates found.
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
            deleteMutation.mutate(deleteConfirmId, {
              onSuccess: () => setDeleteConfirmId(null),
            })
          }
        }}
        title="Delete Template?"
        description="This will permanently delete this notification template. This action cannot be reversed."
        isLoading={deleteMutation.isPending}
        confirmText="Delete Template"
      />
    </div>
  )
}

