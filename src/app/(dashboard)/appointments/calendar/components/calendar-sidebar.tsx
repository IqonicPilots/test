"use client"

import { useState } from "react"
import { ChevronRight, Plus } from "lucide-react"
import {
  TIME_FILTER_LABELS,
  STATUS_FILTER_LABELS,
  STATUS_COLORS,
  type AppointmentTimeFilter,
  type AppointmentStatusFilter,
} from "@/lib/calendar-filters"
import type { DailyAvailabilitySummary } from "@/lib/calendar-availability"
import type { UseCalendarFiltersReturn } from "@/hooks/use-calendar-filters"
import { DatePicker } from "./date-picker"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

type DoctorItem = { _id: string; firstName: string; lastName: string }
type ServiceItem = { _id: string; name: string }

interface CalendarSidebarProps {
  filters: UseCalendarFiltersReturn
  doctors: DoctorItem[]
  services: ServiceItem[]
  isDoctor: boolean
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  addAppointmentTrigger?: React.ReactNode
  events?: Array<{ date: Date; count: number }>
  availabilityByDate?: Map<string, DailyAvailabilitySummary>
  className?: string
}

export function CalendarSidebar({
  filters,
  doctors,
  services,
  isDoctor,
  selectedDate,
  onDateSelect,
  addAppointmentTrigger,
  events = [],
  availabilityByDate,
  className,
}: CalendarSidebarProps) {
  const showDoctorFilter = !isDoctor
  const [openSection, setOpenSection] = useState<
    "appointments" | "status" | "doctor" | "service" | null
  >("appointments")

  const handleToggle = (section: NonNullable<typeof openSection>) => {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  return (
    <div className={cn("flex h-full flex-col rounded-lg bg-background", className ?? "")}>
      <div className="border-b p-6">
        {addAppointmentTrigger ?? (
          <Button className="w-full cursor-pointer" type="button">
            <Plus className="h-4 w-4" />
            Add Appointment
          </Button>
        )}
      </div>

      <DatePicker 
        selectedDate={selectedDate} 
        onDateSelect={onDateSelect} 
        events={events}
        availabilityByDate={availabilityByDate}
      />

      <div className="border-t my-3" />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {/* Section 1: Appointments (Time Filter) */}
          <Collapsible
            open={openSection === "appointments"}
            onOpenChange={() => handleToggle("appointments")}
            className="group/collapsible"
          >
            <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-1 py-1.5 hover:bg-accent hover:text-accent-foreground">
              <span className="text-sm font-semibold">Appointments</span>
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <RadioGroup
                value={filters.filters.timeFilter}
                onValueChange={(v) => filters.setTimeFilter(v as AppointmentTimeFilter)}
                className="mt-1.5 space-y-1 pl-2"
              >
                {(Object.keys(TIME_FILTER_LABELS) as AppointmentTimeFilter[]).map((key) => (
                  <label
                    key={key}
                    htmlFor={`time-${key}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-accent/50",
                      filters.filters.timeFilter === key && "bg-accent/30 text-foreground"
                    )}
                  >
                    <RadioGroupItem value={key} id={`time-${key}`} />
                    <span className="text-sm font-medium">{TIME_FILTER_LABELS[key]}</span>
                  </label>
                ))}
              </RadioGroup>
            </CollapsibleContent>
          </Collapsible>

          {/* Section 2: Status */}
          <Collapsible
            open={openSection === "status"}
            onOpenChange={() => handleToggle("status")}
            className="group/collapsible"
          >
            <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-1 py-1.5 hover:bg-accent hover:text-accent-foreground">
              <span className="text-sm font-semibold">Status</span>
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1.5 space-y-1.5 pl-2">
                {(Object.keys(STATUS_FILTER_LABELS) as AppointmentStatusFilter[]).map((key) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/50"
                  >
                    <Checkbox
                      checked={filters.filters.statusFilters.includes(key)}
                      onCheckedChange={(checked) =>
                        filters.setStatusFilter(key, !!checked)
                      }
                    />
                    <span
                      className={cn(
                        "h-3 w-3 shrink-0 rounded-full",
                        STATUS_COLORS[key]
                      )}
                    />
                    <span className="text-sm">{STATUS_FILTER_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Doctor */}
          {showDoctorFilter && (
            <Collapsible
              open={openSection === "doctor"}
              onOpenChange={() => handleToggle("doctor")}
              className="group/collapsible"
            >
              <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-1 py-1.5 hover:bg-accent hover:text-accent-foreground">
                <span className="text-sm font-semibold">Doctor</span>
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1.5 space-y-1.5 pl-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/50">
                    <Checkbox
                      checked={
                        doctors.length > 0 &&
                        filters.filters.doctorIds.length === doctors.length
                      }
                      onCheckedChange={() =>
                        filters.selectAllDoctors(doctors.map((d) => d._id))
                      }
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </label>
                  <div className="max-h-48 overflow-y-auto pr-2 space-y-1.5">
                    {doctors.map((doctor) => (
                      <label
                        key={doctor._id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/50"
                      >
                        <Checkbox
                          checked={filters.filters.doctorIds.includes(doctor._id)}
                          onCheckedChange={() => filters.toggleDoctor(doctor._id)}
                        />
                        <span className="text-sm truncate">
                          {doctor.firstName} {doctor.lastName}
                        </span>
                      </label>
                    ))}
                    {doctors.length === 0 && (
                      <p className="px-2 py-1 text-xs text-muted-foreground">
                        No doctors found
                      </p>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Service */}
          <Collapsible
            open={openSection === "service"}
            onOpenChange={() => handleToggle("service")}
            className="group/collapsible"
          >
            <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded-md px-1 py-1.5 hover:bg-accent hover:text-accent-foreground">
              <span className="text-sm font-semibold">Service</span>
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1.5 space-y-1.5 pl-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/50">
                  <Checkbox
                    checked={
                      services.length > 0 &&
                      filters.filters.serviceIds.length === services.length
                    }
                    onCheckedChange={() =>
                      filters.selectAllServices(services.map((s) => s._id))
                    }
                  />
                  <span className="text-sm font-medium">Select All</span>
                </label>
                <div className="max-h-48 overflow-y-auto pr-2 space-y-1.5">
                  {services.map((service) => (
                    <label
                      key={service._id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/50"
                    >
                      <Checkbox
                        checked={filters.filters.serviceIds.includes(service._id)}
                        onCheckedChange={() => filters.toggleService(service._id)}
                      />
                      <span className="text-sm truncate">{service.name}</span>
                    </label>
                  ))}
                  {services.length === 0 && (
                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      No services found
                    </p>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}
