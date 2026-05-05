import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type PointerEvent,
} from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { z } from "zod"
import { GenericFormDialog } from "@/components/generic-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useInfiniteDoctors } from "@/hooks/api/use-doctors"
import { useInfiniteClinics } from "@/hooks/api/use-clinics"
import { useProfile } from "@/hooks/api/use-profile"
import { DataTableInfiniteFilterSelect } from "@/components/common/data-table-filters"
import type { Clinic } from "@/types/clinic.types"
import {
  DOCTOR_SESSION_DAYS,
  type DoctorSession,
  type DoctorSessionBreak,
  type DoctorSessionDayId,
  type DoctorSessionSchedule,
} from "@/types/doctor-session.types"

function suppressNativeTimePickerOpen(e: PointerEvent<HTMLInputElement>) {
  e.preventDefault()
  e.currentTarget.focus()
}

function suppressNativeTimePickerKeys(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key === " " || e.code === "Space") {
    e.preventDefault()
  }
}

const TIME_INPUT_CLASSNAME =
  "appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none dark:[color-scheme:dark]"

const DAY_IDS = DOCTOR_SESSION_DAYS.map((day) => day.id) as [
  DoctorSessionDayId,
  ...DoctorSessionDayId[],
]

const doctorSessionBreakSchema = z.object({
  start: z.string(),
  end: z.string(),
  touched: z.boolean().optional(),
})

const doctorSessionDaySchema = z
  .object({
    id: z.enum(DAY_IDS),
    startTime: z.string(),
    endTime: z.string(),
    isActive: z.boolean(),
    breaks: z.array(doctorSessionBreakSchema),
  })
  .superRefine((value, ctx) => {
    if (!value.isActive) {
      return
    }

    if (!value.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Session start time is required.",
        path: ["startTime"],
      })
    }

    if (!value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Session end time is required.",
        path: ["endTime"],
      })
    }

    if (value.startTime && value.endTime && value.startTime >= value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Session end time must be after start time.",
        path: ["endTime"],
      })
    }

    value.breaks.forEach((currentBreak, index) => {
      if (!currentBreak.start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Break start time is required.",
          path: ["breaks", index, "start"],
        })
      }

      if (!currentBreak.end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Break end time is required.",
          path: ["breaks", index, "end"],
        })
      }

      if (
        currentBreak.start &&
        currentBreak.end &&
        currentBreak.start >= currentBreak.end
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Break end time must be after start time.",
          path: ["breaks", index, "end"],
        })
      }
    })
  })

const getDoctorSessionFormSchema = (isDoctor: boolean) => z
  .object({
    clinicId: z.string().min(1, { message: "Please select a clinic." }),
    doctorId: isDoctor ? z.string() : z.string().min(1, { message: "Please select a doctor." }),
    sessions: z.array(doctorSessionDaySchema).length(DOCTOR_SESSION_DAYS.length),
  })
  .superRefine((value, ctx) => {
    if (!value.sessions.some((session) => session.isActive)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please schedule at least one day.",
        path: ["sessions"],
      })
    }
  })

type DoctorSessionBreakFormValue = z.infer<typeof doctorSessionBreakSchema>
type DoctorSessionDayFormValue = z.infer<typeof doctorSessionDaySchema>
export type DoctorSessionFormValues = z.infer<ReturnType<typeof getDoctorSessionFormSchema>>

interface DoctorSessionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  clinics: Clinic[]
  sessionData?: DoctorSession | null
  fallbackClinicId?: string
  fallbackDoctorId?: string
  onAddSession: (values: DoctorSessionFormValues) => void | Promise<void>
  onEditSession: (values: DoctorSessionFormValues) => void | Promise<void>
  isSubmitting?: boolean
  isLoadingSession?: boolean
}

function getReferenceId(value: unknown) {
  if (!value) {
    return ""
  }

  if (typeof value === "string") {
    return value
  }

  if (typeof value === "object" && value !== null) {
    const candidate = value as {
      _id?: unknown
      id?: unknown
      doctorId?: unknown
      clinicId?: unknown
    }

    const possibleId =
      candidate._id ?? candidate.id ?? candidate.doctorId ?? candidate.clinicId

    return typeof possibleId === "string" ? possibleId : ""
  }

  return ""
}

