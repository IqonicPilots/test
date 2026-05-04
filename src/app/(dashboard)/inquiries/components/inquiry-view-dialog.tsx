"use client"

import { Badge } from "@/components/ui/badge"
import {
  GenericViewDialog,
  type ViewFieldConfig,
  type ViewSectionConfig,
} from "@/components/generic-view-dialog"
import type { InquiryRecord } from "@/types/inquiry.types"

interface InquiryViewDialogProps {
  inquiry: InquiryRecord
  trigger: React.ReactNode
}

const getText = (value: string | null | undefined) => {
  const normalized = value?.trim()
  return normalized ? normalized : "-"
}

const getTypeLabel = (type: InquiryRecord["type"]) => {
  return type === "inquiry" ? "Inquiry Form" : "Newsletter"
}

const getTypeBadgeClass = (type: InquiryRecord["type"]) => {
  if (type === "inquiry") {
    return "border border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400"
  }

  return "border border-blue-400 bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-400"
}

const formatDateTime = (dateValue?: string | null) => {
  if (!dateValue) return "-"
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return "-"

  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return `${datePart} \u2022 ${timePart}`
}

function SummaryField({
  label,
  value,
  emphasize,
}: {
  label: string
  value: React.ReactNode
  emphasize?: boolean
}) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className={emphasize ? "text-sm font-bold text-foreground break-words" : "text-sm text-foreground break-words"}>
        {value}
      </div>
    </div>
  )
}

export function InquiryViewDialog({ inquiry, trigger }: InquiryViewDialogProps) {
  const typeLabel = getTypeLabel(inquiry.type)
  const isNewsletter = inquiry.type === "newsletter"

  const createdAtText = formatDateTime(inquiry.createdAt)
  const fullName = getText(inquiry.fullName)
  const email = getText(inquiry.email)
  const phone = getText(inquiry.phone)
  const clinicName = getText(inquiry.clinicName)
  const message = getText(inquiry.message)

  const sections: ViewSectionConfig[] = isNewsletter
    ? [
        {
          title: "",
          items: [
            {
              title: "",
              rawInfo: `${email}${typeLabel}`,
              info: (
                <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <SummaryField
                    label="Email"
                    value={
                      email !== "-" ? (
                        <a href={`mailto:${email}`} className="hover:underline">
                          {email}
                        </a>
                      ) : (
                        email
                      )
                    }
                    emphasize
                  />
                  <div className="shrink-0 sm:pt-0.5">
                    <Badge variant="outline" className={getTypeBadgeClass(inquiry.type)}>
                      {typeLabel}
                    </Badge>
                  </div>
                </div>
              ),
            },
          ],
        },
      ]
    : [
        {
          title: "",
          items: [
            {
              title: "",
              rawInfo: `${fullName}${email}${phone}${clinicName}${createdAtText}`,
              info: (
                <div className="grid w-full gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryField label="Name" value={fullName} emphasize />
                  <SummaryField
                    label="Email"
                    value={
                      email !== "-" ? (
                        <a href={`mailto:${email}`} className="hover:underline">
                          {email}
                        </a>
                      ) : (
                        email
                      )
                    }
                  />
                  <SummaryField label="Phone Number" value={phone} />
                  <SummaryField label="Clinic Name" value={clinicName} />
                </div>
              ),
            },
          ],
        },
      ]

  const headerFields: ViewFieldConfig[] = []

  const footer = isNewsletter
    ? undefined
    : (
      <div className="space-y-3">
        <div className="rounded-xl border border-border/50 bg-accent/20 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Message
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
            {message}
          </p>
        </div>
      </div>
    )

  return (
    <GenericViewDialog
      title={isNewsletter ? "Subscriber Details" : "Inquiry Details"}
      trigger={trigger}
      headerAccessory={
        <div className="flex items-start justify-between gap-4 w-full">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
            {isNewsletter ? "Subscribed Date:" : "Created Date:"}
            <span className="ml-2 text-sm font-medium normal-case text-foreground">
              {createdAtText}
            </span>
          </p>
          {!isNewsletter ? (
            <Badge variant="outline" className={getTypeBadgeClass(inquiry.type)}>
              {typeLabel}
            </Badge>
          ) : <div />}
        </div>
      }
      headerFields={headerFields}
      sections={sections}
      footer={footer}
      dialogSize="lg"
    />
  )
}
