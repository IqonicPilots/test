"use client"

import { Badge } from "@/components/ui/badge"
import type { User } from "../use-chat"

function formatRoleClinicLine(user: User): string {
  const roleText = user.roleLabel ?? user.role
  const clinics =
    (user.role === "receptionist" || user.role === "clinic_admin") &&
    user.clinicNames?.length
      ? user.clinicNames.join(" · ")
      : ""
  return clinics ? `${roleText} · ${clinics}` : roleText
}

type ChatUserListMetaProps = {
  user: User
  /** One line (conversation rows). false = badge + optional clinic line (pickers). */
  compact?: boolean
  className?: string
}

export function ChatUserListMeta({
  user,
  compact = false,
  className = "",
}: ChatUserListMetaProps) {
  const roleText = user.roleLabel ?? user.role
  const showClinics =
    (user.role === "receptionist" || user.role === "clinic_admin") &&
    Boolean(user.clinicNames?.length)

  if (compact) {
    return (
      <p
        className={`text-[11px] text-muted-foreground truncate leading-tight ${className}`}
      >
        {formatRoleClinicLine(user)}
      </p>
    )
  }

  return (
    <div className={`space-y-0.5 ${className}`}>
      <div className="flex flex-wrap items-center gap-1">
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0 h-5 font-normal"
        >
          {roleText}
        </Badge>
      </div>
      {showClinics ? (
        <p className="text-xs text-muted-foreground truncate leading-snug">
          {user.clinicNames!.join(" · ")}
        </p>
      ) : null}
    </div>
  )
}
