"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, MapPin, TrendingUp, Target, ArrowUpIcon, TrendingDown, UserIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useDashboardStats } from "@/hooks/api/use-dashboard"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"

export function CustomerInsights() {
  const [activeTab, setActiveTab] = useState("growth")
  const { data } = useDashboardStats(true)
  const { currencyPrefix, currencyPostfix, formatCurrencyCompact } = useCurrencyFormatter(true)

  if (data?.role === "receptionist") {
    return null
  }

  const chartConfig = {
    totalPatients: {
      label: "Total Patients",
      color: "var(--chart-1)",
    },
    retentionRate: {
      label: "Retention Rate",
      color: "var(--chart-2)",
      labelSuffix: "%",
    },
    averagePayAmount: {
      label: "Avg. LTV",
      color: "var(--chart-3)",
      labelPrefix: currencyPrefix,
      labelSuffix: currencyPostfix,
    },
  }

  const isDoctor = data?.role === "doctor"
  const growthData = data?.insights?.growth ?? []
  const demographicsData = data?.insights?.demographics ?? []
  const topClinicsData = data?.insights?.topClinics ?? []
  const totalPatients = Number(data?.insights?.totalPatients || 0)
  const retentionRate = Number(data?.insights?.retentionRate || 0)
  const averagePayAmount = Number(data?.insights?.averagePayAmount || 0)

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Customer Insights</CardTitle>
        <CardDescription>Growth, demographics, and top clinics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isDoctor ? "grid-cols-2" : "grid-cols-3"} bg-muted/50 p-1 rounded-lg h-12`}>
            <TabsTrigger
              value="growth"
              className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Growth</span>
            </TabsTrigger>
            <TabsTrigger
              value="demographics"
              className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Demographics</span>
            </TabsTrigger>
            {!isDoctor && (
              <TabsTrigger
                value="topClinics"
                className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
              >
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Top Clinics</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="growth" className="mt-8 space-y-6">
            <div className="grid gap-6">
              {/* Chart and Key Metrics Side by Side */}
              <div className="grid grid-cols-10 gap-6">
                {/* Chart Area - 70% */}
                <div className="col-span-10 xl:col-span-7">
                  <h3 className="text-sm font-medium text-muted-foreground mb-6">Patient Growth Trends</h3>
                  <ChartContainer config={chartConfig} className="h-[375px] w-full">
                    <BarChart data={growthData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: 'var(--border)' }}
                        axisLine={{ stroke: 'var(--border)' }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: 'var(--border)' }}
                        axisLine={{ stroke: 'var(--border)' }}
                        domain={[0, 'dataMax']}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="totalPatients" fill="var(--color-totalPatients)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="retentionRate" fill="var(--color-retentionRate)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="averagePayAmount" fill="var(--color-averagePayAmount)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* Key Metrics - 30% */}
                <div className="col-span-10 xl:col-span-3 space-y-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-6">Key Metrics</h3>
                  <div className="grid grid-cols-3 gap-5">
                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Total Patients</span>
                      </div>
                      <div className="text-2xl font-bold">{totalPatients.toLocaleString()}</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpIcon className="h-3 w-3" />
                        Last 6 months
                      </div>
                    </div>

                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Retention Rate</span>
                      </div>
                      <div className="text-2xl font-bold">{retentionRate.toFixed(2)}%</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpIcon className="h-3 w-3" />
                        From growth data
                      </div>
                    </div>

                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Avg. LTV</span>
                      </div>
                      <div className="text-2xl font-bold">{formatCurrencyCompact(averagePayAmount)}</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpIcon className="h-3 w-3" />
                        Average pay amount
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="demographics" className="mt-8">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="text-left py-3 px-6 font-semibold">Age Group</TableHead>
                    <TableHead className="text-center py-3 px-6 font-semibold">Patients</TableHead>
                    <TableHead className="text-center py-3 px-6 font-semibold">Percentage</TableHead>
                    <TableHead className="text-right py-3 px-6 font-semibold">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demographicsData.map((row, index) => (
                    
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-left font-medium py-4 px-6">{row.age}</TableCell>
                      <TableCell className="text-center py-4 px-6">{Number(row.totalCustomer || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-center py-4 px-6">{Number(row.percentage || 0).toFixed(2)}%</TableCell>
                      <TableCell className="text-right py-4 px-6">
                        <Badge
                          variant="outline"
                          className={`
                            ${Number(row.growth) < 0
                              ? "text-red-600 border-red-900 font-semibold px-1.5"
                              : "text-green-600 border-green-900 font-semibold px-1.5"
                          }`}
                        >
                          {Number(row.growth) > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          <span className={`font-medium ${Number(row.growth) < 0 ? "text-red-600" : "text-green-600"}`}>
                            {Number(row.growth) > 0 ? "+" : ""}
                            {Number(row.growth || 0).toFixed(2)}%
                          </span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {!isDoctor && (
            <TabsContent value="topClinics" className="mt-8">
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="text-left py-3 px-6 font-semibold">Top Clinics</TableHead>
                      <TableHead className="text-center py-3 px-6 font-semibold">Patients</TableHead>
                      <TableHead className="text-center py-3 px-6 font-semibold">Revenue</TableHead>
                      <TableHead className="text-right py-3 px-6 font-semibold">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topClinicsData.map((row, index) => (
                      <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-left py-4 px-6 font-medium">{row.clinicName}</TableCell>
                        <TableCell className="text-center py-4 px-6">{Number(row.totalCustomer || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-center py-4 px-6">{formatCurrencyCompact(Number(row.revenue || 0))}</TableCell>
                        <TableCell className="text-right py-4 px-6">
                          <span className="font-medium">{Number(row.percentage || 0).toFixed(2)}%</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
