"use client"

import * as React from "react"
import {
  CreditCard,
  EllipsisVertical,
  LogOut,
  BellDot,
  CircleUser,
  Star,
} from "lucide-react"
import Link from "next/link"

import { useLogout } from "@/hooks/api/use-auth"
import { useProfile } from "@/hooks/api/use-profile"
import { getStoredAuthSession, saveAuthSession } from "@/lib/auth-session"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return "KC"
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase()
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase() || "KC"
}

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const logout = useLogout()
  const { data: profile } = useProfile()

  const profileName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") : ""
  const displayName = profileName || user.name
  const displayEmail = profile?.email || user.email
  const pictureFromApi = profile?.meta?.profilePicture?.trim() || profile?.meta?.avatar?.trim() || ""
  const avatarSrc = profile ? pictureFromApi : (user.avatar?.trim() || "")

  React.useEffect(() => {
    if (!profile) return

    const session = getStoredAuthSession()
    if (!session?.user) return

    const currentName = [profile.firstName, profile.lastName].filter(Boolean).join(" ")
    const currentAvatar = profile.meta?.profilePicture?.trim() || profile.meta?.avatar?.trim() || ""
    
    const needsUpdate = 
      (currentName && session.user.name !== currentName) || 
      (profile.email && session.user.email !== profile.email) || 
      session.user.avatar !== currentAvatar

    if (needsUpdate) {
      saveAuthSession({
        ...session,
        user: {
          ...session.user,
          name: currentName || session.user.name,
          email: profile.email || session.user.email,
          avatar: currentAvatar,
        },
      })
    }
  }, [profile])

  const initials = userInitials(displayName)

  const handleLogout = React.useCallback(() => {
    const refreshToken = getStoredAuthSession()?.refreshToken
    logout.mutate(refreshToken ? { refreshToken } : undefined)
  }, [logout])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="hover:!bg-transparent hover:!text-current active:!bg-transparent active:!text-current data-[state=open]:!bg-transparent cursor-pointer transition-none"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarSrc || undefined} alt="" className="object-cover" />
                <AvatarFallback className="text-xs font-medium bg-primary text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {displayEmail}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarSrc || undefined} alt="" className="object-cover" />
                  <AvatarFallback className="rounded-lg text-xs font-medium">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {displayEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/account">
                  <CircleUser />
                  Account
                </Link>
              </DropdownMenuItem>
              {profile?.role === "admin" && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings/payment-setting">
                    <CreditCard />
                    Payment
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/notifications">
                  <BellDot />
                  Notifications
                </Link>
              </DropdownMenuItem>
              {profile?.role === "doctor" && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/doctor-reviews">
                    <Star />
                    Reviews
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={logout.isPending}
              onSelect={(event) => {
                event.preventDefault()
                handleLogout()
              }}
            >
              <LogOut />
              {logout.isPending ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
