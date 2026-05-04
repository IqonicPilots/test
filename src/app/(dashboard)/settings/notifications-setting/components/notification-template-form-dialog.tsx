"use client"

import { useMemo, useState } from "react"
import { Copy } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { GenericFormDialog, type FormFieldConfig } from "@/components/generic-form-dialog"
import { useUpdateNotificationTemplate } from "@/hooks/api/use-notification-templates"
import { useClinics } from "@/hooks/api/use-clinics"
import { getVariablesForCondition } from "@/config/notification-variables"
import type {
  NotificationTemplate,
  NotificationTemplateType,
  UpdateNotificationTemplatePayload,
  NotificationRecipient,
} from "@/types/notification-template.types"

function splitSendTime(sendTime?: string) {
  if (!sendTime) return { send_date: "", send_clock: "" }
  const date = new Date(sendTime)
  if (Number.isNaN(date.getTime())) return { send_date: "", send_clock: "" }
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  return { send_date: `${yyyy}-${mm}-${dd}`, send_clock: `${hh}:${min}` }
}

function buildSendTimeIso(sendDate?: string, sendClock?: string) {
  if (!sendDate || !sendClock) return undefined
  const [hours, minutes] = sendClock.split(":")
  const dateStr = `${sendDate}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`
  const localDate = new Date(dateStr)
  if (Number.isNaN(localDate.getTime())) return undefined
  return localDate.toISOString()
}

const recipientOptions = [
  { value: "clinic", label: "Clinic" },
  { value: "doctor", label: "Doctor" },
  { value: "patient", label: "Patient" },
  { value: "receptionist", label: "Receptionist" },
  { value: "admin", label: "Admin" },
  { value: "clinic_admin", label: "Clinic Admin" },
  { value: "newsletter_subscribers", label: "Newsletter Subscribers" },
  { value: "common", label: "Common" },
]
const validRecipientValues = new Set(recipientOptions.map((option) => option.value))

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

function getDialogTitle(type: NotificationTemplateType) {
  if (type === "email") return "Manage Email Template"
  if (type === "sms_whatsapp") return "Manage SMS / WhatsApp Template"
  if (type === "custom") return "Manage Custom Notification"
  return "Manage Push Notification"
}

const baseSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  recipients: z.array(z.enum(["clinic", "doctor", "patient", "common", "receptionist", "admin", "clinic_admin", "newsletter_subscribers"])).optional(),
  recipient: z.enum(["clinic", "doctor", "patient", "common", "receptionist", "admin", "clinic_admin", "newsletter_subscribers"]).optional(),
  content: z.string().min(1, "Content is required"),
  subject: z.string().optional(),
  push_title: z.string().optional(),
  contentsid: z.string().optional(),
  target_condition: z
    .enum([
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
    ])
    .optional(),
  schedule_type: z.enum(["one_time", "multiple"]).optional(),
  send_date: z.string().optional(),
  send_clock: z.string().optional(),
  interval_type: z.enum(["minute", "hour", "day", "week", "month"]).optional(),
  interval_value: z.coerce.number().optional(),
  clinicIds: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  const isParticularClinic = data.target_condition?.startsWith("particular_clinic_")
  if (isParticularClinic && (!data.clinicIds || data.clinicIds.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select at least one clinic for this target condition.",
      path: ["clinicIds"],
    })
  }

  // Non-custom templates should always have recipient routing configured.
  if (!data.target_condition) {
    const hasRecipients = Array.isArray(data.recipients) && data.recipients.length > 0
    const hasRecipient = Boolean(data.recipient)
    if (!hasRecipients && !hasRecipient) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select at least one recipient.",
        path: ["recipients"],
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a recipient.",
        path: ["recipient"],
      })
    }
  }
})

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

type FormValues = z.infer<typeof baseSchema>

