"use client"

import * as React from "react"
import { GenericViewDialog, ViewFieldConfig, ViewSectionConfig } from "@/components/generic-view-dialog"
import type { Encounter } from "@/types/encounter.types"
import { Mail, Calendar, User, ShieldCheck } from "lucide-react"

const isValidFieldValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, " ").trim()
    if (!normalized) return false
    const lower = normalized.toLowerCase()
    return lower !== "n/a" && lower !== "na" && lower !== "-" && lower !== "null" && lower !== "undefined"
  }
  if (typeof value === "number") return Number.isFinite(value)
  if (typeof value === "boolean") return true
  if (Array.isArray(value)) return value.some((entry) => isValidFieldValue(entry))
  if (value instanceof Date) return !Number.isNaN(value.getTime())
  return true
}

const toValidText = (value: unknown): string => {
  if (!isValidFieldValue(value)) return ""
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim()
  return String(value)
}

const joinValidValues = (values: unknown[], separator = ", "): string =>
  values.map((value) => toValidText(value)).filter((value) => value.length > 0).join(separator)

interface EncounterViewDialogProps {
  encounter: Encounter
  trigger?: React.ReactNode
}

export function EncounterViewDialog({ encounter, trigger }: EncounterViewDialogProps) {
  const getInitials = (firstName?: string, lastName?: string) => {
    const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.trim()
    return initials ? initials.toUpperCase() : "U"
  }

  const toDisplayText = (value: unknown): string => {
    if (typeof value === "string") return value.trim()
    if (typeof value === "number" || typeof value === "boolean") return String(value)
    return ""
  }

  const toTitleCase = (value: string): string => {
    return value
      .split(" ")
      .filter(Boolean)
      .map((word) => {
        const lower = word.toLowerCase()
        return lower.charAt(0).toUpperCase() + lower.slice(1)
      })
      .join(" ")
  }

  const prettifyText = (value: string): string => {
    const normalized = value.trim()
    if (!normalized) return ""

    const [rawLabel, ...rest] = normalized.split(":")
    const hasValue = rest.length > 0
    const label = rawLabel.replace(/_/g, " ").replace(/\s+/g, " ").trim()
    const prettyLabel = toTitleCase(label)

    if (!hasValue) return prettyLabel

    const val = rest.join(":").replace(/_/g, " ").replace(/\s+/g, " ").trim()
    const prettyVal = val.replace(/mg\/dl/gi, "mg/dL")
    return `${prettyLabel}: ${prettyVal}`
  }

  const objectToText = (item: Record<string, unknown>, preferredKeys: string[]): string => {
    for (const key of preferredKeys) {
      const text = toDisplayText(item[key])
      if (text) return text
    }

    const ignoredKeys = new Set([
      "_id",
      "id",
      "__v",
      "createdAt",
      "updatedAt",
      "deletedAt",
    ])

    const fallbackParts = Object.entries(item)
      .filter(([key]) => !ignoredKeys.has(key))
      .map(([, val]) => toDisplayText(val))
      .filter(Boolean)

    return fallbackParts.join(" - ")
  }

  const normalizeEntry = (item: unknown, preferredKeys: string[]): string => {
    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
      return toDisplayText(item)
    }
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return objectToText(item as Record<string, unknown>, preferredKeys)
    }
    return ""
  }

  const toDisplayList = (items: unknown[] | undefined, preferredKeys: string[]): string[] => {
    if (!items || items.length === 0) return []
    return items
      .map((item) => normalizeEntry(item, preferredKeys))
      .map((text) => prettifyText(text))
      .map((text) => text.trim())
      .filter(Boolean)
  }

  const observationList = toDisplayList(encounter.observations, [
    "value",
    "observation",
    "name",
    "label",
    "title",
    "description",
    "note",
    "text",
  ])

  const problemList = toDisplayList(encounter.problems, [
    "problem",
    "name",
    "title",
    "value",
    "description",
    "text",
    "note",
    "diagnosis",
  ])

  const noteList = toDisplayList(encounter.notes, [
    "note",
    "text",
    "description",
    "value",
    "title",
    "name",
  ])
  
  const status = typeof (encounter.encounter_status || encounter.status) === "string"
    ? String(encounter.encounter_status || encounter.status).trim()
    : ""
  const isActive = status.toLowerCase() === "active"
  const encounterDate = encounter.encounterDate ? new Date(encounter.encounterDate) : null
  const encounterDateText = encounterDate && !Number.isNaN(encounterDate.getTime())
    ? encounterDate.toLocaleDateString()
    : ""

  const patientName = joinValidValues(
    [encounter.patient?.fullName, encounter.patient?.firstName, encounter.patient?.lastName],
    " "
  )
  const patientEmail = typeof encounter.patient?.email === "string" ? encounter.patient.email.trim() : ""
  const doctorName = joinValidValues(
    [(encounter.doctor as any)?.fullName, encounter.doctor?.firstName, encounter.doctor?.lastName],
    " "
  )
  const doctorEmail = typeof (encounter.doctor as any)?.email === "string" ? (encounter.doctor as any).email.trim() : ""
  const clinicName = typeof encounter.clinic?.name === "string" ? encounter.clinic.name.trim() : ""
  const clinicEmail = typeof encounter.clinic?.email === "string" ? encounter.clinic.email.trim() : ""

  const addressObj = encounter.clinic?.address
  const addressParts = addressObj
    ? [addressObj.street, addressObj.city, addressObj.state, addressObj.country, addressObj.postalCode]
    : []

  const headerFields: ViewFieldConfig[] = [
    {
      label: "Encounter Date",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <Calendar className="size-3.5 text-primary" />
          <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{encounterDateText}</span>
        </div>
      ),
      rawValue: encounterDateText,
      isVisible: isValidFieldValue(encounterDateText),
    },
    {
      label: "Status",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <ShieldCheck className={`size-3.5 ${isActive ? "text-green-500" : "text-red-500"}`} />
          <span className={isActive ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
            {status}
          </span>
        </div>
      ),
      className: "lg:text-right",
      rawValue: status,
      isVisible: isValidFieldValue(status),
    }
  ]

  const sections: ViewSectionConfig[] = [
    {
      title: "Patient Details",
      isVisible: isValidFieldValue(patientName) || isValidFieldValue(patientEmail),
      items: [
        {
          title: patientName,
          rawTitle: patientName,
          avatar: {
            src: (encounter.patient as any)?.meta?.profilePicture || (encounter.patient as any)?.meta?.avatar || (encounter.patient as any)?.profilePicture || (encounter.patient as any)?.avatar,
            fallback: getInitials(encounter.patient?.firstName, encounter.patient?.lastName)
          },
          info: isValidFieldValue(patientEmail) ? (
            <div className="flex items-start gap-1.5 mt-1 min-w-0">
              <User className="size-3 text-muted-foreground shrink-0" />
              <span className="text-sm min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]" title={patientEmail}>
                {patientEmail}
              </span>
            </div>
          ) : undefined,
          rawInfo: patientEmail,
        }
      ]
    },
    {
      title: "Doctor Details",
      isVisible: isValidFieldValue(doctorName) || isValidFieldValue(doctorEmail),
      items: [
        {
          title: doctorName,
          rawTitle: doctorName,
          avatar: {
            src: (encounter.doctor as any)?.meta?.profilePicture || (encounter.doctor as any)?.meta?.avatar || (encounter.doctor as any)?.profilePicture || (encounter.doctor as any)?.avatar,
            fallback: getInitials(encounter.doctor?.firstName, encounter.doctor?.lastName)
          },
          info: isValidFieldValue(doctorEmail) ? (
            <div className="flex flex-col gap-1 mt-1 min-w-0">
              <div className="flex items-start gap-1.5 min-w-0">
                <User className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-sm min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]" title={doctorEmail}>
                  {doctorEmail}
                </span>
              </div>
            </div>
          ) : undefined,
          rawInfo: doctorEmail,
        }
      ]
    },
    {
      title: "Clinic & Location",
      isVisible: isValidFieldValue(clinicName) || isValidFieldValue(clinicEmail),
      items: [
        {
          title: clinicName,
          rawTitle: clinicName,
          avatar: {
            src: (encounter.clinic as any)?.cliniclogo || (encounter.clinic as any)?.logo,
            fallback: (encounter.clinic?.name || "C").substring(0, 2).toUpperCase()
          },
          info: isValidFieldValue(clinicEmail) ? (
            <div className="flex flex-col gap-1 mt-1 min-w-0">
              <div className="flex items-start gap-1.5 min-w-0">
                <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">
                  {clinicEmail}
                </span>
              </div>
            </div>
          ) : undefined,
          rawInfo: clinicEmail,
        }
      ]
    },
    {
      title: "Problems",
      isVisible: problemList.length > 0,
      items: [
        {
          title: "",
          rawInfo: problemList.join(" | "),
          info: (
            <div className="min-w-0">
              <ol className="list-disc pl-5 text-sm leading-tight min-w-0 space-y-2">
                {problemList.map((problem, index) => (
                  <li key={`${problem}-${index}`} className="break-words whitespace-pre-wrap">
                    {problem}
                  </li>
                ))}
              </ol>
            </div>
          ),
        },
      ]
    },
    {
      title: "Observations",
      isVisible: observationList.length > 0,
      items: [
        {
          title: "",
          rawInfo: observationList.join(" | "),
          info: (
            <div className="min-w-0">
              <ol className="list-disc pl-5 text-sm leading-tight min-w-0 space-y-2">
                {observationList.map((observation, index) => (
                  <li key={`${observation}-${index}`} className="break-words whitespace-pre-wrap">
                    {observation}
                  </li>
                ))}
              </ol>
            </div>
          ),
        },
      ]
    },
    {  
      title: "Notes",
      isVisible: noteList.length > 0,
      items: [
        {
          title: "",
          rawInfo: noteList.join(" | "),
          info: (
            <div className="min-w-0">
              <ol className="list-disc pl-5 text-sm leading-tight min-w-0 space-y-2">
                {noteList.map((note, index) => (
                  <li key={`${note}-${index}`} className="break-words whitespace-pre-wrap">
                    {note}
                  </li>
                ))}
              </ol>
            </div>
          ),
        }
      ]
    }
  ]

  return (
    <GenericViewDialog
      title="Encounter Details"
      trigger={trigger}
      headerFields={headerFields}
      sections={sections}
      dialogSize="lg"
    />
  )
}
