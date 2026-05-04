"use client"

import { ProfessionalErrorLayout } from "@/components/professional-error-layout"
import { ShieldAlert } from "lucide-react"

export function ForbiddenError() {
  return (
    <ProfessionalErrorLayout
      code="403"
      title="Access Denied"
      description="You don't have the necessary administrative privileges to view this specific medical module. Please contact your administrator if you believe this is an error."
      icon={ShieldAlert}
    />
  )
}
