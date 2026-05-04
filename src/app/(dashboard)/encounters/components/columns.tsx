"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Trash2, Activity, Pencil } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { useRouter } from "next/navigation"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { EncounterEditDialog } from "./encounter-edit-dialog"
import type { Encounter } from "@/types/encounter.types"
import { usePermissions } from "@/hooks/use-permissions"
import { useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

// Utility to generate initials
const generateAvatar = (name?: string) => {
  if (!name) return "U"
  const words = name.trim().split(" ")
  return words.length >= 2
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

interface ColumnHandlers {
  onDeleteEncounter: (id: string) => void
  onUpdateEncounter: (id: string, data: any) => void
  onToggleStatus: (id: string, nextStatus: boolean) => void
  role?: string
}

export function getColumns({
  onDeleteEncounter,
  onUpdateEncounter,
  onToggleStatus,
  role
}: ColumnHandlers): ColumnDef<Encounter>[] {
  const columns: ColumnDef<Encounter>[] = [
    {
      id: "patient",
      accessorKey: "patient.fullName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Patient" />
      ),
      cell: ({ row }) => {
        const patient = row.original.patient
        if (!patient) return <span className="text-muted-foreground">-</span>

        return (
          <div className="flex items-center gap-3 min-w-[180px]">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={(patient as any).meta?.profilePicture || (patient as any).meta?.avatar || (patient as any).profilePicture || (patient as any).avatar} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {generateAvatar(patient.fullName || patient.firstName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{patient.fullName || `${patient.firstName} ${patient.lastName}`}</span>
              <span className="text-xs text-muted-foreground">{patient.email || "No email"}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: "doctor",
      accessorKey: "doctor.fullName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Doctor" className="hidden md:table-cell" />
      ),
      cell: ({ row }) => {
        const doctor = row.original.doctor
        if (!doctor) return <span className="hidden md:table-cell text-muted-foreground">-</span>

        return (
          <div className="hidden md:flex items-center gap-3 min-w-[160px]">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={(doctor as any).meta?.profilePicture || (doctor as any).meta?.avatar || (doctor as any).profilePicture || (doctor as any).avatar} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {generateAvatar(doctor.fullName || doctor.firstName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{doctor.fullName || `${doctor.firstName} ${doctor.lastName}`}</span>
              <span className="text-xs text-muted-foreground">{(doctor as any).email || "No email"}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: "clinic",
      accessorKey: "clinic.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Clinic" className="hidden lg:table-cell" />
      ),
      cell: ({ row }) => {
        const clinic = row.original.clinic
        if (!clinic) return <span className="hidden lg:table-cell text-muted-foreground">-</span>

        return (
          <div className="hidden lg:flex items-center gap-3 min-w-[140px]">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={(clinic as any).cliniclogo || (clinic as any).logo} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {generateAvatar(clinic.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{clinic.name}</span>
              <span className="text-xs text-muted-foreground">{(clinic as any).email || "No email"}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "encounterDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" className="hidden sm:table-cell" />
      ),
      cell: ({ row }) => (
        <span className="hidden sm:inline-block text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(row.getValue("encounterDate"))}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const encounter = row.original
        const status = encounter.encounter_status || encounter.status
        const isActive = status?.toLowerCase() === "active"
        const displayLabel = isActive ? "Active" : "Closed"
        return (
          <StatusBadge status={displayLabel} />
        )
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const enc = row.original
        const status = enc.encounter_status || enc.status
        const isActive = status?.toLowerCase() === "active"

        // Build navigate URL (only encounterId – full data is fetched on the page)
        const buildEncounterUrl = () => {
          const params = new URLSearchParams()
          if (enc._id) params.set("encounterId", enc._id)
          return `/encounters/add?${params.toString()}`
        }

        // We need a component to call useRouter inside cell renderer
        return (
          <EncounterActionCell
            enc={enc}
            isActive={isActive}
            buildEncounterUrl={buildEncounterUrl}
            onDeleteEncounter={onDeleteEncounter}
            onUpdateEncounter={onUpdateEncounter}
            onToggleStatus={onToggleStatus}
          />
        )
      },
    },
  ]

  if (role === "doctor") {
    return columns.filter((col) => col.id !== "doctor")
  }

  if (role === "patient") {
    return columns.filter((col) => col.id !== "patient")
  }

  return columns
}

// Inner component so we can use React hooks inside the cell
function EncounterActionCell({
  enc,
  isActive,
  buildEncounterUrl,
  onDeleteEncounter,
  onUpdateEncounter,
  onToggleStatus,
}: {
  enc: any
  isActive: boolean
  buildEncounterUrl: () => string
  onDeleteEncounter: (id: string) => void
  onUpdateEncounter: (id: string, data: any) => void
  onToggleStatus: (id: string, next: boolean) => void
}) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { role, can } = usePermissions()
  const isPatient = role === "patient"

  const canEdit = can("encounter_edit")
  const canView = can("encounter_dashboard")
  const canDelete = can("encounter_delete")
  const isClosed = (enc.encounter_status || enc.status)?.toLowerCase() === "closed"

  const handleDelete = () => {
    onDeleteEncounter(enc._id)
    setShowDeleteDialog(false)
  }

  return (
    <div className="flex items-center gap-1">
      {!isPatient && canEdit && !isClosed && (
        <EncounterEditDialog
          encounter={enc}
          onUpdate={onUpdateEncounter}
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionIconButton>
                  <Pencil className="size-3.5" />
                </ActionIconButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>
          }
        />
      )}
      {canView && (
        <Tooltip>
          <TooltipTrigger asChild>
            <ActionIconButton onClick={() => router.push(buildEncounterUrl())}>
              <Activity className="size-3.5" />
            </ActionIconButton>
          </TooltipTrigger>
          <TooltipContent>
            <p>View</p>
          </TooltipContent>
        </Tooltip>
      )}
      {!isPatient && canDelete && !isClosed && (
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Encounter?"
          description="Are you sure you want to permanently delete this encounter? This will also delete any associated bills and reactivate the appointment for a new encounter."
          onConfirm={handleDelete}
          variant="destructive"
          confirmText="Delete"
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionIconButton
                  color="red"
                  title="Delete encounter"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="size-3.5" />
                </ActionIconButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
          }
        />
      )}
    </div>
  )
}
