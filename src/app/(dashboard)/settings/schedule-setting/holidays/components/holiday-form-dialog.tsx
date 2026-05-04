"use client"

import { useMemo } from "react"
import type { UseFormReturn } from "react-hook-form"
import { format, startOfDay } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { z } from "zod"

import { GenericFormDialog } from "@/components/generic-form-dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useClinics } from "@/hooks/api/use-clinics"
import { useDoctors } from "@/hooks/api/use-doctors"
import { useCreateHoliday, useUpdateHoliday } from "@/hooks/api/use-holidays"
import { cn } from "@/lib/utils"
import type { Holiday, HolidayMode } from "@/services/holiday.service"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"

const MODE_OPTIONS: { value: "single" | "multiple" | "range"; label: string }[] = [
  { value: "single", label: "Single Day" },
  { value: "multiple", label: "Multiple Days" },
  { value: "range", label: "Date Range" },
]

const baseSchema = z.object({
  mode: z.union([z.literal(""), z.enum(["single", "multiple", "range"])]),
  category: z.union([z.literal(""), z.enum(["clinic", "doctor"])]),
  target: z.string().min(1, "Please select a target."),
  description: z.string().optional(),
  holiday_dates: z.array(z.string()),
  apply_specific_time: z.boolean().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
})

const holidayFormSchema = baseSchema.superRefine((data, ctx) => {
  if (!data.category) {
    ctx.addIssue({ code: "custom", message: "Please select a category.", path: ["category"] })
  }
  if (!data.mode) {
    ctx.addIssue({ code: "custom", message: "Please select a mode.", path: ["mode"] })
  }
  if (!data.holiday_dates?.length) {
    ctx.addIssue({ code: "custom", message: "Date is required.", path: ["holiday_dates"] })
  }
  if (data.mode === "range" && (data.holiday_dates?.length ?? 0) >= 2) {
    const [start, end] = data.holiday_dates
    if (new Date(start) > new Date(end)) {
      ctx.addIssue({
        code: "custom",
        message: "Start date must be before or equal to end date.",
        path: ["holiday_dates"],
      })
    }
  }
  if (data.apply_specific_time) {
    if (!data.start_time?.trim()) {
      ctx.addIssue({ code: "custom", message: "Start time is required.", path: ["start_time"] })
    }
    if (!data.end_time?.trim()) {
      ctx.addIssue({ code: "custom", message: "End time is required.", path: ["end_time"] })
    }
    if (data.start_time && data.end_time) {
      const [sh, sm] = data.start_time.split(":").map(Number)
      const [eh, em] = data.end_time.split(":").map(Number)
      if (sh * 60 + sm >= eh * 60 + em) {
        ctx.addIssue({
          code: "custom",
          message: "End time must be after start time.",
          path: ["end_time"],
        })
      }
    }
  }
})

type HolidayFormValues = z.infer<typeof baseSchema>

type TargetOption = { value: string; label: string }

function getTargetId(target: Holiday["target"]): string {
  if (!target) return ""
  return typeof target === "string" ? target : (target as { _id?: string })._id ?? ""
}

function buildTargetOptions(
  category: string,
  doctors: Doctor[],
  clinics: Clinic[]
): TargetOption[] {
  if (!category) return []
  if (category === "doctor") {
    return doctors.map((d) => ({
      value: d._id,
      label: [d.firstName, d.lastName].filter(Boolean).join(" ") || d._id,
    }))
  }
  return clinics.map((c) => ({
    value: c._id,
    label: c.name || c._id,
  }))
}

function targetFieldLabel(category: string): string {
  if (!category) return "Target"
  return category === "clinic" ? "Clinic" : "Doctor"
}

function datePlaceholderForMode(mode: string): string {
  if (!mode) return "Select mode first"
  if (mode === "single") return "Select date"
  if (mode === "range") return "Select date range"
  return "Select multiple dates"
}

function getDateDisplay(
  mode: string,
  holidayDates: string[] | undefined,
  singleDate: Date | undefined,
  rangeDates: DateRange | undefined
): string {
  const placeholder = datePlaceholderForMode(mode)
  if (mode === "single" && singleDate) {
    return format(singleDate, "PPP")
  }
  if (mode === "range" && rangeDates?.from) {
    return rangeDates.to
      ? `${format(rangeDates.from, "PPP")} – ${format(rangeDates.to, "PPP")}`
      : format(rangeDates.from, "PPP")
  }
  if (mode === "multiple" && holidayDates?.length) {
    return `${holidayDates.length} date(s) selected`
  }
  return placeholder
}

