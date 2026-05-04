"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Pencil, Key, Trash2 } from "lucide-react"
import { useState } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"

import { ActionIconButton } from "@/components/ui/action-icon-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Switch } from "@/components/ui/switch"
import type { Receptionist } from "@/types/user.types"
import { ReceptionistViewDialog } from "./receptionist-view-dialog"
import { ResendCredentialsDialog } from "@/components/resend-credentials-dialog"
import { usePermissions } from "@/hooks/use-permissions"
import { useResendCredentials } from "@/hooks/api/use-auth"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export interface ReceptionistTableRow {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar: string
  avatarUrl?: string
  mobile: string
  clinic: string
  clinicEmail: string
  clinicAvatarUrl?: string
  registeredOn: string
  status: string
  sourceReceptionist: Receptionist
}

interface ReceptionistColumnHandlers {
  onDeleteReceptionist: (id: string) => void
  onEditReceptionist: (receptionist: Receptionist) => void
  onToggleStatus: (receptionist: Receptionist, nextStatus: boolean) => void | Promise<void>
  isBusy?: boolean
}

export function getColumns({
  onDeleteReceptionist,
  onEditReceptionist,
  onToggleStatus,
  isBusy = false,
}: ReceptionistColumnHandlers): ColumnDef<ReceptionistTableRow>[] {
  return [
    {
      id: "receptionist",
      accessorFn: (row) => `${row.firstName} ${row.lastName}`.trim(),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Receptionist" />
      ),
      cell: ({ row }) => {
        const receptionist = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={receptionist.avatarUrl}
                alt={`${receptionist.firstName} ${receptionist.lastName}`}
              />
              <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                {receptionist.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">
                {receptionist.firstName} {receptionist.lastName}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {receptionist.email}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "clinic",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Clinic" className="hidden sm:table-cell" />
      ),
      cell: ({ row }) => {
        const receptionist = row.original
        return (
          <div className="items-center gap-3 hidden sm:flex">
            <Avatar className="h-9 w-9">
              <AvatarImage src={receptionist.clinicAvatarUrl} alt={receptionist.clinic} />
              <AvatarFallback className="text-xs font-semibold text-primary">
                {receptionist.clinic.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {receptionist.clinic}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {receptionist.clinicEmail}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "mobile",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone Number" className="hidden md:table-cell" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium hidden md:table-cell">{row.getValue("mobile")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const receptionist = row.original
        return (
          <Switch
            checked={receptionist.status === "Active"}
            disabled={isBusy}
            onCheckedChange={(checked) =>
              onToggleStatus(receptionist.sourceReceptionist, checked)
            }
            className="cursor-pointer"
          />
        )
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const receptionist = row.original
        const [deleteId, setDeleteId] = useState<string | null>(null)
        const { can } = usePermissions()
        const resendCredentialsMutation = useResendCredentials()

        const handleResendCredentials = async () => {
          if (!receptionist.id) {
            throw new Error("Unable to resend credentials: missing user id.")
          }

          await resendCredentialsMutation.mutateAsync({ userId: receptionist.id })
        }

        return (
          <div className="flex items-center gap-1">
            {can("receptionist_view") && (
              <ReceptionistViewDialog
                receptionist={receptionist}
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
            {can("receptionist_edit") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionIconButton
                    disabled={isBusy}
                    onClick={() => onEditReceptionist(receptionist.sourceReceptionist)}
                  >
                    <Pencil />
                  </ActionIconButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
            )}
            {can("receptionist_resend_credential") && (
              <ResendCredentialsDialog
                user={{
                  name: `${receptionist.firstName} ${receptionist.lastName}`,
                  email: receptionist.email || "",
                  role: "Receptionist",
                  avatar: receptionist.avatar,
                }}
                onConfirm={handleResendCredentials}
                trigger={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ActionIconButton>
                        <Key />
                      </ActionIconButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Resend Credentials</p>
                    </TooltipContent>
                  </Tooltip>
                }
              />
            )}
            {can("receptionist_delete") && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ActionIconButton
                      color="red"
                      onClick={() => setDeleteId(receptionist.id)}
                      className="text-destructive hover:text-destructive"
                      disabled={isBusy}
                    >
                      <Trash2 />
                    </ActionIconButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete</p>
                  </TooltipContent>
                </Tooltip>

                <ConfirmDialog
                  title="Delete Receptionist"
                  description={`Are you sure you want to delete ${receptionist.firstName} ${receptionist.lastName}?`}
                  confirmText="Delete"
                  variant="destructive"
                  onConfirm={async () => {
                    await onDeleteReceptionist(receptionist.id)
                    setDeleteId(null)
                  }}
                  open={receptionist.id === deleteId}
                  onOpenChange={(open) => setDeleteId(open ? receptionist.id : null)}
                />
              </>
            )}
          </div>
        )
      },
    },
  ]
}
