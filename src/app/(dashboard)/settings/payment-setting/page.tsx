"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePaymentSettings, useSavePaymentSettings } from "@/hooks/api/use-payment-settings"
import type {
  PaymentMode,
  PaymentSettingsData,
  PaypalSettings,
  RazorpaySettings,
  StripeSettings,
} from "@/services/payment-settings.service"

const paymentTabs = [
  { value: "paylater", label: "Pay later" },
  { value: "paypal", label: "Paypal" },
  { value: "razorpay", label: "Razorpay" },
  { value: "stripe", label: "Stripe" },
] as const

const currencyOptions = ["USD", "INR", "EUR", "GBP", "AUD", "CAD", "AED", "SGD"] as const

type FormState = {
  pay_later: {
    isActive: boolean
  }
  paypal: PaypalSettings
  razorpay: RazorpaySettings
  stripe: StripeSettings
}

type GatewayFieldErrors = {
  left?: string
  right?: string
}

type GatewayErrorState = {
  paypal: GatewayFieldErrors
  razorpay: GatewayFieldErrors
  stripe: GatewayFieldErrors
}

function getDefaults(settings?: PaymentSettingsData): FormState {
  return {
    pay_later: {
      isActive: settings?.pay_later?.isActive ?? false,
    },
    paypal: {
      isActive: settings?.paypal?.isActive ?? false,
      mode: settings?.paypal?.mode ?? "sandbox",
      client_id: settings?.paypal?.client_id ?? "",
      client_secret: settings?.paypal?.client_secret ?? "",
      currency: settings?.paypal?.currency ?? "USD",
    },
    razorpay: {
      isActive: settings?.razorpay?.isActive ?? false,
      mode: settings?.razorpay?.mode ?? "sandbox",
      key_id: settings?.razorpay?.key_id ?? "",
      key_secret: settings?.razorpay?.key_secret ?? "",
      currency: settings?.razorpay?.currency ?? "USD",
    },
    stripe: {
      isActive: settings?.stripe?.isActive ?? false,
      mode: settings?.stripe?.mode ?? "sandbox",
      secret_api_key: settings?.stripe?.secret_api_key ?? "",
      publishable_key: settings?.stripe?.publishable_key ?? "",
      currency: settings?.stripe?.currency ?? "USD",
    },
  }
}

