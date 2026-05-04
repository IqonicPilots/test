"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Calendar } from "lucide-react"
import {
  GenericViewDialog,
  type ViewFieldConfig,
  type ViewSectionConfig,
} from "@/components/generic-view-dialog"
import type { EncounterTemplate } from "@/types/encounter-template.types"
import { ActionIconButton } from "@/components/ui/action-icon-button"

interface EncounterTemplateViewDialogProps {
  template: EncounterTemplate
  trigger?: React.ReactNode
}

function getMedicineLabel(p: { name?: string | null }): string {
  if (!p.name) return "—"
  if (typeof p.name === "object" && p.name !== null && "label" in (p.name as object)) {
    return (p.name as { label?: string }).label ?? "—"
  }
  return String(p.name)
}

export function EncounterTemplateViewDialog({
  template,
  trigger,
}: EncounterTemplateViewDialogProps) {
  const problems = template.problems ?? []
  const observations = template.observations ?? []
  const notes = template.notes ?? []
  const prescriptions = template.prescriptions ?? []

  const triggerNode = trigger ?? (
    <ActionIconButton title="View template">
      <ClipboardList className="size-4" />
    </ActionIconButton>
  )

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const headerFields: ViewFieldConfig[] = []

  headerFields.push({
    label: "Created At",
    value: (
      <div className="flex items-center gap-2 lg:justify-center">
        <Calendar className="size-3.5 text-primary" />
        <span className="capitalize">{formatDate(template.createdAt)}</span>
      </div>
    ),
  })

  if (template.isActive !== undefined) {
    headerFields.push({
      label: "Status",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <Badge variant={template.isActive ? "default" : "secondary"}>
            {template.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
      className: "lg:text-right",
    })
  }

  const sections: ViewSectionConfig[] = []

  if (problems.length > 0) {
    sections.push({
      title: "Problems",
      items: [
        {
          title: "",
          info: (
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {problems.map((p, i) => (
                <li key={i}>{p.label}</li>
              ))}
            </ul>
          ),
        },
      ],
    })
  }

  if (observations.length > 0) {
    sections.push({
      title: "Observations",
      items: [
        {
          title: "",
          info: (
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {observations.map((o, i) => (
                <li key={i}>{o.label}</li>
              ))}
            </ul>
          ),
        },
      ],
    })
  }

  if (notes.length > 0) {
    sections.push({
      title: "Notes",
      items: [
        {
          title: "",
          info: (
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {notes.map((n, i) => (
                <li key={i}>{n.note}</li>
              ))}
            </ul>
          ),
        },
      ],
    })
  }

  if (prescriptions.length > 0) {
    sections.push({
      title: "Prescriptions",
      items: [
        {
          title: "",
          info: (
            <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
              {prescriptions.map((p, i) => (
                <li key={i}>
                  {getMedicineLabel(p)} <br/> {p.frequency ? `${p.frequency} | ` : ""}{p.duration ? `${p.duration} | ` : ""}{p.instruction ? `${p.instruction}` : ""}
                </li>
              ))}
            </ul>
          ),
        },
      ],
    })
  }

  if (
    problems.length === 0 &&
    observations.length === 0 &&
    notes.length === 0 &&
    prescriptions.length === 0
  ) {
    sections.push({
      title: "Details",
      items: [
        {
          title: "",
          info: (
            <p className="text-sm text-muted-foreground">
              No details configured for this template.
            </p>
          ),
        },
      ],
    })
  }

  return (
    <GenericViewDialog
      title={template.name}
      trigger={triggerNode}
      headerFields={headerFields}
      sections={sections}
      dialogSize="lg"
    />
  )
}
