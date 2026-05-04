"use client"

import * as React from "react"
import { GenericViewDialog, ViewFieldConfig, ViewSectionConfig } from "@/components/generic-view-dialog"
import type { Service } from "@/types/service.types"
import { Clock, Tag, Phone, ShieldCheck, Mail } from "lucide-react"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"

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

interface ServiceViewDialogProps {
  service: Service
  trigger?: React.ReactNode
}

export function ServiceViewDialog({ service, trigger }: ServiceViewDialogProps) {
  const { formatCurrencyCompact } = useCurrencyFormatter(true)
  const getInitials = (name?: string) => {
    const normalizedName = typeof name === "string" ? name.trim() : ""
    if (!normalizedName) return "SV"
    return normalizedName.substring(0, 2).toUpperCase()
  }

  const clinicData =
    service.clinic && typeof service.clinic === "object"
      ? service.clinic
      : null

  const doctorData =
    service.doctor && typeof service.doctor === "object"
      ? service.doctor
      : null
  const doctorName = doctorData
    ? (doctorData.name || `${doctorData.firstName || ""} ${doctorData.lastName || ""}`.trim())
    : undefined
  

  const categoryLabel =
    service.category && typeof service.category === "object"
      ? service.category.label
      : service.category

  const durationText = typeof service.duration === "number" && Number.isFinite(service.duration)
    ? `${service.duration} min`
    : ""
  const chargesText = Number.isFinite(Number(service.charges))
    ? formatCurrencyCompact(Number(service.charges))
    : ""
  const clinicName = typeof clinicData?.name === "string" ? clinicData.name.trim() : ""
  const clinicEmail = typeof clinicData?.email === "string" ? clinicData.email.trim() : ""
  const doctorEmail = typeof doctorData?.email === "string" ? doctorData.email.trim() : ""
  const clinicPhone = joinValidValues([clinicData?.countryCode, clinicData?.mobile], " ")
  const doctorPhone = joinValidValues([doctorData?.countryCode, doctorData?.mobile], " ")

  const headerFields: ViewFieldConfig[] = [
    {
      label: "Charges",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <span className="font-bold break-words whitespace-normal [overflow-wrap:anywhere]">{chargesText}</span>
        </div>
      ),
      rawValue: chargesText,
      isVisible: isValidFieldValue(chargesText),
    },
    {
      label: "Duration",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <Clock className="size-3.5 text-primary" />
          <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{durationText}</span>
        </div>
      ),
      className: "lg:text-center",
      rawValue: durationText,
      isVisible: isValidFieldValue(durationText),
    },
    {
      label: "Category",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <Tag className="size-3.5 text-primary" />
          <span className="capitalize break-words whitespace-normal [overflow-wrap:anywhere]">{categoryLabel as string}</span>
        </div>
      ),
      className: "lg:text-center",
      rawValue: categoryLabel,
      isVisible: isValidFieldValue(categoryLabel),
    },
    {
      label: "Status",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <ShieldCheck className={`size-3.5 ${service.isActive ? "text-green-500" : "text-red-500"}`} />
          <span className={service.isActive ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
            {service.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
      className: "lg:text-right",
      rawValue: service.isActive ? "Active" : "Inactive",
    }
  ]
  const sections: ViewSectionConfig[] = [
    {
      title: "Service Detail",
      isVisible: isValidFieldValue(service.name) || isValidFieldValue(categoryLabel) || isValidFieldValue(durationText) || isValidFieldValue(chargesText),
      items: [
        {
          avatar: {
            src: service.serviceImage,
            fallback: getInitials(service.name)
          },
          title: service.name,
          rawTitle: service.name,
          subtitle: (
            <div className="flex flex-col gap-1">
              {isValidFieldValue(categoryLabel) ? (
                <div className="flex items-start gap-1.5 min-w-0">
                  <Tag className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{categoryLabel as string}</span>
                </div>
              ) : null}
            </div>
          ),
        }
      ]
    },
    {
      title: "Clinic Detail",
      isVisible: isValidFieldValue(clinicName) || isValidFieldValue(clinicPhone) || isValidFieldValue(clinicEmail),
      items: [
        {
          avatar: { src: clinicData?.cliniclogo, fallback: getInitials(clinicName) },
          title: clinicName,
          rawTitle: clinicName,
          info: isValidFieldValue(clinicEmail) ? (
            <div className="flex items-start gap-1 min-w-0">
              <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{clinicEmail}</span>
            </div>
          ) : isValidFieldValue(clinicPhone) ? (
            <div className="flex items-center gap-1.5">
              <Phone className="size-3 text-muted-foreground" />
              <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{clinicPhone}</span>
            </div>
          ) : undefined,
          rawInfo: clinicEmail || clinicPhone,
        }
      ]
    },
    {
      title: "Doctor Detail",
      isVisible: isValidFieldValue(doctorName) || isValidFieldValue(doctorPhone),
      items: [
        {
          avatar: { src: doctorData?.meta?.profilePicture || doctorData?.meta?.avatar, fallback: getInitials(doctorName) },
          title: doctorName || "",
          rawTitle: doctorName,
          info: isValidFieldValue(doctorEmail) ? (
            <div className="flex items-start gap-1 min-w-0">
              <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{doctorEmail}</span>
            </div>
          ) : isValidFieldValue(doctorPhone) ? (
            <div className="flex items-center gap-1.5">
              <Phone className="size-3 text-muted-foreground" />
              <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{doctorPhone}</span>
            </div>
          ) : undefined,
          rawInfo: doctorEmail || doctorPhone,
        }
      ]
    }
  ]

  return (
    <GenericViewDialog
      title="Service Details"
      trigger={trigger}
      headerFields={headerFields}
      sections={sections}
      dialogSize="lg"
    />
  )
}
