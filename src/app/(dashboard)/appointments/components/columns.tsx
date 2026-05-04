"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import { Building2, Video, Stethoscope } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { Appointment, AppointmentPayload } from "@/services/appointment.service"
import { AppointmentActions } from "./appointment-actions"
import { getPaymentModeLabel, getReferenceId, isObject } from "@/lib/utils"
import { useClinic } from "@/hooks/api/use-clinics"

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}
const formatTime = (timeStr?: string) => {
  if (!timeStr) return "-"
  return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const toSafeImageSrc = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined
  const src = value.trim()
  if (!src) return undefined
  const normalized = src.toLowerCase()
  if (normalized === "null" || normalized === "undefined") return undefined
  return src
}

const getInitials = (value?: string): string => {
  if (!value) return "NA"
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return "NA"
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NA"
}

function SafeAvatar({
  src,
  alt,
  fallback,
  className,
}: {
  src?: string
  alt: string
  fallback: string
  className: string
}) {
  const [hasImageError, setHasImageError] = useState(false)
  const imageSrc = hasImageError ? undefined : toSafeImageSrc(src)
  const avatarKey = `${imageSrc ?? "fallback"}-${fallback}`

  return (
    <Avatar key={avatarKey} className={className}>
      {imageSrc ? (
        <AvatarImage
          src={imageSrc}
          alt={alt}
          onError={() => setHasImageError(true)}
        />
      ) : null}
      <AvatarFallback delayMs={0} className="text-xs font-semibold bg-primary/10 text-primary">
        {fallback}
      </AvatarFallback>
    </Avatar>
  )
}

interface GetColumnsHandlers {
  onDeleteAppointment: (id: string) => void
  onUpdateAppointment: (id: string, data: Partial<AppointmentPayload>) => void
  onAddAppointment: (data: AppointmentPayload) => void
  formatCurrency: (value: number) => string
  role?: string
}

function ClinicInfo({ clinicId, initialClinic }: { clinicId: string; initialClinic: any }) {
  const { data: clinicData } = useClinic(clinicId)
  const clinic = clinicData || initialClinic

  const name = isObject(clinic) ? clinic.name : (typeof clinic === 'string' ? clinic : "N/A")
  const email = isObject(clinic) ? (clinic as any).email : ""
  const initials = getInitials(name)
  const avatar = (clinic as any)?.cliniclogo || (clinic as any)?.image
  const avatarSrc = toSafeImageSrc(avatar)

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <SafeAvatar
        src={avatarSrc}
        alt={name}
        fallback={initials}
        className="h-10 w-10 flex-shrink-0"
      />
      <div className="flex flex-col">
        <span className="font-semibold text-sm">{name}</span>
        {email && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {email}
          </span>
        )}
      </div>
    </div>
  )
}

