"use client"

import { ProfessionalErrorLayout } from "@/components/professional-error-layout"
import { ShieldAlert } from "lucide-react"

export function ForbiddenError() {
  return (
    <ProfessionalErrorLayout
      code="403"
      title="Forbidden / Access Denied"
      description="You don’t have permission to access this page."
      icon={ShieldAlert}
    />
  )
}
