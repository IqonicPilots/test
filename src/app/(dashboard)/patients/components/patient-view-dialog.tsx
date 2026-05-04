"use client"

import * as React from "react"
import { GenericViewDialog, ViewFieldConfig, ViewSectionConfig } from "@/components/generic-view-dialog"
import { Phone, MapPin, User, HeartPulse, ShieldCheck, Mail, Calendar } from "lucide-react"
import type { Patient } from "@/types/user.types"

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

interface PatientViewDialogProps {
  patient: Patient
  trigger?: React.ReactNode
}

export function PatientViewDialog({ patient, trigger }: PatientViewDialogProps) {
  const getInitials = (firstName?: string, lastName?: string) => {
    const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.trim()
    return initials ? initials.toUpperCase() : "PT"
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

  const fullName = joinValidValues([patient.firstName, patient.lastName], " ")
  const email = typeof patient.email === "string" ? patient.email.trim() : ""
  const mobileNumber = joinValidValues([patient.countryCode, patient.mobile], " ")
  const gender = typeof patient.meta?.gender === "string" ? patient.meta.gender.trim() : ""
  const bloodGroup = typeof patient.meta?.bloodGroup === "string" ? patient.meta.bloodGroup.trim() : ""
  const registeredOn = formatDate(patient.createdAt)
  const addressText = joinValidValues(
    [
      patient.meta?.address?.street,
      patient.meta?.address?.city,
      patient.meta?.address?.state,
      patient.meta?.address?.country,
      patient.meta?.address?.postalCode,
    ],
    ", "
  )

  const headerFields: ViewFieldConfig[] = [
    {
      label: "Phone Number",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <Phone className="size-3.5 text-primary" />
          <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{mobileNumber}</span>
        </div>
      ),
      rawValue: mobileNumber,
      isVisible: isValidFieldValue(mobileNumber),
    },
    {
      label: "Gender",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <User className="size-3.5 text-primary" />
          <span className="capitalize break-words whitespace-normal [overflow-wrap:anywhere]">{gender}</span>
        </div>
      ),
      className: "lg:text-center",
      rawValue: gender,
      isVisible: isValidFieldValue(gender),
    },
    {
      label: "Blood Group",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <HeartPulse className="size-3.5 text-red-500" />
          <span className="font-bold break-words whitespace-normal [overflow-wrap:anywhere]">{bloodGroup}</span>
        </div>
      ),
      className: "lg:text-center",
      rawValue: bloodGroup,
      isVisible: isValidFieldValue(bloodGroup),
    },
    {
      label: "Status",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <ShieldCheck className={`size-3.5 ${patient.isActive ? "text-green-500" : "text-red-500"}`} />
          <span className={patient.isActive ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
            {patient.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
      className: "lg:text-right",
      rawValue: patient.isActive ? "Active" : "Inactive",
    }
  ]

  const sections: ViewSectionConfig[] = [
    {
      title: "Personal Detail",
      isVisible: isValidFieldValue(fullName) || isValidFieldValue(email),
      items: [
        {
          avatar: { 
            src: patient.meta?.profilePicture || (patient.meta as any)?.avatar,
            fallback: getInitials(patient.firstName, patient.lastName) 
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
    },
    {
      title: "Registered On",
      isVisible: isValidFieldValue(registeredOn),
      items: [
        {
          title: "",
          rawInfo: registeredOn,
          info: registeredOn ? (
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3 text-muted-foreground" />
              <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{registeredOn}</span>
            </div>
          ) : undefined,
        }
      ]
    }
  ]

  return (
    <GenericViewDialog
      title="Patient Details"
      trigger={trigger}
      headerFields={headerFields}
      sections={sections}
      dialogSize="lg"
    />
  )
}
