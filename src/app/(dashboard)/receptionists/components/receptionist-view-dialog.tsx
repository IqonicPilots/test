"use client"

import * as React from "react"
import { GenericViewDialog, ViewFieldConfig, ViewSectionConfig } from "@/components/generic-view-dialog"
import { Phone, ShieldCheck, Mail, MapPin, Calendar } from "lucide-react"
import type { ReceptionistTableRow } from "./columns"

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

interface ReceptionistViewDialogProps {
  receptionist: ReceptionistTableRow
  trigger?: React.ReactNode
}

export function ReceptionistViewDialog({ receptionist, trigger }: ReceptionistViewDialogProps) {
  const getInitials = (...parts: Array<string | undefined>) => {
    const value = joinValidValues(parts, " ")
    if (!value) return "RC"
    return value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0])
      .join("")
      .toUpperCase()
  }

  const formatDate = (dateStr?: string) => {
    if (!isValidFieldValue(dateStr)) return ""
    const parsedDate = new Date(String(dateStr))
    if (Number.isNaN(parsedDate.getTime())) return ""

    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const source = receptionist.sourceReceptionist

  const clinicMeta = source?.meta?.clinics?.[0]
  const clinicData =
    clinicMeta && typeof clinicMeta === "object"
      ? (clinicMeta as {
          name?: string
          email?: string
          cliniclogo?: string
          mobile?: string
          address?: {
            street?: string
            city?: string
            state?: string
            country?: string
            postalCode?: string
          }
        })
      : null

  const address = source?.meta?.address
  const addressObject = typeof address === "object" && address !== null ? address : undefined
  const fullName = joinValidValues([receptionist.firstName, receptionist.lastName], " ")
  const email = typeof receptionist.email === "string" ? receptionist.email.trim() : ""
  const mobile = typeof receptionist.mobile === "string" ? receptionist.mobile.trim() : ""
  const registeredOn = formatDate(receptionist.registeredOn)
  const clinicName = joinValidValues([clinicData?.name], " ")
  const clinicPhone = typeof clinicData?.mobile === "string" ? clinicData.mobile.trim() : ""
  const clinicEmail = typeof clinicData?.email === "string" ? clinicData.email.trim() : ""
  const addressText = joinValidValues(
    [
      addressObject?.street,
      addressObject?.city,
      addressObject?.state,
      addressObject?.country,
      addressObject?.postalCode,
    ],
    ", "
  )

  const headerFields: ViewFieldConfig[] = [
    {
      label: "Phone Number",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <Phone className="size-3.5 text-primary" />
          <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{mobile}</span>
        </div>
      ),
      rawValue: mobile,
      isVisible: isValidFieldValue(mobile),
    },
    {
      label: "Registered On",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <Calendar className="size-3.5 text-primary" />
          <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{registeredOn}</span>
        </div>
      ),
      className: "lg:text-center",
      rawValue: registeredOn,
      isVisible: isValidFieldValue(registeredOn),
    },
    {
      label: "Status",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <ShieldCheck className={`size-3.5 ${receptionist.status === "Active" ? "text-green-500" : "text-red-500"}`} />
          <span className={receptionist.status === "Active" ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
            {receptionist.status}
          </span>
        </div>
      ),
      className: "lg:text-right",
      rawValue: receptionist.status,
    }
  ]

  const sections: ViewSectionConfig[] = [
    {
      title: "Personal Detail",
      isVisible: isValidFieldValue(fullName) || isValidFieldValue(email),
      items: [
        {
          avatar: {
            src: receptionist.avatarUrl,
            fallback: getInitials(receptionist.firstName, receptionist.lastName)
          },
          title: fullName,
          rawTitle: fullName,
          info: isValidFieldValue(email) ? (
            <div className="flex items-start gap-1.5 min-w-0">
              <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{email}</span>
            </div>
          ) : undefined,
          rawInfo: email,
        }
      ]
    },
    {
      title: "Clinic Detail",
      isVisible: isValidFieldValue(clinicName) || isValidFieldValue(clinicPhone) || isValidFieldValue(clinicEmail),
      items: [
        { 
          avatar: { src: receptionist.clinicAvatarUrl || clinicData?.cliniclogo, fallback: getInitials(clinicName) },
          title: clinicName,
          rawTitle: clinicName,
          info: isValidFieldValue(clinicEmail) ? (
            <div className="flex items-start gap-1.5 min-w-0">
              <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{clinicEmail}</span>
            </div>
          ) : isValidFieldValue(clinicPhone) ? (
            <div className="flex items-start gap-1.5 min-w-0">
              <Phone className="size-3 text-muted-foreground" />
              <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{clinicPhone}</span>
            </div>
          ) : undefined,
          rawInfo: clinicEmail || clinicPhone,
        }
      ]
    },
    {
      title: "Address Detail",
      isVisible: isValidFieldValue(addressText),
      items: [
        {
          title: "",
          rawInfo: addressText,
          info: (
            <div className="flex items-start gap-1.5 min-w-0">
              <MapPin className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="leading-tight min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">
                {addressText}
              </span>
            </div>
          ),
        }
      ]
    }
  ]


  return (
    <GenericViewDialog
      title="Receptionist Details"
      trigger={trigger}
      headerFields={headerFields}
      sections={sections}
      dialogSize="lg"
    />
  )
}
