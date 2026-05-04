"use client"

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  BarChart3 
} from "lucide-react"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import * as React from "react"
import { useAuthRole } from "@/hooks/use-auth-role"
import { useDashboardStats } from "@/hooks/api/use-dashboard"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"
import { usePermissions } from "@/hooks/use-permissions"
import type { DashboardCard } from "@/types/dashboard.types"

const METRIC_PERMISSION_MAP: Record<string, string> = {
  total_revenue: "dashboard_total_revenue",
  active_patients: "dashboard_total_patient",
  total_patients: "dashboard_total_patient",
  total_appointments: "dashboard_total_appointment",
  todays_appointments: "dashboard_total_appointment",
  total_services: "dashboard_total_service",
  active_services: "dashboard_total_service",
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString()
}

function getMetricIcon(cardKey: string) {
  switch (cardKey) {
    case "total_revenue":
      return DollarSign
    case "active_patients":
    case "total_patients":
      return Users
    case "total_appointments":
    case "todays_appointments":
      return ShoppingCart
    case "total_services":
    case "active_services":
    default:
      return BarChart3
  }
}

function isCurrencyMetric(cardKey: string) {
  return cardKey === "total_revenue" || cardKey === "bill_charges"
}

function toUiMetric(
  card: DashboardCard,
  formatCurrency: (value: number, options?: { decimals?: number }) => string
) {
  const Icon = getMetricIcon(card.key)
  const trend = card.growthPercentage >= 0 ? "up" : "down"
  const change = `${card.growthPercentage >= 0 ? "+" : ""}${card.growthPercentage}%`

  const currentValue = isCurrencyMetric(card.key)
    ? formatCurrency(card.currentMonth)
    : formatNumber(card.currentMonth)
  const previousValue = isCurrencyMetric(card.key)
    ? formatCurrency(card.previousMonth)
    : formatNumber(card.previousMonth)

  return {
    key: card.key,
    title: card.label,
    value: currentValue,
    description: "This month",
    change,
    trend,
    icon: Icon,
    footer: trend === "up" ? "Trending up this month" : "Trending down this month",
    subfooter: `Last month: ${previousValue}`,
  }
}

export function MetricsOverview() {
  const { role, isRoleReady } = useAuthRole()
  const { data, isLoading } = useDashboardStats(isRoleReady)
  const { formatCurrencyCompact } = useCurrencyFormatter(true)
  const { can, isLoading: isPermissionsLoading } = usePermissions()

  const cards = data?.cards ?? []
  const metrics = React.useMemo(() => {
    if (isPermissionsLoading) return []
    return cards
      .filter((card) => {
        const permissionKey = METRIC_PERMISSION_MAP[card.key]
        if (permissionKey) {
          return can(permissionKey)
        }
        return true
      })
      .slice(0, 4)
      .map((card) => toUiMetric(card, formatCurrencyCompact))
  }, [cards, can, isPermissionsLoading, formatCurrencyCompact])

  if (isLoading || isPermissionsLoading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="cursor-pointer">
            <CardHeader>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-32" />
              <CardAction>
                <Skeleton className="h-6 w-16 rounded-full" />
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (!metrics.length) {
    return null
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
      {metrics.map((metric) => {
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown
        
        return (
          <Card key={metric.title}>
            <CardHeader>
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metric.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendIcon className="h-4 w-4" />
                  {metric.change}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {metric.footer} <TrendIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">
                {metric.subfooter}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
