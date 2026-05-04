"use client"

import { startOfDay, isAfter, isBefore } from "date-fns"
import { z } from "zod"

import { DatePickerInput } from "@/components/ui/date-picker-input"

export type DobRole = "doctor" | "patient" | "receptionist" | "clinic_admin" | "admin"

function getToday() {
  return startOfDay(new Date())
}

function getMinimumDobDate(role: DobRole) {
  const today = getToday()
  const minimumYear = role === "patient" ? today.getFullYear() - 120 : today.getFullYear() - 100
  return new Date(minimumYear, 0, 1)
}

function getAdultCutoffDate() {
  const today = getToday()
  return startOfDay(new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()))
}

export function getDobDateBounds(role: DobRole) {
  const today = getToday()

  return {
    minDate: getMinimumDobDate(role),
    maxDate: today,
    validationMaxDate: today,
  }
}

function parseDob(value: string) {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) {
    return null
  }

  const parsedDate = startOfDay(new Date(year, month - 1, day))
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

export function createDobSchema(role: DobRole) {
  const today = getToday()
  const minDobDate = getMinimumDobDate(role)
  const adultCutoffDate = getAdultCutoffDate()

  return z
    .string()
    .min(1, { message: "Please enter date of birth." })
    .refine((value) => parseDob(value) !== null, {
      message: "Please enter a valid date of birth.",
    })
    .refine((value) => {
      const parsedDate = parseDob(value)
      return parsedDate ? !isAfter(parsedDate, today) : false
    }, {
      message: "Date of birth cannot be in the future.",
    })
    .refine((value) => {
      const parsedDate = parseDob(value)
      return parsedDate ? !isBefore(parsedDate, minDobDate) : false
    }, {
      message: "Please select a valid date of birth.",
    })
    .refine((value) => {
      if (role === "patient") {
        return true
      }

      const parsedDate = parseDob(value)
      return parsedDate ? !isAfter(parsedDate, adultCutoffDate) : false
    }, {
      message: "User must be at least 18 years old",
    })
}

type DobDatePickerProps = {
  role: DobRole
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  showMonthDropdown?: boolean
  showYearDropdown?: boolean
  dropdownMode?: "select" | "scroll"
}

export function DobDatePicker({
  role,
  value,
  onChange,
  placeholder = "Select date",
  className,
  disabled,
  minDate: customMinDate,
  maxDate: customMaxDate,
  showMonthDropdown = true,
  showYearDropdown = true,
  dropdownMode = "select",
}: DobDatePickerProps) {
  const today = getToday()
  const { minDate: roleMinDate, maxDate: roleMaxDate } = getDobDateBounds(role)
  
  const minDate = customMinDate ?? roleMinDate
  const maxDate = customMaxDate ?? roleMaxDate
  
  const openDate = value ? startOfDay(value) : today

  return (
    <DatePickerInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      openToDate={openDate}
      showMonthDropdown={showMonthDropdown}
      showYearDropdown={showYearDropdown}
      dropdownMode={dropdownMode}
      scrollableYearDropdown
      yearDropdownItemNumber={100}
    />
  )
}