interface HolidayFormFieldsProps {
  form: UseFormReturn<HolidayFormValues>
  values: HolidayFormValues
  doctors: Doctor[]
  clinics: Clinic[]
}

function HolidayFormFields({ form, values, doctors, clinics }: HolidayFormFieldsProps) {
  const targetOptions = buildTargetOptions(values.category, doctors, clinics)

  const singleDate = values.holiday_dates?.[0] ? new Date(values.holiday_dates[0]) : undefined
  const multiDates =
    values.mode === "multiple" && values.holiday_dates?.length
      ? values.holiday_dates.map((d) => new Date(d))
      : undefined
  const rangeDates: DateRange | undefined =
    values.mode === "range" && values.holiday_dates?.length
      ? {
          from: values.holiday_dates[0] ? new Date(values.holiday_dates[0]) : undefined,
          to: values.holiday_dates[1] ? new Date(values.holiday_dates[1]) : undefined,
        }
      : undefined

  const showTimeFields = values.apply_specific_time
  const disabledPastDates = { before: startOfDay(new Date()) }
  const dateDisplay = getDateDisplay(values.mode, values.holiday_dates, singleDate, rangeDates)

  const onModeChange = (nextMode: string) => {
    if (!nextMode) return
    const dates = values.holiday_dates ?? []
    const sorted = [...dates].sort()
    if (nextMode === "single") {
      form.setValue("holiday_dates", dates.length ? [sorted[0]] : [])
    } else if (nextMode === "range") {
      form.setValue(
        "holiday_dates",
        dates.length >= 2
          ? [sorted[0], sorted[sorted.length - 1]]
          : dates.length === 1
            ? [dates[0], dates[0]]
            : []
      )
    } else {
      form.setValue("holiday_dates", [])
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>
              Category <span className="text-destructive">*</span>
            </FormLabel>
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v)
                form.setValue("target", "")
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="clinic" className="cursor-pointer">
                  Clinic
                </SelectItem>
                <SelectItem value="doctor" className="cursor-pointer">
                  Doctor
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="target"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>
              {targetFieldLabel(values.category)}{" "}
              <span className="text-destructive">*</span>
            </FormLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={!targetOptions.length}
            >
              <FormControl>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue
                    placeholder={
                      !values.category
                        ? "Select category first"
                        : `Select ${values.category}`
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {targetOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="col-span-1 md:col-span-2">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g. Christmas Day"
                  rows={2}
                  className="w-full resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="mode"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>
              Mode <span className="text-destructive">*</span>
            </FormLabel>
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v)
                if (!v) return
                onModeChange(v)
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="holiday_dates"
        render={() => (
          <FormItem className="space-y-2">
            <FormLabel>
              Date <span className="text-destructive">*</span>
            </FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!values.mode}
                    className={cn(
                      "w-full justify-start text-left font-normal cursor-pointer",
                      (!values.holiday_dates?.length || !values.mode) && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateDisplay}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                {values.mode === "range" ? (
                  <Calendar
                    mode="range"
                    defaultMonth={rangeDates?.from ?? new Date()}
                    selected={rangeDates}
                    disabled={disabledPastDates}
                    onSelect={(range: DateRange | undefined) => {
                      const from = range?.from
                      const to = range?.to ?? from
                      if (from) {
                        const start = format(from, "yyyy-MM-dd")
                        const end = to ? format(to, "yyyy-MM-dd") : undefined
                        form.setValue(
                          "holiday_dates",
                          [start, end].filter((d): d is string => d !== undefined).sort()
                        )
                      } else {
                        form.setValue("holiday_dates", [])
                      }
                      form.clearErrors("holiday_dates")
                    }}
                    numberOfMonths={2}
                    initialFocus
                  />
                ) : values.mode === "multiple" ? (
                  <Calendar
                    mode="multiple"
                    selected={multiDates ?? []}
                    disabled={disabledPastDates}
                    onSelect={(selected: Date[] | undefined) => {
                      const dates = selected ?? []
                      form.setValue(
                        "holiday_dates",
                        dates.map((d) => format(d, "yyyy-MM-dd")).sort()
                      )
                      form.clearErrors("holiday_dates")
                    }}
                    initialFocus
                  />
                ) : (
                  <Calendar
                    mode="single"
                    selected={singleDate}
                    disabled={disabledPastDates}
                    onSelect={(d: Date | undefined) => {
                      form.setValue("holiday_dates", d ? [format(d, "yyyy-MM-dd")] : [])
                      form.clearErrors("holiday_dates")
                    }}
                    initialFocus
                  />
                )}
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="col-span-1 md:col-span-2">
        <FormField
          control={form.control}
          name="apply_specific_time"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <div className="flex w-full items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Apply Specific Time
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Restrict holiday to specific start and end times
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked)
                      if (!checked) {
                        form.setValue("start_time", "")
                        form.setValue("end_time", "")
                      }
                    }}
                    className="cursor-pointer"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {showTimeFields ? (
        <>
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>
                  Start Time <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="time" step="300" className="w-full cursor-pointer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>
                  End Time <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="time" step="300" className="w-full cursor-pointer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      ) : null}
    </div>
  )
}

interface HolidayFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  holiday?: Holiday | null
  onSuccess?: () => void
}

export function HolidayFormDialog({
  open,
  onOpenChange,
  holiday,
  onSuccess,
}: HolidayFormDialogProps) {
  const isEditing = !!holiday
  const createMutation = useCreateHoliday()
  const updateMutation = useUpdateHoliday()

  const { data: clinicsResponse } = useClinics(1, 200)
  const { data: doctorsResponse } = useDoctors(1, 200, true, { status: "active" })

  const clinics = useMemo(() => {
    const d = clinicsResponse?.data
    return Array.isArray(d) ? (d as Clinic[]) : []
  }, [clinicsResponse])

  const doctors = useMemo(() => {
    const d = doctorsResponse?.data
    return Array.isArray(d) ? (d as Doctor[]) : []
  }, [doctorsResponse])

  const defaultValues: HolidayFormValues = useMemo(() => {
    if (holiday && holiday.holiday_dates?.length) {
      const dates = holiday.holiday_dates.map((d) => d.split("T")[0])
      const times = holiday.specific_time
      const mode = (
        holiday.mode === "multiple" || holiday.mode === "range" ? holiday.mode : "single"
      ) as "single" | "multiple" | "range"
      return {
        mode,
        category: (holiday.category as "clinic" | "doctor") ?? "",
        target: getTargetId(holiday.target),
        description: holiday.description || "",
        holiday_dates: dates,
        apply_specific_time: holiday.apply_specific_time ?? false,
        start_time: times?.[0] ?? "",
        end_time: times?.[1] ?? "",
      }
    }
    return {
      mode: "",
      category: "",
      target: "",
      description: "",
      holiday_dates: [],
      apply_specific_time: false,
      start_time: "",
      end_time: "",
    }
  }, [holiday])

  const handleSubmit = async (data: HolidayFormValues) => {
    const holidayDates = data.holiday_dates.map((d) => new Date(d).toISOString())

    const payload = {
      mode: data.mode as HolidayMode,
      category: data.category as "clinic" | "doctor",
      target: data.target,
      holiday_dates: holidayDates,
      description: data.description || undefined,
      apply_specific_time: data.apply_specific_time ?? false,
      specific_time:
        data.apply_specific_time && data.start_time && data.end_time
          ? [data.start_time, data.end_time]
          : undefined,
    }

    if (isEditing && holiday) {
      await updateMutation.mutateAsync({ id: holiday._id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <GenericFormDialog
      key={holiday?._id ?? "new"}
      title={isEditing ? "Edit Holiday" : "Add Holiday"}
      description={
        isEditing
          ? "Update the holiday details below."
          : "Configure a new clinic or doctor holiday."
      }
      formSchema={holidayFormSchema as z.ZodObject<z.ZodRawShape>}
      defaultValues={defaultValues}
      onSubmit={(data) => handleSubmit(data as HolidayFormValues)}
      open={open}
      onOpenChange={onOpenChange}
      hideTrigger
      closeOnSubmit
      resetOnSubmit
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      submitButtonText={isEditing ? "Update" : "Add"}
      dialogSize="md"
      fields={[]}
      renderContent={({ form, values }) => (
        <HolidayFormFields
          form={form as unknown as UseFormReturn<HolidayFormValues>}
          values={values as HolidayFormValues}
          doctors={doctors}
          clinics={clinics}
        />
      )}
    />
  )
}
