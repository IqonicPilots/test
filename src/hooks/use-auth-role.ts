"use client"

import { useEffect, useState } from "react"

import { getStoredAuthSession } from "@/lib/auth-session"
import { normalizeUserRole } from "@/config/roleConfig"
import type { UserRole } from "@/types/auth.types"

type UseAuthRoleResult = {
  role: UserRole | null
  isRoleReady: boolean
}

export function useAuthRole(): UseAuthRoleResult {
  const [{ role, isRoleReady }, setRoleState] = useState<UseAuthRoleResult>(() => {
    if (typeof window === "undefined") {
      return { role: null, isRoleReady: false }
    }

    const session = getStoredAuthSession()

    if (!session?.user) {
      return { role: null, isRoleReady: true }
    }

    return {
      role: normalizeUserRole(session.user.role),
      isRoleReady: true,
    }
  })

  useEffect(() => {
    const session = getStoredAuthSession()

    setRoleState({
      role: session?.user ? normalizeUserRole(session.user.role) : null,
      isRoleReady: true,
    })
  }, [])

  return { role, isRoleReady }
}

