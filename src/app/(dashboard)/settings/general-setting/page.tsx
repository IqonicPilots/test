"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { LanguagePicker } from "@/components/language-picker"
import { PhoneInputField } from "@/components/common/PhoneInputField"
import { ConfigurationsContent } from "@/app/(dashboard)/settings/general-setting/configurations/page"
import { ListingsContent } from "@/app/(dashboard)/settings/general-setting/listings/components/listings-content"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/axios"
import {
  generalSettingsApi,
  type GeneralSettingsData,
} from "@/services/general-settings.service"
import type { SystemConfig } from "@/types/system-config.types"
import { useAuthRole } from "@/hooks/use-auth-role"
import { getSettingsSubKeysForRole } from "@/config/roleConfig"

function GeneralSettingsContent() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<GeneralSettingsData | null>(null)
  const { data, isLoading } = useQuery<GeneralSettingsData>({
    queryKey: ["general-settings"],
    queryFn: () => generalSettingsApi.getSettings(),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!data) return
    setForm(data)
  }, [data])

  useEffect(() => {
    if (!form) return
    queryClient.setQueryData<SystemConfig>(["system-config"], (prev) => ({
      ...(prev ?? {}),
      app_subtext: form.app_subtext,
      copyright_text: form.copyright_text,
      currency_prefix: form.currency_prefix,
      currency_postfix: form.currency_postfix,
      country_code: form.country_code,
      language_display: form.language_display,
      default_language: form.default_language,
      hide_customizer: form.hide_customizer,
        booking_hero_badge_text: form.booking_hero_badge_text,
        booking_hero_title_text: form.booking_hero_title_text,
        booking_hero_description_text: form.booking_hero_description_text,
    }))
  }, [form, queryClient])

  const { mutateAsync: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: (nextForm: Partial<GeneralSettingsData>) => generalSettingsApi.saveSettings(nextForm),
  })

  const updateField = <K extends keyof GeneralSettingsData>(key: K, value: GeneralSettingsData[K]) => {
    setForm((prev) => {
      if (!prev) return prev
      return { ...prev, [key]: value }
    })
  }

  const handleSave = async () => {
    if (!form) return
    try {
      const saved = await saveSettings(form)
      setForm(saved)
      queryClient.setQueryData(["general-settings"], saved)
      queryClient.invalidateQueries({ queryKey: ["system-config"] })
      toast.success("General settings saved successfully.")
    } catch (error) {
      toast.error(`Failed to save general settings: ${getApiErrorMessage(error)}`)
    }
  }

  const isBusy = isLoading || isSaving || !form

  return (
    <div className="min-w-0 max-w-full space-y-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* App Branding Text */}
      <section className="pb-5">
        <h3 className="text-base font-semibold text-foreground/90 mb-4">Branding Text</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="app-subtext">App Subtext</Label>
            <Input
              id="app-subtext"
              placeholder="Your Health, Our Priority"
              value={form?.app_subtext ?? ""}
              onChange={(e) => updateField("app_subtext", e.target.value)}
              disabled={isBusy}
              className="text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="copyright-text">Copyright Text</Label>
            <Input
              id="copyright-text"
              placeholder="© 2026 KiviCare. All rights reserved."
              value={form?.copyright_text ?? ""}
              onChange={(e) => updateField("copyright_text", e.target.value)}
              disabled={isBusy}
              className="text-foreground"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Language Display Settings */}
      <section className="py-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground/90">Language Display Settings</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Display Language Switcher in Header
            </p>
          </div>
          <Switch
            checked={form?.language_display ?? false}
            onCheckedChange={(checked) => updateField("language_display", checked)}
            disabled={isBusy}
          />
        </div>

        {/* Default Language selector — only visible when language switcher is enabled */}
        {form?.language_display && (
          <div className="mt-4 space-y-1.5">
            <Label>Default Language</Label>
            <LanguagePicker />
          </div>
        )}
      </section>

      <Separator />

      {/* Customizer */}
      <section className="py-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground/90">Customizer</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Display theme customizer controls for admin.
            </p>
          </div>
          <Switch
            checked={!(form?.hide_customizer ?? false)}
            onCheckedChange={(checked) => updateField("hide_customizer", !checked)}
            disabled={isBusy}
          />
        </div>
      </section>

      <Separator />

      {/* Currency Setting */}
      <section className="py-5">
        <h3 className="text-base font-semibold text-foreground/90 mb-4">Currency Setting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="currency-prefix">Currency Prefix</Label>
            <Input
              id="currency-prefix"
              placeholder="Enter Currency Prefix"
              value={form?.currency_prefix ?? ""}
              onChange={(e) => updateField("currency_prefix", e.target.value)}
              disabled={isBusy}
              className="text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency-postfix">Currency Postfix</Label>
            <Input
              id="currency-postfix"
              placeholder="Enter Currency Postfix"
              value={form?.currency_postfix ?? ""}
              onChange={(e) => updateField("currency_postfix", e.target.value)}
              disabled={isBusy}
              className="text-foreground"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Country Code Setting */}
      <section className="py-5">
        <h3 className="text-base font-semibold text-foreground/90 mb-4">Country Code Setting</h3>
        <div className="space-y-1.5 max-w-md">
          <Label>Default Country Code For Contact</Label>
          <PhoneInputField
            value={{
              countryCode: (form?.country_code ?? "+1").trim() || "+1",
              mobile: "",
            }}
            onChange={(next) => {
              if (next.countryCode) {
                updateField("country_code", next.countryCode)
              }
            }}
            disabled={isBusy}
            nationalNumberEditable={false}
            enableSearch={false}
          />
        </div>
      </section>

      <Separator />

      {/* Registration Shortcode Setting */}
      <section className="py-5">
        <h3 className="text-base font-semibold text-foreground/90 mb-4">Registration Shortcode Setting</h3>

        <div className="space-y-1.5 mb-4">
          <p className="text-sm font-medium text-foreground/80">Allowed User Role</p>
        </div>

        {/* Doctor Role */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground/80">Doctor Role</span>
              {form?.reg_doctor_role_active ? (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">Inactive</Badge>
              )}
            </div>
            <Switch
              checked={form?.reg_doctor_role_active ?? false}
              onCheckedChange={(checked) => updateField("reg_doctor_role_active", checked)}
              disabled={isBusy}
            />
          </div>
          <div className="flex items-center justify-between pl-4 border-muted">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Default status when doctor register</span>
              {form?.reg_doctor_default_status_active ? (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">Inactive</Badge>
              )}
            </div>
            <Switch
              checked={form?.reg_doctor_default_status_active ?? false}
              onCheckedChange={(checked) => updateField("reg_doctor_default_status_active", checked)}
              disabled={isBusy}
            />
          </div>
        </div>

        <Separator className="my-3" />

        {/* Receptionist Role */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground/80">Receptionist Role</span>
              {form?.reg_receptionist_role_active ? (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">Inactive</Badge>
              )}
            </div>
            <Switch
              checked={form?.reg_receptionist_role_active ?? false}
              onCheckedChange={(checked) => updateField("reg_receptionist_role_active", checked)}
              disabled={isBusy}
            />
          </div>
          <div className="flex items-center justify-between pl-4 border-muted">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Default status when Receptionist register</span>
              {form?.reg_receptionist_default_status_active ? (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">Inactive</Badge>
              )}
            </div>
            <Switch
              checked={form?.reg_receptionist_default_status_active ?? false}
              onCheckedChange={(checked) => updateField("reg_receptionist_default_status_active", checked)}
              disabled={isBusy}
            />
          </div>
        </div>

        <Separator className="my-3" />

        {/* Patient Role */}
        <div className="space-y-3 mb-">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground/80">Patient Role</span>
              {form?.reg_patient_role_active ? (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">Inactive</Badge>
              )}
            </div>
            <Switch
              checked={form?.reg_patient_role_active ?? false}
              onCheckedChange={(checked) => updateField("reg_patient_role_active", checked)}
              disabled={isBusy}
            />
          </div>
          <div className="flex items-center justify-between pl-4 border-muted">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Default status when patient register</span>
              {form?.reg_patient_default_status_active ? (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">Inactive</Badge>
              )}
            </div>
            <Switch
              checked={form?.reg_patient_default_status_active ?? false}
              onCheckedChange={(checked) => updateField("reg_patient_default_status_active", checked)}
              disabled={isBusy}
            />
          </div>
        </div>
      </section>
      <Separator />

      {/* Booking Appointment Layout Configuration */}
      <section className="min-w-0 py-5">
        <h3 className="text-base font-semibold text-foreground/90 mb-1">Booking Appointment Layout</h3>
        <p className="mb-4 min-w-0 max-w-full text-pretty break-words text-sm text-muted-foreground">
          Select the layout style for the booking appointment flow.
        </p>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="booking-hero-badge-text">Booking Hero Badge Text</Label>
            <Input
              id="booking-hero-badge-text"
              placeholder="Smart Booking Experience"
              value={form?.booking_hero_badge_text ?? ""}
              onChange={(e) => updateField("booking_hero_badge_text", e.target.value)}
              disabled={isBusy}
              className="text-foreground"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="booking-hero-title-text">Booking Hero Title Text</Label>
            <Input
              id="booking-hero-title-text"
              placeholder="Schedule Your {Health} Visit."
              value={form?.booking_hero_title_text ?? ""}
              onChange={(e) => updateField("booking_hero_title_text", e.target.value)}
              disabled={isBusy}
              className="text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Wrap highlighted word(s) in braces. Example: <code>{`Schedule Your {Health} Visit.`}</code>
            </p>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="booking-hero-description-text">Booking Hero Description Text</Label>
            <Input
              id="booking-hero-description-text"
              placeholder="Experience the next generation of medical appointments..."
              value={form?.booking_hero_description_text ?? ""}
              onChange={(e) => updateField("booking_hero_description_text", e.target.value)}
              disabled={isBusy}
              className="text-foreground"
            />
          </div>
        </div>
        <RadioGroup
          value={form?.booking_appointment_layout ?? "modern"}
          onValueChange={(value) => updateField("booking_appointment_layout", value)}
          disabled={isBusy}
          className="flex flex-row flex-wrap justify-center gap-6 pt-4 sm:justify-start sm:gap-8"
        >
          {[
            { id: "modern", label: "Modern", image: "/images/layouts/modern.png" },
            { id: "classic", label: "Classic", image: "/images/layouts/classic.png" },
            { id: "default", label: "Basic", image: "/images/layouts/default.png" },
            { id: "calendly", label: "Calendly", image: "/images/layouts/calendly-preview.png" },
          ].map((option) => (
            <div
              key={option.id}
              className="flex w-full min-w-0 max-w-[340px] flex-col items-center space-y-4 sm:w-auto"
            >
              <Label htmlFor={`layout-${option.id}`} className="w-full max-w-[340px] cursor-pointer group">
                <div
                  className={`relative flex h-48 w-full max-w-[340px] flex-col items-center overflow-hidden rounded-2xl border-4 bg-background transition-all
                    ${form?.booking_appointment_layout === option.id
                      ? 'border-primary shadow-xl scale-[1.02]'
                      : 'border-muted group-hover:border-primary/30 group-hover:scale-[1.01]'
                    }`}
                >
                  <img
                    src={option.image}
                    alt={`${option.label} Layout`}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className={`absolute inset-0 bg-primary/5 transition-opacity ${form?.booking_appointment_layout === option.id ? 'opacity-0' : 'opacity-20 group-hover:opacity-0'}`} />
                </div>
              </Label>
              <div className="flex flex-col items-center space-y-2">
                <RadioGroupItem value={option.id} id={`layout-${option.id}`} />
                <Label htmlFor={`layout-${option.id}`} className="font-medium cursor-pointer text-sm">
                  {option.label}
                </Label>
              </div>
            </div>
          ))}
        </RadioGroup>
      </section>

      <Separator />

      <div className="pt-5 flex justify-end">
        <Button onClick={handleSave} disabled={isBusy} className="min-w-[120px] cursor-pointer">
          {isLoading ? "Loading..." : isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}

export default function GeneralSettingsPage() {
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const { role, isRoleReady } = useAuthRole()

  const allAccordionItems = useMemo(
    () => [
      {
        value: "general-setting",
        title: "General Settings",
        content: <GeneralSettingsContent />,
      },
      {
        value: "configurations-setting",
        title: "Configuration Settings",
        content: <ConfigurationsContent />,
      },
      {
        value: "listing",
        title: "Listing Settings",
        content: <ListingsContent />,
      },
    ],
    []
  )

  const accordionItems = useMemo(() => {
    if (!isRoleReady || !role) return allAccordionItems
    const allowed = getSettingsSubKeysForRole(role)
    return allAccordionItems.filter((item) => allowed.has(item.value))
  }, [isRoleReady, role, allAccordionItems])

  const [activeTab, setActiveTab] = useState("general-setting")

  const isValidRequestedTab = useMemo(
    () => Boolean(requestedTab && accordionItems.some((item) => item.value === requestedTab)),
    [requestedTab, accordionItems]
  )

  useEffect(() => {
    if (isValidRequestedTab && requestedTab) {
      setActiveTab(requestedTab)
    }
  }, [requestedTab, accordionItems, isValidRequestedTab])

  useEffect(() => {
    if (!accordionItems.length) return
    // Radix `collapsible` uses "" when all sections are closed; do not force the first item open.
    if (activeTab === "") return
    const inList = activeTab && accordionItems.some((i) => i.value === activeTab)
    if (!inList) {
      setActiveTab(accordionItems[0].value)
    }
  }, [accordionItems, activeTab])

  return (
    <div className="min-w-0 max-w-full space-y-0">
      <div className="sticky top-0 z-40 mb-3 border-b bg-card pb-3">
        <h2 className="text-xl font-semibold">General Settings</h2>
      </div>
      {accordionItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No General Settings found matching your search criteria.</p>
        </div>
      ) : (
        <Accordion
          type='single'
          collapsible
          className='min-w-0 w-full max-w-full space-y-4'
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
        >
          {accordionItems.map((item) => (
            <AccordionItem
              key={item.value}
              value={item.value}
              className='rounded-md !border'
            >
              <AccordionTrigger className='cursor-pointer px-4 hover:no-underline'>
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
      )}
    </div>
  )
}
