"use client"

import { useCallback, useMemo } from "react"
import { Clock, Video } from "lucide-react"
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isToday,
  startOfWeek,
} from "date-fns"

import { cn, isObject } from "@/lib/utils"
import {
  computeEventLayouts,
  getEventMinutes,
  MINUTES_PER_SLOT,
  parseTimeToMinutes,
  slotIndexToTimeLabel,
  SLOTS_PER_DAY,
} from "@/lib/calendar-time-utils"

import {
  availabilityColorMap,
  type DailyAvailabilitySummary,
  type TimeRange,
} from "@/lib/calendar-availability"
import type { CalendarEvent } from "@/types/calendar.types"
import type { DoctorSession } from "@/types/doctor-session.types"

const SLOT_HEIGHT_PX = 40
const HOUR_HEIGHT_PX = SLOT_HEIGHT_PX * 2
const TIME_COLUMN_WIDTH = 56
const COLUMN_MIN_WIDTH = 180
const TOTAL_GRID_HEIGHT = SLOTS_PER_DAY * SLOT_HEIGHT_PX
const DAY_ID_BY_WEEKDAY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const

function getDoctorSessionReferenceId(value: DoctorSession["doctor"] | DoctorSession["doctorId"]) {
  if (!value) return undefined
  if (typeof value === "string") return value
  return value._id
}

export type TimeGridView = "day" | "week"

interface CalendarColumn {
  id: string
  label: string
  date: Date
  doctorId?: string
}

interface TimeGridCalendarProps {
  view: TimeGridView
  currentDate: Date
  events: CalendarEvent[]
  doctorSessions?: DoctorSession[]
  availabilityByDate?: Map<string, DailyAvailabilitySummary>
  onEventClick?: (event: CalendarEvent) => void
  onDateSelect?: (date: Date) => void
  selectedDoctorIds?: string[]
  doctors?: { _id: string; firstName: string; lastName: string }[]
}


