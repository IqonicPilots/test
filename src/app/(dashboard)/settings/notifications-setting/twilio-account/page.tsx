"use client"

import { useEffect, useMemo, useState } from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useNotificationSettings, useSaveNotificationSettings } from "@/hooks/api/use-notification-settings"
import { type NotificationSettingsData } from "@/services/notification-settings.service"
import { SendTestNotificationDialog } from "../components/send-test-notification-dialog"

const twilioSchema = z
  .object({
    enable_sms: z.boolean(),
    enable_whatsapp: z.boolean(),
    account_sid: z.string(),
    auth_token: z.string(),
    sms_phone_number: z.string(),
    whatsapp_phone_number: z.string(),
  })
  .superRefine((d, ctx) => {
    const phoneWithCountryCodeRegex = /^\+\d+$/

    if (!d.enable_sms && !d.enable_whatsapp) return
    if (!d.account_sid.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account SID is required", path: ["account_sid"] })
    }
    if (!d.auth_token.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Auth token is required", path: ["auth_token"] })
    }
    if (d.enable_sms && !d.sms_phone_number.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SMS phone number is required",
        path: ["sms_phone_number"],
      })
    } else if (d.enable_sms && !phoneWithCountryCodeRegex.test(d.sms_phone_number.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SMS phone number must start with country code, e.g. +14155552671",
        path: ["sms_phone_number"],
      })
    }
    if (d.enable_whatsapp && !d.whatsapp_phone_number.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "WhatsApp phone number is required",
        path: ["whatsapp_phone_number"],
      })
    } else if (d.enable_whatsapp && !phoneWithCountryCodeRegex.test(d.whatsapp_phone_number.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "WhatsApp phone number must start with country code, e.g. +14155552671",
        path: ["whatsapp_phone_number"],
      })
    }
  })

type TwilioAccountFormState = ReturnType<typeof getDefaults>

/** Map API custom_notification; supports legacy GET payloads using enable_sms / enable_whatsapp. */
function customNotificationFromSettings(settings?: NotificationSettingsData["custom_notification"]) {
  const cn = settings as
    | (NotificationSettingsData["custom_notification"] & {
        enable_sms?: boolean
        enable_whatsapp?: boolean
      })
    | undefined
  return {
    enable_custom_sms: cn?.enable_custom_sms ?? cn?.enable_sms ?? false,
    enable_custom_whatsapp: cn?.enable_custom_whatsapp ?? cn?.enable_whatsapp ?? false,
    enable_custom_push: cn?.enable_custom_push ?? false,
  }
}

function getDefaults(settings?: NotificationSettingsData) {
  const tw = settings?.twilio as
    | (NotificationSettingsData["twilio"] & { phone_number?: string })
    | undefined
  const legacyPhone = tw?.phone_number ?? ""
  return {
    twilio: {
      enable_sms: tw?.enable_sms ?? false,
      enable_whatsapp: tw?.enable_whatsapp ?? false,
      account_sid: tw?.account_sid ?? "",
      auth_token: tw?.auth_token ?? "",
      sms_phone_number: tw?.sms_phone_number ?? legacyPhone,
      whatsapp_phone_number: tw?.whatsapp_phone_number ?? legacyPhone,
    },
    custom_notification: customNotificationFromSettings(settings?.custom_notification),
  }
}

/** Merge GET/refetch payloads into local form without wiping fields the API omitted. */
function mergeServerIntoForm(prev: TwilioAccountFormState, server: NotificationSettingsData): TwilioAccountFormState {
  const tw = server.twilio as
    | (NotificationSettingsData["twilio"] & { phone_number?: string })
    | undefined
  const cn = server.custom_notification
  const legacyPhone = tw?.phone_number
  return {
    twilio: {
      enable_sms: tw?.enable_sms ?? prev.twilio.enable_sms,
      enable_whatsapp: tw?.enable_whatsapp ?? prev.twilio.enable_whatsapp,
      account_sid: tw?.account_sid ?? prev.twilio.account_sid,
      auth_token: tw?.auth_token ?? prev.twilio.auth_token,
      sms_phone_number: tw?.sms_phone_number ?? legacyPhone ?? prev.twilio.sms_phone_number,
      whatsapp_phone_number: tw?.whatsapp_phone_number ?? legacyPhone ?? prev.twilio.whatsapp_phone_number,
    },
    custom_notification:
      cn != null
        ? {
            enable_custom_sms:
              cn.enable_custom_sms ??
              (cn as { enable_sms?: boolean }).enable_sms ??
              prev.custom_notification.enable_custom_sms,
            enable_custom_whatsapp:
              cn.enable_custom_whatsapp ??
              (cn as { enable_whatsapp?: boolean }).enable_whatsapp ??
              prev.custom_notification.enable_custom_whatsapp,
            enable_custom_push: cn.enable_custom_push ?? prev.custom_notification.enable_custom_push,
          }
        : prev.custom_notification,
  }
}

