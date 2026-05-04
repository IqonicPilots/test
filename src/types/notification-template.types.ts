export type NotificationTemplateType = "email" | "push" | "sms_whatsapp" | "custom"

export type NotificationRecipient =
  | "clinic"
  | "doctor"
  | "patient"
  | "common"
  | "receptionist"
  | "admin"
  | "clinic_admin"
  | "newsletter_subscribers"

export type NotificationTemplate = {
  _id: string
  name: string
  type: NotificationTemplateType
  service_type?: "push" | "email" | "sms_whatsapp"
  recipients: NotificationRecipient[]
  isSystem: boolean
  isActive: boolean
  content: string
  subject?: string
  push_title?: string
  contentsid?: string
  trigger_event?: string
  variables?: string[]
  createdAt: string
  updatedAt: string
  clinicIds?: string[]
  schedule_type?: "one_time" | "multiple"
  interval_type?: "minute" | "hour" | "day" | "week" | "month"
  interval_value?: number
  send_time?: string
  target_condition?:
    | "all"
    | "new_user"
    | "all_clinic_admin"
    | "all_patients"
    | "all_doctors"
    | "new_doctors"
    | "new_patients"
    | "particular_clinic_all_user"
    | "particular_clinic_all_doctor"
    | "particular_clinic_all_receptionist"
    | "particular_clinic_all_patient"
    | "particular_clinic_all_admin"
    | "patients_with_pending_bills"
    | "patients_with_appointments_today"
    | "birthday_today"
}

export type TemplatesListResponse = {
  statusCode?: number
  success?: boolean
  message?: string
  data: NotificationTemplate[]
  pagination?: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}

export type UpdateNotificationTemplatePayload = Partial<
  Pick<
    NotificationTemplate,
    | "name"
    | "content"
    | "subject"
    | "push_title"
    | "contentsid"
    | "recipients"
    | "isActive"
    | "target_condition"
    | "schedule_type"
    | "send_time"
    | "interval_type"
    | "interval_value"
    | "service_type"
    | "clinicIds"
  >
>

export type CreateCustomNotificationTemplatePayload = {
  type?: NotificationTemplateType
  service_type: "push" | "email" | "sms_whatsapp"
  name: string
  push_title?: string
  subject?: string
  content: string
  target_condition: NotificationTemplate["target_condition"]
  schedule_type: "one_time" | "multiple"
  interval_type?: NotificationTemplate["interval_type"]
  interval_value?: number
  send_time?: string
  clinicIds?: string[]
}

