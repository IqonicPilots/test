"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useState } from "react"
import { EmailTemplateContent } from "@/app/(dashboard)/settings/notifications-setting/email-template/page"
import { SmsTemplateContent } from "@/app/(dashboard)/settings/notifications-setting/sms-template/page"
import { CustomNotificationContent } from "@/app/(dashboard)/settings/notifications-setting/custom-notification/page"
import { TwilioAccountContent } from "./twilio-account/page"

export default function NotificationSettings() {
  const [openItem, setOpenItem] = useState<string | undefined>("twilio-account")
  const accordionItems = [
    {
      value: "twilio-account",
      title: "Notification Settings",
      content: <TwilioAccountContent active={openItem === "twilio-account"} />,
    },
    { value: "email-template", title: "Email Template Settings", content: <EmailTemplateContent /> },
    { value: "sms-whatsapp", title: "SMS / WhatsApp Settings", content: <SmsTemplateContent /> },
    { value: "custom-notification", title: "Custom Notification Settings", content: <CustomNotificationContent /> },
  ]

  return (
    <div className="min-w-0 max-w-full space-y-0">
      <div className="sticky top-0 z-40 mb-2 border-b bg-card pb-3">
        <h2 className="text-xl font-semibold">Notifications Settings</h2>
      </div>
      <Accordion
        type="single"
        collapsible
        className="min-w-0 w-full max-w-full space-y-4"
        value={openItem}
        onValueChange={(v) => setOpenItem(v || undefined)}
      >
        {accordionItems.map((item) => (
          <AccordionItem key={item.value} value={item.value} className="rounded-md !border">
            <AccordionTrigger className="cursor-pointer px-4 hover:no-underline">
              <div className="flex min-w-0 items-start text-left">
                <span className="break-words">{item.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="min-w-0 px-3 text-muted-foreground sm:px-4">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
