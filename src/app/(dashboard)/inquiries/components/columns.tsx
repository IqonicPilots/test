"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import { Eye, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { usePermissions } from "@/hooks/use-permissions"
import { InquiryViewDialog } from "./inquiry-view-dialog"
import type { InquiryRecord } from "@/types/inquiry.types"

const getText = (value: string | null | undefined) => {
  const normalized = value?.trim()
  return normalized ? normalized : "-"
}

const getTypeLabel = (type: InquiryRecord["type"]) => {
  return type === "inquiry" ? "Inquiry Form" : "Newsletter"
}

const getTypeBadgeClass = (type: InquiryRecord["type"]) => {
  if (type === "inquiry") {
    return "border border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400"
  }

  return "border border-blue-400 bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-400"
}

interface InquiryColumnHandlers {
  onDeleteInquiry: (record: InquiryRecord) => void | Promise<void>
  isDeleting?: boolean
}

export function getColumns({
  onDeleteInquiry,
  isDeleting = false,
}: InquiryColumnHandlers): ColumnDef<InquiryRecord>[] {
  return [
    {
      accessorKey: "fullName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span className="font-medium">{getText(row.original.fullName)}</span>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => <span>{getText(row.original.email)}</span>,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Phone Number" />,
      cell: ({ row }) => <span>{getText(row.original.phone)}</span>,
    },
    {
      accessorKey: "clinicName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Clinic Name" />,
      cell: ({ row }) => <span>{getText(row.original.clinicName)}</span>,
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const type = row.original.type
        return (
          <Badge variant="outline" className={getTypeBadgeClass(type)}>
            {getTypeLabel(type)}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <InquiryActionCell
          record={row.original}
          onDeleteInquiry={onDeleteInquiry}
          isDeleting={isDeleting}
        />
      ),
    },
  ]
}

function InquiryActionCell({
  record,
  onDeleteInquiry,
  isDeleting,
}: {
  record: InquiryRecord
  onDeleteInquiry: (record: InquiryRecord) => void | Promise<void>
  isDeleting: boolean
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { role } = usePermissions()
  const canDelete = role === "admin"
  const deleteTitle = record.type === "newsletter" ? "Delete Subscriber?" : "Delete Inquiry?"
  const deleteDescription =
    record.type === "newsletter"
      ? "Are you sure you want to permanently delete this newsletter subscriber?"
      : "Are you sure you want to permanently delete this inquiry?"

  const handleDelete = async () => {
    await onDeleteInquiry(record)
    setShowDeleteDialog(false)
  }

  return (
    <div className="flex items-center gap-1">
      <InquiryViewDialog
        inquiry={record}
        trigger={
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionIconButton>
                <Eye className="size-3.5" />
              </ActionIconButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>View</p>
            </TooltipContent>
          </Tooltip>
        }
      />

      {canDelete ? (
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title={deleteTitle}
          description={deleteDescription}
          onConfirm={handleDelete}
          variant="destructive"
          confirmText="Delete"
          isLoading={isDeleting}
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionIconButton
                  color="red"
                  title="Delete"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
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
      ) : null}
    </div>
  )
}
