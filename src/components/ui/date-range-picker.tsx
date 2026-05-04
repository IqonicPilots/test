"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  className?: React.HTMLAttributes<HTMLDivElement>["className"]
  date?: DateRange | undefined
  onDateChange?: (date: DateRange | undefined) => void
  /** Use full width (e.g. in form layouts) */
  fullWidth?: boolean
}

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
  fullWidth,
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (newDate: DateRange | undefined) => {
    onDateChange?.(newDate)
    // Only close if we have both dates and they are different (completing a range)
    if (newDate?.from && newDate?.to && newDate.from.getTime() !== newDate.to.getTime()) {
      setOpen(false)
    }
  }

  return (
    <div className={cn("grid gap-2", className, fullWidth && "w-full")}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal cursor-pointer",
              fullWidth ? "w-full" : "w-full sm:w-[300px]",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4 " />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}

          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
