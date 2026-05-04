"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { EncounterTemplateViewDialog } from "./encounter-template-view-dialog"
import type { EncounterTemplate } from "@/types/encounter-template.types"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type EncounterTemplateTableRow = EncounterTemplate

interface ColumnHandlers {
  onEditTemplate: (template: EncounterTemplate) => void
  onDeleteTemplate: (id: string) => void
  onToggleActive: (template: EncounterTemplate, isActive: boolean) => void
  togglingTemplateId: string | null
  can: (permission: string) => boolean
}

export function getColumns({
  onEditTemplate,
  onDeleteTemplate,
  onToggleActive,
  togglingTemplateId,
  can,
}: ColumnHandlers): ColumnDef<EncounterTemplateTableRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Template Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.getValue("name")}</span>
      ),
    },
    {
      id: "problems",
      accessorFn: (row) =>
        (row.problems ?? []).map((p) => p.label).join(", ") || "—",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Problems" className="hidden sm:table-cell" />
      ),
      cell: ({ row }) => (
        <span className="hidden sm:block text-sm text-muted-foreground max-w-[200px] truncate">
          {(row.original.problems ?? []).map((p) => p.label).join(", ") || "—"}
        </span>
      ),
    },
    {
      id: "observations",
      accessorFn: (row) =>
        (row.observations ?? []).map((o) => o.label).join(", ") || "—",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Observations" className="hidden md:table-cell" />
      ),
      cell: ({ row }) => (
        <span className="hidden md:block text-sm text-muted-foreground max-w-[200px] truncate">
          {(row.original.observations ?? [])
            .map((o) => o.label)
            .join(", ") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const template = row.original
        const active = template.isActive !== false
        const busy = togglingTemplateId === template._id
        const canEdit = can("encounter_template_edit")
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={active}
              disabled={!canEdit || busy}
              aria-label={active ? "Deactivate template" : "Activate template"}
              onCheckedChange={(v) => onToggleActive(template, v)}
            />
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const template = row.original
        return (
          <div className="flex items-center gap-1">
            {can("encounter_template_view") && (
              <EncounterTemplateViewDialog
                template={template}
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
            )}
            {can("encounter_template_edit") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionIconButton
                    onClick={() => onEditTemplate(template)}
                  >
                    <Pencil className="size-3.5" />
                  </ActionIconButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
            )}
            {can("encounter_template_delete") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionIconButton
                    color="red"
                    onClick={() => onDeleteTemplate(template._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </ActionIconButton>
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
}