export function getColumns({ onDeleteAppointment, onUpdateAppointment, onAddAppointment, formatCurrency, role }: GetColumnsHandlers): ColumnDef<Appointment>[] {
  const columns: ColumnDef<Appointment>[] = [
    {
      id: "Patient",
      accessorKey: "patient.fullName",
      header: "Patient",
      cell: ({ row }) => {
        const appt = row.original
        const patient = appt.patient
        const doctor = appt.doctor
        const clinic = appt.clinic

        const patientName = isObject(patient) ? patient.fullName : (typeof patient === 'string' ? patient : "N/A")
        const doctorName = isObject(doctor) ? doctor.fullName : (typeof doctor === 'string' ? doctor : "N/A")
        const clinicName = isObject(clinic) ? clinic.name : (typeof clinic === 'string' ? clinic : "N/A")


        const initials = getInitials(patientName)
        const patientAvatarRaw =
          (patient as any)?.meta?.profilePicture ||
          (patient as any)?.meta?.avatar ||
          (patient as any)?.meta?.profileImage ||
          (patient as any)?.profilePicture ||
          (patient as any)?.profileImage ||
          (patient as any)?.avatar ||
          (patient as any)?.avatarUrl
        const patientAvatar = toSafeImageSrc(patientAvatarRaw)

        return (
          <div className="flex items-center gap-3 min-w-[180px]">
            <SafeAvatar
              src={patientAvatar}
              alt={patientName}
              fallback={initials}
              className="h-10 w-10 flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{patientName}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Doctor: <span className="font-medium text-muted-foreground">{doctorName}</span>
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Clinic: {clinicName}
              </span>
            </div>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        if (!value) return true
        const patient = row.original.patient
        const fullName = (isObject(patient) ? patient.fullName : (typeof patient === 'string' ? patient : "")).toLowerCase()
        return fullName.includes(value.toLowerCase())
      }
    },
    {
      accessorKey: "schedule.startDate",
      id: "Date and Time",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date And Time" />,
      cell: ({ row }) => {
        const appt = row.original
        return (
          <div className="flex flex-col gap-1 min-w-[160px]">
            <span className="text-sm flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(appt.schedule?.startDate || "")}
            </span>
            <span className="text-sm flex items-center gap-1.5 text-muted-foreground">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(appt.schedule?.startTime || "-")}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "service.name",
      id: "Service",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Service" className="hidden md:table-cell" />,
      cell: ({ row }) => {
        const service = row.original.service
        const serviceName = isObject(service) ? service.name : (typeof service === 'string' ? service : "N/A")
        const isTelemed = isObject(service) ? !!(service as any).telemed_service : false
        const initials = getInitials(serviceName)
        const serviceAvatarRaw =
          (service as any)?.serviceImage ||
          (service as any)?.image ||
          (service as any)?.logo ||
          (service as any)?.meta?.profilePicture ||
          (service as any)?.meta?.avatar ||
          (service as any)?.meta?.serviceImage
        const serviceAvatar = toSafeImageSrc(serviceAvatarRaw)

        return (
          <div className="hidden md:flex items-center gap-3 min-w-[180px]">
            <div className="relative flex shrink-0">
              <SafeAvatar
                src={serviceAvatar}
                alt={serviceName}
                fallback={initials}
                className="h-9 w-9 flex-shrink-0"
              />
              {isTelemed && (
                <div 
                  className="absolute -top-1.5 -left-1.5 bg-background rounded-full p-[1px] shadow-sm ring-1 ring-border/50"
                  title="Telemedicine Service"
                >
                  <div className="bg-blue-500/10 rounded-full w-[16px] h-[16px] flex items-center justify-center">
                    <Video className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                  </div>
                </div>
              )}
            </div>
            <span className="text-sm font-medium">{serviceName}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true
        return getReferenceId(row.original.service ?? row.original.serviceId) === value
      }
    },
    {
      accessorKey: "appointmentCharge",
      id: "Charges",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Charges" className="hidden lg:table-cell" />,
      cell: ({ row }) => {
        const appt = row.original
        const service = appt.service
        const fallbackServiceCharge = Number((isObject(service) ? service.charges : 0) || 0)
        const charge = Number(appt.appointmentCharge ?? fallbackServiceCharge)
        return <span className="hidden lg:inline-block text-sm font-semibold">{formatCurrency(charge)}</span>
      },
    },
    {
      accessorKey: "paymentMode",
      id: "Payment Mode",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Payment Mode" className="hidden sm:table-cell" />,
      cell: ({ row }) => <span className="hidden sm:inline-block text-sm">{getPaymentModeLabel(row.original.paymentMode || "") || 'N/A'}</span>,
    },
    {
      accessorKey: "status.id",
      id: "Status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        return <StatusBadge status={status?.label || "booked"} />
      },
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true
        const statusId = row.original.status?.id?.toLowerCase() || ""
        if (value === "checkout") {
          return statusId.includes("checkout") || statusId.includes("check_out") || statusId.includes("check-out") || statusId.includes("chekout")
        }
        return statusId === value
      }
    },
    {
      id: "doctorId",
      accessorFn: (row) => getReferenceId(row.doctor ?? row.doctorId),
      enableHiding: false,
      header: () => null,
      cell: () => null,
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true
        return getReferenceId(row.original.doctor ?? row.original.doctorId) === value
      }
    },
    {
      id: "clinicId",
      accessorFn: (row) => getReferenceId(row.clinic ?? row.clinicId),
      enableHiding: false,
      header: () => null,
      cell: () => null,
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true
        return getReferenceId(row.original.clinic ?? row.original.clinicId) === value
      }
    },
    {
      accessorKey: "createdAt",
      id: "Created At",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" className="hidden xl:table-cell" />,
      cell: ({ row }) => <span className="hidden xl:inline-block">{row.original.createdAt}</span>,
      enableHiding: true,
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <AppointmentActions
          appointment={row.original}
          onAddAppointment={onAddAppointment}
          onUpdateAppointment={onUpdateAppointment}
          onDeleteAppointment={onDeleteAppointment}
        />
      ),
    },
  ]

  if (role === "patient") {
    const patientFilteredColumns = columns.filter((col) => col.id !== "Patient")
    const doctorAndClinicColumns: ColumnDef<Appointment>[] = [
      {
        id: "Doctor",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Doctor" />,
        accessorKey: "doctor.fullName",
        cell: ({ row }) => {
          const doctor = row.original.doctor
          const doctorName = isObject(doctor) ? doctor.fullName : (typeof doctor === 'string' ? doctor : "N/A")
          const doctorEmail = isObject(doctor) ? (doctor as any).email : ""
          const initials = getInitials(doctorName)
          const doctorAvatarRaw =
            (doctor as any)?.meta?.profilePicture ||
            (doctor as any)?.meta?.avatar ||
            (doctor as any)?.profilePicture ||
            (doctor as any)?.avatar
          const doctorAvatar = toSafeImageSrc(doctorAvatarRaw)

          return (
            <div className="flex items-center gap-3 min-w-[180px]">
              <SafeAvatar
                src={doctorAvatar}
                alt={doctorName}
                fallback={initials}
                className="h-10 w-10 flex-shrink-0"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{doctorName}</span>
                {doctorEmail && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {doctorEmail}
                  </span>
                )}
              </div>
            </div>
          )
        },
      },
      {
        id: "Clinic",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Clinic" />,
        accessorKey: "clinic.name",
        cell: ({ row }) => {
          const initialClinic = row.original.clinic
          const clinicId = getReferenceId(initialClinic ?? row.original.clinicId) || ""
          const { data } = useClinic(clinicId)
          const clinic = data || initialClinic
          const isClinicObject = clinic && typeof clinic === "object"
          const name = isClinicObject ? clinic.name : typeof clinic === "string" ? clinic : "N/A"
          const email = isClinicObject ? (clinic as any).email : ""
          const avatar = isClinicObject ? clinic.cliniclogo : null
          const avatarSrc = toSafeImageSrc(avatar)
          const initials = getInitials(name)

          return (
            <div className="flex items-center gap-3 min-w-[180px]">
              <SafeAvatar
                src={avatarSrc}
                alt={name}
                fallback={initials}
                className="h-10 w-10 flex-shrink-0"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{name}</span>
                {email && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {email}
                  </span>
                )}
              </div>
            </div>
          )
        },
      },
    ]
    return [...doctorAndClinicColumns, ...patientFilteredColumns]
  }
  return columns 
}
