import { eachDayOfInterval, endOfMonth, format, startOfDay, startOfMonth } from "date-fns"

import { getAppointmentStatusType } from "@/lib/calendar-filters"
import { parseScheduleDate } from "@/hooks/use-appointments"
import { getReferenceId, isObject } from "@/lib/utils"
import type { Appointment } from "@/types/appointment.types"
import type { DoctorSession, DoctorSessionSchedule } from "@/types/doctor-session.types"
import type { Holiday } from "@/services/holiday.service"

export type AvailabilityHeatmapLevel = "past" | "high" | "medium" | "low" | "holiday"

export type CalendarDayIndicator = "fully_booked" | "doctor_holiday" | "clinic_holiday"

export interface TimeRange {
  start: number
  end: number
}

export interface TargetHolidayRange extends TimeRange {
  targetId: string
  category: "doctor" | "clinic"
}

export interface DailyAvailabilitySummary {
  dateKey: string
  level: AvailabilityHeatmapLevel
  bookedSlots: number
  totalSlots: number
  remainingSlots: number
  availabilityRatio: number
  isFullyBooked: boolean
  isDoctorHoliday: boolean
  isClinicHoliday: boolean
  doctorStatus: "available" | "on_holiday"
  clinicStatus: "open" | "closed"
  indicators: CalendarDayIndicator[]
  holidayRanges: TargetHolidayRange[]
  perTargetAvailability?: Record<string, { level: AvailabilityHeatmapLevel; isHoliday: boolean }>
}

export interface AvailabilityTooltipContent {
  title: string
  description?: string
}


interface ScopedSession {
  doctorId?: string
  clinicId?: string
  schedule: DoctorSessionSchedule
}

export interface ComputeAvailabilityHeatmapOptions {
  holidays?: Holiday[]
  serviceDuration?: number
  doctorIds?: string[]
  clinicIds?: string[]
}

export const availabilityColorMap: Record<AvailabilityHeatmapLevel, string> = {
  past: "bg-gray-100 opacity-60 dark:bg-gray-800",
  high: "bg-green-200 dark:bg-green-800",
  medium: "bg-yellow-200 dark:bg-yellow-700",
  low: "bg-red-300 dark:bg-red-700",
  holiday: "bg-gray-300 dark:bg-gray-700",
}

export const availabilityDotColorMap: Record<AvailabilityHeatmapLevel, string> = {
  past: "bg-gray-400 dark:bg-gray-500",
  high: "bg-green-500 dark:bg-green-400",
  medium: "bg-yellow-400 dark:bg-yellow-300",
  low: "bg-red-500 dark:bg-red-400",
  holiday: "bg-gray-600 dark:bg-gray-400",
}

const DAY_ID_BY_WEEKDAY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const
const DEFAULT_SERVICE_DURATION = 15 // Default service duration in minutes
const DEFAULT_DAILY_CAPACITY = 12 // Legacy fallback only

function getDateKey(date: Date) {
  return format(date, "yyyy-MM-dd")
}

function toMinutes(value?: string) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null
  const [hours, minutes] = value.split(":").map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

function normalizeRange(start: number, end: number): TimeRange {
  if (end <= start) {
    return { start, end: end + 24 * 60 }
  }
  return { start, end }
}

function rangesOverlap(left: TimeRange, right: TimeRange) {
  return left.start < right.end && left.end > right.start
}

function holidayAppliesToDate(holiday: Holiday, targetDate: Date) {
  const currentDate = startOfDay(targetDate)
  const dates = holiday.holiday_dates ?? []

  if (holiday.mode === "range" && dates.length >= 2) {
    const start = startOfDay(new Date(dates[0]))
    const end = startOfDay(new Date(dates[1]))
    return currentDate >= start && currentDate <= end
  }

  return dates.some((value) => {
    const parsed = startOfDay(new Date(value))
    return !Number.isNaN(parsed.getTime()) && parsed.getTime() === currentDate.getTime()
  })
}

function isFullDayHoliday(holiday: Holiday) {
  return !(holiday.apply_specific_time && (holiday.specific_time?.length ?? 0) >= 2)
}

function getHolidayRanges(holiday: Holiday): TimeRange[] {
  if (!holiday.apply_specific_time || (holiday.specific_time?.length ?? 0) < 2) {
    return [{ start: 0, end: 1440 }]
  }

  const start = toMinutes(holiday.specific_time?.[0])
  const end = toMinutes(holiday.specific_time?.[1])

  if (start == null || end == null) return []
  return [normalizeRange(start, end)]
}

