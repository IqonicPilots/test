"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { GenericViewDialog, ViewFieldConfig, ViewSectionConfig } from "@/components/generic-view-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Tax } from "@/types/tax.types"
import { User, Stethoscope, ShieldCheck, Mail, Clock } from "lucide-react"
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

type TaxViewDoctor = {
  _id: string
  firstName: string
  lastName: string
  fullName?: string
  email?: string
  meta?: { profilePicture?: string }
}

type TaxViewService = {
  _id: string
  name: string
  serviceImage?: string
  charges?: number
  duration?: number
}

function stopWheelBubble(e: React.WheelEvent) {
  e.stopPropagation()
}

function getTaxViewDoctorName(d: TaxViewDoctor): string {
  return d.fullName || `${d.firstName} ${d.lastName}`.trim() || "Doctor"
}

function getTaxViewAvatarInitials(name: string): string {
  const t = name.trim()
  if (!t) return "DR"
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
  }
  return t.substring(0, 2).toUpperCase()
}

function TaxViewFirstDoctorInfo({ first, rest }: { first: TaxViewDoctor; rest: TaxViewDoctor[] }) {
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

  const email = (first.email || "").trim()
  const extra = rest.length

  return (
    <div className="w-full min-w-0">
      {email ? (
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <Mail className="size-3 text-muted-foreground shrink-0" />
          <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{email}</span>
        </div>
      ) : null}
      {extra > 0 && (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="shrink-0 inline-flex items-center rounded px-2.5 py-0.5 mt-2 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500/25 transition-colors"
              onMouseEnter={openPopover}
              onMouseLeave={scheduleClose}
            >
              +{extra}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 max-h-48 overflow-y-auto p-3 z-[100]"
            align="start"
            side="bottom"
            onMouseEnter={openPopover}
            onMouseLeave={scheduleClose}
            onWheel={stopWheelBubble}
          >
            <div className="flex flex-col gap-3 pr-0.5" onWheel={stopWheelBubble} >
              {rest.map((d, i) => {
                const name = getTaxViewDoctorName(d)
                const em = (d.email || "").trim()
                return (
                  <div key={d._id || i} className="flex gap-3 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0 border border-border/50">
                      {d.meta?.profilePicture ? (
                        <AvatarImage src={d.meta.profilePicture} alt={name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold uppercase">
                        {getTaxViewAvatarInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{name}</p>
                      {em ? (
                        <p className="text-xs text-muted-foreground flex items-start gap-1 [overflow-wrap:anywhere]">
                          <Mail className="size-3 mt-0.5 shrink-0" />
                          <span className="break-words">{em}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

function getTaxViewServiceName(s: TaxViewService): string {
  return s.name?.trim() || "Service"
}

function TaxViewFirstServiceInfo({
  first,
  rest,
  formatCurrency,
}: {
  first: TaxViewService
  rest: TaxViewService[]
  formatCurrency: (v: number, options?: { hidePostfix?: boolean }) => string
}) {
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

  const extra = rest.length
  const showCharges = first.charges != null
  const showDuration = first.duration != null

  return (
    <div className="w-full min-w-0 space-y-1">
      {showCharges && (
        <div className="text-xs text-muted-foreground font-medium [overflow-wrap:anywhere]">
          Charges: {formatCurrency(first.charges!)}
        </div>
      )}
      {showDuration && (
        <div className="text-xs text-muted-foreground font-medium flex items-center justify-between gap-1 [overflow-wrap:anywhere]">
          <span className="flex items-center gap-1">
            <Clock className="size-3 text-muted-foreground shrink-0" />
            {first.duration} min
          </span>
          {extra > 0 && (
            <Popover open={open} onOpenChange={setOpen} modal={false}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="shrink-0 inline-flex items-center rounded px-2.5 py-0.5 mt-1 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500/25 transition-colors"
                  onMouseEnter={openPopover}
                  onMouseLeave={scheduleClose}
                >
                  +{extra}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 max-h-48 overflow-y-auto p-3 z-[100]"
                align="start"
                side="bottom"
                onMouseEnter={openPopover}
                onMouseLeave={scheduleClose}
                onWheel={stopWheelBubble}
              >
                <div className="flex flex-col gap-3 pr-0.5" onWheel={stopWheelBubble}>
                  {rest.map((s, i) => {
                    const name = getTaxViewServiceName(s)
                    return (
                      <div key={s._id || i} className="flex gap-3 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0 border border-border/50">
                          {s.serviceImage ? (
                            <AvatarImage src={s.serviceImage} alt={name} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold uppercase">
                            {getTaxViewAvatarInitials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{name}</p>
                          {s.charges != null && (
                            <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">Charges: {formatCurrency(s.charges)}</p>
                          )}
                          {s.duration != null && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 [overflow-wrap:anywhere]">
                              <Clock className="size-3 shrink-0" />
                              {s.duration} min
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </div>
  )
}

interface TaxViewDialogProps {
  tax: Tax
  trigger?: React.ReactNode
}

export function TaxViewDialog({ tax, trigger }: TaxViewDialogProps) {
  const { formatCurrency, currencyPrefix } = useCurrencyFormatter()
  const isPercent = tax.type === "percentage"

  // Extract clinic info directly from tax object
  const clinic = typeof tax.clinicId === "object" ? tax.clinicId : null
  const clinicName = clinic?.name || "All Clinics"
  const clinicEmail = clinic?.email || ""
  const clinicLogo = clinic?.cliniclogo || ""

  // Extract doctor info directly from tax object
  const doctors = Array.isArray(tax.doctorIds)
    ? (tax.doctorIds.map((d) => (typeof d === "string" ? null : d)).filter(Boolean) as TaxViewDoctor[])
    : []

  // Extract service info directly from tax object
  const services = Array.isArray(tax.serviceIds)
    ? (tax.serviceIds.map((s) => (typeof s === "string" ? null : s)).filter(Boolean) as TaxViewService[])
    : []

  const headerFields: ViewFieldConfig[] = [
    {
      label: "Tax Name",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <span className="font-bold">{tax.taxName}</span>
        </div>
      )
    },
    {
      label: "Tax Rate",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <span className="font-bold">{isPercent ? `${tax.taxRate}%` : formatCurrency(tax.taxRate, { hidePostfix: true })}</span>
        </div>
      ),
      className: "lg:text-center",
    },
    {
      label: "Rate Type",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <span className="font-bold">{isPercent ? `Percentage (%)` : `Fixed (${currencyPrefix})`}</span>
        </div>
      ),
      className: "lg:text-center"
    },
    {
      label: "Status",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <ShieldCheck className={`size-3.5 ${tax.isActive ? "text-green-500" : "text-red-500"}`} />
          <span className={tax.isActive ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
            {tax.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
      className: "lg:text-right"
    }
  ]

  const sections: ViewSectionConfig[] = [
    {
      title: "Clinic Details",
      items: [
        {
          avatar: { src: clinicLogo, fallback: clinicName.substring(0, 2).toUpperCase() },
          title: clinicName,
          info: clinicEmail ? (
            <div className="flex items-start gap-1 min-w-0">
              <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{clinicEmail}</span>
            </div>
          ) : (
            <div className="flex items-start gap-1 min-w-0">
              <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="break-words whitespace-normal [overflow-wrap:anywhere]">Applied to all clinics</span>
            </div>
          ),
        }
      ]
    },
    {
      title: "Doctors Details",
      items:
        doctors.length > 0
          ? (() => {
              const first = doctors[0]
              const rest = doctors.slice(1)
              const doctorName = getTaxViewDoctorName(first)
              const hasDoctorName = isValidFieldValue(doctorName)
              return [
                {
                  avatar: {
                    src: first.meta?.profilePicture,
                    fallback: getTaxViewAvatarInitials(doctorName),
                  },
                  title: doctorName || "",
                  rawTitle: doctorName,
                  isVisible: hasDoctorName,
                  info: (
                    <TaxViewFirstDoctorInfo first={first} rest={rest} />
                  ),
                  rawInfo: hasDoctorName ? first.email || doctorName : "",
                },
              ]
            })()
          : [
              {
                avatar: { fallback: "AD" },
                title: "All Doctors",
                info: (
                  <div className="flex items-center gap-1.5">
                    <User className="size-3 text-muted-foreground" />
                    Applied to all doctors
                  </div>
                ),
              },
            ],
    },
    {
      title: "Services Details",
      items:
        services.length > 0
          ? (() => {
              const first = services[0]
              const rest = services.slice(1)
              const serviceName = getTaxViewServiceName(first)
              const hasTitle = isValidFieldValue(serviceName)
              return [
                {
                  avatar: { src: first.serviceImage, fallback: getTaxViewAvatarInitials(serviceName) },
                  title: serviceName,
                  rawTitle: serviceName,
                  isVisible: hasTitle,
                  info: <TaxViewFirstServiceInfo first={first} rest={rest} formatCurrency={formatCurrency} />,
                  rawInfo: hasTitle ? (first.charges != null ? String(first.charges) : serviceName) : "",
                },
              ]
            })()
          : [
              {
                avatar: { fallback: "ALL" },
                title: "All Services",
                info: (
                  <div className="flex items-start gap-1 min-w-0">
                    <Stethoscope className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                    <span className="break-words whitespace-normal [overflow-wrap:anywhere]">Applied to all services</span>
                  </div>
                ),
              },
            ],
    },
  ]

  return (
    <GenericViewDialog
      title="Tax Details"
      trigger={trigger}
      headerFields={headerFields}
      sections={sections}
      dialogSize="lg"
    />
  )
}
