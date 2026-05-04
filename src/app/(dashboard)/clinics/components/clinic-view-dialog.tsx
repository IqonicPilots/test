"use client"

import * as React from "react"
import { GenericViewDialog, ViewFieldConfig, ViewSectionConfig } from "@/components/generic-view-dialog"
import type { Clinic } from "@/types/clinic.types"
import { Phone, Mail, MapPin, Building2, ShieldCheck, User } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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

interface ClinicViewDialogProps {
  clinic: Clinic
  trigger?: React.ReactNode
}

function stopWheelBubble(e: React.WheelEvent) {
  e.stopPropagation()
}

const MAX_VISIBLE_ITEMS = 2

function TextListWithOverflow({
  items,
  popoverTitle,
  summaryClassName,
  layout = "block",
}: {
  items: string[]
  popoverTitle: string
  summaryClassName: string
  /** Use inline-block after an inline label (e.g. "Clinics: "). */
  layout?: "block" | "inline-block"
}) {
  if (items.length === 0) return null

  const box =
    layout === "inline-block"
      ? "inline-block min-w-0 max-w-full break-words align-baseline leading-snug"
      : "block min-w-0 break-words leading-snug"

  if (items.length <= MAX_VISIBLE_ITEMS) {
    return (
      <div className={`${box} ${summaryClassName}`}>
        {items.join(", ")}
      </div>
    )
  }

  const visible = items.slice(0, MAX_VISIBLE_ITEMS)
  const extra = items.length - MAX_VISIBLE_ITEMS

  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const openPopover = () => {
    clearCloseTimer()
    setOpen(true)
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => () => clearCloseTimer(), [])

  return (
    <div className={`${box} ${summaryClassName}`}>
      <span className="text-foreground font-bold">{visible.join(", ")}</span>{" "}
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="items-center rounded px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary dark:bg-muted dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500/25 transition-colors"
            onMouseEnter={openPopover} 
            onMouseLeave={scheduleClose}
          >
            +{extra}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-3 z-[100]"
          align="start"
          side="bottom"
          onWheel={stopWheelBubble}
          onMouseEnter={openPopover}
          onMouseLeave={scheduleClose}
        >
          <div
            className="max-h-48 overflow-y-auto overscroll-y-contain pr-1 text-sm text-foreground leading-relaxed space-y-1"
            onWheel={stopWheelBubble}
          >
            {items.slice(MAX_VISIBLE_ITEMS).map((label, i) => (
              <div key={`${label}-${i}`}>{label}</div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function ClinicViewDialog({ clinic, trigger }: ClinicViewDialogProps) {
  const getInitials = (name?: string) => {
    const normalizedName = typeof name === "string" ? name.trim() : ""
    if (!normalizedName) return "CL"
    return normalizedName.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const adminName = joinValidValues([clinic.clinicAdmin?.firstName, clinic.clinicAdmin?.lastName], " ")
  const adminEmail = typeof clinic.clinicAdmin?.email === "string" ? clinic.clinicAdmin.email.trim() : ""
  const adminMobile = joinValidValues([clinic.clinicAdmin?.countryCode, clinic.clinicAdmin?.mobile], " ")
  const clinicName = typeof clinic.name === "string" ? clinic.name.trim() : ""
  const clinicEmail = typeof clinic.email === "string" ? clinic.email.trim() : ""
  const clinicMobile = joinValidValues([clinic.countryCode, clinic.mobile], " ")

  const specialties = (clinic.specialties || []).map((s: any) =>
    s?.label || s?.value || s?.name || ""
  ).filter((value) => isValidFieldValue(value))
  
  const specialtiesText = joinValidValues(specialties, ", ")

  const addressText = joinValidValues(
    [
      clinic.address?.street,
      clinic.address?.city,
      clinic.address?.state,
      clinic.address?.country,
      clinic.address?.postalCode,
    ],
    ", "
  )

  const headerFields: ViewFieldConfig[] = [
    {
      label: "Phone Number",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <Phone className="size-3.5 text-primary shrink-0" />
          <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{clinicMobile}</span>
        </div>
      ),
      rawValue: clinicMobile,
      isVisible: isValidFieldValue(clinicMobile),
    },
    {
      label: "Specializations",
      value: (
        <>
        <div className="flex items-center gap-2 lg:justify-center">
          <Building2 className="size-3.5 text-primary shrink-0" />
          <TextListWithOverflow
            items={specialties}
            popoverTitle="All Specializations"
            summaryClassName="text-foreground font-bold break-words whitespace-normal [overflow-wrap:anywhere]"
            layout="inline-block"
          />
        </div>
        </>
      ),
      className: "lg:text-center",
      rawValue: specialtiesText,
      isVisible: isValidFieldValue(specialtiesText),
    },
    {
      label: "Status",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <ShieldCheck className={`size-3.5 shrink-0 ${clinic.isActive ? "text-green-500" : "text-red-500"}`} />
          <span className={clinic.isActive ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
            {clinic.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
      className: "lg:text-right",
      rawValue: clinic.isActive ? "Active" : "Inactive",
    }
  ]

  const sections: ViewSectionConfig[] = [
    {
      title: "Clinic Detail",
      isVisible: isValidFieldValue(clinicName) || isValidFieldValue(clinicEmail) || isValidFieldValue(clinicMobile),
      items: [
        {
          avatar: {
            src: clinic.cliniclogo,
            fallback: getInitials(clinicName)
          },
          title: clinicName,
          rawTitle: clinicName,
          subtitle: isValidFieldValue(clinicEmail) ? (
            <div className="flex items-start gap-1.5 min-w-0">
              <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{clinicEmail}</span>
            </div>
          ) : undefined,
          rawSubtitle: clinicEmail,
          info: isValidFieldValue(clinicMobile) ? (
            <div className="flex items-start gap-1.5 min-w-0">
              <Phone className="size-3 text-muted-foreground shrink-0" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{clinicMobile}</span>
            </div>
          ) : undefined,
          rawInfo: clinicMobile,
        }
      ]
    },
    {
      title: "Clinic Admin",
      isVisible: isValidFieldValue(adminName) || isValidFieldValue(adminEmail) || isValidFieldValue(adminMobile),
      items: [
        {
          avatar: {
            src: clinic.clinicAdmin?.meta?.profilePicture,
            fallback: getInitials(adminName)
          },
          title: adminName,
          rawTitle: adminName,
          subtitle: isValidFieldValue(adminEmail) ? (
            <div className="flex items-start gap-1.5 min-w-0">
              <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{adminEmail}</span>
            </div>
          ) : undefined,
          rawSubtitle: adminEmail,
          info: isValidFieldValue(adminMobile) ? (
            <div className="flex items-start gap-1.5 min-w-0">
              <Phone className="size-3 text-muted-foreground shrink-0" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{adminMobile}</span>
            </div>
          ) : undefined,
          rawInfo: adminMobile,
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
      title="Clinic Details"
      trigger={trigger}
      headerFields={headerFields}
      sections={sections}
      dialogSize="lg"
    />
  )
}
