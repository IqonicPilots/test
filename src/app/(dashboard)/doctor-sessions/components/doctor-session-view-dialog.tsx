"use client"

import * as React from "react"
import { GenericViewDialog, ViewFieldConfig, ViewSectionConfig } from "@/components/generic-view-dialog"
import type { DoctorSessionTableRow } from "./columns"
import { User, Building2, CalendarDays, Clock, Mail } from "lucide-react"

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

interface DoctorSessionViewDialogProps {
  session: DoctorSessionTableRow
  trigger?: React.ReactNode
}

const DAY_LABELS: Record<string, string> = {
  mon: "Monday", monday: "Monday",
  tue: "Tuesday", tuesday: "Tuesday",
  wed: "Wednesday", wednesday: "Wednesday",
  thu: "Thursday", thursday: "Thursday",
  fri: "Friday", friday: "Friday",
  sat: "Saturday", saturday: "Saturday",
  sun: "Sunday", sunday: "Sunday",
}

export function DoctorSessionViewDialog({ session, trigger }: DoctorSessionViewDialogProps) {
  const doctorName = typeof session.doctorName === "string" ? session.doctorName.trim() : ""
  const clinicName = typeof session.clinicName === "string" ? session.clinicName.trim() : ""
  const doctorEmail = typeof session.doctorEmail === "string" ? session.doctorEmail.trim() : ""
  const clinicEmail = typeof session.clinicEmail === "string" ? session.clinicEmail.trim() : ""
  const activeDaysText = session.activeDays
    .map((day) => DAY_LABELS[day.toLowerCase()] || day)
    .join(", ")

  const headerFields: ViewFieldConfig[] = [
    {
      label: "Doctor",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <User className="size-4 text-primary" />
          <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{doctorName}</span>
        </div>
      ),
      rawValue: doctorName,
      isVisible: isValidFieldValue(doctorName),
    },
    {
      label: "Clinic",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <Building2 className="size-3.5 text-primary" />
          <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{clinicName}</span>
        </div>
      ),
      className: "lg:text-center",
      rawValue: clinicName,
      isVisible: isValidFieldValue(clinicName),
    },
    {
      label: "Active Days",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <CalendarDays className="size-3.5 text-primary" />
          <span>{session.activeDays.length} day{session.activeDays.length !== 1 ? "s" : ""}</span>
        </div>
      ),
      className: "lg:text-center",
      rawValue: session.activeDays.length,
      isVisible: session.activeDays.length > 0,
    },
    {
      label: "Session Status",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <Clock className="size-3.5 text-green-500" />
          <span className="text-green-500 font-bold">Active</span>
        </div>
      ),
      className: "lg:text-right",
      rawValue: "Active",
    }
  ]

  const sections: ViewSectionConfig[] = [
    {
      title: "Doctor Detail",
      isVisible: isValidFieldValue(doctorName) || isValidFieldValue(doctorEmail),
      items: [
        {
          avatar: {
            src: session.doctorAvatarUrl,
            fallback: session.doctorAvatar
          },
          title: doctorName,
          rawTitle: doctorName,
          info: isValidFieldValue(doctorEmail) ? (
            <div className="flex items-start gap-1 min-w-0">
              <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{doctorEmail}</span>
            </div>
          ) : undefined,
          rawInfo: doctorEmail,
        }
      ]
    },
    {
      title: "Clinic Detail",
      isVisible: isValidFieldValue(clinicName) || isValidFieldValue(clinicEmail),
      items: [
        {
          avatar: {
            src: session.clinicAvatarUrl,
            fallback: session.clinicAvatar
          },
          title: clinicName,
          rawTitle: clinicName,
          info: isValidFieldValue(clinicEmail) ? (
            <div className="flex items-start gap-1 min-w-0">
              <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{clinicEmail}</span>
            </div>
          ) : undefined,
          rawInfo: clinicEmail,
        }
      ]
    },
    {
      title: "Schedule Days",
      isVisible: session.activeDays.length > 0,
      items: [
        {
          title: "",
          rawInfo: activeDaysText,
          info: (
            <div className="flex items-start gap-1 min-w-0">
              <CalendarDays className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{activeDaysText}</span>
            </div>
          ),
        }
      ]
    }
  ]

  return (
    <GenericViewDialog
      title="Doctor Session Details"
      trigger={trigger}
      headerFields={headerFields}
      sections={sections}
      dialogSize="lg"
    />
  )
}
