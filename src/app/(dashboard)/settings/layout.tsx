"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Settings, CalendarDays, UserRound, Bell, PlugZap, CreditCard, Wrench } from "lucide-react"
import { useState } from "react"
import { useAuthRole } from "@/hooks/use-auth-role"
import { getSettingsNavForRole } from "@/config/roleConfig"

type SettingsSubItem = {
  key: string
  label: string
}

type SettingsCategory = {
  title: string
  value: string
  href: string
  matchPrefixes?: string[]
  icon: React.ComponentType<{ className?: string }>
  subItems: SettingsSubItem[]
  count?: number
}

const CATEGORY_NAV = [
  {
    title: "General",
    value: "general-setting",
    href: "/settings/general-setting",
    icon: Settings,
    subItems: [
      { key: "general-setting", label: "General Settings" },
      { key: "configurations-setting", label: "Configuration Settings" },
      { key: "listing", label: "Listing Settings" },
    ],
  },
  {
    title: "Schedule",
    value: "schedule-setting",
    href: "/settings/schedule-setting",
    matchPrefixes: ["/settings/schedule-setting", "/settings/holidays"],
    icon: CalendarDays,
    subItems: [
      { key: "appointment-setting", label: "Appointment Settings" },
      { key: "holidays", label: "Holidays" },
    ],
  },
  {
    title: "Notifications",
    value: "notifications-setting",
    href: "/settings/notifications-setting",
    icon: Bell,
    subItems: [
      { key: "notification-setting", label: "Notification Settings" },
      { key: "email-template", label: "Email Template Settings" },
      { key: "sms-whatsapp", label: "SMS / WhatsApp Settings" },
      { key: "custom-notification", label: "Custom Notification Settings" },
    ],
  },
  {
    title: "Integration",
    value: "integrations-setting",
    href: "/settings/integrations-setting",
    matchPrefixes: ["/settings/integrations-setting", "/settings/google-event-template", "/settings/google-meet", "/settings/zoom-telemed", "/settings/google-configuration"],
    icon: PlugZap,
    subItems: [
      { key: "google-configuration", label: "Google Configuration" },
      { key: "google-event-template", label: "Google Event Template Settings" },
      { key: "google-meet", label: "Google Meet Settings" },
      { key: "zoom-telemed", label: "Zoom Telemed Settings" },
    ],
  },
  {
    title: "Payment",
    value: "payment-setting",
    href: "/settings/payment-setting",
    matchPrefixes: ["/settings/payment-setting"],
    icon: CreditCard,
    subItems: [
      { key: "paylater", label: "Paylater" },
      { key: "paypal", label: "Paypal" },
      { key: "razorpay", label: "Razorpay" },
      { key: "stripe", label: "Stripe" },
    ],
  },
  {
    title: "SEO",
    value: "seo-setting",
    href: "/settings/seo-setting",
    icon: Search,
    subItems: [
      { key: "seo-setting", label: "SEO Settings" },
    ],
  },
  {
    title: "Advanced Settings",
    value: "advanced-setting",
    href: "/settings/advanced-setting",
    matchPrefixes: ["/settings/advanced-setting"],
    icon: Wrench,
    subItems: [
      { key: "clinic-admin", label: "Clinic Admin" },
      { key: "receptionist", label: "Receptionist" },
      { key: "doctor", label: "Doctor" },
      { key: "patient", label: "Patient" },
    ],
  },
].map((item: SettingsCategory) => ({
  ...item,
  count: item.subItems.length,
}))

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const { role } = useAuthRole()

  const filteredNav = React.useMemo(() => {
    if (!role) return []
    // Cast to unknown first to safely convert between incompatible structures
    const base = getSettingsNavForRole(role, CATEGORY_NAV as any) as unknown as SettingsCategory[]
    // Recalculate counts based on filtered subItems
    return base.map(item => ({
      ...item,
      count: item.subItems.length
    }))
  }, [role])

  const selectedCategory = React.useMemo(() => {
    const matched = filteredNav.find((item) => {
      const prefixes = item.matchPrefixes?.length ? item.matchPrefixes : [item.href]
      return prefixes.some((p) => pathname.startsWith(p))
    })
    return matched?.title ?? "General Settings"
  }, [pathname, filteredNav])

  const handleSettingsSearch = React.useCallback(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return

    const matchedCategory = filteredNav.find((category) =>
      category.title.toLowerCase().includes(query)
    )
    if (matchedCategory) {
      router.push(matchedCategory.href)
      return
    }

    for (const category of filteredNav) {
      const matchedSubItem = category.subItems.find(
        (subItem) =>
          subItem.label.toLowerCase().includes(query) || subItem.key.toLowerCase().includes(query)
      )
      if (matchedSubItem) {
        router.push(`${category.href}?tab=${matchedSubItem.key}`)
        return
      }
    }
  }, [searchQuery, router, filteredNav])

  return (
    <div className="grid min-h-[calc(100vh-11.5rem)] min-w-0 grid-cols-1 gap-6 px-4 lg:grid-cols-6 lg:px-6 xl:grid-cols-4">
      {/* Left Sub-Navigation */}
      <Card className="h-full min-w-0 lg:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Settings</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search Settings..." 
              className="pl-10 cursor-pointer"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSettingsSearch()
                }
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredNav.map((category) => (
            <div
              key={category.title}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors group",
                selectedCategory === category.title && "bg-muted"
              )}
              onClick={() => router.push(category.href)}
            >
              <div className="flex items-center gap-2">
                <category.icon className="h-4 w-4" />
                <span className="font-medium">{category.title}</span>
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "transition-colors",
                  selectedCategory === category.title ? "bg-background text-foreground" : "bg-muted/60 text-muted-foreground"
                )}
              >
                <span className="text-xs">{category.count}</span>
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="h-full min-w-0 lg:col-span-4 xl:col-span-3">
        <Card className="h-full min-w-0 overflow-hidden">
          <CardContent className="h-full px-4 pb-6 pt-0 sm:px-6">
            {/*
              Native overflow (not ScrollArea) so tables inside accordions can scroll horizontally
              on narrow viewports — Radix ScrollArea viewport clips nested overflow-x.
            */}
            <div className="max-h-[calc(100vh-16rem)] min-h-0 min-w-0 overflow-x-auto overflow-y-auto pr-2 [-webkit-overflow-scrolling:touch]">
              <div className="min-w-0 pb-4 max-lg:pb-20">
                {children}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
