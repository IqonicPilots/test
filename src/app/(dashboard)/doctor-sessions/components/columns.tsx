"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Mail, Pencil, Trash2 } from "lucide-react"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { DoctorSessionDayId } from "@/types/doctor-session.types"
import { DoctorSessionViewDialog } from "./doctor-session-view-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  monday: "Mon",
  tue: "Tue",
  tuesday: "Tue",
  wed: "Wed",
  wednesday: "Wed",
  thu: "Thu",
  thursday: "Thu",
  fri: "Fri",
  friday: "Fri",
  sat: "Sat",
  saturday: "Sat",
  sun: "Sun",
  sunday: "Sun",
}

export interface DoctorSessionTableRow {
  id: string
  doctorId: string
  clinicId: string
  doctorName: string
  doctorEmail: string
  doctorAvatar: string
  doctorAvatarUrl?: string
  clinicName: string
  clinicEmail: string
  clinicAvatar: string
  clinicAvatarUrl?: string
  activeDays: DoctorSessionDayId[]
}

interface GetColumnsHandlers {
  onEditSession: (session: DoctorSessionTableRow) => void
  onDeleteSession: (session: DoctorSessionTableRow) => void
  isBusy?: boolean
  can: (permission: string) => boolean
  role?: string
}

export function getColumns({ onEditSession, onDeleteSession, isBusy = false, can, role }: GetColumnsHandlers): ColumnDef<DoctorSessionTableRow>[] {
  const columns: ColumnDef<DoctorSessionTableRow>[] = [
    {
      id: "doctor",
      accessorFn: (row) => row.doctorName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Doctor" />,
      cell: ({ row }) => {
        const session = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={session.doctorAvatarUrl} alt={session.doctorName} />
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {session.doctorAvatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{session.doctorName}</span>
              {session.doctorEmail && (
                <div className="flex items-start gap-1 min-w-0">
                  <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="break-words text-xs text-muted-foreground whitespace-normal [overflow-wrap:anywhere]">{session.doctorEmail}</span>
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "clinicName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Clinic" className="hidden sm:table-cell" />,
      cell: ({ row }) => {
        const session = row.original
        return (
          <div className="items-center gap-3 hidden sm:flex">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.clinicAvatarUrl} alt={session.clinicName} />
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {session.clinicAvatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{session.clinicName}</span>
              {session.clinicEmail && (
                <div className="flex items-start gap-1 min-w-0">
                  <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="break-words text-xs text-muted-foreground whitespace-normal [overflow-wrap:anywhere]">{session.clinicEmail}</span>
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      id: "activeDays",
      accessorFn: (row) => row.activeDays.join(" "),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Active Days" className="hidden sm:table-cell" />,
      cell: ({ row }) => {
        const activeDays = row.original.activeDays

        if (activeDays.length === 0) {
          return <span className="text-sm text-muted-foreground hidden sm:inline-flex">No active days</span>
        }

        return (
          <div className="flex-wrap gap-1 hidden sm:flex">
            {activeDays.map((day) => (
              <span
                key={day}
                className="inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400"
              >
                {DAY_LABELS[day.toLowerCase()] || day}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {can("doctor_session_view") && (
            <DoctorSessionViewDialog
              session={row.original}
              trigger={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ActionIconButton>
                      <Eye />
                    </ActionIconButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View</p>
                  </TooltipContent>
                </Tooltip>
              }
            />
          )}
          {can("doctor_session_edit") && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionIconButton
                  disabled={isBusy}
                  onClick={() => onEditSession(row.original)}
                >
                  <Pencil />
                </ActionIconButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>
          )}
          {can("doctor_session_delete") && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionIconButton
                  title="Delete session"
                  disabled={isBusy}
                  color="red"
                  className="cursor-pointer text-destructive hover:text-destructive"
                  onClick={() => onDeleteSession(row.original)}
                >
                  <Trash2 />
                </ActionIconButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
    },
  ]

  if (role === "doctor") {
    return columns.filter((col) => col.id !== "doctor")
  }

  return columns
}
