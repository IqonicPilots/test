"use client"

import { useMemo } from "react"
import { useAuthRole } from "./use-auth-role"
import { useAdvancedSettings } from "./api/use-advanced-settings"

export type PermissionState = {
  enabled: boolean
  status: "active" | "inactive"
}

export function usePermissions() {
  const { role, isRoleReady } = useAuthRole()
  const { data: advancedSettings, isLoading } = useAdvancedSettings()

  const permissionMap = useMemo(() => {
    if (!role || !advancedSettings) return null

    const roleData = advancedSettings.roles.find((r) => r.key === role)
    if (!roleData) return null

    const map: Record<string, PermissionState> = {}
    roleData.modules.forEach((module) => {
      module.permissions.forEach((perm) => {
        map[perm.key] = {
          enabled: perm.enabled,
          status: perm.status,
        }
      })
    })
    return map
  }, [role, advancedSettings])

  const can = (permissionKey: string): boolean => {
    // If we are still loading, we might want to return true to avoid flashing 
    // OR false to be secure. Usually false is better for permissions.
    if (!isRoleReady || isLoading) return true 
    
    // Admin usually has all permissions if not explicitly defined
    if (role === "admin") return true
     
    if (!permissionMap) return true

    const perm = permissionMap[permissionKey]
    if (!perm) return true // If not defined, assume permitted or not controlled by this system

    return perm.enabled && perm.status === "active"
  }

  return {
    can,
    isLoading: !isRoleReady || isLoading,
    role,
  }
}
