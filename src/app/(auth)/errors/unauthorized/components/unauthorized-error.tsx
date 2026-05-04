"use client"

import { ProfessionalErrorLayout } from "@/components/professional-error-layout"
import { Lock } from "lucide-react"

export function UnauthorizedError() {
  return (
    <ProfessionalErrorLayout
      code="401"
      title="Unauthorized"
      description="Please log in to continue."
      icon={Lock}
    />
  )
}
