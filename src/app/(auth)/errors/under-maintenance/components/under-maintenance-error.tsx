"use client"

import { ProfessionalErrorLayout } from "@/components/professional-error-layout"
import { Wrench } from "lucide-react"

export function UnderMaintenanceError() {
  return (
    <ProfessionalErrorLayout
      code="503"
      title="Service Unavailable"
      description="The service is temporarily unavailable. Please try again later."
      icon={Wrench}
    />
  )
}