function PaymentGatewayFields({
  title,
  enabledLabel,
  isActive,
  onToggleActive,
  mode,
  onModeChange,
  currency,
  onCurrencyChange,
  leftLabel,
  leftValue,
  onLeftChange,
  leftPlaceholder,
  rightLabel,
  rightValue,
  onRightChange,
  rightPlaceholder,
  onSave,
  isSaving,
  leftError,
  rightError,
}: {
  title: string
  enabledLabel: string
  isActive: boolean
  onToggleActive: (value: boolean) => void
  mode: PaymentMode
  onModeChange: (value: PaymentMode) => void
  currency: string
  onCurrencyChange: (value: string) => void
  leftLabel: string
  leftValue: string
  onLeftChange: (value: string) => void
  leftPlaceholder: string
  rightLabel: string
  rightValue: string
  onRightChange: (value: string) => void
  rightPlaceholder: string
  onSave: () => void
  isSaving: boolean
  leftError?: string
  rightError?: string
}) {
  return (
    <div className="space-y-5 rounded-md border p-4">
      <h3 className="text-base font-semibold">{title}</h3>

      <div className="flex items-center justify-between gap-3">
        <Label className="cursor-pointer">{enabledLabel}</Label>
        <Switch checked={isActive} onCheckedChange={onToggleActive} className="cursor-pointer" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Mode</Label>
          <Select value={mode} onValueChange={(value) => onModeChange(value as PaymentMode)} disabled={!isActive}>
            <SelectTrigger className={`w-full ${!isActive ? "cursor-not-allowed pointer-events-none" : ""}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
              <SelectItem value="live">Live</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={onCurrencyChange} disabled={!isActive}>
            <SelectTrigger className={`w-full ${!isActive ? "cursor-not-allowed pointer-events-none" : ""}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((currencyCode) => (
                <SelectItem key={currencyCode} value={currencyCode}>
                  {currencyCode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={`space-y-1.5 ${!isActive ? "cursor-not-allowed" : ""}`}>
          <Label>{leftLabel}</Label>
          <Input
            value={leftValue}
            onChange={(e) => onLeftChange(e.target.value)}
            placeholder={leftPlaceholder}
            disabled={!isActive}
            className={`${!isActive ? "pointer-events-auto disabled:cursor-not-allowed" : "cursor-text"}`}
          />
          {leftError ? <p className="text-xs text-destructive">{leftError}</p> : null}
        </div>
        <div className={`space-y-1.5 ${!isActive ? "cursor-not-allowed" : ""}`}>
          <Label>{rightLabel}</Label>
          <Input
            value={rightValue}
            onChange={(e) => onRightChange(e.target.value)}
            placeholder={rightPlaceholder}
            disabled={!isActive}
            className={`${!isActive ? "pointer-events-auto disabled:cursor-not-allowed" : "cursor-text"}`}
          />
          {rightError ? <p className="text-xs text-destructive">{rightError}</p> : null}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={isSaving} className="cursor-pointer min-w-[140px]">
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}

export default function PaymentSettingsPage() {
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const validTabs = useMemo(() => paymentTabs.map((item) => item.value), [])
  const { data, isLoading } = usePaymentSettings()
  const saveMutation = useSavePaymentSettings()

  const [activeTab, setActiveTab] = useState<(typeof paymentTabs)[number]["value"]>("paylater")
  const [form, setForm] = useState<FormState>(() => getDefaults(undefined))
  const [errors, setErrors] = useState<GatewayErrorState>({
    paypal: {},
    razorpay: {},
    stripe: {},
  })

  const validateGatewayFields = (
    gateway: keyof GatewayErrorState,
    leftValue: string,
    rightValue: string,
    leftLabel: string,
    rightLabel: string
  ) => {
    const nextErrors: GatewayFieldErrors = {
      left: leftValue.trim() ? undefined : `${leftLabel} is required.`,
      right: rightValue.trim() ? undefined : `${rightLabel} is required.`,
    }
    setErrors((prev) => ({ ...prev, [gateway]: nextErrors }))
    return !nextErrors.left && !nextErrors.right
  }

  const shouldForcePayLater =
    !form.paypal.isActive &&
    !form.razorpay.isActive &&
    !form.stripe.isActive

  useEffect(() => {
    if (!data) return
    setForm(getDefaults(data))
  }, [data])

  useEffect(() => {
    if (requestedTab && validTabs.includes(requestedTab as (typeof paymentTabs)[number]["value"])) {
      setActiveTab(requestedTab as (typeof paymentTabs)[number]["value"])
    }
  }, [requestedTab, validTabs])

  useEffect(() => {
    if (!shouldForcePayLater || form.pay_later.isActive) return
    setForm((prev) => ({ ...prev, pay_later: { ...prev.pay_later, isActive: true } }))
  }, [shouldForcePayLater, form.pay_later.isActive])

  return (
    <div className="min-w-0 max-w-full space-y-0">
      <div className="sticky top-0 z-40 mb-2 border-b bg-card pb-3">
        <h2 className="text-xl font-semibold">Payment Settings</h2>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as (typeof paymentTabs)[number]["value"])}
        className="min-w-0 w-full max-w-full gap-3"
      >
        <TabsList className="grid h-auto w-full min-w-0 grid-cols-2 gap-2 rounded-lg bg-muted/50 p-2 md:flex md:h-12 md:min-h-12 md:justify-start md:overflow-x-auto md:p-1 md:[scrollbar-width:thin]">
          {paymentTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="h-auto min-h-10 w-full justify-center whitespace-normal text-center text-sm leading-tight md:h-10 md:min-h-0 md:w-auto md:shrink-0 md:whitespace-nowrap"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="paylater">
          <div className="space-y-5 rounded-md border p-4">
            <h3 className="text-base font-semibold">Pay later Settings</h3>
            <div className="flex items-center justify-between gap-3">
              <Label className="cursor-pointer">Enable Pay Later</Label>
              <Switch
                checked={form.pay_later.isActive}
                onCheckedChange={(next) => {
                  if (shouldForcePayLater) return
                  setForm((prev) => ({ ...prev, pay_later: { ...prev.pay_later, isActive: next } }))
                }}
                disabled={shouldForcePayLater}
                className={shouldForcePayLater ? "cursor-not-allowed" : "cursor-pointer"}
              />
            </div>
            <p className="text-xs text-blue-500 dark:text-amber-500">
              Note: If all payment methods are disabled, the "Pay Later" option will be automatically enabled. To disable the "Pay Later" option, you must first enable at least one of the payment method.
            </p>
            <div className="flex justify-end">
              <Button
                onClick={() =>
                  saveMutation.mutate({
                    data: {
                      pay_later: form.pay_later,
                    },
                    successMessage: "Paylater settings saved successfully.",
                  })
                }
                disabled={isLoading || saveMutation.isPending || shouldForcePayLater}
                className="cursor-pointer min-w-[140px]"
              >
                {saveMutation.isPending ? "Saving..." : shouldForcePayLater ? "Pay Later is enabled" : "Save Changes"}
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="paypal">
          <PaymentGatewayFields
            title="Paypal Payment Setting"
            enabledLabel="Enable PayPal"
            isActive={form.paypal.isActive}
            onToggleActive={(next) => {
              setForm((prev) => ({ ...prev, paypal: { ...prev.paypal, isActive: next } }))
              if (!next) setErrors((prev) => ({ ...prev, paypal: {} }))
            }}
            mode={form.paypal.mode}
            onModeChange={(mode) => setForm((prev) => ({ ...prev, paypal: { ...prev.paypal, mode } }))}
            currency={form.paypal.currency}
            onCurrencyChange={(currency) => setForm((prev) => ({ ...prev, paypal: { ...prev.paypal, currency } }))}
            leftLabel="Client ID"
            leftValue={form.paypal.client_id}
            onLeftChange={(value) => {
              setForm((prev) => ({ ...prev, paypal: { ...prev.paypal, client_id: value } }))
              if (errors.paypal.left) {
                setErrors((prev) => ({ ...prev, paypal: { ...prev.paypal, left: undefined } }))
              }
            }}
            leftPlaceholder="Enter PayPal Client ID"
            rightLabel="Client Secret"
            rightValue={form.paypal.client_secret}
            onRightChange={(value) => {
              setForm((prev) => ({ ...prev, paypal: { ...prev.paypal, client_secret: value } }))
              if (errors.paypal.right) {
                setErrors((prev) => ({ ...prev, paypal: { ...prev.paypal, right: undefined } }))
              }
            }}
            rightPlaceholder="Enter PayPal Client Secret"
            onSave={() => {
              if (form.paypal.isActive) {
                const isValid = validateGatewayFields(
                  "paypal",
                  form.paypal.client_id,
                  form.paypal.client_secret,
                  "Client ID",
                  "Client Secret"
                )
                if (!isValid) return
              }
              saveMutation.mutate({
                data: {
                  paypal: form.paypal,
                  ...(shouldForcePayLater ? { pay_later: { isActive: true } } : {}),
                },
                successMessage: "Paypal settings saved successfully.",
              })
            }}
            isSaving={isLoading || saveMutation.isPending}
            leftError={errors.paypal.left}
            rightError={errors.paypal.right}
          />
        </TabsContent>
        <TabsContent value="razorpay">
          <PaymentGatewayFields
            title="Razorpay Payment Setting"
            enabledLabel="Enable Razorpay"
            isActive={form.razorpay.isActive}
            onToggleActive={(next) => {
              setForm((prev) => ({ ...prev, razorpay: { ...prev.razorpay, isActive: next } }))
              if (!next) setErrors((prev) => ({ ...prev, razorpay: {} }))
            }}
            mode={form.razorpay.mode}
            onModeChange={(mode) => setForm((prev) => ({ ...prev, razorpay: { ...prev.razorpay, mode } }))}
            currency={form.razorpay.currency}
            onCurrencyChange={(currency) =>
              setForm((prev) => ({ ...prev, razorpay: { ...prev.razorpay, currency } }))
            }
            leftLabel="Key ID"
            leftValue={form.razorpay.key_id}
            onLeftChange={(value) => {
              setForm((prev) => ({ ...prev, razorpay: { ...prev.razorpay, key_id: value } }))
              if (errors.razorpay.left) {
                setErrors((prev) => ({ ...prev, razorpay: { ...prev.razorpay, left: undefined } }))
              }
            }}
            leftPlaceholder="Enter Razorpay Key ID"
            rightLabel="Key Secret"
            rightValue={form.razorpay.key_secret}
            onRightChange={(value) => {
              setForm((prev) => ({ ...prev, razorpay: { ...prev.razorpay, key_secret: value } }))
              if (errors.razorpay.right) {
                setErrors((prev) => ({ ...prev, razorpay: { ...prev.razorpay, right: undefined } }))
              }
            }}
            rightPlaceholder="Enter Razorpay Key Secret"
            onSave={() => {
              if (form.razorpay.isActive) {
                const isValid = validateGatewayFields(
                  "razorpay",
                  form.razorpay.key_id,
                  form.razorpay.key_secret,
                  "Key ID",
                  "Key Secret"
                )
                if (!isValid) return
              }
              saveMutation.mutate({
                data: {
                  razorpay: form.razorpay,
                  ...(shouldForcePayLater ? { pay_later: { isActive: true } } : {}),
                },
                successMessage: "Razorpay settings saved successfully.",
              })
            }}
            isSaving={isLoading || saveMutation.isPending}
            leftError={errors.razorpay.left}
            rightError={errors.razorpay.right}
          />
        </TabsContent>
        <TabsContent value="stripe">
          <PaymentGatewayFields
            title="Stripe Payment Setting"
            enabledLabel="Enable Stripe"
            isActive={form.stripe.isActive}
            onToggleActive={(next) => {
              setForm((prev) => ({ ...prev, stripe: { ...prev.stripe, isActive: next } }))
              if (!next) setErrors((prev) => ({ ...prev, stripe: {} }))
            }}
            mode={form.stripe.mode}
            onModeChange={(mode) => setForm((prev) => ({ ...prev, stripe: { ...prev.stripe, mode } }))}
            currency={form.stripe.currency}
            onCurrencyChange={(currency) => setForm((prev) => ({ ...prev, stripe: { ...prev.stripe, currency } }))}
            leftLabel="Secret API Key"
            leftValue={form.stripe.secret_api_key}
            onLeftChange={(value) => {
              setForm((prev) => ({ ...prev, stripe: { ...prev.stripe, secret_api_key: value } }))
              if (errors.stripe.left) {
                setErrors((prev) => ({ ...prev, stripe: { ...prev.stripe, left: undefined } }))
              }
            }}
            leftPlaceholder="Enter Stripe Secret API Key"
            rightLabel="Publishable Key"
            rightValue={form.stripe.publishable_key}
            onRightChange={(value) => {
              setForm((prev) => ({ ...prev, stripe: { ...prev.stripe, publishable_key: value } }))
              if (errors.stripe.right) {
                setErrors((prev) => ({ ...prev, stripe: { ...prev.stripe, right: undefined } }))
              }
            }}
            rightPlaceholder="Enter Stripe Publishable Key"
            onSave={() => {
              if (form.stripe.isActive) {
                const isValid = validateGatewayFields(
                  "stripe",
                  form.stripe.secret_api_key,
                  form.stripe.publishable_key,
                  "Secret API Key",
                  "Publishable Key"
                )
                if (!isValid) return
              }
              saveMutation.mutate({
                data: {
                  stripe: form.stripe,
                  ...(shouldForcePayLater ? { pay_later: { isActive: true } } : {}),
                },
                successMessage: "Stripe settings saved successfully.",
              })
            }}
            isSaving={isLoading || saveMutation.isPending}
            leftError={errors.stripe.left}
            rightError={errors.stripe.right}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
