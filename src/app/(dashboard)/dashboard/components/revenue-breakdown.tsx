"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import type { PieSectorDataItem } from "recharts/types/polar/Pie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardStats } from "@/hooks/api/use-dashboard"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"
import { ChartExportMenu } from "./chart-export-menu"

const chartConfig = {
  revenue: {
    label: "Revenue",
  },
  amount: {
    label: "Amount",
  },
}

export function RevenueBreakdown() {
  const chartId = "revenue-breakdown-chart"
  const { data, isLoading } = useDashboardStats(true)
  const { formatCurrencyCompact } = useCurrencyFormatter(true)

  const revenueTooltipContent = (
    <ChartTooltipContent
      hideLabel
      formatter={(value, name, item) => {
        const v = value == null || value === "" ? 0 : Number(value)
        const indicatorColor =
          (item as { payload?: { fill?: string }; color?: string })?.payload?.fill ||
          (item as { color?: string })?.color
        return (
          <div className="flex w-full max-w-[220px] items-center justify-between gap-2 leading-none">
            <div className="flex min-w-0 items-center gap-2">
              {indicatorColor ? (
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)"
                  style={
                    {
                      "--color-bg": indicatorColor,
                      "--color-border": indicatorColor,
                    } as React.CSSProperties
                  }
                />
              ) : null}
              <span className="text-muted-foreground truncate">{String(name)}</span>
            </div>
            <span className="shrink-0 text-foreground font-mono font-medium tabular-nums">
              {formatCurrencyCompact(v)}
            </span>
          </div>
        )
      }}
    />
  )
  const serviceColors = React.useMemo(
    () => ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"],
    []
  )
  const revenueData = React.useMemo(() => {
    const rows = data?.services ?? []
    const totalAmount = rows.reduce((sum, item) => sum + Number(item.revenue || 0), 0)
    return rows.map((item, index) => {
      const amount = Number(item.revenue || 0)
      const label = item.serviceName?.trim() || `Service ${index + 1}`
      return {
        serviceId: String(item.serviceId || index),
        serviceName: label,
        value: totalAmount > 0 ? Number(((amount / totalAmount) * 100).toFixed(2)) : 0,
        amount,
        fill: serviceColors[index % serviceColors.length],
      }
    })
  }, [data?.services, serviceColors])

  const [activeService, setActiveService] = React.useState<string>("")

  React.useEffect(() => {
    if (!revenueData.length) {
      setActiveService("")
      return
    }
    if (!revenueData.some((item) => item.serviceName === activeService)) {
      setActiveService(revenueData[0].serviceName)
    }
  }, [revenueData, activeService])

  const activeIndex = React.useMemo(() => {
    const index = revenueData.findIndex((item) => item.serviceName === activeService)
    return index === -1 ? 0 : index
  }, [activeService, revenueData])

  const activeAmount = Number(revenueData[activeIndex]?.amount || 0)
  const activeAmountDigits = Math.trunc(Math.abs(activeAmount)).toString().length
  const centerAmountTextSizeClass =
    activeAmountDigits >= 5 ? "text-[16px]" : activeAmountDigits >= 4 ? "text-xl" : "text-xl"

  const services = React.useMemo(() => revenueData.map((item) => item.serviceName), [revenueData])

  if (isLoading) {
    return (
      <Card data-chart={chartId} className="flex flex-col">
        <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
          <div>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Revenue distribution by services</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-[175px] rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <Skeleton className="mx-auto aspect-square w-full max-w-[300px] rounded-lg" />
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-chart={chartId} className="flex h-auto flex-col md:h-[500px]">
      <ChartStyle id={chartId} config={chartConfig} />
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>Revenue distribution by services</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={activeService} onValueChange={setActiveService} disabled={!services.length}>
            <SelectTrigger
              className="w-[200px] xs:w-[175px] rounded-lg cursor-pointer"
              aria-label="Select a service"
            >
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-lg">
              {services.map((serviceName, index) => {
                return (
                  <SelectItem
                    key={`${serviceName}-${index}`}
                    value={serviceName}
                    className="rounded-md [&_span]:flex cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs xs:text-sm">
                      <span
                        className="flex h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: serviceColors[index % serviceColors.length],
                        }}
                      />
                      {serviceName}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <ChartExportMenu 
            chartId={chartId}
            data={revenueData.map(({ fill, ...rest }) => rest)}
            filename="revenue_breakdown"
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <div className="flex justify-center" id={chartId}>
            <ChartContainer
              id={chartId}
              config={chartConfig}
              className="mx-auto aspect-square w-full max-w-[300px]"
            >
              <PieChart>
                <ChartTooltip cursor={false} content={revenueTooltipContent} />
                <Pie
                  data={revenueData}
                  dataKey="amount"
                  nameKey="serviceName"
                  innerRadius={60}
                  strokeWidth={5}
                  activeShape={({
                    outerRadius = 0,
                    ...props
                  }: PieSectorDataItem) => (
                    <g>
                      <Sector {...props} outerRadius={outerRadius + 10} />
                      <Sector
                        {...props}
                        outerRadius={outerRadius + 25}
                        innerRadius={outerRadius + 12}
                      />
                    </g>
                  )}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className={`fill-foreground ${centerAmountTextSizeClass} font-bold`}
                            >
                              {formatCurrencyCompact(activeAmount)}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Revenue
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>

          <div className="flex flex-col justify-center space-y-4">
            {revenueData.length === 0 ? (
              <div className="text-sm text-muted-foreground">No service revenue data available.</div>
            ) : revenueData.map((item, index) => {
              const isActive = index === activeIndex

              return (
                <div
                  key={`${item.serviceId}-${index}`}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                    isActive ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveService(item.serviceName)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: item.fill,
                      }}
                    />
                    <span className="font-medium">{item.serviceName}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrencyCompact(Number(item.amount || 0))}</div>
                    <div className="text-sm text-muted-foreground">{item.value}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
