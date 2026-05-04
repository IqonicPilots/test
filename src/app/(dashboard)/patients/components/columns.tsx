"use client"

import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Activity, Calendar, Eye, FileText, Key, Trash2, Pencil, Mail } from "lucide-react"
import { useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Switch } from "@/components/ui/switch"
import type { Patient } from "@/types/user.types"
import { PatientReportsDialog } from "./patient-reports-dialog"
import { PatientViewDialog } from "./patient-view-dialog"
import { ResendCredentialsDialog } from "@/components/resend-credentials-dialog"
import { usePermissions } from "@/hooks/use-permissions"
import { useResendCredentials } from "@/hooks/api/use-auth"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export type PatientTableRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar: string
  avatarUrl?: string
  mobile: string
  gender: string
  dateOfBirth: string
  bloodGroup?: string
  registeredOn: string
  status: string
  sourcePatient: Patient
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

interface PatientColumnHandlers {
  onEditPatient: (patient: Patient) => void
  onDeletePatient: (patient: Patient) => void | Promise<void>
  onToggleStatus: (patient: Patient, nextStatus: boolean) => void | Promise<void>
  isBusy?: boolean
  can: (permission: string) => boolean
}

export function getColumns({
  onEditPatient,
  onDeletePatient,
  onToggleStatus,
  isBusy = false,
  can,
}: PatientColumnHandlers): ColumnDef<PatientTableRow>[] {
  return [
    {
      id: "patient",
      accessorFn: (row) =>
        `${row.firstName} ${row.lastName} ${row.email} ${row.mobile}`.toLowerCase(),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Patient" />
      ),
      cell: ({ row }) => {
        const patient = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={patient.avatarUrl}
                alt={`${patient.firstName} ${patient.lastName}`}
              />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {patient.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{patient.firstName} {patient.lastName}</span>
              {patient.email && (
                <div className="flex items-start gap-1 min-w-0">
                  <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="break-words text-xs text-muted-foreground whitespace-normal [overflow-wrap:anywhere]">{patient.email}</span>
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "mobile",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Phone Number"
          className="hidden sm:table-cell"
        />
      ),
      cell: ({ row }) => (
        <div className="hidden sm:table-cell">
          {row.getValue("mobile")}
        </div>
      ),
    },
    {
      accessorKey: "registeredOn",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Registered On"
          className="hidden lg:table-cell"
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground hidden lg:table-cell">
          {formatDate(row.getValue("registeredOn"))}
        </span>
      ),
      filterFn: (row, id, value) => {
        const val = row.getValue(id) as string
        if (!val || !value || (!value.from && !value.to)) return true

        const date = new Date(val)
        const from = value.from ? new Date(value.from) : null
        const to = value.to ? new Date(value.to) : null

        // Reset hours for comparison
        date.setHours(0, 0, 0, 0)
        if (from) from.setHours(0, 0, 0, 0)
        if (to) to.setHours(23, 59, 59, 999)

        if (from && to) {
          return date >= from && date <= to
        }
        if (from) {
          return date >= from
        }
        if (to) {
          return date <= to
        }
        return true
      },
    },

    {
      accessorKey: "status",
      header: () => (
        <div className="hidden sm:table-cell">Status</div>
      ),
      cell: ({ row }) => {
        const patient = row.original
        return (
          <div className="hidden sm:items-center sm:table-cell">
            <Switch
              checked={patient.status === "Active"}
              disabled={isBusy || !can("patient_edit")}
              onCheckedChange={(checked) =>
                onToggleStatus(patient.sourcePatient, checked)
              }
              className="cursor-pointer"
            />
          </div>
        )
      },
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true
        return row.getValue(id) === value
      },
    },

    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Action" className="pl-4" />
      ),
      cell: function ActionCell({ row }) {
        const patient = row.original.sourcePatient
        const router = useRouter()
        const [deleteId, setDeleteId] = useState<string | null>(null)
        const { can } = usePermissions()
        const resendCredentialsMutation = useResendCredentials()

        const handleViewEncounters = () => {
          router.push(`/encounters?patientId=${patient._id}`)
        }

        const handleResendCredentials = async () => {
          if (!patient._id) {
            throw new Error("Unable to resend credentials: missing user id.")
          }

          await resendCredentialsMutation.mutateAsync({ userId: patient._id })
        }

        const handleViewAppointments = () => {
          router.push(`/appointments?patientId=${patient._id}`)
        }

        return (
          <div className="flex items-center gap-1.5 pl-4">
            {can("patient_view") && (
              <PatientViewDialog
                patient={patient}
                trigger={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ActionIconButton>
                        <Eye className="size-4" />
                      </ActionIconButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View</p>
                    </TooltipContent>
                  </Tooltip>
                }
              />
            )}

            {can("patient_edit") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionIconButton onClick={() => onEditPatient(patient)}>
                    <Pencil className="size-4" />
                  </ActionIconButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
            )}

            {can("patient_medical_reports") && (
              <PatientReportsDialog
                patient={patient}
                trigger={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ActionIconButton>
                        <FileText className="size-4" />
                      </ActionIconButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Medical Reports</p>
                    </TooltipContent>
                  </Tooltip>
                }
              />
            )}

            {can("patient_appointment") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionIconButton onClick={handleViewAppointments}>
                    <Calendar className="size-4" />
                  </ActionIconButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Appointments</p>
                </TooltipContent>
              </Tooltip>
            )}

            {can("patient_encounters") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionIconButton onClick={handleViewEncounters}>
                    <Activity className="size-4" />
                  </ActionIconButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Encounters</p>
                </TooltipContent>
              </Tooltip>
            )}

            {can("patient_resend_credential") && (
              <ResendCredentialsDialog
                user={{
                  name: `${patient.firstName} ${patient.lastName}`,
                  email: patient.email || "",
                  role: "Patient",
                  avatar: row.original.avatar
                }}
                onConfirm={handleResendCredentials}
                trigger={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ActionIconButton>
                        <Key className="size-4" />
                      </ActionIconButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Resend Credentials</p>
                    </TooltipContent>
                  </Tooltip>
                }
              />
            )}

            {can("patient_delete") && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ActionIconButton
                      color="red"
                      onClick={() => setDeleteId(patient._id)}
                      className="text-destructive hover:text-destructive"
                      disabled={isBusy}
                    >
                      <Trash2 className="size-4" />
                    </ActionIconButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete</p>
                  </TooltipContent>
                </Tooltip>

                <ConfirmDialog
                  title="Delete Patient"
                  description={`Are you sure you want to delete ${patient.firstName} ${patient.lastName}?`}
                  confirmText="Delete"
                  variant="destructive"
                  onConfirm={async () => {
                    await onDeletePatient(patient)
                    setDeleteId(null)
                  }}
                  open={patient._id === deleteId}
                  onOpenChange={(open) => setDeleteId(open ? patient._id : null)}
                />
              </>
            )}
          </div>
        )
      },
    },
  ]
}
