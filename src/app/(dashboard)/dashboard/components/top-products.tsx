"use client"

import { Eye, Star, TrendingDown, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

import { useAuthRole } from "@/hooks/use-auth-role"
import { useDashboardStats } from "@/hooks/api/use-dashboard"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"

type Row = {
  id: string
  title: string
  category: string
  rating: number | null
  countLabel: string
  revenue: string
  growth: number
}

export function TopProducts() {
  const { role, isRoleReady } = useAuthRole()
  const { data, isLoading } = useDashboardStats(isRoleReady)
  const { formatCurrency } = useCurrencyFormatter(true)

  const rows: Row[] =
    role === "doctor"
      ? (data?.topServices ?? []).slice(0, 5).map((s, index) => ({
          id: s.serviceId || `service-${index}`,
          title: s.serviceName || "Service",
          category: "Service",
          rating: null,
          countLabel: `${Number(s.totalAppointmentCount || 0)} appointments`,
          revenue: formatCurrency(Number(s.revenue || 0)),
          growth: Number(s.growthPercentage || 0),
        }))
      : (data?.topDoctors ?? []).slice(0, 5).map((d, index) => ({
          id: d.doctorId || `doctor-${index}`,
          title: d.doctorName || "Doctor",
          category: "Doctor",
          rating: d.rating != null && Number.isFinite(Number(d.rating)) ? Number(d.rating) : null,
          countLabel: `${Number(d.totalAppointmentCount || 0)} appointments`,
          revenue: formatCurrency(Number(d.revenue || 0)),
          growth: Number(d.growthPercentage || 0),
        }))

  if (isLoading) {
    return (
      <Card className="h-[500px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{role === "doctor" ? "Top Services" : "Top Doctors"}</CardTitle>
            <CardDescription>
              {role === "doctor"
                ? "Best performing services this month"
                : "Most booked doctors this month"}
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <Link href={role === "doctor" ? "/services" : "/doctors"}>
            <Eye className="h-4 w-4 mr-2" />
            View All
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center p-3 rounded-lg border gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex items-center justify-between flex-1 gap-3">
                <div className="space-y-2 min-w-0">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-4 w-24 ml-auto" />
                  <Skeleton className="h-3 w-28 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-auto md:h-[500px]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <CardTitle>{role === "doctor" ? "Top Services" : "Top Doctors"}</CardTitle>
          <CardDescription>
            {role === "doctor"
              ? "Best performing services this month"
              : "Most booked doctors this month"}
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="cursor-pointer">
          <Link href={role === "doctor" ? "/services" : "/doctors"}>
            <Eye className="h-4 w-4" />
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row, index) => {
          const isUp = row.growth >= 0
          const TrendIcon = isUp ? TrendingUp : TrendingDown
          const growthLabel = `${isUp ? "+" : ""}${row.growth}%`
          const rowKey = `${row.id}-${index}`

          return (
          <div key={rowKey} className="flex items-center p-3 rounded-lg border gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                #{index + 1}
              </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-1 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate max-w-[120px] xs:max-w-none">{row.title}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {row.rating != null ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">{row.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">•</span>
                    </>
                  ) : null}
                  <span className="text-xs text-muted-foreground truncate">{row.countLabel}</span>
                </div>
              </div>
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{row.revenue}</p>
                  <Badge
                    variant="outline"
                    className={
                      isUp
                        ? "text-green-600 border-green-600 font-semibold h-5 text-[10px] px-1.5"
                        : "text-red-600 border-red-600 font-semibold h-5 text-[10px] px-1.5"
                    }
                  >
                    <TrendIcon className="h-3 w-3" />
                    {growthLabel}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )})}
        {rows.length === 0 && (
          <div className="flex items-center justify-center p-3 rounded-lg gap-2 h-[380px]">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
