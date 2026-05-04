"use client"

import { type ComponentProps, useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { DayButton, getDefaultClassNames } from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  getAvailabilityBackgroundClass,
  type DailyAvailabilitySummary,
} from "@/lib/calendar-availability"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  events?: Array<{ date: Date; count: number }>
  availabilityByDate?: Map<string, DailyAvailabilitySummary>
}

export function DatePicker({
  selectedDate,
  onDateSelect,
  availabilityByDate,
}: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate || new Date())

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate)
    }
  }, [selectedDate])

  const handleDateSelect = (nextDate: Date | undefined) => {
    if (!nextDate) {
      return
    }

    setDate(nextDate)
    onDateSelect?.(nextDate)
  }

  const MiniCalendarDayButton = ({
    className,
    day,
    modifiers,
    ...props
  }: ComponentProps<typeof DayButton>) => {
    const defaultClassNames = getDefaultClassNames()
    const ref = useRef<HTMLButtonElement>(null)
    const dateKey = format(day.date, "yyyy-MM-dd")
    const daySummary = availabilityByDate?.get(dateKey)
    const isSelected =
      modifiers.selected &&
      !modifiers.range_start &&
      !modifiers.range_end &&
      !modifiers.range_middle
    const isToday = modifiers.today

    useEffect(() => {
      if (modifiers.focused) ref.current?.focus()
    }, [modifiers.focused])

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        data-day={day.date.toLocaleDateString()}
        data-selected-single={isSelected}
        data-range-start={modifiers.range_start}
        data-range-end={modifiers.range_end}
        data-range-middle={modifiers.range_middle}
        className={cn(
          "relative flex aspect-square size-auto w-full min-w-(--cell-size) items-center justify-center overflow-hidden bg-transparent p-0 leading-none font-normal text-inherit hover:bg-transparent hover:text-inherit group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10",
          defaultClassNames.day,
          isSelected
            ? "border-primary ring-2 ring-primary ring-inset focus-visible:border-primary focus-visible:ring-0"
            : "focus-visible:border-primary focus-visible:ring-primary/40 group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:border-primary group-data-[focused=true]/day:ring-primary/40",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-inherit transition-opacity group-hover/day:opacity-90",
            getAvailabilityBackgroundClass(daySummary?.level),
            isToday && "ring-2 ring-black dark:ring-white"
          )}
        >
          {props.children}
        </span>
      </Button>
    )
  }

  return (
    <div className="flex justify-center">
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleDateSelect}
        className="w-full [&_[role=gridcell]_button]:cursor-pointer [&_button]:cursor-pointer"
        classNames={{
          today: "bg-transparent text-inherit",
        }}
        components={{
          DayButton: MiniCalendarDayButton,
        }}
      />
    </div>
  )
}
