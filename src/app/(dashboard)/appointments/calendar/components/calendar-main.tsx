"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Building2,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Info,
  List,
  Menu,
  Stethoscope,
  X,
  Video,
} from "lucide-react"
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { availabilityColorMap, getAvailabilityDotClass, getAvailabilityTooltip, type DailyAvailabilitySummary } from "@/lib/calendar-availability"
import { cn, getPaymentModeLabel, getReferenceId, isObject } from "@/lib/utils"
import type { CalendarEvent } from "@/types/calendar.types"
import type {
  DoctorSession,
  DoctorSessionSchedule,
} from "@/types/doctor-session.types"
import type { UseCalendarFiltersReturn } from "@/hooks/use-calendar-filters"
import { useAuthRole } from "@/hooks/use-auth-role"
import {
  TIME_FILTER_LABELS,
  STATUS_FILTER_LABELS,
  TOTAL_STATUS_COUNT,
  type AppointmentTimeFilter,
} from "@/lib/calendar-filters"
import { TimeGridCalendar } from "./time-grid-calendar"

const APPOINTMENT_STATUS_ITEMS = [
  { color: "bg-blue-500", label: "Booked" },
  { color: "bg-amber-500", label: "Checked-in" },
  { color: "bg-emerald-500", label: "Completed" },
  { color: "bg-red-500", label: "Cancelled" },
  { color: "bg-slate-500", label: "Past Date" },
] as const

const AVAILABILITY_ITEMS = [
  { color: availabilityColorMap.high, label: "Available" },
  { color: availabilityColorMap.medium, label: "Limited Availability" },
  { color: availabilityColorMap.low, label: "Fully Booked" },
  { color: availabilityColorMap.holiday, label: "Holiday" },
] as const

const INDICATOR_ITEMS = [
  { icon: Stethoscope, label: "Doctor on Holiday" },
  { icon: Building2, label: "Clinic Closed" },
] as const

