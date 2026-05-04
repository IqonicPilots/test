"use client"

import { Badge } from "@/components/ui/badge"
import {
  GenericViewDialog,
  type ViewFieldConfig,
  type ViewSectionConfig,
} from "@/components/generic-view-dialog"
import type { Bill } from "@/types/bill.types"
import { Calendar, Mail } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
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

const getInitials = (name?: string) => {
  if (!name) return "U"
  const words = name.trim().split(" ")
  return words.length >= 2
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

interface BillViewDialogProps {
  bill: Bill
  trigger: React.ReactNode
}

export function BillViewDialog({ bill, trigger }: BillViewDialogProps) {
  const patient =
    bill.patient && typeof bill.patient === "object"
      ? (bill.patient as {
          fullName?: string
          firstName?: string
          lastName?: string
          email?: string
          profilePicture?: string
        })
      : null
  const doctor =
    bill.doctor && typeof bill.doctor === "object"
      ? (bill.doctor as {
          fullName?: string
          firstName?: string
          lastName?: string
          email?: string
          profilePicture?: string
        })
      : null
  const clinic =
    bill.clinic && typeof bill.clinic === "object"
      ? (bill.clinic as { name?: string; email?: string; cliniclogo?: string; logo?: string })
      : null

  const patientName = patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Patient"
  const doctorName = doctor?.fullName || `${doctor?.firstName || ""} ${doctor?.lastName || ""}`.trim() || "Doctor"
  const clinicName = clinic?.name || "Clinic"
  const patientEmail = typeof patient?.email === "string" ? patient.email.trim() : ""
  const doctorEmail = typeof doctor?.email === "string" ? doctor.email.trim() : ""
  const clinicEmail = typeof clinic?.email === "string" ? clinic.email.trim() : ""
  const createdAtText = formatDate(bill.createdAt)

  const totalAmountText = formatCurrency(bill.totalAmount)

  const headerFields: ViewFieldConfig[] = [
    {
      label: "Created",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <span className="flex items-center gap-1.5 break-words whitespace-normal [overflow-wrap:anywhere]">
            <Calendar className="size-3 mt-0.5 text-primary" />
            {createdAtText}
          </span>
        </div>
      ),
      rawValue: createdAtText,
      isVisible: isValidFieldValue(createdAtText),
    },
    {
      label: "Total Amount",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <span className="font-bold break-words whitespace-normal [overflow-wrap:anywhere]">{totalAmountText}</span>
        </div>
      ),
      rawValue: totalAmountText,
    },
    {
      label: "Payment Status",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <StatusBadge status={bill.paymentStatus === "paid" ? "paid" : "unpaid"} className="capitalize" />
        </div>
      ),
    },
  ]

  const sections: ViewSectionConfig[] = [
    {
      title: "Patient",
      isVisible: isValidFieldValue(patientName) || isValidFieldValue(patientEmail),
      items: [
        {
          title: patientName,
          rawTitle: patientName,
          avatar: {
            src: patient?.profilePicture,
            fallback: getInitials(patientName),
          },
          info: patientEmail ? 
          <div className="flex items-start gap-1 min-w-0">
            <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
            <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{patientEmail}</span>
          </div> : '',
          rawInfo: patientEmail,
        },
      ],
    },
    {
      title: "Doctor",
      isVisible: isValidFieldValue(doctorName) || isValidFieldValue(doctorEmail),
      items: [
        {
          title: doctorName,
          rawTitle: doctorName,
          avatar: {
            src: doctor?.profilePicture,
            fallback: getInitials(doctorName),
          },
          info: doctorEmail ? <div className="flex items-start gap-1 min-w-0">
            <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
            <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{doctorEmail}</span>
          </div> : '',
          rawInfo: doctorEmail,
        },
      ],
    },
    {
      title: "Clinic",
      isVisible: isValidFieldValue(clinicName) || isValidFieldValue(clinicEmail),
      items: [
        {
          title: clinicName,
          rawTitle: clinicName,
          avatar: {
            src: clinic?.cliniclogo || clinic?.logo,
            fallback: getInitials(clinicName),
          },
          info: clinicEmail ? <div className="flex items-start gap-1 min-w-0">
            <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
            <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{clinicEmail}</span>
          </div> : '',
          rawInfo: clinicEmail,
        },
      ],
    },
  ]

  const footer = (
    <div className="space-y-6">
      {/* Items */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Items</h4>
        <div className="space-y-2">
          {bill.items?.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
            >
              <span className="text-sm">{item.name}</span>
              <span className="text-sm font-medium">
                {item.qty > 1 ? `${item.qty} × ${formatCurrency(item.price)} = ` : ""}
                {formatCurrency(item.total)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Service Total</span>
          <span>{formatCurrency(bill.serviceTotal)}</span>
        </div>
        {bill.taxTotal > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax Total</span>
            <span>{formatCurrency(bill.taxTotal)}</span>
          </div>
        )}
        {(Number(bill.discount ?? bill.discount_value) || 0) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span>-{formatCurrency(Number(bill.discount ?? bill.discount_value) || 0)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold pt-2">
          <span>Total Amount</span>
          <span>{formatCurrency(bill.totalAmount)}</span>
        </div>
      </div>
    </div>
  )

  return (
    <GenericViewDialog
      title={bill.title || "Invoice Details"}
      trigger={trigger}
      headerFields={headerFields}
      sections={sections}
      footer={footer}
      dialogSize="lg"
    />
  )
}
