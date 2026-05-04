"use client"

import { useMemo } from "react"
import { z } from "zod"

import { GenericFormDialog, type FormFieldConfig } from "@/components/generic-form-dialog"
import { useSendTestEmail, useSendTestSms, useSendTestWhatsapp } from "@/hooks/api/use-notification-templates"

type DialogType = "email" | "sms" | "whatsapp"

const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  subject: z.string().optional(),
  content: z.string().min(1, "Content is required"),
})

const phoneSchema = z.object({
  phoneNumberCountryCode: z.string().optional(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  content: z.string().min(1, "Content is required"),
})

function buildPhoneWithCountryCode(countryCode?: string, phoneNumber?: string) {
  const normalizedCode = (countryCode ?? "").trim()
  const normalizedNumber = (phoneNumber ?? "").trim()
  if (!normalizedCode) return normalizedNumber
  if (!normalizedNumber) return normalizedCode
  if (normalizedNumber.startsWith("+")) return normalizedNumber
  return `${normalizedCode}${normalizedNumber}`
}

export function SendTestNotificationDialog({
  type,
  trigger,
  defaultContent,
}: {
  type: DialogType
  trigger: React.ReactNode
  defaultContent?: string
}) {
  const emailMutation = useSendTestEmail()
  const smsMutation = useSendTestSms()
  const whatsappMutation = useSendTestWhatsapp()

  const schema = type === "email" ? emailSchema : phoneSchema

  const title = type === "email" ? "Send Test Email" : type === "sms" ? "Send Test SMS" : "Send Test WhatsApp"
  const description =
    type === "email"
      ? "Send a test email to verify SMTP configuration."
      : type === "sms"
        ? "Send a test SMS to verify Twilio SMS configuration."
        : "Send a test WhatsApp message to verify Twilio WhatsApp configuration."

  const fields: FormFieldConfig[] = useMemo(() => {
    if (type === "email") {
      return [
        {
          name: "email",
          label: "Email",
          type: "email",
          required: true,
          section: "Test",
          gridClass: "col-span-3",
          placeholder: "Enter recipient email",
        },
        {
          name: "subject",
          label: "Subject",
          type: "text",
          required: false,
          section: "Test",
          gridClass: "col-span-3",
          placeholder: "Optional subject",
        },
        {
          name: "content",
          label: "Content",
          type: "textarea",
          required: true,
          rows: 8,
          section: "Test",
          gridClass: "col-span-3",
          placeholder: "Write test email content",
        },
      ]
    }

    return [
      {
        name: "phoneNumber",
        label: "Phone Number",
        type: "phone",
        required: true,
        section: "Test",
        gridClass: "col-span-3",
        placeholder: "+1234567890",
      },
      {
        name: "content",
        label: "Content",
        type: "textarea",
        required: true,
        rows: 6,
        section: "Test",
        gridClass: "col-span-3",
        placeholder: "Write message",
      },
    ]
  }, [type])

  const defaultValues = useMemo(() => {
    if (type === "email") {
      return {
        email: "",
        subject: "",
        content: "",
      }
    }
    return {
      phoneNumberCountryCode: "",
      phoneNumber: "",
      content: "",
    }
  }, [defaultContent, type])

  const activeMutation = type === "email" ? emailMutation : type === "sms" ? smsMutation : whatsappMutation

  const handleSubmit = async (values: any) => {
    if (type === "email") {
      await emailMutation.mutateAsync({
        email: values.email,
        subject: values.subject || undefined,
        content: values.content,
      })
      return
    }
    if (type === "sms") {
      const fullPhoneNumber = buildPhoneWithCountryCode(values.phoneNumberCountryCode, values.phoneNumber)
      await smsMutation.mutateAsync({
        phoneNumber: fullPhoneNumber,
        content: values.content,
      })
      return
    }
    const fullPhoneNumber = buildPhoneWithCountryCode(values.phoneNumberCountryCode, values.phoneNumber)
    await whatsappMutation.mutateAsync({
      phoneNumber: fullPhoneNumber,
      content: values.content,
    })
  }

  return (
    <GenericFormDialog
      title={title}
      description={description}
      trigger={trigger}
      hideTrigger={false}
      formSchema={schema as any}
      defaultValues={defaultValues as any}
      fields={fields}
      onSubmit={handleSubmit}
      dialogSize="lg"
      submitButtonText={activeMutation.isPending ? "Sending..." : "Send"}
      cancelButtonText="Cancel"
      isSubmitting={activeMutation.isPending}
      resetOnSubmit={true}
      closeOnSubmit={true}
      disableOpenAutoFocus
      resetOnDefaultValuesChange
    />
  )
}

