"use client"

import { useCallback, useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { DailyAvailabilitySummary } from "@/lib/calendar-availability"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/types/calendar.types"
import type { DoctorSession } from "@/types/doctor-session.types"
import type { UseCalendarFiltersReturn } from "@/hooks/use-calendar-filters"

import { CalendarMain } from "./calendar-main"
import { CalendarSidebar } from "./calendar-sidebar"

type DoctorItem = { _id: string; firstName: string; lastName: string }
type ServiceItem = { _id: string; name: string }

interface CalendarProps {
  filters: UseCalendarFiltersReturn
  doctors: DoctorItem[]
  services: ServiceItem[]
  isDoctor: boolean
  events: CalendarEvent[]
  eventDates: Array<{ date: Date; count: number }>
  availabilityByDate: Map<string, DailyAvailabilitySummary>
  doctorSessions: DoctorSession[]
  addAppointmentTrigger?: React.ReactNode
  onMonthChange?: (month: number, year: number) => void
  onEventClick?: (event: CalendarEvent) => void
}

export function Calendar({
  filters,
  doctors,
  services,
  isDoctor,
  events,
  eventDates,
  availabilityByDate,
  doctorSessions,
  addAppointmentTrigger,
  onMonthChange,
  onEventClick,
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showCalendarSheet, setShowCalendarSheet] = useState(false)
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    setShowCalendarSheet(false)
  }, [])
  const [isMonthView, setIsMonthView] = useState(true)

  return (
    <div className="relative rounded-lg border bg-background">
      <div
        className={cn(
          "flex",
          isMonthView ? "min-h-0" : "min-h-[800px]"
        )}
      >
        <div className="hidden w-80 shrink-0 border-r xl:block">
          <CalendarSidebar
            filters={filters}
            doctors={doctors}
            services={services}
            isDoctor={isDoctor}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            addAppointmentTrigger={addAppointmentTrigger}
            events={eventDates}
            availabilityByDate={availabilityByDate}
            className="h-full"
          />
        </div>

        <div className="min-w-0 flex-1">
          <CalendarMain
            filters={filters}
            doctors={doctors}
            services={services}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMenuClick={() => setShowCalendarSheet(true)}
            events={events}
            availabilityByDate={availabilityByDate}
            doctorSessions={doctorSessions}
            onMonthChange={onMonthChange}
            onEventClick={onEventClick}
            onContentViewChange={setIsMonthView}
          />
        </div>
      </div>

      <Sheet open={showCalendarSheet} onOpenChange={setShowCalendarSheet}>
        <SheetContent side="left" className="w-80 p-0" style={{ position: "absolute" }}>
          <SheetHeader className="p-4 pb-2">
            <SheetTitle>Appointments</SheetTitle>
            <SheetDescription>Browse dates and manage appointments</SheetDescription>
          </SheetHeader>
          <CalendarSidebar
            filters={filters}
            doctors={doctors}
            services={services}
            isDoctor={isDoctor}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            addAppointmentTrigger={addAppointmentTrigger}
            events={eventDates}
            availabilityByDate={availabilityByDate}
            className="h-full"
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