export function NotificationTemplateFormDialog({
  template,
  trigger,
}: {
  template: NotificationTemplate
  trigger: React.ReactNode
}) {
  const updateMutation = useUpdateNotificationTemplate()
  const { data: clinicsData } = useClinics(1, 100)

  const clinicOptions = useMemo(() => {
    return (clinicsData?.data ?? []).map((c: any) => ({
      value: c._id,
      label: c.name
    }))
  }, [clinicsData])

  const effectiveType =
    template.type === "custom" && template.service_type ? template.service_type : template.type
  const [scheduleType, setScheduleType] = useState<FormValues["schedule_type"]>(
    template.schedule_type ?? "one_time"
  )
  const [targetCondition, setTargetCondition] = useState<string | undefined>(
    template.type === "custom" ? (template.target_condition ?? "all_patients") : undefined
  )

  const isClinicRequired =
    template.type === "custom" && targetCondition?.startsWith("particular_clinic_")

  const fields: FormFieldConfig[] = useMemo(() => {
    if (template.type === "custom") {
      return [
        {
          name: "name",
          label: "Template Name",
          type: "text",
          required: true,
          section: "Template",
          gridClass: isClinicRequired ? "col-span-1" : "col-span-2",
          placeholder: "Enter template name",
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
        ...(effectiveType === "push"
          ? [
            {
              name: "push_title",
              label: "Push Title",
              type: "text",
              required: true,
              section: "Template",
              gridClass: isClinicRequired ? "col-span-2" : "col-span-3",
              placeholder: "Enter push title",
            } as FormFieldConfig,
          ]
          : []),
        ...(effectiveType === "email"
          ? [
            {
              name: "subject",
              label: "Subject",
              type: "text",
              required: true,
              section: "Template",
              gridClass: isClinicRequired ? "col-span-2" : "col-span-3",
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
          label: effectiveType === "push" ? "Push Message" : effectiveType === "email" ? "Email Content" : "Message",
          type: "textarea",
          required: true,
          rows: 6,
          section: "Content",
          gridClass: "col-span-3",
          placeholder: "Enter your message",
        },
      ]
    }

    const commonFields: FormFieldConfig[] = [
      {
        name: "name",
        label: "Template Name",
        type: "text",
        required: true,
        section: "Template",
        gridClass: "col-span-2",
        placeholder: "Enter template name",
      },
      ...(effectiveType === "sms_whatsapp"
        ? []
        : [
          {
            name: "recipients",
            label: "Recipients",
            type: "multi-select",
            required: true,
            section: "Template",
            gridClass: "col-span-1",
            options: recipientOptions,
            placeholder: "Select recipients",
          } as FormFieldConfig,
        ]),
    ]

    if (effectiveType === "email") {
      return [
        ...commonFields,
        {
          name: "subject",
          label: "Subject",
          type: "text",
          required: true,
          section: "Template",
          gridClass: "col-span-3",
        },
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
          label: "Email Content",
          type: "textarea",
          required: true,
          rows: 8,
          section: "Content",
          gridClass: "col-span-3",
        },
      ]
    }

    if (effectiveType === "push") {
      return [
        ...commonFields,
        {
          name: "push_title",
          label: "Push Title",
          type: "text",
          required: true,
          section: "Template",
          gridClass: "col-span-3",
        },
        {
          name: "schedule_type",
          label: "Schedule Type",
          type: "select",
          required: true,
          section: "Template",
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
              required: false,
              section: "Template",
              gridClass: "col-span-1",
              placeholder: "Select date",
              minDate: new Date(),
              maxDate: new Date(2100, 11, 31),
            } as FormFieldConfig,
            {
              name: "send_clock",
              label: "Send Time",
              type: "time",
              required: false,
              section: "Template",
              gridClass: "col-span-1",
            } as FormFieldConfig,
          ]
          : [
            {
              name: "interval_type",
              label: "Interval Type",
              type: "select",
              required: false,
              section: "Template",
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
              required: false,
              section: "Template",
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
          label: "Push Message",
          type: "textarea",
          required: true,
          rows: 6,
          section: "Content",
          gridClass: "col-span-3",
        },
      ]
    }

    return [
      ...commonFields,
      ...(effectiveType === "sms_whatsapp"
        ? [
          {
            name: "recipient",
            label: "Recipients",
            type: "select",
            required: true,
            section: "Template",
            gridClass: "col-span-1",
            options: recipientOptions,
            placeholder: "Select recipients",
          } as FormFieldConfig,
        ]
        : []),
      {
        name: "contentsid",
        label: "Content SID",
        type: "text",
        required: false,
        section: "Template",
        gridClass: "col-span-3",
      },
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
        label: "Message",
        type: "textarea",
        required: true,
        rows: 6,
        section: "Content",
        gridClass: "col-span-3",
      },
    ]
  }, [effectiveType, scheduleType, targetCondition, template.type, clinicOptions, isClinicRequired])

  const defaultValues = useMemo<FormValues>(() => {
    const { send_date, send_clock } = splitSendTime(template.send_time)
    const normalizedRecipients = Array.isArray(template.recipients)
      ? template.recipients.filter((recipient) => validRecipientValues.has(recipient))
      : []
    const defaultRecipient = normalizedRecipients[0]
    return {
      name: template.name ?? "",
      recipients: normalizedRecipients as any,
      recipient: defaultRecipient as FormValues["recipient"] | undefined,
      content: template.content ?? "",
      subject: template.subject ?? "",
      push_title: template.push_title ?? "",
      contentsid: template.contentsid ?? "",
      target_condition: template.type === "custom" ? (template.target_condition ?? "all_patients") : undefined,
      schedule_type: template.schedule_type ?? "one_time",
      send_date,
      send_clock,
      interval_type: template.interval_type ?? "day",
      interval_value: template.interval_value ?? 1,
      clinicIds: template.clinicIds ?? [],
    }
  }, [template])

  const handleSubmit = async (values: FormValues) => {
    const fallbackRecipient = Array.isArray(template.recipients)
      ? template.recipients.find((recipient) => validRecipientValues.has(recipient))
      : undefined
    const selectedRecipient = values.recipient ?? (fallbackRecipient as FormValues["recipient"] | undefined)

    const payload: UpdateNotificationTemplatePayload = {
      name: values.name,
      recipients:
        effectiveType === "sms_whatsapp"
          ? (selectedRecipient ? [selectedRecipient as NotificationRecipient] : undefined)
          : values.recipients,
      content: values.content,
      subject: effectiveType === "email" ? values.subject : undefined,
      push_title: effectiveType === "push" ? values.push_title : undefined,
      target_condition:
        template.type === "custom" ? values.target_condition : undefined,
      schedule_type:
        template.type === "custom" || effectiveType === "push" ? values.schedule_type : undefined,
      send_time:
        (template.type === "custom" || effectiveType === "push") && values.schedule_type === "one_time"
          ? buildSendTimeIso(values.send_date, values.send_clock)
          : undefined,
      interval_type:
        (template.type === "custom" || effectiveType === "push") && values.schedule_type === "multiple"
          ? values.interval_type
          : undefined,
      interval_value:
        (template.type === "custom" || effectiveType === "push") && values.schedule_type === "multiple"
          ? values.interval_value
          : undefined,
      contentsid: effectiveType === "sms_whatsapp" ? values.contentsid : undefined,
      clinicIds: template.type === "custom" ? values.clinicIds : undefined,
    }

    await updateMutation.mutateAsync({ id: template._id, data: payload })
  }

  return (
    <GenericFormDialog
      key={template._id}
      title={getDialogTitle(template.type)}
      description={
        template.type === "custom"
          ? "Update and schedule a custom notification template."
          : "Update template content and recipients."
      }
      trigger={trigger}
      hideTrigger={false}
      formSchema={baseSchema}
      defaultValues={defaultValues}
      fields={fields}
      onSubmit={handleSubmit}
      onValuesChange={(values) => {
        const nextType = values.schedule_type as FormValues["schedule_type"] | undefined
        if (nextType && nextType !== scheduleType) {
          setScheduleType(nextType)
        }
        const nextCondition = values.target_condition as string | undefined
        if (template.type === "custom" && nextCondition && nextCondition !== targetCondition) {
          setTargetCondition(nextCondition)
        }
      }}
      dialogSize="lg"
      dialogContentClassName="max-h-[85vh]"
      submitButtonText={updateMutation.isPending ? "Saving..." : "Save Changes"}
      cancelButtonText="Back"
      isSubmitting={updateMutation.isPending}
      resetOnSubmit={false}
      closeOnSubmit={true}
      disableOpenAutoFocus
      resetOnDefaultValuesChange
    />
  )
}