function getDaySchedule(
  doctorSession: DoctorSession,
  date: Date
): ScopedSession | null {
  const dayId = DAY_ID_BY_WEEKDAY[date.getDay()]
  const schedule = doctorSession.sessions?.find(
    (item) => item.id === dayId && (item.isActive ?? true)
  )

  if (!schedule) return null

  return {
    doctorId: getReferenceId(doctorSession.doctorId ?? doctorSession.doctor),
    clinicId: getReferenceId(doctorSession.clinicId ?? doctorSession.clinic),
    schedule,
  }
}

function generateSlots(schedule: DoctorSessionSchedule, duration: number): TimeRange[] {
  const start = toMinutes(schedule.startTime)
  const end = toMinutes(schedule.endTime)

  if (start == null || end == null) return []

  const normalizedWindow = normalizeRange(start, end)
  const breaks = (schedule.breaks ?? [])
    .map((item) => {
      const breakStart = toMinutes(item.start)
      const breakEnd = toMinutes(item.end)
      if (breakStart == null || breakEnd == null) return null
      return normalizeRange(breakStart, breakEnd)
    })
    .filter((value): value is TimeRange => Boolean(value))

  const slots: TimeRange[] = []
  let cursor = normalizedWindow.start

  while (cursor < normalizedWindow.end) {
    const slot = { start: cursor, end: cursor + duration }
    if (slot.end > normalizedWindow.end) break

    const isInBreak = breaks.some((breakRange) => rangesOverlap(slot, breakRange))
    if (!isInBreak) {
      slots.push(slot)
    }

    cursor = slot.end
  }

  return slots
}

function getScopedSessionIds(
  doctorSessions: DoctorSession[],
  doctorIds?: string[],
  clinicIds?: string[]
) {
  return doctorSessions.filter((session) => {
    const doctorId = getReferenceId(session.doctorId ?? session.doctor)
    const clinicId = getReferenceId(session.clinicId ?? session.clinic)

    if (doctorIds?.length && (!doctorId || !doctorIds.includes(doctorId))) return false
    if (clinicIds?.length && (!clinicId || !clinicIds.includes(clinicId))) return false

    return true
  })
}

function getBookedTimes(
  date: Date,
  appointments: Appointment[],
  doctorId?: string,
  clinicId?: string
) {
  const dateKey = getDateKey(date)

  return new Set(
    appointments
      .filter((appointment) => {
        const appointmentDate = parseScheduleDate(appointment.schedule?.startDate)
        if (!appointmentDate || getDateKey(appointmentDate) !== dateKey) return false

        if (doctorId) {
          const appointmentDoctorId = getReferenceId(appointment.doctor ?? appointment.doctorId)
          if (appointmentDoctorId !== doctorId) return false
        }

        if (clinicId && getReferenceId(appointment.clinic ?? appointment.clinicId) !== clinicId) return false

        const rawStatus = String(appointment.status?.id ?? "").toLowerCase().replace(/_/g, "")
        if (rawStatus === "notexecuted") return false

        return getAppointmentStatusType(appointment) !== "cancelled"
      })
      .map((appointment) => appointment.schedule?.startTime)
      .filter((value): value is string => Boolean(value))
  )
}

function matchesScopedAppointment(
  appointment: Appointment,
  dateKey: string,
  doctorIds?: string[],
  clinicIds?: string[]
) {
  const appointmentDate = parseScheduleDate(appointment.schedule?.startDate)
  if (!appointmentDate || getDateKey(appointmentDate) !== dateKey) return false

  const appointmentDoctorId = getReferenceId(appointment.doctor ?? appointment.doctorId)
  if (doctorIds?.length && (!appointmentDoctorId || !doctorIds.includes(appointmentDoctorId))) {
    return false
  }

  const appointmentClinicId = getReferenceId(appointment.clinic ?? appointment.clinicId)
  if (clinicIds?.length && (!appointmentClinicId || !clinicIds.includes(appointmentClinicId))) {
    return false
  }

  const rawStatus = String(appointment.status?.id ?? "").toLowerCase().replace(/_/g, "")
  if (rawStatus === "notexecuted") return false

  return getAppointmentStatusType(appointment) !== "cancelled"
}

export function getAvailabilityBackgroundClass(level?: AvailabilityHeatmapLevel) {
  return level ? availabilityColorMap[level] : ""
}

export function getAvailabilityDotClass(level?: AvailabilityHeatmapLevel) {
  return level ? availabilityDotColorMap[level] : ""
}

