"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { useUpdateNotificationTemplate } from "@/hooks/api/use-notification-templates"
import { useNotificationSettings } from "@/hooks/api/use-notification-settings"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { NotificationTemplatesTable } from "../components/notification-templates-table"
import { SendTestNotificationDialog } from "../components/send-test-notification-dialog"
import { notificationTemplateApi } from "@/services/notification-template.service"

export function SmsTemplateContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["notification-templates", "sms-whatsapp-all"],
    queryFn: async () => {
      const first = await notificationTemplateApi.getTemplates({ type: "sms_whatsapp", page: 1, perPage: 50 })
      const totalPages = first.pagination?.totalPages ?? 1
      if (totalPages <= 1) {
        return first
      }

      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          notificationTemplateApi.getTemplates({ type: "sms_whatsapp", page: index + 2, perPage: 50 }),
        ),
      )
      return {
        ...first,
        data: [first.data, ...rest.map((result) => result.data)].flat(),
      }
    },
    staleTime: 5 * 60 * 1000,
  })
  const { data: notificationSettings } = useNotificationSettings()
  const updateMutation = useUpdateNotificationTemplate()
  const twilio = notificationSettings?.twilio
  const templates = useMemo(() => data?.data ?? [], [data?.data])

  const canTestSms = Boolean(
    twilio?.enable_sms && twilio?.account_sid && twilio?.auth_token && twilio?.sms_phone_number,
  )
  const canTestWhatsapp = Boolean(
    twilio?.enable_whatsapp && twilio?.account_sid && twilio?.auth_token && twilio?.whatsapp_phone_number,
  )

  return (
    <div className="space-y-4">
      <NotificationTemplatesTable
        templates={templates}
        isLoading={isLoading && !templates.length}
        onToggleStatus={(id, nextIsActive) => updateMutation.mutate({ id, data: { isActive: nextIsActive } })}
        headerActions={
          <>
            <SendTestNotificationDialog
              type="sms"
              defaultContent={templates[0]?.content ?? ""}
              trigger={
                canTestSms ? (
                  <Button className="cursor-pointer h-9" variant="default">
                    Send Test SMS
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button className="cursor-not-allowed h-9" variant="default" disabled>
                          Send Test SMS
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>Please configure Twilio SMS settings first.</TooltipContent>
                  </Tooltip>
                )
              }
            />
            <SendTestNotificationDialog
              type="whatsapp"
              defaultContent={templates[0]?.content ?? ""}
              trigger={
                canTestWhatsapp ? (
                  <Button className="cursor-pointer h-9" variant="default">
                    Send Test WhatsApp
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button className="cursor-not-allowed h-9" variant="default" disabled>
                          Send Test WhatsApp
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>Please configure Twilio WhatsApp settings first.</TooltipContent>
                  </Tooltip>
                )
              }
            />
          </>
        }
      />
    </div>
  )
}

export default function SmsTemplatePage() {
  return <SmsTemplateContent />
}

