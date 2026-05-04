"use client"

import { useState } from "react"
import { Eye } from "lucide-react"
import Link from "next/link"
import { AppointmentViewDialog } from "@/app/(dashboard)/appointments/components/appointment-view-dialog"
import type { Appointment } from "@/types/appointment.types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthRole } from "@/hooks/use-auth-role"
import { useAppointments } from "@/hooks/use-appointments"
import { useProfile } from "@/hooks/api/use-profile"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"
import { isObject } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"

const formatDate = (dateStr?: string) => {
  const parsedDate = new Date(String(dateStr))
  if (Number.isNaN(parsedDate.getTime())) return ""
  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
const formatTime = (timeStr?: string) => {
  const parsedTime = new Date(`1970-01-01T${timeStr}`)
  if (Number.isNaN(parsedTime.getTime())) return ""
  return parsedTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "NA"
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

function getStatusMeta(status: Appointment["status"]) {
  const rawId = String(status?.id || "").trim().toLowerCase()
  const rawLabel = String(status?.label || "").trim()
  const statusLabel = rawLabel || (rawId ? rawId.replace(/_/g, " ") : "Pending")
  const normalizedLabel = statusLabel
    ? statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1).toLowerCase()
    : "Pending"

  const badgeVariant: "default" | "secondary" | "outline" =
    rawId === "check_in"
      ? "default"
      : rawId === "booked" || rawId === "pending"
        ? "secondary"
        : "outline"

  return { badgeVariant, normalizedLabel }
}

export function PatientUpcomingAppointments() {
  const { role, isRoleReady } = useAuthRole()
  const { data: profile, isLoading: isProfileLoading } = useProfile()
  const { formatCurrency } = useCurrencyFormatter(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const isPatient = role === "patient"
  const isReceptionist = role === "receptionist"
  const profileId = profile?._id

  if (isRoleReady && !isPatient && !isReceptionist) {
    return null
  }

  const { data: appointmentsResponse, isLoading } = useAppointments({
    page: 1,
    perPage: 5,
    patientId: isPatient ? profileId : undefined,
    receptionist: isReceptionist ? profileId : undefined,
    upcoming: true,
    enabled: isRoleReady && Boolean(profileId),
  })

  const showSkeleton =
    !isRoleReady ||
    isProfileLoading ||
    !profileId ||
    isLoading

  if (showSkeleton) {
    return (
      <Card className="cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>
              {isReceptionist
                ? "Next scheduled visits at your clinic(s)"
                : "Your next scheduled appointments"}
            </CardDescription>
          </div>
          <Skeleton className="h-9 w-[108px] rounded-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Skeleton className="h-6 w-[72px] rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const upcoming = appointmentsResponse?.data ?? []
  const visibleRows: Array<Appointment | null> = [
    ...upcoming.slice(0, 5),
    ...Array.from({ length: Math.max(0, 5 - upcoming.length) }, () => null),
  ]

  return (
    <>
      {selectedAppointment ? (
        <AppointmentViewDialog
          appointment={selectedAppointment}
          isOpen={Boolean(selectedAppointment)}
          onOpenChange={(open) => {
            if (!open) setSelectedAppointment(null)
          }}
        />
      ) : null}

      <Card className="h-auto md:h-[500px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col gap-2">
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>
              {isReceptionist
                ? "Next scheduled visits at your clinic(s)"
                : "Your next scheduled appointments"}
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <Link href="/appointments">
              <Eye className="mr-2 h-4 w-4" />
              View All
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {visibleRows.filter(Boolean).length === 0 ? (
            <div className="flex items-center justify-center h-[400px]">
              <p className="text-sm text-muted-foreground">
                No upcoming appointments
              </p>
            </div>
          ) : (
            visibleRows.map((appt) => {
              if (!appt) return null
              const { badgeVariant, normalizedLabel } = getStatusMeta(appt.status)

              const patient = appt.patient
              const doctor = appt.doctor
              const clinic = appt.clinic

              const patientFullName = isObject(patient) ? patient.fullName : (typeof patient === 'string' ? patient : "Patient")
              const doctorFullName = isObject(doctor) ? doctor.fullName : (typeof doctor === 'string' ? doctor : "Doctor")
              const clinicName = isObject(clinic) ? clinic.name : (typeof clinic === 'string' ? clinic : "")

              const primaryName = isReceptionist
                ? patientFullName.trim() || "Patient"
                : `${doctorFullName ? `Dr. ${doctorFullName}` : "Doctor"}${clinicName ? ` • ${clinicName}` : ""}`

              const avatarLabel = isReceptionist
                ? patientFullName.trim() || "Patient"
                : doctorFullName.trim() || "Doctor"

              return (
                <div key={appt._id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                      src={
                        isReceptionist
                          ? (isObject(patient) ? (patient.profilePicture || patient.avatar) : "")
                          : (isObject(doctor) ? (doctor.profilePicture || doctor.avatar) : "")
                      }
                      alt={avatarLabel}
                    />
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">{getInitials(avatarLabel)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{primaryName}</p>
                    <p className="truncate text-xs text-muted-foreground mt-1">
                      {isReceptionist && isObject(patient) && patient.email?.trim()
                        ? `${patient.email} | `
                        : ""}
                      {formatDate(appt.schedule?.startDate || "")} at {formatTime(appt.schedule?.startTime || "")}
                      {!isReceptionist && isObject(appt.service) && appt.service.name ? ` | ${appt.service.name}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(Number(appt.appointmentCharge || (isObject(appt.service) ? appt.service.charges : 0) || 0))}
                    </p>
                    <StatusBadge status={normalizedLabel} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 cursor-pointer"
                      title="View"
                      onClick={() => setSelectedAppointment(appt)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </>
  )
}
