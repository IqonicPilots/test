"use client"

import { useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthRole } from "@/hooks/use-auth-role"
import { useDashboardStats } from "@/hooks/api/use-dashboard"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"
import { ChartExportMenu } from "./chart-export-menu"

const chartConfig = {
  sales: {
    label: "Revenue",
    color: "var(--primary)",
  },
}

export function SalesChart() {
  const chartId = "sales-performance-chart"
  const { role, isRoleReady } = useAuthRole()
  const isAllowed = role === "admin" || role === "clinic_admin" || role === "doctor"
  const [timeRange, setTimeRange] = useState<"3m" | "6m" | "12m">("3m")
  const months = timeRange === "3m" ? 3 : timeRange === "6m" ? 6 : 12
  const { data, isLoading } = useDashboardStats(isRoleReady && isAllowed)
  const { formatCurrencyCompact } = useCurrencyFormatter(true)

  if (!isAllowed) {
    return null
  }

  if (isLoading) {
    return (
      <Card className="">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Sales Performance</CardTitle>
            <CardDescription>Monthly revenue</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-6">
          <div className="px-6 pb-6">
            <Skeleton className="h-[350px] w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const allSalesPerformance = data?.salesPerformance ?? []
  const salesData = allSalesPerformance
    .slice(-months)
    .map((p) => ({
      month: p.month,
      sales: Number(p.revenue || 0),
    }))

  return (
    <Card className="h-auto md:h-[500px]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <CardTitle>Sales Performance</CardTitle>
          <CardDescription>Monthly revenue</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as "3m" | "6m" | "12m")}
          >
            <SelectTrigger className="w-40 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m" className="cursor-pointer">Last 3 months</SelectItem>
              <SelectItem value="6m" className="cursor-pointer">Last 6 months</SelectItem>
              <SelectItem value="12m" className="cursor-pointer">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <ChartExportMenu 
            chartId={chartId}
            data={salesData}
            filename="sales_performance"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-6">
        <div className="px-6 pb-6" id={chartId}>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={true}
                tickMargin={10}
                className="text-xs"
                tick={{ fontSize: 12, fill: "var(--foreground)" }}
              />
              <YAxis 
                axisLine={false}
                tickLine={true}
                tickMargin={5}
                className="text-xs"
                tick={{ fontSize: 12, fill: "var(--foreground)" }}
                tickFormatter={(value: number) => formatCurrencyCompact(value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex flex-1 justify-between leading-none">
                        <span className="text-muted-foreground">{String(name)}</span>
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {formatCurrencyCompact(Number(value || 0))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="sales"
                stackId="2"
                stroke="var(--color-sales)"
                fill="url(#colorSales)"
                strokeWidth={1}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
