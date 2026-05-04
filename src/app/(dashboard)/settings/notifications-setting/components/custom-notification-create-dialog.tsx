"use client"

import { useMemo, useState } from "react"
import { z } from "zod"
import { Copy, Plus } from "lucide-react"
import { toast } from "sonner"

import { GenericFormDialog, type FormFieldConfig } from "@/components/generic-form-dialog"
import { useCreateCustomNotification } from "@/hooks/api/use-notification-templates"
import { useClinics } from "@/hooks/api/use-clinics"
import { Button } from "@/components/ui/button"
import { getVariablesForCondition } from "@/config/notification-variables"

function buildSendTimeIso(sendDate?: string, sendClock?: string) {
  if (!sendDate || !sendClock) return undefined
  const [hours, minutes] = sendClock.split(":")
  const dateStr = `${sendDate}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`
  const localDate = new Date(dateStr)
  if (Number.isNaN(localDate.getTime())) return undefined
  return localDate.toISOString()
}

const targetConditionOptions = [
  { value: "all", label: "All Users" },
  { value: "new_user", label: "New User" },
  { value: "all_clinic_admin", label: "All Clinic Admins" },
  { value: "all_patients", label: "All Patients" },
  { value: "all_doctors", label: "All Doctors" },
  { value: "new_doctors", label: "New Doctors" },
  { value: "new_patients", label: "New Patients" },
  { value: "particular_clinic_all_user", label: "Particular Clinic - All Users" },
  { value: "particular_clinic_all_doctor", label: "Particular Clinic - All Doctors" },
  { value: "particular_clinic_all_receptionist", label: "Particular Clinic - All Receptionists" },
  { value: "particular_clinic_all_patient", label: "Particular Clinic - All Patients" },
  { value: "particular_clinic_all_admin", label: "Particular Clinic - All Admins" },
  { value: "patients_with_pending_bills", label: "Patients With Pending Bills" },
  { value: "patients_with_appointments_today", label: "Patients With Appointments Today" },
  { value: "birthday_today", label: "Birthday Today" },
]

