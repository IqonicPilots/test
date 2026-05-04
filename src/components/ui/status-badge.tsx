import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 dark:bg-emerald-500/15 text-green-600 dark:text-emerald-400 border border-green-400 dark:border-green-500/15",
  "check in": "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-400 dark:border-blue-500/15",
  "check out": "bg-emerald-50 text-green-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-green-400 dark:border-green-500/15",
  checkout: "bg-emerald-50 text-green-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-green-400 dark:border-green-500/15",
  "chek out": "bg-emerald-50 text-green-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-green-400 dark:border-green-500/15",
  chekout: "bg-emerald-50 text-green-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-green-400 dark:border-green-500/15",
  cancelled: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 border border-red-400 dark:border-red-500/15",
  inactive: "bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400 border border-gray-400 dark:border-gray-500/15",
  pending: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-400 dark:border-amber-500/15",
  error: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 border border-red-400 dark:border-red-500/15",
  paid: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-400 dark:border-emerald-500/15",
  unpaid: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 border border-red-400 dark:border-red-500/15",
  available: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-400 dark:border-emerald-500/15",
}

const defaultStyle = "bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400"

interface StatusBadgeProps {
  status: string
  className?: string
}

const labelMap: Record<string, string> = {
  checkout: "Check Out",
  "check out": "Check Out",
  chekout: "Check Out",
  "chek out": "Check Out",
  "check in": "Check In",
  "chek in": "Check In",
  "booked": "Booked",
  "cancelled": "Cancelled",
  "pending": "Pending",
  "active": "Active",
  "inactive": "Inactive",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase()
  const displayLabel = labelMap[normalizedStatus] ?? status
  const style = statusStyles[normalizedStatus] ?? defaultStyle

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
        style,
        className
      )}
    >
      {displayLabel}
    </span>
  )
}
