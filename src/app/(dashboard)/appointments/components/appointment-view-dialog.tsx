"use client"

import * as React from "react"
import { GenericViewDialog, ViewFieldConfig, ViewSectionConfig } from "@/components/generic-view-dialog"
import type { Appointment } from "@/services/appointment.service"
import { Phone, CheckCircle2, AlertCircle, Clock, CreditCard, Stethoscope, Mail, Calendar } from "lucide-react"
import { cn, getPaymentModeLabel, isObject } from "@/lib/utils"

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

interface AppointmentViewDialogProps {
  appointment?: Appointment | null
  trigger?: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  footer?: React.ReactNode
}

export function AppointmentViewDialog({
  appointment,
  trigger,
  isOpen,
  onOpenChange,
  footer,
}: AppointmentViewDialogProps) {
  if (!appointment) {
    return null
  }
  const formatDate = (dateStr?: string) => {
    if (!isValidFieldValue(dateStr)) return ""
    const parsedDate = new Date(String(dateStr))
    if (Number.isNaN(parsedDate.getTime())) return ""
    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  const formatTime = (timeStr?: string) => {
    if (!isValidFieldValue(timeStr)) return ""
    const parsedTime = new Date(`1970-01-01T${timeStr}`)
    if (Number.isNaN(parsedTime.getTime())) return ""
    return parsedTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getInitials = (name?: string) => {
    const normalizedName = typeof name === "string" ? name.trim() : ""
    if (!normalizedName) return "NA"
    return normalizedName.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const patient = appointment.patient
  const doctor = appointment.doctor
  const clinic = appointment.clinic
  const service = appointment.service
  const serviceName = isObject(service)
    ? service.name
    : (typeof service === "string" ? service : "")
  const bookingStatus = appointment.status?.label || appointment.status?.id || ""
  const paymentModeLabel = getPaymentModeLabel(appointment.paymentMode)
  const dateAndTime = joinValidValues(
    [formatDate(appointment.schedule?.startDate), formatTime(appointment.schedule?.startTime)],
    " "
  )

  const patientName = isObject(patient) ? patient.fullName : (typeof patient === "string" ? patient : "")
  const clinicName = isObject(clinic) ? clinic.name : (typeof clinic === "string" ? clinic : "")
  const doctorName = isObject(doctor) ? doctor.fullName : (typeof doctor === "string" ? doctor : "")
  const doctorEmail = isObject(doctor) ? (doctor as any).email : (typeof doctor === "string" ? doctor : "")
  const clinicEmail = isObject(clinic) ? (clinic as any).email : (typeof clinic === "string" ? clinic : "")
  const patientEmail = isObject(patient) ? (patient as any).email : (typeof patient === "string" ? patient : "")

  const patientPhone = isObject(patient)
    ? joinValidValues([patient.countryCode, patient.mobile || patient.phoneNumber], " ")
    : ""
  const clinicPhone = isObject(clinic)
    ? joinValidValues([clinic.countryCode, clinic.mobile || clinic.phoneNumber], " ")
    : ""
  const doctorPhone = isObject(doctor)
    ? joinValidValues([doctor.countryCode, doctor.mobile || doctor.phoneNumber], " ")
    : ""

  const headerFields: ViewFieldConfig[] = [
    {
      label: "Date & Time",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <span className="flex items-center gap-1.5 break-words whitespace-normal [overflow-wrap:anywhere]">
            <Calendar className="size-3 mt-0.5 text-primary" />
            {dateAndTime}
          </span>
        </div>
      ),
      rawValue: dateAndTime,
      isVisible: isValidFieldValue(dateAndTime),
    },
    {
      label: "Service Name",
      value: (
        <div className="flex items-start gap-2 lg:justify-center">
          <span className="flex items-center gap-1.5 capitalize break-words whitespace-normal [overflow-wrap:anywhere]">
            <Stethoscope className="size-3.5 text-primary" />
            {serviceName}
          </span>
        </div>
      ),
      rawValue: serviceName,
      isVisible: isValidFieldValue(serviceName),
    },
    {
      label: "Booking Status",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          {appointment.status?.id === "cancelled" ? (
            <AlertCircle className="size-3.5 text-red-500" />
          ) : (
            <CheckCircle2 className="size-3.5 text-green-500" />
          )}
          <span className={cn(
            "font-bold",
            appointment.status?.id === "cancelled" ? "text-red-500" : "text-green-500"
          )}>
            {bookingStatus}
          </span>
        </div>
      ),
      rawValue: bookingStatus,
      isVisible: isValidFieldValue(bookingStatus),
    },
    {
      label: "Payment Mode",
      value: (
        <div className="flex items-center gap-2 lg:justify-center">
          <CreditCard className="size-3.5 text-primary" />
          <span className="break-words whitespace-normal [overflow-wrap:anywhere]">{paymentModeLabel}</span>
        </div>
      ),
      rawValue: paymentModeLabel,
      isVisible: isValidFieldValue(paymentModeLabel),
    }
  ]

  const sections: ViewSectionConfig[] = [
    {
      title: "Patient Detail",
      isVisible: isValidFieldValue(patientName) || isValidFieldValue(patientPhone),
      items: [
        {
          avatar: { 
            src: isObject(patient) ? (patient.profilePicture || patient.avatar) : undefined,
            fallback: getInitials(patientName || "Patient") 
          },
          title: patientName,
          rawTitle: patientName,
          info: isValidFieldValue(patientEmail) ? (
            <span className="flex items-center gap-1.5 min-w-0">
              <Mail className="size-3 text-muted-foreground" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{patientEmail}</span>
            </span>
          ) : isValidFieldValue(patientPhone) ? (
            <span className="flex items-center gap-1.5 min-w-0">
              <Phone className="size-3 text-muted-foreground" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{patientPhone}</span>
            </span>
          ) : undefined,
          rawInfo: patientEmail || patientPhone,
        }
      ]
    },
    {
      title: "Clinic Detail",
      isVisible: isValidFieldValue(clinicName) || isValidFieldValue(clinicPhone),
      items: [
        {
          avatar: { 
            src: isObject(clinic) ? clinic.cliniclogo : undefined,
            fallback: getInitials(clinicName || "Clinic") 
          },
          title: clinicName,
          rawTitle: clinicName,
          info: isValidFieldValue(clinicEmail) ? (
            <span className="flex items-center gap-1.5 min-w-0">
              <Mail className="size-3 text-muted-foreground" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{clinicEmail}</span>
            </span>
          ) : isValidFieldValue(clinicPhone) ? (
            <span className="flex items-center gap-1.5 min-w-0">
              <Phone className="size-3 text-muted-foreground" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{clinicPhone}</span>
            </span>
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
          avatar: { 
            src: isObject(doctor) ? (doctor.profilePicture || doctor.avatar) : undefined,
            fallback: getInitials(doctorName || "Doctor") 
          },
          title: doctorName,
          rawTitle: doctorName,
          info: isValidFieldValue(doctorEmail) ? (
            <span className="flex items-center gap-1.5 min-w-0">
              <Mail className="size-3 mt-0.5 text-muted-foreground" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{doctorEmail}</span>
            </span>
          ) : isValidFieldValue(doctorPhone) ? (
            <span className="flex items-center gap-1.5 min-w-0">
              <Phone className="size-3 mt-0.5 text-muted-foreground" />
              <span className="min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">{doctorPhone}</span>
            </span>
          ) : undefined,
          rawInfo: doctorEmail || doctorPhone,
        }
      ]
    }
  ]

  return (
    <GenericViewDialog
      title="Appointment Details"
      trigger={trigger}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      headerFields={headerFields}
      sections={sections}
      dialogSize="lg"
      footer={footer}
    />
  )
}
