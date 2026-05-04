"use client"

import { useState, useMemo, useEffect } from "react"
import * as React from "react"
import { useReport } from "@/hooks/api/use-report"
import { useInfiniteClinics } from "@/hooks/api/use-clinics"
import { useInfiniteDoctors } from "@/hooks/api/use-doctors"
import { useAuthRole } from "@/hooks/use-auth-role"
import { useProfile } from "@/hooks/api/use-profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTableInfiniteFilterSelect } from "@/components/common/data-table-filters"
import { RoleGuard } from "@/components/role-guard"
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Label, Sector,
} from "recharts"
import type { PieSectorDataItem } from "recharts"
import { BarChart3, FileJson, FileSpreadsheet, Image as ImageIcon, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePermissions } from "@/hooks/use-permissions"

export default function ReportsPage() {
  const { can } = usePermissions()
  const { role } = useAuthRole()
  const isAdmin = role === "admin"
  const isClinicAdmin = role === "clinic_admin"

  const { data: profile } = useProfile()
  const { currencyPrefix } = useCurrencyFormatter(true)

  const currentYear = new Date().getFullYear()
  const [filters, setFilters] = useState({
    year: currentYear,
    month: undefined as number | undefined,
    clinicId: undefined as string | undefined,
    doctorId: undefined as string | undefined,
  })
  const [activeAppointmentStatus, setActiveAppointmentStatus] = useState("")

  // Get assigned clinic for clinic_admin
  const assignedClinicId = useMemo(() => {
    if (!isClinicAdmin || !profile?.meta?.clinics) return undefined
    const clinic = profile.meta.clinics[0]
    return typeof clinic === 'string' ? clinic : clinic?._id
  }, [isClinicAdmin, profile])

  // Sync assigned clinic to filters
  useEffect(() => {
    if (isClinicAdmin && assignedClinicId && filters.clinicId !== assignedClinicId) {
      setFilters(prev => ({ ...prev, clinicId: assignedClinicId }))
    }
  }, [isClinicAdmin, assignedClinicId, filters.clinicId])

  // Fetch report data
  const { data: reportData, isLoading: isReportLoading } = useReport(filters)

  // Extract the payload robustly
  const reportPayload = useMemo(() => {
    if (!reportData) return null
    return reportData.data || reportData
  }, [reportData])

  const overall = (reportPayload as any)?.clinicRevenueOverall || {}
  const clinicAppts = (reportPayload as any)?.clinicAppointmentCount || []

  const [clinicSearch, setClinicSearch] = useState("")
  const [debouncedClinicSearch, setDebouncedClinicSearch] = useState("")
  const [doctorSearch, setDoctorSearch] = useState("")
  const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedClinicSearch(clinicSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [clinicSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDoctorSearch(doctorSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [doctorSearch])

  const {
    data: clinicsInfiniteData,
    fetchNextPage: fetchNextClinicsPage,
    hasNextPage: hasNextClinicsPage,
    isFetchingNextPage: isFetchingNextClinicsPage,
    isLoading: isClinicsLoading,
  } = useInfiniteClinics(10, { search: debouncedClinicSearch })

  const {
    data: doctorsInfiniteData,
    fetchNextPage: fetchNextDoctorsPage,
    hasNextPage: hasNextDoctorsPage,
    isFetchingNextPage: isFetchingNextDoctorsPage,
    isLoading: isDoctorsLoading,
  } = useInfiniteDoctors(10, {
    search: debouncedDoctorSearch,
    clinicId: filters.clinicId,
    status: "active",
  })

  const clinicOptions = useMemo(() => {
    if (!clinicsInfiniteData) return []
    return clinicsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [clinicsInfiniteData])

  const doctorOptions = useMemo(() => {
    if (!doctorsInfiniteData) return []
    return doctorsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [doctorsInfiniteData])

  // Manage large datasets by showing Top 10 + Others
  const processedClinicData = useMemo(() => {
    const rawData = reportPayload?.clinicRevenueDetail || []
    if (rawData.length <= 10) return rawData

    const sorted = [...rawData].sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    const top10 = sorted.slice(0, 10)
    const others = sorted.slice(10).reduce((acc: any, curr: any) => ({
      clinicName: "Others",
      totalRevenue: acc.totalRevenue + curr.totalRevenue,
      totalBills: acc.totalBills + curr.totalBills
    }), { clinicName: "Others", totalRevenue: 0, totalBills: 0 })

    return [...top10, others]
  }, [reportPayload?.clinicRevenueDetail])

  const processedDoctorData = useMemo(() => {
    const rawData = (reportPayload as any)?.doctorRevenue || []
    if (rawData.length <= 10) return rawData

    const sorted = [...rawData].sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    const top10 = sorted.slice(0, 10)
    const others = sorted.slice(10).reduce((acc: any, curr: any) => ({
      doctorName: "Others",
      totalRevenue: acc.totalRevenue + curr.totalRevenue
    }), { doctorName: "Others", totalRevenue: 0 })

    return [...top10, others]
  }, [reportPayload?.doctorRevenue])

  const processedServiceData = useMemo(() => {
    const rawData = (reportPayload as any)?.serviceRevenue || []
    if (rawData.length <= 10) return rawData

    const sorted = [...rawData].sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    const top10 = sorted.slice(0, 10)
    const others = sorted.slice(10).reduce((acc: any, curr: any) => ({
      name: "Others",
      totalRevenue: acc.totalRevenue + curr.totalRevenue,
      billCount: acc.billCount + curr.billCount
    }), { name: "Others", totalRevenue: 0, billCount: 0 })

    return [...top10, others]
  }, [reportPayload])

  const processedAgeData = useMemo(() => {
    return (reportPayload as any)?.patientAgeDemographics || []
  }, [reportPayload])

  const appointmentSummary = useMemo(() => {
    const summary = {
      checkout: 0,
      booked: 0,
      checkIn: 0,
      cancelled: 0,
      pending: 0,
      total: 0
    }

    if (!clinicAppts.length) return summary

    clinicAppts.forEach((clinic: any) => {
      summary.total += (clinic.totalAppointments || 0)
      if (clinic.monthly && Array.isArray(clinic.monthly)) {
        clinic.monthly.forEach((month: any) => {
          summary.checkout += (month.checkout || 0)
          summary.booked += (month.booked || 0)
          summary.checkIn += (month.checkIn || 0)
          summary.cancelled += (month.cancelled || 0)
          summary.pending += (month.pending || 0)
        })
      }
    })

    return summary
  }, [clinicAppts])

  const years = [currentYear, currentYear - 1, currentYear - 2]
  const months = [
    { value: 0, label: "All Months" },
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]

  const formatCompactSimple = (v: number) => `${currencyPrefix}${Number(v).toLocaleString()}`

  const chartConfig = {
    totalRevenue: { label: "Revenue", color: "var(--primary)" },
    totalBills: { label: "Invoices", color: "var(--muted-foreground)" },
    revenue: { label: "Revenue", color: "var(--primary)" },
    invoices: { label: "Invoices", color: "var(--muted-foreground)" },
    patients: { label: "Patients", color: "var(--chart-2)" },
    completed: { label: "Completed", color: "var(--chart-1)" },
    booked: { label: "Booked", color: "var(--chart-2)" },
    checkIn: { label: "Check-In", color: "var(--chart-3)" },
    cancelled: { label: "Cancelled", color: "var(--chart-4)" },
    pending: { label: "Pending", color: "var(--chart-5)" },
  }

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || !data.length) return
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.json`)
    link.click()
  }

  const exportAsImage = (id: string, format: 'png' | 'jpeg', filename: string) => {
    const container = document.getElementById(id)
    if (!container) return

    const svg = container.querySelector('svg')
    if (!svg) return

    // Clone SVG to modify it without affecting the UI
    const svgClone = svg.cloneNode(true) as SVGSVGElement
    const originalElements = svg.querySelectorAll('*')
    const clonedElements = svgClone.querySelectorAll('*')

    // Inject computed styles into the clone
    clonedElements.forEach((el, i) => {
      const originalEl = originalElements[i]
      const style = window.getComputedStyle(originalEl)

      // Map common color properties from computed style to inline style
      if (style.fill && style.fill !== 'none') (el as SVGElement).style.fill = style.fill
      if (style.stroke && style.stroke !== 'none') (el as SVGElement).style.stroke = style.stroke
      if (style.stopColor) (el as SVGElement).style.stopColor = style.stopColor

      // Ensure fonts are preserved
      if (style.fontSize) (el as SVGElement).style.fontSize = style.fontSize
      if (style.fontFamily) (el as SVGElement).style.fontFamily = style.fontFamily
    })

    // Add explicit dimensions if missing
    const bounds = svg.getBoundingClientRect()
    svgClone.setAttribute('width', bounds.width.toString())
    svgClone.setAttribute('height', bounds.height.toString())

    const svgData = new XMLSerializer().serializeToString(svgClone)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      // Use higher scale for better quality
      const scale = 2
      canvas.width = bounds.width * scale
      canvas.height = bounds.height * scale

      if (ctx) {
        // Clear and fill background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.scale(scale, scale)
        ctx.drawImage(img, 0, 0)

        const dataUrl = canvas.toDataURL(`image/${format}`, 1.0)
        const link = document.createElement('a')
        link.download = `${filename}.${format}`
        link.href = dataUrl
        link.click()
        URL.revokeObjectURL(url)
      }
    }
    img.src = url
  }

  const NoDataMessage = () => (
    <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-muted/20 rounded-2xl bg-muted/5 min-h-[300px]">
      <div className="flex flex-col items-center gap-3 text-center animate-in fade-in zoom-in duration-300">
        <div className="p-3 rounded-full bg-muted/10">
          <BarChart3 className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground/60">No Data Available</p>
          <p className="text-xs text-muted-foreground/50 max-w-[180px]">
            Try adjusting your filters or selecting a different timeframe.
          </p>
        </div>
      </div>
    </div>
  )

  const pieData = useMemo(
    () =>
      [
        { name: "Completed", value: appointmentSummary.checkout, fill: "var(--chart-1)", id: "completed" },
        { name: "Booked", value: appointmentSummary.booked, fill: "var(--chart-2)", id: "booked" },
        { name: "Check-In", value: appointmentSummary.checkIn, fill: "var(--chart-3)", id: "checkIn" },
        { name: "Cancelled", value: appointmentSummary.cancelled, fill: "var(--chart-4)", id: "cancelled" },
        { name: "Pending", value: appointmentSummary.pending, fill: "var(--chart-5)", id: "pending" },
      ].filter((v) => v.value > 0),
    [appointmentSummary]
  )

  useEffect(() => {
    if (pieData.length === 0) {
      setActiveAppointmentStatus("")
      return
    }
    if (!activeAppointmentStatus || !pieData.some((d) => d.name === activeAppointmentStatus)) {
      setActiveAppointmentStatus(pieData[0].name)
    }
  }, [pieData, activeAppointmentStatus])

  const activeApptIndex = useMemo(() => {
    const i = pieData.findIndex((d) => d.name === activeAppointmentStatus)
    return i === -1 ? 0 : i
  }, [pieData, activeAppointmentStatus])

  const totalAppointmentsInChart = pieData.reduce((s, d) => s + d.value, 0)
  const activeApptCount = pieData[activeApptIndex]?.value ?? 0
  const activeApptDigits = Math.trunc(Math.abs(activeApptCount)).toString().length
  const appointmentActiveCenterTextClass =
    activeApptDigits >= 5 ? "text-base" : activeApptDigits >= 4 ? "text-xl" : "text-2xl"

  const appointmentPieTooltip = (
    <ChartTooltipContent
      hideLabel
      className="border-border/60 bg-background/95"
      formatter={(value, name, item) => {
        const n = value == null || value === "" ? 0 : Number(value)
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
            <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-foreground">
              {n}
            </span>
          </div>
        )
      }}
    />
  )

  return (
    <RoleGuard permission="reports_access" fallback="forbidden">
      <div className="flex-1 space-y-6 px-4 md:px-8 pt-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 pt-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground text-sm">
              Track and export your revenue reports and performance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <DataTableInfiniteFilterSelect
                value={filters.clinicId || ""}
                onValueChange={(val) => setFilters(f => ({ ...f, clinicId: val || undefined, doctorId: undefined }))}
                placeholder="Clinic"
                options={clinicOptions.map(c => ({ value: c._id, label: c.name }))}
                onLoadMore={fetchNextClinicsPage}
                onSearchChange={setClinicSearch}
                hasNextPage={hasNextClinicsPage}
                isFetchingNextPage={isFetchingNextClinicsPage}
                isLoading={isClinicsLoading}
                allLabel="All Clinics"
                className="h-9 w-full sm:w-[200px]"
              />
            )}

            <DataTableInfiniteFilterSelect
              value={filters.doctorId || ""}
              onValueChange={(val) => setFilters(f => ({ ...f, doctorId: val || undefined }))}
              placeholder="Doctor"
              options={doctorOptions.map(d => ({ value: d._id, label: (d as any).fullName || `${d.firstName} ${d.lastName}` }))}
              onLoadMore={fetchNextDoctorsPage}
              onSearchChange={setDoctorSearch}
              hasNextPage={hasNextDoctorsPage}
              isFetchingNextPage={isFetchingNextDoctorsPage}
              isLoading={isDoctorsLoading}
              allLabel="All Doctors"
              className="h-9 w-full sm:w-[200px]"
            />

            <Select
              value={filters.year.toString()}
              onValueChange={(val) => setFilters(f => ({ ...f, year: parseInt(val) }))}
            >
              <SelectTrigger className="w-[120px] bg-card border-border/40 rounded-lg h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-lg">
                {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select
              value={(filters.month || 0).toString()}
              onValueChange={(val) => setFilters(f => ({ ...f, month: parseInt(val) === 0 ? undefined : parseInt(val) }))}
            >
              <SelectTrigger className="w-[150px] bg-card border-border/40 rounded-lg h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-lg">
                {months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isReportLoading ? (
          <div className="space-y-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card><CardContent className="h-[350px]"><div className="w-full h-full animate-pulse bg-muted/10 rounded-xl" /></CardContent></Card>
              <Card><CardContent className="h-[350px]"><div className="w-full h-full animate-pulse bg-muted/10 rounded-xl" /></CardContent></Card>
            </div>
            <Card><CardContent className="h-[400px]"><div className="w-full h-full animate-pulse bg-muted/10 rounded-xl" /></CardContent></Card>
          </div>
        ) : (
          <div className="@container/main space-y-6">
            <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
              {/* Revenue Chart */}
              {can("report_revenue") && (
                <Card className="flex flex-col overflow-hidden shadow-md border-muted/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-lg">Revenue Overview</CardTitle>
                      <CardDescription>Monthly financial performance for {filters.year}</CardDescription>
                    </div>
                    {can("reports_export") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuLabel>Export Chart</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => exportAsImage('revenue-chart', 'png', 'revenue_overview')}><ImageIcon className="mr-2 h-4 w-4" /> Download PNG</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportAsImage('revenue-chart', 'jpeg', 'revenue_overview')}><ImageIcon className="mr-2 h-4 w-4" /> Download JPEG</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => downloadCSV(overall.monthly || [], 'revenue_data')}><FileSpreadsheet className="mr-2 h-4 w-4" /> Download CSV</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardHeader>
                  <CardContent className="p-0 pt-2">
                    <div className="px-6 pb-6 pt-4" id="revenue-chart">
                      {(overall.grandTotalRevenue || 0) > 0 ? (
                        <ChartContainer config={chartConfig} className="h-[350px] w-full">
                          <AreaChart data={overall.monthly || []} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-totalRevenue)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-totalRevenue)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                            <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} fontSize={12} tickMargin={12} className="fill-muted-foreground" />
                            <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => formatCompactSimple(v)} className="fill-muted-foreground" />
                            <ChartTooltip
                              cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                              content={
                                <ChartTooltipContent
                                  className="w-48"
                                  formatter={(value, name) => (
                                    <div className="flex flex-1 justify-between gap-4 leading-none items-center py-0.5">
                                      <span className="text-muted-foreground">{String(name)}</span>
                                      <span className="text-foreground font-mono font-bold tabular-nums">
                                        {name === 'Revenue' ? formatCompactSimple(Number(value || 0)) : value}
                                      </span>
                                    </div>
                                  )}
                                />
                              }
                            />
                            <Area type="monotone" dataKey="totalRevenue" name="Revenue" stroke="var(--color-totalRevenue)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 0 }} />
                            <Area type="monotone" dataKey="billCount" name="Invoices" stroke="var(--color-totalBills)" strokeWidth={2} strokeDasharray="4 4" fill="transparent" activeDot={{ r: 4, strokeWidth: 0 }} />
                          </AreaChart>
                        </ChartContainer>
                      ) : (
                        <div className="h-[350px]">
                          <NoDataMessage />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Appointment Distribution */}
              {can("report_appointment") && (
                <Card className="flex flex-col overflow-hidden shadow-sm border-muted/20">
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg">Appointment Distribution</CardTitle>
                      <CardDescription>Distribution of appointments by status</CardDescription>
                    </div>
                    <div className="flex w-full sm:w-auto flex-wrap items-center justify-end gap-2 sm:shrink-0">
                      {can("reports_export") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuLabel>Export Data</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => downloadCSV(pieData, "appointment_status")}>
                              <FileSpreadsheet className="mr-2 h-4 w-4" /> Download CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadJSON(appointmentSummary, "appointment_summary")}>
                              <FileJson className="mr-2 h-4 w-4" /> Download JSON
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 justify-center py-6 px-6">
                    {pieData.length > 0 ? (
                      <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-8">
                        <div className="flex justify-center" id="appointment-distribution-chart">
                          <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square w-full max-w-[300px]"
                          >
                            <PieChart>
                              <ChartTooltip cursor={false} content={appointmentPieTooltip} />
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={60}
                                strokeWidth={4}
                                stroke="var(--background)"
                                activeShape={({
                                  outerRadius = 0,
                                  ...props
                                }: PieSectorDataItem) => (
                                  <g>
                                    <Sector {...props} outerRadius={outerRadius + 6} />
                                    <Sector
                                      {...props}
                                      outerRadius={outerRadius + 20}
                                      innerRadius={outerRadius + 8}
                                      opacity={0.2}
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
                                            className={`fill-foreground font-bold ${appointmentActiveCenterTextClass}`}
                                          >
                                            {activeApptCount}
                                          </tspan>
                                          <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy || 0) + 24}
                                            className="fill-muted-foreground text-[13px]"
                                          >
                                            {activeAppointmentStatus || pieData[activeApptIndex]?.name || "Appointments"}
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
                          {pieData.map((item, index) => {
                            const isActive = index === activeApptIndex
                            const pct =
                              totalAppointmentsInChart > 0
                                ? ((item.value / totalAppointmentsInChart) * 100).toFixed(0)
                                : "0"
                            return (
                              <div
                                key={item.id}
                                className={`flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors ${
                                  isActive ? "bg-muted" : "hover:bg-muted/50"
                                }`}
                                onClick={() => setActiveAppointmentStatus(item.name)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    setActiveAppointmentStatus(item.name)
                                  }
                                }}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span
                                    className="h-3 w-3 shrink-0 rounded-full"
                                    style={{ backgroundColor: item.fill }}
                                  />
                                  <span className="truncate font-medium">{item.name}</span>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="font-bold tabular-nums">{item.value}</div>
                                  <div className="text-sm text-muted-foreground">{pct}%</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[250px] w-full">
                        <NoDataMessage />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <Tabs defaultValue={isAdmin ? "clinics" : "doctors"} className="space-y-6">
              <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex flex-wrap gap-1">
                {isAdmin && can("report_revenue") && <TabsTrigger value="clinics" className="rounded-lg px-6">Clinic Breakdown</TabsTrigger>}
                {can("report_revenue") && <TabsTrigger value="doctors" className="rounded-lg px-6">Doctor Breakdown</TabsTrigger>}
                {can("report_revenue") && <TabsTrigger value="services" className="rounded-lg px-6">Service Breakdown</TabsTrigger>}
                {can("report_patient") && <TabsTrigger value="demographics" className="rounded-lg px-6">Patient Groups</TabsTrigger>}
              </TabsList>

              {isAdmin && can("report_revenue") && (
                <TabsContent value="clinics" className="space-y-6">
                  <Card className="shadow-md border-muted/20 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                      <div>
                        <CardTitle className="text-lg">Revenue by Clinic</CardTitle>
                        <CardDescription>Comparison of revenue and bill counts across clinics</CardDescription>
                      </div>
                      {can("reports_export") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuLabel>Export Layout</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => exportAsImage('clinic-chart', 'png', 'clinic_revenue')}><ImageIcon className="mr-2 h-4 w-4" /> Download PNG</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => downloadCSV(processedClinicData, 'clinic_revenue')}><FileSpreadsheet className="mr-2 h-4 w-4" /> Download CSV</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardHeader>
                    <CardContent className="p-0 pt-4 px-6 pb-6">
                      <div className="h-[400px] w-full" id="clinic-chart">
                        {processedClinicData.length > 0 ? (
                          <ChartContainer config={chartConfig} className="h-full w-full">
                            <BarChart data={processedClinicData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                              <XAxis dataKey="clinicName" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                              <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => formatCompactSimple(v)} />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    formatter={(value, name) => (
                                      <div className="flex flex-1 justify-between gap-4 leading-none">
                                        <span className="text-muted-foreground">{String(name)}</span>
                                        <span className="text-foreground font-mono font-medium">
                                          {typeof value === 'number' && name === 'Revenue' ? formatCompactSimple(value) : value}
                                        </span>
                                      </div>
                                    )}
                                  />
                                }
                              />
                              <ChartLegend content={<ChartLegendContent />} />
                              <Bar dataKey="totalRevenue" name="Revenue" fill="var(--color-totalRevenue)" radius={[6, 6, 0, 0]} barSize={40} />
                              <Bar dataKey="totalBills" name="Invoices" fill="var(--color-totalBills)" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                          </ChartContainer>
                        ) : (
                          <NoDataMessage />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {can("report_revenue") && (
                <TabsContent value="doctors" className="space-y-6">
                  <Card className="shadow-md border-muted/20 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                      <div>
                        <CardTitle className="text-lg">Revenue by Doctor</CardTitle>
                        <CardDescription>Performance breakdown for each doctor</CardDescription>
                      </div>
                      {can("reports_export") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuLabel>Export Layout</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => exportAsImage('doctor-chart', 'png', 'doctor_revenue')}><ImageIcon className="mr-2 h-4 w-4" /> Download PNG</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => downloadCSV(processedDoctorData, 'doctor_revenue')}><FileSpreadsheet className="mr-2 h-4 w-4" /> Download CSV</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardHeader>
                    <CardContent className="p-0 pt-4 px-6 pb-6">
                      <div className="h-[400px] w-full" id="doctor-chart">
                        {processedDoctorData.length > 0 ? (
                          <ChartContainer config={chartConfig} className="h-full w-full">
                            <BarChart data={processedDoctorData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/50" />
                              <XAxis type="number" axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => formatCompactSimple(v)} />
                              <YAxis dataKey="doctorName" type="category" axisLine={false} tickLine={false} fontSize={12} width={150} />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    formatter={(value) => (
                                      <div className="flex flex-1 justify-between gap-4 leading-none">
                                        <span className="text-muted-foreground">Revenue</span>
                                        <span className="text-foreground font-mono font-medium">
                                          {formatCompactSimple(Number(value || 0))}
                                        </span>
                                      </div>
                                    )}
                                  />
                                }
                              />
                              <Bar dataKey="totalRevenue" name="Revenue" fill="var(--color-totalRevenue)" radius={[0, 6, 6, 0]} barSize={30} />
                            </BarChart>
                          </ChartContainer>
                        ) : (
                          <NoDataMessage />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {can("report_revenue") && (
                <TabsContent value="services" className="space-y-6">
                  <Card className="shadow-md border-muted/20 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                      <div>
                        <CardTitle className="text-lg">Revenue by Service</CardTitle>
                        <CardDescription>Business volume and revenue per clinical service</CardDescription>
                      </div>
                      {can("reports_export") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuLabel>Export Layout</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => exportAsImage('service-chart', 'png', 'service_revenue')}><ImageIcon className="mr-2 h-4 w-4" /> Download PNG</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => downloadCSV(processedServiceData, 'service_revenue')}><FileSpreadsheet className="mr-2 h-4 w-4" /> Download CSV</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardHeader>
                    <CardContent className="p-0 pt-4 px-6 pb-6">
                      <div className="h-[400px] w-full" id="service-chart">
                        {processedServiceData.length > 0 ? (
                          <ChartContainer config={chartConfig} className="h-full w-full">
                            <BarChart data={processedServiceData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                              <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => formatCompactSimple(v)} />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    formatter={(value, name) => (
                                      <div className="flex flex-1 justify-between gap-4 leading-none">
                                        <span className="text-muted-foreground">{String(name)}</span>
                                        <span className="text-foreground font-mono font-bold tabular-nums">
                                          {name === 'Revenue' ? formatCompactSimple(Number(value || 0)) : value}
                                        </span>
                                      </div>
                                    )}
                                  />
                                }
                              />
                              <ChartLegend content={<ChartLegendContent />} />
                              <Bar dataKey="totalRevenue" name="Revenue" fill="var(--color-totalRevenue)" radius={[6, 6, 0, 0]} barSize={40} />
                              <Bar dataKey="billCount" name="Invoices" fill="var(--color-totalBills)" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                          </ChartContainer>
                        ) : (
                          <NoDataMessage />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {can("report_patient") && (
                <TabsContent value="demographics" className="space-y-6">
                  <Card className="shadow-md border-muted/20 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                      <div>
                        <CardTitle className="text-lg">Patient Age Distribution</CardTitle>
                        <CardDescription>Patient population breakdown by age range</CardDescription>
                      </div>
                      {can("reports_export") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuLabel>Export Layout</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => exportAsImage('age-chart', 'png', 'age_demographics')}><ImageIcon className="mr-2 h-4 w-4" /> Download PNG</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => downloadCSV(processedAgeData, 'age_demographics')}><FileSpreadsheet className="mr-2 h-4 w-4" /> Download CSV</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardHeader>
                    <CardContent className="p-0 pt-4 px-6 pb-6">
                      <div className="h-[400px] w-full" id="age-chart">
                        {processedAgeData.length > 0 ? (
                          <ChartContainer config={chartConfig} className="h-full w-full">
                            <BarChart data={processedAgeData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/50" />
                              <XAxis type="number" axisLine={false} tickLine={false} fontSize={12} />
                              <YAxis dataKey="ageGroup" type="category" axisLine={false} tickLine={false} fontSize={12} width={100} />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    formatter={(value) => (
                                      <div className="flex flex-1 justify-between gap-4 leading-none">
                                        <span className="text-muted-foreground">Patients</span>
                                        <span className="text-foreground font-mono font-medium">
                                          {Number(value).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                  />
                                }
                              />
                              <Bar dataKey="count" name="Patients" fill="var(--color-patients)" radius={[0, 6, 6, 0]} barSize={30} />
                            </BarChart>
                          </ChartContainer>
                        ) : (
                          <NoDataMessage />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