function createDefaultSessions(): DoctorSessionDayFormValue[] {
  return DOCTOR_SESSION_DAYS.map((day) => ({
    id: day.id,
    startTime: "09:00",
    endTime: "18:00",
    isActive: false,
    breaks: [],
  }))
}

function mapBreaks(breaks?: DoctorSessionBreak[]) {
  return (breaks ?? []).map((item) => ({
    start: item.start ?? "",
    end: item.end ?? "",
    touched: false,
  }))
}

function normalizeSessions(sessions?: DoctorSessionSchedule[]) {
  const sessionsMap = new Map((sessions ?? []).map((session) => [session.id, session]))

  return createDefaultSessions().map((day) => {
    const current = sessionsMap.get(day.id)

    if (!current) {
      return day
    }

    return {
      id: day.id,
      startTime: current.startTime || day.startTime,
      endTime: current.endTime || day.endTime,
      isActive: current.isActive ?? true,
      breaks: mapBreaks(current.breaks),
    }
  })
}

function getDefaultValues(
  sessionData?: DoctorSession | null,
  fallbackIds?: { clinicId?: string; doctorId?: string }
): DoctorSessionFormValues {
  return {
    clinicId:
      getReferenceId(sessionData?.clinicId) ||
      getReferenceId(sessionData?.clinic) ||
      fallbackIds?.clinicId ||
      "",
    doctorId:
      getReferenceId(sessionData?.doctorId) ||
      getReferenceId(sessionData?.doctor) ||
      fallbackIds?.doctorId ||
      "",
    sessions: normalizeSessions(sessionData?.sessions),
  }
}

function cloneFormValues(values: DoctorSessionFormValues): DoctorSessionFormValues {
  return {
    clinicId: values.clinicId,
    doctorId: values.doctorId,
    sessions: values.sessions.map((session) => ({
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      isActive: session.isActive,
      breaks: session.breaks.map((item) => ({
        start: item.start,
        end: item.end,
        touched: item.touched ?? false,
      })),
    })),
  }
}

function getSessionSummary(session: DoctorSessionDayFormValue) {
  if (!session.isActive) {
    return "Not scheduled"
  }

  return `${session.startTime} - ${session.endTime}`
}

function shouldShowBreakError(
  breakValue: DoctorSessionBreakFormValue | undefined,
  submitCount: number
) {
  return Boolean(breakValue?.touched) || submitCount > 0
}

