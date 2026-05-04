"use client"

import * as React from "react"
// Icons are centralized in roleConfig.
import Link from "next/link"
import Image from "next/image"
import { Logo } from "@/components/logo"

import { getStoredAuthSession, type StoredAuthUser } from "@/lib/auth-session"
import { filterSidebarNavByAccess, getSidebarNavForRole } from "@/config/roleConfig"
import { useAuthRole } from "@/hooks/use-auth-role"
import { useSystemConfig } from "@/hooks/api/use-system-config"
import { usePermissions } from "@/hooks/use-permissions"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const fallbackUser: StoredAuthUser = {
  name: "KiviCare",
  email: "admin@kivicare.com",
  avatar: "",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { role, isRoleReady } = useAuthRole()
  const { data: systemConfig } = useSystemConfig(isRoleReady)
  const { can, isLoading: isPermissionsLoading } = usePermissions()

  const [user, setUser] = React.useState<StoredAuthUser>(() => {
    const storedSession = getStoredAuthSession()
    return storedSession?.user ?? fallbackUser
  })

  React.useEffect(() => {
    const syncUserFromSession = () => {
      const storedSession = getStoredAuthSession()
      if (storedSession?.user) {
        setUser(storedSession.user)
      }
    }

    syncUserFromSession()
    window.addEventListener("kivicare-auth-session-changed", syncUserFromSession)
    return () => window.removeEventListener("kivicare-auth-session-changed", syncUserFromSession)
  }, [])

  const navGroups = React.useMemo(() => {
    if (!role || isPermissionsLoading) return []
    const base = getSidebarNavForRole(role)
    return filterSidebarNavByAccess(base, systemConfig?.configuration_settings, can)
  }, [role, systemConfig?.configuration_settings, can, isPermissionsLoading])

  return (
    <Sidebar {...props}>
      {!isRoleReady ? null : (
        <>
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild className="hover:!bg-transparent hover:!text-current active:!bg-transparent active:!text-current transition-none">
                  <Link href="/landing">
                    <Image
                      src="/favicon.png"
                      alt="Kivicare"
                      width={24}
                      height={24}
                      className="hidden size-6 object-contain group-data-[collapsible=icon]:block"
                    />
                    <Logo size={40} className="group-data-[collapsible=icon]:hidden" useConfiguredSize />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            {navGroups.map((group) => (
              <NavMain
                key={group.label}
                label={group.label}
                items={group.items}
              />
            ))}
          </SidebarContent>
          <SidebarFooter>
            <NavUser user={user} />
          </SidebarFooter>
        </>
      )}
    </Sidebar>
  )
}
