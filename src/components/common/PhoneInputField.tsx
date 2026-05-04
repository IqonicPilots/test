"use client"

import { useEffect, useMemo, useRef } from "react"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"

import { useSystemConfig } from "@/hooks/api/use-system-config"
import { cn } from "@/lib/utils"
import { getCountryByDialCode } from "@/utils/country-codes"

function dialCodeDigitsToPhoneInputCountry(dialDigits: string): string {
  const d = dialDigits.replace(/\D/g, "")
  if (!d) return "us"
  const matches = getCountryByDialCode(d)
  if (matches.length === 0) return "us"
  const sorted = [...matches].sort(
    (a, b) => (a.priority ?? 999) - (b.priority ?? 999)
  )
  return sorted[0].code.toLowerCase()
}

/** Normalize stored dial code to "+{digits}" for display and forms. */
export function normalizeDialCountryCode(raw: string | undefined | null): string {
  const digits = String(raw ?? "").replace(/\D/g, "")
  if (!digits) return ""
  return `+${digits}`
}

export type PhoneInputValue = {
  countryCode: string
  mobile: string
}

type PhoneInputFieldProps = {
  value: PhoneInputValue
  onChange: (value: PhoneInputValue) => void
  disabled?: boolean
  className?: string
  /** When false, only the country dropdown can be used (default country / prefix picker). */
  nationalNumberEditable?: boolean
  enableSearch?: boolean
  /** Overrides General Settings / system-config default when the form has no country code yet. */
  defaultCountryCode?: string
}

export function PhoneInputField({
  value,
  onChange,
  disabled = false,
  className,
  nationalNumberEditable = true,
  enableSearch = false,
  defaultCountryCode: defaultCountryCodeProp,
}: PhoneInputFieldProps) {
  const { data: systemConfig } = useSystemConfig()
  const configuredDefault = useMemo(
    () =>
      normalizeDialCountryCode(
        defaultCountryCodeProp ?? systemConfig?.country_code
      ),
    [defaultCountryCodeProp, systemConfig?.country_code]
  )
  const fallbackDial = configuredDefault || "+1"


  const countryCode = value.countryCode?.trim() || fallbackDial
  const dialCode = countryCode.replace(/\D/g, "")
  const mobile = value.mobile?.replace(/\D/g, "") || ""
  const phoneValue = `${dialCode}${mobile}`

  const defaultCountry = dialCodeDigitsToPhoneInputCountry(dialCode)

  return (
    <PhoneInput
      country={defaultCountry}
      value={phoneValue}
      onChange={(nextValue, data: any) => {
        const nextDialCode = String(data.dialCode ?? "").replace(/\D/g, "")
        const nextMobile = nextValue.slice(nextDialCode.length).replace(/\D/g, "")
        onChange({
          countryCode: nextDialCode ? `+${nextDialCode}` : "",
          mobile: nextMobile,
        })
      }}
      countryCodeEditable={false}
      enableSearch={enableSearch}
      inputProps={
        nationalNumberEditable
          ? undefined
          : { readOnly: true, "aria-label": "Phone country selector" }
      }
      inputClass={cn(
        "placeholder:!text-foreground dark:!bg-input/30 !border-input flex h-9 !w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        className
      )}
      containerClass="!w-full !relative !z-10"
      buttonClass={cn("!h-9 !rounded-l-sm !border-l-1 !border-t-1 !border-b-1 !border-r-0 !border-input dark:!border-muted/20 !bg-white dark:!bg-input/30",
        className
      )}
      dropdownClass="!bg-popover !text-popover-foreground !border !border-border !shadow-md"
      disabled={disabled}
    />
  )
}