function DynamicKeysList({ condition }: { condition?: string }) {
  const dynamicKeys = useMemo(() => getVariablesForCondition(condition), [condition])

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`)
    toast.success(`Copied {{${key}}} to clipboard`)
  }

  return (
    <div className="space-y-3 col-span-3 pb-2">
      <p className="text-[12px] font-semibold text-muted-foreground/80 tracking-tight">
        Available Placeholder Keys for <span className="text-primary italic">"{condition?.replace(/_/g, ' ') || 'Default'}"</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {dynamicKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleCopy(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs transition-colors cursor-pointer"
          >
            {key}
            <Copy className="size-3" />
          </button>
        ))}
      </div>
    </div>
  )
}

const createCustomNotificationSchema = z
  .object({
    name: z.string().min(1, "Template name is required"),
    service_type: z.enum(["push", "email", "sms_whatsapp"]),
    push_title: z.string().optional(),
    subject: z.string().optional(),
    content: z.string().min(1, "Message content is required"),
    target_condition: z.enum([
      "all",
      "new_user",
      "all_clinic_admin",
      "all_patients",
      "all_doctors",
      "new_doctors",
      "new_patients",
      "particular_clinic_all_user",
      "particular_clinic_all_doctor",
      "particular_clinic_all_receptionist",
      "particular_clinic_all_patient",
      "particular_clinic_all_admin",
      "patients_with_pending_bills",
      "patients_with_appointments_today",
      "birthday_today",
    ]),
    schedule_type: z.enum(["one_time", "multiple"]),
    send_date: z.string().optional(),
    send_clock: z.string().optional(),
    interval_type: z.enum(["minute", "hour", "day", "week", "month"]).optional(),
    interval_value: z.coerce.number().optional(),
    clinicIds: z.array(z.string()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.service_type === "push" && !value.push_title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["push_title"],
        message: "Push title is required for push notifications.",
      })
    }
    if (value.service_type === "email" && !value.subject?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subject"],
        message: "Subject is required for email notifications.",
      })
    }
    if (value.schedule_type === "one_time") {
      if (!value.send_date?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["send_date"],
          message: "Send date is required for one-time schedule.",
        })
      }
      if (!value.send_clock?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["send_clock"],
          message: "Send time is required for one-time schedule.",
        })
      }
    }
    if (value.schedule_type === "multiple" && (!value.interval_type || !value.interval_value)) {
      if (!value.interval_type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["interval_type"],
          message: "Interval type is required for multiple schedule.",
        })
      }
      if (!value.interval_value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["interval_value"],
          message: "Interval value is required for multiple schedule.",
        })
      }
    }
    const isParticularClinic = value.target_condition?.startsWith("particular_clinic_")
    if (isParticularClinic && (!value.clinicIds || value.clinicIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select at least one clinic for this target condition.",
        path: ["clinicIds"],
      })
    }
  })

type CreateCustomNotificationValues = z.infer<typeof createCustomNotificationSchema>

export function CustomNotificationCreateDialog() {
  const createMutation = useCreateCustomNotification()
  const { data: clinicsData } = useClinics(1, 100)

  const clinicOptions = useMemo(() => {
    return (clinicsData?.data ?? []).map((c: any) => ({
      value: c._id,
      label: c.name
    }))
  }, [clinicsData])

  const [scheduleType, setScheduleType] = useState<CreateCustomNotificationValues["schedule_type"]>("one_time")
  const [serviceType, setServiceType] = useState<CreateCustomNotificationValues["service_type"]>("push")
  const [targetCondition, setTargetCondition] = useState<string>("all_patients")

  const isClinicRequired = targetCondition?.startsWith("particular_clinic_")

  const defaultValues: CreateCustomNotificationValues = {
    name: "",
    service_type: "push",
    push_title: "",
    subject: "",
    content: "",
    target_condition: "all_patients",
    schedule_type: "one_time",
    send_date: "",
    send_clock: "",
    interval_type: "day",
    interval_value: 1,
    clinicIds: [],
  }

  const fields: FormFieldConfig[] = useMemo(() => {
    const baseFields: FormFieldConfig[] = [
      {
        name: "name",
        label: "Template Name",
        type: "text",
        required: true,
        section: "Template",
        gridClass: "col-span-1",
        placeholder: "Enter template name",
      },
      {
        name: "service_type",
        label: "Service Type",
        type: "select",
        required: true,
        section: "Template",
        gridClass: "col-span-1",
        options: [
          { value: "push", label: "Push Notification" },
          { value: "email", label: "Email" },
          { value: "sms_whatsapp", label: "SMS / WhatsApp" },
        ],
      },
      {
        name: "target_condition",
        label: "Target Condition",
        type: "select",
        required: true,
        section: "Template",
        gridClass: "col-span-1",
        options: targetConditionOptions,
      },
      ...(isClinicRequired
        ? [
          {
            name: "clinicIds",
            label: "Clinic Selection",
            type: "multi-select",
            required: true,
            section: "Template",
            gridClass: "col-span-1",
            options: clinicOptions,
            placeholder: "Select Clinics",
          } as FormFieldConfig,
        ]
        : []),
      ...(serviceType === "push"
        ? [
          {
            name: "push_title",
            label: "Push Title",
            type: "text",
            required: true,
            section: "Template",
            gridClass: "col-span-3",
            placeholder: "Enter push title",
          } as FormFieldConfig,
        ]
        : []),
      ...(serviceType === "email"
        ? [
          {
            name: "subject",
            label: "Subject",
            type: "text",
            required: true,
            section: "Template",
            gridClass: "col-span-3",
            placeholder: "Enter subject",
          } as FormFieldConfig,
        ]
        : []),
      {
        name: "schedule_type",
        label: "Schedule Type",
        type: "select",
        required: true,
        section: "Schedule",
        gridClass: "col-span-1",
        options: [
          { value: "one_time", label: "One Time" },
          { value: "multiple", label: "Multiple" },
        ],
      },
      ...(scheduleType === "one_time"
        ? [
          {
            name: "send_date",
            label: "Send Date",
            type: "date",
            section: "Schedule",
            gridClass: "col-span-1",
            placeholder: "Select date",
            minDate: new Date(),
            maxDate: new Date(2100, 11, 31),
          } as FormFieldConfig,
          {
            name: "send_clock",
            label: "Send Time",
            type: "time",
            section: "Schedule",
            gridClass: "col-span-1",
          } as FormFieldConfig,
        ]
        : [
          {
            name: "interval_type",
            label: "Interval Type",
            type: "select",
            section: "Schedule",
            gridClass: "col-span-1",
            options: [
              { value: "minute", label: "Minute" },
              { value: "hour", label: "Hour" },
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ],
          } as FormFieldConfig,
          {
            name: "interval_value",
            label: "Interval Value",
            type: "number",
            section: "Schedule",
            gridClass: "col-span-1",
            placeholder: "1",
          } as FormFieldConfig,
        ]),
      {
        name: "dynamic_keys",
        label: "",
        type: "custom",
        section: "Content",
        gridClass: "col-span-3",
        render: () => <DynamicKeysList condition={targetCondition} />,
      },
      {
        name: "content",
        label: serviceType === "push" ? "Push Message" : serviceType === "email" ? "Email Content" : "Message",
        type: "textarea",
        required: true,
        rows: 6,
        section: "Content",
        gridClass: "col-span-3",
        placeholder: "Enter your message",
      },
    ]

    return baseFields
  }, [scheduleType, serviceType, targetCondition, clinicOptions, isClinicRequired])

  const handleSubmit = async (values: CreateCustomNotificationValues) => {
    await createMutation.mutateAsync({
      type: "custom",
      service_type: values.service_type,
      name: values.name,
      push_title: values.push_title,
      subject: values.subject,
      content: values.content,
      target_condition: values.target_condition,
      schedule_type: values.schedule_type,
      send_time:
        values.schedule_type === "one_time"
          ? buildSendTimeIso(values.send_date, values.send_clock)
          : undefined,
      interval_type: values.schedule_type === "multiple" ? values.interval_type : undefined,
      interval_value: values.schedule_type === "multiple" ? values.interval_value : undefined,
      clinicIds: values.clinicIds,
    })
  }

  return (
    <GenericFormDialog
      title="Create Custom Notification"
      description="Create and schedule a custom notification."
      trigger={
        <Button className="cursor-pointer h-9" variant="default">
          <Plus className="h-4 w-4" />
          Create Custom Notification
        </Button>
      }
      formSchema={createCustomNotificationSchema}
      defaultValues={defaultValues}
      fields={fields}
      onSubmit={handleSubmit}
      onValuesChange={(values) => {
        const nextST = values.schedule_type as CreateCustomNotificationValues["schedule_type"] | undefined
        if (nextST && nextST !== scheduleType) {
          setScheduleType(nextST)
        }
        const nextSvc = values.service_type as CreateCustomNotificationValues["service_type"] | undefined
        if (nextSvc && nextSvc !== serviceType) {
          setServiceType(nextSvc)
        }
        const nextCondition = values.target_condition as string | undefined
        if (nextCondition && nextCondition !== targetCondition) {
          setTargetCondition(nextCondition)
        }
      }}
      dialogSize="xl"
      submitButtonText={createMutation.isPending ? "Creating..." : "Create Notification"}
      cancelButtonText="Back"
      isSubmitting={createMutation.isPending}
      closeOnSubmit
      disableOpenAutoFocus
    />
  )
}