export function TwilioAccountContent({ active = true }: { active?: boolean }) {
  const { data, isLoading } = useNotificationSettings()
  const saveMutation = useSaveNotificationSettings()

  const [form, setForm] = useState(() => getDefaults(undefined))
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!data) return
    setForm((prev) => mergeServerIntoForm(prev, data))
    setErrors({})
  }, [data])

  const canSendTestSms = useMemo(() => {
    const t = form.twilio
    return Boolean(
      t.enable_sms && t.account_sid.trim() && t.auth_token.trim() && t.sms_phone_number.trim(),
    )
  }, [form.twilio])

  const canSendTestWhatsapp = useMemo(() => {
    const t = form.twilio
    return Boolean(
      t.enable_whatsapp &&
        t.account_sid.trim() &&
        t.auth_token.trim() &&
        t.whatsapp_phone_number.trim(),
    )
  }, [form.twilio])

  const updateTwilio = (
    key: keyof (typeof form)["twilio"], 
    value: (typeof form)["twilio"][keyof (typeof form)["twilio"]]
  ) => {
    setForm((prev) => ({ ...prev, twilio: { ...prev.twilio, [key]: value } }))
  }
  const updateCustom = (
    key: keyof (typeof form)["custom_notification"],
    value: (typeof form)["custom_notification"][keyof (typeof form)["custom_notification"]],
  ) => {
    setForm((prev) => ({ ...prev, custom_notification: { ...prev.custom_notification, [key]: value } }))
  }

  const buildPayload = (nextForm: typeof form): NotificationSettingsData => {
    return {
      ...(data ?? {}),
      twilio: {
        enable_sms: nextForm.twilio.enable_sms,
        enable_whatsapp: nextForm.twilio.enable_whatsapp,
        account_sid: nextForm.twilio.account_sid,
        auth_token: nextForm.twilio.auth_token,
        sms_phone_number: nextForm.twilio.sms_phone_number,
        whatsapp_phone_number: nextForm.twilio.whatsapp_phone_number,
      },
      custom_notification: {
        enable_custom_sms: nextForm.custom_notification.enable_custom_sms,
        enable_custom_whatsapp: nextForm.custom_notification.enable_custom_whatsapp,
        enable_custom_push: nextForm.custom_notification.enable_custom_push,
      },
    }
  }

  const validateTwilioCreds = (nextTwilio: (typeof form)["twilio"]) => {
    const parsed = twilioSchema.safeParse(nextTwilio)
    if (parsed.success) {
      setErrors({})
      return true
    }

    const nextErrors: Record<string, string> = {}
    parsed.error.issues.forEach((issue) => {
      const k = issue.path?.[0]
      if (typeof k === "string" && !nextErrors[k]) nextErrors[k] = issue.message
    })
    setErrors(nextErrors)
    return false
  }

  const handleSave = async () => {
    const needsTwilioCreds = form.twilio.enable_sms || form.twilio.enable_whatsapp
    if (needsTwilioCreds && !validateTwilioCreds(form.twilio)) return
    if (!needsTwilioCreds) setErrors({})
    await saveMutation.mutateAsync({ data: buildPayload(form) })
  }

  const toggleSms = (next: boolean) => {
    updateTwilio("enable_sms", next)
  }

  const toggleWhatsapp = (next: boolean) => {
    updateTwilio("enable_whatsapp", next)
  }

  return (
    <div className="space-y-6 pb-2">

      {/* SMS / WhatsApp Configuration */}
      <section className="py-2 mb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground/90">SMS / WhatsApp Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Enable and configure Twilio SMS and WhatsApp with one Account SID and Auth Token.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">SMS</span>
              <Switch
                checked={form.twilio.enable_sms}
                onCheckedChange={toggleSms}
                className="cursor-pointer"
                aria-label="Enable Twilio SMS"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">WhatsApp</span>
              <Switch
                checked={form.twilio.enable_whatsapp}
                onCheckedChange={toggleWhatsapp}
                className="cursor-pointer"
                aria-label="Enable Twilio WhatsApp"
              />
            </div>
          </div>
        </div>
      </section>
      <Collapsible open={active && (form.twilio.enable_sms || form.twilio.enable_whatsapp)}>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Account SID</Label>
                <Input
                  value={form.twilio.account_sid}
                  onChange={(e) => updateTwilio("account_sid", e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="text-foreground"
                />
                {errors.account_sid ? <p className="text-xs text-destructive">{errors.account_sid}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label>Auth Token</Label>
                <Input
                  value={form.twilio.auth_token}
                  onChange={(e) => updateTwilio("auth_token", e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="text-foreground"
                />
                {errors.auth_token ? <p className="text-xs text-destructive">{errors.auth_token}</p> : null}
              </div>
            </div>

            <div className={`grid grid-cols-1 gap-4 md:grid-cols-2`}>
              {form.twilio.enable_sms ? (
                <div className="space-y-1.5">
                  <Label>SMS phone number</Label>
                  <Input
                    value={form.twilio.sms_phone_number}
                    onChange={(e) => updateTwilio("sms_phone_number", e.target.value)}
                    placeholder="+1234567890"
                    className="text-foreground"
                  />
                  {errors.sms_phone_number ? (
                    <p className="text-xs text-destructive">{errors.sms_phone_number}</p>
                  ) : null}
                </div>
              ) : null}

              {form.twilio.enable_whatsapp ? (
                <div className="space-y-1.5">
                  <Label>WhatsApp phone number</Label>
                  <Input
                    value={form.twilio.whatsapp_phone_number}
                    onChange={(e) => updateTwilio("whatsapp_phone_number", e.target.value)}
                    placeholder="+1234567890"
                    className="text-foreground"
                  />
                  {errors.whatsapp_phone_number ? (
                    <p className="text-xs text-destructive">{errors.whatsapp_phone_number}</p>
                  ) : null}
                  {form.twilio.enable_sms ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      If SMS and WhatsApp use the same phone numbers, enter it in both fields. If they use different
                      numbers, enter each number in its own field.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {form.twilio.enable_sms ? (
                <SendTestNotificationDialog
                  type="sms"
                  trigger={
                    <Button
                      variant="outline"
                      disabled={!canSendTestSms || !form.twilio.enable_sms}
                      className="cursor-pointer h-9 text-foreground"
                    >
                      Send Test SMS
                    </Button>
                  }
                />  
              ) : null}
              {form.twilio.enable_whatsapp ? (
                <SendTestNotificationDialog
                  type="whatsapp"
                  trigger={
                    <Button
                      variant="outline"
                      disabled={!canSendTestWhatsapp || !form.twilio.enable_whatsapp}
                      className="cursor-pointer h-9 text-foreground"
                    >
                      Send Test WhatsApp
                    </Button>
                  }
                />
              ) : null}
            </div>

            <Separator />

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="guide" className="border !border-b-1 rounded-lg bg-muted/10 px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <h3 className="text-foreground">Guide to setup Twilio SMS / WhatsApp.</h3>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">Step 1 :</strong> Create a Twilio account and verify yourphone number.</p>
                    <p><strong className="text-foreground">Step 2 :</strong> In Twilio Console, copy your Account SIDand Auth Token.</p>
                    <p><strong className="text-foreground">Step 3 :</strong> Add a Twilio phone number and paste ithere.</p>
                    <p><strong className="text-foreground">SMS :</strong> Add a Twilio phone number for SMS and put itin <span className="font-medium text-foreground">SMS phone number</span>. Use “Send Test SMS” to verify.</p>
                    <p><strong className="text-foreground">WhatsApp :</strong> Enable WhatsApp for your number in theTwilio Console (or use a sandbox), then set <span className="font-medium text-foreground">WhatsApp  phone number</span> and use “Send Test WhatsApp”.</p>
                    <p><strong className="text-foreground">Important :</strong> Recipient phone number must includecountry code (E.164 format), e.g. <span className="font-mono">+14155552671</span>.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Custom Notification Settings */}
      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground/90">Custom Notification</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">Enable SMS</p>
            <Switch
              checked={form.custom_notification.enable_custom_sms}
              onCheckedChange={(next) => updateCustom("enable_custom_sms", next)}
              className="cursor-pointer"
              aria-label="Enable custom SMS"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">Enable WhatsApp</p>
            <Switch
              checked={form.custom_notification.enable_custom_whatsapp}
              onCheckedChange={(next) => updateCustom("enable_custom_whatsapp", next)}
              className="cursor-pointer"
              aria-label="Enable custom WhatsApp"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">Enable Push notification</p>
            <Switch
              checked={form.custom_notification.enable_custom_push}
              onCheckedChange={(next) => updateCustom("enable_custom_push", next)}
              className="cursor-pointer"
              aria-label="Enable custom push notification"
            />
          </div>
        </div>
      </section>

      <Separator />

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <Button
          onClick={handleSave}
          disabled={isLoading || saveMutation.isPending}
          className="cursor-pointer h-9 min-w-[120px]"
        >
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}

export default function Page() {
  return <TwilioAccountContent />
}

