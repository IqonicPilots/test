"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { GenericViewDialog, ViewFieldConfig, ViewSectionConfig } from "@/components/generic-view-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Doctor } from "@/types/doctor.types"
import { Phone, MapPin, ShieldCheck, Stethoscope, User, Mail, Building2 } from "lucide-react"

const MAX_VISIBLE_ITEMS = 2

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

/** Stops the parent dialog from stealing wheel events so the popover list can scroll. */
function stopWheelBubble(e: React.WheelEvent) {
  e.stopPropagation()
}

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
      <span>{visible.join(", ")}</span>{" "}
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

interface DoctorViewDialogProps {
  doctor: Doctor
  trigger?: React.ReactNode
}

export function DoctorViewDialog({ doctor, trigger }: DoctorViewDialogProps) {
  const getInitials = (firstName?: string, lastName?: string) => {
    return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "DR"
  }

  const fullName = joinValidValues([doctor.firstName, doctor.lastName], " ")
  const email = typeof doctor.email === "string" ? doctor.email.trim() : ""
  const mobileNumber = joinValidValues([doctor.countryCode, doctor.mobile], " ")
  const gender = typeof doctor.meta?.gender === "string" ? doctor.meta.gender.trim() : ""
  const experienceYears = doctor.meta?.experience != null ? `${doctor.meta.experience} yrs` : ""

  const specialties = React.useMemo(() => {
    const rawSpecialties = doctor.meta?.specialties || []
    return (Array.isArray(rawSpecialties) ? rawSpecialties : [])
      .map((s: any) => {
        if (!s) return ""
        if (typeof s === "string") return s
        return s.label || s.value || s.name || s._id || ""
      })
      .filter((entry) => isValidFieldValue(entry))
  }, [doctor])

  const clinics = React.useMemo(() => {
    const rawClinics = doctor.meta?.clinics || []
    return (Array.isArray(rawClinics) ? rawClinics : [])
      .map((c: any) => {
        if (!c) return ""
        if (typeof c === "string") return c
        return c.name || c._id || ""
      })
      .filter((entry) => isValidFieldValue(entry))
  }, [doctor])

  const addressObj = typeof doctor.meta?.address === "object" ? doctor.meta.address : null
  const addressParts = addressObj
    ? [addressObj.street, addressObj.city, addressObj.state, addressObj.country, addressObj.postalCode]
    : [doctor.meta?.city, doctor.meta?.state, doctor.meta?.country]
  const addressText = joinValidValues(addressParts, ", ")


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
      label: "Experience",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <Stethoscope className="size-3.5 text-primary" />
          <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{experienceYears}</span>
        </div>
      ),
      className: "lg:text-center",
      rawValue: experienceYears,
      isVisible: isValidFieldValue(experienceYears),
    },
    {
      label: "Status",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <ShieldCheck className={`size-3.5 ${doctor.isActive ? "text-green-500" : "text-red-500"}`} />
          <span className={doctor.isActive ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
            {doctor.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
      className: "lg:text-right",
      rawValue: doctor.isActive ? "Active" : "Inactive",
    }
  ]

  const sections: ViewSectionConfig[] = [
    {
      title: "Doctor Detail",
      isVisible: isValidFieldValue(fullName) || isValidFieldValue(email),
      items: [
        {
          avatar: {
            src: doctor.meta?.profilePicture || doctor.meta?.avatar,
            fallback: getInitials(doctor.firstName, doctor.lastName)
          },
          title: fullName,
          rawTitle: fullName,
          info: isValidFieldValue(email) ? (
            <div className="flex items-start gap-1.5 min-w-0">
              <Mail className="size-3 text-muted-foreground mt-0.5 shrink-0" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{email}</span>
            </div>
          ) : undefined,
          rawInfo: email,
        }
      ]
    },
    {
      title: "Specializations",
      isVisible: specialties.length > 0 || clinics.length > 0,
      items: [
        {
          title: "",
          rawInfo: specialties.length > 0 || clinics.length > 0 ? "has-specialization-content" : "",
          info: (
            <div className="flex flex-col gap-3 min-w-0">
              {specialties.length > 0 && (
                <TextListWithOverflow
                  items={specialties}
                  popoverTitle="All Specializations"
                  summaryClassName="text-sm font-bold text-foreground break-words whitespace-normal [overflow-wrap:anywhere]"
                />
              )}
              {clinics.length > 0 ? (
                <div className="flex items-start gap-1.5 pt-0.5 text-muted-foreground">
                  <Building2 className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <TextListWithOverflow
                    items={clinics}
                    popoverTitle="All Clinics"
                    summaryClassName="text-muted-foreground font-normal break-words whitespace-normal [overflow-wrap:anywhere]"
                    layout="inline-block"
                  />
                </div>
              ) : null}
            </div>
          ),
        }
      ]
    },
    {
      title: "Address Detail",
      isVisible: isValidFieldValue(addressText),
      items: [
        {
          title: "",
          info: (
            <div className="flex items-start gap-1.5">
              <MapPin className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="leading-tight break-words whitespace-normal [overflow-wrap:anywhere]">
                {addressText}
              </span>
            </div>
          ),
          rawInfo: addressText,
        }
      ]
    }
  ]

  return (
    <GenericViewDialog
      title="Doctor Details"
      trigger={trigger}
      headerFields={headerFields}
      sections={sections}
      dialogSize="lg"
    />
  )
}