export function getAvailabilityTooltip(
  summary?: Pick<DailyAvailabilitySummary, "level" | "bookedSlots" | "remainingSlots" | "totalSlots">
): AvailabilityTooltipContent | null {
  if (!summary) return null

  switch (summary.level) {
    case "past":
      return {
        title: "Past Date",
      }
    case "high":
      return {
        title: "Available",
      }
    case "medium":
      return {
        title: "Limited Availability",
      }
    case "low":
      return {
        title: "Fully Booked",
      }
    case "holiday":
      return {
        title: "On Holiday",
      }
    default:
      return null
  }
}

export function computeAvailabilityHeatmap(
  date: Date,
  appointments: Appointment[],
  doctorSessions: DoctorSession[],
  options: ComputeAvailabilityHeatmapOptions = {}
): DailyAvailabilitySummary {
  const dateKey = getDateKey(date)
  const today = startOfDay(new Date())

  const isPast = startOfDay(date) < today

  const scopedSessions = getScopedSessionIds(
    doctorSessions,
    options.doctorIds,
    options.clinicIds
  )

  const scopedDoctorIds =
    options.doctorIds?.length
      ? options.doctorIds
      : Array.from(
          new Set(
            scopedSessions
              .map((session) => getReferenceId(session.doctorId ?? session.doctor))
              .filter((value): value is string => Boolean(value))
          )
        )

  const scopedClinicIds =
    options.clinicIds?.length
      ? options.clinicIds
      : Array.from(
          new Set(
            scopedSessions
              .map((session) => getReferenceId(session.clinicId ?? session.clinic))
              .filter((value): value is string => Boolean(value))
          )
        )

  const applicableHolidays = (options.holidays ?? []).filter((holiday) => {
    if (!holidayAppliesToDate(holiday, date)) return false
    if (holiday.category === "doctor") {
      return scopedDoctorIds.length > 0 && scopedDoctorIds.includes(holiday.target?._id)
    }
    if (holiday.category === "clinic") {
      return scopedClinicIds.length > 0 && scopedClinicIds.includes(holiday.target?._id)
    }
    return false
  })

  const fullDayDoctorHolidayIds = new Set(
    applicableHolidays
      .filter((holiday) => holiday.category === "doctor" && isFullDayHoliday(holiday))
      .map((holiday) => holiday.target?._id)
      .filter((value): value is string => Boolean(value))
  )

  const fullDayClinicHolidayIds = new Set(
    applicableHolidays
      .filter((holiday) => holiday.category === "clinic" && isFullDayHoliday(holiday))
      .map((holiday) => holiday.target?._id)
      .filter((value): value is string => Boolean(value))
  )

  const sessionCount = scopedSessions.length
  const activeDaySessions = scopedSessions
    .map((session) => getDaySchedule(session, date))
    .filter((value): value is ScopedSession => Boolean(value))
    .filter(
      (session) =>
        !(
          (session.doctorId && fullDayDoctorHolidayIds.has(session.doctorId)) ||
          (session.clinicId && fullDayClinicHolidayIds.has(session.clinicId))
        )
    )

  // Use dynamic slot calculation based on actual doctor schedules
  const slotDuration =
    typeof options.serviceDuration === "number" && options.serviceDuration > 0
      ? options.serviceDuration
      : DEFAULT_SERVICE_DURATION

  let totalAvailableSlotsForDay = 0
  let remainingSlotsForDay = 0

  for (const session of activeDaySessions) {
    const specificHolidayRanges = applicableHolidays
      .filter((holiday) => !isFullDayHoliday(holiday))
      .filter((holiday) => {
        if (holiday.category === "doctor") return holiday.target?._id === session.doctorId
        if (holiday.category === "clinic") return holiday.target?._id === session.clinicId
        return false
      })
      .flatMap(h => getHolidayRanges(h).map(r => ({
        ...r,
        targetId: h.target?._id,
        category: h.category,
      })))

    // Always calculate actual slots based on doctor schedule and service duration
    const operationalSlots = generateSlots(session.schedule, slotDuration).filter(
      (slot) => !specificHolidayRanges.some((range) => rangesOverlap(slot, range))
    )

    totalAvailableSlotsForDay += operationalSlots.length

    // Filter slots by appointments for this specific doctor/clinic session
    const freeSlots = operationalSlots.filter(slot => {
      return !appointments.some(appt => {
        const docId = session.doctorId ? [session.doctorId] : undefined;
        const clinId = session.clinicId ? [session.clinicId] : undefined;
        if (!matchesScopedAppointment(appt, dateKey, docId, clinId)) return false;

        const apptStartTime = appt.schedule?.startTime;
        if (!apptStartTime) return false;

        const apptStart = toMinutes(apptStartTime);
        if (apptStart === null) return false;

        const apptDuration = (isObject(appt.service) ? appt.service.duration : DEFAULT_SERVICE_DURATION) || DEFAULT_SERVICE_DURATION;
        const apptEnd = apptStart + apptDuration;

        return rangesOverlap(slot, { start: apptStart, end: apptEnd });
      });
    });

    remainingSlotsForDay += freeSlots.length
  }

  const allSpecificHolidayRanges = applicableHolidays
    .filter((holiday) => !isFullDayHoliday(holiday))
    .flatMap(h => getHolidayRanges(h).map(r => ({
      ...r,
      targetId: h.target?._id,
      category: h.category,
    })))

  const isClinicHoliday =
    scopedClinicIds.length > 0 &&
    scopedClinicIds.every((clinicId) => fullDayClinicHolidayIds.has(clinicId))

  const hasScheduleCoverage = activeDaySessions.length > 0

  const isDoctorHoliday =
    ((activeDaySessions.length === 0 &&
      sessionCount > 0 &&
      scopedDoctorIds.length > 0 &&
      scopedDoctorIds.every((doctorId) => fullDayDoctorHolidayIds.has(doctorId))) ||
    (activeDaySessions.length === 0 && sessionCount > 0 && scopedDoctorIds.length === 0)) ||
    (sessionCount > 0 && hasScheduleCoverage && totalAvailableSlotsForDay === 0 && applicableHolidays.some(h => h.category === "doctor"))
  
  // A day is a holiday if: clinic/doctors have full-day holidays, no schedule coverage, or all slots are blocked by holidays.
  const shouldTreatAsHoliday =
    isClinicHoliday ||
    isDoctorHoliday ||
    (sessionCount > 0 && !hasScheduleCoverage) ||
    (sessionCount > 0 && hasScheduleCoverage && totalAvailableSlotsForDay === 0 && applicableHolidays.length > 0)

  // Use actual calculated slots, fallback to legacy capacity only if no slots calculated and NOT a holiday
  const totalSlots = totalAvailableSlotsForDay > 0
    ? totalAvailableSlotsForDay
    : (sessionCount > 0 && !shouldTreatAsHoliday
        ? DEFAULT_DAILY_CAPACITY * (activeDaySessions.length > 0 ? activeDaySessions.length : 1)
        : 0)
  
  const remainingSlots = Math.max(0, totalSlots > 0 ? remainingSlotsForDay : 0)
  const bookedSlotsForDay = Math.max(0, totalSlots - remainingSlots)

  const availabilityRatio = totalSlots > 0 ? bookedSlotsForDay / totalSlots : 0
  const shouldTreatAsHolidayMapValue = shouldTreatAsHoliday

  if (process.env.NODE_ENV === "development") {
    console.log(`[${dateKey}] Slots: ${bookedSlotsForDay}/${totalSlots} (${(availabilityRatio * 100).toFixed(1)}%) - Method: ${totalAvailableSlotsForDay > 0 ? 'dynamic' : 'legacy'} - Sessions: ${activeDaySessions.length} - Holiday: ${shouldTreatAsHolidayMapValue}`)
  }

  let level: AvailabilityHeatmapLevel = "high"
  if (shouldTreatAsHolidayMapValue) {
    level = "holiday"
  } else if (availabilityRatio >= 1) {
    level = "low"      // Red - 100% booked
  } else if (availabilityRatio >= 0.5) {
    level = "medium"   // Yellow - 50%+ booked
  }
  // else remains "high" (Green - less than 50% booked)

  if (isPast && level !== "holiday") {
    level = "past"
  }

  const indicators: CalendarDayIndicator[] = []
  if (availabilityRatio >= 1 && totalSlots > 0) indicators.push("fully_booked")
  if (isDoctorHoliday || (sessionCount > 0 && !hasScheduleCoverage && !isClinicHoliday)) {
    indicators.push("doctor_holiday")
  }
  if (isClinicHoliday) indicators.push("clinic_holiday")

  // Compute per-target status for more accurate multi-column rendering
  const perTargetAvailability: Record<string, { level: AvailabilityHeatmapLevel; isHoliday: boolean }> = {}
  
  // Calculate for each scoped doctor
  for (const doctorId of scopedDoctorIds) {
    const doctorSessions = scopedSessions.filter(s => getReferenceId(s.doctorId ?? s.doctor) === doctorId)
    const doctorActiveSessions = doctorSessions
      .map(s => getDaySchedule(s, date))
      .filter((v): v is ScopedSession => Boolean(v))
      .filter(s => !(s.doctorId && fullDayDoctorHolidayIds.has(s.doctorId)) && !(s.clinicId && fullDayClinicHolidayIds.has(s.clinicId)))
    
    const drApplicableHolidays = applicableHolidays.filter(h => h.category === 'doctor' && h.target?._id === doctorId)
    const drFullDayHoliday = drApplicableHolidays.some(isFullDayHoliday)
    const drHasSchedule = doctorActiveSessions.length > 0
    const drSessionCount = doctorSessions.length

    let drTotalAvailableSlots = 0
    let drRemainingSlots = 0

    for (const session of doctorActiveSessions) {
      const specificHolidays = drApplicableHolidays.filter(h => !isFullDayHoliday(h)).flatMap(getHolidayRanges)
      const slots = generateSlots(session.schedule, slotDuration).filter(
        slot => !specificHolidays.some(range => rangesOverlap(slot, range))
      )
      drTotalAvailableSlots += slots.length

      const freeSlots = slots.filter(slot => {
        return !appointments.some(appt => {
          if (!matchesScopedAppointment(appt, dateKey, [doctorId], session.clinicId ? [session.clinicId] : undefined)) return false;
          const apptStartTime = appt.schedule?.startTime;
          if (!apptStartTime) return false;
          const apptStart = toMinutes(apptStartTime);
          if (apptStart === null) return false;
          const apptDuration = (isObject(appt.service) ? appt.service.duration : DEFAULT_SERVICE_DURATION) || DEFAULT_SERVICE_DURATION;
          const apptEnd = apptStart + apptDuration;
          return rangesOverlap(slot, { start: apptStart, end: apptEnd });
        });
      });
      drRemainingSlots += freeSlots.length
    }

    const isDrHoliday = drFullDayHoliday || (drSessionCount > 0 && !drHasSchedule) || (drHasSchedule && drTotalAvailableSlots === 0 && drApplicableHolidays.length > 0)
    
    let drLevel: AvailabilityHeatmapLevel = "high"
    if (isDrHoliday) {
      drLevel = "holiday"
    } else if (drTotalAvailableSlots > 0) {
      const ratio = (drTotalAvailableSlots - drRemainingSlots) / drTotalAvailableSlots
      if (ratio >= 1) drLevel = "low"
      else if (ratio >= 0.5) drLevel = "medium"
    }

    perTargetAvailability[doctorId] = {
      level: drLevel,
      isHoliday: isDrHoliday
    }
  }

  // Calculate for each scoped clinic
  for (const clinicId of scopedClinicIds) {
    const isClHoliday = fullDayClinicHolidayIds.has(clinicId)
    perTargetAvailability[clinicId] = {
      level: isClHoliday ? "holiday" : "high",
      isHoliday: isClHoliday
    }
  }

  return {
    dateKey,
    level,
    bookedSlots: bookedSlotsForDay,
    totalSlots,
    remainingSlots,
    availabilityRatio,
    isFullyBooked: availabilityRatio >= 1 && totalSlots > 0,
    isDoctorHoliday: indicators.includes("doctor_holiday"),
    isClinicHoliday,
    doctorStatus: indicators.includes("doctor_holiday") ? "on_holiday" : "available",
    clinicStatus: isClinicHoliday ? "closed" : "open",
    indicators,
    holidayRanges: allSpecificHolidayRanges,
    perTargetAvailability,
  }
}

export function buildAvailabilityHeatmapMap(
  month: number,
  year: number,
  appointments: Appointment[],
  doctorSessions: DoctorSession[],
  options: ComputeAvailabilityHeatmapOptions = {}
) {
  const start = startOfMonth(new Date(year, month - 1))
  const end = endOfMonth(start)
  const days = eachDayOfInterval({ start, end })

  return new Map(
    days.map((day) => {
      const summary = computeAvailabilityHeatmap(day, appointments, doctorSessions, options)
      if (process.env.NODE_ENV === "development") {
        console.log({
          date: summary.dateKey,
          booked: summary.bookedSlots,
          capacity: summary.totalSlots,
          remaining: summary.remainingSlots,
          ratio: summary.availabilityRatio,
          level: summary.level,
        })
      }
      return [summary.dateKey, summary] as const
    })
  )
}

function shouldUseZeroCapacityFallback(
  sessionCount: number,
  hasScheduleCoverage: boolean,
  isClinicHoliday: boolean,
  isDoctorHoliday: boolean
) {
  return isClinicHoliday || isDoctorHoliday || (sessionCount > 0 && !hasScheduleCoverage)
}
