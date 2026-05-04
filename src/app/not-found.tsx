"use client"

import { ProfessionalErrorLayout } from "@/components/professional-error-layout"
import { Search } from "lucide-react"

export default function NotFound() {
  return (
    <ProfessionalErrorLayout
      code="404"
      title="Page Not Found"
      description="The page you’re looking for might have been removed, renamed, or is temporarily unavailable."
      icon={Search}
      isDashboard={false}
    />
  )
}
