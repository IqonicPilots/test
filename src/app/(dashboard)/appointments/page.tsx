"use client"

import { AppointmentsCalendarContent } from "./appointments-calendar-content"
import { AppointmentListContent } from "./appointments-list-content"
import { useAuthRole } from "@/hooks/use-auth-role"

import { RoleGuard } from "@/components/role-guard"

export default function AppointmentsPage() {
  const { role } = useAuthRole()

  return (
    <RoleGuard permission="appointment_access" fallback="forbidden">
      {role === "doctor" || role === "receptionist"
        ? <AppointmentsCalendarContent />
        : <AppointmentListContent />
      }
    </RoleGuard>
  )
}