function AvailabilityLegend() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-input bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Info"
        >
          <Info className="size-4" strokeWidth={2} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-60 p-3">
        <p className="mb-3 text-xs font-semibold text-foreground">Information</p>
        <div className="mb-3">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Appointment Status</p>
          <ul className="space-y-1.5 text-xs text-foreground">
            {APPOINTMENT_STATUS_ITEMS.map(({ color, label }) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    color,
                    label === "Past Date" && "opacity-70"
                  )}
                  aria-hidden
                />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Availability</p>
          <ul className="space-y-1.5 text-xs text-foreground">
            {AVAILABILITY_ITEMS.map(({ color, label }) => (
              <li key={label} className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", color)} aria-hidden />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Indicators</p>
          <ul className="space-y-1.5 text-xs text-foreground">
            {INDICATOR_ITEMS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground dark:text-white/80" aria-hidden />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  )
}

type DoctorItem = { _id: string; firstName: string; lastName: string }
type ServiceItem = { _id: string; name: string }
type DoctorSessionTooltip = { title: string; description: string }

const DAY_ID_BY_WEEKDAY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const

function getDoctorSessionReferenceId(value: DoctorSession["doctor"] | DoctorSession["doctorId"]) {
  if (!value) return undefined
  if (typeof value === "string") return value
  return value._id
}

function timeToMinutes(value?: string) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null
  const [hours, minutes] = value.split(":").map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

function getDoctorSessionRanges(schedule?: DoctorSessionSchedule) {
  if (!schedule?.isActive) return []

  const start = timeToMinutes(schedule.startTime)
  const end = timeToMinutes(schedule.endTime)

  if (start == null || end == null || end <= start) {
    return []
  }

  const breaks = (schedule.breaks ?? [])
    .map((item) => {
      const breakStart = timeToMinutes(item.start)
      const breakEnd = timeToMinutes(item.end)
      if (breakStart == null || breakEnd == null) return null
      return {
        start: Math.max(start, breakStart),
        end: Math.min(end, breakEnd),
      }
    })
    .filter(
      (item): item is { start: number; end: number } =>
        item !== null && item.end > item.start
    )
    .sort((left, right) => left.start - right.start)

  const ranges: string[] = []
  let cursor = start

  for (const breakRange of breaks) {
    if (breakRange.start > cursor) {
      ranges.push(`${minutesToTime(cursor)} – ${minutesToTime(breakRange.start)}`)
    }
    cursor = Math.max(cursor, breakRange.end)
  }

  if (cursor < end) {
    ranges.push(`${minutesToTime(cursor)} – ${minutesToTime(end)}`)
  }

  return ranges
}

function getDoctorSessionTooltip(schedule?: DoctorSessionSchedule): DoctorSessionTooltip {
  if (!schedule?.isActive) {
    return {
      title: "Doctor Session",
      description: "No schedule available",
    }
  }

  const ranges = getDoctorSessionRanges(schedule)

  if (!ranges.length) {
    return {
      title: "Doctor Session",
      description: "Unavailable",
    }
  }

  return {
    title: "Doctor Session",
    description: ranges.join(" | "),
  }
}

function ActiveFilterBar({
  filters,
  doctors,
  services,
  doctorSessionTooltips,
  className,
}: {
  filters: UseCalendarFiltersReturn
  doctors: DoctorItem[]
  services: ServiceItem[]
  doctorSessionTooltips: Map<string, DoctorSessionTooltip>
  className?: string
}) {
  const getDoctorName = (id: string) => {
    const doc = doctors.find((d) => d._id === id)
    return doc ? `Dr. ${doc.firstName} ${doc.lastName}` : id
  }
  const getServiceName = (id: string) => {
    const svc = services.find((s) => s._id === id)
    return svc?.name ?? id
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b px-4 py-2 bg-muted/30",
        className
      )}
    >
      {filters.filters.timeFilter !== "upcoming" && (
        <Badge
          variant="secondary"
          className="cursor-pointer gap-1 pl-2 pr-1 py-1 hover:bg-destructive/20"
          onClick={() => filters.clearTimeFilter()}
        >
          {TIME_FILTER_LABELS[filters.filters.timeFilter as AppointmentTimeFilter]}
          <X className="h-3 w-3" />
        </Badge>
      )}
      {filters.filters.statusFilters.length < TOTAL_STATUS_COUNT &&
        filters.filters.statusFilters.map((key) => (
          <Badge
            key={key}
            variant="secondary"
            className="cursor-pointer gap-1 pl-2 pr-1 py-1 hover:bg-destructive/20"
            onClick={() => filters.clearStatusFilter(key)}
          >
            {STATUS_FILTER_LABELS[key]}
            <X className="h-3 w-3" />
          </Badge>
        ))}
      {filters.filters.doctorIds.map((id) => (
        <Tooltip key={id}>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1 pl-2 pr-1 py-1 hover:bg-destructive/20"
              onClick={() => filters.clearDoctor(id)}
            >
              {getDoctorName(id)}
              <X className="h-3 w-3" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            <div className="space-y-0.5">
              <p className="font-medium">{doctorSessionTooltips.get(id)?.title ?? "Doctor Session"}</p>
              <p>{doctorSessionTooltips.get(id)?.description ?? "No schedule available"}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
      {filters.filters.serviceIds.map((id) => (
        <Badge
          key={id}
          variant="secondary"
          className="cursor-pointer gap-1 pl-2 pr-1 py-1 hover:bg-destructive/20"
          onClick={() => filters.clearService(id)}
        >
          {getServiceName(id)}
          <X className="h-3 w-3" />
        </Badge>
      ))}
    </div>
  )
}

interface CalendarMainProps {
  filters: UseCalendarFiltersReturn
  doctors: DoctorItem[]
  services: ServiceItem[]
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onMenuClick?: () => void
  events?: CalendarEvent[]
  availabilityByDate?: Map<string, DailyAvailabilitySummary>
  doctorSessions: DoctorSession[]
  onEventClick?: (event: CalendarEvent) => void
  onMonthChange?: (month: number, year: number) => void
  onContentViewChange?: (isMonthView: boolean) => void
}

function getDateRange(
  filter: "month" | "week" | "today",
  date: Date
): { start: Date; end: Date } | null {
  if (filter === "today") {
    const d = startOfDay(date)
    return { start: d, end: d }
  }
  if (filter === "week") {
    return {
      start: startOfWeek(date, { weekStartsOn: 1 }),
      end: endOfWeek(date, { weekStartsOn: 1 }),
    }
  }
  if (filter === "month") {
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
    }
  }
  return null
}

function getEventDate(event: CalendarEvent): Date | null {
  const rawDate =
    event.date instanceof Date
      ? event.date
      : event.original?.schedule?.startDate ?? event.date
  const parsed = new Date(rawDate)
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed)
}

interface FilterButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}

function FilterButton({ active, onClick, children, className }: FilterButtonProps) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className={cn("cursor-pointer", className)}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export function CalendarMain({
  filters,
  doctors,
  services,
  selectedDate,
  onDateSelect,
  onMenuClick,
  events,
  availabilityByDate,
  doctorSessions,
  onEventClick,
  onMonthChange,
  onContentViewChange,
}: CalendarMainProps) {
  const { role } = useAuthRole()
  const eventsData = events ?? []
  const [activeDate, setActiveDate] = useState(selectedDate || new Date())
  const [displayMode, setDisplayMode] = useState<"calendar" | "list">("calendar")
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month")
  const [listViewFilter, setListViewFilter] = useState<"month" | "week" | "today">("month")

  useEffect(() => {
    onMonthChange?.(activeDate.getMonth() + 1, activeDate.getFullYear())
  }, [activeDate, onMonthChange])

  useEffect(() => {
    if (selectedDate) {
      setActiveDate(selectedDate)
    }
  }, [selectedDate])

  useEffect(() => {
    onContentViewChange?.(displayMode === "calendar" && calendarView === "month")
  }, [displayMode, calendarView, onContentViewChange])

  useEffect(() => {
    if (displayMode === "calendar" && (calendarView === "week" || calendarView === "day")) {
      const now = new Date()
      const hour = now.getHours()
      const scrollContainer = document.getElementById("calendar-scroll")
      if (scrollContainer) {
        scrollContainer.scrollTop = Math.max(0, hour * 80 - 80)
      }
    }
  }, [displayMode, calendarView])

  const getNavigateType = useCallback(() => {
    if (displayMode === "list") {
      return listViewFilter === "today" ? "day" : listViewFilter
    }
    return calendarView
  }, [displayMode, listViewFilter, calendarView])

  const navigateDate = useCallback(
    (direction: "prev" | "next", type: "month" | "week" | "day") => {
      const fn =
        type === "month"
          ? direction === "prev"
            ? subMonths
            : addMonths
          : type === "week"
            ? direction === "prev"
              ? subWeeks
              : addWeeks
            : direction === "prev"
              ? subDays
              : addDays
      return fn(activeDate, 1)
    },
    [activeDate]
  )

  const navigate = useCallback(
    (direction: "prev" | "next") => {
      const type = getNavigateType()
      const nextDate = navigateDate(direction, type)
      setActiveDate(nextDate)
      if (displayMode === "list") {
        onDateSelect?.(nextDate)
      }
    },
    [getNavigateType, navigateDate, displayMode, onDateSelect]
  )

  const dateRangeLabel = useMemo(() => {
    if (displayMode === "list") {
      if (listViewFilter === "month") return format(activeDate, "MMMM yyyy")
      if (listViewFilter === "week") {
        const range = getDateRange("week", activeDate)
        if (range) return `${format(range.start, "MMM d")} – ${format(range.end, "MMM d, yyyy")}`
      }
      return format(activeDate, "MMMM d, yyyy")
    }
    if (calendarView === "month") return format(activeDate, "MMMM yyyy")
    if (calendarView === "week") {
      const weekStart = startOfWeek(activeDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(activeDate, { weekStartsOn: 1 })
      return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`
    }
    return format(activeDate, "MMMM d, yyyy")
  }, [displayMode, calendarView, listViewFilter, activeDate])

  const monthStart = startOfMonth(activeDate)
  const monthEnd = endOfMonth(activeDate)
  const calendarStart = new Date(monthStart)
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay())
  const calendarEnd = new Date(monthEnd)
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()))
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      onEventClick?.(event)
    },
    [onEventClick]
  )

  const filteredListEvents = useMemo(() => {
    if (!eventsData?.length || displayMode !== "list") return []

    const refDate = startOfDay(activeDate)
    const range = getDateRange(listViewFilter, refDate)

    return eventsData
      .map((event) => ({ ...event, _parsedDate: getEventDate(event) }))
      .filter((event) => {
        if (!event._parsedDate) return false
        if (listViewFilter === "today") {
          return isSameDay(event._parsedDate, refDate)
        }
        if (range) {
          return isWithinInterval(event._parsedDate, range)
        }
        return true
      })
      .sort((a, b) => (a._parsedDate?.getTime() ?? 0) - (b._parsedDate?.getTime() ?? 0))
  }, [eventsData, listViewFilter, activeDate, displayMode])

  const handleMonth = useCallback(() => setCalendarView("month"), [])
  const handleWeek = useCallback(() => setCalendarView("week"), [])
  const handleTodayCalendar = useCallback(() => {
    const today = new Date()
    setCalendarView("day")
    setActiveDate(today)
    onDateSelect?.(today)
  }, [onDateSelect])

  const handleListMonth = useCallback(() => setListViewFilter("month"), [])
  const handleListWeek = useCallback(() => setListViewFilter("week"), [])
  const handleListToday = useCallback(() => {
    const isSwitchingToToday = listViewFilter !== "today"
    setListViewFilter("today")
    if (isSwitchingToToday) {
      const today = new Date()
      setActiveDate(today)
      onDateSelect?.(today)
    }
  }, [onDateSelect, listViewFilter])

  const handleCalendarMode = useCallback(() => setDisplayMode("calendar"), [])
  const handleListMode = useCallback(() => setDisplayMode("list"), [])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of eventsData) {
      const d = getEventDate(event)
      if (!d) continue
      const key = format(d, "yyyy-MM-dd")
      const list = map.get(key) ?? []
      list.push(event)
      map.set(key, list)
    }
    return map
  }, [eventsData])

  const doctorSessionTooltips = useMemo(() => {
    const dayId = DAY_ID_BY_WEEKDAY[activeDate.getDay()]

    return new Map(
      filters.filters.doctorIds.map((doctorId) => {
        const doctorSession = doctorSessions.find(
          (session) => getDoctorSessionReferenceId(session.doctorId ?? session.doctor) === doctorId
        )
        const daySchedule = doctorSession?.sessions.find((session) => session.id === dayId)

        return [doctorId, getDoctorSessionTooltip(daySchedule)] as const
      })
    )
  }, [activeDate, doctorSessions, filters.filters.doctorIds])

  const renderCalendarGrid = () => {
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    return (
      <div className="w-full bg-background">
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div
              key={day}
              className="border-r p-4 text-center text-sm font-medium text-muted-foreground last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd")
              const dayEvents = eventsByDay.get(dateKey) ?? []
              const dayAvailability = availabilityByDate?.get(dateKey)
              const availabilityTooltip = getAvailabilityTooltip(dayAvailability)
              const visibleEvents = dayEvents.slice(0, 3)
              const hiddenCount = dayEvents.length - 3
              const isCurrentMonth = isSameMonth(day, activeDate)
              const isDayToday = isToday(day)
              const isSelected = isSameDay(day, activeDate)
              const showAvailabilityDot = Boolean(dayAvailability)
              const showHolidayIcons = dayAvailability
                ? dayAvailability.level === "holiday" &&
                  (dayAvailability.isDoctorHoliday || dayAvailability.isClinicHoliday)
                : false

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "group relative flex min-h-[120px] flex-col cursor-pointer border-r border-b p-2 transition-colors last:border-r-0",
                    isCurrentMonth
                      ? "bg-background hover:bg-accent/50 dark:hover:bg-accent/50"
                      : "bg-muted/30 text-muted-foreground",
                    isSelected && "ring-2 ring-primary ring-inset",
                    isDayToday && "bg-accent/20"
                  )}
                  onClick={() => {
                    setActiveDate(day)
                    onDateSelect?.(day)
                  }}
                >
                  <div className="mb-1 flex items-center justify-between gap-1 shrink-0">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isDayToday &&
                          "flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {hiddenCount > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="text-xs font-medium text-primary hover:underline shrink-0 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            +{hiddenCount} more
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-64 max-h-56 overflow-y-auto p-2"
                          align="end"
                          side="bottom"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                            {format(day, "MMMM d, yyyy")} – All appointments
                          </p>
                          <div className="flex flex-col gap-1">
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                className={cn(
                                  "cursor-pointer rounded-sm px-2 py-1.5 text-xs text-white transition-opacity hover:opacity-90 flex flex-col gap-0.5",
                                  event.color,
                                  event.color.includes("slate") && "opacity-80"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEventClick(event)
                                }}
                              >

                                <div className="flex items-center justify-between font-medium">
                                  <span className="truncate">
                                    {event.attendees[0] || (isObject(event.original?.patient) ? event.original.patient.fullName : (typeof event.original?.patient === 'string' ? event.original.patient : "Patient"))}
                                  </span>
                                  {isObject(event.original?.service) && (event.original.service as any).telemed_service && (
                                    <Video className="h-3 w-3 shrink-0 ml-1" />
                                  )}
                                </div>
                                <div className="truncate opacity-90 flex items-center gap-1">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  {event.time || "-"}
                                  <span>· {isObject(event.original?.doctor) ? event.original.doctor.fullName : (typeof event.original?.doctor === 'string' ? event.original.doctor : "Doctor")}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-0.5 max-h-[72px]">
                    {visibleEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "relative z-10 cursor-pointer rounded-sm px-1.5 py-0.5 text-[11px] text-white transition-opacity hover:opacity-90 truncate flex items-center gap-1 min-w-0",
                          event.color,
                          event.color.includes("slate") && "opacity-80"
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                      >
                        <div className="flex items-center gap-1 truncate w-full">
                          <Clock className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">
                            {event.time || "-"} {event.attendees[0] || (isObject(event.original?.patient) ? event.original.patient.fullName : (typeof event.original?.patient === 'string' ? event.original.patient : "Patient"))}
                          </span>
                          {isObject(event.original?.service) && (event.original.service as any).telemed_service && (
                            <Video className="h-2.5 w-2.5 shrink-0 ml-auto" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {showHolidayIcons && dayAvailability && (
                    <div
                      className={cn(
                        "absolute top-2 z-20 flex items-center gap-1 text-muted-foreground/80 dark:text-white/80",
                        hiddenCount > 0 ? "right-14" : "right-2"
                      )}
                    >
                      {dayAvailability.isDoctorHoliday && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex h-4 w-4 items-center justify-center">
                              <Stethoscope className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6}>
                            <p className="font-medium">Doctor on Holiday</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {dayAvailability.isClinicHoliday && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex h-4 w-4 items-center justify-center">
                              <Building2 className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6}>
                            <p className="font-medium">Clinic Closed</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}

                  {showAvailabilityDot && dayAvailability && availabilityTooltip && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            "absolute bottom-1 right-1 block h-2.5 w-2.5 rounded-full",
                            getAvailabilityDotClass(dayAvailability.level)
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        {availabilityTooltip.description ? (
                          <div className="space-y-0.5">
                            <p className="font-medium">{availabilityTooltip.title}</p>
                            <p>{availabilityTooltip.description}</p>
                          </div>
                        ) : (
                          <p className="font-medium">{availabilityTooltip.title}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )
          })}
        </div>
      </div>
    )
  }

  const renderListView = () => (
    <div className="flex-1 flex flex-col p-6">
      <div className="h-[calc(100vh-250px)] overflow-y-auto pr-2">
        {filteredListEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No appointments found
          </p>
        ) : (
          <div className="space-y-4">
            {filteredListEvents.map((event) => (
              <Card
                key={event.id}
                className="cursor-pointer overflow-hidden p-0 transition-shadow hover:shadow-md"
                onClick={() => handleEventClick(event)}
              >
                <div className="flex min-h-[72px]">
                  <div className={cn("w-1.5 flex-shrink-0 rounded-l-xl", event.color)} />
                  <CardContent className="flex-1 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-semibold text-base truncate">
                          {event.attendees[0] || (isObject(event.original?.patient) ? event.original.patient.fullName : (typeof event.original?.patient === 'string' ? event.original.patient : "Unknown Patient"))}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <span>Clinic : {event.location || "N/A"}</span>
                          {role !== "doctor" && (
                            <>
                              <span className="mx-1.5 text-muted-foreground/60">|</span>
                              <span>Doctor : {isObject(event.original?.doctor) ? event.original.doctor.fullName : (typeof event.original?.doctor === 'string' ? event.original.doctor : "N/A")}</span>
                            </>
                          )}
                          <span className="mx-1.5 text-muted-foreground/60">|</span>
                          <span className="flex items-center gap-1">
                            Service : {isObject(event.original?.service) ? event.original.service.name : (typeof event.original?.service === 'string' ? event.original.service : "N/A")}
                            {isObject(event.original?.service) && (event.original.service as any).telemed_service && (
                              <Video className="h-4 w-4 text-blue-700 dark:text-blue-400 shrink-0 ml-1" strokeWidth={2.5} />
                            )}
                          </span>
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4 shrink-0" />
                            {format(event.date, "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 shrink-0" />
                            {event.time || "No time"}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4 shrink-0" />
                            {getPaymentModeLabel(event.original?.paymentMode)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-medium capitalize text-muted-foreground">
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", event.color)} />
                            {event.description || "No description"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderHeader = () => (
    <div className="flex flex-col flex-wrap gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer xl:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("prev")} className="cursor-pointer">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("next")} className="cursor-pointer">
            <ChevronRight className="h-4 w-4" />
          </Button>
          {displayMode === "calendar" && (
            <div className="flex rounded-md border">
              <FilterButton
                active={calendarView === "month"}
                onClick={handleMonth}
                className="rounded-r-none border-r"
              >
                Month
              </FilterButton>
              <FilterButton
                active={calendarView === "week"}
                onClick={handleWeek}
                className="rounded-none border-r"
              >
                Week
              </FilterButton>
              <FilterButton active={calendarView === "day"} onClick={handleTodayCalendar} className="rounded-l-none">
                Today
              </FilterButton>
            </div>
          )}
          {displayMode === "list" && (
            <div className="flex rounded-md border">
              <FilterButton
                active={listViewFilter === "month"}
                onClick={handleListMonth}
                className="rounded-r-none border-r"
              >
                Month
              </FilterButton>
              <FilterButton
                active={listViewFilter === "week"}
                onClick={handleListWeek}
                className="rounded-none border-r"
              >
                Week
              </FilterButton>
              <FilterButton
                active={listViewFilter === "today"}
                onClick={handleListToday}
                className="rounded-l-none"
              >
                Today
              </FilterButton>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-semibold">{dateRangeLabel}</h1>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <AvailabilityLegend />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="cursor-pointer">
              {displayMode === "calendar" ? (
                <CalendarIcon className="mr-2 h-4 w-4" />
              ) : (
                <List className="mr-2 h-4 w-4" />
              )}
              {displayMode === "calendar" ? "Calendar" : "List"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleCalendarMode} className="cursor-pointer">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Calendar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleListMode} className="cursor-pointer">
              <List className="mr-2 h-4 w-4" />
              List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  const isMonthView = displayMode === "calendar" && calendarView === "month"

  return (
    <div
      className={cn(
        "flex flex-col",
        isMonthView ? "h-auto min-h-0" : "h-full"
      )}
    >
      {renderHeader()}

      {filters.hasActiveFilters && (
        <ActiveFilterBar
          filters={filters}
          doctors={doctors}
          services={services}
          doctorSessionTooltips={doctorSessionTooltips}
        />
      )}

      {displayMode === "calendar" && calendarView === "month" && renderCalendarGrid()}
      {displayMode === "calendar" && (calendarView === "week" || calendarView === "day") && (
        <div className="flex-1 p-4">
          <div
            id="calendar-scroll"
            className="h-[calc(100vh-250px)] overflow-y-auto overflow-x-auto rounded-md border"
          >

            <TimeGridCalendar
              view={calendarView}
              currentDate={activeDate}
              events={eventsData}
              doctorSessions={
                filters.filters.doctorIds.length > 0
                  ? doctorSessions.filter((s) =>
                      filters.filters.doctorIds.includes(getDoctorSessionReferenceId(s.doctorId ?? s.doctor) || "")
                    )
                  : doctorSessions
              }
              availabilityByDate={availabilityByDate}
              onEventClick={handleEventClick}
              onDateSelect={onDateSelect}
              selectedDoctorIds={filters.filters.doctorIds}
              doctors={doctors}
            />

          </div>
        </div>
      )}
      {displayMode === "list" && renderListView()}
    </div>
  )
}