export function DoctorSessionFormDialog({
  open,
  onOpenChange,
  mode,
  clinics,
  sessionData,
  fallbackClinicId,
  fallbackDoctorId,
  onAddSession,
  onEditSession,
  isSubmitting = false,
  isLoadingSession = false,
}: DoctorSessionFormDialogProps) {
  const { data: profile } = useProfile()
  const role = profile?.role
  const isClinicAdminOrReceptionist = role === "clinic_admin" || role === "receptionist"

  const assignedClinicId = useMemo(() => {
    const firstClinic = profile?.meta?.clinics?.[0]
    if (!firstClinic) return ""
    return typeof firstClinic === "string" ? firstClinic : firstClinic._id
  }, [profile])


  const isDoctor = role === "doctor"
  const defaultClinicId = (isClinicAdminOrReceptionist || isDoctor) && assignedClinicId ? assignedClinicId : fallbackClinicId

  const defaultValues = useMemo(
    () => {
      const baseValues =
        mode === "edit"
          ? getDefaultValues(sessionData, {
            clinicId: fallbackClinicId,
            doctorId: fallbackDoctorId,
          })
          : getDefaultValues(undefined, {
            clinicId: defaultClinicId,
            doctorId: isDoctor ? profile?._id : fallbackDoctorId,
          })

      return cloneFormValues(baseValues)
    },
    [fallbackClinicId, fallbackDoctorId, mode, open, sessionData, isClinicAdminOrReceptionist, assignedClinicId, isDoctor, profile?._id, defaultClinicId]
  )

  const [clinicSearch, setClinicSearch] = useState("")
  const [debouncedClinicSearch, setDebouncedClinicSearch] = useState("")
  const [doctorSearch, setDoctorSearch] = useState("")
  const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState("")
  const [selectedClinicId, setSelectedClinicId] = useState(defaultValues.clinicId)

  useEffect(() => {
    setSelectedClinicId(defaultValues.clinicId)
  }, [defaultValues.clinicId])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedClinicSearch(clinicSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [clinicSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDoctorSearch(doctorSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [doctorSearch])

  const {
    data: clinicsInfiniteData,
    fetchNextPage: fetchNextClinics,
    hasNextPage: hasNextClinics,
    isFetchingNextPage: isFetchingExtraClinics,
    isLoading: isClinicsLoading,
  } = useInfiniteClinics(10, { search: debouncedClinicSearch }, open)

  const {
    data: doctorsInfiniteData,
    fetchNextPage: fetchNextDoctors,
    hasNextPage: hasNextDoctors,
    isFetchingNextPage: isFetchingExtraDoctors,
    isLoading: isDoctorsLoading,
  } = useInfiniteDoctors(10, {
    search: debouncedDoctorSearch,
    clinicId: selectedClinicId,
    status: "active",
  }, (open && !isDoctor))

  const clinicsOptions = useMemo(() => {
    if (!clinicsInfiniteData) return []
    return clinicsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [clinicsInfiniteData])

  const doctorsOptions = useMemo(() => {
    if (!doctorsInfiniteData) return []
    return doctorsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [doctorsInfiniteData])

  async function handleSubmit(values: DoctorSessionFormValues) {
    const normalizedValues: DoctorSessionFormValues = {
      ...values,
      clinicId: values.clinicId || (isDoctor ? assignedClinicId : "") || fallbackClinicId || "",
      doctorId: values.doctorId || (isDoctor ? profile?._id : "") || fallbackDoctorId || "",
      sessions: values.sessions.map((session) => ({
        ...session,
        breaks: session.breaks.map((item) => ({
          start: item.start,
          end: item.end,
          touched: item.touched,
        })),
      })),
    }

    if (mode === "add") {
      await onAddSession(normalizedValues)
      return
    }

    await onEditSession(normalizedValues)
  }

  return (
    <GenericFormDialog
      title={
        mode === "edit"
          ? (isDoctor ? "Edit Session" : "Edit Doctor Session")
          : (isDoctor ? "Add Session" : "Add New Doctor Session")
      }
      description="Configure clinic, doctor, session days, timings, and breaks."
      formSchema={getDoctorSessionFormSchema(isDoctor)}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      open={open}
      onOpenChange={onOpenChange}
      hideTrigger
      dialogSize="xl"
      dialogContentClassName="max-h-[85vh]"
      submitButtonText={mode === "edit" ? "Update Session" : "Save Session"}
      cancelButtonText="Cancel"
      isSubmitting={isSubmitting || isLoadingSession}
      resetOnDefaultValuesChange
      onValuesChange={(values) => {
        if (values.clinicId !== selectedClinicId) {
          setSelectedClinicId(values.clinicId)
        }
      }}
      renderContent={({ form, values }) => {
        if (isLoadingSession || !profile) {
          return (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading session details...
            </div>
          )
        }

        const watchedSessions = values.sessions ?? createDefaultSessions()
        const allDaysSelected = watchedSessions.every((session) => session.isActive)
        const sessionsError =
          typeof form.formState.errors.sessions?.message === "string"
            ? form.formState.errors.sessions.message
            : !watchedSessions.some((session) => session.isActive) && form.formState.submitCount > 0
              ? "Please schedule at least one day."
              : undefined

        // Force set values for doctors if they are missing to ensure validation passes
        useEffect(() => {
          if (isDoctor && profile?._id && !form.getValues("doctorId")) {
            form.setValue("doctorId", profile._id, { shouldValidate: true })
          }
          if (isDoctor && assignedClinicId && !form.getValues("clinicId")) {
            form.setValue("clinicId", assignedClinicId, { shouldValidate: true })
          }
        }, [isDoctor, profile?._id, assignedClinicId, form])

        function updateDay(index: number, updates: Partial<DoctorSessionDayFormValue>) {
          const current = form.getValues(`sessions.${index}`)
          form.setValue(`sessions.${index}`, { ...current, ...updates }, { shouldDirty: true })
        }

        function handleToggleAllDays(checked: boolean) {
          watchedSessions.forEach((session, index) => {
            updateDay(index, { ...session, isActive: checked })
          })
        }

        function handleAddBreak(index: number) {
          const currentBreaks = form.getValues(`sessions.${index}.breaks`)
          form.setValue(`sessions.${index}.breaks`, [...currentBreaks, { start: "", end: "", touched: false }], { shouldDirty: true })
        }

        function handleRemoveBreak(index: number, breakIndex: number) {
          const currentBreaks = form.getValues(`sessions.${index}.breaks`)
          form.setValue(`sessions.${index}.breaks`, currentBreaks.filter((_, idx) => idx !== breakIndex), { shouldDirty: true })
        }

        function markBreakTouched(dayIndex: number, breakIndex: number) {
          const currentBreak = form.getValues(`sessions.${dayIndex}.breaks.${breakIndex}`)
          form.setValue(`sessions.${dayIndex}.breaks.${breakIndex}`, { ...currentBreak, touched: true }, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
        }

        return (
          <div className="space-y-6">
            <div className={`grid grid-cols-1 gap-6 ${isDoctor ? "" : "md:grid-cols-2"}`}>
              <FormField
                control={form.control}
                name="clinicId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="mb-2">Clinic</FormLabel>
                    {mode === "edit" || (isClinicAdminOrReceptionist || (isDoctor && clinics.length <= 1)) ? (
                      <div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground opacity-70">
                        {clinics.find((clinic) => clinic._id === field.value)?.name || "Selected clinic"}
                      </div>
                    ) : (
                      <DataTableInfiniteFilterSelect
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val)
                          form.setValue("doctorId", "")
                        }}
                        placeholder="Select Clinic"
                        options={(isDoctor ? clinics : clinicsOptions).map(c => ({ value: c._id, label: c.name }))}
                        onLoadMore={fetchNextClinics}
                        onSearchChange={setClinicSearch}
                        hasNextPage={hasNextClinics}
                        isFetchingNextPage={isFetchingExtraClinics}
                        isLoading={isClinicsLoading}
                        className="w-full"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  isDoctor ? (
                    <input type="hidden" {...field} />
                  ) : (
                    <FormItem className="flex flex-col">
                      <FormLabel className="mb-2">Doctor</FormLabel>
                      {mode === "edit" ? (
                        <div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground opacity-70">
                          {doctorsOptions.find((d) => d._id === field.value)
                            ? `${doctorsOptions.find((d) => d._id === field.value)?.firstName} ${doctorsOptions.find((d) => d._id === field.value)?.lastName}`.trim()
                            : "Selected doctor"}
                        </div>
                      ) : (
                        <DataTableInfiniteFilterSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={!selectedClinicId ? "Select clinic first" : "Select Doctor"}
                          options={doctorsOptions.map(d => ({ value: d._id, label: (d as any).fullName || `${d.firstName} ${d.lastName}` }))}
                          onLoadMore={fetchNextDoctors}
                          onSearchChange={setDoctorSearch}
                          hasNextPage={hasNextDoctors}
                          isFetchingNextPage={isFetchingExtraDoctors}
                          isLoading={isDoctorsLoading}
                          disabled={!selectedClinicId}
                          className="w-full"
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                )}
              />
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-3">
              <Checkbox
                checked={allDaysSelected}
                onCheckedChange={(v) => handleToggleAllDays(Boolean(v))}
                aria-label="Select all days"
              />
              <div className="flex items-center gap-3 justify-between w-full sm:flex-row flex-col">
                <div>
                  <div className="text-sm font-medium">Select all days</div>
                  <div className="text-xs text-muted-foreground">Toggle every weekday schedule at once.</div>
                </div>
                <p className="text-xs text-blue-500 dark:text-amber-500">Note: No breaks scheduled. Click &quot;Add Break&quot; to add one.</p>
              </div>
            </div>

            {sessionsError ? <p className="text-sm font-medium text-destructive">{sessionsError}</p> : null}

            <div className="grid gap-4 xl:grid-cols-2">
              {DOCTOR_SESSION_DAYS.map((day, index) => {
                const daySession = watchedSessions[index]
                return (
                  <Card key={day.id} className="gap-0 py-0">
                    <CardHeader className="gap-3 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={daySession.isActive} onCheckedChange={(v) => updateDay(index, { isActive: Boolean(v) })} aria-label={`Enable ${day.label}`} />
                          <div>
                            <CardTitle className="text-base">{day.label}</CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">{getSessionSummary(daySession)}</p>
                          </div>
                        </div>
                        {daySession.isActive ? (
                          <Button type="button" variant="outline" size="sm" className="cursor-pointer text-foreground" onClick={() => handleAddBreak(index)}>
                            <Plus className="size-4" /> Add Break
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Not scheduled</Badge>
                        )}
                      </div>
                    </CardHeader>
                    {daySession.isActive ? (
                      <CardContent className="space-y-4 px-4 pb-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField control={form.control} name={`sessions.${index}.startTime`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Session Start</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  step="300"
                                  {...field}
                                  className={TIME_INPUT_CLASSNAME}
                                  onPointerDown={suppressNativeTimePickerOpen}
                                  onKeyDown={suppressNativeTimePickerKeys}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`sessions.${index}.endTime`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Session End</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  step="300"
                                  {...field}
                                  className={TIME_INPUT_CLASSNAME}
                                  onPointerDown={suppressNativeTimePickerOpen}
                                  onKeyDown={suppressNativeTimePickerKeys}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
                          Active slot: {daySession.startTime || "--:--"} - {daySession.endTime || "--:--"}
                        </div>
                        {daySession.breaks.length > 0 ? (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              {daySession.breaks.map((breakItem, bIdx) => (
                                <div key={`${day.id}-break-${bIdx}`} className="rounded-lg border p-3">
                                  <div className="mb-3 flex items-center justify-between"><div className="text-sm font-medium">Break {bIdx + 1}</div><Button type="button" variant="outline" size="sm" className="cursor-pointer text-foreground hover:text-red-500 hover:bg-red-50" onClick={() => handleRemoveBreak(index, bIdx)}><Trash2 className="size-4" /> Remove</Button></div>
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <FormField control={form.control} name={`sessions.${index}.breaks.${bIdx}.start`} render={({ field, fieldState }) => (
                                      <FormItem>
                                        <FormLabel>Break Start</FormLabel>
                                        <FormControl>
                                          {/* <Input type="time" step="300" className="dark:[color-scheme:dark]" {...field} onBlur={() => { field.onBlur(); markBreakTouched(index, bIdx) }} /> */}
                                          <Input
                                            type="time"
                                            step="300"
                                            {...field}
                                            className={TIME_INPUT_CLASSNAME}
                                            onPointerDown={suppressNativeTimePickerOpen}
                                            onKeyDown={suppressNativeTimePickerKeys}
                                            onBlur={() => { field.onBlur(); markBreakTouched(index, bIdx) }}
                                          />
                                        </FormControl>
                                        {shouldShowBreakError(breakItem, form.formState.submitCount) && fieldState.error?.message && <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>}
                                      </FormItem>
                                    )} />
                                    <FormField control={form.control} name={`sessions.${index}.breaks.${bIdx}.end`} render={({ field, fieldState }) => (
                                      <FormItem>
                                        <FormLabel>Break End</FormLabel>
                                        <FormControl>
                                          {/* <Input type="time" step="300" className="dark:[color-scheme:dark]" {...field} onBlur={() => { field.onBlur(); markBreakTouched(index, bIdx) }} /> */}
                                          <Input
                                            type="time"
                                            step="300"
                                            {...field}
                                            className={TIME_INPUT_CLASSNAME}
                                            onPointerDown={suppressNativeTimePickerOpen}
                                            onKeyDown={suppressNativeTimePickerKeys}
                                            onBlur={() => { field.onBlur(); markBreakTouched(index, bIdx) }}
                                          />
                                        </FormControl>
                                        {shouldShowBreakError(breakItem, form.formState.submitCount) && fieldState.error?.message && <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>}
                                      </FormItem>
                                    )} />
                                  </div>
                                  <p className="mt-3 text-xs text-muted-foreground">Break time: {breakItem.start || "--:--"} - {breakItem.end || "--:--"}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </CardContent>
                    ) : null}
                  </Card>
                )
              })}
            </div>
          </div>
        )
      }}
    />
  )
}
