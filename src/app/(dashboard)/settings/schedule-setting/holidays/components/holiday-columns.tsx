"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Building2, Pencil, Trash2, User } from "lucide-react"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { Holiday } from "@/services/holiday.service"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type HolidayTableRow = {
  id: string
  name: string
  dates: string
  datesRaw: string[]
  category: string
  targetName: string
  sourceHoliday: Holiday
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatDates(dates: string[]) {
  if (!dates?.length) return "-"
  if (dates.length === 1) return formatDate(dates[0])
  const sorted = [...dates].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )
  return `${formatDate(sorted[0])} – ${formatDate(sorted[sorted.length - 1])}`
}

function getTargetName(holiday: Holiday) {
  const t = holiday.target
  if (!t) return "—"
  if (t.name) return t.name
  if (t.firstName || t.lastName) {
    return [t.firstName, t.lastName].filter(Boolean).join(" ")
  }
  return "—"
}

interface HolidayColumnHandlers {
  onEdit: (holiday: Holiday) => void
  onDelete: (holiday: Holiday) => void
}

export function getHolidayColumns({
  onEdit,
  onDelete,
}: HolidayColumnHandlers): ColumnDef<HolidayTableRow>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Holiday For" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
            {row.original.category === "clinic" ? <Building2 className="size-4 text-primary" /> : <User className="size-4 text-primary" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-foreground"> {row.original.category === "doctor" ? "Dr. " : ""} {row.original.name}</span>

          </div>
        </div>
      ),
    },
    {
      accessorKey: "dates",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {row.getValue("dates")}
        </span>
      ),
      filterFn: (row, id, value) => {
        const datesRaw = row.original.datesRaw as string[]
        if (!datesRaw?.length || !value || (!value.from && !value.to))
          return true

        const from = value.from ? new Date(value.from) : null
        const to = value.to ? new Date(value.to) : null
        if (from) from.setHours(0, 0, 0, 0)
        if (to) to.setHours(23, 59, 59, 999)

        return datesRaw.some((d) => {
          const date = new Date(d)
          date.setHours(0, 0, 0, 0)
          if (from && to) return date >= from && date <= to
          if (from) return date >= from
          if (to) return date <= to
          return true
        })
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const holiday = row.original.sourceHoliday
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionIconButton
                  onClick={() => onEdit(holiday)}
                >
                  <Pencil />
                </ActionIconButton>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionIconButton
                  color="red"
                  onClick={() => onDelete(holiday)}
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
}

export function holidayToTableRow(h: Holiday): HolidayTableRow {
  const target = typeof h.target === "object" ? h.target : null
  return {
    id: h._id,
    name: h.description || (target ? getTargetName(h) : "Holiday"),
    dates: formatDates(h.holiday_dates || []),
    datesRaw: h.holiday_dates || [],
    category: h.category || "",
    targetName: getTargetName(h),
    sourceHoliday: h,
  }
}
