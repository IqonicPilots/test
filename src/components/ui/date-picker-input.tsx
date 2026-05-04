"use client"

import * as React from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDay,
  getYear,
  getMonth,
  setMonth,
  setYear,
  isAfter,
  isBefore,
} from "date-fns"
import { ChevronUp, ChevronDown, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DatePickerInputProps {
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  className?: string
  /** If true, shows as a plain input trigger (for filter use), else shows date text button */
  inputMode?: boolean
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  openToDate?: Date
  showMonthDropdown?: boolean
  showYearDropdown?: boolean
  dropdownMode?: "select" | "scroll"
  scrollableYearDropdown?: boolean
  yearDropdownItemNumber?: number
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function getCalendarDays(month: Date): Array<Date | null> {
  const firstDay = startOfMonth(month)
  const lastDay = endOfMonth(month)
  // Week starts Monday (1). getDay() returns 0=Sun...6=Sat
  // We need Mon=0 offset
  let startOffset = getDay(firstDay) - 1
  if (startOffset < 0) startOffset = 6 // Sunday => offset 6

  const days: Array<Date | null> = []
  for (let i = 0; i < startOffset; i++) {
    days.push(null)
  }
  eachDayOfInterval({ start: firstDay, end: lastDay }).forEach((d) => days.push(d))
  // Pad end to complete last week row
  while (days.length % 7 !== 0) {
    days.push(null)
  }
  return days
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = "Select date",
  className,
  inputMode = false,
  disabled,
  minDate,
  maxDate,
  openToDate,
  showMonthDropdown = false,
  showYearDropdown = false,
  dropdownMode = "select",
  scrollableYearDropdown = false,
  yearDropdownItemNumber = 100,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false)
  const resolvedOpenDate = React.useMemo(
    () => openToDate ?? value ?? new Date(),
    [openToDate?.getTime(), value?.getTime()]
  )
  const [viewMonth, setViewMonth] = React.useState<Date>(resolvedOpenDate)

  // Sync viewMonth when value changes externally
  React.useEffect(() => {
    if (value) {
      setViewMonth(value)
      return
    }

    if (!open) {
      setViewMonth(resolvedOpenDate)
    }
  }, [open, resolvedOpenDate, value])

  React.useEffect(() => {
    if (!open) {
      return
    }

    setViewMonth(value ?? resolvedOpenDate)
  }, [open, resolvedOpenDate, value])

  const calendarDays = getCalendarDays(viewMonth)
  const shouldShowMonthDropdown = showMonthDropdown && dropdownMode === "select"
  const shouldShowYearDropdown = showYearDropdown && dropdownMode === "select"
  const minYear = minDate ? getYear(minDate) : getYear(resolvedOpenDate) - yearDropdownItemNumber
  const maxYear = maxDate ? getYear(maxDate) : getYear(resolvedOpenDate) + Math.max(yearDropdownItemNumber, 20)
  const yearOptions = React.useMemo(() => {
    return Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index)
  }, [maxYear, minYear])

  const isDateDisabled = React.useCallback(
    (day: Date) => {
      if (minDate && isBefore(day, minDate) && !isSameDay(day, minDate)) {
        return true
      }

      if (maxDate && isAfter(day, maxDate) && !isSameDay(day, maxDate)) {
        return true
      }

      return false
    },
    [maxDate, minDate]
  )

  const handleSelect = (day: Date) => {
    if (isDateDisabled(day)) {
      return
    }
    onChange?.(day)
    setOpen(false)
  }

  const handleClear = () => {
    onChange?.(null)
    setOpen(false)
  }

  const handleToday = () => {
    const today = new Date()
    if (isDateDisabled(today)) {
      return
    }
    setViewMonth(today)
    onChange?.(today)
    setOpen(false)
  }

  const displayValue = value ? format(value, "dd-MM-yyyy") : ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {inputMode ? (
          <div className={cn("relative cursor-pointer group", className)}>
            <CalendarIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors group-hover:text-primary" />
            <Input
              readOnly
              value={displayValue}
              placeholder={placeholder}
              disabled={disabled}
              className="h-9 text-sm pl-9 cursor-pointer transition-colors hover:border-primary"
              onClick={() => setOpen(true)}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            type="button"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal transition-colors hover:border-primary hover:bg-accent/50",
              !value && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
            {displayValue || placeholder}
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 shadow-md" align="start">
        <div className="p-3 min-w-[260px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {shouldShowMonthDropdown ? (
                <select
                  value={getMonth(viewMonth)}
                  onChange={(event) => setViewMonth((current) => setMonth(current, Number(event.target.value)))}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {MONTH_OPTIONS.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm font-semibold">{format(viewMonth, "MMMM")}</div>
              )}

              {shouldShowYearDropdown ? (
                <select
                  value={getYear(viewMonth)}
                  onChange={(event) => setViewMonth((current) => setYear(current, Number(event.target.value)))}
                  className={cn(
                    "h-8 rounded-md border border-input bg-background px-2 text-sm",
                    scrollableYearDropdown && "max-h-60"
                  )}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm font-semibold">{format(viewMonth, "yyyy")}</div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setViewMonth((m) => subMonths(m, 1))}
                className="p-1 rounded hover:bg-accent transition-colors"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="p-1 rounded hover:bg-accent transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} />
              }

              const isSelected = value ? isSameDay(day, value) : false
              const isTodayDay = isToday(day)
              const isCurrentMonth = isSameMonth(day, viewMonth)
              const disabledDay = isDateDisabled(day)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelect(day)}
                  disabled={disabledDay}
                  className={cn(
                    "relative flex items-center justify-center text-sm rounded-md h-8 w-full transition-colors",
                    !isCurrentMonth && "text-muted-foreground opacity-40",
                    disabledDay && "cursor-not-allowed opacity-25 hover:bg-transparent",
                    isCurrentMonth && !isSelected && !isTodayDay &&
                      "hover:bg-accent hover:text-accent-foreground",
                    isTodayDay && !isSelected &&
                      "border border-primary text-primary font-medium",
                    isSelected &&
                      "bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                  )}
                >
                  {format(day, "d")}
                </button>
              )
            })}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