export function TimeGridCalendar({
  view,
  currentDate,
  events,
  doctorSessions = [],
  availabilityByDate,
  onEventClick,
  onDateSelect,
  selectedDoctorIds = [],
  doctors = [],
}: TimeGridCalendarProps) {

  const columns = useMemo((): CalendarColumn[] => {
    if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start: weekStart, end: weekEnd }).map((day) => ({
        id: format(day, "yyyy-MM-dd"),
        label: format(day, "EEE M/d"),
        date: day,
      }))
    }

    // Day view: plural if multiple doctors
    const doctorsToShow = selectedDoctorIds.length > 0
      ? selectedDoctorIds
      : doctors.map(d => d._id)

    if (doctorsToShow.length > 0) {
      return doctorsToShow.map((id) => {
        const doc = doctors.find((d) => d._id === id)
        return {
          id: `${id}-${format(currentDate, "yyyy-MM-dd")}`,
          label: doc ? `Dr. ${doc.firstName} ${doc.lastName}` : id,
          date: currentDate,
          doctorId: id,
        }
      })
    }

    return [
      {
        id: format(currentDate, "yyyy-MM-dd"),
        label: format(currentDate, "EEE M/d"),
        date: currentDate,
      },
    ]
  }, [view, currentDate, selectedDoctorIds, doctors])

  const days = useMemo(() => columns.map((c) => c.date), [columns])


  const eventsByDay = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeEventLayouts>>()
    for (const column of columns) {
      const dayEvents = events.filter((e) => {
        const mins = getEventMinutes(e, column.date)
        if (!mins) return false

        // Filter by doctor if specific to column
        if (column.doctorId) {
          const eventDoctorId = getEventDoctorId(e)
          if (eventDoctorId !== column.doctorId) return false
        }
        return true
      })
      const layoutEvents = computeEventLayouts(
        dayEvents,
        column.date,
        view === "week" ? "stack" : "split"
      )
      map.set(column.id, layoutEvents)
    }
    return map
  }, [columns, events])

  function getEventDoctorId(event: CalendarEvent) {
    if (typeof event.original?.doctor === "string") return event.original.doctor
    return event.original?.doctor?._id || event.original?.doctorId
  }



  const handleSlotClick = useCallback(
    (date: Date) => {
      onDateSelect?.(date)
    },
    [onDateSelect]
  )

  const effectiveMinWidth = view === "day" ? COLUMN_MIN_WIDTH : 0

  return (
    <div className={cn("flex flex-col bg-background", view === "day" && "overflow-x-auto")}>
      {/* Sticky header: all-day + day columns */}
      <div className={cn("sticky top-0 z-20 flex shrink-0 border-b bg-background", view === "day" && "min-w-max")}>
        <div
          className="sticky left-0 z-30 shrink-0 border-r bg-background px-2 py-3 text-center text-xs font-medium text-muted-foreground"
          style={{ width: TIME_COLUMN_WIDTH }}
        >
          all-day
        </div>
        <div className="flex flex-1">
          {columns.map((column) => (
            <div
              key={column.id}
              className={cn(
                "flex-1 cursor-pointer border-r px-2 py-3 text-center text-sm font-medium last:border-r-0",
                isToday(column.date) && "bg-primary/10 text-primary"
              )}
              style={{ minWidth: effectiveMinWidth }}
              onClick={() => handleSlotClick(column.date)}
            >
              {column.label}
            </div>
          ))}
        </div>
      </div>

      {/* Time column + grid (scrolls with parent container) */}
      <div className={cn("flex", view === "day" && "min-w-max")} style={{ minHeight: TOTAL_GRID_HEIGHT }}>

        {/* Time column - scrolls with grid */}
        <div
          className="sticky left-0 z-10 shrink-0 border-r bg-background"
          style={{ width: TIME_COLUMN_WIDTH }}
        >
          <div className="relative" style={{ height: TOTAL_GRID_HEIGHT }}>
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="absolute flex w-full items-start justify-center text-xs text-muted-foreground"
                style={{
                  top: hour * HOUR_HEIGHT_PX,
                  height: HOUR_HEIGHT_PX,
                }}
              >
                {slotIndexToTimeLabel(hour * 2)}
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 flex">
          {columns.map((column, colIndex) => {
            const dateKey = format(column.date, "yyyy-MM-dd")
            const availability = availabilityByDate?.get(dateKey)
            const dayEvents = eventsByDay.get(column.id) ?? []
            const dayId = DAY_ID_BY_WEEKDAY[column.date.getDay()]

            // Per-target availability for more accurate multi-column rendering (Today view)
            const doctorAvailability = column.doctorId ? availability?.perTargetAvailability?.[column.doctorId] : undefined
            const doctorSession = column.doctorId ? doctorSessions.find(ds => getDoctorSessionReferenceId(ds.doctorId ?? ds.doctor) === column.doctorId) : undefined
            const clinicId = doctorSession ? getDoctorSessionReferenceId(doctorSession.clinicId ?? doctorSession.clinic) : undefined
            const clinicAvailability = clinicId ? availability?.perTargetAvailability?.[clinicId] : undefined

            const isHoliday = (doctorAvailability?.isHoliday || clinicAvailability?.isHoliday) ?? (availability?.level === "holiday")
            const availabilityClass = (doctorAvailability?.isHoliday || clinicAvailability?.isHoliday)
              ? availabilityColorMap.holiday
              : (doctorAvailability ? availabilityColorMap[doctorAvailability.level] : (availability ? availabilityColorMap[availability.level] : ""))

            return (
              <div
                key={column.id}
                className="relative flex-1 border-r last:border-r-0"
                style={{ minWidth: effectiveMinWidth, height: TOTAL_GRID_HEIGHT }}
              >
                {/* 1. Availability Heatmap Layer */}
                {availability && (availability.level !== "past" || isHoliday) && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {isHoliday ? (
                      <div className={cn("absolute inset-0 flex items-center justify-center", availabilityClass)}>
                        <span className="text-sm font-bold text-muted-foreground/40 uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180">
                          On Holiday
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Session Backgrounds */}
                        {doctorSessions
                          .filter(ds => {
                            if (column.doctorId) {
                              return getDoctorSessionReferenceId(ds.doctorId ?? ds.doctor) === column.doctorId
                            }
                            return true
                          })
                          .flatMap(ds => ds.sessions)
                          .filter(s => s.id === dayId && s.isActive)
                          .map((schedule, idx) => {
                            const startMins = parseTimeToMinutes(schedule.startTime)
                            const endMins = parseTimeToMinutes(schedule.endTime)
                            const topPx = (startMins / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
                            const heightPx = ((endMins - startMins) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX

                            return (
                              <div
                                key={`${dateKey}-session-${idx}`}
                                className={cn("absolute w-full", availabilityClass)}
                                style={{
                                  top: topPx,
                                  height: heightPx,
                                }}
                              />
                            )
                          })}

                        {/* Partial Holiday Overlays */}
                        {availability.holidayRanges
                          .filter(range => {
                            if (column.doctorId) {
                              const doctorSession = doctorSessions.find(ds => getDoctorSessionReferenceId(ds.doctorId ?? ds.doctor) === column.doctorId)
                              const clinicId = doctorSession ? getDoctorSessionReferenceId(doctorSession.clinicId ?? doctorSession.clinic) : undefined

                              if (range.category === "doctor") {
                                return range.targetId === column.doctorId
                              }
                              if (range.category === "clinic") {
                                return range.targetId === clinicId
                              }
                              return false
                            }
                            return true
                          })
                          .map((range, idx) => {
                            const topPx = (range.start / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
                            const heightPx = ((range.end - range.start) / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX

                            return (
                              <div
                                key={`${dateKey}-holiday-range-${idx}`}
                                className={cn(
                                  "absolute w-full flex items-center justify-center border-y border-background/20",
                                  availabilityColorMap.holiday
                                )}
                                style={{
                                  top: topPx,
                                  height: heightPx,
                                  zIndex: 5,
                                }}
                              >
                                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest truncate px-1">
                                  On Holiday
                                </span>
                              </div>
                            )
                          })}
                      </>
                    )}
                  </div>
                )}

                {/* 2. Grid Lines Layer */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: SLOTS_PER_DAY }, (_, slotIndex) => (
                    <div
                      key={slotIndex}
                      className={cn(
                        "border-b border-border/50",
                        slotIndex % 2 === 0 ? "border-b" : "border-b border-dashed"
                      )}
                      style={{ height: SLOT_HEIGHT_PX }}
                    />
                  ))}
                </div>

                {/* 3. Current Day Highlight Layer */}
                {isToday(column.date) && (
                  <div className="pointer-events-none absolute inset-0 bg-primary/5" />
                )}

                {/* 4. Appointments Layer */}
                <div className="absolute inset-0">
                  {dayEvents.map((event) => {
                    const mins = getEventMinutes(event, column.date)
                    if (!mins) return null

                    const topPx =
                      (event.layout.startMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT_PX
                    const heightPx =
                      ((event.layout.endMinutes - event.layout.startMinutes) /
                        MINUTES_PER_SLOT) *
                      SLOT_HEIGHT_PX

                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "absolute cursor-pointer overflow-hidden rounded-md px-2 py-1 text-white shadow-sm transition-opacity hover:opacity-90",
                          event.color,
                          event.color.includes("slate") && "opacity-85"
                        )}
                        style={{
                          top: topPx + event.layout.topOffset,
                          left: `${event.layout.left}%`,
                          width: `${event.layout.width}%`,
                          height: Math.max(24, heightPx - 2),
                          minHeight: 24,
                          zIndex: 10 + event.layout.columnIndex,
                          paddingLeft: '4px',
                          paddingRight: '4px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick?.(event)
                        }}
                        title={`${event.attendees[0] || (isObject(event.original?.patient) ? event.original.patient.fullName : "Patient")} · ${isObject(event.original?.doctor) ? event.original.doctor.fullName : "Doctor"} · ${isObject(event.original?.service) ? event.original.service.name : "Service"} · ${event.time}`}
                      >
                        <div className="flex items-center gap-1 truncate justify-between w-full">
                          <div className="flex items-center gap-1 truncate">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span className="truncate text-xs font-medium">
                              {event.attendees[0] || (isObject(event.original?.patient) ? event.original.patient.fullName : event.title)}
                            </span>
                          </div>
                          {isObject(event.original?.service) && (event.original.service as any).telemed_service && (
                            <Video className="h-3 w-3 flex-shrink-0 ml-1" />
                          )}
                        </div>
                        {heightPx >= 44 && (
                          <>
                            <p className="mt-0.5 truncate text-[10px] opacity-90">
                              {(isObject(event.original?.doctor) ? event.original.doctor.fullName : null) || event.time}
                            </p>
                            {heightPx >= 64 && (
                              <p className="truncate text-[10px] opacity-90">
                                {isObject(event.original?.service) ? event.original.service.name : null} · {event.time}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
