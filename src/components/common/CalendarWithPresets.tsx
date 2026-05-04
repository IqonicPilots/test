"use client"

import * as React from "react"
import { addDays, startOfToday, startOfMonth, addMonths, subMonths, format } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CalendarWithPresetsProps {
  date?: Date | undefined
  onDateChange?: (date: Date | undefined) => void
  className?: string
}

export function CalendarWithPresets({
  date: externalDate,
  onDateChange,
  className
}: CalendarWithPresetsProps) {
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    startOfToday()
  )

  const date = externalDate !== undefined ? externalDate : internalDate
  const setDate = (newDate: Date | undefined) => {
    if (onDateChange) {
      onDateChange(newDate)
    } else {
      setInternalDate(newDate)
    }
  }

  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    startOfMonth(date || new Date())
  )

  const presets = [
    { label: "Today", value: 0 },
    { label: "Tomorrow", value: 1 },
    { label: "In 3 days", value: 3 },
    { label: "In a week", value: 7 },
    { label: "In 2 weeks", value: 14 },
  ]

  return (
    <Card className={cn("shadow-none border-none bg-transparent", className)}>
      <CardContent className="p-0">
        <div className="w-full max-w-2xl mx-auto">
          {/* Custom Elegant Header */}
          <div className="flex items-center justify-center gap-10 mb-12">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl bg-white border-gray-100 shadow-sm hover:bg-gray-50 transition-all active:scale-95"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-5 w-5 text-gray-900" />
            </Button>

            <h2 className="text-xl font-black text-gray-900 tracking-tighter min-w-[280px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </h2>

            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl bg-white border-gray-100 shadow-sm hover:bg-gray-50 transition-all active:scale-95"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-5 w-5 text-gray-900" />
            </Button>
          </div>

          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            disableNavigation
            disabled={{ before: startOfToday() }}
            className="w-full"
            classNames={{
              root: "w-full",
              months: "w-full",
              month: "w-full space-y-10 calendar-bookingflow",
              table: "w-full border-collapse",
              head_row: "grid grid-cols-7 mb-8",
              head_cell: "text-gray-400 font-bold uppercase tracking-[0.3em] text-center",
              row: "grid grid-cols-7 w-full mt-4",
              cell: "h-14 w-full text-center text-sm p-0 relative flex items-center justify-center border-none",
              day: cn(
                "h-12 w-12 p-0 font-bold hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center text-gray-900 text-lg mx-auto"
              ),
              day_selected: "bg-primary text-white hover:bg-primary hover:text-white rounded-xl font-black shadow-lg !opacity-100",
              day_today: "bg-gray-100 text-gray-900 rounded-xl font-bold ring-2 ring-primary/10",
              caption: "hidden",
              caption_label: "hidden",
              month_caption: "hidden",
              button_next: "hidden",
              button_previous: "hidden",
            }}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3 border-t-0 p-6 pt-10 px-0">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            variant="outline"
            className="flex-1 rounded-2xl text-sm font-semibold uppercase tracking-widest bg-white hover:bg-secondary/50 hover:text-secondary/500 hover:border-secondary transition-all shadow-sm border-muted"
            onClick={() => {
              const newDate = addDays(startOfToday(), preset.value)
              setDate(newDate)
              setCurrentMonth(startOfMonth(newDate))
            }}
          >
            {preset.label}
          </Button>
        ))}
      </CardFooter>
    </Card>
  )
}
