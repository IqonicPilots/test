"use client"

import { ProfessionalErrorLayout } from "@/components/professional-error-layout"
import { AlertTriangle } from "lucide-react"

export function InternalServerError() {
  return (
    <ProfessionalErrorLayout
      code="500"
      title="Internal Server Error"
      description="Something went wrong on our end. Please try again in a moment."
      icon={AlertTriangle}
    />
  )
}
