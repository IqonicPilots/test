"use client"

import { useAuthRole } from "@/hooks/use-auth-role"
import { usePermissions } from "@/hooks/use-permissions"
import { ForbiddenError } from "@/app/(auth)/errors/forbidden/components/forbidden-error"
import { UnauthorizedError } from "@/app/(auth)/errors/unauthorized/components/unauthorized-error"
import { UserRole } from "@/types/auth.types"
import { Skeleton } from "@/components/ui/skeleton"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  permission?: string
  fallback?: "forbidden" | "unauthorized"
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  permission,
  fallback = "forbidden" 
}: RoleGuardProps) {
  const { role, isRoleReady } = useAuthRole()
  const { can, isLoading: isPermissionsLoading } = usePermissions()

  if (!isRoleReady || (permission && isPermissionsLoading)) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  // If no specific restrictions are provided, allow access if role is initialized
  if (!permission && !allowedRoles && role) {
    return <>{children}</>
  }

  // Grant if specific permission matches
  if (permission && can(permission)) {
    return <>{children}</>
  }

  // Grant if role matches
  if (role && allowedRoles && allowedRoles.includes(role)) {
    return <>{children}</>
  }

  // Handle fallback
  if (fallback === "unauthorized") {
    return <UnauthorizedError />
  }

  return <ForbiddenError />
}
