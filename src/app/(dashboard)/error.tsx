"use client"

import { InternalServerError } from "@/app/(auth)/errors/internal-server-error/components/internal-server-error"
import { useEffect } from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <InternalServerError />
    </div>
  )
}
