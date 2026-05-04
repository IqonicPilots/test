"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  label,
  items,
}: {
  label: string
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }[]
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { closeMobileSidebarForNavigation } = useSidebar()

  const closeSidebarOnMobile = () => {
    closeMobileSidebarForNavigation()
  }

  const isItemActive = (url: string) => {
    if (!url || url === "#") return false

    const [baseUrl, queryStr] = url.split("?")

    // Keep sidebar "Settings" active for any route inside /settings/*
    if (baseUrl === "/settings/general-setting") {
      return pathname.startsWith("/settings")
    }

    // Encounters list — active for /encounters and nested routes (e.g. /encounters/add?encounterId=…)
    if (baseUrl === "/encounters") {
      return pathname === "/encounters" || pathname.startsWith("/encounters/")
    }

    // Encounter templates — active for /encounter-templates and nested paths
    if (baseUrl === "/encounter-templates") {
      return (
        pathname === "/encounter-templates" ||
        pathname.startsWith("/encounter-templates/")
      )
    }

    // Check base path match
    if (pathname !== baseUrl) return false

    // If there's a query string in the item URL, it must match the current search params
    if (queryStr) {
      const itemParams = new URLSearchParams(queryStr)
      let allMatch = true
      itemParams.forEach((value, key) => {
        if (searchParams?.get(key) !== value) {
          allMatch = false
        }
      })
      return allMatch
    }

    // Default to base path match
    return true
  }

  // Check if any subitem is active to determine if parent should be open
  const shouldBeOpen = (item: typeof items[0]) => {
    if (item.isActive) return true
    if (isItemActive(item.url)) return true
    return item.items?.some(subItem => isItemActive(subItem.url)) || false
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title + pathname}
            asChild
            defaultOpen={shouldBeOpen(item)}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className="cursor-pointer"
                      isActive={shouldBeOpen(item)}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild className="cursor-pointer" isActive={isItemActive(subItem.url)}>
                            <Link
                              href={subItem.url}
                              onClick={closeSidebarOnMobile}
                              target={(item.title === "Auth Pages" || item.title === "Errors") ? "_blank" : undefined}
                              rel={(item.title === "Auth Pages" || item.title === "Errors") ? "noopener noreferrer" : undefined}
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuButton asChild tooltip={item.title} className="cursor-pointer" isActive={isItemActive(item.url)}>
                  <Link
                    href={item.url}
                    onClick={closeSidebarOnMobile}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
